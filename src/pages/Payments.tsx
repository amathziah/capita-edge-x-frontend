import { useMemo, useState, useEffect } from "react";
import {
  CreditCard, Smartphone, DollarSign, AlertTriangle, CheckCircle, Download, Zap,
  TrendingUp, X, Search, Settings2, Eye, LayoutGrid, List,
  SortAsc, SortDesc, ArrowRight, Banknote, Clock, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { dataService } from '../services/dataService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PaymentView = {
  id: string;
  invoice: string;
  method: string;
  amount: number;
  date: string;
  reconciled: boolean;
};

type AIAlert = {
  id: string;
  type: "warning" | "info" | "success";
  message: string;
  score?: number;
};

type SortField = 'amount' | 'date' | 'invoice';
type SortDir = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function methodIcon(method: string) {
  const m = method.toLowerCase();
  if (m.includes("card")) return <CreditCard className="w-4 h-4" />;
  if (m.includes("upi")) return <Smartphone className="w-4 h-4" />;
  return <DollarSign className="w-4 h-4" />;
}

function detectAIAlerts(payments: PaymentView[]): AIAlert[] {
  const alerts: AIAlert[] = [];
  const HIGH_VALUE = 50000;

  payments.forEach(p => {
    if (p.amount >= HIGH_VALUE) {
      alerts.push({
        id: `high-${p.id}`,
        type: "success",
        message: `High-value payment detected: ₹${p.amount.toLocaleString()} on ${p.invoice}`,
        score: 92,
      });
    }
  });

  const counts: Record<string, number> = {};
  payments.forEach(p => (counts[p.invoice] = (counts[p.invoice] || 0) + 1));
  Object.entries(counts).forEach(([invoice, count]) => {
    if (count > 1) {
      alerts.push({
        id: `dup-${invoice}`,
        type: "warning",
        message: `${count} payment records found for ${invoice}. Verify duplicates.`,
        score: 85,
      });
    }
  });

  alerts.push({
    id: "summary",
    type: "info",
    message: `Detected ${payments.length} payments • Total: ₹${payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}`,
    score: 60,
  });

  return alerts;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Payments() {
  const [payments, setPayments] = useState<PaymentView[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"All" | string>("All");
  const [showOnlyUnreconciled, setShowOnlyUnreconciled] = useState(false);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  // Advanced settings
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [settings, setSettings] = useState({
    showMethodIcon: true,
    showDate: true,
    showAIAlerts: true,
    compactCards: false,
  });

  // ── Fetch data ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [apiPayments, invoices] = await Promise.all([
          dataService.getPayments(),
          dataService.getInvoices()
        ]);
        const mapped: PaymentView[] = apiPayments.map(p => {
          const inv = invoices.find(i => i.id === p.invoiceId);
          return {
            id: p.id,
            invoice: inv ? inv.invoiceNumber : "Unknown",
            method: p.method,
            amount: p.amount,
            date: new Date(p.createdAt).toISOString().split('T')[0],
            reconciled: p.status === 'completed'
          };
        });
        setPayments(mapped);
        setAlerts(detectAIAlerts(mapped));
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived data ───────────────────────────────────────────────────
  const methods = useMemo(() => ["All", "UPI", "Card", "Netbanking", "Cash"], []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = payments
      .filter(p => (methodFilter === "All" ? true : p.method.toLowerCase() === methodFilter.toLowerCase()))
      .filter(p => (showOnlyUnreconciled ? !p.reconciled : true))
      .filter(p => (q ? p.invoice.toLowerCase().includes(q) || (p.date ?? "").includes(q) || p.method.toLowerCase().includes(q) : true));

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'amount') cmp = a.amount - b.amount;
      else if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else cmp = a.invoice.localeCompare(b.invoice);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [payments, methodFilter, showOnlyUnreconciled, search, sortField, sortDir]);

  const stats = useMemo(() => ({
    count: filtered.length,
    sum: filtered.reduce((s, p) => s + p.amount, 0),
    reconciledCount: filtered.filter(p => p.reconciled).length,
    pendingCount: filtered.filter(p => !p.reconciled).length,
  }), [filtered]);

  // ── Actions ────────────────────────────────────────────────────────
  const exportCSV = (rows: PaymentView[]) => {
    const header = ["Invoice", "Method", "Amount", "Date", "Reconciled"];
    const lines = [
      header.join(","),
      ...rows.map(r => [r.invoice, r.method, r.amount, r.date, r.reconciled ? "Yes" : "No"].join(","))
    ].join("\n");
    const blob = new Blob([lines], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_export.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const dismissAlert = (id: string) => setAlerts(s => s.filter(a => a.id !== id));

  const markReconciled = (invoiceNumber: string) => {
    alert(`To mark ${invoiceNumber} as reconciled, ensure the payment status in backend is 'completed'.`);
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50/50">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-teal-400 border-dotted rounded-full animate-spin [animation-duration:3s]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-teal-500 rounded-full opacity-10 animate-ping [animation-duration:1.5s]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-teal-600 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-sm font-semibold tracking-widest text-teal-800 uppercase">Verifying Payment Gateway</h3>
          <div className="flex justify-center gap-1">
            <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-full w-full overflow-y-auto custom-scrollbar">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#e6fffa_0%,_#f0fdfa_45%,_#f5fffe_100%)]" />
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-teal-200/40 blur-3xl -z-10" />
      <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-teal-200/30 blur-[110px] -z-10" />

      <div className="p-6 lg:p-10">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              <Banknote size={14} />
              Payment Intelligence
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              Payments
            </h1>
            <p className="text-gray-500 mt-1.5 max-w-xl text-sm">
              Track incoming payments, reconcile quickly and surface anomalies via AI.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-xl border transition-all ${showSettings ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}
              title="Advanced Settings"
            >
              <Settings2 size={18} />
            </button>
            <button
              onClick={() => setAlerts(detectAIAlerts(payments))}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-gray-300 transition"
            >
              <Zap size={16} className="text-teal-500" /> Re-check
            </button>
            <button
              onClick={() => exportCSV(filtered)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50 text-sm font-semibold text-teal-700 hover:bg-teal-100 transition"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </motion.div>

        {/* ─── Stat Cards ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
        >
          {[
            { label: 'Total Payments', value: stats.count.toString(), sub: `${payments.length} total`, icon: CreditCard, badge: null },
            { label: 'Total Amount', value: `₹${(stats.sum / 1000).toFixed(1)}k`, sub: `₹${stats.sum.toLocaleString()}`, icon: TrendingUp, badge: null },
            { label: 'Reconciled', value: stats.reconciledCount.toString(), sub: 'Completed', icon: CheckCircle, badge: null },
            { label: 'Pending', value: stats.pendingCount.toString(), sub: 'Awaiting', icon: Clock, badge: stats.pendingCount > 0 ? 'Action needed' : null },
          ].map(({ label, value, sub, icon: Icon, badge }, idx) => (
            <div key={idx} className="relative bg-gradient-to-br from-white to-teal-50/30 p-5 rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
              <div className="absolute -top-8 -right-8 w-20 h-20 bg-teal-100/40 rounded-full blur-2xl" />
              <div className="relative">
                {badge && (
                  <span className="absolute top-0 right-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 rounded-full border border-amber-200">
                    {badge}
                  </span>
                )}
                <div className="p-2.5 bg-teal-100 text-teal-600 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                  <Icon size={18} />
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                <p className="text-xs text-teal-600 mt-1 font-medium">{sub}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ─── Advanced Settings ───────────────────────────────────── */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-teal-100/60 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Settings2 size={15} className="text-teal-500" /> Advanced Settings
                  </h3>
                  <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-400"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: 'showMethodIcon' as const, label: 'Method Icons', desc: 'Show payment method icons', icon: CreditCard },
                    { key: 'showDate' as const, label: 'Show Date', desc: 'Display date on cards', icon: Clock },
                    { key: 'showAIAlerts' as const, label: 'AI Alerts', desc: 'Show anomaly detection', icon: Zap },
                    { key: 'compactCards' as const, label: 'Compact View', desc: 'Reduce card padding', icon: Eye },
                  ].map(({ key, label, desc, icon: Icon }) => (
                    <label key={key} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/30 transition cursor-pointer group">
                      <div className="pt-0.5">
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${settings[key] ? 'bg-teal-500' : 'bg-gray-200'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${settings[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                        <input type="checkbox" className="sr-only" checked={settings[key]} onChange={() => setSettings(s => ({ ...s, [key]: !s[key] }))} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                          <Icon size={13} className="text-gray-400 group-hover:text-teal-500 transition" /> {label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Search & Controls ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-teal-100/60 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              {/* Search */}
              <div className="relative flex-1 w-full md:max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoice, date, method..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Method filter chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1"><Filter size={12} className="inline" /></span>
                {methods.map(m => (
                  <button
                    key={m}
                    onClick={() => setMethodFilter(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${methodFilter === m
                        ? 'bg-teal-50 border-teal-300 text-teal-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Unreconciled toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-9 h-5 rounded-full transition-colors relative ${showOnlyUnreconciled ? 'bg-teal-500' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${showOnlyUnreconciled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-xs font-semibold text-gray-600">Pending only</span>
                <input type="checkbox" className="sr-only" checked={showOnlyUnreconciled} onChange={e => setShowOnlyUnreconciled(e.target.checked)} />
              </label>
            </div>

            {/* Second row: sort + view toggle */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sort</span>
                {(['amount', 'date', 'invoice'] as SortField[]).map(field => (
                  <button
                    key={field}
                    onClick={() => {
                      if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                      else { setSortField(field); setSortDir('desc'); }
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${sortField === field
                        ? 'bg-teal-50 border-teal-300 text-teal-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                    {sortField === field && (sortDir === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {search && (
                  <span className="text-xs text-gray-500">
                    <strong className="text-gray-700">{filtered.length}</strong> of {payments.length}
                    {search && <span className="ml-1">for "<strong className="text-teal-600">{search}</strong>"</span>}
                  </span>
                )}
                <div className="bg-gray-50 p-1 rounded-xl border border-gray-200 flex items-center ml-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── AI Alerts ───────────────────────────────────────────── */}
        <AnimatePresence>
          {settings.showAIAlerts && alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-teal-100/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-teal-100/60 flex items-center justify-between bg-teal-50/30">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>
                    <Zap size={15} className="text-teal-500" /> AI Insights & Anomalies
                  </h3>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 border border-teal-200 uppercase tracking-wider">
                    {alerts.length} Detected
                  </span>
                </div>
                <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                  {alerts.map(a => {
                    const isWarning = a.type === "warning";
                    const isSuccess = a.type === "success";
                    return (
                      <div
                        key={a.id}
                        className={`flex items-start gap-4 p-4 border-b border-teal-50 last:border-0 hover:bg-teal-50/30 transition ${isWarning ? 'border-l-4 border-l-amber-400' : isSuccess ? 'border-l-4 border-l-teal-400' : 'border-l-4 border-l-gray-200'
                          }`}
                      >
                        <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${isWarning ? 'bg-amber-100 text-amber-600' : isSuccess ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                          {isWarning ? <AlertTriangle size={16} /> : isSuccess ? <TrendingUp size={16} /> : <CheckCircle size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isWarning ? 'text-amber-900' : 'text-gray-800'}`}>{a.message}</p>
                          <div className="flex items-center gap-4 mt-1.5">
                            {typeof a.score === "number" && (
                              <span className={`text-xs font-semibold flex items-center gap-1 ${isSuccess ? 'text-teal-600' : isWarning ? 'text-amber-600' : 'text-gray-400'}`}>
                                <Zap size={10} /> {a.score}% Confidence
                              </span>
                            )}
                            <button onClick={() => dismissAlert(a.id)} className="text-xs font-medium text-gray-400 hover:text-gray-700 transition">Dismiss</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Payment Cards / Table ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white/80 backdrop-blur-xl rounded-3xl border border-teal-100/60 shadow-sm">
              <div className="bg-teal-50 p-4 rounded-2xl inline-flex mb-4 border border-teal-100">
                <DollarSign className="w-8 h-8 text-teal-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>No payments found</h3>
              <p className="text-gray-400 mt-2 text-sm">Try clearing your filters or search.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(p => (
                <div
                  key={p.id}
                  className={`group bg-white/80 backdrop-blur-xl border rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden ${selectedInvoice === p.invoice
                      ? 'ring-2 ring-teal-400 border-teal-300'
                      : 'border-teal-100/60 hover:border-teal-300'
                    } ${settings.compactCards ? 'p-4' : 'p-5'}`}
                  onClick={() => setSelectedInvoice(p.invoice)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Invoice</span>
                    <span className="text-sm font-bold text-gray-900 group-hover:text-teal-700 transition">{p.invoice}</span>
                  </div>

                  {settings.showMethodIcon && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Method</span>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-50 text-teal-500 border border-teal-100 group-hover:scale-110 transition-transform">
                          {methodIcon(p.method)}
                        </span>
                        <span>{p.method}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Amount</p>
                      <p className="text-xl font-bold text-gray-900">₹{p.amount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${p.reconciled
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                        {p.reconciled ? "Reconciled" : "Pending"}
                      </span>
                      {settings.showDate && <p className="text-xs text-gray-400 mt-1.5 font-medium">{p.date}</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-teal-50 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); markReconciled(p.invoice); }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
                    >
                      Mark Reconciled
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); alert(`Open receipt for ${p.invoice}`); }}
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition"
                      style={{ backgroundColor: '#0d9488' }}
                    >
                      View Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-teal-100/60 shadow-sm overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="bg-teal-50/40 border-b border-teal-100/60 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50">
                    {filtered.map(p => (
                      <tr
                        key={p.id}
                        className={`hover:bg-teal-50/30 transition cursor-pointer group ${selectedInvoice === p.invoice ? 'bg-teal-50/40' : ''}`}
                        onClick={() => setSelectedInvoice(p.invoice)}
                      >
                        <td className="px-6 py-3.5 font-semibold text-gray-900 group-hover:text-teal-700 transition">{p.invoice}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2 text-gray-600">
                            {settings.showMethodIcon && (
                              <span className="w-6 h-6 bg-teal-50 rounded-md flex items-center justify-center text-teal-500 border border-teal-100">
                                {methodIcon(p.method)}
                              </span>
                            )}
                            {p.method}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-gray-900">₹{p.amount.toLocaleString()}</td>
                        <td className="px-6 py-3.5 text-gray-500">{p.date}</td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${p.reconciled
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                            {p.reconciled ? "Reconciled" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Detail Modal ─────────────────────────────────────────── */}
      {selectedInvoice && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"
            onClick={() => setSelectedInvoice(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-teal-100/60 overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-white via-teal-50/60 to-white px-6 py-5 border-b border-teal-100/60 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-100/30 rounded-full blur-2xl" />
              <div className="relative flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>
                    Payment Details
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Invoice → {selectedInvoice}</p>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="p-1.5 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {(() => {
                const matchingPayments = payments.filter(p => p.invoice === selectedInvoice);
                const total = matchingPayments.reduce((s, p) => s + p.amount, 0);
                return (
                  <div className="space-y-4">
                    <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total for {selectedInvoice}</p>
                      <p className="text-2xl font-bold text-gray-900">₹{total.toLocaleString()}</p>
                      <p className="text-xs text-teal-600 mt-1 font-medium">{matchingPayments.length} payment(s)</p>
                    </div>
                    {matchingPayments.map(p => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-500 border border-teal-100">
                            {methodIcon(p.method)}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{p.method}</p>
                            <p className="text-xs text-gray-400">{p.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">₹{p.amount.toLocaleString()}</p>
                          <span className={`text-[10px] font-bold ${p.reconciled ? 'text-teal-600' : 'text-amber-600'}`}>
                            {p.reconciled ? 'Reconciled' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-teal-100/60 bg-white">
              <button
                onClick={() => exportCSV(payments.filter(p => p.invoice === selectedInvoice))}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-semibold text-sm transition shadow-md"
                style={{ backgroundColor: '#0d9488', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' }}
              >
                <Download size={16} /> Export Transaction
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
