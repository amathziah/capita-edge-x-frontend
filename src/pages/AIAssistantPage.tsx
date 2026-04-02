import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Mic, MicOff, Zap, RotateCcw, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService, delay } from '../services/aiService';
import { usePersona } from '../contexts/PersonaContext';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import * as LucideIcons from 'lucide-react';
import { GENERAL_CHAT_STEPS } from '../utils/aiLoadingSteps';

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

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  data?: any;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  usage?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

const TEAL = '#2dd4bf';
const formatTime = (d: any) => {
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ─── Markdown renderers ────────────────────────────────────────────────────────
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
      <span className="mt-[6px] w-1 h-1 rounded-full bg-teal-400 shrink-0" />
      <span>{children}</span>
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
  tbody: ({ children }) => <tbody className="divide-y divide-white/[0.04]">{children}</tbody>,
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
        <code className="font-mono text-[11px] text-emerald-400/90 leading-relaxed">{children}</code>
      </pre>
    ) : (
      <code className="bg-white/[0.08] px-1.5 py-0.5 rounded-md font-mono text-[11px] text-teal-300 border border-white/[0.06]">
        {children}
      </code>
    ),
};

const userMd: Components = {
  p: ({ children }) => <p className="mb-0.5 leading-relaxed text-[13px]">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
};

// ─── Robot SVG ─────────────────────────────────────────────────────────────────
function RobotSVG({ size = 56, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none"
      style={animate ? { animation: 'robot-float 3s ease-in-out infinite' } : {}}>
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

// ─── Sidebar action card ───────────────────────────────────────────────────────
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
      {/* Left accent bar on hover */}
      {!disabled && (
        <div
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}

      <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/15 group-hover:bg-teal-500/20 transition-colors shrink-0">
        <Icon size={11} className="text-teal-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-[11px] font-semibold text-gray-200 truncate leading-tight">{action.label}</span>
          <span className="text-[7px] font-black tracking-widest uppercase text-teal-500/60 shrink-0">{action.tag}</span>
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

// ─── Chat bubble ───────────────────────────────────────────────────────────────
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
  const isPendingAction = msg.data?.type === 'action_prompt';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-end gap-2.5 w-full ${isBot ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      {isBot ? (
        <div className="relative w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}>
          <RobotSVG size={18} />
          {/* Pulse indicator */}
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

      <div className={`flex flex-col gap-1 ${isBot ? 'items-start' : 'items-end'} max-w-[82%]`}>
        {/* Bubble */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={isBot ? {
            background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
          } : {
            background: 'linear-gradient(135deg, rgba(45,212,191,0.18) 0%, rgba(6,182,212,0.12) 100%)',
            border: '1px solid rgba(45,212,191,0.22)',
            boxShadow: '0 4px 16px rgba(45,212,191,0.08)',
          }}
        >
          {/* Top shimmer line for bot */}
          {isBot && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, rgba(45,212,191,0.4) 0%, rgba(45,212,191,0.15) 50%, transparent 100%)',
            }} />
          )}

          {/* Bot header label */}
          {isBot && (
            <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
              <span className="text-[9px] font-black tracking-[0.15em] uppercase text-teal-500/60">Capita</span>
              <span className="text-[9px] text-white/10">·</span>
              <span className="text-[9px] text-white/25 font-medium">Strategic AI</span>
            </div>
          )}

          <div className={`px-4 ${isBot ? 'pt-0.5 pb-3.5' : 'py-2.5'}`}>
            <div className={isBot ? 'text-gray-300' : 'text-gray-100'}>
              <ReactMarkdown components={isBot ? botMd : userMd}>{msg.text}</ReactMarkdown>
            </div>

            {msg.data?.type === 'stat' && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xl font-black text-teal-300"
                style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}
              >
                ₹{msg.data.value.toLocaleString()}
              </motion.div>
            )}

            {isPendingAction && (
              <div className="mt-4 flex items-center gap-2">
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
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer: timestamp + copy */}
        <div className={`flex items-center gap-2 px-1 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
          <span className="text-[9px] text-gray-600 font-mono">{formatTime(msg.timestamp)}</span>
          {isBot && (
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

// ─── Empty state ───────────────────────────────────────────────────────────────
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
        Ask me anything about your revenue, invoices, cash flow, or taxes.
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
    } catch (e) { console.error('Cache read error:', e); }
    return { meta: { greeting: '', label: 'Finance', color: TEAL }, actions: [] };
  });
  
  const [usageStats, setUsageStats] = useState({ usage: 0, limit: 0, percent: 0, remaining: 0 });
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(GENERAL_CHAT_STEPS[0]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch usage & config (Staggered to avoid RPM limits)
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Priority: Load Persona Config
        const config = await aiService.getConfig(businessType as string | undefined);
        setDynamicConfig(config as any);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        
        // 2. Stagger: Give Google a breather
        await delay(800);

        // 3. Load Budget Status
        try {
          // const budgetRes = await aiService.getBudget();
          // setBudget(budgetRes as any);
        } catch { /* Budget endpoint optional */ }

        await delay(300);
        
        // 4. Load Usage Stats
        const usage = await aiService.getUsage();
        setUsageStats(usage as any);

        await delay(200);

        // 5. Load Session List
        setIsHistoryLoading(true);
        const sessions = await aiService.getConversations();
        setConversations(sessions as any[]);
        setIsHistoryLoading(false);

        // 6. Load Latest Chat History (Fallback if no session selected)
        if (!currentConversationId) {
          const history = await aiService.getHistory();
          if (Array.isArray(history) && history.length > 0) {
            setMessages(history.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            })));
            // Force scroll to bottom after hydration
            setTimeout(() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'instant' });
              }
            }, 100);
          }
        }
      } catch (err) {
        console.error('Failed to init AI page:', err);
        setIsHistoryLoading(false);
      }
    };
    init();
  }, [businessType, STORAGE_KEY]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 140)
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  // AI Step cycling
  useEffect(() => {
    if (!isTyping) {
      setCurrentStep(GENERAL_CHAT_STEPS[0]);
      return;
    }
    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % GENERAL_CHAT_STEPS.length;
      setCurrentStep(GENERAL_CHAT_STEPS[stepIdx]);
    }, 1800);
    return () => clearInterval(interval);
  }, [isTyping]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  }, []);

  const scrollToBottom = () =>
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });

  const handleSend = async (textOverride?: string) => {
    if (isTyping) return;
    const text = (textOverride || query).trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text, timestamp: new Date(), status: 'sent' };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsTyping(true);

    try {
      // Build history context from current state EXCLUDING the user's latest message
      // (Gemini expects history of PAST turns; the current query is sent separately)
      const historyContext = messages.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const res = await api.post<any>(ENDPOINTS.AI_CHAT, { 
        query: text, 
        businessType: businessType || undefined, 
        history: historyContext,
        conversationId: currentConversationId || undefined
      });
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(), 
        sender: 'bot',
        text: res.text, 
        data: res.data, 
        usage: res.usage,
        timestamp: new Date(),
      };

      if (res.conversationId && !currentConversationId) {
        setCurrentConversationId(res.conversationId);
        // Refresh session list
        const sessions = await aiService.getConversations();
        setConversations(sessions as any[]);
      }

      if (res.action) {
        // Intercept action and ask for confirmation
        setPendingAction(res.action);
        botMsg.data = { ...botMsg.data, type: 'action_prompt' };
      }

      // Update usage if available
      if (res.usage?.totalTokenCount) {
        const updatedUsage = await aiService.getUsage();
        setUsageStats(updatedUsage as any);
      }
      setMessages(prev => [...prev, botMsg]);

      // Update budget from response if available
      // if (res.budget) setBudget(res.budget);

    } catch (err: any) {
      const errorMsg = 'I encountered an issue processing your request. Please try again in a moment.';
        
      setMessages(prev => [...prev, {
        id: Date.now().toString(), sender: 'bot',
        text: errorMsg,
        timestamp: new Date(), status: 'error',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;

    const { type, data, initialData } = pendingAction;
    
    // Execute the action
    if (type === 'open_invoice_modal' || type === 'EXECUTE_ACTION') {
      const detail = data && type === 'EXECUTE_ACTION'
        ? { buyer: { name: data.customer, phone: '' }, items: [{ description: data.description || 'Service', quantity: 1, price: data.amount, unit: 'Qty', discount: 0 }] }
        : (initialData || data);
      window.dispatchEvent(new CustomEvent('open-invoice-modal', { detail }));
    } else if (type === 'open_customer_modal') {
      window.dispatchEvent(new CustomEvent('open-customer-modal', { detail: data || initialData }));
    } else if (type === 'navigate' && data?.to) {
      let p = data.to;
      if (p.startsWith('/') && !p.startsWith('/dashboard') && !['/login', '/setup', '/pricing'].includes(p))
        p = `/dashboard${p === '/' ? '' : p}`;
      navigate(p);
    }

    // Clear and acknowledge
    setPendingAction(null);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'bot',
      text: 'Done! Executing the requested action now.',
      timestamp: new Date()
    }]);
  };

  const handleCancelAction = () => {
    setPendingAction(null);
    setMessages(prev => [
      ...prev.filter(m => m.data?.type !== 'action_prompt'),
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'No problem. I will stay on this page.',
        timestamp: new Date()
      }
    ]);
  };

  const loadConversation = async (id: string) => {
    if (id === currentConversationId) return;
    setIsTyping(true);
    try {
      const msgs = await aiService.getConversationMessages(id);
      setMessages((msgs as any[]).map(m => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })));
      setCurrentConversationId(id);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    try {
      await aiService.deleteHistory();
      setMessages([]);
      setCurrentConversationId(null);
      const sessions = await aiService.getConversations();
      setConversations(sessions as any[]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const startListening = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported.'); return; }
    const r = new SR(); r.lang = 'en-US'; r.interimResults = false;
    r.onstart = () => setIsListening(true);
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    r.onresult = (e: any) => { const t = e.results[0][0].transcript; setQuery(t); handleSend(t); };
    r.start();
  };

  const { actions } = dynamicConfig;

  return (
    <div className="flex flex-col w-full max-w-[1400px] mx-auto h-full px-4 pb-4 pt-4 lg:pt-6 overflow-hidden">

      {/* ── Outer shell ── */}
      <div
        className="
          flex flex-col flex-1 min-h-0 overflow-hidden relative
          bg-[#0c0f1a] rounded-2xl lg:rounded-3xl
          border border-white/[0.07]
          shadow-[0_0_60px_-15px_rgba(45,212,191,0.18)]
          font-sans text-gray-300
        "
      >
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
          {/* Identity */}
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

          {/* Greeting preview removed */}

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Budget Indicator - Temporarily Disabled
            {budget && (
              <div className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all ${
                budget.isExhausted
                  ? 'text-red-400 border-red-500/20 bg-red-500/10'
                  : budget.userRemaining <= 2
                    ? 'text-amber-400 border-amber-500/20 bg-amber-500/10'
                    : 'text-teal-400 border-teal-500/20 bg-teal-500/10'
              }`}>
                <Zap size={9} />
                <span>{budget.isExhausted ? 'Budget Used' : `${budget.userRemaining}/${budget.userMax} Left`}</span>
                <div className="absolute top-full right-0 mt-1 w-44 p-2 bg-black/95 border border-white/10 rounded-lg text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case tracking-normal font-medium">
                  {budget.isExhausted 
                    ? 'Daily AI budget exhausted. Please upgrade to continue.'
                    : `${budget.userRemaining} AI queries remaining today.`
                  }
                </div>
              </div>
            )}
            */}
            {/* Reset only */}
            <button
              onClick={clearChat}
              disabled={isTyping}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-colors
                ${isTyping
                  ? 'opacity-40 cursor-not-allowed text-gray-600 border-gray-600/20 bg-gray-600/10'
                  : 'text-teal-400 border-teal-500/20 bg-teal-500/10 hover:bg-teal-500/20'}`}
            >
              <RotateCcw size={9} /> Reset
            </button>
          </div>
        </div>

        {/* ── BODY: sidebar + chat ── */}
        <div className="flex flex-1 min-h-0 relative z-10 overflow-hidden">

          {/* ── LEFT SIDEBAR ── */}
          <div className="w-56 lg:w-64 shrink-0 flex flex-col border-r border-white/[0.06] bg-[#07090f]/90 backdrop-blur-xl">

            {/* Quick Actions */}
            <div className="px-3 pt-3.5 pb-2.5 border-b border-white/[0.05]">
              <span className="text-[8px] font-black text-gray-500 tracking-widest uppercase">Presets</span>
            </div>

            <div
              className="max-h-[35%] overflow-y-auto py-2 px-2 space-y-1"
              style={{ scrollbarWidth: 'none' }}
            >
              {actions.map((action: any, i: number) => (
                <SidebarActionCard
                  key={i}
                  action={action}
                  onClick={() => handleSend(action.query)}
                  disabled={isTyping}
                />
              ))}
            </div>

            {/* History Section */}
            <div className="px-3 pt-4 pb-2.5 border-t border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
              <span className="text-[8px] font-black text-teal-500/70 tracking-widest uppercase">Recent Advice</span>
              <button 
                onClick={() => { setMessages([]); setCurrentConversationId(null); }}
                className="text-[8px] font-black text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
              >
                + New
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 bg-[#090c14]/40">
              {isHistoryLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 mx-1 rounded-lg bg-white/[0.02] border border-white/[0.03] animate-pulse" />
                ))
              ) : conversations.length > 0 ? (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all group flex flex-col gap-1 ${
                      currentConversationId === conv.id
                        ? 'bg-teal-500/10 border-teal-500/30 ring-1 ring-teal-500/20'
                        : 'border-transparent hover:bg-white/[0.03] grayscale hover:grayscale-0'
                    }`}
                  >
                    <span className={`text-[10px] font-bold truncate ${currentConversationId === conv.id ? 'text-teal-400' : 'text-gray-400 group-hover:text-gray-200'}`}>
                      {conv.title}
                    </span>
                    <span className="text-[7px] font-mono text-gray-600 uppercase tracking-tighter">
                      {new Date(conv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                    </span>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-20 opacity-30 grayscale saturate-0">
                  <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">No History Yet</span>
                </div>
              )}
            </div>

            {/* AI Credits Section - Temporarily Disabled
            <div className="px-3 py-3.5 border-t border-white/[0.05] bg-black/20">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">AI Credits</span>
                  <span className="text-[10px] font-mono font-bold text-teal-400">
                    {usageStats.percent}%
                  </span>
                </div>
                
                <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usageStats.percent}%` }}
                    className={`h-full rounded-full ${
                      usageStats.percent > 90 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                      usageStats.percent > 70 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                      'bg-teal-500 shadow-[0_0_8px_rgba(45,212,191,0.5)]'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-gray-600 font-bold uppercase tracking-wider">
                    {usageStats.usage.toLocaleString()} / {usageStats.limit === Infinity ? '∞' : usageStats.limit.toLocaleString()}
                  </span>
                  {usageStats.limit !== Infinity && usageStats.remaining < 5000 && (
                    <span className="text-[7px] font-black text-amber-500/80 animate-pulse uppercase">Low Credits</span>
                  )}
                </div>

                <div className="pt-1 mt-1 border-t border-white/[0.03]">
                  <span className="text-[8px] text-gray-700 font-bold uppercase tracking-widest opacity-60 italic leading-none">
                    Finance engine · Encrypted
                  </span>
                </div>
              </div>
            </div>
            */}
            <div className="px-3 py-3.5 border-t border-white/[0.05] bg-black/20">
              <span className="text-[8px] text-gray-700 font-bold uppercase tracking-widest opacity-60 italic leading-none">
                Finance engine · Encrypted
              </span>
            </div>
          </div>

          {/* ── MAIN CHAT AREA ── */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0 relative">

            {/* Scrollable messages */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
            >
              {messages.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="max-w-3xl mx-auto px-5 py-5 space-y-5">
                  <AnimatePresence initial={false}>
                    {messages.map(msg => (
                      <ChatBubble 
                        key={msg.id} 
                        msg={msg} 
                        onConfirmAction={handleConfirmAction}
                        onCancelAction={handleCancelAction}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-end gap-2.5"
                      >
                        <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-teal-500/10 border border-teal-500/20">
                          <RobotSVG size={20} animate />
                        </div>
                        <div className="bg-white/[0.04] border border-teal-500/30 rounded-tr-2xl rounded-tl-sm rounded-b-2xl px-4 py-3 flex items-center gap-2.5 shadow-[0_0_15px_-3px_rgba(45,212,191,0.2)] animate-pulse">
                          <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full animate-bounce"
                                style={{ background: TEAL, animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{currentStep}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Voice indicator */}
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

                  <div className="h-2" />
                </div>
              )}
            </div>

            {/* Scroll-to-bottom button */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={scrollToBottom}
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
                {/* Capita label */}
                <div className="shrink-0 flex items-center gap-1.5 pr-2.5 border-r border-white/[0.07]">
                  <Zap size={13} className="text-teal-400" />
                  <span className="hidden sm:inline text-[9px] font-black uppercase text-teal-400 tracking-widest">Capita</span>
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  disabled={isTyping}
                  placeholder="Ask about revenue, invoices, cash flow…"
                  className="flex-1 bg-transparent border-none outline-none text-sm text-white py-1 px-1 placeholder-gray-600"
                />

                <div className="flex items-center gap-1 shrink-0">
                  <motion.button
                    whileHover={!isTyping ? { scale: 1.08 } : {}}
                    whileTap={!isTyping ? { scale: 0.92 } : {}}
                    onClick={startListening}
                    disabled={isTyping}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors
                      ${isListening
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : isTyping
                          ? 'opacity-30 cursor-not-allowed text-gray-600'
                          : 'text-gray-500 hover:bg-white/[0.06] hover:text-gray-300'
                      }`}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: query.trim() && !isTyping ? 1.08 : 1 }}
                    whileTap={{ scale: query.trim() && !isTyping ? 0.92 : 1 }}
                    onClick={() => handleSend()}
                    disabled={!query.trim() || isTyping || (usageStats.limit !== Infinity && usageStats.usage >= usageStats.limit)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all relative overflow-hidden"
                    style={
                      query.trim() && !isTyping && (usageStats.limit === Infinity || usageStats.usage < usageStats.limit)
                        ? { background: `linear-gradient(135deg, ${TEAL}, #06b6d4)`, color: '#0a0d15' }
                        : { background: 'rgba(255,255,255,0.04)', color: '#374151', cursor: 'not-allowed' }
                    }
                  >
                    <Send size={13} />
                    {(usageStats.limit !== Infinity && usageStats.usage >= usageStats.limit) && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none">
                        <div className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                      </div>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Footer hint */}
              <div className="mt-1.5 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">
                    Finance engine · Encrypted
                  </span>
                </div>
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
  );
}