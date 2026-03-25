import { useMemo, useState, useEffect } from "react";
import {
  CreditCard, Smartphone, DollarSign, CheckCircle, Download, TrendingUp,
  X, Search, Eye, LayoutGrid, List,
  SortAsc, SortDesc, Banknote, Clock, Filter, Plus, User, Hash, ChevronDown, Calendar, ChevronLeft, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { dataService } from '../services/dataService';
import { useData } from "../contexts/DataContext";

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
  if (m.includes("bank") || m.includes("transfer") || m.includes("netbanking")) return <Banknote className="w-4 h-4" />;
  if (m.includes("cheque")) return <CheckCircle className="w-4 h-4" />;
  return <DollarSign className="w-4 h-4" />;
}



function formatMethod(method: string) {
  if (method === 'bank_transfer') return 'Netbanking';
  if (method === 'upi') return 'UPI';
  return method.charAt(0).toUpperCase() + method.slice(1);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Payments() {
  const { payments: apiPayments, invoices: allInvoices, loading, refreshData } = useData();

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"All" | string>("All");
  const [showOnlyUnreconciled, setShowOnlyUnreconciled] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    invoiceId: '',
    amount: 0,
    method: 'UPI',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);
  const [searchInvoice, setSearchInvoice] = useState("");
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

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
        invoice: inv ? inv.invoiceNumber : "Unknown",
        method: p.method || "Other",
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

  // ── Helpers ────────────────────────────────────────────────────────
  const getDaysInMonth = (month: number, year: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDay = date.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }
    const totalDays = 42;
    const remaining = totalDays - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
    }
    return days;
  };

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

  const markReconciled = async (paymentId: string) => {
    try {
      setSaving(true);
      await dataService.reconcilePayment(paymentId);
      refreshData(['payments'], true);
    } catch (err: any) {
      alert(`Error reconciling payment: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    if (!newPayment.invoiceId || newPayment.amount <= 0) {
      alert("Please select an invoice and enter an amount.");
      return;
    }

    // Map frontend display methods to backend expected values
    const methodMap: Record<string, string> = {
      'UPI': 'upi',
      'Card': 'card',
      'Netbanking': 'bank_transfer',
      'Cash': 'cash',
      'Cheque': 'cheque'
    };
    const backendMethod = methodMap[newPayment.method] || newPayment.method.toLowerCase();

    try {
      setSaving(true);
      await dataService.savePayment({
        invoiceId: newPayment.invoiceId,
        amount: newPayment.amount,
        method: backendMethod as any,
        notes: newPayment.notes,
        date: newPayment.date,
        status: 'completed'
      } as any);

      setShowRecordModal(false);
      setSearchInvoice("");
      setShowInvoiceDropdown(false);
      setShowMethodDropdown(false);
      setShowCalendar(false);
      setNewPayment({
        invoiceId: '',
        amount: 0,
        method: 'UPI',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
      refreshData(['payments', 'invoices'], true);
    } catch (err: any) {
      alert(`Error saving payment: ${err.message}`);
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
      alert(`Error viewing receipt: ${err.message}`);
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
      alert(`Error downloading receipt: ${err.message}`);
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
              onClick={() => setShowRecordModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition shadow-sm"
            >
              <Plus size={16} /> Record Payment
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
            { label: 'Total Amount', value: `Rs. ${(stats.sum / 1000).toFixed(1)}k`, sub: `Rs. ${stats.sum.toLocaleString()}`, icon: TrendingUp, badge: null },
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
                      <p className="text-xl font-bold text-gray-900">Rs. {p.amount.toLocaleString()}</p>
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
                    {!p.reconciled && (
                      <button
                        onClick={e => { e.stopPropagation(); markReconciled(p.id); }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
                      >
                        Mark Reconciled
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleViewReceipt(p.id); }}
                      className="px-3 py-1.5 rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDownloadReceipt(p.id); }}
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm hover:bg-teal-700"
                      style={{ backgroundColor: '#0d9488' }}
                      title="Download Receipt"
                    >
                      <Download size={14} /> Download
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
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
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
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-teal-50 rounded-md flex items-center justify-center text-teal-500 border border-teal-100">
                              {methodIcon(p.method)}
                            </span>
                            <span className="text-gray-700">{formatMethod(p.method)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-gray-900">Rs. {p.amount.toLocaleString()}</td>
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
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setShowRecordModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-teal-100/60"
            >
              <div className="px-8 py-6 border-b border-teal-50 flex justify-between items-center bg-teal-50/20 rounded-t-3xl">
                <div>
                  <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>Record New Payment</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Enter details to reconcile with an invoice</p>
                </div>
                <button onClick={() => { setShowRecordModal(false); setSearchInvoice(""); setShowInvoiceDropdown(false); setShowMethodDropdown(false); }} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-5">
                {/* Advanced Invoice Search/Select */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Invoice</label>
                  <div
                    onClick={() => setShowInvoiceDropdown(!showInvoiceDropdown)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm cursor-pointer hover:border-teal-400 transition flex justify-between items-center"
                  >
                    {newPayment.invoiceId ? (
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-teal-500" />
                        <span className="font-bold text-gray-900">
                          {allInvoices.find(i => i.id === newPayment.invoiceId)?.invoiceNumber}
                        </span>
                        <span className="text-gray-400 mx-1">|</span>
                        <User size={14} className="text-gray-400" />
                        <span className="text-gray-600 truncate max-w-[150px]">
                          {allInvoices.find(i => i.id === newPayment.invoiceId)?.buyer?.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Search or choose invoice...</span>
                    )}
                    <Search size={16} className="text-gray-400" />
                  </div>

                  <AnimatePresence>
                    {showInvoiceDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 right-0 mt-2 bg-white border border-teal-100 shadow-2xl rounded-2xl z-[10000] overflow-hidden"
                        style={{ maxHeight: '300px' }}
                      >
                        <div className="p-3 border-b border-gray-50 sticky top-0 bg-white z-20">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Type invoice # or customer name..."
                              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500/20"
                              value={searchInvoice}
                              onChange={e => setSearchInvoice(e.target.value)}
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-[240px] custom-scrollbar">
                          {allInvoices
                            .filter(i => i.status !== 'paid' && i.status !== 'draft')
                            .filter(i =>
                              i.invoiceNumber.toLowerCase().includes(searchInvoice.toLowerCase()) ||
                              i.buyer?.name?.toLowerCase().includes(searchInvoice.toLowerCase())
                            )
                            .map(i => (
                              <div
                                key={i.id}
                                onClick={() => {
                                  // Calculate remaining balance
                                  const invoicePayments = payments.filter(p => {
                                    const inv = allInvoices.find(all => all.id === i.id);
                                    return inv && p.invoice === inv.invoiceNumber && p.reconciled;
                                  });
                                  const paidAmount = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
                                  const balance = i.total - paidAmount;

                                  setNewPayment({ ...newPayment, invoiceId: i.id, amount: balance > 0 ? balance : i.total });
                                  setShowInvoiceDropdown(false);
                                  setSearchInvoice("");
                                }}
                                className="px-4 py-3 hover:bg-teal-50/50 cursor-pointer transition flex justify-between items-center group"
                              >
                                <div>
                                  <p className="text-sm font-bold text-gray-900 group-hover:text-teal-700 transition">{i.invoiceNumber}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <User size={10} className="text-gray-400" />
                                    <p className="text-[10px] text-gray-500 font-medium">{i.buyer?.name}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {(() => {
                                    const invoicePayments = payments.filter(p => p.invoice === i.invoiceNumber && p.reconciled);
                                    const paidAmount = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
                                    const balance = i.total - paidAmount;
                                    return (
                                      <>
                                        <p className="text-xs font-bold text-gray-900 font-mono">Rs. {balance.toLocaleString()}</p>
                                        <p className="text-[9px] text-gray-400">of Rs. {i.total.toLocaleString()}</p>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            ))}
                          {allInvoices.filter(i => i.status !== 'paid').filter(i =>
                            i.invoiceNumber.toLowerCase().includes(searchInvoice.toLowerCase()) ||
                            i.buyer?.name?.toLowerCase().includes(searchInvoice.toLowerCase())
                          ).length === 0 && (
                              <div className="p-8 text-center">
                                <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                <p className="text-xs text-gray-400 font-medium">No pending invoices match your search</p>
                              </div>
                            )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount Paid (Rs.)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Rs.</span>
                      <input
                        type="number"
                        value={newPayment.amount}
                        onChange={e => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Method</label>
                    <div className="relative">
                      <div
                        onClick={() => setShowMethodDropdown(!showMethodDropdown)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm cursor-pointer hover:border-teal-400 transition flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-teal-500">{methodIcon(newPayment.method)}</span>
                          <span className="font-semibold text-gray-900">{newPayment.method}</span>
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${showMethodDropdown ? 'rotate-180' : ''}`} />
                      </div>

                      <AnimatePresence>
                        {showMethodDropdown && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute left-0 right-0 mt-2 bg-white border border-teal-100 shadow-xl rounded-2xl z-[10001] overflow-hidden"
                          >
                            {methods.filter(m => m !== 'All').map(m => (
                              <div
                                key={m}
                                onClick={() => {
                                  setNewPayment({ ...newPayment, method: m });
                                  setShowMethodDropdown(false);
                                }}
                                className="px-4 py-3 hover:bg-teal-50/50 cursor-pointer transition flex items-center gap-3 border-b border-gray-50 last:border-0"
                              >
                                <span className="text-teal-500">{methodIcon(m)}</span>
                                <span className={`text-sm font-medium ${newPayment.method === m ? 'text-teal-700 font-bold' : 'text-gray-700'}`}>
                                  {m}
                                </span>
                                {newPayment.method === m && <CheckCircle size={14} className="ml-auto text-teal-500" />}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Date</label>
                  <div className="relative">
                    <div
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm cursor-pointer hover:border-teal-400 transition flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-teal-500" />
                        <span className="font-semibold text-gray-900">
                          {new Date(newPayment.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {showCalendar && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute left-0 right-0 max-w-[340px] mt-2 bg-white border border-teal-100 shadow-2xl rounded-2xl z-[10002] p-4"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-900">
                              {viewDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                            </h4>
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1))); }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition"
                              >
                                <ChevronLeft size={16} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1))); }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                              <div key={d} className="text-[10px] font-bold text-gray-400 text-center uppercase py-1">{d}</div>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-1">
                            {getDaysInMonth(viewDate.getMonth(), viewDate.getFullYear()).map((d, i) => {
                              const isSelected = newPayment.date === d.date.toISOString().split('T')[0];
                              const isToday = new Date().toISOString().split('T')[0] === d.date.toISOString().split('T')[0];
                              return (
                                <div
                                  key={i}
                                  onClick={() => {
                                    setNewPayment({ ...newPayment, date: d.date.toISOString().split('T')[0] });
                                    setShowCalendar(false);
                                  }}
                                  className={`aspect-square flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer font-medium
                                    ${d.currentMonth ? 'text-gray-700 hover:bg-teal-50 hover:text-teal-700' : 'text-gray-300 hover:bg-gray-50'}
                                    ${isSelected ? 'bg-teal-600 text-white hover:bg-teal-700 hover:text-white shadow-md shadow-teal-100' : ''}
                                    ${isToday && !isSelected ? 'border border-teal-200 text-teal-600' : ''}
                                  `}
                                >
                                  {d.day}
                                </div>
                              );
                            })}
                          </div>

                          <button
                            onClick={() => {
                              const today = new Date().toISOString().split('T')[0];
                              setNewPayment({ ...newPayment, date: today });
                              setViewDate(new Date());
                              setShowCalendar(false);
                            }}
                            className="w-full mt-4 py-2 border-t border-gray-50 text-[10px] font-bold text-teal-600 hover:text-teal-700 transition"
                          >
                            Jump to Today
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                  <textarea
                    value={newPayment.notes}
                    onChange={e => setNewPayment({ ...newPayment, notes: e.target.value })}
                    placeholder="Reference ID, Bank details, etc."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition h-20 resize-none"
                  />
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => { setShowRecordModal(false); setSearchInvoice(""); setShowInvoiceDropdown(false); setShowMethodDropdown(false); }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePayment}
                  disabled={saving}
                  className="flex-1 px-4 py-3 rounded-xl bg-teal-600 font-semibold text-white hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </motion.div>
          </div>
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
                      <p className="text-2xl font-bold text-gray-900">Rs. {total.toLocaleString()}</p>
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
                          <p className="text-sm font-bold text-gray-900">Rs. {p.amount.toLocaleString()}</p>
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
