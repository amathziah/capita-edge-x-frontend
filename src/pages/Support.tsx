import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Bug, Lightbulb, MessageSquare, CheckCircle2, History, ArrowRight, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';

type ReportType = 'bug' | 'feature_request' | 'feedback' | 'ui_issue';

export function Support() {
    const [type, setType] = useState<ReportType>('feedback');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [reports, setReports] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(true);

    const categories = [
        { id: 'bug', label: 'Report Bug', icon: Bug, color: 'text-rose-500', bg: 'bg-rose-50' },
        { id: 'feature_request', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50' },
        { id: 'feedback', label: 'General Feedback', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary-light' },
        { id: 'ui_issue', label: 'UI/UX Issue', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
    ];

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoadingReports(true);
            const data = await dataService.getReports();
            setReports(data || []);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoadingReports(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        try {
            setIsSubmitting(true);
            const metadata = {
                browser: navigator.userAgent,
                screen: `${window.innerWidth}x${window.innerHeight}`,
                timestamp: new Date().toISOString()
            };

            await dataService.createReport({
                type,
                title,
                description,
                metadata
            });

            setSubmitted(true);
            setTitle('');
            setDescription('');
            fetchReports();
            setTimeout(() => setSubmitted(false), 5000);
        } catch (error) {
            console.error('Submission failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
                    <ShieldCheck className="w-4 h-4" />
                    Operational Integrity
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">Support & Feedback</h1>
                <p className="text-gray-400 text-sm font-medium">
                    Help us improve the platform by reporting issues or suggesting new features.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submission Form */}
                <div className="lg:col-span-2 bg-[#161a2b]/80 backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Category</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setType(cat.id as ReportType)}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all text-center group
                                            ${type === cat.id
                                                ? 'border-teal-500/30 bg-teal-500/10'
                                                : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'}`}
                                    >
                                        <cat.icon className={`w-5 h-5 ${type === cat.id ? 'text-teal-400' : 'text-gray-500 group-hover:text-gray-400'}`} />
                                        <span className={`text-[10px] font-bold ${type === cat.id ? 'text-white' : 'text-gray-500'}`}>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Subject</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Brief summary of the issue..."
                                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm font-semibold focus:bg-white/[0.05] focus:border-teal-500/40 outline-none transition-all placeholder:text-gray-600"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the issue or suggestion in detail..."
                                    rows={5}
                                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm font-medium focus:bg-white/[0.05] focus:border-teal-500/40 outline-none transition-all resize-none placeholder:text-gray-600"
                                />
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {submitted ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600"
                                >
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                    <span className="text-sm font-bold">Report submitted successfully.</span>
                                </motion.div>
                            ) : (
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !title}
                                        className="px-8 py-3 bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-30 active:scale-[0.98] hover:shadow-teal-500/30"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                Submit Report
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>

                {/* History List */}
                <div className="bg-[#161a2b]/60 backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col h-[600px]">
                    <div className="p-6 border-b border-white/[0.06] flex items-center gap-3 bg-white/[0.04]">
                        <History className="w-4 h-4 text-gray-500" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Recent Reports</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                        {loadingReports ? (
                            <div className="space-y-4 animate-pulse">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="p-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 h-3 bg-white/10 rounded" />
                                                <div className="w-16 h-2 bg-white/5 rounded" />
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-white/10" />
                                        </div>
                                        <div className="w-3/4 h-4 bg-white/10 rounded" />
                                        <div className="w-full h-3 bg-white/5 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-6">
                                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/[0.04]">
                                    <MessageSquare className="w-6 h-6 text-gray-600" />
                                </div>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">No reports found</p>
                            </div>
                        ) : (
                            reports.map((report) => (
                                <div
                                    key={report.id}
                                    className="p-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1.5 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${report.type === 'bug' ? 'bg-rose-500/10 text-rose-400' :
                                                    report.type === 'feature_request' ? 'bg-amber-500/10 text-amber-400' :
                                                        report.type === 'ui_issue' ? 'bg-blue-500/10 text-blue-400' : 'bg-teal-500/10 text-teal-400'
                                                    }`}>
                                                    {report.type.replace('_', ' ')}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-500">
                                                    {new Date(report.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="text-gray-200 font-bold text-[13px] truncate">{report.title}</h3>
                                            <p className="text-gray-500 text-[11px] line-clamp-2 leading-relaxed">{report.description}</p>
                                        </div>
                                        <div className={`shrink-0 w-2 h-2 rounded-full mt-2 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${report.status === 'resolved' ? 'bg-emerald-500 shadow-emerald-500/40' :
                                            report.status === 'in_progress' ? 'bg-amber-500 shadow-amber-500/40' : 'bg-teal-500/40'
                                            }`} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
