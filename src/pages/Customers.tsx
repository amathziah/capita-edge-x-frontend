import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, User, AlertCircle, Calendar, Activity, CheckCircle, Loader2,
  Search, Filter, Plus, Phone, Mail, MapPin, X, Edit, Trash2,
  Users, Settings2, Eye, LayoutGrid, List, ArrowRight,
  TrendingUp, CreditCard, FileText, SortAsc, SortDesc,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { dataService } from '../services/dataService';
import { Customer, Invoice, CustomerInsights } from '../types';
import { useData } from "../contexts/DataContext";

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------
type SortField = 'name' | 'email' | 'createdAt';
type SortDir = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Customers() {
  const { customers, loading, refreshData, setData } = useData();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsights | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '', email: '', phone: '', address: '', gstin: '', tags: '' as string
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Advanced settings
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [settings, setSettings] = useState({
    showTags: true,
    showEmail: true,
    showAddress: true,
    compactCards: false,
  });

  // ── Fetch customers ────────────────────────────────────────────────────
  useEffect(() => { refreshData(); }, [refreshData]);


  // ── Fetch selected customer data ───────────────────────────────────────
  useEffect(() => {
    if (selectedCustomer) {
      (async () => {
        try {
          const [insights, invoices] = await Promise.all([
            dataService.getCustomerInsights(selectedCustomer.id),
            dataService.getCustomerInvoices(selectedCustomer.id)
          ]);
          setCustomerInsights(insights);
          setCustomerInvoices(invoices);
        } catch (error) {
          console.error("Failed to fetch customer details", error);
        }
      })();
    }
  }, [selectedCustomer]);

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = customers.length;
    const withTags = customers.filter(c => c.tags && c.tags.length > 0).length;
    const recentCount = customers.filter(c => {
      const date = new Date(c.createdAt);
      return (Date.now() - date.getTime()) < 30 * 24 * 60 * 60 * 1000;
    }).length;
    return { total, withTags, recentCount };
  }, [customers]);

  // ── Filtered & Sorted ─────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    let result = customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm) ||
      c.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'email') cmp = a.email.localeCompare(b.email);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [customers, searchTerm, sortField, sortDir]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleEditCustomer = () => {
    if (!selectedCustomer) return;
    setCustomerForm({
      name: selectedCustomer.name,
      email: selectedCustomer.email,
      phone: selectedCustomer.phone,
      address: selectedCustomer.address,
      gstin: selectedCustomer.taxId || '',
      tags: selectedCustomer.tags?.join(', ') || ''
    });
    setIsEditing(true);
    setShowCustomerModal(true);
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedCustomer.name}?`)) return;

    const toDelete = selectedCustomer;
    setData({ customers: customers.filter(c => c.id !== toDelete.id) });
    setSelectedCustomer(null);
    setCustomerInsights(null);
    setCustomerInvoices([]);

    try {
      await dataService.deleteCustomer(toDelete.id);
    } catch (error) {
      console.error("Failed to delete customer", error);
      alert("Failed to delete customer");
      refreshData(true);
      setSelectedCustomer(toDelete);
    }
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name || !customerForm.email) {
      alert("Name and email are required");
      return;
    }

    setSavingCustomer(true);
    const tagsArray = customerForm.tags
      ? customerForm.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
      : [];

    try {
      if (isEditing && selectedCustomer) {
        const updated: Customer = {
          ...selectedCustomer,
          name: customerForm.name,
          email: customerForm.email,
          phone: customerForm.phone,
          address: customerForm.address,
          taxId: customerForm.gstin,
          tags: tagsArray,
          updatedAt: new Date()
        };
        setData({ customers: customers.map(c => c.id === selectedCustomer.id ? updated : c) });
        setSelectedCustomer(updated);
        setShowCustomerModal(false);
        setIsEditing(false);
        await dataService.saveCustomer(updated);
      } else {
        const temp: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
          name: customerForm.name,
          email: customerForm.email,
          phone: customerForm.phone,
          address: customerForm.address,
          taxId: customerForm.gstin,
          tags: tagsArray,
        };
        const { id } = await dataService.saveCustomer({
          ...temp, id: '', createdAt: new Date(), updatedAt: new Date()
        } as Customer);
        const newCust: Customer = { ...temp, id, createdAt: new Date(), updatedAt: new Date() };
        setData({ customers: [newCust, ...customers] });
        setShowCustomerModal(false);
        setIsEditing(false);
      }
      setCustomerForm({ name: '', email: '', phone: '', address: '', gstin: '', tags: '' });
    } catch (error: any) {
      console.error("Failed to save customer", error);
      const errorMsg = error.message || "Failed to save customer. Please try again.";
      alert(errorMsg);
      if (isEditing) {
        refreshData(true);
        setShowCustomerModal(true);
      }
    } finally {
      setSavingCustomer(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────
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
          <h3 className="text-sm font-semibold tracking-widest text-teal-800 uppercase">Loading Customers</h3>
          <div className="flex justify-center gap-1">
            <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-full w-full overflow-y-auto custom-scrollbar">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#e6fffa_0%,_#f0fdfa_45%,_#f5fffe_100%)]" />
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-teal-200/40 blur-3xl -z-10" />
      <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-teal-200/30 blur-[110px] -z-10" />

      <div className="p-6 lg:p-10">

        {/* ─── DETAIL VIEW ──────────────────────────────────────────── */}
        {selectedCustomer ? (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Nav & Header */}
            <div className="flex items-center gap-4">
              <button
                className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition shadow-sm"
                onClick={() => { setSelectedCustomer(null); setCustomerInsights(null); setCustomerInvoices([]); }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
                  <Users size={14} /> Customer Profile
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                </div>
                <h1 className="mt-1 text-2xl font-semibold text-gray-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {selectedCustomer.name}
                </h1>
              </div>
              <div className="ml-auto flex gap-2 items-center">
                <button onClick={handleEditCustomer} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-gray-300 transition">
                  <Edit size={15} /> Edit
                </button>
                <button onClick={handleDeleteCustomer} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">
                  <Trash2 size={15} /> Delete
                </button>
                {(() => {
                  const health = customerInsights ? {
                    label: customerInsights.healthLabel,
                    color: customerInsights.healthLabel === 'VIP' ? 'bg-teal-500' :
                      customerInsights.healthLabel === 'Active' ? 'bg-teal-400' :
                        customerInsights.healthLabel === 'Regular' ? 'bg-amber-400' :
                          customerInsights.healthLabel === 'At Risk' ? 'bg-red-400' : 'bg-gray-400'
                  } : { label: '...', color: 'bg-gray-200 animate-pulse' };
                  return <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide text-white ${health.color}`}>{health.label}</span>;
                })()}
              </div>
            </div>

            {/* Profile + AI Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-teal-100/60 shadow-sm p-6 flex flex-col gap-4">
                <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>{selectedCustomer.name}</h3>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">ID: {selectedCustomer.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-teal-500" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-teal-500" />
                    <span>{selectedCustomer.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-teal-500" />
                    <span>{selectedCustomer.address || 'Not provided'}</span>
                  </div>
                </div>
                {settings.showTags && selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedCustomer.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-lg text-xs font-medium">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Insights */}
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl border border-teal-100/60 shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
                {customerInsights ? (
                  <>
                    {(() => {
                      const churnRisk = customerInsights.churnRisk;
                      const nextPurchase = customerInsights.totalInvoices > 0 ? "Expected in ~14 days" : "No data available";
                      return (
                        <>
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5" style={{ fontFamily: 'Sora, sans-serif' }}>
                            <Activity className="w-5 h-5 text-teal-500" /> AI Analysis
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                            <div className="bg-gradient-to-br from-white to-teal-50/30 p-4 rounded-2xl border border-teal-100">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Revenue</p>
                              <h4 className="text-xl font-bold text-gray-900">₹{(customerInsights.totalRevenue / 1000).toFixed(1)}k</h4>
                              <p className="text-xs text-teal-600 mt-1 font-medium">{customerInsights.totalInvoices} invoices</p>
                            </div>
                            <div className="bg-gradient-to-br from-white to-teal-50/30 p-4 rounded-2xl border border-teal-100">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                <AlertCircle className={`w-3 h-3 ${churnRisk > 50 ? 'text-red-500' : 'text-teal-500'}`} />
                                Churn Risk
                              </div>
                              <h4 className="text-xl font-bold text-gray-900">{churnRisk}%</h4>
                              <p className="text-xs text-gray-400 mt-1">Probability in 30 days</p>
                            </div>
                            <div className="bg-gradient-to-br from-white to-teal-50/30 p-4 rounded-2xl border border-teal-100">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                <Calendar className="w-3 h-3 text-teal-500" />
                                Next Purchase
                              </div>
                              <h4 className="text-base font-bold text-gray-900">{nextPurchase}</h4>
                              <p className="text-xs text-gray-400 mt-1">Based on history</p>
                            </div>
                          </div>
                          <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                            <h4 className="text-sm font-bold text-teal-700 flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4" /> Recommended Action
                            </h4>
                            <p className="text-sm text-gray-700">
                              {churnRisk > 50
                                ? "Schedule a check-in call and offer a loyalty discount."
                                : "Send a personalized email highlighting new features."}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div className="animate-pulse flex flex-col gap-4">
                    <div className="h-6 w-32 bg-gray-100 rounded" />
                    <div className="grid sm:grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-2xl border border-gray-100" />)}
                    </div>
                    <div className="h-20 bg-gray-50 rounded-2xl" />
                  </div>
                )}
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-teal-100/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-teal-100/60">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                  <CreditCard size={18} className="text-teal-500" /> Transaction History
                </h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {customerInvoices.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-teal-50/40 border-b border-teal-100/60 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice #</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-50">
                      {customerInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-teal-50/30 transition">
                          <td className="px-6 py-3.5 font-semibold text-gray-900">{invoice.invoiceNumber}</td>
                          <td className="px-6 py-3.5 text-gray-500">{new Date(invoice.date || Date.now()).toLocaleDateString()}</td>
                          <td className="px-6 py-3.5 text-gray-900 font-medium">₹{typeof invoice.total === 'number' ? invoice.total.toLocaleString() : invoice.total}</td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${invoice.status === 'paid' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                              invoice.status === 'overdue' ? 'bg-red-50 text-red-700 border border-red-200' :
                                invoice.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  'bg-gray-50 text-gray-600 border border-gray-200'
                              }`}>{invoice.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  customerInsights ? (
                    <div className="p-12 text-center text-gray-400">
                      <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No transactions found</p>
                    </div>
                  ) : (
                    <div className="p-8 space-y-3 animate-pulse">
                      {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-50 rounded-xl" />)}
                    </div>
                  )
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ─── LIST VIEW ───────────────────────────────────────────── */
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
                  <Users size={14} />
                  Client Management
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                </div>
                <h1 className="mt-2 text-3xl font-semibold text-gray-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Customers
                </h1>
                <p className="text-gray-500 mt-1.5 max-w-xl text-sm">
                  Manage client relationships, insights, and transaction history.
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
                  onClick={() => {
                    setIsEditing(false);
                    setCustomerForm({ name: '', email: '', phone: '', address: '', gstin: '', tags: '' });
                    setShowCustomerModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50 text-sm font-semibold text-teal-700 hover:bg-teal-100 transition"
                >
                  <Plus size={16} /> Add Customer
                </button>
              </div>
            </motion.div>

            {/* ─── Stat Cards ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8"
            >
              <div className="relative bg-gradient-to-br from-white to-teal-50/30 p-5 rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div className="absolute -top-8 -right-8 w-20 h-20 bg-teal-100/40 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="p-2.5 bg-teal-100 text-teal-600 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                    <Users size={18} />
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Total Clients</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                  <p className="text-xs text-teal-600 mt-1 font-medium">{filteredCustomers.length} visible</p>
                </div>
              </div>
              <div className="relative bg-gradient-to-br from-white to-teal-50/30 p-5 rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div className="absolute -top-8 -right-8 w-20 h-20 bg-teal-100/40 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="p-2.5 bg-teal-100 text-teal-600 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                    <TrendingUp size={18} />
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">New This Month</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.recentCount}</h3>
                  <p className="text-xs text-teal-600 mt-1 font-medium">Last 30 days</p>
                </div>
              </div>
              <div className="relative bg-gradient-to-br from-white to-teal-50/30 p-5 rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div className="absolute -top-8 -right-8 w-20 h-20 bg-teal-100/40 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="p-2.5 bg-teal-100 text-teal-600 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                    <Filter size={18} />
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Tagged Clients</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.withTags}</h3>
                  <p className="text-xs text-teal-600 mt-1 font-medium">Categorized</p>
                </div>
              </div>
            </motion.div>

            {/* ─── Advanced Settings ──────────────────────────────── */}
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
                        { key: 'showTags' as const, label: 'Show Tags', desc: 'Display tags on cards', icon: Filter },
                        { key: 'showEmail' as const, label: 'Show Email', desc: 'Show email on cards', icon: Mail },
                        { key: 'showAddress' as const, label: 'Show Address', desc: 'Show address on cards', icon: MapPin },
                        { key: 'compactCards' as const, label: 'Compact View', desc: 'Smaller card padding', icon: Eye },
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

            {/* ─── Search & Controls ──────────────────────────────── */}
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
                      placeholder="Search by name, email, phone, tag..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Sort controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sort</span>
                    {(['name', 'email', 'createdAt'] as SortField[]).map(field => (
                      <button
                        key={field}
                        onClick={() => {
                          if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                          else { setSortField(field); setSortDir('asc'); }
                        }}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${sortField === field
                          ? 'bg-teal-50 border-teal-300 text-teal-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                      >
                        {field === 'createdAt' ? 'Date' : field.charAt(0).toUpperCase() + field.slice(1)}
                        {sortField === field && (sortDir === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />)}
                      </button>
                    ))}
                  </div>

                  {/* View mode toggle */}
                  <div className="bg-gray-50 p-1 rounded-xl border border-gray-200 flex items-center">
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

                {searchTerm && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    Showing <strong className="text-gray-700">{filteredCustomers.length}</strong> of {customers.length} customers
                    {searchTerm && <span className="ml-1">matching "<strong className="text-teal-600">{searchTerm}</strong>"</span>}
                  </div>
                )}
              </div>
            </motion.div>

            {/* ─── Customer Grid/List ─────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              {customers.length === 0 ? (
                <div className="text-center py-20 bg-white/80 backdrop-blur-xl rounded-3xl border border-teal-100/60 shadow-sm">
                  <div className="bg-teal-50 p-4 rounded-2xl inline-flex mb-4 border border-teal-100">
                    <Users className="w-8 h-8 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>No customers yet</h3>
                  <p className="text-gray-400 mt-2 text-sm">Add your first client to get started.</p>
                  <button
                    onClick={() => { setIsEditing(false); setCustomerForm({ name: '', email: '', phone: '', address: '', gstin: '', tags: '' }); setShowCustomerModal(true); }}
                    className="mt-4 px-4 py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-sm font-semibold text-teal-700 hover:bg-teal-100 transition"
                  >
                    <Plus size={14} className="inline mr-1" /> Add Customer
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className={`grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5`}>
                  {filteredCustomers.map(cust => (
                    <div
                      key={cust.id}
                      className={`group bg-white/80 backdrop-blur-xl border border-teal-100/60 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex flex-col overflow-hidden ${settings.compactCards ? 'p-4' : ''}`}
                      onClick={() => setSelectedCustomer(cust)}
                    >
                      {!settings.compactCards && (
                        <div className="p-5 pb-0 flex items-center justify-between">
                          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-teal-50 text-teal-500 group-hover:bg-teal-100 group-hover:scale-110 transition-all border border-teal-100">
                            <User className="w-5 h-5" />
                          </div>
                        </div>
                      )}
                      <div className={settings.compactCards ? '' : 'px-5 py-3 flex-1'}>
                        <h3 className="text-base font-bold text-gray-900 mb-0.5 group-hover:text-teal-700 transition truncate" style={{ fontFamily: 'Sora, sans-serif' }}>{cust.name}</h3>
                        {settings.showEmail && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 truncate">
                            <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{cust.email}</span>
                          </div>
                        )}
                        {settings.showAddress && cust.address && (
                          <p className="text-xs text-gray-400 line-clamp-1">{cust.address}</p>
                        )}
                        {settings.showTags && cust.tags && cust.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {cust.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-teal-50 border border-teal-100 text-teal-600 rounded-md text-[10px] font-semibold uppercase tracking-wide">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {!settings.compactCards && (
                        <div className="px-5 py-2.5 border-t border-teal-50 bg-teal-50/20 flex items-center text-xs text-teal-600 font-medium group-hover:bg-teal-50/40 transition">
                          View Profile <ArrowRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
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
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tags</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-50">
                        {filteredCustomers.map(cust => (
                          <tr
                            key={cust.id}
                            className="hover:bg-teal-50/30 transition cursor-pointer group"
                            onClick={() => setSelectedCustomer(cust)}
                          >
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-500 border border-teal-100 group-hover:scale-110 transition-transform">
                                  <User size={14} />
                                </div>
                                <span className="font-semibold text-gray-900 group-hover:text-teal-700 transition">{cust.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-gray-500">{cust.email}</td>
                            <td className="px-6 py-3.5 text-gray-500">{cust.phone || '–'}</td>
                            <td className="px-6 py-3.5">
                              <div className="flex gap-1">
                                {cust.tags?.slice(0, 2).map((tag, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-teal-50 border border-teal-100 text-teal-600 rounded text-[10px] font-semibold uppercase">{tag}</span>
                                ))}
                                {(cust.tags?.length ?? 0) > 2 && <span className="text-xs text-gray-400">+{(cust.tags?.length ?? 0) - 2}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-gray-400 text-xs">{new Date(cust.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* ─── Create/Edit Modal ────────────────────────────────────── */}
      {
        showCustomerModal && createPortal(
          <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"
                onClick={() => setShowCustomerModal(false)}
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
                        {isEditing ? 'Edit Customer' : 'Add Customer'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 font-medium">{isEditing ? 'Update customer details' : 'Enter customer details below'}</p>
                    </div>
                    <button onClick={() => setShowCustomerModal(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 ml-0.5">Name <span className="text-teal-500">*</span></label>
                      <input type="text" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition font-medium placeholder:text-gray-300"
                        placeholder="John Doe" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 ml-0.5">Email <span className="text-teal-500">*</span></label>
                      <input type="email" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition font-medium placeholder:text-gray-300"
                        placeholder="john@acme.com" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 ml-0.5">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input type="tel" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition font-medium placeholder:text-gray-300"
                        placeholder="+91 98765 43210" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 ml-0.5">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                      <textarea value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition font-medium resize-none min-h-[60px] placeholder:text-gray-300"
                        placeholder="Full street address..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 ml-0.5">Tax ID</label>
                      <input type="text" value={customerForm.gstin} onChange={e => setCustomerForm({ ...customerForm, gstin: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition font-medium placeholder:text-gray-300"
                        placeholder="GSTIN" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 ml-0.5">Tags</label>
                      <input type="text" value={customerForm.tags} onChange={e => setCustomerForm({ ...customerForm, tags: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition font-medium placeholder:text-gray-300"
                        placeholder="VIP, Retail" />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-teal-100/60 flex gap-3 bg-white">
                  <button onClick={() => setShowCustomerModal(false)}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold text-sm">
                    Cancel
                  </button>
                  <button onClick={handleSaveCustomer} disabled={savingCustomer}
                    className="flex-[2] px-4 py-2.5 text-white rounded-xl font-semibold text-sm transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#0d9488', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' }}
                  >
                    {savingCustomer ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : (isEditing ? 'Update Customer' : 'Create Customer')}
                  </button>
                </div>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body
        )
      }
    </div >
  );
}