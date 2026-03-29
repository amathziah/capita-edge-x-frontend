import { useState, useEffect } from "react";
import { BarChart as BarChartIcon, LineChart as LineChartIcon, Loader2, DollarSign, Wallet, PieChart, Activity, Lightbulb, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area
} from "recharts";
import { dataService } from '../services/dataService';
import { delay } from '../services/aiService';
import { ReportInsights } from "../components/ReportInsights";
import { usePersona } from "../contexts/PersonaContext";
import { useData } from "../contexts/DataContext";


export function Reports() {
  const { invoices } = useData();
  const { businessType } = usePersona();

  
  const [data, setData] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInsights, setShowInsights] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // If we have data already, don't show the full page loader
        if (data.length === 0) setLoading(true);
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
        // Stagger to avoid RPM limit - especially on initial burst
        await delay(1500); 
        const insights = await dataService.getAiInsights(businessType || undefined);
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


  if (loading && data.length === 0) {
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
      gradient: 'from-teal-500 to-emerald-500',
      glow: 'shadow-teal-500/10',
      accent: 'text-teal-600',
      bg: 'bg-white',
      border: 'border-white',
      ring: 'bg-teal-500',
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
      glow: 'shadow-amber-500/10',
      accent: 'text-amber-600',
      bg: 'bg-white',
      border: 'border-white',
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
      gradient: netProfit >= 0 ? 'from-teal-600 to-cyan-600' : 'from-rose-600 to-red-600',
      glow: netProfit >= 0 ? 'shadow-teal-600/10' : 'shadow-rose-600/10',
      accent: netProfit >= 0 ? 'text-teal-600' : 'text-rose-600',
      bg: 'bg-white',
      border: 'border-white',
      ring: netProfit >= 0 ? 'bg-teal-500' : 'bg-rose-500',
      delay: 0.1,
    },
    {
      title: "Avg Margin",
      value: `${totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0}%`,
      sub: 'Revenue margin',
      trend: null,
      trendType: "up",
      icon: PieChart,
      gradient: 'from-slate-600 to-slate-800',
      glow: 'shadow-slate-500/10',
      accent: 'text-slate-600',
      bg: 'bg-white',
      border: 'border-white',
      ring: 'bg-slate-500',
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
          <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.2em] text-teal-600 mb-2">
            Financial Analytics
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Reports & Insights
          </h2>
          <p className="text-gray-500 text-[15px] font-medium mt-1">
            Real-time insights into your business performance and health.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowInsights(true)}
            disabled={isAiLoading}
            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-[13px] font-bold text-white shadow-lg shadow-slate-900/10 transition-all select-none disabled:opacity-70 active:scale-[0.98]"
          >
            {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5 text-teal-400" />}
            {isAiLoading ? 'Analyzing...' : 'View Insights'}
          </button>
        </div>
      </motion.div>

      {invoices.length === 0 ? (
        <div className="p-12 text-center bg-white/80 backdrop-blur rounded-2xl border border-dashed border-gray-200 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChartIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No data available</h3>
          <p className="text-gray-500 mt-2">Start creating invoices and expenses to see your financial analytics.</p>
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {kpiCards.map((card) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.05 + card.delay, ease: [0.23, 1, 0.32, 1] }}
                className={`relative ${card.bg} p-5 rounded-3xl border border-gray-100 shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden cursor-default`}
              >
                {/* Glow orbs */}
                <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity duration-500`} />

                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 bg-gray-50 text-slate-800 rounded-xl border border-gray-100 group-hover:scale-110 transition-all duration-300`}>
                      <card.icon size={16} strokeWidth={2.5} className={card.accent} />
                    </div>
                    {card.trend !== null && card.trend !== 0 && (
                      <div className={`flex items-center gap-1 text-[12px] font-black px-2 py-0.5 rounded-lg border ${card.trendType === "up"
                        ? "bg-teal-50 text-teal-600 border-teal-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                        }`}>
                        {card.trendType === "up" ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                        {Math.abs(card.trend)}%
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{card.title}</p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{card.value}</h3>
                  <p className={`text-[12px] ${card.accent} mt-3 font-bold flex items-center gap-1.5 opacity-80`}>
                    <span className={`w-1 h-1 rounded-full ${card.ring}`} />
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
              className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 overflow-hidden relative group"
            >
              <div className="relative flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 group-hover:scale-110 transition-transform">
                    <LineChartIcon size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Revenue vs Expenses</h3>
                    <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Monthly cash flow trends</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                    <span className="text-gray-400">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                    <span className="text-gray-400">Expenses</span>
                  </div>
                </div>
              </div>

              <div className="h-72 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.05} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const revenue = payload.find((p: any) => p.dataKey === 'revenue')?.value ?? 0;
                        const expenses = payload.find((p: any) => p.dataKey === 'expenses')?.value ?? 0;
                        const profit = (revenue as number) - (expenses as number);
                        return (
                          <div className="bg-white border border-gray-100 shadow-xl p-4 rounded-2xl ring-1 ring-black/[0.02]">
                            <div className="font-black text-slate-400 mb-3 text-[11px] uppercase tracking-[0.2em]">{label}</div>
                            <div className="space-y-2">
                              <div className="flex justify-between gap-10">
                                <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Revenue</span>
                                <span className="text-[12px] font-black text-teal-600">₹{(revenue as number).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between gap-10">
                                <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Expenses</span>
                                <span className="text-[12px] font-black text-slate-400">₹{(expenses as number).toLocaleString()}</span>
                              </div>
                              <div className={`flex justify-between gap-10 pt-2.5 mt-2.5 border-t border-gray-50`}>
                                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">Net Profit</span>
                                <span className={`text-[12px] font-black tracking-tight ${profit >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                                  {profit >= 0 ? '+' : ''}₹{profit.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#14b8a6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      dot={{ r: 0 }}
                      activeDot={{ r: 4, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={1}
                      fill="url(#colorExpenses)"
                      dot={{ r: 0 }}
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
              className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 overflow-hidden relative group"
            >
              <div className="relative flex items-start justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 group-hover:scale-110 transition-transform">
                    <BarChartIcon size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Comparative Analysis</h3>
                    <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Side-by-side performance</p>
                  </div>
                </div>
              </div>

              <div className="h-72 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={6}>
                    <defs>
                      <linearGradient id="barRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity={0.9} />
                      </linearGradient>
                      <linearGradient id="barExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(20, 184, 166, 0.03)' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        return (
                          <div className="bg-white border border-gray-100 shadow-xl p-4 rounded-2xl ring-1 ring-black/[0.02]">
                            <div className="font-black text-slate-400 mb-3 text-[11px] uppercase tracking-[0.2em]">{label}</div>
                            <div className="space-y-2">
                              {payload.map((p: any) => (
                                <div key={p.dataKey} className="flex justify-between gap-10">
                                  <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">{p.name}</span>
                                  <span className="text-[12px] font-black text-slate-900 tracking-tight">₹{(p.value ?? 0).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '24px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      formatter={(value: string) => <span className="text-gray-400 ml-1">{value}</span>}
                    />
                    <Bar name="Revenue" dataKey="revenue" fill="url(#barRevenue)" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar name="Expenses" dataKey="expenses" fill="url(#barExpenses)" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>


        </div>
      )}
    </div>
  );
}
