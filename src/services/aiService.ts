import { api, API_URL, getOrgId } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { supabase } from '../supabaseClient';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const aiService = {
  stagger: () => delay(500),
  chat: (query: string, persona?: string) => api.post(ENDPOINTS.AI_CHAT, { query, persona }),
  getConfig: (persona?: string) => api.get(persona ? `${ENDPOINTS.AI_CONFIG}?persona=${persona}` : ENDPOINTS.AI_CONFIG),

  processQuery: (query: string, agentId?: string, persona?: string, history?: any[]) => 
    api.post<any>(ENDPOINTS.AI_CHAT, { query, agentId, persona, history }),

  /**
   * Streams the AI response token by token using Server-Sent Events (SSE).
   * Returns an async generator that yields event objects:
   *   { type: 'token', text: string }
   *   { type: 'complete', text, action, usage, provider, conversationId, budget }
   *   { type: 'error', message: string }
   *
   * Accepts an AbortSignal for interruption (e.g., when the user sends a new message).
   */
  async *chatStream(
    payload: {
      query: string;
      businessType?: string;
      history?: any[];
      conversationId?: string | null;
      persona?: string;
    },
    signal?: AbortSignal
  ): AsyncGenerator<{ type: string; [key: string]: any }> {
    await api.wait(); // Wait for hydration
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

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // Keep last incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              yield JSON.parse(jsonStr);
            } catch {
              // Malformed chunk — skip
            }
          }
        }
      }
    } finally {
      reader.cancel().catch(() => {});
    }
  },

  magicFill: (text: string) => api.post(ENDPOINTS.AI_MAGIC_FILL, { text }),

  getInsights: (persona?: string) => api.get(persona ? `${ENDPOINTS.AI_INSIGHTS}?persona=${persona}` : ENDPOINTS.AI_INSIGHTS),
  getUsage: () => api.get(ENDPOINTS.AI_USAGE),
  getBudget: () => api.get(ENDPOINTS.AI_BUDGET),
  getHistory: () => api.get(ENDPOINTS.AI_HISTORY),
  deleteHistory: () => api.delete(ENDPOINTS.AI_HISTORY),
  getConversations: () => api.get(ENDPOINTS.AI_CONVERSATIONS),
  getConversationMessages: (id: string) => api.get(ENDPOINTS.AI_CONVERSATION_MESSAGES(id)),

  predictRevenue: (historicalData: any[]) => api.post(ENDPOINTS.AI_PREDICT_REVENUE, { historicalData }),

  sendCommand: (command: string) => api.post(ENDPOINTS.AI_COMMAND, { command }),

  generateSettlementOffer: (id: string) => api.post(ENDPOINTS.AI_SETTLEMENT, { id }),

  // Helper for converting blob to base64 if needed for other AI tasks
  blobToBase64: (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
};

