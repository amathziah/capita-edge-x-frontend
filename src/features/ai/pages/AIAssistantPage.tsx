import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  ChevronDown,
  X,
  FileText,
  CreditCard,
  Receipt,
  ShieldCheck,
  LayoutDashboard,
  ArrowUp,
  Sparkles,
  Plus,
  Users,
  Menu,
  Square,
  Copy,
  Check,
  ArrowRight,
  Zap,
  TrendingUp,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '@/shared/services/aiService';
import { usePersona } from '@/app/providers/PersonaContext';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { AIWorkspaceRenderer } from '@/features/ai/components/AIWorkspaceRenderer';
import { AIDomainChoiceCard } from '@/features/ai/components/AIDomainChoiceCard';

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

type NavItem = {
  id: string;
  label: string;
  icon: any;
  desc: string;
  accent: string;
  accentBg: string;
};

const SIDEBAR_BG = '#0f1117';
const SIDEBAR_BORDER = 'rgba(255,255,255,0.06)';

const NAV_ITEMS: NavItem[] = [
  { id: 'invoices',   label: 'Invoices',    icon: FileText,   desc: 'Receivables & collections', accent: '#60a5fa', accentBg: 'rgba(96,165,250,0.12)' },
  { id: 'payments',   label: 'Payments',    icon: CreditCard, desc: 'Cash in & settlements',     accent: '#34d399', accentBg: 'rgba(52,211,153,0.12)' },
  { id: 'expenses',   label: 'Expenses',    icon: Receipt,    desc: 'Spend & categories',        accent: '#fbbf24', accentBg: 'rgba(251,191,36,0.12)'  },
  { id: 'compliance', label: 'Compliance',  icon: ShieldCheck,desc: 'Deadlines & filings',       accent: '#a78bfa', accentBg: 'rgba(167,139,250,0.12)' },
  { id: 'customers',  label: 'Customers',   icon: Users,      desc: 'Top clients & revenue',     accent: '#2dd4bf', accentBg: 'rgba(45,212,191,0.12)'  },
];

const SUGGESTED_PROMPTS = [
  {
    icon: AlertCircle,
    label: "Today's priorities",
    description: 'Overdue invoices, pending collections, and urgent compliance items.',
    query: 'What needs attention first across invoices, payments, expenses, and compliance today?',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.08)',
  },
  {
    icon: TrendingUp,
    label: 'Collections overview',
    description: 'Who owes the most and where follow-up should start.',
    query: 'Which invoices are overdue, who owes me the most, and what should I follow up on first?',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
  },
  {
    icon: Zap,
    label: 'Monthly summary',
    description: 'Cash collected, expenses booked, and pending obligations.',
    query: 'Give me a summary of cash collected, expenses, and pending obligations for this month.',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
  },
  {
    icon: Calendar,
    label: 'Upcoming deadlines',
    description: 'Next compliance tasks and what is due this week.',
    query: 'What compliance deadlines or urgent tasks are due this week?',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
  },
];

const INPUT_PLACEHOLDER = 'Ask about invoices, cash flow, expenses, or compliance…';

// ─── Markdown renderers ────────────────────────────────────────────────────

const botMd: Components = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 text-[14px] leading-[1.75] text-gray-700">{children}</p>
  ),
  ul: ({ children }) => <ul className="my-3 list-none space-y-2 pl-0">{children}</ul>,
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-2 pl-5 text-[14px] text-gray-700">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2.5 text-[14px] leading-[1.65] text-gray-700">
      <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-5 text-[15px] font-semibold text-gray-900">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-3 text-[13px] font-semibold text-gray-900">{children}</h3>
  ),
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em: ({ children }) => <em className="text-gray-500">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">
      {children}
    </a>
  ),
  code: ({ className, children }) =>
    /language-/.test(className || '') ? (
      <pre className="my-3 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-3">
        <code className="font-mono text-[12px] leading-relaxed text-gray-800">{children}</code>
      </pre>
    ) : (
      <code className="rounded-md border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-[12px] text-gray-800">
        {children}
      </code>
    ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full border-collapse text-left text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100">
      {children}
    </thead>
  ),
  th: ({ children }) => <th className="whitespace-nowrap px-3 py-2.5">{children}</th>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  td: ({ children }) => (
    <td className="border-t border-gray-50 px-3 py-2.5 text-gray-700">{children}</td>
  ),
  tr: ({ children }) => <tr className="hover:bg-gray-50 transition-colors">{children}</tr>,
};

const userMd: Components = {
  p: ({ children }) => <p className="text-[14px] leading-relaxed text-white">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
};

// ─── Sub-components ────────────────────────────────────────────────────────

function StreamingCursor() {
  return <span className="ai-streaming-cursor" />;
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2.5 text-[13px] text-gray-400">
      <div className="flex gap-1">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="h-1.5 w-1.5 rounded-full bg-gray-300 animate-bounce"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </div>
      <span className="text-[12px]">Thinking…</span>
    </div>
  );
}

function CapitaAvatar({ size = 28 }: { size?: number }) {
  return (
    <div
      className="shrink-0 rounded-lg bg-gray-900 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Sparkles size={size * 0.45} className="text-white" strokeWidth={1.8} />
    </div>
  );
}

function EmptyState({
  onPrompt,
  onOpenWorkspace,
  navItems,
  disabled,
  businessType,
}: {
  onPrompt: (q: string) => void;
  onOpenWorkspace: (choice: any) => void;
  navItems: NavItem[];
  disabled: boolean;
  businessType?: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mx-auto flex w-full max-w-[860px] flex-1 flex-col justify-center py-6 sm:py-10"
    >
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-900 mb-4 shadow-lg">
          <Sparkles size={20} className="text-white" strokeWidth={1.8} />
        </div>
        <h1 className="text-[26px] font-bold tracking-[-0.03em] text-gray-900 sm:text-[32px] leading-[1.1]">
          What do you want to know?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-[1.7] text-gray-500">
          Ask about your invoices, cash flow, expenses, or compliance — get answers from live workspace data.
          {businessType ? ` Tuned for ${businessType}.` : ''}
        </p>

        {/* Workspace chips */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {navItems.map(({ id, label, icon: Icon, accent, accentBg }) => (
            <button
              key={id}
              type="button"
              onClick={() => !disabled && onOpenWorkspace({ id, domain: id, label })}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 shadow-sm hover:border-gray-300 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                '--hover-bg': accentBg,
              } as any}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.color = accent;
                  e.currentTarget.style.borderColor = accent + '44';
                  e.currentTarget.style.background = accentBg;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '';
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.background = '';
              }}
            >
              <Icon size={11} style={{ color: accent }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((prompt, i) => {
          const Icon = prompt.icon;
          return (
            <motion.button
              key={prompt.label}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25, ease: 'easeOut' }}
              onClick={() => !disabled && onPrompt(prompt.query)}
              disabled={disabled}
              className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm hover:border-gray-200 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              <div
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                style={{ background: prompt.bg }}
              >
                <Icon size={15} style={{ color: prompt.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-gray-900">{prompt.label}</span>
                  <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-400 shrink-0 transition-colors group-hover:translate-x-0.5 transform" />
                </div>
                <p className="mt-0.5 text-[12px] leading-[1.6] text-gray-500">{prompt.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function SidebarPanel({
  navItems,
  isBusy,
  onNewChat,
  onOpenWorkspace,
  onDashboard,
  onClose,
}: {
  navItems: NavItem[];
  isBusy: boolean;
  onNewChat: () => void;
  onOpenWorkspace: (choice: any) => void;
  onDashboard: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col" style={{ background: SIDEBAR_BG }}>
      {/* Brand */}
      <div className="flex h-[56px] shrink-0 items-center gap-2.5 px-4 border-b" style={{ borderColor: SIDEBAR_BORDER }}>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.08] border border-white/[0.10]">
          <Sparkles size={13} className="text-white" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-white leading-none">Capita AI</div>
          <div className="mt-0.5 text-[10px] text-white/30 font-medium">Finance workspace</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all lg:hidden"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2.5 pt-3 pb-3 space-y-4">
        {/* New thread */}
        <button
          type="button"
          onClick={onNewChat}
          disabled={isBusy}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.05] border border-white/[0.07] hover:border-white/[0.12] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={13} strokeWidth={2.5} />
          New thread
        </button>

        {/* Workspaces */}
        <div>
          <div className="flex items-center gap-2 px-1 mb-2">
            <span className="text-[9px] font-bold tracking-[0.14em] text-white/25 uppercase">Workspaces</span>
            <div className="flex-1 h-px" style={{ background: SIDEBAR_BORDER }} />
          </div>

          <div className="space-y-0.5">
            {navItems.map(({ id, label, icon: Icon, accent }) => (
              <button
                key={id}
                type="button"
                onClick={() => !isBusy && onOpenWorkspace({ id, domain: id, label })}
                disabled={isBusy}
                className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-white/40 hover:text-white/80 hover:bg-white/[0.05] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Icon size={14} strokeWidth={1.8} className="shrink-0 transition-colors" style={{ color: undefined }} />
                <span className="flex-1 truncate">{label}</span>
                <span
                  className="w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  style={{ background: accent }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t px-2.5 py-2.5 space-y-0.5" style={{ borderColor: SIDEBAR_BORDER }}>
        <button
          type="button"
          onClick={onDashboard}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-white/35 hover:text-white/70 hover:bg-white/[0.04] transition-all"
        >
          <LayoutDashboard size={14} strokeWidth={1.8} className="shrink-0" />
          <span className="flex-1 text-left">Exit to dashboard</span>
        </button>
      </div>
    </div>
  );
}

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
    setTimeout(() => setCopied(false), 1800);
  };

  const waitingForFirstToken = isStreaming && !msg.uiComponent && msg.text.trim().length === 0;

  if (!isBot) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="flex justify-end"
      >
        <div className="flex flex-col items-end max-w-[80%] sm:max-w-[72%]">
          <div className="rounded-2xl rounded-br-sm bg-gray-900 px-4 py-3 shadow-sm">
            <ReactMarkdown components={userMd}>{msg.text}</ReactMarkdown>
          </div>
          <span className="mt-1.5 px-1 text-[10px] text-gray-300">
            {msg.timestamp instanceof Date
              ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex items-start gap-3"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <CapitaAvatar size={28} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] font-semibold text-gray-900">Capita AI</span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-500">
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
              Generating
            </span>
          )}
        </div>

        <div
          className={`rounded-2xl rounded-tl-sm border px-4 py-3.5 ${
            isError
              ? 'border-red-100 bg-red-50'
              : 'border-gray-100 bg-white shadow-sm'
          }`}
        >
          {waitingForFirstToken ? (
            <ThinkingIndicator />
          ) : msg.text.length > 0 ? (
            <>
              <ReactMarkdown components={botMd}>{msg.text}</ReactMarkdown>
              {isStreaming && <StreamingCursor />}
            </>
          ) : isStreaming ? (
            <ThinkingIndicator />
          ) : null}

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

          {isBot && msg.data?.type === 'guided_choice' && (
            <AIDomainChoiceCard
              data={msg.data}
              disabled={disableChoices}
              onSelect={onSelectDomain}
              onAction={onAction}
            />
          )}
        </div>

        {/* Message actions */}
        {!isStreaming && (
          <div className={`mt-2 flex items-center gap-3 px-1 transition-opacity duration-150 ${hover || copied ? 'opacity-100' : 'opacity-0'}`}>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <span className="text-[11px] text-gray-300">
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

// ─── Main page ─────────────────────────────────────────────────────────────

export function AIAssistantPage() {
  const { businessType } = usePersona();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isBusy = isThinking || messages.some((m) => m.status === 'streaming');
  const isEmpty = messages.length === 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamIdRef = useRef<string | null>(null);
  const reqIdRef = useRef(0);

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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const cancelStream = useCallback(() => {
    reqIdRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    if (streamIdRef.current) {
      setMessages((prev) => prev.filter((m) => m.id !== streamIdRef.current));
      streamIdRef.current = null;
    }
    setIsThinking(false);
  }, []);

  const clearChat = useCallback(() => {
    cancelStream();
    setMessages([]);
    setMobileNavOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [cancelStream]);

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

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsThinking(true);
    setTimeout(() => scrollToBottom(), 50);

    const history = messages
      .filter((m) => m.status !== 'streaming' && m.status !== 'error' && m.text.trim())
      .slice(-10)
      .map((m) => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text.trim() }] }));

    while (history.length > 0 && history[0].role === 'model') history.shift();

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const stream = aiService.chatStream(
        { query: text, businessType: businessType || undefined, persona: businessType || undefined, history },
        abort.signal,
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
            setMessages((prev) => [
              ...prev,
              { id: botId!, sender: 'bot', text: accumulated, timestamp: new Date(), status: 'streaming' },
            ]);
            setTimeout(() => scrollToBottom(), 50);
          } else {
            setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, text: accumulated } : m)));
          }
        } else if (event.type === 'gen_ui') {
          if (!botId) {
            botId = `bot_${Date.now()}`;
            streamIdRef.current = botId;
            setMessages((prev) => [
              ...prev,
              { id: botId!, sender: 'bot', text: accumulated, timestamp: new Date(), status: 'streaming', uiComponent: event.component, uiData: event.data },
            ]);
          } else {
            setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, uiComponent: event.component, uiData: event.data } : m)));
          }
        } else if (event.type === 'complete') {
          setIsThinking(false);
          const finalText = typeof event.text === 'string' && event.text.trim() ? event.text : accumulated;
          const ws = event.workspace || event.data?.workspace;

          if (!botId) {
            botId = `bot_${Date.now()}`;
            streamIdRef.current = botId;
            setMessages((prev) => [
              ...prev,
              { id: botId!, sender: 'bot', text: finalText, timestamp: new Date(), status: 'sent', uiComponent: ws?.component, uiData: ws?.data, domain: ws?.domain || event.data?.domain, data: event.data },
            ]);
          } else {
            setMessages((prev) => prev.map((m) => (
              m.id === botId
                ? { ...m, text: finalText, status: 'sent', uiComponent: ws?.component || m.uiComponent, uiData: ws?.data ?? m.uiData, domain: ws?.domain || event.data?.domain || m.domain, data: event.data }
                : m
            )));
          }
        } else if (event.type === 'error') {
          setIsThinking(false);
          const errText = event.message || 'Something went wrong. Please try again.';
          if (!botId) {
            botId = `bot_${Date.now()}`;
            streamIdRef.current = botId;
            setMessages((prev) => [
              ...prev,
              { id: botId!, sender: 'bot', text: errText, timestamp: new Date(), status: 'error' },
            ]);
          } else {
            setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, text: errText, status: 'error' } : m)));
          }
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || reqIdRef.current !== reqId) return;
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        { id: `bot_err_${Date.now()}`, sender: 'bot', text: 'Something went wrong. Please try again.', timestamp: new Date(), status: 'error' },
      ]);
    } finally {
      if (reqIdRef.current === reqId) {
        if (abortRef.current === abort) abortRef.current = null;
        streamIdRef.current = null;
        setIsThinking(false);
      }
    }
  };

  const openWorkspace = useCallback(async (choice: any) => {
    const domain = String(choice?.domain || '').toLowerCase();
    if (!domain || isBusy) return;

    setMobileNavOpen(false);
    cancelStream();
    const botId = `bot_ws_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: `user_ws_${Date.now()}`, sender: 'user', text: `Open ${choice.label}`, timestamp: new Date(), status: 'sent' },
      { id: botId, sender: 'bot', text: `Loading ${choice.label}…`, timestamp: new Date(), status: 'streaming', domain },
    ]);
    setTimeout(() => scrollToBottom(), 50);

    try {
      const ws = await aiService.getWorkspace(domain) as any;
      setMessages((prev) => prev.map((m) => (
        m.id === botId
          ? { ...m, text: `Here is your ${ws?.label || choice.label}.`, status: 'sent', uiComponent: ws?.component, uiData: ws?.data, data: { type: 'workspace_view' } }
          : m
      )));
    } catch {
      setMessages((prev) => prev.map((m) => (
        m.id === botId ? { ...m, text: 'Could not load the workspace. Please try again.', status: 'error' } : m
      )));
    }
  }, [cancelStream, isBusy, scrollToBottom]);

  const switchView = useCallback(async (msg: Message, viewId: string) => {
    const domain = String(msg.domain || '').toLowerCase();
    if (!domain || !viewId) return;

    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'streaming' } : m)));

    try {
      const ws = await aiService.getWorkspace(domain, viewId) as any;
      setMessages((prev) => prev.map((m) => (
        m.id === msg.id ? { ...m, status: 'sent', uiComponent: ws?.component, uiData: ws?.data } : m
      )));
    } catch {
      setMessages((prev) => prev.map((m) => (
        m.id === msg.id ? { ...m, status: 'error', text: 'Could not switch view.' } : m
      )));
    }
  }, []);

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

  const startListening = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported in this browser.'); return; }
    const r = new SR();
    r.lang = 'en-IN';
    r.interimResults = false;
    r.onstart = () => setIsListening(true);
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    r.onresult = (e: any) => { const t = e.results[0][0].transcript; setQuery(t); handleSend(t); };
    r.start();
  };

  const sidebarProps = { navItems: NAV_ITEMS, isBusy, onNewChat: clearChat, onOpenWorkspace: openWorkspace, onDashboard: () => navigate('/dashboard') };

  return (
    <>
      <style>{`
        @keyframes capita-cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .ai-streaming-cursor {
          display: inline-block; width: 2px; height: 14px; margin-left: 2px;
          vertical-align: text-bottom; border-radius: 1px; background: #374151;
          animation: capita-cursor-blink 0.9s ease-in-out infinite;
        }
      `}</style>

      <div className="relative flex h-[100dvh] w-full overflow-hidden bg-white">

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex h-full w-[220px] xl:w-[232px] shrink-0 flex-col border-r" style={{ borderColor: 'rgba(0,0,0,0.06)', background: SIDEBAR_BG }}>
          <SidebarPanel {...sidebarProps} />
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileNavOpen(false)}
                className="absolute inset-0 z-30 lg:hidden bg-black/40 backdrop-blur-sm"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                className="absolute inset-y-0 left-0 z-40 w-[88vw] max-w-[320px] border-r lg:hidden"
                style={{ borderColor: SIDEBAR_BORDER, background: SIDEBAR_BG }}
              >
                <SidebarPanel {...sidebarProps} onClose={() => setMobileNavOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main area */}
        <div className="relative flex min-w-0 flex-1 flex-col">

          {/* Header */}
          <header className="flex h-[56px] shrink-0 items-center border-b border-gray-100 px-4 sm:px-5">
            <div className="mx-auto flex w-full max-w-[860px] items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all lg:hidden"
                >
                  <Menu size={15} />
                </button>

                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[15px] font-bold text-gray-900 tracking-tight">Capita AI</span>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Live
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearChat}
                  disabled={isEmpty || isBusy}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  New thread
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all"
                  title="Exit to dashboard"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </header>

          {/* Scroll area */}
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={scrollRef}
              onScroll={() => {
                if (!scrollRef.current) return;
                const el = scrollRef.current;
                setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
              }}
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
            >
              <div className="mx-auto flex min-h-full w-full max-w-[860px] flex-col px-4 pb-36 pt-4 sm:px-6 sm:pt-6">
                {isEmpty ? (
                  <EmptyState
                    onPrompt={(q) => handleSend(q)}
                    onOpenWorkspace={openWorkspace}
                    navItems={NAV_ITEMS}
                    disabled={isBusy}
                    businessType={businessType}
                  />
                ) : (
                  <div className="space-y-6 pb-4">
                    {messages.map((msg) => (
                      <ChatBubble
                        key={msg.id}
                        msg={msg}
                        onSelectDomain={openWorkspace}
                        onSelectView={switchView}
                        onAction={handleAction}
                        disableChoices={isBusy}
                      />
                    ))}

                    {isThinking && (
                      <div className="flex items-start gap-3">
                        <CapitaAvatar size={28} />
                        <div className="rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
                          <ThinkingIndicator />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 flex justify-center"
                  >
                    <div className="flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-500">
                      <Mic size={11} className="animate-pulse" />
                      Listening…
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Scroll to bottom */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-32 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronDown size={14} />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Composer */}
            <div className="relative z-20 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 sm:px-6 sm:pt-3">
              {/* Gradient fade */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[72px]" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, white 60%)' }} />

              <div className="relative mx-auto w-full max-w-[860px]">
                <div
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-150 ${
                    inputFocused
                      ? 'border-gray-300 shadow-[0_0_0_3px_rgba(0,0,0,0.05)]'
                      : 'border-gray-200'
                  }`}
                >
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      const el = e.target;
                      el.style.height = 'auto';
                      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        isBusy ? cancelStream() : handleSend();
                      }
                    }}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder={INPUT_PLACEHOLDER}
                    className="w-full resize-none border-none bg-transparent px-4 pb-2 pt-3.5 text-[14px] leading-[1.7] text-gray-900 outline-none placeholder:text-gray-400"
                    style={{ minHeight: 52, maxHeight: 160, scrollbarWidth: 'none' }}
                  />

                  <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2">
                    <span className="hidden text-[11px] text-gray-300 sm:block select-none">
                      Enter to send · Shift+Enter for new line
                    </span>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={startListening}
                        disabled={isBusy}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                          isListening
                            ? 'bg-red-50 border border-red-100 text-red-500'
                            : 'border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => isBusy ? cancelStream() : handleSend()}
                        disabled={!isBusy && !query.trim()}
                        className={`flex h-8 min-w-[80px] items-center justify-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
                          isBusy || query.trim()
                            ? 'bg-gray-900 text-white hover:bg-gray-700'
                            : 'border border-gray-200 bg-gray-50 text-gray-400'
                        }`}
                      >
                        {isBusy ? <Square size={12} fill="currentColor" /> : <ArrowUp size={14} strokeWidth={2.5} />}
                        {isBusy ? 'Stop' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-center text-[10px] text-gray-300 select-none">
                  Capita AI · Live workspace data · Not financial advice
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
