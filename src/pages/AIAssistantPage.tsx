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
  p:      ({ children }) => <p style={{ margin: '0 0 6px', lineHeight: 1.72 }}>{children}</p>,
  ul:     ({ children }) => <ul style={{ paddingLeft: 18, margin: '6px 0' }}>{children}</ul>,
  ol:     ({ children }) => <ol style={{ paddingLeft: 18, margin: '6px 0' }}>{children}</ol>,
  li:     ({ children }) => <li style={{ marginBottom: 3, color: '#9ca3af' }}>{children}</li>,
  strong: ({ children }) => <strong style={{ color, fontWeight: 700 }}>{children}</strong>,
  em:     ({ children }) => <em style={{ color: '#d1d5db', fontStyle: 'italic' }}>{children}</em>,
  a:      ({ href, children }) => <a href={href} style={{ color, textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  code: ({ className, children }) => /language-/.test(className || '') ? (
    <pre style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 8, padding: '10px 14px', overflowX: 'auto', margin: '8px 0', border: '1px solid rgba(255,255,255,0.07)' }}>
      <code style={{ fontFamily: 'monospace', fontSize: 12, color: '#a3e635' }}>{children}</code>
    </pre>
  ) : (
    <code style={{ background: 'rgba(0,0,0,0.35)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color }}>{children}</code>
  ),
});
const userMd: Components = {
  p:      ({ children }) => <p style={{ margin: '0 0 4px', lineHeight: 1.65 }}>{children}</p>,
  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
};

// ─── Robot SVG ────────────────────────────────────────────────────────────────
function RobotSVG({ color, eyeColor, size = 56, animate = false }: { color: string; eyeColor: string; size?: number; animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={animate ? { animation: 'robot-float 3s ease-in-out infinite' } : {}}>
      {/* Antenna */}
      <line x1="28" y1="2" x2="28" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="28" cy="2" r="2.5" fill={color}/>
      {/* Head */}
      <rect x="10" y="10" width="36" height="28" rx="8" fill="rgba(255,255,255,0.06)" stroke={color} strokeWidth="1.5"/>
      {/* Eyes */}
      <circle cx="21" cy="24" r="5" fill="rgba(0,0,0,0.4)" stroke={color} strokeWidth="1"/>
      <circle cx="35" cy="24" r="5" fill="rgba(0,0,0,0.4)" stroke={color} strokeWidth="1"/>
      {/* Pupils (animated glow) */}
      <circle cx="21" cy="24" r="2.5" fill={eyeColor} style={animate ? { animation: 'eye-glow 2s ease-in-out infinite' } : {}}/>
      <circle cx="35" cy="24" r="2.5" fill={eyeColor} style={animate ? { animation: 'eye-glow 2s ease-in-out infinite 0.3s' } : {}}/>
      {/* Mouth */}
      <rect x="20" y="33" width="16" height="3" rx="1.5" fill={color} opacity="0.7"/>
      {/* Neck */}
      <rect x="24" y="38" width="8" height="4" rx="2" fill={color} opacity="0.5"/>
      {/* Body */}
      <rect x="8" y="42" width="40" height="12" rx="6" fill="rgba(255,255,255,0.05)" stroke={color} strokeWidth="1.5"/>
      {/* Body dots */}
      <circle cx="20" cy="48" r="2" fill={color} opacity="0.6"/>
      <circle cx="28" cy="48" r="2" fill={color} opacity="0.8"/>
      <circle cx="36" cy="48" r="2" fill={color} opacity="0.6"/>
      {/* Ear ports */}
      <rect x="5" y="18" width="5" height="8" rx="2" fill={color} opacity="0.4"/>
      <rect x="46" y="18" width="5" height="8" rx="2" fill={color} opacity="0.4"/>
    </svg>
  );
}

// ─── Hero banner ──────────────────────────────────────────────────────────────
function HeroBanner({ meta, greeting, onCopy, copied }: {
  meta: any; greeting: string;
  onCopy: () => void; copied: boolean;
}) {
  const C = meta.color;
  return (
    <div style={{
      position: 'relative', borderRadius: 24,
      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      border: `1.5px solid ${meta.colorBorder}`,
      overflow: 'hidden', marginBottom: 24,
      boxShadow: `0 0 60px ${meta.colorGlow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
    }}>
      {/* Top accent stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${C}, transparent)`, opacity: 0.8 }} />

      {/* Background grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `linear-gradient(${C} 1px, transparent 1px), linear-gradient(90deg, ${C} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${meta.colorGlow} 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${meta.colorGlow} 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '24px 28px', gap: 24 }}>
        {/* Left robot */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ flexShrink: 0 }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${meta.colorBg}, rgba(0,0,0,0.2))`,
            border: `1.5px solid ${meta.colorBorder}`,
            boxShadow: `0 0 30px ${meta.colorGlow}`,
          }}>
            <RobotSVG color={C} eyeColor={meta.robotEye} size={52} animate />
          </div>
        </motion.div>

        {/* Center: greeting text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: "'Sora','DM Sans',sans-serif", fontWeight: 800, fontSize: 20, color: '#f0fdf4', letterSpacing: '-0.025em' }}>
              Capita
            </span>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.13em',
              color: C, background: meta.colorBg, border: `1px solid ${meta.colorBorder}`,
              padding: '2px 7px', borderRadius: 5, fontFamily: 'monospace',
            }}>
              {meta.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C, display: 'inline-block', boxShadow: `0 0 8px ${C}`, animation: 'cp-pulse 2.5s ease-in-out infinite' }} />
              <span style={{ fontSize: 9, color: '#374151', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.07em' }}>ONLINE</span>
            </div>
          </div>
          <div style={{ color: '#d1fae5', fontSize: 14, lineHeight: 1.72 }}>
            <ReactMarkdown components={makeMd(C)}>{greeting}</ReactMarkdown>
          </div>
          <button
            onClick={onCopy}
            style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#374151', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}
          >
            {copied ? <><Check size={11} color={C} /><span style={{ color: C }}>Copied</span></> : <><Copy size={11} />Copy</>}
          </button>
        </div>

        
      </div>

      {/* Bottom bar: status */}
      <div style={{
        borderTop: `1px solid ${meta.colorBorder}`,
        padding: '10px 28px',
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'rgba(0,0,0,0.15)',
      }}>
        {['SECURE CHANNEL', 'ENCRYPTED', 'FINANCE ENGINE v2.1'].map((s, i) => (
          <span key={i} style={{ fontSize: 9, fontWeight: 800, color: '#1f2937', fontFamily: 'monospace', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5 }}>
            {i === 0 && <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block', boxShadow: `0 0 6px ${C}` }} />}
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Quick action card ────────────────────────────────────────────────────────
function ActionCard({ action, meta, onClick }: { action: any; meta: any; onClick: () => void }) {
  const C = meta.color;
  const Icon = typeof action.icon === 'string' ? IconMap[action.icon] || Zap : action.icon;
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        padding: '14px 14px 12px', borderRadius: 16, cursor: 'pointer',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(255,255,255,0.07)`,
        transition: 'all 0.18s', textAlign: 'left', position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = meta.colorBg; el.style.borderColor = meta.colorBorder; el.style.boxShadow = `0 8px 32px ${meta.colorGlow}`; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.boxShadow = 'none'; }}
    >
      {/* Top curved accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C}60, transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
        <div style={{ padding: 7, borderRadius: 9, background: meta.colorBg, border: `1px solid ${meta.colorBorder}` }}>
          <Icon size={13} color={C} />
        </div>
        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', color: C, opacity: 0.6, fontFamily: 'monospace' }}>{action.tag}</span>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#d1fae5', lineHeight: 1.35 }}>{action.label}</span>
      <span style={{ fontSize: 10, color: '#374151', marginTop: 4 }}>Ask Capita →</span>
    </motion.button>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ msg, meta, copiedId, onCopy }: {
  msg: Message; meta: any;
  copiedId: string | null; onCopy: (text: string, id: string) => void;
}) {
  const C = meta.color;
  const isBot = msg.sender === 'bot';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexDirection: isBot ? 'row' : 'row-reverse' }}
    >
      {/* Avatar */}
      {isBot ? (
        <div style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          background: `linear-gradient(135deg, ${meta.colorBg}, rgba(0,0,0,0.3))`,
          border: `1.5px solid ${meta.colorBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 14px ${meta.colorGlow}`,
        }}>
          <RobotSVG color={C} eyeColor={meta.robotEye} size={26} />
        </div>
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 12, color: '#d1fae5', fontWeight: 800, fontFamily: 'monospace' }}>U</span>
        </div>
      )}

      <div style={{ maxWidth: 560 }}>
        {/* Bubble */}
        <div style={isBot ? {
          background: 'rgba(255,255,255,0.045)',
          border: `1px solid ${meta.colorBorder}`,
          borderRadius: '6px 20px 20px 20px',
          padding: '14px 18px',
          boxShadow: `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
          backdropFilter: 'blur(12px)',
          position: 'relative' as const,
          overflow: 'hidden' as const,
        } : {
          background: `linear-gradient(135deg, ${C} 0%, ${C}cc 100%)`,
          borderRadius: '20px 6px 20px 20px',
          padding: '13px 18px',
          boxShadow: `0 6px 32px ${meta.colorGlow}, 0 2px 8px rgba(0,0,0,0.4)`,
        }}>
          {/* Bot bubble accent stripe */}
          {isBot && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C}80, transparent)` }} />}

          <div style={{ fontSize: 14, lineHeight: 1.68, color: isBot ? '#e5e7eb' : '#fff' }}>
            <ReactMarkdown components={isBot ? makeMd(C) : userMd}>{msg.text}</ReactMarkdown>
          </div>

          {msg.data?.type === 'stat' && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }}
              style={{ marginTop: 12, display: 'inline-block', padding: '8px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.35)', border: `1px solid ${meta.colorBorder}`, fontSize: 22, fontWeight: 900, color: C, fontFamily: 'monospace', boxShadow: `0 0 20px ${meta.colorGlow}` }}
            >
              ₹{msg.data.value.toLocaleString()}
            </motion.div>
          )}
        </div>

        {/* Meta row */}
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, justifyContent: isBot ? 'flex-start' : 'flex-end', paddingLeft: isBot ? 4 : 0, paddingRight: isBot ? 0 : 4 }}>
          {isBot && (
            <button onClick={() => onCopy(msg.text, msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: '#374151', fontFamily: 'monospace' }}>
              {copiedId === msg.id ? <><Check size={11} color={C} /><span style={{ color: C }}>COPIED</span></> : <><Copy size={11} />COPY</>}
            </button>
          )}
          <span style={{ fontSize: 10, color: '#1f2937', fontFamily: 'monospace', fontWeight: 700 }}>{formatTime(msg.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AIAssistantPage() {
  const { businessType } = usePersona();
  const navigate = useNavigate();

  const [dynamicConfig, setDynamicConfig] = useState<{ meta: any, actions: any[] } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [greetingCopied, setGreetingCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const persona = businessType as string || undefined;
        const config = await aiService.getConfig(persona) as any;
        setDynamicConfig(config);
        
        // Use the initial greeting from config
        setMessages([{
          id: '1',
          sender: 'bot',
          text: config.meta.greeting,
          timestamp: new Date()
        }]);
      } catch (err) {
        console.error('Failed to fetch AI config:', err);
      }
    };
    fetchConfig();
  }, [businessType]);

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
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: '⚠️ Something went wrong. Please try again.', timestamp: new Date(), status: 'error' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => setMessages([{ id: Date.now().toString(), sender: 'bot', text: getGreeting(), timestamp: new Date() }]);

  const startListening = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported.'); return; }
    const r = new SR(); r.lang = 'en-US'; r.interimResults = false;
    r.onstart  = () => setIsListening(true);
    r.onend    = () => setIsListening(false);
    r.onerror  = () => setIsListening(false);
    r.onresult = (e: any) => { const t = e.results[0][0].transcript; setQuery(t); handleSend(t); };
    r.start();
  };

  if (!dynamicConfig) return null; // Or a loader

  const { meta, actions } = dynamicConfig;
  const C = meta.color;


  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      background: 'linear-gradient(160deg, #070c0a 0%, #090e0d 55%, #07090f 100%)',
      fontFamily: "'DM Sans', 'Manrope', system-ui, sans-serif",
    }}>
      {/* Ambient glows */}
      <div style={{ pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-25%', right: '-15%', width: 700, height: 700, borderRadius: '50%', background: `radial-gradient(circle, ${meta.colorGlow} 0%, transparent 60%)` }} />
        <div style={{ position: 'absolute', bottom: '-25%', left: '-12%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, #10b98108 0%, transparent 60%)' }} />
      </div>

      {/* ── HEADER ── */}
      <header style={{ position: 'relative', zIndex: 50, flexShrink: 0, borderBottom: `1px solid ${meta.colorBorder}`, background: 'rgba(7,12,10,0.9)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg, ${meta.colorBg}, rgba(0,0,0,0.3))`, border: `1.5px solid ${meta.colorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${meta.colorGlow}` }}>
              <RobotSVG color={C} eyeColor={meta.robotEye} size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'Sora','DM Sans',sans-serif", fontWeight: 800, fontSize: 17, color: '#f0fdf4', letterSpacing: '-0.02em' }}>Capita</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: C, background: meta.colorBg, border: `1px solid ${meta.colorBorder}`, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', letterSpacing: '0.1em' }}>{meta.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block', boxShadow: `0 0 6px ${C}`, animation: 'cp-pulse 2.5s ease-in-out infinite' }} />
                <span style={{ fontSize: 9, color: '#374151', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.08em' }}>ONLINE · SECURE</span>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 10, border: `1px solid ${meta.colorBorder}`, background: meta.colorBg, color: C, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.05em' }}
          >
            <RotateCcw size={12} /> RESET
          </button>
        </div>
      </header>

      {/* ── MESSAGES SCROLL ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}
      >
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 20px 16px' }}>

          {/* Hero banner with robots */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <HeroBanner meta={meta} greeting={getGreeting()} onCopy={copyGreeting} copied={greetingCopied} />
          </motion.div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} style={{ marginBottom: 24 }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#374151', letterSpacing: '0.14em', fontFamily: 'monospace' }}>QUICK ACTIONS</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${meta.colorBorder}, transparent)` }} />
            </div>
            {/* Container with curved border */}
            <div style={{
              borderRadius: 20, border: `1px solid ${meta.colorBorder}`,
              background: 'rgba(255,255,255,0.015)', padding: 14,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {actions.map((action: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                    <ActionCard action={action} meta={meta} onClick={() => handleSend(action.query)} />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Conversation */}
          {messages.length > 1 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#374151', letterSpacing: '0.14em', fontFamily: 'monospace' }}>CONVERSATION</span>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${meta.colorBorder}, transparent)` }} />
              </div>
              {/* Curved conversation container */}
              <div style={{
                borderRadius: 22, border: `1px solid ${meta.colorBorder}`,
                background: 'rgba(255,255,255,0.01)', padding: '20px 18px',
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 40px rgba(0,0,0,0.2)`,
                display: 'flex', flexDirection: 'column', gap: 18,
              }}>
                <AnimatePresence initial={false}>
                  {messages.slice(1).map(msg => (
                    <ChatBubble key={msg.id} msg={msg} meta={meta} copiedId={copiedId} onCopy={handleCopy} />
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, background: meta.colorBg, border: `1.5px solid ${meta.colorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 14px ${meta.colorGlow}` }}>
                        <RobotSVG color={C} eyeColor={meta.robotEye} size={26} animate />
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${meta.colorBorder}`, borderRadius: '6px 18px 18px 18px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C, animation: 'cp-bounce 1.1s ease-in-out infinite', animationDelay: `${i * 0.18}s`, boxShadow: `0 0 8px ${meta.colorDim}` }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 10, color: '#4b5563', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.1em' }}>ANALYZING...</span>
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
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px', borderRadius: 50, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <Mic size={14} color="#ef4444" />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', letterSpacing: '0.11em', fontFamily: 'monospace' }}>LISTENING...</span>
                  <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    {[3, 5, 4, 7, 3].map((h, i) => (
                      <div key={i} style={{ width: 3, background: '#ef4444', borderRadius: 2, height: h * 3, animation: `cp-bar ${0.4 + i * 0.08}s ease-in-out infinite alternate`, opacity: 0.75 }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ height: 12 }} />
        </div>
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            style={{ position: 'fixed', bottom: 108, right: 26, zIndex: 60, width: 38, height: 38, borderRadius: '50%', background: meta.colorBg, border: `1.5px solid ${meta.colorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 4px 20px ${meta.colorGlow}` }}
          >
            <ChevronDown size={18} color={C} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── INPUT BAR ── */}
      <div style={{ position: 'relative', zIndex: 50, flexShrink: 0, borderTop: `1px solid ${meta.colorBorder}`, background: 'rgba(7,12,10,0.93)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', padding: '14px 20px 18px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          {/* Curved input container */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: inputFocused ? 'rgba(255,255,255,0.065)' : 'rgba(255,255,255,0.038)',
            border: `1.5px solid ${inputFocused ? meta.colorBorder : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 20, padding: '5px 6px 5px 18px',
            transition: 'all 0.2s',
            boxShadow: inputFocused ? `0 0 0 3px ${meta.colorBg}, 0 8px 40px rgba(0,0,0,0.4)` : '0 4px 24px rgba(0,0,0,0.3)',
          }}>
            {/* Mini robot in input */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, paddingRight: 12, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <RobotSVG color={C} eyeColor={meta.robotEye} size={22} />
              <span style={{ fontSize: 10, fontWeight: 800, color: C, fontFamily: 'monospace', letterSpacing: '0.07em' }}>CAPITA</span>
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
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e5e7eb', fontSize: 14, fontFamily: "'DM Sans','Manrope',sans-serif", padding: '11px 0', caretColor: C }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                onClick={startListening}
                style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: isListening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', color: isListening ? '#ef4444' : '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', outline: isListening ? '2px solid rgba(239,68,68,0.35)' : 'none', outlineOffset: 1 }}
              >
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              </motion.button>

              <motion.button
                whileHover={{ scale: query.trim() && !isTyping ? 1.06 : 1 }}
                whileTap={{ scale: query.trim() && !isTyping ? 0.94 : 1 }}
                onClick={() => handleSend()}
                disabled={!query.trim() || isTyping}
                style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: query.trim() && !isTyping ? `linear-gradient(135deg, ${C} 0%, ${C}cc 100%)` : 'rgba(255,255,255,0.05)', color: query.trim() && !isTyping ? '#fff' : '#374151', cursor: query.trim() && !isTyping ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', boxShadow: query.trim() && !isTyping ? `0 4px 20px ${meta.colorGlow}` : 'none' }}
              >
                <Send size={16} />
              </motion.button>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block', boxShadow: `0 0 7px ${C}`, animation: 'cp-pulse 3s ease-in-out infinite' }} />
              <span style={{ fontSize: 9, color: '#1f2937', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.1em' }}>END-TO-END ENCRYPTED · FINANCE ENGINE v2.1</span>
            </div>
            {isListening && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'cp-pulse 1s ease-in-out infinite' }} />
                <span style={{ fontSize: 9, fontWeight: 800, color: '#ef4444', fontFamily: 'monospace', letterSpacing: '0.1em' }}>REC</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes cp-bounce {
          0%,100% { transform:translateY(0); opacity:0.5; }
          50%      { transform:translateY(-6px); opacity:1; }
        }
        @keyframes cp-pulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.35; }
        }
        @keyframes cp-bar {
          from { transform:scaleY(0.35); opacity:0.5; }
          to   { transform:scaleY(1);    opacity:1; }
        }
        @keyframes robot-float {
          0%,100% { transform:translateY(0); }
          50%     { transform:translateY(-4px); }
        }
        @keyframes eye-glow {
          0%,100% { opacity:0.7; }
          50%     { opacity:1; filter:brightness(1.3); }
        }
        ::-webkit-scrollbar       { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07); border-radius:2px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.13); }
      `}</style>
    </div>
  );
}