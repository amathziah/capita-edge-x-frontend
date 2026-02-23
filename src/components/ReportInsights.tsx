import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, Target, TrendingDown, Lightbulb, X } from "lucide-react";
import { useMemo } from "react";

interface ReportInsightsProps {
    data: any[];
    aiInsights: any[];
    isOpen: boolean;
    onClose: () => void;
}

interface Insight {
    id: string;
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    color: string;
    bg: string;
    gradient: string;
    description: string;
    segmentColor: string;
}

const TYPE_THEMES: Record<string, { icon: any, color: string, bg: string, gradient: string, segmentColor: string, border: string }> = {
    success: {
        icon: Trophy,
        color: "text-teal-400",
        bg: "bg-teal-500/10",
        gradient: "from-teal-500/20 to-emerald-500/10",
        segmentColor: "#14b8a6",
        border: "border-teal-500/20"
    },
    warning: {
        icon: TrendingDown,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        gradient: "from-amber-500/20 to-orange-500/10",
        segmentColor: "#f59e0b",
        border: "border-amber-500/20"
    },
    critical: {
        icon: Target,
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        gradient: "from-rose-500/20 to-red-500/10",
        segmentColor: "#f43f5e",
        border: "border-rose-500/20"
    },
    info: {
        icon: Lightbulb,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        gradient: "from-cyan-500/20 to-sky-500/10",
        segmentColor: "#06b6d4",
        border: "border-cyan-500/20"
    }
};

export function ReportInsights({ data, aiInsights, isOpen, onClose }: ReportInsightsProps) {
    // Reusing logic from ReportFlashcards to generate insights
    const insights = useMemo<Insight[]>(() => {
        // Preference: Real AI Insights
        if (aiInsights && aiInsights.length > 0) {
            return aiInsights.map(ai => {
                const theme = TYPE_THEMES[ai.type] || TYPE_THEMES.info;
                return {
                    id: ai.id,
                    title: ai.title,
                    value: ai.value,
                    subtitle: ai.subtitle,
                    description: ai.description,
                    icon: theme.icon,
                    color: theme.color,
                    bg: theme.bg,
                    gradient: theme.gradient,
                    segmentColor: theme.segmentColor
                };
            });
        }

        // Fallback: Calculated Insights if AI is not present
        if (!data || data.length === 0) return [];

        const sortedByRevenue = [...data].sort((a, b) => b.revenue - a.revenue);

        const efficientMonths = data.filter(d => d.revenue > 0)
            .sort((a, b) => (a.expenses / a.revenue) - (b.expenses / b.revenue));
        const efficientMonth = efficientMonths[0];

        const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);
        const avgRevenue = totalRevenue / data.length;

        const lastMonth = data[data.length - 1];
        const performanceVsAvg = lastMonth ? ((lastMonth.revenue - avgRevenue) / avgRevenue) * 100 : 0;

        return [
            {
                id: "best-month",
                title: "Star Performer",
                value: sortedByRevenue[0] ? sortedByRevenue[0].month : "N/A",
                subtitle: `Highest revenue: ₹${sortedByRevenue[0]?.revenue.toLocaleString()}`,
                icon: Trophy,
                color: "text-teal-400",
                bg: "bg-teal-500/10",
                gradient: "from-teal-500/20 to-emerald-500/10",
                description: "This month set the record for highest earnings.",
                segmentColor: "#14b8a6"
            },
            {
                id: "efficiency",
                title: "Efficiency King",
                value: efficientMonth ? efficientMonth.month : "N/A",
                subtitle: efficientMonth
                    ? `Lowest expense ratio (${((efficientMonth.expenses / efficientMonth.revenue) * 100).toFixed(1)}%)`
                    : "N/A",
                icon: Target,
                color: "text-teal-400",
                bg: "bg-teal-500/10",
                gradient: "from-teal-500/20 to-emerald-500/10",
                description: "You managed your costs most effectively during this period.",
                segmentColor: "#14b8a6"
            },
            {
                id: "trend",
                title: "Recent Momentum",
                value: `${performanceVsAvg > 0 ? '+' : ''}${performanceVsAvg.toFixed(1)}%`,
                subtitle: `${performanceVsAvg >= 0 ? "Above" : "Below"} average`,
                icon: TrendingDown,
                color: performanceVsAvg >= 0 ? "text-teal-400" : "text-rose-400",
                bg: performanceVsAvg >= 0 ? "bg-teal-500/10" : "bg-rose-500/10",
                gradient: performanceVsAvg >= 0 ? "from-teal-500/20 to-emerald-500/10" : "from-rose-500/20 to-red-500/10",
                description: performanceVsAvg >= 0 ? "Great job! You're trending upwards." : "A bit of a dip, let's turn it around.",
                segmentColor: performanceVsAvg >= 0 ? "#14b8a6" : "#f43f5e"
            },
            {
                id: "insight",
                title: "Smart Insight",
                value: "Optimization",
                subtitle: "Reduce expenses in low months.",
                icon: Lightbulb,
                color: "text-teal-400",
                bg: "bg-teal-500/10",
                gradient: "from-teal-500/20 to-sky-500/10",
                description: "Actionable advice to improve your bottom line.",
                segmentColor: "#14b8a6"
            }
        ];
    }, [data, aiInsights]);


    if (!isOpen || !data || data.length === 0) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Main Container */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-4xl bg-[#0c0f1a] rounded-[2.5rem] border border-white/[0.08] shadow-2xl overflow-hidden max-h-[85vh] md:max-h-[90vh] flex flex-col mx-4 md:mx-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-white/[0.06] flex items-center justify-between bg-gradient-to-r from-teal-500/5 to-transparent gap-4">
                            <div className="min-w-0">
                                <h2 className="text-lg md:text-xl font-black text-white tracking-tight">Key Business Insights</h2>
                                <p className="text-teal-400/60 text-[12px] uppercase font-bold tracking-[0.2em]">Performance highlights and actionable intelligence.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all shrink-0"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content Grid */}
                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {insights.map((insight, idx) => (
                                    <motion.div
                                        key={insight.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="relative p-5 rounded-[2.5rem] border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-teal-500/30 transition-all duration-500 group overflow-hidden"
                                    >
                                        {/* Inner Glass Glow */}
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${insight.gradient} blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity`} />

                                        <div className="relative flex items-start gap-4">
                                            <div className={`p-4 rounded-2xl shrink-0 ${insight.bg} ${insight.color} border border-white/[0.05] group-hover:scale-110 transition-all duration-500`}>
                                                <insight.icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-[11px] font-black text-teal-400 uppercase tracking-[0.2em] mb-1">{insight.title}</h3>
                                                <div className="text-xl font-black text-white mb-0.5 truncate tracking-tight">
                                                    {insight.value}
                                                </div>
                                                <p className={`text-[12px] font-bold ${insight.color} mb-3 opacity-90`}>{insight.subtitle}</p>
                                                <div className="bg-white/[0.03] p-4 rounded-[1.5rem] border border-white/[0.05] group-hover:border-teal-500/20 transition-colors">
                                                    <p className="text-[12px] text-gray-400 leading-relaxed font-medium">
                                                        {insight.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Footer Decoration */}
                        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
