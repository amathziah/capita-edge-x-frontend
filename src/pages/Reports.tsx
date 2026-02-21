import { useState, useEffect } from "react";
import { BarChart as BarChartIcon, LineChart as LineChartIcon, Download, Loader2, DollarSign, Wallet, PieChart, Activity, Lightbulb, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area
} from "recharts";
import { dataService } from '../services/dataService';
import { ReportInsights } from "../components/ReportInsights";

export function Reports() {
  const [data, setData] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInsights, setShowInsights] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const trends = await dataService.getRevenueTrends('monthly') as any[];
        const mapped = trends.map((t: any) => ({
          month: t.period,
          revenue: t.revenue,
          expenses: t.expenses
        }));
        setData(mapped);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAiInsights = async () => {
      try {
        setIsAiLoading(true);
        const insights = await dataService.getAiInsights();
        setAiInsights(insights as any[]);
      } catch (error) {
        console.error("Failed to fetch AI insights:", error);
      } finally {
        setIsAiLoading(false);
      }
    };

    fetchData();
    fetchAiInsights();
  }, []);

  const totalRevenue = data.reduce((s, d) => s + (d.revenue || 0), 0);
  const totalExpenses = data.reduce((s, d) => s + (d.expenses || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  let growthRate = 0;
  let growthType = "up";
  if (data.length >= 2) {
    const last = data[data.length - 1].revenue;
    const prev = data[data.length - 2].revenue;
    if (prev > 0) {
      const diff = last - prev;
      growthRate = Math.round((diff / prev) * 100);
      growthType = diff >= 0 ? "up" : "down";
    }
  }

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await dataService.exportData('invoices');
    } catch (error) {
      console.error("Failed to export report:", error);
      alert("Failed to export report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50/50">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-emerald-400 border-dotted rounded-full animate-spin [animation-duration:3s]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-full opacity-10 animate-ping [animation-duration:1.5s]"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-emerald-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
          </div>
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-sm font-semibold tracking-widest text-emerald-800 uppercase">Generating Financial Reports</h3>
          <div className="flex justify-center gap-1">
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></span>
          </div>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      sub: data.length > 0 ? `${data.length} months tracked` : 'No data yet',
      trend: growthRate,
      trendType: growthType,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-500/25',
      accent: 'text-emerald-600',
      bg: 'from-emerald-50/60 via-white to-teal-50/40',
      borderColor: 'border-emerald-200/60',
      ring: 'bg-emerald-500',
      delay: 0,
    },
    {
      title: "Total Expenses",
      value: `₹${totalExpenses.toLocaleString()}`,
      sub: 'Across all categories',
      trend: null,
      trendType: "down",
      icon: Wallet,
      gradient: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/25',
      accent: 'text-amber-600',
      bg: 'from-amber-50/60 via-white to-orange-50/40',
      borderColor: 'border-amber-200/60',
      ring: 'bg-amber-500',
      delay: 0.05,
    },
    {
      title: "Net Profit",
      value: `₹${netProfit.toLocaleString()}`,
      sub: netProfit >= 0 ? 'Profitable' : 'Loss period',
      trend: null,
      trendType: netProfit >= 0 ? "up" : "down",
      icon: Activity,
      gradient: netProfit >= 0 ? 'from-teal-500 to-cyan-500' : 'from-red-500 to-rose-500',
      glow: netProfit >= 0 ? 'shadow-teal-500/25' : 'shadow-red-500/25',
      accent: netProfit >= 0 ? 'text-teal-600' : 'text-red-600',
      bg: netProfit >= 0 ? 'from-teal-50/60 via-white to-cyan-50/40' : 'from-red-50/60 via-white to-rose-50/40',
      borderColor: netProfit >= 0 ? 'border-teal-200/60' : 'border-red-200/60',
      ring: netProfit >= 0 ? 'bg-teal-500' : 'bg-red-500',
      delay: 0.1,
    },
    {
      title: "Avg Margin",
      value: `${totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0}%`,
      sub: 'Revenue margin',
      trend: null,
      trendType: "up",
      icon: PieChart,
      gradient: 'from-violet-500 to-purple-500',
      glow: 'shadow-violet-500/25',
      accent: 'text-violet-600',
      bg: 'from-violet-50/60 via-white to-purple-50/40',
      borderColor: 'border-violet-200/60',
      ring: 'bg-violet-500',
      delay: 0.15,
    },
  ];

  return (
    <div className="relative p-4 md:p-8 space-y-6 md:space-y-8 min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_#ecfdf5_0%,_#f0fdf4_30%,_#f8fafc_100%)]" />
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl -z-10" />
      <div className="absolute bottom-20 left-0 h-60 w-60 rounded-full bg-teal-100/30 blur-[100px] -z-10" />

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between md:items-end gap-6"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 mb-2">
            Financial Analytics
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
            Reports & Insights
          </h2>
          <p className="text-gray-500 mt-1.5">
            Real-time insights into your business performance and health.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowInsights(true)}
            disabled={isAiLoading}
            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:from-emerald-400 hover:to-teal-500 transition-all select-none disabled:opacity-70"
          >
            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
            {isAiLoading ? 'Analyzing...' : 'View Insights'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/80 backdrop-blur border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </motion.div>

      {data.length === 0 ? (
        <div className="p-12 text-center bg-white/80 backdrop-blur rounded-2xl border border-dashed border-gray-200 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChartIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No data available</h3>
          <p className="text-gray-500 mt-2">Start creating invoices and expenses to see your financial analytics.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {kpiCards.map((card) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.05 + card.delay, ease: [0.23, 1, 0.32, 1] }}
                className={`relative bg-gradient-to-br ${card.bg} backdrop-blur-xl p-5 rounded-2xl border ${card.borderColor} shadow-sm hover:shadow-lg ${card.glow} hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group overflow-hidden cursor-default`}
              >
                {/* Glow orbs */}
                <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-[0.07] rounded-full blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500`} />
                <div className={`absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-tr ${card.gradient} opacity-[0.05] rounded-full blur-2xl`} />
                {/* Shimmer */}
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />

                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 bg-gradient-to-br ${card.gradient} text-white rounded-xl shadow-lg ${card.glow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <card.icon size={18} strokeWidth={2.2} />
                    </div>
                    {card.trend !== null && card.trend !== 0 && (
                      <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg ${card.trendType === "up"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                        }`}>
                        {card.trendType === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {Math.abs(card.trend)}%
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-1">{card.title}</p>
                  <h3 className="text-[28px] font-extrabold text-gray-900 tracking-tight leading-none">{card.value}</h3>
                  <p className={`text-xs ${card.accent} mt-2 font-semibold flex items-center gap-1.5`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${card.ring}`} />
                    {card.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <ReportInsights
            data={data}
            aiInsights={aiInsights}
            isOpen={showInsights}
            onClose={() => setShowInsights(false)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Expenses — Area Chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-emerald-100/60 overflow-hidden relative group"
            >
              {/* Decorative glow */}
              <div className="absolute -top-14 -right-14 w-32 h-32 bg-emerald-200/20 rounded-full blur-3xl group-hover:bg-emerald-200/30 transition-all duration-500" />

              <div className="relative flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-300/30">
                    <LineChartIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Revenue vs Expenses</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Monthly cash flow trends</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-semibold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    <span className="text-gray-500">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-gray-400 to-slate-400"></div>
                    <span className="text-gray-500">Expenses</span>
                  </div>
                </div>
              </div>

              <div className="h-72 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const rev = payload.find((p: any) => p.dataKey === 'revenue')?.value ?? 0;
                        const exp = payload.find((p: any) => p.dataKey === 'expenses')?.value ?? 0;
                        const diff = (rev as number) - (exp as number);
                        return (
                          <div className="bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl p-4 rounded-xl text-sm ring-1 ring-black/[0.03]">
                            <div className="font-bold text-gray-900 mb-2.5 text-xs uppercase tracking-wider">{label}</div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between gap-8 text-emerald-600">
                                <span className="font-medium">Revenue</span>
                                <span className="font-bold">₹{(rev as number).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between gap-8 text-gray-500">
                                <span className="font-medium">Expenses</span>
                                <span className="font-bold">₹{(exp as number).toLocaleString()}</span>
                              </div>
                              <div className={`flex justify-between gap-8 pt-2 mt-2 border-t border-gray-100 font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                <span>Net</span>
                                <span>{diff >= 0 ? '+' : ''}₹{diff.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      dot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#9ca3af"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorExpenses)"
                      dot={{ r: 3, fill: '#9ca3af', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: '#9ca3af', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Monthly Breakdown — Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-violet-100/60 overflow-hidden relative group"
            >
              {/* Decorative glow */}
              <div className="absolute -top-14 -left-14 w-32 h-32 bg-violet-200/20 rounded-full blur-3xl group-hover:bg-violet-200/30 transition-all duration-500" />

              <div className="relative flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg shadow-violet-300/30">
                    <BarChartIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Comparative Analysis</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Side-by-side performance</p>
                  </div>
                </div>
              </div>

              <div className="h-72 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
                    <defs>
                      <linearGradient id="barRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="barExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb923c" stopOpacity={1} />
                        <stop offset="100%" stopColor="#ea580c" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(139, 92, 246, 0.04)' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        return (
                          <div className="bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl p-4 rounded-xl text-sm ring-1 ring-black/[0.03]">
                            <div className="font-bold text-gray-900 mb-2.5 text-xs uppercase tracking-wider">{label}</div>
                            <div className="space-y-1.5">
                              {payload.map((p: any) => (
                                <div key={p.dataKey} className="flex justify-between gap-8">
                                  <span className="font-medium" style={{ color: p.dataKey === 'revenue' ? '#8b5cf6' : '#fb923c' }}>{p.name}</span>
                                  <span className="font-bold text-gray-900">₹{(p.value ?? 0).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '16px', fontSize: '11px', fontWeight: 600 }}
                      formatter={(value: string) => <span className="text-gray-500 ml-1">{value}</span>}
                    />
                    <Bar name="Revenue" dataKey="revenue" fill="url(#barRevenue)" radius={[6, 6, 0, 0]} barSize={14} />
                    <Bar name="Expenses" dataKey="expenses" fill="url(#barExpenses)" radius={[6, 6, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
