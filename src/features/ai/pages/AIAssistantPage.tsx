import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, RotateCcw, ChevronDown, X,
  FileText, CreditCard, Receipt, ShieldCheck, LayoutDashboard,
  ArrowUp, Sparkles, Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '@/shared/services/aiService';
import { usePersona } from '@/app/providers/PersonaContext';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { AIWorkspaceRenderer } from '@/features/ai/components/AIWorkspaceRenderer';
import { AIDomainChoiceCard } from '@/features/ai/components/AIDomainChoiceCard';

// ─── Design tokens (Stripe-style fintech) ─────────────────────────────────────
// Soft warm neutrals + a single indigo accent used sparingly.
const COLORS = {
  bg: '#fafbfc',           // page background — warm off-white
  surface: '#ffffff',      // cards
  border: '#e5e7eb',       // hairlines
  borderStrong: '#d1d5db', // hover/active
  text: '#1a1f36',         // headings (Stripe ink)
  textBody: '#4f566b',     // body
  textMuted: '#697386',    // secondary
  textFaint: '#a3acb9',    // tertiary
  accent: '#635bff',       // Stripe indigo — primary action only
  accentHover: '#5249f0',
  accentSoft: '#f0eeff',   // tint background
  danger: '#cf1322',
};

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

const SUGGESTED_PROMPTS = [
  { label: 'What\'s overdue?', query: 'Which invoices are overdue and who owes me money?' },
  { label: 'Payments this month', query: 'How much have I collected this month?' },
  { label: 'Top expenses', query: 'What are my top expense categories?' },
  { label: 'Upcoming deadlines', query: 'What compliance deadlines are coming up?' },
];

// ─── Markdown renderers (Stripe palette) ──────────────────────────────────────
const botMd: Components = {
  p:  ({ children }) => <p className="mb-3 last:mb-0 leading-[1.65] text-[14px]" style={{ color: COLORS.textBody }}>{children}</p>,
  ul: ({ children }) => <ul className="my-3 space-y-2 pl-0 list-none">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 space-y-2 pl-5 list-decimal text-[14px]" style={{ color: COLORS.textBody }}>{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-2.5 text-[14px] leading-[1.6]" style={{ color: COLORS.textBody }}>
      <span className="mt-[8px] w-1 h-1 rounded-full shrink-0" style={{ background: COLORS.textFaint }} />
      <span className="flex-1 min-w-0">{children}</span>
    </li>
  ),
  h2: ({ children }) => <h2 className="text-[14px] font-semibold mt-4 mb-2" style={{ color: COLORS.text }}>{children}</h2>,
  h3: ({ children }) => <h3 className="text-[13px] font-semibold mt-3 mb-1.5" style={{ color: COLORS.text }}>{children}</h3>,
  strong: ({ children }) => <strong className="font-semibold" style={{ color: COLORS.text }}>{children}</strong>,
  em: ({ children }) => <em className="italic" style={{ color: COLORS.textMuted }}>{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
       className="underline underline-offset-2 transition-colors"
       style={{ color: COLORS.accent }}
       onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.accentHover)}
       onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.accent)}>
      {children}
    </a>
  ),
  code: ({ className, children }) =>
    /language-/.test(className || '') ? (
      <pre className="rounded-lg p-3 overflow-x-auto my-3" style={{ background: '#f6f8fa', border: `1px solid ${COLORS.border}` }}>
        <code className="font-mono text-[12px] leading-relaxed" style={{ color: COLORS.text }}>{children}</code>
      </pre>
    ) : (
      <code className="px-1.5 py-0.5 rounded font-mono text-[12px]" style={{ background: '#f6f8fa', color: COLORS.text, border: `1px solid ${COLORS.border}` }}>
        {children}
      </code>
    ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg" style={{ border: `1px solid ${COLORS.border}` }}>
      <table className="w-full text-left text-[13px] border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="text-[12px] font-semibold" style={{ background: '#f6f8fa', color: COLORS.text, borderBottom: `1px solid ${COLORS.border}` }}>{children}</thead>,
  th:    ({ children }) => <th className="px-3 py-2.5 whitespace-nowrap">{children}</th>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  td:    ({ children }) => <td className="px-3 py-2.5 border-t" style={{ color: COLORS.textBody, borderColor: COLORS.border }}>{children}</td>,
  tr:    ({ children }) => <tr>{children}</tr>,
};

const userMd: Components = {
  p: ({ children }) => <p className="leading-relaxed text-[14px]">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
};

// ─── Streaming cursor ─────────────────────────────────────────────────────────
function StreamingCursor() {
  return <span className="ai-streaming-cursor" />;
}

// ─── Thinking indicator ───────────────────────────────────────────────────────
function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-[13px]" style={{ color: COLORS.textMuted }}>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: COLORS.textFaint, animationDelay: '0s' }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: COLORS.textFaint, animationDelay: '0.15s' }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: COLORS.textFaint, animationDelay: '0.3s' }} />
      </div>
    </div>
  );
}

// ─── Empty state — Stripe-style hero ──────────────────────────────────────────
function EmptyState({ onPrompt, disabled }: { onPrompt: (q: string) => void; disabled: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-xl pt-12 pb-6"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
             style={{ background: COLORS.accentSoft }}>
          <Sparkles size={20} style={{ color: COLORS.accent }} />
        </div>
        <h1 className="text-[22px] font-semibold mb-2" style={{ color: COLORS.text, letterSpacing: '-0.01em' }}>
          How can I help today?
        </h1>
        <p className="text-[14px] mb-8 max-w-sm leading-relaxed" style={{ color: COLORS.textMuted }}>
          Ask anything about your invoices, payments, expenses, or compliance — I'll pull live numbers when needed.
        </p>

        <div className="grid grid-cols-2 gap-2 w-full">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => !disabled && onPrompt(p.query)}
              disabled={disabled}
              className="px-3.5 py-3 rounded-xl text-left text-[13px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text,
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = COLORS.borderStrong;
                  e.currentTarget.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.background = COLORS.surface;
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
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
  const isError = msg.status === 'error';
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const waitingForFirstToken = isStreaming && !msg.uiComponent && msg.text.trim().length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group flex w-full ${isBot ? 'justify-start' : 'justify-end'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${isBot ? 'items-start' : 'items-end'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${isBot ? '' : 'text-white'}`}
          style={isBot
            ? {
                background: isError ? '#fff5f5' : COLORS.surface,
                border: `1px solid ${isError ? '#fecaca' : COLORS.border}`,
                color: COLORS.textBody,
              }
            : {
                background: COLORS.accent,
                border: `1px solid ${COLORS.accent}`,
              }
          }
        >
          {waitingForFirstToken ? (
            <ThinkingIndicator />
          ) : msg.text.length > 0 ? (
            <>
              <ReactMarkdown components={isBot ? botMd : userMd}>{msg.text}</ReactMarkdown>
              {isStreaming && <StreamingCursor />}
            </>
          ) : isStreaming ? <ThinkingIndicator /> : null}

          {/* Workspace card */}
          {msg.uiComponent && msg.uiData && (
            <div className="mt-4 -mx-1">
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

          {/* Domain choice buttons (legacy guided_choice — rare with new agent) */}
          {isBot && msg.data?.type === 'guided_choice' && (
            <AIDomainChoiceCard
              data={msg.data}
              disabled={disableChoices}
              onSelect={onSelectDomain}
              onAction={onAction}
            />
          )}
        </div>

        {/* Hover-only meta row */}
        {isBot && !isStreaming && (
          <div
            className={`flex items-center gap-3 mt-1 px-1 transition-opacity duration-150 ${hover || copied ? 'opacity-100' : 'opacity-0'}`}
          >
            <button
              onClick={handleCopy}
              className="text-[11px] font-medium transition-colors"
              style={{ color: copied ? COLORS.accent : COLORS.textFaint }}
              onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = COLORS.textMuted; }}
              onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = COLORS.textFaint; }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <span className="text-[11px]" style={{ color: COLORS.textFaint }}>
              {msg.timestamp instanceof Date
                ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function AIAssistantPage() {
  const { businessType } = usePersona();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const isBusy = isThinking || messages.some(m => m.status === 'streaming');
  const isEmpty = messages.length === 0;

  const scrollRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
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
    setMessages([]);
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
          const errText = event.message || 'Something went wrong. Please try again.';
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
        text: 'Something went wrong. Please try again.',
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
      { id: botId, sender: 'bot', text: `Loading ${choice.label}…`, timestamp: new Date(), status: 'streaming', domain },
    ]);
    setTimeout(() => scrollToBottom(), 50);

    try {
      const ws = await aiService.getWorkspace(domain) as any;
      setMessages(prev => prev.map(m => m.id === botId ? {
        ...m,
        text: `Here's your ${ws?.label || choice.label}.`,
        status: 'sent',
        uiComponent: ws?.component,
        uiData: ws?.data,
        data: { type: 'workspace_view' },
      } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === botId ? {
        ...m,
        text: 'Could not load the workspace. Please try again.',
        status: 'error',
      } : m));
    }
  }, [cancelStream, isBusy, scrollToBottom]);

  // ── Switch workspace view (tab change) ────────────────────────────────────
  const switchView = useCallback(async (msg: Message, viewId: string) => {
    const domain = String(msg.domain || '').toLowerCase();
    if (!domain || !viewId) return;

    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'streaming' } : m));

    try {
      const ws = await aiService.getWorkspace(domain, viewId) as any;
      setMessages(prev => prev.map(m => m.id === msg.id ? {
        ...m,
        status: 'sent',
        uiComponent: ws?.component,
        uiData: ws?.data,
      } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === msg.id ? {
        ...m,
        status: 'error',
        text: 'Could not switch view. Please try again.',
      } : m));
    }
  }, []);

  // ── Handle action buttons in workspace cards ──────────────────────────────
  const handleAction = useCallback((action: any) => {
    if (!action) return;
    if (action.type === 'navigate' && action.data?.to) {
      navigate(action.data.to);
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
  const NAV_ITEMS = [
    { id: 'invoices',   label: 'Invoices',   icon: FileText,    desc: 'Receivables' },
    { id: 'payments',   label: 'Payments',   icon: CreditCard,  desc: 'Cash in' },
    { id: 'expenses',   label: 'Expenses',   icon: Receipt,     desc: 'Spend' },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck, desc: 'GST & deadlines' },
  ] as const;

  return (
    <>
      <style>{`
        @keyframes capita-cursor-blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        .ai-streaming-cursor {
          display: inline-block; width: 2px; height: 14px;
          background: ${COLORS.accent};
          margin-left: 2px; vertical-align: text-bottom; border-radius: 1px;
          animation: capita-cursor-blink 0.9s ease-in-out infinite;
        }
      `}</style>

      <div className="flex h-[100dvh] w-full overflow-hidden font-sans" style={{ background: COLORS.bg, color: COLORS.text }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside
          className="hidden md:flex flex-col w-[240px] shrink-0"
          style={{ background: COLORS.surface, borderRight: `1px solid ${COLORS.border}` }}
        >
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-4 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: COLORS.accentSoft }}>
              <Sparkles size={15} style={{ color: COLORS.accent }} />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold leading-none" style={{ color: COLORS.text }}>Capita</div>
              <div className="text-[11px] leading-none mt-1" style={{ color: COLORS.textMuted }}>Finance assistant</div>
            </div>
          </div>

          {/* New chat */}
          <div className="px-3 pt-3">
            <button
              onClick={clearChat}
              disabled={isBusy}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: COLORS.accent, color: '#ffffff' }}
              onMouseEnter={(e) => { if (!isBusy) e.currentTarget.style.background = COLORS.accentHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.accent; }}
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>New chat</span>
            </button>
          </div>

          {/* Workspaces */}
          <div className="flex-1 overflow-y-auto px-3 pt-5 pb-2">
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: COLORS.textFaint }}>
              Workspaces
            </div>
            <div className="space-y-0.5">
              {NAV_ITEMS.map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => !isBusy && openWorkspace({ id, domain: id, label })}
                  disabled={isBusy}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed group"
                  onMouseEnter={(e) => { if (!isBusy) e.currentTarget.style.background = '#f6f8fa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon size={15} style={{ color: COLORS.textMuted }} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium leading-tight" style={{ color: COLORS.text }}>{label}</div>
                    <div className="text-[11px] leading-tight mt-0.5" style={{ color: COLORS.textFaint }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-3 pb-3 pt-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] font-medium transition-colors"
              style={{ color: COLORS.textMuted }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f6f8fa'; e.currentTarget.style.color = COLORS.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.textMuted; }}
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN PANEL ── */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* ── TOP BAR ── */}
          <div
            className="shrink-0 flex items-center justify-between gap-3 px-4 h-12"
            style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}
          >
            <div className="flex md:hidden items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: COLORS.accentSoft }}>
                <Sparkles size={13} style={{ color: COLORS.accent }} />
              </div>
              <span className="text-[14px] font-semibold" style={{ color: COLORS.text }}>Capita</span>
            </div>
            <div className="hidden md:block" />

            <div className="flex items-center gap-1">
              <div className="flex md:hidden items-center gap-1">
                {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => !isBusy && openWorkspace({ id, domain: id, label })}
                    disabled={isBusy}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                    style={{ color: COLORS.textMuted }}
                    title={label}
                    onMouseEnter={(e) => { if (!isBusy) { e.currentTarget.style.background = '#f6f8fa'; e.currentTarget.style.color = COLORS.text; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.textMuted; }}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
              <button
                onClick={clearChat}
                disabled={isBusy}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30"
                style={{ color: COLORS.textMuted }}
                title="New chat"
                onMouseEnter={(e) => { if (!isBusy) e.currentTarget.style.background = '#f6f8fa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: COLORS.textMuted }}
                title="Close"
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f6f8fa'; e.currentTarget.style.color = COLORS.text; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.textMuted; }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── CHAT AREA ── */}
          <div className="relative flex flex-col flex-1 min-h-0">
            <div
              ref={scrollRef}
              onScroll={() => {
                if (!scrollRef.current) return;
                const el = scrollRef.current;
                setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
              }}
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: `${COLORS.borderStrong} transparent` }}
            >
              <div className="mx-auto max-w-2xl px-4 pb-6 pt-5 space-y-4">
                {isEmpty ? (
                  <EmptyState onPrompt={(q) => handleSend(q)} disabled={isBusy} />
                ) : (
                  <>
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

                    {isThinking && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl px-4 py-3"
                             style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                          <ThinkingIndicator />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {isListening && (
                  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="flex justify-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium"
                         style={{ background: '#fff5f5', border: `1px solid #fecaca`, color: COLORS.danger }}>
                      <Mic size={11} className="animate-pulse" />
                      <span>Listening</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Scroll-to-bottom FAB */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-24 right-5 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, boxShadow: '0 4px 12px rgba(60,66,87,0.08)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.borderStrong; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; }}
                >
                  <ChevronDown size={15} style={{ color: COLORS.textMuted }} />
                </motion.button>
              )}
            </AnimatePresence>

            {/* ── INPUT BAR ── */}
            <div className="shrink-0 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              <div className="mx-auto max-w-2xl">
                <div
                  className="rounded-xl transition-all"
                  style={{
                    background: COLORS.surface,
                    border: `1px solid ${inputFocused ? COLORS.accent : COLORS.border}`,
                    boxShadow: inputFocused
                      ? `0 0 0 3px ${COLORS.accentSoft}`
                      : '0 1px 2px rgba(60,66,87,0.04)',
                  }}
                >
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value);
                      const el = e.target;
                      el.style.height = 'auto';
                      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                    }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Ask anything…"
                    className="w-full bg-transparent border-none resize-none px-4 pt-3 pb-1 text-[14px] outline-none leading-relaxed"
                    style={{ color: COLORS.text, minHeight: 44, maxHeight: 160, scrollbarWidth: 'none' }}
                  />

                  <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
                    <span className="text-[11px] pl-2" style={{ color: COLORS.textFaint }}>
                      {query.trim() ? 'Shift+Enter for new line' : ''}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={startListening}
                        disabled={isBusy}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          color: isListening ? COLORS.danger : COLORS.textMuted,
                          background: isListening ? '#fff5f5' : 'transparent',
                        }}
                        onMouseEnter={(e) => { if (!isBusy && !isListening) e.currentTarget.style.background = '#f6f8fa'; }}
                        onMouseLeave={(e) => { if (!isListening) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                      </button>

                      <button
                        onClick={() => handleSend()}
                        disabled={!query.trim() || isBusy}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:cursor-not-allowed"
                        style={query.trim() && !isBusy
                          ? { background: COLORS.accent, color: '#ffffff' }
                          : { background: '#f0f1f3', color: COLORS.textFaint }
                        }
                        onMouseEnter={(e) => { if (query.trim() && !isBusy) e.currentTarget.style.background = COLORS.accentHover; }}
                        onMouseLeave={(e) => { if (query.trim() && !isBusy) e.currentTarget.style.background = COLORS.accent; }}
                      >
                        <ArrowUp size={15} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
