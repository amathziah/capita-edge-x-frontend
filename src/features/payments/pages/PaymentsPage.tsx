import { useMemo, useState, useEffect } from "react";
import {
  CreditCard, Smartphone, DollarSign, CheckCircle, Download, TrendingUp,
  X, Search, Eye, LayoutGrid, List,
  SortAsc, SortDesc, Banknote, Clock, Filter, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { dataService } from '@/shared/services/dataService';
import { useData } from '@/app/providers/DataContext';
import { downloadCsv } from '@/shared/lib/export';
import RecordPaymentModal from '@/features/invoices/components/RecordPaymentModal';
import { useToast } from '@/app/providers/ToastContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PaymentView = {
  id: string;
  invoiceId: string;
  invoice: string;
  method: string;
  amount: number;
  date: string;
  reconciled: boolean;
};



type SortField = 'amount' | 'date' | 'invoice';
type SortDir = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

// ---------------------------------------------------------------------------
// Helpers — method mapping (backend ↔ display)
// ---------------------------------------------------------------------------
const METHOD_MAP: Record<string, string> = {
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Netbanking',
  cash: 'Cash',
  cheque: 'Cheque',
  neft: 'NEFT',
  imps: 'IMPS',
  rtgs: 'RTGS',
  razorpay: 'Razorpay',
  stripe: 'Stripe',
  other: 'Other',
};

const DISPLAY_TO_BACKEND: Record<string, string> = Object.fromEntries(
  Object.entries(METHOD_MAP).map(([k, v]) => [v, k])
);

function normalizeMethod(payment: { payment_mode?: string; method?: string }): string {
  return (payment.method || payment.payment_mode || 'other').toLowerCase();
}

function formatMethod(method: string): string {
  return METHOD_MAP[method.toLowerCase()] || method.charAt(0).toUpperCase() + method.slice(1);
}

function methodIcon(method: string) {
  const m = method.toLowerCase();
  if (m === 'card') return <CreditCard className="w-4 h-4" />;
  if (m === 'upi') return <Smartphone className="w-4 h-4" />;
  if (m === 'bank_transfer' || m === 'neft' || m === 'imps' || m === 'rtgs') return <Banknote className="w-4 h-4" />;
  if (m === 'cheque') return <CheckCircle className="w-4 h-4" />;
  if (m === 'cash') return <DollarSign className="w-4 h-4" />;
  return <DollarSign className="w-4 h-4" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Payments() {
  const { payments: apiPayments, invoices: allInvoices, loading, refreshData } = useData();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"All" | string>("All");
  const [showOnlyUnreconciled, setShowOnlyUnreconciled] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Advanced settings
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [settings] = useState({
    showMethodIcon: true,
    showDate: true,
    showAIAlerts: true,
    compactCards: false,
  });

  const payments: PaymentView[] = useMemo(() => {
    return apiPayments.map(p => {
      const inv = allInvoices.find(i => i.id === p.invoiceId);
      return {
        id: p.id,
        invoiceId: p.invoiceId,
        invoice: inv ? inv.invoiceNumber : "Unknown",
        method: normalizeMethod(p),
        amount: p.amount,
        date: new Date(p.date || p.createdAt || new Date()).toISOString().split('T')[0],
        reconciled: p.status === 'completed'
      };
    });
  }, [apiPayments, allInvoices]);

  useEffect(() => {
    refreshData(['payments', 'invoices']);
  }, [refreshData]);

  // ── Derived data ───────────────────────────────────────────────────
  const methods = useMemo(() => ["All", "UPI", "Card", "Netbanking", "Cash", "Cheque"], []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filterKey = methodFilter === "All" ? null : (DISPLAY_TO_BACKEND[methodFilter] || methodFilter).toLowerCase();
    let result = payments
      .filter(p => (!filterKey || p.method === filterKey))
      .filter(p => (showOnlyUnreconciled ? !p.reconciled : true))
      .filter(p => (q ? p.invoice.toLowerCase().includes(q) || (p.date ?? "").includes(q) || formatMethod(p.method).toLowerCase().includes(q) : true));

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
    downloadCsv(
      "payments_export.csv",
      ["Invoice", "Method", "Amount", "Date", "Reconciled"],
      rows.map((r) => [r.invoice, r.method, r.amount, r.date, r.reconciled ? "Yes" : "No"])
    );
  };

  const markReconciled = async (paymentId: string) => {
    try {
      setSaving(true);
      await dataService.reconcilePayment(paymentId);
      refreshData(['payments', 'invoices'], true);
    } catch (err: any) {
      showToast(`Error reconciling payment: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleViewReceipt = async (paymentId: string) => {
    try {
      const blob = await dataService.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Optional cleanup after a short delay
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (err: any) {
      showToast(`Error viewing receipt: ${err.message}`, 'error');
    }
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      const blob = await dataService.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      showToast(`Error downloading receipt: ${err.message}`, 'error');
    }
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (loading && apiPayments.length === 0) {
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

      <div className="p-4 sm:p-6 lg:p-10">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 sm:mb-8 flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between"
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
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowRecordModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black transition shadow-xl shadow-slate-900/10"
            >
              <Plus className="w-5 h-5" /> Record Payment
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
            { 
              label: 'Total Payments', value: stats.count.toString(), sub: `${payments.length} total`, icon: CreditCard, badge: null,
              gradient: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/25', accent: 'text-amber-600', bg: 'from-amber-50/60 via-white to-orange-50/40', ring: 'bg-amber-500', border: 'border-amber-200/60'
            },
            { 
              label: 'Total Amount', value: `₹${(stats.sum / 1000).toFixed(1)}k`, sub: `₹${stats.sum.toLocaleString()}`, icon: TrendingUp, badge: null,
              gradient: 'from-emerald-500 to-green-500', glow: 'shadow-emerald-500/25', accent: 'text-emerald-600', bg: 'from-emerald-50/60 via-white to-green-50/40', ring: 'bg-emerald-500', border: 'border-emerald-200/60'
            },
            { 
              label: 'Reconciled', value: stats.reconciledCount.toString(), sub: 'Completed', icon: CheckCircle, badge: null,
              gradient: 'from-teal-500 to-cyan-500', glow: 'shadow-teal-500/25', accent: 'text-teal-600', bg: 'from-teal-50/60 via-white to-cyan-50/40', ring: 'bg-teal-500', border: 'border-teal-200/60'
            },
            { 
              label: 'Pending', value: stats.pendingCount.toString(), sub: 'Awaiting', icon: Clock, badge: stats.pendingCount > 0 ? 'Action needed' : null,
              gradient: 'from-rose-500 to-red-500', glow: 'shadow-rose-500/25', accent: 'text-rose-600', bg: 'from-rose-50/60 via-white to-red-50/40', ring: 'bg-rose-500', border: 'border-rose-200/60'
            },
          ].map((card, idx) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.45, delay: 0.05 + (idx * 0.05), ease: [0.23, 1, 0.32, 1] }}
                  className={`relative bg-white p-5 rounded-2xl border ${card.border} shadow-sm hover:shadow-lg ${card.glow} hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group overflow-hidden cursor-default`}
                >

                  <div className="relative">
                    {card.badge && (
                      <span className={`absolute top-0 right-0 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-white ${card.accent} rounded-full border ${card.border} shadow-sm`}>
                        {card.badge}
                      </span>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 bg-gradient-to-br ${card.gradient} text-white rounded-xl shadow-lg ${card.glow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <card.icon size={18} strokeWidth={2.2} />
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-1">{card.label}</p>
                    <h3 className="text-[28px] font-extrabold text-gray-900 tracking-tight leading-none">{card.value}</h3>
                    <p className={`text-xs ${card.accent} mt-2 font-semibold flex items-center gap-1.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${card.ring}`} />
                      {card.sub}
                    </p>
                  </div>
                </motion.div>
          ))}
        </motion.div>


        {/* ─── Search & Controls ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white rounded-2xl border border-teal-100/60 shadow-sm p-4">
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
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-y-2">
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

        {/* ─── Payment Cards / Table ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-teal-100/60 shadow-sm">
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
                  className={`relative group bg-white border rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 cursor-pointer flex flex-col overflow-hidden ${selectedInvoice === p.invoice
                    ? 'ring-2 ring-teal-400 border-teal-300 shadow-teal-500/20'
                    : 'border-teal-200/60 hover:border-teal-300 shadow-teal-500/10'
                    }`}
                  onClick={() => setSelectedInvoice(p.invoice)}
                >
                  <div className={`relative ${settings.compactCards ? 'p-4' : 'p-5'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Invoice</span>
                      <span className="text-sm font-bold text-gray-900 group-hover:text-teal-700 transition">{p.invoice}</span>
                    </div>

                    {settings.showMethodIcon && (
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Method</span>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white text-teal-500 border border-teal-100 group-hover:scale-110 transition-transform shadow-sm">
                            {methodIcon(p.method)}
                          </span>
                          <span className="font-bold">{formatMethod(p.method)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Amount</p>
                        <p className="text-xl font-extrabold text-gray-900">₹{p.amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm ${p.reconciled
                          ? 'bg-white text-teal-700 border border-teal-200'
                          : 'bg-white text-amber-700 border border-amber-200'
                          }`}>
                          {p.reconciled ? "Reconciled" : "Pending"}
                        </span>
                        {settings.showDate && <p className="text-xs text-gray-400 mt-1.5 font-bold">{p.date}</p>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-gray-100/80 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!p.reconciled && (
                        <button
                          onClick={e => { e.stopPropagation(); markReconciled(p.id); }}
                          className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[11px] font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
                        >
                          Mark Reconciled
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); handleViewReceipt(p.id); }}
                        className="px-3 py-1.5 rounded-lg text-teal-700 bg-white border border-teal-100 hover:bg-teal-50 text-[11px] font-bold transition flex items-center gap-1.5"
                      >
                        <Eye size={12} strokeWidth={2.5}/> View
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDownloadReceipt(p.id); }}
                        className="px-3 py-1.5 rounded-lg text-white text-[11px] font-bold transition flex items-center gap-1.5 shadow-sm hover:bg-teal-700"
                        style={{ backgroundColor: '#0d9488' }}
                        title="Download Receipt"
                      >
                        <Download size={12} strokeWidth={2.5} /> Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-3xl border border-teal-100/60 shadow-sm overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="bg-teal-50/40 border-b border-teal-100/60 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50">
                    {filtered.map(p => (
                      <tr
                        key={p.id}
                        className={`hover:bg-gray-50 transition cursor-pointer group ${selectedInvoice === p.invoice ? 'bg-gray-50' : ''}`}
                        onClick={() => setSelectedInvoice(p.invoice)}
                      >
                        <td className="px-6 py-3.5 font-semibold text-gray-900 group-hover:text-teal-700 transition">{p.invoice}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-teal-500 border border-teal-100">
                              {methodIcon(p.method)}
                            </span>
                            <span className="text-gray-700">{formatMethod(p.method)}</span>
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
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            {!p.reconciled && (
                              <button
                                onClick={e => { e.stopPropagation(); markReconciled(p.id); }}
                                className="p-1.5 hover:bg-teal-50 text-teal-600 rounded-lg transition"
                                title="Mark Reconciled"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={e => { e.stopPropagation(); handleViewReceipt(p.id); }}
                              className="p-1.5 hover:bg-teal-50 text-teal-600 rounded-lg transition"
                              title="View Receipt"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDownloadReceipt(p.id); }}
                              className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition"
                              title="Download Receipt"
                            >
                              <Download size={16} />
                            </button>
                          </div>
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

      {/* Record Payment Modal */}
      <AnimatePresence>
        {showRecordModal && (
          <RecordPaymentModal
            invoices={allInvoices}
            onClose={() => setShowRecordModal(false)}
            onSuccess={async () => {
              await refreshData(['payments', 'invoices'], true);
              setShowRecordModal(false);
            }}
          />
        )}
      </AnimatePresence>



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
            className="relative z-10 w-full max-w-md bg-gradient-to-br from-white via-white to-cyan-50/30 rounded-3xl shadow-[0_20px_60px_-15px_rgba(20,184,166,0.15)] border border-teal-100/60 overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-white via-teal-50/40 to-white px-6 py-6 border-b border-teal-100/60 overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-teal-400 to-cyan-400 opacity-15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-20" />
              <div className="relative flex justify-between items-start z-10">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                    <div className="bg-teal-50 p-1.5 rounded-lg border border-teal-100 hidden sm:block text-teal-600">
                      <Banknote size={14} />
                    </div>
                    Payment Details
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5 font-medium ml-0 sm:ml-9 flex items-center gap-1">
                    Invoice <span className="text-gray-300">→</span> <span className="text-teal-600 font-bold">{selectedInvoice}</span>
                  </p>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition text-gray-400 hover:text-red-500 shadow-sm hover:shadow">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 relative z-10" style={{ fontFamily: 'Manrope, sans-serif' }}>
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
                            <p className="text-sm font-semibold text-gray-900">{formatMethod(p.method)}</p>
                            <p className="text-xs text-gray-400">{p.date}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="text-sm font-bold text-gray-900">₹{p.amount.toLocaleString()}</p>
                          <div className="flex items-center gap-2">
                            {!p.reconciled && (
                              <button
                                onClick={() => markReconciled(p.id)}
                                className="text-[10px] font-bold text-teal-600 hover:text-teal-700 underline"
                              >
                                Reconcile
                              </button>
                            )}
                            <span className={`text-[10px] font-bold ${p.reconciled ? 'text-teal-600' : 'text-amber-600'}`}>
                              {p.reconciled ? 'Reconciled' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-teal-100/60 bg-white">
              <div className="text-center text-xs font-medium text-slate-500">
                Transaction details are available in the payment ledger.
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
