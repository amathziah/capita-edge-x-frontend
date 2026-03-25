import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Mic, MicOff, Zap, RotateCcw, Copy, Check, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../services/aiService';
import { usePersona } from '../contexts/PersonaContext';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import * as LucideIcons from 'lucide-react';

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
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  data?: any;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}


const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ─── Markdown components ──────────────────────────────────────────────────────
const makeMd = (color: string): Components => ({
  p: ({ children }) => <p style={{ margin: '0 0 6px', lineHeight: 1.72 }}>{children}</p>,
  ul: ({ children }) => <ul style={{ paddingLeft: 18, margin: '6px 0' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: 18, margin: '6px 0' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: 3, color: '#9ca3af' }}>{children}</li>,
  strong: ({ children }) => <strong style={{ color, fontWeight: 700 }}>{children}</strong>,
  em: ({ children }) => <em style={{ color: '#d1d5db', fontStyle: 'italic' }}>{children}</em>,
  a: ({ href, children }) => <a href={href} style={{ color, textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  code: ({ className, children }) => /language-/.test(className || '') ? (
    <pre style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 8, padding: '10px 14px', overflowX: 'auto', margin: '8px 0', border: '1px solid rgba(255,255,255,0.07)' }}>
      <code style={{ fontFamily: 'monospace', fontSize: 12, color: '#a3e635' }}>{children}</code>
    </pre>
  ) : (
    <code style={{ background: 'rgba(0,0,0,0.35)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color }}>{children}</code>
  ),
});
const userMd: Components = {
  p: ({ children }) => <p style={{ margin: '0 0 4px', lineHeight: 1.65 }}>{children}</p>,
  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
};

// ─── Robot SVG ────────────────────────────────────────────────────────────────
function RobotSVG({ color, eyeColor, size = 56, animate = false }: { color: string; eyeColor: string; size?: number; animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={animate ? { animation: 'robot-float 3s ease-in-out infinite' } : {}}>
      {/* Antenna */}
      <line x1="28" y1="2" x2="28" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="2" r="2.5" fill={color} />
      {/* Head */}
      <rect x="10" y="10" width="36" height="28" rx="8" fill="rgba(255,255,255,0.06)" stroke={color} strokeWidth="1.5" />
      {/* Eyes */}
      <circle cx="21" cy="24" r="5" fill="rgba(0,0,0,0.4)" stroke={color} strokeWidth="1" />
      <circle cx="35" cy="24" r="5" fill="rgba(0,0,0,0.4)" stroke={color} strokeWidth="1" />
      {/* Pupils (animated glow) */}
      <circle cx="21" cy="24" r="2.5" fill={eyeColor} style={animate ? { animation: 'eye-glow 2s ease-in-out infinite' } : {}} />
      <circle cx="35" cy="24" r="2.5" fill={eyeColor} style={animate ? { animation: 'eye-glow 2s ease-in-out infinite 0.3s' } : {}} />
      {/* Mouth */}
      <rect x="20" y="33" width="16" height="3" rx="1.5" fill={color} opacity="0.7" />
      {/* Neck */}
      <rect x="24" y="38" width="8" height="4" rx="2" fill={color} opacity="0.5" />
      {/* Body */}
      <rect x="8" y="42" width="40" height="12" rx="6" fill="rgba(255,255,255,0.05)" stroke={color} strokeWidth="1.5" />
      {/* Body dots */}
      <circle cx="20" cy="48" r="2" fill={color} opacity="0.6" />
      <circle cx="28" cy="48" r="2" fill={color} opacity="0.8" />
      <circle cx="36" cy="48" r="2" fill={color} opacity="0.6" />
      {/* Ear ports */}
      <rect x="5" y="18" width="5" height="8" rx="2" fill={color} opacity="0.4" />
      <rect x="46" y="18" width="5" height="8" rx="2" fill={color} opacity="0.4" />
    </svg>
  );
}

// ─── Hero banner ──────────────────────────────────────────────────────────────
function HeroBanner({ meta, greeting, onCopy, copied }: {
  meta: any; greeting: string;
  onCopy: () => void; copied: boolean;
}) {
  const C = '#2dd4bf'; // Force teal-400 for theme consistency
  return (
    <div className="relative rounded-[24px] bg-white/[0.02] border border-white/[0.06] overflow-hidden mb-6 shadow-xl">
      {/* Top accent stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${C}, transparent)`, opacity: 0.8 }} />

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(${C} 1px, transparent 1px), linear-gradient(90deg, ${C} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* Light Glow orbs */}
      <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${C}20 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${C}10 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div className="relative flex items-center p-6 md:p-8 gap-6 justify-center md:justify-start">
        {/* Left robot */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="shrink-0"
        >
          <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center bg-teal-500/10 border border-teal-500/20 shadow-sm relative overflow-hidden">
            <RobotSVG color={C} eyeColor="#fff" size={52} />
          </div>
        </motion.div>

        {/* Center: greeting text */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-sans font-bold text-xl text-white tracking-tight">
              Capita AI
            </span>
            <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md border uppercase text-teal-400 bg-teal-500/10 border-teal-500/20">
              {meta.label}
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse shadow-sm" style={{ background: C }} />
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">ONLINE</span>
            </div>
          </div>
          <div className="text-gray-300 text-[13px] leading-relaxed">
            <ReactMarkdown components={makeMd(C)}>{greeting}</ReactMarkdown>
          </div>
          <button
            onClick={onCopy}
            className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest font-mono cursor-pointer bg-transparent border-none"
          >
            {copied ? <><Check size={11} color={C} /><span style={{ color: C }}>Copied</span></> : <><Copy size={11} />Copy</>}
          </button>
        </div>
      </div>

      {/* Bottom bar: status */}
      <div className="border-t border-white/[0.06] px-6 py-2.5 flex flex-wrap items-center gap-4 bg-black/20">
        {['SECURE CHANNEL', 'ENCRYPTED', 'FINANCE ENGINE v2.1'].map((s, i) => (
          <span key={i} className="text-[9px] font-bold text-gray-500 font-mono tracking-widest flex items-center gap-1.5">
            {i === 0 && <span className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ background: C }} />}
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Quick action card ────────────────────────────────────────────────────────
function ActionCard({ action, onClick }: { action: any; onClick: () => void }) {
  const C = '#2dd4bf'; // teal-400
  const Icon = typeof action.icon === 'string' ? IconMap[action.icon] || Zap : action.icon;
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-start p-3.5 rounded-2xl cursor-pointer bg-white/[0.02] border border-white/[0.05] transition-all text-left relative overflow-hidden group hover:bg-white/[0.04] hover:border-teal-500/20 w-full"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity" style={{ background: C }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C}60, transparent)` }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center justify-between w-full mb-2.5 relative z-10">
        <div className="p-1.5 rounded-lg border bg-teal-500/10 border-teal-500/20 group-hover:bg-teal-500/20 transition-colors">
          <Icon size={14} className="text-teal-400" />
        </div>
        <span className="text-[8px] font-black tracking-widest uppercase opacity-60 flex-1 text-right ml-2 truncate text-teal-400">{action.tag}</span>
      </div>
      <span className="text-[13px] font-semibold text-gray-200 leading-snug relative z-10">{action.label}</span>
      <span className="text-[10px] text-gray-500 mt-1.5 transition-colors group-hover:text-teal-400 font-black tracking-wide relative z-10">Ask Capita →</span>
    </motion.button>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ msg, copiedId, onCopy }: {
  msg: Message;
  copiedId: string | null; onCopy: (text: string, id: string) => void;
}) {
  const C = '#2dd4bf'; // teal-400
  const isBot = msg.sender === 'bot';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-end gap-3 w-full ${isBot ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      {isBot ? (
        <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-teal-500/10 border border-teal-500/20 shadow-sm relative overflow-hidden">
          <RobotSVG color={C} eyeColor="#fff" size={24} />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-xl shrink-0 bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shadow-sm">
          <span className="text-xs text-gray-400 font-black font-mono">U</span>
        </div>
      )}

      <div className="max-w-[85%] md:max-w-[70%] lg:max-w-[560px]">
        {/* Bubble */}
        <div className={`relative px-4 py-3 shadow-sm ${isBot ? 'bg-white/[0.03] border border-white/[0.06] rounded-tr-2xl rounded-tl-sm rounded-b-2xl'
            : 'bg-gradient-to-r from-teal-500/20 to-cyan-500/15 border border-teal-500/20 rounded-tl-2xl rounded-tr-sm rounded-b-2xl'
          }`}
        >
          {isBot && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, rgba(45,212,191,0.2), transparent)' }} />}

          <div className={`text-[13px] leading-relaxed ${isBot ? 'text-gray-300' : 'text-gray-200'}`}>
            <ReactMarkdown components={isBot ? makeMd(C) : userMd}>{msg.text}</ReactMarkdown>
          </div>

          {msg.data?.type === 'stat' && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }}
              className="mt-3 inline-block px-4 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 shadow-sm font-mono text-xl font-black text-teal-400"
            >
              ₹{msg.data.value.toLocaleString()}
            </motion.div>
          )}
        </div>

        {/* Meta row */}
        <div className={`mt-1.5 flex items-center gap-2 flex-wrap ${isBot ? 'justify-start pl-1' : 'justify-end pr-1'}`}>
          {isBot && (
            <button onClick={() => onCopy(msg.text, msg.id)} className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-[9px] font-bold text-gray-500 hover:text-gray-400 transition-colors uppercase font-mono tracking-widest">
              {copiedId === msg.id ? <><Check size={10} color={C} /><span className="text-teal-400">COPIED</span></> : <><Copy size={10} />COPY</>}
            </button>
          )}
          <span className="text-[9px] text-gray-500 font-bold font-mono tracking-widest uppercase">{formatTime(msg.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AIAssistantPage() {
  const { businessType } = usePersona();
  const navigate = useNavigate();
  const STORAGE_KEY = `capita_ai_config_${businessType || 'default'}`;

  // 1. Initialize from localStorage or fallback
  const [dynamicConfig, setDynamicConfig] = useState<{ meta: any, actions: any[] }>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) { console.error('Cache read error:', e); }
    return {
      meta: { greeting: 'Connecting to Capita AI...', label: 'FINANCE v2.1', color: '#2dd4bf', robotEye: '#fff' },
      actions: []
    };
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [greetingCopied, setGreetingCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 2. Fetch/Sync config in background
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const persona = businessType as string || undefined;
        const config = await aiService.getConfig(persona) as any;
        
        // Update state and cache
        setDynamicConfig(config);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        
        // Update messages if the initial greeting was a placeholder
        setMessages(prev => {
          if (prev.length === 1 && prev[0].text === 'Connecting to Capita AI...') {
            return [{
              id: '1',
              sender: 'bot',
              text: config.meta.greeting,
              timestamp: new Date()
            }];
          }
          return prev;
        });
      } catch (err) {
        console.error('Failed to fetch AI config:', err);
      } finally {
        setIsSyncing(false);
      }
    };
    fetchConfig();
  }, [businessType, STORAGE_KEY]);

  // Initial greeting if no messages
  useEffect(() => {
    if (messages.length === 0 && dynamicConfig.meta.greeting) {
      setMessages([{
        id: '1',
        sender: 'bot',
        text: dynamicConfig.meta.greeting,
        timestamp: new Date()
      }]);
    }
  }, [dynamicConfig.meta.greeting, messages.length]); 
  const getGreeting = () => dynamicConfig?.meta.greeting || '';

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 140)
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  }, []);

  const scrollToBottom = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });

  const handleCopy = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyGreeting = () => {
    navigator.clipboard.writeText(getGreeting());
    setGreetingCopied(true);
    setTimeout(() => setGreetingCopied(false), 2000);
  };

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride || query).trim();
    if (!text) return;
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text, timestamp: new Date(), status: 'sent' };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsTyping(true);
    try {
      const res = await aiService.processQuery(text, undefined, businessType || undefined);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: res.text, data: res.data, timestamp: new Date() }]);
      if (res.action) {
        const { type, data, initialData } = res.action;
        if (type === 'open_invoice_modal' || type === 'EXECUTE_ACTION') {
          const detail = data && type === 'EXECUTE_ACTION'
            ? { buyer: { name: data.customer, phone: '' }, items: [{ description: data.description || 'Service', quantity: 1, price: data.amount, unit: 'Qty', discount: 0 }] }
            : (initialData || data);
          window.dispatchEvent(new CustomEvent('open-invoice-modal', { detail }));
        } else if (type === 'navigate' && data?.to) {
          setTimeout(() => {
            let p = data.to;
            if (p.startsWith('/') && !p.startsWith('/dashboard') && !['/login', '/setup', '/pricing'].includes(p))
              p = `/dashboard${p === '/' ? '' : p}`;
            navigate(p);
          }, 1200);
        }
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: '⚠️ Something went wrong. Please try again.', timestamp: new Date(), status: 'error' as const }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => setMessages([{ id: Date.now().toString(), sender: 'bot', text: getGreeting(), timestamp: new Date() }]);

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

  const { meta, actions } = dynamicConfig;
  const C = meta.color || '#2dd4bf';

  return (
   <div
  className="
    flex flex-col
    bg-[#0c0f1a]
    relative
    font-sans
    text-gray-300

    border border-white/[0.06]

    w-full
    max-w-[1400px]
    mx-auto

    min-h-screen
    h-[100dvh]

    overflow-y-auto
    overflow-x-hidden

    shadow-2xl

    px-4 sm:px-6 lg:px-8

    rounded-xl sm:rounded-2xl lg:rounded-3xl
  "
>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden mix-blend-screen opacity-[0.15]">
        <div className="absolute -top-1/4 -right-1/4 w-[700px] h-[700px] rounded-full blur-[100px]" style={{ background: `radial-gradient(circle, ${C} 0%, transparent 60%)` }} />
        <div className="absolute -bottom-1/4 -left-[12%] w-[600px] h-[600px] rounded-full blur-[100px]" style={{ background: `radial-gradient(circle, ${C} 0%, transparent 60%)` }} />
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-50 shrink-0 border-b border-white/[0.06] bg-[#0c0f1a]/80 backdrop-blur-xl">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-teal-500/10 border border-teal-500/20 shadow-sm relative overflow-hidden">
              <RobotSVG color={C} eyeColor="#fff" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-base text-white tracking-tight">Capita AI</span>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border text-teal-400 bg-teal-500/10 border-teal-500/20">{meta.label}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse shadow-sm" style={{ background: C }} />
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">ONLINE</span>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-white/[0.04] text-teal-400 border-teal-500/20 bg-teal-500/10"
          >
            <RotateCcw size={12} /> RESET
          </button>
        </div>
      </header>

      {/* ── MESSAGES SCROLL ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-transparent"
        style={{ minHeight: 0 }}
      >

        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">

          {/* Hero banner with robots */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <HeroBanner meta={meta} greeting={getGreeting()} onCopy={copyGreeting} copied={greetingCopied} />
          </motion.div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[9px] font-black text-gray-500 tracking-widest uppercase">QUICK ACTIONS</span>
              <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
            </div>
            <div className="bg-white/[0.01] rounded-[22px] border border-white/[0.05] p-2.5 shadow-sm">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {actions.map((action: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}>
                    <ActionCard action={action} onClick={() => handleSend(action.query)} />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Conversation */}
          {messages.length > 1 && (
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[9px] font-black text-gray-500 tracking-widest uppercase">CONVERSATION</span>
                <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
              </div>

              <div className="flex flex-col gap-6 bg-white/[0.01] rounded-[24px] border border-white/[0.05] p-4 sm:p-6 shadow-sm backdrop-blur-md">
                <AnimatePresence initial={false}>
                  {messages.slice(1).map(msg => (
                    <ChatBubble key={msg.id} msg={msg} copiedId={copiedId} onCopy={handleCopy} />
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-end gap-3">
                      <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-teal-500/10 border border-teal-500/20 shadow-sm relative overflow-hidden">
                        <RobotSVG color={C} eyeColor="#fff" size={24} animate />
                      </div>
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-tr-xl rounded-tl-sm rounded-b-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: C, animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest ml-1.5">ANALYZING</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Voice indicator */}
          <AnimatePresence>
            {isListening && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex justify-center py-2">
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 shadow-sm">
                  <Mic size={14} className="animate-pulse" />
                  <span className="text-[10px] font-black tracking-widest uppercase">LISTENING...</span>
                  <div className="flex gap-1 items-center h-3 ml-1">
                    {[3, 5, 4, 7, 3].map((h, i) => (
                      <div key={i} className="w-0.5 rounded-full bg-red-400 animate-pulse" style={{ height: h * 2, animationDuration: `${0.4 + i * 0.1}s` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-4" />
        </div>
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="fixed bottom-[90px] right-6 z-50 w-10 h-10 rounded-full bg-[#161a2b] border border-white/[0.08] flex items-center justify-center cursor-pointer shadow-2xl hover:bg-white/[0.08] transition-colors"
          >
            <ChevronDown size={18} className="text-gray-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── INPUT BAR ── */}
      <div className="relative z-50 shrink-0 border-t border-white/[0.06] bg-[#0c0f1a]/90 backdrop-blur-xl px-4 sm:px-6 py-4 pb-safe lg:pb-4">

        <div className="w-full max-w-4xl mx-auto">
          {/* Input container */}
          <div className={`flex items-center gap-2 border transition-all rounded-[20px] px-2 py-1.5 shadow-sm ${inputFocused ? 'border-teal-400 shadow-lg ring-2 ring-teal-500/20 bg-[#161a2b]' : 'border-white/[0.06] hover:border-white/[0.1] bg-white/[0.02]'
            }`}>

            {/* Input icon */}
            <div className="shrink-0 flex items-center gap-1.5 pl-3 pr-2 border-r border-white/[0.06] font-mono text-[9px] font-black uppercase text-teal-400">
              <Zap size={16} />
              <span className="hidden sm:inline">Capita</span>
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask about revenue, invoices, cash flow, forecasts..."
              className="flex-1 bg-transparent border-none outline-none text-white text-[15px] py-2 px-1 placeholder-gray-500 font-sans"
            />

            <div className="flex items-center gap-1 shrink-0 pr-1">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={startListening}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isListening ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
                  }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </motion.button>

              <motion.button
                whileHover={{ scale: query.trim() && !isTyping ? 1.05 : 1 }}
                whileTap={{ scale: query.trim() && !isTyping ? 0.95 : 1 }}
                onClick={() => handleSend()}
                disabled={!query.trim() || isTyping}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm"
                style={query.trim() && !isTyping
                  ? { background: `linear-gradient(135deg, ${C} 0%, ${C}ee 100%)`, color: '#fff' }
                  : { background: 'rgba(255,255,255,0.03)', color: '#6b7280', cursor: 'not-allowed' }}
              >
                <Send size={15} />
              </motion.button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between px-1 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: C, animation: 'pulse 2s infinite' }} />
              <span className="text-[8px] font-black text-gray-500 tracking-widest uppercase">END-TO-END ENCRYPTED · FINANCE ENGINE v2.1</span>
            </div>
            {isListening && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[8px] font-black text-red-500 tracking-widest uppercase">REC</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}