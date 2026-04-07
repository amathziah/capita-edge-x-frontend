import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Mic, MicOff, Zap, RotateCcw, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '@/services/aiService';
import { usePersona } from '@/contexts/PersonaContext';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import * as LucideIcons from 'lucide-react';
import { GENERAL_CHAT_STEPS } from '@/utils/aiLoadingSteps';
import { AIWorkspaceRenderer } from '../components/AIWorkspaceRenderer';

const IconMap: Record<string, any> = {
  TrendingUp: LucideIcons.TrendingUp,
  CreditCard: LucideIcons.CreditCard,
  FileText: LucideIcons.FileText,
  Zap: LucideIcons.Zap,
  Users: LucideIcons.Users,
  Activity: LucideIcons.Activity,
  Clock: LucideIcons.Clock,
  AlertTriangle: LucideIcons.AlertTriangle,
  RotateCcw: LucideIcons.RotateCcw,
  ShieldCheck: LucideIcons.ShieldCheck,
};

// ─── Types ──────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  sender: 'user' | 'bot';
  /** Raw text — never contains the ▌ cursor character */
  text: string;
  data?: any;
  uiBlocks?: Array<{ component: string; data: any }>;
  uiComponent?: string;
  uiData?: any;
  timestamp: Date;
  /** 'streaming' replaces the old 'sending' so the distinction is clearer */
  status?: 'streaming' | 'sent' | 'error';
  usage?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

const TEAL = '#2dd4bf';

const formatTime = (d: any) => {
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime())
    ? '--:--'
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ─── Markdown renderers ──────────────────────────────────────────────────────
const botMd: Components = {
  p: ({ children }) => (
    <p className="mb-2.5 last:mb-0 leading-[1.75] text-[13px] text-gray-300">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-2.5 space-y-1.5 pl-0 list-none">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2.5 space-y-1.5 pl-5 list-decimal text-gray-300 text-[13px]">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-[13px] text-gray-300 leading-[1.65]">
      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 flex-none" />
      <span className="flex-1 min-w-0">{children}</span>
    </li>
  ),
  h1: ({ children }) => (
    <h1 className="text-[15px] font-black text-white mt-5 mb-2 tracking-tight border-b border-white/10 pb-2">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[13px] font-bold text-teal-400 mt-4 mb-2 uppercase tracking-widest">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[13px] font-semibold text-white/90 mt-3 mb-1">{children}</h3>
  ),
  hr: () => (
    <hr className="my-4 border-0 h-px bg-gradient-to-r from-teal-500/20 via-white/10 to-transparent" />
  ),
  blockquote: ({ children }) => (
    <div className="my-3 pl-3 border-l-2 border-teal-400/50 bg-teal-400/5 rounded-r-lg py-2 pr-3 text-[12px] text-teal-300/90 italic">
      {children}
    </div>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-black/30 shadow-xl shadow-black/20">
      <table className="w-full text-left text-[12px] border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/[0.04] text-[10px] font-bold uppercase tracking-widest text-teal-400/80 border-b border-white/10">
      {children}
    </thead>
  ),
  th: ({ children }) => <th className="px-4 py-3 whitespace-nowrap">{children}</th>,
  tbody: ({ children }) => (
    <tbody className="divide-y divide-white/[0.04]">{children}</tbody>
  ),
  td: ({ children }) => <td className="px-4 py-2.5 text-gray-300">{children}</td>,
  tr: ({ children }) => (
    <tr className="hover:bg-white/[0.02] transition-colors duration-150">{children}</tr>
  ),
  strong: ({ children }) => (
    <strong className="text-teal-300 font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="text-gray-400 italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-teal-400 underline underline-offset-2 decoration-teal-400/30 hover:decoration-teal-400 transition-all"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) =>
    /language-/.test(className || '') ? (
      <pre className="bg-[#0d1117] rounded-xl p-4 overflow-x-auto my-3 border border-white/[0.06] shadow-inner">
        <code className="font-mono text-[11px] text-emerald-400/90 leading-relaxed">
          {children}
        </code>
      </pre>
    ) : (
      <code className="bg-white/[0.08] px-1.5 py-0.5 rounded-md font-mono text-[11px] text-teal-300 border border-white/[0.06]">
        {children}
      </code>
    ),
};

const userMd: Components = {
  p: ({ children }) => (
    <p className="mb-0.5 leading-relaxed text-[13px]">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
};

// ─── Robot SVG ───────────────────────────────────────────────────────────────
function RobotSVG({ size = 56, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      style={animate ? { animation: 'robot-float 3s ease-in-out infinite' } : {}}
    >
      <line x1="28" y1="2" x2="28" y2="10" stroke={TEAL} strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="2" r="2.5" fill={TEAL} />
      <rect x="10" y="10" width="36" height="28" rx="8" fill="rgba(255,255,255,0.06)" stroke={TEAL} strokeWidth="1.5" />
      <circle cx="21" cy="24" r="5" fill="rgba(0,0,0,0.4)" stroke={TEAL} strokeWidth="1" />
      <circle cx="35" cy="24" r="5" fill="rgba(0,0,0,0.4)" stroke={TEAL} strokeWidth="1" />
      <circle cx="21" cy="24" r="2.5" fill="#fff"
        style={animate ? { animation: 'eye-glow 2s ease-in-out infinite' } : {}} />
      <circle cx="35" cy="24" r="2.5" fill="#fff"
        style={animate ? { animation: 'eye-glow 2s ease-in-out infinite 0.3s' } : {}} />
      <rect x="20" y="33" width="16" height="3" rx="1.5" fill={TEAL} opacity="0.7" />
      <rect x="24" y="38" width="8" height="4" rx="2" fill={TEAL} opacity="0.5" />
      <rect x="8" y="42" width="40" height="12" rx="6" fill="rgba(255,255,255,0.05)" stroke={TEAL} strokeWidth="1.5" />
      <circle cx="20" cy="48" r="2" fill={TEAL} opacity="0.6" />
      <circle cx="28" cy="48" r="2" fill={TEAL} opacity="0.8" />
      <circle cx="36" cy="48" r="2" fill={TEAL} opacity="0.6" />
      <rect x="5" y="18" width="5" height="8" rx="2" fill={TEAL} opacity="0.4" />
      <rect x="46" y="18" width="5" height="8" rx="2" fill={TEAL} opacity="0.4" />
    </svg>
  );
}

// ─── Sidebar action card ──────────────────────────────────────────────────────
function SidebarActionCard({
  action,
  onClick,
  disabled,
}: {
  action: any;
  onClick: () => void;
  disabled?: boolean;
}) {
  const Icon = typeof action.icon === 'string' ? IconMap[action.icon] || Zap : action.icon;

  return (
    <motion.button
      whileHover={!disabled ? { x: 2 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left
        border transition-all relative overflow-hidden group
        ${disabled
          ? 'opacity-40 cursor-not-allowed bg-white/[0.01] border-white/[0.04]'
          : 'bg-white/[0.02] border-white/[0.06] hover:bg-teal-500/[0.06] hover:border-teal-500/25 cursor-pointer'
        }
      `}
    >
      {!disabled && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/15 group-hover:bg-teal-500/20 transition-colors shrink-0">
        <Icon size={11} className="text-teal-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-[11px] font-semibold text-gray-200 truncate leading-tight">
            {action.label}
          </span>
          <span className="text-[7px] font-black tracking-widest uppercase text-teal-500/60 shrink-0">
            {action.tag}
          </span>
        </div>
        {!disabled && (
          <span className="text-[9px] text-gray-600 group-hover:text-teal-500/70 transition-colors font-medium">
            Ask Capita →
          </span>
        )}
      </div>
    </motion.button>
  );
}

// ─── Generative UI Renderer ───────────────────────────────────────────────────
function GenerativeUIRenderer({ component, data }: { component: string; data: any }) {
  return <AIWorkspaceRenderer component={component} data={data} />;
}

// ─── Streaming cursor — rendered as a React element, never injected into text ─
function StreamingCursor() {
  return <span className="ai-streaming-cursor" />;
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────
function ChatBubble({
  msg,
  onConfirmAction,
  onCancelAction,
}: {
  msg: Message;
  onConfirmAction?: () => void;
  onCancelAction?: () => void;
}) {
  const isBot = msg.sender === 'bot';
  const isStreaming = isBot && msg.status === 'streaming';
  const isPendingAction = msg.data?.type === 'action_prompt';
  const actionPromptMessage =
    isPendingAction && typeof msg.data?.action?.confirmationMessage === 'string'
      ? msg.data.action.confirmationMessage
      : null;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine whether we're waiting for the very first token
  const isWaitingForFirstToken =
    isStreaming && !(msg.uiBlocks?.length || msg.uiComponent) && msg.text.trim().length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`flex items-end gap-2.5 w-full ${isBot ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      {isBot ? (
        <div
          className="relative w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}
        >
          <RobotSVG size={18} animate={isStreaming} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-400 border border-[#0c0f1a]">
            <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-60" />
          </span>
        </div>
      ) : (
        <div
          className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-[10px] text-gray-400 font-black font-mono">ME</span>
        </div>
      )}

      <div className={`flex flex-col gap-1 ${isBot ? 'items-start' : 'items-end'} max-w-[82%]`}>
        {/* Bubble */}
        <motion.div
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={
            isBot
              ? {
                background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              }
              : {
                background: 'linear-gradient(135deg, rgba(45,212,191,0.18) 0%, rgba(6,182,212,0.12) 100%)',
                border: '1px solid rgba(45,212,191,0.22)',
                boxShadow: '0 4px 16px rgba(45,212,191,0.08)',
              }
          }
        >
          {isBot && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background:
                  'linear-gradient(90deg, rgba(45,212,191,0.4) 0%, rgba(45,212,191,0.15) 50%, transparent 100%)',
              }}
            />
          )}

          {isBot && (
            <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
              <span className="text-[9px] font-black tracking-[0.15em] uppercase text-teal-500/60">
                Capita
              </span>
              <span className="text-[9px] text-white/10">·</span>
              <span className="text-[9px] text-white/25 font-medium">Strategic AI</span>
            </div>
          )}

          <div className={`px-4 ${isBot ? 'pt-0.5 pb-3.5' : 'py-2.5'}`}>
            {/* Generative UI card */}
            {msg.uiBlocks && msg.uiBlocks.length > 0 && (
              <div className="mb-4 mt-2 space-y-3">
                {msg.uiBlocks.map((block, index) => (
                  <GenerativeUIRenderer key={`${block.component}_${index}`} component={block.component} data={block.data} />
                ))}
              </div>
            )}

            {!msg.uiBlocks?.length && msg.uiComponent && (
              <div className="mb-4 mt-2">
                <GenerativeUIRenderer component={msg.uiComponent} data={msg.uiData} />
              </div>
            )}

            {/* Text content */}
            <div className={isBot ? 'text-gray-300' : 'text-gray-100'}>
              {isWaitingForFirstToken ? (
                /* Pure skeleton dots — no text yet at all */
                <span className="text-[13px] text-gray-600 tracking-widest animate-pulse">…</span>
              ) : msg.text.length > 0 ? (
                <>
                  <ReactMarkdown components={isBot ? botMd : userMd}>
                    {msg.text}
                  </ReactMarkdown>
                  {/* Cursor is a React element — never touches the markdown string */}
                  {isStreaming && <StreamingCursor />}
                </>
              ) : (msg.uiBlocks?.length || msg.uiComponent) ? (
                // UI component rendered above, text is empty — still show cursor if streaming
                isStreaming ? <StreamingCursor /> : null
              ) : null}
            </div>

            {/* Stat chip */}
            {msg.data?.type === 'stat' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xl font-black text-teal-300"
                style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}
              >
                ₹{msg.data.value.toLocaleString()}
              </motion.div>
            )}

            {/* Action prompt */}
            {isPendingAction && (
              <div className="mt-4 space-y-3">
                {actionPromptMessage && (
                  <div
                    className="rounded-xl px-3 py-2 text-[12px] font-medium text-teal-100"
                    style={{
                      background: 'rgba(45,212,191,0.08)',
                      border: '1px solid rgba(45,212,191,0.15)',
                    }}
                  >
                    {actionPromptMessage}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={onConfirmAction}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all hover:scale-[1.02] active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #2dd4bf, #06b6d4)', color: '#0c0f1a' }}
                  >
                    Go ahead →
                  </button>
                  <button
                    onClick={onCancelAction}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all hover:bg-white/10"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer: timestamp + copy */}
        <div className={`flex items-center gap-2 px-1 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
          <span className="text-[9px] text-gray-600 font-mono">{formatTime(msg.timestamp)}</span>
          {isBot && msg.status !== 'streaming' && (
            <button
              onClick={handleCopy}
              className="text-[9px] text-gray-600 hover:text-teal-400 transition-colors font-medium tracking-wide"
            >
              {copied ? '✓ copied' : 'copy'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Thinking skeleton ────────────────────────────────────────────────────────
function ThinkingSkeleton({ step }: { step: string }) {
  return (
    <div className="flex items-end gap-2.5">
      <div
        className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
        style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}
      >
        <RobotSVG size={18} animate />
      </div>
      <div className="flex flex-col gap-1.5">
        <div
          className="h-8 w-52 rounded-2xl animate-pulse"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />
        <div className="flex items-center gap-1.5 px-1">
          <div className="w-1 h-1 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest animate-pulse">
            {step}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center select-none">
      <div className="relative mb-5">
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${TEAL}44 0%, transparent 70%)`,
            transform: 'scale(2.2)',
            filter: 'blur(16px)',
          }}
        />
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center bg-teal-500/10 border border-teal-500/20"
        >
          <RobotSVG size={44} />
        </motion.div>
      </div>
      <h3 className="text-white font-bold text-[15px] mb-2 tracking-tight">Hey, I'm Capita</h3>
      <p className="text-gray-500 text-[12px] leading-relaxed max-w-xs">
        Ask about invoices, payments, expenses, or compliance and I will answer from your live workspace data.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-teal-400 animate-pulse" />
        <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Ready to help</span>
        <div className="w-1 h-1 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function AIAssistantPage() {
  const { businessType } = usePersona();
  const navigate = useNavigate();
  const STORAGE_KEY = `capita_ai_config_${businessType || 'default'}`;

  const [dynamicConfig, setDynamicConfig] = useState<{ meta: any; actions: any[] }>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error('Cache read error:', e);
    }
    return { meta: { greeting: '', label: 'Finance', color: TEAL }, actions: [] };
  });

  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isChatReady, setIsChatReady] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');

  /**
   * isThinking  — waiting for the first token (show skeleton)
   * isStreaming  — first token arrived, text is flowing in
   * We keep isTyping as the union of both for backward-compat with disabled states.
   */
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(GENERAL_CHAT_STEPS[0]);

  // Derived convenience flag
  const isBusy = isThinking || messages.some(m => m.status === 'streaming');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingMsgIdRef = useRef<string | null>(null);
  const historyLoadRequestRef = useRef(0);
  const activeStreamRequestRef = useRef(0);
  const messagesRef = useRef<Message[]>([]);
  const currentConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const isNearBottom = () => {
    if (!scrollRef.current) return true;
    const el = scrollRef.current;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const cancelActiveStream = useCallback(() => {
    activeStreamRequestRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const streamingId = streamingMsgIdRef.current;
    if (streamingId) {
      setMessages(prev => prev.filter(m => m.id !== streamingId));
      streamingMsgIdRef.current = null;
    }
    setIsThinking(false);
  }, []);

  const resetChatContext = useCallback(() => {
    cancelActiveStream();
    historyLoadRequestRef.current += 1;
    setPendingAction(null);
    setMessages([]);
    messagesRef.current = [];
    setCurrentConversationId(null);
    currentConversationIdRef.current = null;
  }, [cancelActiveStream]);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const requestId = ++historyLoadRequestRef.current;
      try {
        setIsChatReady(false);
        setIsHistoryLoading(true);
        const config = await aiService.getConfig(businessType as string | undefined);
        if (historyLoadRequestRef.current !== requestId) return;
        setDynamicConfig(config as any);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

        const sessions = await aiService.getConversations();
        if (historyLoadRequestRef.current !== requestId) return;
        setConversations(sessions as any[]);

        if (!currentConversationId) {
          const history = await aiService.getHistory();
          if (historyLoadRequestRef.current !== requestId) return;
          if (Array.isArray(history) && history.length > 0) {
            setMessages(
              history.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
            );
            // Scroll to bottom after setting messages
            setTimeout(() => scrollToBottom(), 100);
          } else {
            setMessages([]);
          }
        }
      } catch (err) {
        console.error('Failed to init AI page:', err);
      }
      finally {
        if (historyLoadRequestRef.current === requestId) {
          setIsHistoryLoading(false);
          setIsChatReady(true);
        }
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessType, STORAGE_KEY]);

  // ── Auto-scroll on new messages ──────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0 && isNearBottom()) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // ── Step label cycling ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isThinking) {
      setCurrentStep(GENERAL_CHAT_STEPS[0]);
      return;
    }
    let idx = 0;
    const iv = setInterval(() => {
      idx = (idx + 1) % GENERAL_CHAT_STEPS.length;
      setCurrentStep(GENERAL_CHAT_STEPS[idx]);
    }, 1800);
    return () => clearInterval(iv);
  }, [isThinking]);

  // ── Focus input on mount ──────────────────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Scroll FAB visibility ─────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (textOverride?: string) => {
    const text = (textOverride || query).trim();
    if (!text || !isChatReady || isHistoryLoading || isConversationLoading) return;

    cancelActiveStream();
    const streamRequestId = activeStreamRequestRef.current;

    const userMsg: Message = {
      id: `user_${Date.now()}_${Math.random()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
      status: 'sent',
    };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsThinking(true);
    
    // Scroll to bottom to show question + thinking skeleton
    // The small delay ensures the DOM has updated with the user message
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);

    // Build conversation history for the AI context window
    const rawHistory = messagesRef.current
      .filter(m => m.status !== 'streaming' && m.status !== 'error' && m.text.trim().length > 0)
      .slice(-10)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text.trim() }],
      }));
    while (rawHistory.length > 0 && rawHistory[0].role === 'model') rawHistory.shift();

    const abort = new AbortController();
    abortControllerRef.current = abort;

    try {
      const stream = aiService.chatStream(
        {
          query: text,
          businessType: businessType || undefined,
          persona: businessType || undefined,
          history: rawHistory,
          conversationId: currentConversationIdRef.current || undefined,
        },
        abort.signal
      );

      let accumulatedText = '';
      let botMsgId: string | null = null;
      let firstToken = true;
      let pendingUiBlocks: Array<{ component: string; data: any }> = [];

      for await (const event of stream) {
        if (abort.signal.aborted || activeStreamRequestRef.current !== streamRequestId) break;

        if (event.type === 'gen_ui') {
          pendingUiBlocks = [...pendingUiBlocks, { component: event.component, data: event.data }];

          if (botMsgId) {
            setMessages(prev =>
              prev.map(m =>
                m.id === botMsgId
                  ? {
                      ...m,
                      uiBlocks: pendingUiBlocks,
                      uiComponent: pendingUiBlocks[0]?.component,
                      uiData: pendingUiBlocks[0]?.data,
                    }
                  : m
              )
            );
          }

        } else if (event.type === 'token') {
          accumulatedText += event.text;

          if (firstToken) {
            // First token — dismiss the skeleton, create the bubble
            firstToken = false;
            setIsThinking(false);

            if (!botMsgId) {
              botMsgId = `bot_${Date.now()}_${Math.random()}`;
              streamingMsgIdRef.current = botMsgId;
              setMessages(prev => [
                ...prev,
                {
                  id: botMsgId!,
                  sender: 'bot',
                  text: accumulatedText,
                  timestamp: new Date(),
                  status: 'streaming',
                  uiBlocks: pendingUiBlocks,
                  uiComponent: pendingUiBlocks[0]?.component,
                  uiData: pendingUiBlocks[0]?.data,
                },
              ]);
              setTimeout(() => scrollToBottom(), 50);
            } else {
              setMessages(prev =>
                prev.map(m =>
                  m.id === botMsgId
                    ? {
                        ...m,
                        text: accumulatedText,
                        status: 'streaming',
                        uiBlocks: pendingUiBlocks.length > 0 ? pendingUiBlocks : m.uiBlocks,
                        uiComponent: pendingUiBlocks[0]?.component || m.uiComponent,
                        uiData: pendingUiBlocks[0]?.data ?? m.uiData,
                      }
                    : m
                )
              );
            }
          } else {
            // Subsequent tokens — just update text
            setMessages(prev =>
              prev.map(m =>
                m.id === botMsgId ? { ...m, text: accumulatedText } : m
              )
            );
          }

        } else if (event.type === 'complete') {
          setIsThinking(false);
          const resolvedText =
            (typeof event.text === 'string' && event.text.trim().length > 0)
              ? event.text
              : (typeof event.action?.confirmationMessage === 'string' ? event.action.confirmationMessage : accumulatedText);

          // If we never created a bubble (e.g. only gen_ui events, no tokens), create it now
          if (!botMsgId) {
            botMsgId = `bot_${Date.now()}_${Math.random()}`;
            streamingMsgIdRef.current = botMsgId;
          }

          setMessages(prev =>
            prev.some(m => m.id === botMsgId)
              ? prev.map(m =>
                  m.id === botMsgId
                    ? {
                        ...m,
                        text: resolvedText,
                        data: event.action
                          ? { type: 'action_prompt', action: event.action, traceId: event.traceId, meta: event.data }
                          : event.data,
                        usage: event.usage,
                        status: 'sent',
                        uiBlocks: pendingUiBlocks.length > 0 ? pendingUiBlocks : m.uiBlocks,
                        uiComponent: pendingUiBlocks[0]?.component || m.uiComponent,
                        uiData: pendingUiBlocks[0]?.data ?? m.uiData,
                      }
                    : m
                )
              : [
                  ...prev,
                  {
                    id: botMsgId,
                    sender: 'bot',
                    text: resolvedText,
                    timestamp: new Date(),
                    status: 'sent',
                    data: event.action
                      ? { type: 'action_prompt', action: event.action, traceId: event.traceId, meta: event.data }
                      : event.data,
                    usage: event.usage,
                    uiBlocks: pendingUiBlocks,
                    uiComponent: pendingUiBlocks[0]?.component,
                    uiData: pendingUiBlocks[0]?.data,
                  },
                ]
          );

          if (event.action) setPendingAction(event.action);

          if (event.conversationId && !currentConversationIdRef.current) {
            currentConversationIdRef.current = event.conversationId;
            setCurrentConversationId(event.conversationId);
            const sessions = await aiService.getConversations();
            if (activeStreamRequestRef.current === streamRequestId) {
              setConversations(sessions as any[]);
            }
          }

        } else if (event.type === 'error') {
          setIsThinking(false);

          if (!botMsgId) {
            botMsgId = `bot_${Date.now()}_${Math.random()}`;
            streamingMsgIdRef.current = botMsgId;
            setMessages(prev => [
              ...prev,
              {
                id: botMsgId!,
                sender: 'bot',
                text: `⚠️ ${event.message || 'An error occurred. Please try again.'}`,
                timestamp: new Date(),
                status: 'error',
              },
            ]);
          } else {
            setMessages(prev =>
              prev.map(m =>
                m.id === botMsgId
                  ? { ...m, text: `⚠️ ${event.message || 'An error occurred.'}`, status: 'error' }
                  : m
              )
            );
          }
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (activeStreamRequestRef.current !== streamRequestId) return;
      setIsThinking(false);
      const fallbackId = `bot_err_${Date.now()}_${Math.random()}`;
      setMessages(prev => [
        ...prev,
        {
          id: fallbackId,
          sender: 'bot',
          text: '⚠️ I encountered an issue processing your request. Please try again.',
          timestamp: new Date(),
          status: 'error',
        },
      ]);
    } finally {
      if (activeStreamRequestRef.current === streamRequestId) {
        if (abortControllerRef.current === abort) abortControllerRef.current = null;
        streamingMsgIdRef.current = null;
        setIsThinking(false);
      }
    }
  };

  // ── Confirm / cancel pending action ──────────────────────────────────────
  const handleConfirmAction = () => {
    if (!pendingAction) return;
    const { type, data, initialData, requiresServerExecution } = pendingAction;

    const run = async () => {
      if (requiresServerExecution) {
        const execution = await aiService.executeAction(pendingAction);
        const result = (execution as any)?.result;
        setPendingAction(null);
        setMessages(prev => [
          ...prev.filter(m => m.data?.type !== 'action_prompt'),
          {
            id: `action_done_${Date.now()}`,
            sender: 'bot',
            text: result?.message || 'Action executed successfully.',
            timestamp: new Date(),
            status: 'sent',
            data: result,
          },
        ]);
        return;
      }

      if (type === 'open_invoice_modal' || type === 'EXECUTE_ACTION') {
        const detail =
          data && type === 'EXECUTE_ACTION'
            ? {
                buyer: { name: data.customer, phone: '' },
                items: [
                  {
                    description: data.description || 'Service',
                    quantity: 1,
                    price: data.amount,
                    unit: 'Qty',
                    discount: 0,
                  },
                ],
              }
            : initialData || data;
        window.dispatchEvent(new CustomEvent('open-invoice-modal', { detail }));
      } else if (type === 'open_customer_modal') {
        window.dispatchEvent(new CustomEvent('open-customer-modal', { detail: data || initialData }));
      } else if (type === 'navigate' && data?.to) {
        let p = data.to;
        if (
          p.startsWith('/') &&
          !p.startsWith('/dashboard') &&
          !['/login', '/setup', '/pricing'].includes(p)
        )
          p = `/dashboard${p === '/' ? '' : p}`;
        navigate(p);
      }

      setPendingAction(null);
      setMessages(prev => [
        ...prev.filter(m => m.data?.type !== 'action_prompt'),
        {
          id: `action_done_${Date.now()}`,
          sender: 'bot',
          text: 'Done! Executing the requested action now.',
          timestamp: new Date(),
          status: 'sent',
        },
      ]);
    };

    run().catch((error) => {
      console.error('AI action execution failed:', error);
      setPendingAction(null);
      setMessages(prev => [
        ...prev.filter(m => m.data?.type !== 'action_prompt'),
        {
          id: `action_err_${Date.now()}`,
          sender: 'bot',
          text: 'I could not execute that action. Please try again.',
          timestamp: new Date(),
          status: 'error',
        },
      ]);
    });
  };

  const handleCancelAction = () => {
    setPendingAction(null);
    setMessages(prev => [
      ...prev.filter(m => m.data?.type !== 'action_prompt'),
      {
        id: `action_cancel_${Date.now()}`,
        sender: 'bot',
        text: "No problem. I'll stay on this page.",
        timestamp: new Date(),
        status: 'sent',
      },
    ]);
  };

  // ── Load past conversation ────────────────────────────────────────────────
  const loadConversation = async (id: string) => {
    if (id === currentConversationId || isBusy || isConversationLoading) return;
    const requestId = ++historyLoadRequestRef.current;
    try {
      cancelActiveStream();
      setPendingAction(null);
      setIsConversationLoading(true);
      setMessages([]);
      messagesRef.current = [];
      const msgs = await aiService.getConversationMessages(id);
      if (historyLoadRequestRef.current !== requestId) return;
      setMessages((msgs as any[]).map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      setCurrentConversationId(id);
      currentConversationIdRef.current = id;
      setTimeout(() => scrollToBottom(), 50);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
    finally {
      if (historyLoadRequestRef.current === requestId) {
        setIsConversationLoading(false);
      }
    }
  };

  // ── Clear chat ────────────────────────────────────────────────────────────
  const clearChat = async () => {
    try {
      resetChatContext();
      await aiService.deleteHistory();
      const sessions = await aiService.getConversations();
      setConversations(sessions as any[]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  // ── Voice input ───────────────────────────────────────────────────────────
  const startListening = () => {
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported.'); return; }
    const r = new SR();
    r.lang = 'en-US';
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

  const { actions } = dynamicConfig;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/*
        Inject the cursor keyframe once — avoids repeating inline animation
        definitions on every StreamingCursor render.
      */}
      <style>{`
        @keyframes capita-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes robot-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes eye-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div 
        className="flex flex-col w-full max-w-[1400px] mx-auto h-full px-4 pb-4 pt-4 lg:pt-6 overflow-hidden cursor-pointer"
        onClick={(e) => { if (e.target === e.currentTarget) navigate('/dashboard'); }}
      >
        {/* Outer shell */}
        <div className="
          flex flex-col flex-1 min-h-0 overflow-hidden relative cursor-default
          bg-[#0c0f1a] rounded-2xl lg:rounded-3xl
          border border-white/[0.07]
          shadow-[0_0_60px_-15px_rgba(45,212,191,0.18)]
          font-sans text-gray-300
        ">
          {/* Background glows */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div
              className="absolute -top-1/3 right-0 w-[500px] h-[500px] rounded-full opacity-[0.18]"
              style={{ background: `radial-gradient(circle, ${TEAL} 0%, transparent 65%)`, filter: 'blur(50px)' }}
            />
            <div
              className="absolute -bottom-1/3 -left-1/4 w-[400px] h-[400px] rounded-full opacity-[0.12]"
              style={{ background: `radial-gradient(circle, ${TEAL} 0%, transparent 65%)`, filter: 'blur(50px)' }}
            />
          </div>

          {/* ── TOP BAR ── */}
          <div className="relative z-20 shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#090c13]/80 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-500/10 border border-teal-500/20 shrink-0">
                <RobotSVG size={20} />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-tight">Capita AI</span>
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-colors
                  ${isBusy
                    ? 'opacity-40 cursor-not-allowed text-gray-600 border-gray-600/20 bg-gray-600/10'
                    : 'text-teal-400 border-teal-500/20 bg-teal-500/10 hover:bg-teal-500/20'
                  }`}
              >
                <RotateCcw size={9} /> Reset
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-gray-500 hover:text-white hover:bg-white/[0.08] transition-all"
                title="Close AI Assistant"
              >
                <LucideIcons.X size={14} />
              </button>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="flex flex-1 min-h-0 relative z-10 overflow-hidden">

            {/* ── LEFT SIDEBAR ── */}
            <div className="w-52 lg:w-64 shrink-0 flex flex-col border-r border-white/[0.06] bg-[#07090f]/90 backdrop-blur-xl overflow-hidden">

              {/* Presets */}
              <div className="px-3 pt-3.5 pb-2.5 border-b border-white/[0.05] shrink-0">
                <span className="text-[8px] font-black text-gray-500 tracking-widest uppercase">Presets</span>
              </div>
              <div
                className="overflow-y-auto py-2 px-2 space-y-1 shrink-0"
                style={{ maxHeight: '35%', scrollbarWidth: 'none' }}
              >
                {actions.map((action: any, i: number) => (
                  <SidebarActionCard
                    key={i}
                    action={action}
                    onClick={() => handleSend(action.query)}
                    disabled={isBusy}
                  />
                ))}
              </div>

              {/* History */}
              <div className="px-3 pt-3.5 pb-2.5 border-t border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between shrink-0">
                <span className="text-[8px] font-black text-teal-500/70 tracking-widest uppercase">Recent Advice</span>
                <button
                  onClick={() => { if (!isBusy) { resetChatContext(); } }}
                  disabled={isBusy}
                  className={`text-[8px] font-black uppercase tracking-widest transition-colors ${
                    isBusy ? 'text-gray-700 cursor-not-allowed' : 'text-gray-500 hover:text-white pointer-events-auto'
                  }`}
                >
                  + New
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 bg-[#090c14]/40" style={{ scrollbarWidth: 'none' }}>
                {isHistoryLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 mx-1 rounded-lg bg-white/[0.02] border border-white/[0.03] animate-pulse" />
                  ))
                ) : conversations.length > 0 ? (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => !isBusy && loadConversation(conv.id)}
                      disabled={isBusy}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all group flex flex-col gap-1 ${
                        isBusy ? 'opacity-40 cursor-not-allowed' : ''
                      } ${currentConversationId === conv.id
                        ? 'bg-teal-500/10 border-teal-500/30 ring-1 ring-teal-500/20'
                        : 'border-transparent hover:bg-white/[0.03] grayscale hover:grayscale-0'
                        }`}
                    >
                      <span className={`text-[10px] font-bold truncate ${currentConversationId === conv.id ? 'text-teal-400' : 'text-gray-400 group-hover:text-gray-200'
                        }`}>
                        {conv.title}
                      </span>
                      <span className="text-[7px] font-mono text-gray-600 uppercase tracking-tighter">
                        {new Date(conv.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric',
                        })}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-20 opacity-30">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">No History Yet</span>
                  </div>
                )}
              </div>

              <div className="px-3 py-3.5 border-t border-white/[0.05] bg-black/20 shrink-0">
                <span className="text-[8px] text-gray-700 font-bold uppercase tracking-widest opacity-60 italic leading-none">
                  Finance engine · Encrypted
                </span>
              </div>
            </div>

            {/* ── CHAT AREA ── */}
            <div className="flex flex-col flex-1 min-w-0 min-h-0 relative">

              {/* Messages scroll */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
              >
                {isConversationLoading ? (
                  <div className="max-w-3xl mx-auto px-5 pb-12 space-y-4 pt-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <div className="w-full max-w-[75%] h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 && !isThinking ? (
                  <EmptyState />
                ) : (
                  <div className="max-w-3xl mx-auto px-5 pb-12 space-y-6 pt-4">
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => {
                        const isFirstOfNewExchange = false;

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full"
                          >
                            {isFirstOfNewExchange && (
                              <div className="flex items-center gap-3 my-8 opacity-40 px-2">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-white/10" />
                                <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-black">
                                  Latest Request
                                </span>
                                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/10 to-white/10" />
                              </div>
                            )}

                            <ChatBubble
                              msg={msg}
                              onConfirmAction={handleConfirmAction}
                              onCancelAction={handleCancelAction}
                            />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Thinking skeleton — shown while waiting for the first token */}
                    <AnimatePresence>
                      {isThinking && (
                        <motion.div
                          key="thinking"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ThinkingSkeleton step={currentStep} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Voice listening indicator */}
                    <AnimatePresence>
                      {isListening && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex justify-center"
                        >
                          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                            <Mic size={12} className="animate-pulse" />
                            <span className="text-[9px] font-black tracking-widest uppercase">Listening…</span>
                            <div className="flex gap-1 items-center h-3">
                              {[3, 5, 4, 7, 3].map((h, i) => (
                                <div
                                  key={i}
                                  className="w-0.5 rounded-full bg-red-400 animate-pulse"
                                  style={{ height: h * 2, animationDuration: `${0.4 + i * 0.1}s` }}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="h-4 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Scroll-to-bottom FAB */}
              <AnimatePresence>
                {showScrollBtn && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => scrollToBottom()}
                    className="absolute bottom-20 right-4 z-50 w-8 h-8 rounded-full bg-[#161a2b] border border-white/[0.1] flex items-center justify-center cursor-pointer shadow-xl hover:bg-white/[0.08] transition-colors"
                  >
                    <ChevronDown size={15} className="text-gray-400" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* ── INPUT BAR ── */}
              <div className="shrink-0 border-t border-white/[0.06] bg-[#090c13]/80 backdrop-blur-sm px-4 py-3">
                <div
                  className={`
                    flex items-center gap-2 rounded-2xl px-3 py-2 border transition-all
                    ${inputFocused
                      ? 'border-teal-400/60 ring-2 ring-teal-500/15 bg-[#141820]'
                      : 'border-white/[0.07] hover:border-white/[0.12] bg-white/[0.02]'
                    }
                  `}
                >
                  <div className="shrink-0 flex items-center gap-1.5 pr-2.5 border-r border-white/[0.07]">
                    <Zap size={13} className="text-teal-400" />
                    <span className="hidden sm:inline text-[9px] font-black uppercase text-teal-400 tracking-widest">
                      Capita
                    </span>
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Ask about invoices, payments, expenses, or compliance…"
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white py-1 px-1 placeholder-gray-600"
                    disabled={isBusy || isHistoryLoading || isConversationLoading || !isChatReady}
                  />

                  <div className="flex items-center gap-1 shrink-0">
                    <motion.button
                      whileHover={!isBusy ? { scale: 1.08 } : {}}
                      whileTap={!isBusy ? { scale: 0.92 } : {}}
                      onClick={startListening}
                      disabled={isBusy || isHistoryLoading || isConversationLoading || !isChatReady}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors
                        ${isListening
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : (isBusy || isHistoryLoading || isConversationLoading || !isChatReady)
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
                      disabled={!query.trim() || isBusy || isHistoryLoading || isConversationLoading || !isChatReady}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all relative overflow-hidden"
                      style={
                        query.trim() && !isBusy && !isHistoryLoading && !isConversationLoading && isChatReady
                          ? { background: `linear-gradient(135deg, ${TEAL}, #06b6d4)`, color: '#0a0d15' }
                          : { background: 'rgba(255,255,255,0.04)', color: '#374151', cursor: 'not-allowed' }
                      }
                    >
                      <Send size={13} />
                    </motion.button>
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between px-1">
                  <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">
                    {isConversationLoading
                      ? 'Loading conversation…'
                      : isHistoryLoading || !isChatReady
                        ? 'Preparing chat history…'
                        : 'Finance engine · Encrypted'}
                  </span>
                  {isListening && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">Rec</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
