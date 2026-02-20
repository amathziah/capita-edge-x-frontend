import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Check, Copy, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../../services/aiService';
import ReactMarkdown from 'react-markdown';

interface AgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentId: string | null;
}

interface Message {
    id: string;
    sender: 'user' | 'bot' | 'system';
    text: string;
    data?: any;
    jsonAction?: any;
    timestamp: Date;
    status?: 'sending' | 'sent' | 'error';
    isStepStart?: boolean;
}

const AGENT_CONFIGS: Record<string, { name: string; designation: string; greeting: string; gradient: string; glow: string; textHighlight: string; capabilities: string[] }> = {
    agent_alpha: {
        name: 'ALPHA',
        designation: 'Data Processing Unit',
        greeting: "> [ALPHA] STATUS: OFFLINE. AI DIRECTIVES CURRENTLY UNAVAILABLE. FEATURE COMING SOON.",
        gradient: "from-violet-500 to-purple-600",
        glow: "shadow-[0_0_15px_rgba(139,92,246,0.5)]",
        textHighlight: "text-violet-300",
        capabilities: [
            "Execute Overdue Reminder Action",
            "Generate Auto-Reminder Drafts",
            "Explain Follow-Up Protocols"
        ]
    },
    agent_bravo: {
        name: 'BRAVO',
        designation: 'Backend Operations Commander',
        greeting: "> [BRAVO] STATUS: OFFLINE. AI DIRECTIVES CURRENTLY UNAVAILABLE. FEATURE COMING SOON.",
        gradient: "from-amber-500 to-orange-600",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.5)]",
        textHighlight: "text-amber-300",
        capabilities: [
            "Generate Payment Settlement Terms",
            "Analyze Debt Recovery Options",
            "Configure Payment Link Logic"
        ]
    },
    agent_charlie: {
        name: 'CHARLIE',
        designation: 'Frontend Logistics Operator',
        greeting: "> [CHARLIE] STATUS: OFFLINE. AI DIRECTIVES CURRENTLY UNAVAILABLE. FEATURE COMING SOON.",
        gradient: "from-teal-500 to-emerald-600",
        glow: "shadow-[0_0_15px_rgba(20,184,166,0.5)]",
        textHighlight: "text-teal-300",
        capabilities: [
            "Fetch Revenue & Cashflow Metrics",
            "Analyze Month-over-Month Trends",
            "Forecast Pending Revenue"
        ]
    },
    agent_delta: {
        name: 'DELTA',
        designation: 'Security & Verification Node',
        greeting: "> [DELTA] STATUS: OFFLINE. AI DIRECTIVES CURRENTLY UNAVAILABLE. FEATURE COMING SOON.",
        gradient: "from-sky-500 to-blue-600",
        glow: "shadow-[0_0_15px_rgba(14,165,233,0.5)]",
        textHighlight: "text-sky-300",
        capabilities: [
            "Initiate New Invoice Workflow",
            "Verify GST & Compliance Rules",
            "Audit Recent Transactions"
        ]
    }
};

const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function AgentModal({ isOpen, onClose, agentId }: AgentModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    const config = agentId ? AGENT_CONFIGS[agentId] : null;

    useEffect(() => {
        if (isOpen && config) {
            setMessages([{
                id: Date.now().toString(),
                sender: 'bot',
                text: config.greeting,
                timestamp: new Date()
            }]);
        } else {
            setMessages([]);
        }
    }, [isOpen, agentId, config]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const copyToClipboard = (text: string, msgId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(msgId);
        setTimeout(() => setCopiedId(null), 2000);
    };



    if (!isOpen || !config) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] grid place-items-center p-4 sm:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#020617]/60 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="relative w-full max-w-2xl bg-[#09111e]/95 backdrop-blur-2xl rounded-3xl shadow-[0_0_80px_-20px_rgba(20,184,166,0.15)] flex flex-col h-[85vh] max-h-[800px] min-h-[500px] border border-teal-500/10 ring-1 ring-white/5 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-teal-500/10 bg-gradient-to-r from-[#04080d]/80 via-[#0b131e]/50 to-transparent backdrop-blur-xl relative z-20">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded shadow-md bg-gradient-to-br ${config.gradient} flex items-center justify-center ${config.glow}`}>
                                    <Terminal size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className={`text-[17px] font-extrabold tracking-wide drop-shadow-sm font-mono ${config.textHighlight}`}>{config.name}</h2>
                                    <div className={`flex items-center gap-1.5 text-[10px] uppercase font-mono mt-0.5 ${config.textHighlight}`}>
                                        <div className="relative flex h-1.5 w-1.5 items-center justify-center">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-40`}></span>
                                            <span className={`relative inline-flex rounded-full h-1 w-1 bg-current ${config.glow}`}></span>
                                        </div>
                                        <span className="tracking-wider opacity-80">{config.designation}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95">
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-1 bg-[#020408] font-mono scrollbar-thin scrollbar-thumb-teal-800/40 scrollbar-track-transparent relative z-10 w-full">
                            {messages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="w-full flex"
                                >
                                    <div className="w-full">
                                        <div className={`relative px-2 py-1 text-[13px] leading-relaxed flex items-start group ${msg.sender === 'user' ? 'text-emerald-400' : `${config.textHighlight} opacity-90`}`}>
                                            <span className="mr-3 opacity-40 shrink-0 select-none">[{formatTime(msg.timestamp)}]</span>
                                            <span className="mr-2 shrink-0 select-none">{msg.sender === 'user' ? 'root@core:~$' : '>'}</span>
                                            <div className={`flex-1 break-words leading-tight ${msg.sender === 'bot' && 'max-w-[100%]'}`}>
                                                <div className={`[&_strong]:text-white [&_a]:text-white [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-sm [&_p]:mb-1 [&_p:last-child]:mb-0 whitespace-pre-wrap ${msg.isStepStart ? 'mt-4' : ''}`}>
                                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                </div>
                                                {msg.data && msg.data.type === 'stat' && (
                                                    <div className={`mt-2 text-xl font-bold tracking-tighter bg-[#04080d]/50 border border-teal-500/15 px-3 py-1.5 rounded-sm inline-block shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ring-1 ring-black/20`}>
                                                        ₹{msg.data.value.toLocaleString()}
                                                    </div>
                                                )}
                                                {msg.jsonAction && msg.jsonAction.action_type && (
                                                    <DynamicActionRenderer action={msg.jsonAction} config={config} />
                                                )}
                                                {msg.sender === 'bot' && msg.text.length > 50 && (
                                                    <button onClick={() => copyToClipboard(msg.text, msg.id)} className={`opacity-0 group-hover:opacity-100 p-1.5 ml-2 bg-[#1e293b] border border-white/20 rounded shadow-md text-white hover:bg-[#334155] transition-all focus:outline-none focus:ring-1 focus:ring-white/50 shrink-0`}>
                                                        {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                        </div>

                        {/* Action Layout / Terminal Prompt */}
                        <div className="shrink-0 p-4 md:p-5 bg-gradient-to-t from-[#04080d] to-[#09111e] border-t border-teal-500/10 relative z-20">
                            <div className="mb-3 flex items-center gap-2">
                                <span className={`w-2 h-2 bg-slate-500 animate-pulse`}></span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agent Status</span>
                            </div>

                            <div className="w-full flex flex-col items-center justify-center p-5 rounded-lg bg-[#0b131e]/90 border border-dashed border-teal-500/20">
                                <span className="text-slate-300 font-bold mb-1 uppercase tracking-wider text-[13px] flex items-center gap-2">
                                    <Terminal size={14} className="text-teal-500" /> Feature Coming Soon
                                </span>
                                <span className="text-slate-500 text-[11px] text-center max-w-sm">This AI agent is currently offline for system upgrades. Autonomous execution directives will be available in a future release.</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    // Render into document.body to break out of any overflow: hidden/auto parents
    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

// ------------------------------------------------------------------
// DYNAMIC ACTION COMPONENTS
// ------------------------------------------------------------------

function DynamicActionRenderer({ action, config }: { action: any, config: any }) {
    switch (action.action_type) {
        case 'render_email_drafter':
            return <EmailDrafter prefillData={action.ui_data} config={config} />;
        case 'render_settlement_options':
            return <SettlementCards options={action.ui_data} />;
        case 'text_only':
        default:
            return null; // Already rendering the text message above
    }
}

function EmailDrafter({ prefillData, config }: { prefillData: any, config: any }) {
    const [subject, setSubject] = useState(prefillData?.subject_line || '');
    const [body, setBody] = useState(prefillData?.body || '');

    return (
        <div className="mt-4 bg-[#0a111a] border border-slate-700/50 rounded-xl overflow-hidden shadow-lg border-t-2" style={{ borderTopColor: config.gradient.includes('violet') ? '#8b5cf6' : '#14b8a6' }}>
            <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider bg-[#0f172a] border-b border-slate-700/50 ${config.textHighlight}`}>
                Email Drafter module
            </div>
            <div className="p-4 space-y-3">
                <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-[#1e293b]/50 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder="Subject Line"
                />
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={6}
                    className="w-full bg-[#1e293b]/50 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 resize-none transition-colors"
                    placeholder="Email Body"
                />
                <button className={`w-full py-2.5 mt-1 rounded-lg text-sm font-bold text-white transition-all bg-gradient-to-r ${config.gradient} shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2`}>
                    <Send size={14} />
                    Send to {prefillData?.to || 'Customer'}
                </button>
            </div>
        </div>
    );
}

function SettlementCards({ options }: { options: any[] }) {
    if (!Array.isArray(options)) return null;

    return (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((opt, i) => (
                <button
                    key={i}
                    className="flex flex-col text-left p-4 rounded-xl bg-[#0a111a] border border-slate-700/50 hover:border-amber-500/50 hover:bg-[#0f172a] transition-all group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className={`text-[11px] uppercase tracking-wider font-bold text-amber-500/80 mb-1 group-hover:text-amber-400 relative z-10`}>
                        {opt.title}
                    </span>
                    <span className="text-xl font-black text-white mb-2 relative z-10">
                        ₹{opt.amount?.toLocaleString() || 0}
                    </span>
                    <span className="text-xs text-slate-400 leading-relaxed relative z-10">
                        {opt.description}
                    </span>
                </button>
            ))}
        </div>
    );
}
