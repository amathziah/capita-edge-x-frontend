import { api, API_URL, getOrgId } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { supabase } from '@/shared/lib/supabaseClient';

export const aiService = {
  // Simple one-shot chat (non-streaming fallback)
  chat: (query: string, persona?: string) =>
    api.post(ENDPOINTS.AI_CHAT, { query, persona }),

  // Fetch live workspace data for a domain (invoices / payments / expenses / compliance)
  getWorkspace: (domain: string, view?: string) =>
    api.get(
      view
        ? `${ENDPOINTS.AI_WORKSPACE(domain)}?view=${encodeURIComponent(view)}`
        : ENDPOINTS.AI_WORKSPACE(domain)
    ),

  /**
   * Stream an AI response token-by-token via Server-Sent Events.
   *
   * Yields:
   *   { type: 'token',    text: string }
   *   { type: 'gen_ui',   component: string, data: any }
   *   { type: 'complete', text, data, workspace, usage }
   *   { type: 'error',    message: string }
   *
   * Pass an AbortSignal to cancel mid-stream (e.g. user sends a new message).
   */
  async *chatStream(
    payload: {
      query: string;
      businessType?: string;
      history?: { role: string; parts: { text: string }[] }[];
      conversationId?: string | null;
      persona?: string;
    },
    signal?: AbortSignal
  ): AsyncGenerator<{ type: string; [key: string]: any }> {
    await api.wait();

    let token: string | null = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token ?? null;
    } catch { /* ignore */ }

    const organizationId = getOrgId();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(organizationId ? { 'X-Organization-ID': organizationId } : {}),
    };

    const response = await fetch(`${API_URL}${ENDPOINTS.AI_CHAT_STREAM}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => 'Unknown error');
      yield { type: 'error', message: text };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Wrap reader.read() with a per-chunk timeout so a background-throttled tab
    // doesn't leave the stream hanging silently forever. If no bytes arrive within
    // CHUNK_TIMEOUT_MS we abort and yield a timeout event so the caller can recover.
    const CHUNK_TIMEOUT_MS = 30_000;

    const readWithTimeout = (): Promise<ReadableStreamReadResult<Uint8Array>> =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new DOMException('Stream chunk timeout', 'TimeoutError')),
          CHUNK_TIMEOUT_MS,
        );
        reader.read().then(
          (result) => { clearTimeout(timer); resolve(result); },
          (err)    => { clearTimeout(timer); reject(err); },
        );
      });

    try {
      while (true) {
        let value: Uint8Array | undefined;
        let done: boolean;

        try {
          ({ value, done } = await readWithTimeout());
        } catch (err: any) {
          if (err?.name === 'TimeoutError') {
            yield { type: 'error', message: 'stream_timeout' };
          }
          break;
        }

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith(': ')) {
            // SSE comment — backend heartbeat; let the caller reset its watchdog
            yield { type: 'heartbeat' };
          } else if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try { yield JSON.parse(jsonStr); } catch { /* malformed chunk */ }
          }
        }
      }
    } finally {
      reader.cancel().catch(() => {});
    }
  },

  // Used by dataService for AI-powered form filling
  magicFill: (text: string) => api.post(ENDPOINTS.AI_MAGIC_FILL, { text }),

  // Used by dataService for financial insights
  getInsights: (persona?: string) =>
    api.get(persona ? `${ENDPOINTS.AI_INSIGHTS}?persona=${persona}` : ENDPOINTS.AI_INSIGHTS),

  // Used by dataService / VoiceAssistant for command processing
  sendCommand: (command: string) => api.post(ENDPOINTS.AI_COMMAND, { command }),

  // Used by dataService for invoice settlement offers
  generateSettlementOffer: (invoiceId: string) =>
    api.post(ENDPOINTS.AI_SETTLEMENT, { invoiceId }),

  // Used by dataService for PDF-to-base64 conversion before AI audit
  blobToBase64: (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }),
};
