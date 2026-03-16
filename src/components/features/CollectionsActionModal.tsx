import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, CheckCircle2, Sparkles, AlertTriangle, Target, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDraft, sendReminder, type CollectionDraft } from '../../api/collectionsApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ModalStatus = 'idle' | 'drafting' | 'ready' | 'sending' | 'sent';

interface Props {
    invoiceId: string;
    isOpen: boolean;
    onClose: () => void;
    onSent?: () => void;
}

// ---------------------------------------------------------------------------
// Strategy badge config
// ---------------------------------------------------------------------------
const STRATEGY_STYLES: Record<string, { color: string; bg: string; border: string; iconBg: string; Icon: typeof Sparkles }> = {
    friendly: { color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', iconBg: 'bg-teal-100', Icon: Sparkles },
    direct: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100', Icon: Target },
    urgent: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', iconBg: 'bg-red-100', Icon: AlertTriangle },
};

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------
function SkeletonLoader() {
    return (
        <div className="space-y-5 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-100 rounded" />
                <div className="h-11 bg-gray-50 rounded-xl border border-gray-100" />
            </div>
            <div className="space-y-2">
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="h-44 bg-gray-50 rounded-xl border border-gray-100" />
            </div>
            <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-gray-400 font-medium">Assistant is composing your email</span>
                <span className="flex gap-0.5 ml-1">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CollectionsActionModal({ invoiceId, isOpen, onClose, onSent }: Props) {
    const [status, setStatus] = useState<ModalStatus>('idle');
    const [draft, setDraft] = useState<CollectionDraft | null>(null);
    const [editedSubject, setEditedSubject] = useState('');
    const [editedBody, setEditedBody] = useState('');

    const fetchDraft = useCallback(async (forceAggressive = false) => {
        setStatus('drafting');
        setDraft(null);
        try {
            const result = await generateDraft(invoiceId, forceAggressive);
            setDraft(result);
            setEditedSubject(result.subject);
            setEditedBody(result.body);
            setStatus('ready');
        } catch {
            setStatus('idle');
        }
    }, [invoiceId]);

    useEffect(() => {
        if (isOpen && status === 'idle') {
            fetchDraft();
        }
        if (!isOpen) {
            setStatus('idle');
            setDraft(null);
        }
    }, [isOpen, fetchDraft]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSend = async () => {
        setStatus('sending');
        try {
            await sendReminder(invoiceId, { subject: editedSubject, body: editedBody });
            setStatus('sent');
            setTimeout(() => {
                onSent?.();
                onClose();
            }, 1500);
        } catch {
            setStatus('ready');
        }
    };

    const stratStyle = draft ? (STRATEGY_STYLES[draft.strategyTone] || STRATEGY_STYLES.direct) : null;
    const safeId = String(invoiceId).slice(-8).toUpperCase();

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-teal-100/60 max-h-[88vh] flex flex-col overflow-hidden"
                >

                    {/* ─── Header ─────────────────────────────────────────────────── */}
                    <div className="relative bg-gradient-to-r from-white via-teal-50/60 to-white px-6 py-5 border-b border-teal-100/60 overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-100/30 rounded-full blur-2xl" />
                        <div className="relative flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5" style={{ fontFamily: 'Sora, sans-serif' }}>
                                    <div className="p-2 bg-teal-100 rounded-xl border border-teal-200">
                                        <RefreshCw className="w-5 h-5 text-teal-600" />
                                    </div>
                                    Smart Collections Assistant
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-600 rounded-full border border-teal-200">
                                        Recover Payment
                                    </span>
                                </h2>
                                <p className="text-xs text-gray-400 mt-1.5 font-medium" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    Target → Invoice {safeId}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* ─── Body ───────────────────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {status === 'drafting' && <SkeletonLoader />}

                        {(status === 'ready' || status === 'sending') && draft && (
                            <div className="space-y-5">
                                {/* Strategy Badge */}
                                {stratStyle && (() => {
                                    const { Icon } = stratStyle;
                                    return (
                                        <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl ${stratStyle.bg} ${stratStyle.border} border`}>
                                            <div className={`p-2 ${stratStyle.iconBg} rounded-xl`}>
                                                <Icon className={`w-4 h-4 ${stratStyle.color}`} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold ${stratStyle.color}`}>{draft.strategy}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    ~{draft.daysOverdue} days overdue · Tone: <strong className="text-gray-600">{draft.strategyTone}</strong>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Subject */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
                                    <input
                                        type="text"
                                        value={editedSubject}
                                        onChange={(e) => setEditedSubject(e.target.value)}
                                        disabled={status === 'sending'}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition disabled:opacity-60"
                                    />
                                </div>

                                {/* Body */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Body</label>
                                    <textarea
                                        value={editedBody}
                                        onChange={(e) => setEditedBody(e.target.value)}
                                        disabled={status === 'sending'}
                                        rows={10}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition resize-none leading-relaxed disabled:opacity-60"
                                    />
                                </div>
                            </div>
                        )}

                        {status === 'sent' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-16 gap-4"
                            >
                                <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center border border-teal-200">
                                    <CheckCircle2 className="w-8 h-8 text-teal-600" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-teal-700" style={{ fontFamily: 'Sora, sans-serif' }}>Reminder Sent ✓</p>
                                    <p className="text-sm text-gray-400 mt-1">The drafted email has been dispatched</p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* ─── Footer ─────────────────────────────────────────────────── */}
                    {(status === 'ready' || status === 'sending') && (
                        <div className="px-6 py-4 border-t border-teal-100/60 flex justify-between items-center bg-white">
                            <button
                                onClick={() => fetchDraft(true)}
                                disabled={status === 'sending'}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-teal-700 hover:bg-teal-50 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed border border-teal-200 font-semibold"
                            >
                                <RefreshCw className={`w-4 h-4 ${status === 'sending' ? '' : 'group-hover:animate-spin'}`} />
                                <Sparkles className="w-3 h-3" />
                                Regenerate
                            </button>

                            <button
                                onClick={handleSend}
                                disabled={status === 'sending'}
                                className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ backgroundColor: '#0d9488', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' }}
                            >
                                {status === 'sending' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Sending…
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Email
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
