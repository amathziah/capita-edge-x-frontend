import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bot, X, Send, Sparkles, AlertCircle, Check, Copy, Mic, MicOff } from 'lucide-react';
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
    sender: 'user' | 'bot';
    text: string;
    data?: any;
    timestamp: Date;
    status?: 'sending' | 'sent' | 'error';
}

const AGENT_CONFIGS: Record<string, { name: string; greeting: string; gradient: string; glow: string; textHighlight: string }> = {
    agent_reminder: {
        name: 'Auto-Reminders',
        greeting: "Hello, I'm your Auto-Reminder Assistant. Let's review the overdue invoices in the queue.",
        gradient: "from-violet-500 to-purple-600",
        glow: "shadow-[0_0_15px_rgba(139,92,246,0.5)]",
        textHighlight: "text-violet-300"
    },
    agent_settlement: {
        name: 'Settlement Agent',
        greeting: "Hi. I handle recoveries and settlements. Need me to draft a negotiation email or review escalated accounts?",
        gradient: "from-amber-500 to-orange-600",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.5)]",
        textHighlight: "text-amber-300"
    },
    agent_analytics: {
        name: 'Cash Flow Intel',
        greeting: "Greetings. I monitor pipeline health and cash flow. What metrics would you like to analyze?",
        gradient: "from-teal-500 to-emerald-600",
        glow: "shadow-[0_0_15px_rgba(20,184,166,0.5)]",
        textHighlight: "text-teal-300"
    },
    agent_compliance: {
        name: 'Compliance Guard',
        greeting: "System active. I monitor regulatory deadlines and tax obligations. Are there any compliance anomalies you want me to check?",
        gradient: "from-sky-500 to-blue-600",
        glow: "shadow-[0_0_15px_rgba(14,165,233,0.5)]",
        textHighlight: "text-sky-300"
    }
};

const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function AgentModal({ isOpen, onClose, agentId }: AgentModalProps) {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const config = agentId ? AGENT_CONFIGS[agentId] : null;

    useEffect(() => {
        if (isOpen && config) {
            setMessages([{
                id: Date.now().toString(),
                sender: 'bot',
                text: config.greeting,
                timestamp: new Date()
            }]);
            setTimeout(() => inputRef.current?.focus(), 200);
        } else {
            setMessages([]);
            setQuery('');
        }
    }, [isOpen, agentId, config]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    const copyToClipboard = (text: string, msgId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(msgId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || query;
        if (!textToSend.trim() || !config) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: textToSend,
            timestamp: new Date(),
            status: 'sent'
        };

        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setIsTyping(true);

        try {
            const response: any = await aiService.processQuery(textToSend, agentId || undefined);

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: response.text,
                data: response.data,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);

            // Handle actions returned by backend
            const action = response.action;
            if (action) {
                if (action.type === 'open_invoice_modal' || action.type === 'EXECUTE_ACTION') {
                    const initialData = action.data && action.type === 'EXECUTE_ACTION' ? {
                        buyer: { name: action.data.customer, phone: '' },
                        items: [{ description: action.data.description || 'Service', quantity: 1, price: action.data.amount, unit: 'Qty', discount: 0 }]
                    } : (action.initialData || action.data);

                    window.dispatchEvent(new CustomEvent('open-invoice-modal', { detail: initialData }));
                    onClose();
                } else if (action.type === 'navigate' && action.data?.to) {
                    setTimeout(() => {
                        window.location.href = action.data.to;
                    }, 1200);
                }
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'bot',
                text: "⚠️ System error occurred. Unable to process command.",
                timestamp: new Date(),
                status: 'error'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const startListening = () => {
        const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice input is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (e: any) => { console.error(e); setIsListening(false); };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
            handleSend(transcript);
        };
        recognition.start();
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
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center ${config.glow}`}>
                                    <Bot size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className={`text-[17px] font-extrabold tracking-wide drop-shadow-sm ${config.textHighlight}`}>{config.name}</h2>
                                    <div className={`flex items-center gap-1.5 text-[11px] font-bold mt-0.5 ${config.textHighlight}`}>
                                        <div className="relative flex h-2 w-2 items-center justify-center">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-40`}></span>
                                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 bg-current ${config.glow}`}></span>
                                        </div>
                                        <span className="tracking-wider uppercase opacity-80">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95">
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-950/20 via-[#04080d] to-[#020408] scrollbar-thin scrollbar-thumb-teal-800/40 scrollbar-track-transparent relative z-10">
                            {messages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className="group max-w-[88%] lg:max-w-[80%]">
                                        <div className={`relative p-4 md:p-5 rounded-2xl text-[14px] leading-relaxed shadow-sm transition-all duration-300 hover:shadow-md ${msg.sender === 'user' ? `bg-gradient-to-br ${config.gradient} shadow-[0_8px_24px_-8px_rgba(20,184,166,0.5)] text-white rounded-br-sm border border-white/10 ring-1 ring-black/5` : 'bg-[#111a28]/80 border border-teal-500/10 text-[#f0fdfa] rounded-bl-sm backdrop-blur-md hover:border-teal-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]'}`}>
                                            <div className={`prose prose-sm max-w-none ${msg.sender === 'user' ? 'text-white prose-invert' : `text-[#ccfbf1] [&_strong]:${config.textHighlight} [&_a]:${config.textHighlight} [&_code]:${config.textHighlight} [&_code]:bg-teal-950/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md`} [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2`}>
                                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                                            </div>
                                            {msg.data && msg.data.type === 'stat' && (
                                                <div className={`mt-3.5 text-2xl font-black tracking-tighter bg-[#04080d]/50 ${config.textHighlight} border border-teal-500/15 px-4 py-2.5 rounded-xl inline-block shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ring-1 ring-black/20`}>
                                                    ₹{msg.data.value.toLocaleString()}
                                                </div>
                                            )}
                                            {msg.sender === 'bot' && msg.text.length > 50 && (
                                                <button onClick={() => copyToClipboard(msg.text, msg.id)} className={`absolute -bottom-3 -right-3 opacity-0 group-hover:opacity-100 p-2 bg-[#1e293b] border border-teal-500/20 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${config.textHighlight} hover:bg-[#334155] hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50`}>
                                                    {copiedId === msg.id ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                                                </button>
                                            )}
                                        </div>
                                        <div className={`flex items-center gap-1.5 mt-2 px-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <p className={`text-[9px] font-bold tracking-widest uppercase opacity-40 ${msg.sender === 'user' ? config.textHighlight : config.textHighlight}`}>
                                                {formatTime(msg.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                                    <div className="bg-[#111a28]/60 p-4 rounded-2xl rounded-bl-sm shadow-sm border border-teal-500/10 flex items-center gap-2.5 backdrop-blur-sm">
                                        <div className="flex gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="shrink-0 p-4 md:p-5 bg-gradient-to-t from-[#04080d] to-[#09111e] border-t border-teal-500/10 relative z-20">
                            <div className="relative group/input">
                                <div className={`absolute -inset-0.5 bg-gradient-to-r ${config.gradient} rounded-2xl blur opacity-0 group-focus-within/input:opacity-20 transition duration-500`}></div>
                                <div className="relative flex gap-2.5 items-center bg-[#0b131e]/90 backdrop-blur-md border border-teal-500/20 rounded-2xl p-1.5 pr-2 focus-within:border-teal-400/60 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                                    <button onClick={startListening} className={`p-3 rounded-xl transition-all duration-200 ${isListening ? 'text-rose-400 bg-rose-500/10 shadow-[inner_0_0_10px_rgba(244,63,94,0.2)]' : 'text-teal-600/80 hover:bg-teal-900/30 hover:text-teal-400 active:scale-95'}`}>
                                        {isListening ? <MicOff size={20} strokeWidth={2.5} /> : <Mic size={20} strokeWidth={2.5} />}
                                    </button>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                                        placeholder={`Ask ${config.name} a question...`}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] font-medium text-[#f0fdfa] placeholder-teal-700/50 h-11 w-full"
                                    />
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!query.trim() || isTyping}
                                        className={`p-3 rounded-xl text-white transition-all duration-300 ${query.trim() && !isTyping ? `bg-gradient-to-br ${config.gradient} ${config.glow} hover:scale-[1.03] active:scale-[0.97]` : 'bg-[#1e293b]/50 text-slate-500 cursor-not-allowed'}`}
                                    >
                                        <Send size={18} strokeWidth={2.5} className={query.trim() && !isTyping ? "translate-x-[1px] translate-y-[-1px]" : ""} />
                                    </button>
                                </div>
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
