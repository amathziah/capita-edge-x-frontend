import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Mic, MicOff, Zap, RotateCcw, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '@/shared/services/aiService';
import { usePersona } from '@/app/providers/PersonaContext';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { AIWorkspaceRenderer } from '@/features/ai/components/AIWorkspaceRenderer';
import { AIDomainChoiceCard } from '@/features/ai/components/AIDomainChoiceCard';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  status?: 'streaming' | 'sent' | 'error';
  uiComponent?: string;
  uiData?: any;
  domain?: string;
  data?: any;
}

const TEAL = '#2dd4bf';

const WELCOME_MSG: Message = {
  id: 'welcome',
  sender: 'bot',
  text: "Hi! I'm Capita. Ask me anything about your business finances, or pick a workspace to get started.",
  timestamp: new Date(),
  status: 'sent',
  data: {
    type: 'guided_choice',
    choices: [
      { id: 'invoices',    domain: 'invoices',    label: 'Invoices',    description: 'Overdue invoices, collections & receivables', recommended: true },
      { id: 'payments',   domain: 'payments',    label: 'Payments',    description: 'Recent receipts & cash collected' },
      { id: 'expenses',   domain: 'expenses',    label: 'Expenses',    description: 'Spend analysis & burn rate' },
      { id: 'compliance', domain: 'compliance',  label: 'Compliance',  description: 'GST, TDS & tax deadlines' },
    ],
  },
};

// ─── Markdown renderers ───────────────────────────────────────────────────────
const botMd: Components = {
  p:  ({ children }) => <p className="mb-2.5 last:mb-0 leading-[1.75] text-[13px] text-gray-300">{children}</p>,
  ul: ({ children }) => <ul className="my-2.5 space-y-1.5 pl-0 list-none">{children}</ul>,
  ol: ({ children }) => <ol className="my-2.5 space-y-1.5 pl-5 list-decimal text-gray-300 text-[13px]">{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-[13px] text-gray-300 leading-[1.65]">
      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
      <span className="flex-1 min-w-0">{children}</span>
    </li>
  ),
  h2: ({ children }) => <h2 className="text-[13px] font-bold text-teal-400 mt-4 mb-2 uppercase tracking-widest">{children}</h2>,
  h3: ({ children }) => <h3 className="text-[13px] font-semibold text-white/90 mt-3 mb-1">{children}</h3>,
  strong: ({ children }) => <strong className="text-teal-300 font-semibold">{children}</strong>,
  em:     ({ children }) => <em className="text-gray-400 italic">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} className="text-teal-400 underline underline-offset-2 hover:text-teal-300 transition-colors" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  code: ({ className, children }) =>
    /language-/.test(className || '') ? (
      <pre className="bg-[#0d1117] rounded-xl p-4 overflow-x-auto my-3 border border-white/[0.06]">
        <code className="font-mono text-[11px] text-emerald-400/90 leading-relaxed">{children}</code>
      </pre>
    ) : (
      <code className="bg-white/[0.08] px-1.5 py-0.5 rounded-md font-mono text-[11px] text-teal-300 border border-white/[0.06]">
        {children}
      </code>
    ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-black/30">
      <table className="w-full text-left text-[12px] border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/[0.04] text-[10px] font-bold uppercase tracking-widest text-teal-400/80 border-b border-white/10">{children}</thead>,
  th:    ({ children }) => <th className="px-4 py-3 whitespace-nowrap">{children}</th>,
  tbody: ({ children }) => <tbody className="divide-y divide-white/[0.04]">{children}</tbody>,
  td:    ({ children }) => <td className="px-4 py-2.5 text-gray-300">{children}</td>,
  tr:    ({ children }) => <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>,
};

const userMd: Components = {
  p: ({ children }) => <p className="mb-0.5 leading-relaxed text-[13px]">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
};

// ─── Robot icon ───────────────────────────────────────────────────────────────
function RobotSVG({ size = 18, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none"
      style={animate ? { animation: 'robot-float 3s ease-in-out infinite' } : {}}>
      <line x1="28" y1="2" x2="28" y2="10" stroke={TEAL} strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="2" r="2.5" fill={TEAL} />
      <rect x="10" y="10" width="36" height="28" rx="8" fill="rgba(255,255,255,0.06)" stroke={TEAL} strokeWidth="1.5" />
      <circle cx="21" cy="24" r="5" fill="rgba(0,0,0,0.4)" stroke={TEAL} strokeWidth="1" />
      <circle cx="35" cy="24" r="5" fill="rgba(0,0,0,0.4)" stroke={TEAL} strokeWidth="1" />
      <circle cx="21" cy="24" r="2.5" fill="#fff" style={animate ? { animation: 'eye-glow 2s ease-in-out infinite' } : {}} />
      <circle cx="35" cy="24" r="2.5" fill="#fff" style={animate ? { animation: 'eye-glow 2s ease-in-out infinite 0.3s' } : {}} />
      <rect x="20" y="33" width="16" height="3" rx="1.5" fill={TEAL} opacity="0.7" />
      <rect x="24" y="38" width="8" height="4" rx="2" fill={TEAL} opacity="0.5" />
      <rect x="8" y="42" width="40" height="12" rx="6" fill="rgba(255,255,255,0.05)" stroke={TEAL} strokeWidth="1.5" />
      <circle cx="20" cy="48" r="2" fill={TEAL} opacity="0.6" />
      <circle cx="28" cy="48" r="2" fill={TEAL} opacity="0.8" />
      <circle cx="36" cy="48" r="2" fill={TEAL} opacity="0.6" />
    </svg>
  );
}

// ─── Streaming cursor ─────────────────────────────────────────────────────────
function StreamingCursor() {
  return <span className="ai-streaming-cursor" />;
}

// ─── Thinking skeleton ────────────────────────────────────────────────────────
function ThinkingSkeleton() {
  return (
    <div className="flex items-end gap-2.5">
      <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
        style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}>
        <RobotSVG animate />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-8 w-48 rounded-2xl animate-pulse"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
        <div className="flex items-center gap-1.5 px-1">
          <div className="w-1 h-1 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest animate-pulse">
            Thinking…
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────
function ChatBubble({
  msg,
  onSelectDomain,
  onSelectView,
  onAction,
  disableChoices,
}: {
  msg: Message;
  onSelectDomain: (choice: any) => void;
  onSelectView: (msg: Message, viewId: string) => void;
  onAction: (action: any) => void;
  disableChoices: boolean;
}) {
  const isBot = msg.sender === 'bot';
  const isStreaming = isBot && msg.status === 'streaming';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const waitingForFirstToken = isStreaming && !msg.uiComponent && msg.text.trim().length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`flex items-end gap-2.5 w-full ${isBot ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      {isBot ? (
        <div className="relative w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}>
          <RobotSVG animate={isStreaming} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-400 border border-[#0c0f1a]">
            <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-60" />
          </span>
        </div>
      ) : (
        <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-[10px] text-gray-400 font-black font-mono">ME</span>
        </div>
      )}

      <div className={`flex max-w-[90%] sm:max-w-[82%] flex-col gap-1 ${isBot ? 'items-start' : 'items-end'}`}>
        <motion.div
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={isBot
            ? { background: 'linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.07)' }
            : { background: 'linear-gradient(135deg,rgba(45,212,191,0.18),rgba(6,182,212,0.12))', border: '1px solid rgba(45,212,191,0.22)' }
          }
        >
          {isBot && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg,rgba(45,212,191,0.4),rgba(45,212,191,0.15) 50%,transparent)' }} />
          )}

          {isBot && (
            <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
              <span className="text-[9px] font-black tracking-[0.15em] uppercase text-teal-500/60">Capita</span>
              <span className="text-[9px] text-white/10">·</span>
              <span className="text-[9px] text-white/25 font-medium">Finance AI</span>
            </div>
          )}

          <div className={`px-4 ${isBot ? 'pt-0.5 pb-3.5' : 'py-2.5'}`}>
            {/* Text */}
            <div className={isBot ? 'text-gray-300' : 'text-gray-100'}>
              {waitingForFirstToken ? (
                <span className="text-[13px] text-gray-600 tracking-widest animate-pulse">…</span>
              ) : msg.text.length > 0 ? (
                <>
                  <ReactMarkdown components={isBot ? botMd : userMd}>
                    {msg.text}
                  </ReactMarkdown>
                  {isStreaming && <StreamingCursor />}
                </>
              ) : isStreaming ? <StreamingCursor /> : null}
            </div>

            {/* Workspace card */}
            {msg.uiComponent && msg.uiData && (
              <div className="mt-4">
                <AIWorkspaceRenderer
                  component={msg.uiComponent}
                  data={msg.uiData}
                  isLoadingView={isStreaming}
                  onAction={onAction}
                  onSelectView={
                    msg.data?.type === 'workspace_view'
                      ? (viewId) => onSelectView(msg, viewId)
                      : undefined
                  }
                />
              </div>
            )}

            {/* Domain choice buttons */}
            {isBot && msg.data?.type === 'guided_choice' && (
              <AIDomainChoiceCard
                data={msg.data}
                disabled={disableChoices}
                onSelect={onSelectDomain}
                onAction={onAction}
              />
            )}
          </div>
        </motion.div>

        {/* Timestamp + copy */}
        <div className={`flex items-center gap-2 px-1 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
          <span className="text-[9px] text-gray-600 font-mono">
            {msg.timestamp instanceof Date
              ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '--:--'}
          </span>
          {isBot && msg.status !== 'streaming' && (
            <button onClick={handleCopy} className="text-[9px] text-gray-600 hover:text-teal-400 transition-colors font-medium">
              {copied ? '✓ copied' : 'copy'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function AIAssistantPage() {
  const { businessType } = usePersona();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([{ ...WELCOME_MSG, timestamp: new Date() }]);
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const isBusy = isThinking || messages.some(m => m.status === 'streaming');

  const scrollRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const streamIdRef = useRef<string | null>(null);
  const reqIdRef    = useRef(0);

  // ── Scroll helpers ────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  const nearBottom = () => {
    if (!scrollRef.current) return true;
    const el = scrollRef.current;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useEffect(() => {
    if (messages.length > 0 && nearBottom()) scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Cancel active stream ──────────────────────────────────────────────────
  const cancelStream = useCallback(() => {
    reqIdRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    if (streamIdRef.current) {
      setMessages(prev => prev.filter(m => m.id !== streamIdRef.current));
      streamIdRef.current = null;
    }
    setIsThinking(false);
  }, []);

  // ── Clear chat ────────────────────────────────────────────────────────────
  const clearChat = useCallback(() => {
    cancelStream();
    setMessages([{ ...WELCOME_MSG, timestamp: new Date() }]);
  }, [cancelStream]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? query).trim();
    if (!text) return;

    cancelStream();
    const reqId = reqIdRef.current;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
      status: 'sent',
    };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsThinking(true);
    setTimeout(() => scrollToBottom(), 50);

    const history = messages
      .filter(m => m.status !== 'streaming' && m.status !== 'error' && m.text.trim())
      .slice(-10)
      .map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text.trim() }] }));
    while (history.length > 0 && history[0].role === 'model') history.shift();

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const stream = aiService.chatStream(
        { query: text, businessType: businessType || undefined, persona: businessType || undefined, history },
        abort.signal
      );

      let accumulated = '';
      let botId: string | null = null;
      let firstToken = true;

      for await (const event of stream) {
        if (abort.signal.aborted || reqIdRef.current !== reqId) break;

        if (event.type === 'token') {
          accumulated += event.text;

          if (firstToken) {
            firstToken = false;
            setIsThinking(false);
            botId = `bot_${Date.now()}`;
            streamIdRef.current = botId;
            setMessages(prev => [...prev, {
              id: botId!,
              sender: 'bot',
              text: accumulated,
              timestamp: new Date(),
              status: 'streaming',
            }]);
            setTimeout(() => scrollToBottom(), 50);
          } else {
            setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: accumulated } : m));
          }

        } else if (event.type === 'gen_ui') {
          if (!botId) {
            botId = `bot_${Date.now()}`;
            streamIdRef.current = botId;
            setMessages(prev => [...prev, {
              id: botId!,
              sender: 'bot',
              text: accumulated,
              timestamp: new Date(),
              status: 'streaming',
              uiComponent: event.component,
              uiData: event.data,
            }]);
          } else {
            setMessages(prev => prev.map(m =>
              m.id === botId ? { ...m, uiComponent: event.component, uiData: event.data } : m
            ));
          }

        } else if (event.type === 'complete') {
          setIsThinking(false);
          const finalText = typeof event.text === 'string' && event.text.trim() ? event.text : accumulated;

          // Workspace data embedded in completion event
          const ws = event.workspace || event.data?.workspace;

          if (!botId) {
            botId = `bot_${Date.now()}`;
            streamIdRef.current = botId;
            setMessages(prev => [...prev, {
              id: botId!,
              sender: 'bot',
              text: finalText,
              timestamp: new Date(),
              status: 'sent',
              uiComponent: ws?.component,
              uiData: ws?.data,
              domain: ws?.domain || event.data?.domain,
              data: event.data,
            }]);
          } else {
            setMessages(prev => prev.map(m => m.id === botId ? {
              ...m,
              text: finalText,
              status: 'sent',
              uiComponent: ws?.component || m.uiComponent,
              uiData: ws?.data ?? m.uiData,
              domain: ws?.domain || event.data?.domain || m.domain,
              data: event.data,
            } : m));
          }

        } else if (event.type === 'error') {
          setIsThinking(false);
          const errText = `⚠️ ${event.message || 'An error occurred. Please try again.'}`;
          if (!botId) {
            botId = `bot_${Date.now()}`;
            streamIdRef.current = botId;
            setMessages(prev => [...prev, { id: botId!, sender: 'bot', text: errText, timestamp: new Date(), status: 'error' }]);
          } else {
            setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: errText, status: 'error' } : m));
          }
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || reqIdRef.current !== reqId) return;
      setIsThinking(false);
      setMessages(prev => [...prev, {
        id: `bot_err_${Date.now()}`,
        sender: 'bot',
        text: '⚠️ Something went wrong. Please try again.',
        timestamp: new Date(),
        status: 'error',
      }]);
    } finally {
      if (reqIdRef.current === reqId) {
        if (abortRef.current === abort) abortRef.current = null;
        streamIdRef.current = null;
        setIsThinking(false);
      }
    }
  };

  // ── Open workspace from domain choice ─────────────────────────────────────
  const openWorkspace = useCallback(async (choice: any) => {
    const domain = String(choice?.domain || '').toLowerCase();
    if (!domain || isBusy) return;

    cancelStream();
    const botId = `bot_ws_${Date.now()}`;

    setMessages(prev => [
      ...prev,
      { id: `user_ws_${Date.now()}`, sender: 'user', text: `Open ${choice.label}`, timestamp: new Date(), status: 'sent' },
      { id: botId, sender: 'bot', text: `Loading ${choice.label} workspace…`, timestamp: new Date(), status: 'streaming', domain },
    ]);
    setTimeout(() => scrollToBottom(), 50);

    try {
      const ws = await aiService.getWorkspace(domain) as any;
      setMessages(prev => prev.map(m => m.id === botId ? {
        ...m,
        text: `Showing the ${ws?.label || choice.label} with live data.`,
        status: 'sent',
        uiComponent: ws?.component,
        uiData: ws?.data,
        data: { type: 'workspace_view' },
      } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === botId ? {
        ...m,
        text: '⚠️ Could not load workspace. Please try again.',
        status: 'error',
      } : m));
    }
  }, [cancelStream, isBusy, scrollToBottom]);

  // ── Switch workspace view (tab change) ────────────────────────────────────
  const switchView = useCallback(async (msg: Message, viewId: string) => {
    const domain = String(msg.domain || '').toLowerCase();
    if (!domain || !viewId) return;

    setMessages(prev => prev.map(m =>
      m.id === msg.id ? { ...m, text: `Loading ${viewId.replace(/_/g, ' ')}…`, status: 'streaming' } : m
    ));

    try {
      const ws = await aiService.getWorkspace(domain, viewId) as any;
      setMessages(prev => prev.map(m => m.id === msg.id ? {
        ...m,
        text: `Showing ${viewId.replace(/_/g, ' ')} with live data.`,
        status: 'sent',
        uiComponent: ws?.component,
        uiData: ws?.data,
      } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === msg.id ? {
        ...m,
        text: '⚠️ Could not switch view. Please try again.',
        status: 'error',
      } : m));
    }
  }, []);

  // ── Handle action buttons in workspace cards ──────────────────────────────
  const handleAction = useCallback((action: any) => {
    if (!action) return;
    if (action.type === 'navigate' && action.to) {
      navigate(action.to);
    } else if (action.type === 'open_invoice_modal') {
      window.dispatchEvent(new CustomEvent('open-invoice-modal', { detail: action.data || {} }));
    } else if (action.type === 'open_customer_modal') {
      window.dispatchEvent(new CustomEvent('open-customer-modal', { detail: action.data || {} }));
    }
  }, [navigate]);

  // ── Voice input ───────────────────────────────────────────────────────────
  const startListening = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported in this browser.'); return; }
    const r = new SR();
    r.lang = 'en-IN';
    r.interimResults = false;
    r.onstart = () => setIsListening(true);
    r.onend   = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setQuery(t);
      handleSend(t);
    };
    r.start();
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes capita-cursor-blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes robot-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
        @keyframes eye-glow { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .ai-streaming-cursor {
          display: inline-block; width: 2px; height: 14px; background: #2dd4bf;
          margin-left: 2px; vertical-align: text-bottom; border-radius: 1px;
          animation: capita-cursor-blink 0.9s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-[#0c0f1a] font-sans text-gray-300">

        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-1/3 right-0 w-[500px] h-[500px] rounded-full opacity-[0.15]"
            style={{ background: `radial-gradient(circle,${TEAL} 0%,transparent 65%)`, filter: 'blur(50px)' }} />
          <div className="absolute -bottom-1/3 -left-1/4 w-[400px] h-[400px] rounded-full opacity-[0.10]"
            style={{ background: `radial-gradient(circle,${TEAL} 0%,transparent 65%)`, filter: 'blur(50px)' }} />
        </div>

        {/* ── TOP BAR ── */}
        <div className="relative z-30 shrink-0 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#090c13]/80 px-4 py-2.5 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-500/10 border border-teal-500/20">
              <RobotSVG />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-white">Capita AI</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1 h-1 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-colors text-teal-400 border-teal-500/20 bg-teal-500/10 hover:bg-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw size={9} /> Clear
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-gray-500 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── CHAT AREA ── */}
        <div className="relative z-10 flex flex-col flex-1 min-h-0">
          <div
            ref={scrollRef}
            onScroll={() => {
              if (!scrollRef.current) return;
              const el = scrollRef.current;
              setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
            }}
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
          >
            <div className="mx-auto max-w-3xl px-3 pb-8 pt-4 space-y-5 sm:px-6">
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <ChatBubble
                    key={msg.id}
                    msg={msg}
                    onSelectDomain={openWorkspace}
                    onSelectView={switchView}
                    onAction={handleAction}
                    disableChoices={isBusy}
                  />
                ))}
              </AnimatePresence>

              {isThinking && <ThinkingSkeleton />}

              {isListening && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex justify-center">
                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                    <Mic size={12} className="animate-pulse" />
                    <span className="text-[9px] font-black tracking-widest uppercase">Listening…</span>
                    <div className="flex gap-1 items-end h-3">
                      {[3, 5, 4, 7, 3].map((h, i) => (
                        <div key={i} className="w-0.5 rounded-full bg-red-400 animate-pulse"
                          style={{ height: h * 2, animationDuration: `${0.4 + i * 0.1}s` }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Scroll-to-bottom FAB */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                onClick={scrollToBottom}
                className="absolute bottom-24 right-4 z-50 w-8 h-8 rounded-full bg-[#161a2b] border border-white/[0.1] flex items-center justify-center shadow-xl hover:bg-white/[0.08] transition-colors">
                <ChevronDown size={15} className="text-gray-400" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* ── INPUT BAR ── */}
          <div className="shrink-0 border-t border-white/[0.06] bg-[#090c13]/80 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-sm sm:px-6 sm:py-3">
            <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 transition-all ${
              inputFocused
                ? 'border-teal-400/60 ring-2 ring-teal-500/15 bg-[#141820]'
                : 'border-white/[0.07] hover:border-white/[0.12] bg-white/[0.02]'
            }`}>
              <div className="shrink-0 flex items-center gap-1.5 pr-2.5 border-r border-white/[0.07]">
                <Zap size={13} className="text-teal-400" />
                <span className="hidden sm:inline text-[9px] font-black uppercase text-teal-400 tracking-widest">Capita</span>
              </div>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Ask about invoices, payments, expenses, or tax deadlines…"
                className="flex-1 bg-transparent border-none px-1 py-1 text-[16px] sm:text-sm text-white outline-none placeholder-gray-600"
              />

              <div className="flex items-center gap-1 shrink-0">
                <motion.button
                  whileHover={!isBusy ? { scale: 1.08 } : {}}
                  whileTap={!isBusy ? { scale: 0.92 } : {}}
                  onClick={startListening}
                  disabled={isBusy}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    isListening
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : isBusy
                        ? 'opacity-30 cursor-not-allowed text-gray-600'
                        : 'text-gray-500 hover:bg-white/[0.06] hover:text-gray-300'
                  }`}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: query.trim() && !isBusy ? 1.08 : 1 }}
                  whileTap={{ scale: query.trim() && !isBusy ? 0.92 : 1 }}
                  onClick={() => handleSend()}
                  disabled={!query.trim() || isBusy}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={query.trim() && !isBusy
                    ? { background: `linear-gradient(135deg,${TEAL},#06b6d4)`, color: '#0a0d15' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#374151', cursor: 'not-allowed' }
                  }
                >
                  <Send size={13} />
                </motion.button>
              </div>
            </div>

            <p className="mt-1.5 px-1 text-[8px] text-gray-600 font-bold uppercase tracking-widest">
              Finance engine · Encrypted · Built for India
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
