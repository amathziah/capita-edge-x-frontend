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
  Bot,
  Globe,
  BookOpen,
  Square,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '@/shared/services/aiService';
import { usePersona } from '@/app/providers/PersonaContext';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { AIWorkspaceRenderer } from '@/features/ai/components/AIWorkspaceRenderer';
import { AIDomainChoiceCard } from '@/features/ai/components/AIDomainChoiceCard';
import { AI_THEME } from '@/features/ai/components/workspaces/workspaceShared';

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
};

const COLORS = {
  ...AI_THEME,
  userBubble: 'linear-gradient(135deg, rgba(19, 39, 48, 0.94) 0%, rgba(24, 88, 73, 0.92) 100%)',
  userBorder: 'rgba(74, 204, 168, 0.36)',
  botBubble: 'linear-gradient(180deg, rgba(13, 22, 30, 0.98) 0%, rgba(8, 14, 20, 0.98) 100%)',
  overlay: 'rgba(2, 6, 10, 0.7)',
};

const NAV_ITEMS: NavItem[] = [
  { id: 'invoices', label: 'Invoices', icon: FileText, desc: 'Track receivables and overdue accounts', accent: '#7dd3fc' },
  { id: 'payments', label: 'Payments', icon: CreditCard, desc: 'Monitor settlements and cash in', accent: '#77f7c9' },
  { id: 'expenses', label: 'Expenses', icon: Receipt, desc: 'Review monthly spend and categories', accent: '#f6c775' },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck, desc: 'Stay ahead of filings and tasks', accent: '#c59cf8' },
  { id: 'customers', label: 'Customers', icon: Users, desc: 'Rank your top clients and revenue', accent: '#6fe4d8' },
];

const SUGGESTED_PROMPTS = [
  {
    label: 'What needs attention first?',
    hint: 'Priority scan',
    query: 'What needs attention first across invoices, payments, expenses, and compliance today?',
  },
  {
    label: 'Show overdue risk',
    hint: 'Collections',
    query: 'Which invoices are overdue, who owes me the most, and what should I follow up on first?',
  },
  {
    label: 'Summarize this month',
    hint: 'Cash flow',
    query: 'Give me a summary of cash collected, expenses, and pending obligations for this month.',
  },
  {
    label: 'Find upcoming deadlines',
    hint: 'Compliance',
    query: 'What compliance deadlines or urgent tasks are due this week?',
  },
];

const botMd: Components = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 text-[14px] leading-[1.72]" style={{ color: COLORS.textBody }}>
      {children}
    </p>
  ),
  ul: ({ children }) => <ul className="my-3 list-none space-y-2 pl-0">{children}</ul>,
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-2 pl-5 text-[14px]" style={{ color: COLORS.textBody }}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2.5 text-[14px] leading-[1.65]" style={{ color: COLORS.textBody }}>
      <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: COLORS.accent }} />
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  ),
  h2: ({ children }) => (
    <h2
      className="mb-2 mt-4 text-[15px] font-semibold"
      style={{ color: COLORS.text, fontFamily: COLORS.headingFont }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      className="mb-1.5 mt-3 text-[13px] font-semibold"
      style={{ color: COLORS.text, fontFamily: COLORS.headingFont }}
    >
      {children}
    </h3>
  ),
  strong: ({ children }) => <strong style={{ color: COLORS.text }}>{children}</strong>,
  em: ({ children }) => <em style={{ color: COLORS.textMuted }}>{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 transition-colors"
      style={{ color: COLORS.accent }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = COLORS.accentHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = COLORS.accent;
      }}
    >
      {children}
    </a>
  ),
  code: ({ className, children }) =>
    /language-/.test(className || '') ? (
      <pre
        className="my-3 overflow-x-auto rounded-2xl p-3"
        style={{ background: 'rgba(4, 10, 16, 0.76)', border: `1px solid ${COLORS.border}` }}
      >
        <code className="font-mono text-[12px] leading-relaxed" style={{ color: '#cce5f6' }}>
          {children}
        </code>
      </pre>
    ) : (
      <code
        className="rounded-md px-1.5 py-0.5 font-mono text-[12px]"
        style={{ background: 'rgba(4, 10, 16, 0.76)', color: '#cce5f6', border: `1px solid ${COLORS.border}` }}
      >
        {children}
      </code>
    ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-2xl" style={{ border: `1px solid ${COLORS.border}` }}>
      <table className="w-full border-collapse text-left text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead
      className="text-[12px] font-semibold"
      style={{ background: 'rgba(255, 255, 255, 0.03)', color: COLORS.text, borderBottom: `1px solid ${COLORS.border}` }}
    >
      {children}
    </thead>
  ),
  th: ({ children }) => <th className="whitespace-nowrap px-3 py-2.5">{children}</th>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  td: ({ children }) => (
    <td className="border-t px-3 py-2.5" style={{ color: COLORS.textBody, borderColor: COLORS.border }}>
      {children}
    </td>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
};

const userMd: Components = {
  p: ({ children }) => <p className="text-[14px] leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
};

function StreamingCursor() {
  return <span className="ai-streaming-cursor" />;
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-[13px]" style={{ color: COLORS.textMuted }}>
      <div className="flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: COLORS.accent, animationDelay: '0s' }} />
        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: COLORS.accent, animationDelay: '0.15s' }} />
        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: COLORS.accent, animationDelay: '0.3s' }} />
      </div>
      <span>Thinking</span>
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
      transition={{ duration: 0.28 }}
      className="mx-auto flex w-full max-w-[860px] flex-1 flex-col items-center justify-center py-8 text-center"
    >
      <div
        className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em]"
        style={{ borderColor: COLORS.borderStrong, background: COLORS.accentSoft, color: COLORS.text }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: COLORS.accent }} />
        Live finance context
      </div>

      <h1
        className="max-w-3xl text-[34px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[48px]"
        style={{ color: COLORS.text, fontFamily: COLORS.headingFont }}
      >
        Ask Capita the way you’d search with a modern answer engine.
      </h1>

      <p className="mt-4 max-w-2xl text-[15px] leading-[1.8] sm:text-[16px]" style={{ color: COLORS.textMuted }}>
        Search invoices, cash collection, spend, and compliance from one command bar.
        {businessType ? ` Tuned for your ${businessType} workflow.` : ' Tuned for your business workflow.'}
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        {navItems.map(({ id, label, icon: Icon, accent }) => (
          <button
            key={id}
            type="button"
            onClick={() => !disabled && onOpenWorkspace({ id, domain: id, label })}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: COLORS.border, background: COLORS.surfaceSoft, color: COLORS.textBody }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = accent;
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.background = COLORS.surfaceSoft;
            }}
          >
            <Icon size={14} style={{ color: accent }} />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid w-full gap-3 md:grid-cols-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt.label}
            type="button"
            onClick={() => !disabled && onPrompt(prompt.query)}
            disabled={disabled}
            className="rounded-[24px] border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: 'linear-gradient(180deg, rgba(16, 27, 37, 0.94) 0%, rgba(11, 19, 27, 0.98) 100%)',
              borderColor: COLORS.border,
              boxShadow: COLORS.panelShadow,
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = COLORS.borderStrong;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: COLORS.textFaint }}>
                {prompt.hint}
              </span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-2xl"
                style={{ background: COLORS.accentSoft, color: COLORS.accent }}
              >
                <Sparkles size={14} />
              </span>
            </div>
            <div className="text-[16px] font-semibold leading-snug" style={{ color: COLORS.text, fontFamily: COLORS.headingFont }}>
              {prompt.label}
            </div>
            <p className="mt-2 text-[13px] leading-[1.7]" style={{ color: COLORS.textMuted }}>
              {prompt.query}
            </p>
          </button>
        ))}
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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-4" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ background: COLORS.accentSoft, color: COLORS.accent }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-[15px] font-semibold" style={{ color: COLORS.text, fontFamily: COLORS.headingFont }}>
              Capita AI
            </div>
            <div className="text-[12px]" style={{ color: COLORS.textFaint }}>
              Search your business graph
            </div>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-2xl lg:hidden"
            style={{ color: COLORS.textMuted }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={onNewChat}
          disabled={isBusy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: COLORS.text, color: '#061017' }}
        >
          <Plus size={14} strokeWidth={2.5} />
          New thread
        </button>
      </div>

      <div className="px-4 pt-6">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: COLORS.textFaint }}>
          Workspace modes
        </div>
        <div className="space-y-2">
          {navItems.map(({ id, label, icon: Icon, desc, accent }) => (
            <button
              key={id}
              type="button"
              onClick={() => !isBusy && onOpenWorkspace({ id, domain: id, label })}
              disabled={isBusy}
              className="flex w-full items-start gap-3 rounded-[20px] border px-3 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: COLORS.surfaceSoft, borderColor: COLORS.border }}
              onMouseEnter={(e) => {
                if (!isBusy) {
                  e.currentTarget.style.borderColor = accent;
                  e.currentTarget.style.background = COLORS.surfaceRaised;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.background = COLORS.surfaceSoft;
              }}
            >
              <span
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: `${accent}1f`, color: accent }}
              >
                <Icon size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold" style={{ color: COLORS.text }}>
                  {label}
                </span>
                <span className="mt-1 block text-[12px] leading-[1.55]" style={{ color: COLORS.textMuted }}>
                  {desc}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 px-4">
        <div
          className="rounded-[24px] border p-4"
          style={{
            borderColor: COLORS.border,
            background: 'linear-gradient(180deg, rgba(17, 29, 39, 0.96) 0%, rgba(10, 17, 24, 0.98) 100%)',
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <Bot size={15} style={{ color: COLORS.accent }} />
            <span className="text-[12px] font-semibold uppercase tracking-[0.24em]" style={{ color: COLORS.textFaint }}>
              Connected signals
            </span>
          </div>
          <div className="space-y-2 text-[12px] leading-[1.6]" style={{ color: COLORS.textMuted }}>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS.accent }} />
              Invoices and collections context
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS.accent }} />
              Payments, spend, and cash view
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS.accent }} />
              Compliance and customer workspaces
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4">
        <button
          type="button"
          onClick={onDashboard}
          className="flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-all"
          style={{ borderColor: COLORS.border, background: COLORS.surfaceSoft, color: COLORS.textBody }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.borderStrong;
            e.currentTarget.style.background = COLORS.surfaceRaised;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.border;
            e.currentTarget.style.background = COLORS.surfaceSoft;
          }}
        >
          <span className="flex items-center gap-2 text-[13px] font-semibold">
            <LayoutDashboard size={15} />
            Dashboard
          </span>
          <span className="text-[11px]" style={{ color: COLORS.textFaint }}>
            Exit AI
          </span>
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
    setTimeout(() => setCopied(false), 1500);
  };

  const waitingForFirstToken = isStreaming && !msg.uiComponent && msg.text.trim().length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group flex w-full ${isBot ? 'justify-start' : 'justify-end'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={`flex max-w-[94%] flex-col sm:max-w-[86%] ${isBot ? 'items-start' : 'items-end'}`}>
        <div className="mb-2 flex items-center gap-2 px-1 text-[11px] uppercase tracking-[0.24em]" style={{ color: COLORS.textFaint }}>
          {isBot ? <Bot size={12} /> : <span className="h-2 w-2 rounded-full" style={{ background: COLORS.accent }} />}
          <span>{isBot ? 'Capita AI' : 'You'}</span>
        </div>

        <div
          className={`rounded-[28px] px-4 py-4 ${isBot ? '' : 'text-white'}`}
          style={
            isBot
              ? {
                  background: isError ? 'rgba(87, 28, 31, 0.24)' : COLORS.botBubble,
                  border: `1px solid ${isError ? COLORS.dangerSoft : isStreaming ? COLORS.borderStrong : COLORS.border}`,
                  color: COLORS.textBody,
                  boxShadow: COLORS.panelShadow,
                }
              : {
                  background: COLORS.userBubble,
                  border: `1px solid ${COLORS.userBorder}`,
                  boxShadow: COLORS.panelShadow,
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

        {isBot && !isStreaming && (
          <div className={`mt-2 flex items-center gap-3 px-1 transition-opacity ${hover || copied ? 'opacity-100' : 'opacity-0'}`}>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] font-medium transition-colors"
              style={{ color: copied ? COLORS.accent : COLORS.textFaint }}
              onMouseEnter={(e) => {
                if (!copied) e.currentTarget.style.color = COLORS.textMuted;
              }}
              onMouseLeave={(e) => {
                if (!copied) e.currentTarget.style.color = COLORS.textFaint;
              }}
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
              {
                id: botId!,
                sender: 'bot',
                text: accumulated,
                timestamp: new Date(),
                status: 'streaming',
              },
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
              {
                id: botId!,
                sender: 'bot',
                text: accumulated,
                timestamp: new Date(),
                status: 'streaming',
                uiComponent: event.component,
                uiData: event.data,
              },
            ]);
          } else {
            setMessages((prev) => prev.map((m) => (
              m.id === botId ? { ...m, uiComponent: event.component, uiData: event.data } : m
            )));
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
              {
                id: botId!,
                sender: 'bot',
                text: finalText,
                timestamp: new Date(),
                status: 'sent',
                uiComponent: ws?.component,
                uiData: ws?.data,
                domain: ws?.domain || event.data?.domain,
                data: event.data,
              },
            ]);
          } else {
            setMessages((prev) => prev.map((m) => (
              m.id === botId
                ? {
                    ...m,
                    text: finalText,
                    status: 'sent',
                    uiComponent: ws?.component || m.uiComponent,
                    uiData: ws?.data ?? m.uiData,
                    domain: ws?.domain || event.data?.domain || m.domain,
                    data: event.data,
                  }
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
        {
          id: `bot_err_${Date.now()}`,
          sender: 'bot',
          text: 'Something went wrong. Please try again.',
          timestamp: new Date(),
          status: 'error',
        },
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
          ? {
              ...m,
              text: `Here’s your ${ws?.label || choice.label}.`,
              status: 'sent',
              uiComponent: ws?.component,
              uiData: ws?.data,
              data: { type: 'workspace_view' },
            }
          : m
      )));
    } catch {
      setMessages((prev) => prev.map((m) => (
        m.id === botId
          ? {
              ...m,
              text: 'Could not load the workspace. Please try again.',
              status: 'error',
            }
          : m
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
        m.id === msg.id
          ? {
              ...m,
              status: 'sent',
              uiComponent: ws?.component,
              uiData: ws?.data,
            }
          : m
      )));
    } catch {
      setMessages((prev) => prev.map((m) => (
        m.id === msg.id
          ? {
              ...m,
              status: 'error',
              text: 'Could not switch view. Please try again.',
            }
          : m
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
    if (!SR) {
      alert('Voice input not supported in this browser.');
      return;
    }

    const r = new SR();
    r.lang = 'en-IN';
    r.interimResults = false;
    r.onstart = () => setIsListening(true);
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setQuery(t);
      handleSend(t);
    };
    r.start();
  };

  return (
    <>
      <style>{`
        @keyframes capita-cursor-blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        .ai-streaming-cursor {
          display: inline-block;
          width: 2px;
          height: 14px;
          margin-left: 2px;
          vertical-align: text-bottom;
          border-radius: 1px;
          background: ${COLORS.accent};
          animation: capita-cursor-blink 0.9s ease-in-out infinite;
        }
      `}</style>

      <div
        className="relative flex h-[100dvh] w-full overflow-hidden"
        style={{ background: COLORS.bg, color: COLORS.text, fontFamily: COLORS.bodyFont }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle at 14% 12%, rgba(39, 199, 166, 0.16), transparent 28%),
                radial-gradient(circle at 84% 10%, rgba(93, 134, 255, 0.16), transparent 24%),
                radial-gradient(circle at 50% 60%, rgba(255, 255, 255, 0.04), transparent 36%),
                linear-gradient(180deg, #081018 0%, #050a10 100%)
              `,
            }}
          />
          <div className="absolute inset-y-0 left-0 w-px" style={{ background: 'rgba(255, 255, 255, 0.03)' }} />
        </div>

        <aside
          className="relative z-10 hidden h-full w-[320px] shrink-0 border-r lg:block"
          style={{ borderColor: COLORS.border, background: 'rgba(9, 16, 22, 0.84)', backdropFilter: 'blur(18px)' }}
        >
          <SidebarPanel
            navItems={NAV_ITEMS}
            isBusy={isBusy}
            onNewChat={clearChat}
            onOpenWorkspace={openWorkspace}
            onDashboard={() => navigate('/dashboard')}
          />
        </aside>

        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileNavOpen(false)}
                className="absolute inset-0 z-30 lg:hidden"
                style={{ background: COLORS.overlay }}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="absolute inset-y-0 left-0 z-40 w-[88vw] max-w-[340px] border-r lg:hidden"
                style={{ borderColor: COLORS.border, background: 'rgba(9, 16, 22, 0.96)', backdropFilter: 'blur(20px)' }}
              >
                <SidebarPanel
                  navItems={NAV_ITEMS}
                  isBusy={isBusy}
                  onNewChat={clearChat}
                  onOpenWorkspace={openWorkspace}
                  onDashboard={() => navigate('/dashboard')}
                  onClose={() => setMobileNavOpen(false)}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <div className="border-b px-3 py-3 sm:px-5" style={{ borderColor: COLORS.border, background: 'rgba(6, 11, 16, 0.58)', backdropFilter: 'blur(14px)' }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl lg:hidden"
                  style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surfaceSoft, color: COLORS.text }}
                >
                  <Menu size={16} />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold" style={{ color: COLORS.text, fontFamily: COLORS.headingFont }}>
                      Finance Search
                    </span>
                    <span className="hidden rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] sm:inline-flex" style={{ borderColor: COLORS.border, color: COLORS.textFaint }}>
                      AI
                    </span>
                  </div>
                  <div className="mt-1 text-[12px]" style={{ color: COLORS.textMuted }}>
                    Answers grounded in your business data
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 md:flex">
                  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-medium" style={{ borderColor: COLORS.border, background: COLORS.surfaceSoft, color: COLORS.textBody }}>
                    <Globe size={13} style={{ color: COLORS.accent }} />
                    Live graph
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-medium" style={{ borderColor: COLORS.border, background: COLORS.surfaceSoft, color: COLORS.textBody }}>
                    <BookOpen size={13} style={{ color: '#8fb7ff' }} />
                    {businessType || 'Business context'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={clearChat}
                  disabled={isBusy}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surfaceSoft, color: COLORS.textMuted }}
                >
                  <Plus size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl transition-all"
                  style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surfaceSoft, color: COLORS.textMuted }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={scrollRef}
              onScroll={() => {
                if (!scrollRef.current) return;
                const el = scrollRef.current;
                setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 220);
              }}
              className="custom-scrollbar flex-1 overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: `${COLORS.borderStrong} transparent` }}
            >
              <div className="mx-auto flex min-h-full w-full max-w-[920px] flex-col px-4 pb-32 pt-6 sm:px-6 lg:px-8">
                {isEmpty ? (
                  <EmptyState
                    onPrompt={(q) => handleSend(q)}
                    onOpenWorkspace={openWorkspace}
                    navItems={NAV_ITEMS}
                    disabled={isBusy}
                    businessType={businessType}
                  />
                ) : (
                  <div className="space-y-6 pb-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium" style={{ borderColor: COLORS.border, background: COLORS.surfaceSoft, color: COLORS.textMuted }}>
                        <Bot size={12} style={{ color: COLORS.accent }} />
                        Answer mode
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium" style={{ borderColor: COLORS.border, background: COLORS.surfaceSoft, color: COLORS.textMuted }}>
                        <Globe size={12} style={{ color: '#8fb7ff' }} />
                        Business graph connected
                      </span>
                    </div>

                    <AnimatePresence initial={false}>
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
                    </AnimatePresence>

                    {isThinking && (
                      <div className="flex justify-start">
                        <div
                          className="rounded-[24px] px-4 py-3"
                          style={{ background: COLORS.botBubble, border: `1px solid ${COLORS.borderStrong}`, boxShadow: COLORS.panelShadow }}
                        >
                          <ThinkingIndicator />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isListening && (
                  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-3 flex justify-center">
                    <div
                      className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium"
                      style={{ background: COLORS.dangerSoft, border: `1px solid ${COLORS.dangerSoft}`, color: COLORS.danger }}
                    >
                      <Mic size={11} className="animate-pulse" />
                      <span>Listening</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-32 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                  style={{ background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, boxShadow: COLORS.panelShadow }}
                >
                  <ChevronDown size={15} style={{ color: COLORS.textMuted }} />
                </motion.button>
              )}
            </AnimatePresence>

            <div className="relative z-20 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 sm:px-6">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[-64px]" style={{ background: 'linear-gradient(180deg, rgba(5,10,16,0) 0%, rgba(5,10,16,0.84) 35%, rgba(5,10,16,0.98) 100%)' }} />

              <div className="relative mx-auto w-full max-w-[920px]">
                <div className="mb-3 flex flex-wrap gap-2">
                  {NAV_ITEMS.map(({ id, label, icon: Icon, accent }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => !isBusy && openWorkspace({ id, domain: id, label })}
                      disabled={isBusy}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ borderColor: COLORS.border, background: COLORS.surfaceSoft, color: COLORS.textMuted }}
                      onMouseEnter={(e) => {
                        if (!isBusy) {
                          e.currentTarget.style.borderColor = accent;
                          e.currentTarget.style.background = COLORS.surfaceRaised;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = COLORS.border;
                        e.currentTarget.style.background = COLORS.surfaceSoft;
                      }}
                    >
                      <Icon size={13} style={{ color: accent }} />
                      {label}
                    </button>
                  ))}
                </div>

                <div
                  className="overflow-hidden rounded-[30px] border"
                  style={{
                    background: 'linear-gradient(180deg, rgba(17, 28, 38, 0.96) 0%, rgba(11, 19, 27, 0.98) 100%)',
                    borderColor: inputFocused ? COLORS.borderStrong : COLORS.border,
                    boxShadow: inputFocused ? `0 0 0 4px ${COLORS.accentSoft}` : COLORS.shadow,
                  }}
                >
                  <div className="flex items-start gap-3 px-4 pt-4">
                    <div
                      className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: COLORS.accentSoft, color: COLORS.accent }}
                    >
                      <Sparkles size={16} />
                    </div>

                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        const el = e.target;
                        el.style.height = 'auto';
                        el.style.height = `${Math.min(el.scrollHeight, 170)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (isBusy) {
                            cancelStream();
                          } else {
                            handleSend();
                          }
                        }
                      }}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      placeholder="Ask anything about overdue invoices, payment collection, monthly spend, or compliance deadlines"
                      className="min-h-[52px] w-full resize-none border-none bg-transparent pb-2 pt-1 text-[15px] leading-[1.75] outline-none placeholder:opacity-100"
                      style={{
                        color: COLORS.text,
                        maxHeight: 170,
                        scrollbarWidth: 'none',
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-3 border-t px-3 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: COLORS.border }}>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]" style={{ color: COLORS.textFaint }}>
                      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: COLORS.border, background: 'rgba(255,255,255,0.02)' }}>
                        <Bot size={12} style={{ color: COLORS.accent }} />
                        Finance answer mode
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: COLORS.border, background: 'rgba(255,255,255,0.02)' }}>
                        <Globe size={12} style={{ color: '#8fb7ff' }} />
                        Enter to send
                      </span>
                      {query.trim() ? (
                        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: COLORS.border, background: 'rgba(255,255,255,0.02)' }}>
                          <BookOpen size={12} style={{ color: COLORS.textMuted }} />
                          Shift+Enter for a new line
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={startListening}
                        disabled={isBusy}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl transition-all disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          border: `1px solid ${isListening ? COLORS.dangerSoft : COLORS.border}`,
                          background: isListening ? COLORS.dangerSoft : COLORS.surfaceSoft,
                          color: isListening ? COLORS.danger : COLORS.textMuted,
                        }}
                      >
                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (isBusy) {
                            cancelStream();
                          } else {
                            handleSend();
                          }
                        }}
                        disabled={!isBusy && !query.trim()}
                        className="flex h-10 min-w-[48px] items-center justify-center rounded-2xl px-3 transition-all disabled:cursor-not-allowed disabled:opacity-40"
                        style={
                          isBusy
                            ? { background: COLORS.text, color: COLORS.bg }
                            : query.trim()
                            ? { background: COLORS.text, color: COLORS.bg }
                            : { background: COLORS.surfaceSoft, color: COLORS.textFaint, border: `1px solid ${COLORS.border}` }
                        }
                      >
                        {isBusy ? <Square size={14} fill="currentColor" /> : <ArrowUp size={16} strokeWidth={2.5} />}
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
