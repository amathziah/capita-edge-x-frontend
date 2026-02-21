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

const TYPE_THEMES: Record<string, { icon: any, color: string, bg: string, gradient: string, segmentColor: string }> = {
    success: {
        icon: Trophy,
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        gradient: "from-emerald-100 to-green-100",
        segmentColor: "#10B981"
    },
    warning: {
        icon: TrendingDown,
        color: "text-amber-700",
        bg: "bg-amber-50",
        gradient: "from-amber-100 to-orange-100",
        segmentColor: "#F59E0B"
    },
    critical: {
        icon: Target,
        color: "text-rose-700",
        bg: "bg-rose-50",
        gradient: "from-rose-100 to-red-100",
        segmentColor: "#E11D48"
    },
    info: {
        icon: Lightbulb,
        color: "text-cyan-700",
        bg: "bg-cyan-50",
        gradient: "from-cyan-100 to-sky-100",
        segmentColor: "#06B6D4"
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
        const bestMonth = sortedByRevenue[0];

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
                value: bestMonth ? bestMonth.month : "N/A",
                subtitle: `Highest revenue: ₹${bestMonth?.revenue.toLocaleString()}`,
                icon: Trophy,
                color: "text-teal-700",
                bg: "bg-teal-50",
                gradient: "from-teal-100 to-emerald-100",
                description: "This month set the record for highest earnings.",
                segmentColor: "#14b8b8" // teal-500
            },
            {
                id: "efficiency",
                title: "Efficiency King",
                value: efficientMonth ? efficientMonth.month : "N/A",
                subtitle: efficientMonth
                    ? `Lowest expense ratio (${((efficientMonth.expenses / efficientMonth.revenue) * 100).toFixed(1)}%)`
                    : "N/A",
                icon: Target,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                gradient: "from-emerald-100 to-green-100",
                description: "You managed your costs most effectively during this period.",
                segmentColor: "#10B981" // emerald-500
            },
            {
                id: "trend",
                title: "Recent Momentum",
                value: `${Math.abs(performanceVsAvg).toFixed(1)}%`,
                subtitle: `${performanceVsAvg >= 0 ? "Above" : "Below"} average`,
                icon: performanceVsAvg >= 0 ? TrendingDown : TrendingDown,
                color: performanceVsAvg >= 0 ? "text-teal-600" : "text-rose-600",
                bg: performanceVsAvg >= 0 ? "bg-teal-50" : "bg-rose-50",
                gradient: performanceVsAvg >= 0 ? "from-teal-100 to-cyan-100" : "from-rose-100 to-red-100",
                description: performanceVsAvg >= 0 ? "Great job! You're trending upwards." : "A bit of a dip, let's turn it around.",
                segmentColor: performanceVsAvg >= 0 ? "#0D9488" : "#E11D48" // teal-600 or rose-600
            },
            {
                id: "insight",
                title: "Smart Insight",
                value: "Optimization",
                subtitle: "Reduce expenses in low months.",
                icon: Lightbulb,
                color: "text-cyan-600",
                bg: "bg-cyan-50",
                gradient: "from-cyan-100 to-sky-100",
                description: "Actionable advice to improve your bottom line.",
                segmentColor: "#06B6D4" // cyan-500
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
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Main Container */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-4xl bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] md:max-h-[90vh] flex flex-col mx-4 md:mx-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-teal-50/30 gap-4">
                            <div className="min-w-0">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">Key Business Insights</h2>
                                <p className="text-gray-500 text-xs md:text-sm truncate">Performance highlights and actionable intelligence.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors shrink-0"
                            >
                                <X className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Content Grid */}
                        <div className="p-6 md:p-8 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {insights.map((insight) => (
                                    <motion.div
                                        key={insight.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative p-6 rounded-2xl border border-gray-100 hover:border-teal-100 hover:shadow-lg transition-all duration-300 bg-white group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-4 rounded-xl shrink-0 ${insight.bg} ${insight.color} group-hover:scale-110 transition-transform`}>
                                                <insight.icon className="w-8 h-8" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{insight.title}</h3>
                                                <div className={`text-2xl font-bold ${insight.color} mb-1 truncate`}>
                                                    {insight.value}
                                                </div>
                                                <p className="text-sm text-gray-700 font-medium mb-3">{insight.subtitle}</p>
                                                <p className="text-sm text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-lg">
                                                    {insight.description}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
