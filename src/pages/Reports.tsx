import { useState, useEffect, useMemo } from "react";
import { BarChart as BarChartIcon, LineChart as LineChartIcon, Loader2, DollarSign, Wallet, PieChart, Activity, Lightbulb, ArrowUpRight, ArrowDownRight, FileText, AlertTriangle, Users, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import {
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area
} from "recharts";
import { dataService } from '../services/dataService';
import { ReportInsights } from "../components/ReportInsights";
import { useData } from "../contexts/DataContext";
import { usePersona } from "../contexts/PersonaContext";

export function Reports() {
  const { invoices, payments, customers } = useData();
  const { businessType } = usePersona();
  const isSolopreneur = businessType === 'solopreneur';
  
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

  // ---------------------------------------------------------------------------
  // Solopreneur Reports Logic
  // ---------------------------------------------------------------------------
  const solReports = useMemo(() => {
    if (!isSolopreneur || invoices.length === 0) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Monthly Income Summary
    const thisMonthInvoices = invoices.filter(i => {
      const d = new Date(i.date || '');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const totalInvoiced = thisMonthInvoices.reduce((s, i) => s + (i.total || 0), 0);
    
    const thisMonthPayments = payments.filter(p => {
      const d = new Date(p.date || '');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const totalCollected = thisMonthPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced * 100).toFixed(0) : '0';

    // 2. Aged Receivables
    const outstanding = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
    const aged = {
      b0_30: { total: 0, count: 0 },
      b31_60: { total: 0, count: 0 },
      b60_plus: { total: 0, count: 0 }
    };

    outstanding.forEach(i => {
      const due = new Date(i.dueDate || '');
      const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      const amount = i.total || 0;

      if (diffDays > 60) { aged.b60_plus.total += amount; aged.b60_plus.count++; }
      else if (diffDays > 30) { aged.b31_60.total += amount; aged.b31_60.count++; }
      else { aged.b0_30.total += amount; aged.b0_30.count++; }
    });

    // 3. Top Clients by Revenue
    const totalLifetimeRev = customers.reduce((s, c) => s + ((c as any).total_invoiced_lifetime || 0), 0);
    const topClients = [...customers]
      .sort((a, b) => ((b as any).total_invoiced_lifetime || 0) - ((a as any).total_invoiced_lifetime || 0))
      .slice(0, 5)
      .map(c => {
        const ltv = (c as any).total_invoiced_lifetime || 0;
        return {
          name: c.name,
          ltv,
          pct: totalLifetimeRev > 0 ? Math.round((ltv / totalLifetimeRev) * 100) : 0
        };
      });
    const concentrationRisk = topClients.find(c => c.pct > 50);

    // 4. GST Summary (Current Quarter)
    // Jan-Mar (0,1,2), Apr-Jun (3,4,5), Jul-Sep (6,7,8), Oct-Dec (9,10,11)
    const quarter = Math.floor(now.getMonth() / 3);
    const quarterInvoices = invoices.filter(i => {
      const d = new Date(i.date || '');
      return Math.floor(d.getMonth() / 3) === quarter && d.getFullYear() === currentYear;
    });

    const gst = quarterInvoices.reduce((acc, i) => {
      acc.cgst += (i as any).cgst_amount || 0;
      acc.sgst += (i as any).sgst_amount || 0;
      acc.igst += (i as any).igst_amount || 0;
      return acc;
    }, { cgst: 0, sgst: 0, igst: 0 });
    const totalGst = gst.cgst + gst.sgst + gst.igst;

    // 5. TDS Tracker
    const tdsInvoices = invoices.filter(i => (i as any).tds_applicable);
    const totalTds = tdsInvoices.reduce((s, i) => s + ((i as any).tds_amount || 0), 0);

    return {
      monthly: { totalInvoiced, totalCollected, collectionRate },
      aged,
      topClients,
      concentrationRisk,
      gst: { ...gst, totalGst },
      tds: { invoices: tdsInvoices, totalTds }
    };
  }, [isSolopreneur, invoices, payments, customers]);

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
      ) : isSolopreneur && solReports ? (
        <div className="space-y-8 pb-10">
          {/* Report 1: Monthly Income Summary */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden group relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -z-10 -mr-16 -mt-16" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Monthly Income Summary</h3>
            </div>
            <div className="text-2xl font-black text-gray-900">
              ₹{solReports.monthly.totalInvoiced.toLocaleString()} <span className="text-gray-300 mx-2">·</span> 
              <span className="text-emerald-600">₹{solReports.monthly.totalCollected.toLocaleString()}</span> <span className="text-gray-300 mx-2">·</span> 
              <span className="text-teal-500">{solReports.monthly.collectionRate}%</span> rate
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">Performance for the current calendar month</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Report 2: Aged Receivables */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock size={20} />
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Who Owes Me <span className="text-gray-400 font-medium">(Aged Receivables)</span></h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">0–30 days</p>
                  <div className="text-lg font-black text-gray-900">₹{solReports.aged.b0_30.total.toLocaleString()}</div>
                  <p className="text-[10px] text-gray-500 font-bold">{solReports.aged.b0_30.count} invoices</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">31–60 days</p>
                  <div className="text-lg font-black text-gray-900">₹{solReports.aged.b31_60.total.toLocaleString()}</div>
                  <p className="text-[10px] text-gray-500 font-bold">{solReports.aged.b31_60.count} invoices</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">60+ days (at risk)</p>
                  <div className="text-lg font-black text-rose-700">₹{solReports.aged.b60_plus.total.toLocaleString()}</div>
                  <p className="text-[10px] text-rose-500 font-bold">{solReports.aged.b60_plus.count} invoices</p>
                </div>
              </div>
            </div>

            {/* Report 3: Top Clients */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <Users size={20} />
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Top Clients by Revenue</h3>
              </div>
              <div className="space-y-3">
                {solReports.topClients.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-300">#{idx + 1}</span>
                      <span className="font-bold text-gray-900">{c.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-gray-900">₹{c.ltv.toLocaleString()}</div>
                      <div className="text-[10px] text-teal-600 font-bold">{c.pct}% of total</div>
                    </div>
                  </div>
                ))}
              </div>
              {solReports.concentrationRisk && (
                <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                  <p className="text-xs text-amber-800 leading-snug">
                    <span className="font-black uppercase tracking-tight">Revenue concentration risk</span> — 
                    <span className="font-bold"> {solReports.concentrationRisk.name}</span> is {solReports.concentrationRisk.pct}% of your total revenue.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Report 4: GST Summary */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full blur-2xl -z-10" />
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-teal-100 text-teal-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">GST Summary <span className="text-gray-400 font-medium">(This Quarter)</span></h3>
              </div>
              <div className="mb-6">
                <div className="text-3xl font-black text-emerald-700">₹{solReports.gst.totalGst.toLocaleString()}</div>
                <p className="text-xs text-gray-500 font-medium mt-1">Total GST collected from invoices this quarter</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">CGST</p>
                  <p className="text-sm font-bold">₹{solReports.gst.cgst.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">SGST</p>
                  <p className="text-sm font-bold">₹{solReports.gst.sgst.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">IGST</p>
                  <p className="text-sm font-bold">₹{solReports.gst.igst.toLocaleString()}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-900 rounded-2xl">
                <p className="text-[11px] text-teal-400 font-black uppercase tracking-[0.15em] mb-1">Action Required</p>
                <p className="text-xs text-white/90 font-medium leading-relaxed">
                  File GSTR-3B by 20th of next month to pay this amount to the government.
                </p>
              </div>
            </div>

            {/* Report 5: TDS Tracker */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">TDS Tracker</h3>
              </div>
              <div className="flex-1 overflow-auto max-h-[300px] mb-6 custom-scrollbar">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 bg-white border-b border-gray-100">
                    <tr>
                      <th className="py-2 text-gray-400 font-black uppercase">Invoice</th>
                      <th className="py-2 text-gray-400 font-black uppercase">Customer</th>
                      <th className="py-2 text-right text-gray-400 font-black uppercase">TDS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {solReports.tds.invoices.map((i, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-bold text-gray-900 truncate max-w-[80px]">{i.invoiceNumber}</td>
                        <td className="py-3 font-medium text-gray-600 max-w-[120px] truncate">{i.buyer?.name || 'Client'}</td>
                        <td className="py-3 text-right font-black text-amber-600">₹{((i as any).tds_amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {solReports.tds.invoices.length === 0 && (
                  <div className="py-10 text-center text-gray-300 font-bold uppercase tracking-widest">No TDS Invoices</div>
                )}
              </div>
              <div className="mt-auto p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Credit</p>
                <div className="text-xl font-black text-gray-900">₹{solReports.tds.totalTds.toLocaleString()}</div>
                <p className="text-[11px] text-emerald-700/70 mt-2 font-bold leading-relaxed">
                  Claim this entire amount as tax credit when filing your ITR.
                </p>
              </div>
            </div>
          </div>
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
        </>
      )}
    </div>
  );
}
