import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Lightbulb,
  Loader2,
  Receipt,
  Wallet
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { dataService } from '@/shared/services/dataService';
import { delay } from '@/shared/services/aiService';
import { ReportInsights } from '@/features/reports/components/ReportInsights';
import { usePersona } from '@/app/providers/PersonaContext';
import { useData } from '@/app/providers/DataContext';
import { ANALYTICS_STEPS } from '@/shared/utils/aiLoadingSteps';

type ReportsSnapshot = {
  trends: any[];
  cashFlow: any | null;
  stats: any | null;
};

function formatCurrency(value: number) {
  return `₹${Math.round(value || 0).toLocaleString()}`;
}

function formatPeriodLabel(period: string) {
  if (!period) return "Unknown";
  const [year, month] = period.split("-");
  if (year && month) {
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  return period;
}

export function Reports() {
  const { invoices } = useData();
  const { businessType } = usePersona();

  const [reportData, setReportData] = useState<ReportsSnapshot>({
    trends: [],
    cashFlow: null,
    stats: null
  });
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInsights, setShowInsights] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(ANALYTICS_STEPS[0]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [trends, cashFlow, stats] = await Promise.all([
          dataService.getRevenueTrends("monthly"),
          dataService.getCashFlowAnalysis(),
          dataService.getDashboardStats()
        ]);

        setReportData({
          trends: Array.isArray(trends) ? trends : [],
          cashFlow,
          stats
        });
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    const fetchAiInsights = async () => {
      try {
        setIsAiLoading(true);
        await delay(1500);
        const insights = await dataService.getAiInsights(businessType || undefined);
        setAiInsights(Array.isArray(insights) ? insights : []);
      } catch (error) {
        console.error("Failed to fetch AI insights:", error);
      } finally {
        setIsAiLoading(false);
      }
    };

    fetchAiInsights();
  }, [businessType]);

  useEffect(() => {
    if (!isAiLoading) {
      setCurrentStep(ANALYTICS_STEPS[0]);
      return;
    }

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % ANALYTICS_STEPS.length;
      setCurrentStep(ANALYTICS_STEPS[stepIdx]);
    }, 1800);

    return () => clearInterval(interval);
  }, [isAiLoading]);

  const trendRows = reportData.trends.map((item) => {
    const revenue = Number(item.revenue || 0);
    const expenses = Number(item.expenses || 0);
    const profit = revenue - expenses;

    return {
      ...item,
      label: formatPeriodLabel(item.period),
      revenue,
      expenses,
      profit
    };
  });

  const totalRevenue = Number(reportData.stats?.total_revenue || 0);
  const totalExpenses = Number(reportData.stats?.total_expenses || 0);
  const pendingPayments = Number(reportData.stats?.pending_payments || 0);
  const overdueRevenue = Number(reportData.stats?.overdue_revenue || 0);
  const netCashFlow = Number(reportData.cashFlow?.net_cash_flow || 0);
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;

  const previousRevenue = trendRows.length > 1 ? trendRows[trendRows.length - 2].revenue : 0;
  const currentRevenue = trendRows.length > 0 ? trendRows[trendRows.length - 1].revenue : 0;
  const revenueDelta = previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0;

  const summaryMessage =
    overdueRevenue > 0
      ? `You have ${formatCurrency(overdueRevenue)} overdue. Follow up first before taking on new spending.`
      : netCashFlow < 0
        ? "Cash flow is negative this month. Keep spending tight until collections improve."
        : profitMargin >= 30
          ? "This month looks healthy. You are keeping a strong margin after expenses."
          : "The business is active, but margin is still tight. Watch expenses and unpaid invoices.";

  const focusItems = [
    {
      title: "Money received",
      value: formatCurrency(totalRevenue),
      note: revenueDelta !== 0 ? `${revenueDelta > 0 ? "+" : ""}${revenueDelta}% vs last month` : "No previous month comparison yet",
      icon: Wallet,
      accent: "text-emerald-600",
      trend: revenueDelta
    },
    {
      title: "Money spent",
      value: formatCurrency(totalExpenses),
      note: `${profitMargin}% margin after expenses`,
      icon: Receipt,
      accent: "text-amber-600",
      trend: null
    },
    {
      title: "Still unpaid",
      value: formatCurrency(pendingPayments),
      note: overdueRevenue > 0 ? `${formatCurrency(overdueRevenue)} is overdue` : "Nothing overdue right now",
      icon: AlertTriangle,
      accent: overdueRevenue > 0 ? "text-rose-600" : "text-slate-600",
      trend: null
    }
  ];

  if (loading && reportData.trends.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-gray-50/50 space-y-4">
        <div className="relative mb-8">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-dotted border-emerald-400 [animation-duration:3s]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 animate-ping rounded-full bg-emerald-500 opacity-10 [animation-duration:1.5s]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-emerald-800">Preparing your monthly report</h3>
          <div className="flex justify-center gap-1">
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden px-4 py-4 md:px-6 md:py-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_#ecfdf5_0%,_#f0fdf4_30%,_#f8fafc_100%)]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 shrink-0 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <div className="mb-2 text-[12px] font-black uppercase tracking-[0.2em] text-teal-600">Simple Report</div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Reports & Insights</h2>
          <p className="mt-1 text-sm text-gray-500">A clean monthly view for solo operators: what came in, what went out, and what needs action.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => dataService.exportData("invoices")}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 shadow-sm transition-all hover:border-emerald-200 hover:text-emerald-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowInsights(true)}
            disabled={isAiLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-slate-900/10 transition-all disabled:opacity-70"
          >
            {isAiLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lightbulb className="h-5 w-5 text-teal-400" />}
            {isAiLoading ? currentStep : "View Insights"}
          </button>
        </div>
      </motion.div>

      {invoices.length === 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-dashed border-gray-200 bg-white/80 p-12 text-center shadow-sm backdrop-blur">
          <h3 className="text-lg font-bold text-gray-900">No data available</h3>
          <p className="mt-2 text-gray-500">Create invoices and expenses to see your report.</p>
        </div>
      ) : (
        <div className="mt-6 flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="space-y-6 pb-10">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">This month in plain English</div>
            <p className="mt-2 text-base font-semibold leading-7 text-slate-800">{summaryMessage}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {focusItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.04 * index }}
                className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl bg-gray-50 p-2.5">
                    <item.icon className={`h-4 w-4 ${item.accent}`} />
                  </div>
                  {typeof item.trend === "number" && item.trend !== 0 && (
                    <div className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[12px] font-black ${
                      item.trend > 0
                        ? "border-teal-100 bg-teal-50 text-teal-600"
                        : "border-rose-100 bg-rose-50 text-rose-600"
                    }`}>
                      {item.trend > 0 ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                      {Math.abs(item.trend)}%
                    </div>
                  )}
                </div>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">{item.title}</div>
                <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">{item.value}</div>
                <p className="mt-3 text-sm text-gray-500">{item.note}</p>
              </motion.div>
            ))}
          </div>

          <ReportInsights
            data={trendRows}
            aiInsights={aiInsights}
            isOpen={showInsights}
            onClose={() => setShowInsights(false)}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-black tracking-tight text-slate-900">Income vs expenses</h3>
                <p className="mt-1 text-sm text-gray-500">Your monthly trend. If the green area stays above the gold area, the month is working.</p>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="simpleRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="simpleExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.16} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload;
                        return (
                          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
                            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
                            <div className="space-y-2 text-[12px]">
                              <div className="flex justify-between gap-10">
                                <span className="font-bold text-gray-500">Income</span>
                                <span className="font-black text-emerald-600">{formatCurrency(row?.revenue || 0)}</span>
                              </div>
                              <div className="flex justify-between gap-10">
                                <span className="font-bold text-gray-500">Expenses</span>
                                <span className="font-black text-amber-600">{formatCurrency(row?.expenses || 0)}</span>
                              </div>
                              <div className="flex justify-between gap-10 border-t border-gray-50 pt-2">
                                <span className="font-bold text-gray-500">Left over</span>
                                <span className={`font-black ${(row?.profit || 0) >= 0 ? "text-sky-600" : "text-rose-600"}`}>{formatCurrency(row?.profit || 0)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#simpleRevenue)" dot={{ r: 0 }} />
                    <Area type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#simpleExpenses)" dot={{ r: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cash flow</div>
                <div className={`mt-2 text-3xl font-black tracking-tight ${netCashFlow >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                  {formatCurrency(netCashFlow)}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {netCashFlow >= 0 ? "You are bringing in more cash than you are spending." : "You spent more than you collected in the last 30 days."}
                </p>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Quick actions</div>
                <div className="mt-4 space-y-3 text-sm text-gray-600">
                  <p>{overdueRevenue > 0 ? `Follow up overdue invoices worth ${formatCurrency(overdueRevenue)}.` : "No overdue invoices. Keep invoicing consistently."}</p>
                  <p>{pendingPayments > 0 ? `Pending payments total ${formatCurrency(pendingPayments)}.` : "No pending payments waiting."}</p>
                  <p>{profitMargin >= 25 ? "Margin is in a healthy range." : "Try to improve margin by reducing spending or increasing collections."}</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
