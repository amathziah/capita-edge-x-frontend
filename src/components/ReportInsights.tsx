import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Lightbulb, TrendingUp, Wallet, X } from "lucide-react";
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
  description: string;
  icon: any;
  tone: string;
  iconBg: string;
}

function formatCurrency(value: number) {
  return `₹${Math.round(value || 0).toLocaleString()}`;
}

export function ReportInsights({ data, aiInsights, isOpen, onClose }: ReportInsightsProps) {
  const insights = useMemo<Insight[]>(() => {
    if (aiInsights && aiInsights.length > 0) {
      return aiInsights.slice(0, 3).map((item, index) => {
        const tones = [
          { icon: TrendingUp, tone: "text-emerald-700", iconBg: "bg-emerald-100" },
          { icon: Wallet, tone: "text-sky-700", iconBg: "bg-sky-100" },
          { icon: AlertTriangle, tone: "text-amber-700", iconBg: "bg-amber-100" }
        ];
        const theme = tones[index] || tones[0];

        return {
          id: item.id || `ai-${index}`,
          title: item.title || "Insight",
          value: item.value || item.subtitle || "Review this",
          description: item.description || item.subtitle || "Useful guidance for your report.",
          icon: theme.icon,
          tone: theme.tone,
          iconBg: theme.iconBg
        };
      });
    }

    if (!data || data.length === 0) return [];

    const totalRevenue = data.reduce((sum, row) => sum + (row.revenue || 0), 0);
    const totalExpenses = data.reduce((sum, row) => sum + (row.expenses || 0), 0);
    const totalProfit = totalRevenue - totalExpenses;
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const revenueDelta = previous?.revenue > 0
      ? Math.round((((latest?.revenue || 0) - previous.revenue) / previous.revenue) * 100)
      : 0;
    const bestMonth = [...data].sort((a, b) => (b.profit || 0) - (a.profit || 0))[0];
    const latestPending = Number(latest?.pending || 0) + Number(latest?.overdue || 0);

    return [
      {
        id: "money-left",
        title: "What you kept",
        value: formatCurrency(totalProfit),
        description: totalProfit >= 0
          ? "This is what stayed after expenses across the report period."
          : "Expenses are running ahead of income in the current report period.",
        icon: Wallet,
        tone: totalProfit >= 0 ? "text-emerald-700" : "text-rose-700",
        iconBg: totalProfit >= 0 ? "bg-emerald-100" : "bg-rose-100"
      },
      {
        id: "momentum",
        title: "Recent movement",
        value: revenueDelta === 0 ? "Flat" : `${revenueDelta > 0 ? "+" : ""}${revenueDelta}%`,
        description: revenueDelta >= 0
          ? "Income is moving in the right direction compared with the previous month."
          : "Income dipped versus the previous month, so watch collections closely.",
        icon: TrendingUp,
        tone: revenueDelta >= 0 ? "text-sky-700" : "text-amber-700",
        iconBg: revenueDelta >= 0 ? "bg-sky-100" : "bg-amber-100"
      },
      {
        id: "watch-now",
        title: "What needs attention",
        value: latestPending > 0 ? formatCurrency(latestPending) : "No unpaid pressure",
        description: latestPending > 0
          ? "This amount is still unpaid in the latest period and should be followed up first."
          : bestMonth
            ? `Your strongest month was ${bestMonth.label || bestMonth.period || "recently"}.`
            : "No urgent payment issue is visible right now.",
        icon: AlertTriangle,
        tone: latestPending > 0 ? "text-amber-700" : "text-emerald-700",
        iconBg: latestPending > 0 ? "bg-amber-100" : "bg-emerald-100"
      }
    ];
  }, [data, aiInsights]);

  if (!isOpen || !data || data.length === 0) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            className="relative mx-4 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-black tracking-tight text-slate-900">Simple insights</h2>
                <p className="mt-1 text-sm text-gray-500">Three quick takeaways from your report.</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl border border-gray-200 bg-white p-2 text-gray-400 transition-all hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Keep this screen practical.</div>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Use these notes to decide what to follow up, what to protect, and whether this month is improving.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {insights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="rounded-2xl border border-gray-100 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`rounded-xl p-3 ${insight.iconBg}`}>
                        <insight.icon className={`h-5 w-5 ${insight.tone}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">{insight.title}</div>
                        <div className={`mt-1 text-xl font-black tracking-tight ${insight.tone}`}>{insight.value}</div>
                        <p className="mt-2 text-sm leading-6 text-gray-600">{insight.description}</p>
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
