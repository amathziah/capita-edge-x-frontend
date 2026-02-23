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
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    <ShieldCheck className="w-4 h-4" />
                    Operational Integrity
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Support & Feedback</h1>
                <p className="text-gray-500 text-sm font-medium">
                    Help us improve the platform by reporting issues or suggesting new features.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submission Form */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-soft p-5 md:p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Category</label>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setType(cat.id as ReportType)}
                                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all text-center group
                                            ${type === cat.id
                                            ? 'border-primary/30 bg-primary/5'
                                            : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}`}
                                >
                                    <cat.icon className={`w-4 h-4 ${type === cat.id ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                    <span className={`text-[9px] font-bold ${type === cat.id ? 'text-gray-900' : 'text-gray-500'}`}>{cat.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Subject</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Brief summary of the issue..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 text-sm font-semibold focus:bg-white focus:border-primary/40 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the issue or suggestion in detail..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 text-sm font-medium focus:bg-white focus:border-primary/40 outline-none transition-all resize-none"
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
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !title}
                                        className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/10 transition-all flex items-center gap-2 disabled:opacity-30 active:scale-[0.98]"
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
                <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden flex flex-col h-[600px]">
                    <div className="p-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
                        <History className="w-4 h-4 text-gray-400" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Recent Reports</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {loadingReports ? (
                            <div className="space-y-4 animate-pulse">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/30 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 h-3 bg-gray-100 rounded" />
                                                <div className="w-16 h-2 bg-gray-100/50 rounded" />
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-gray-100" />
                                        </div>
                                        <div className="w-3/4 h-4 bg-gray-100 rounded" />
                                        <div className="w-full h-3 bg-gray-100/50 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-6">
                                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                                    <MessageSquare className="w-6 h-6 text-gray-200" />
                                </div>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">No reports found</p>
                            </div>
                        ) : (
                            reports.map((report) => (
                                <div
                                    key={report.id}
                                    className="p-4 rounded-2xl border border-gray-50 hover:bg-gray-50/50 transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1.5 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${report.type === 'bug' ? 'bg-rose-50 text-rose-500' :
                                                    report.type === 'feature_request' ? 'bg-amber-50 text-amber-500' :
                                                        report.type === 'ui_issue' ? 'bg-blue-50 text-blue-500' : 'bg-primary-light text-primary'
                                                    }`}>
                                                    {report.type.replace('_', ' ')}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-300">
                                                    {new Date(report.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="text-gray-900 font-bold text-[13px] truncate">{report.title}</h3>
                                            <p className="text-gray-500 text-[11px] line-clamp-2 leading-relaxed">{report.description}</p>
                                        </div>
                                        <div className={`shrink-0 w-2 h-2 rounded-full mt-2 ${report.status === 'resolved' ? 'bg-emerald-500' :
                                            report.status === 'in_progress' ? 'bg-amber-500' : 'bg-primary/20'
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
