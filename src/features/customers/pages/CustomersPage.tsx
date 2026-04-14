import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, User, MapPin, Search, Filter, Mail, Phone, Calendar, CheckCircle, Activity, CreditCard, AlertCircle, TrendingUp, Users, Plus, FileText, Edit, Trash2, X, SortAsc, SortDesc, LayoutGrid, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { dataService } from '@/shared/services/dataService';
import { Customer, Invoice, CustomerInsights } from '@/types';
import { useData } from '@/app/providers/DataContext';
import { usePersona } from '@/app/providers/PersonaContext';
import { AddClientDrawer } from "@/features/customers/components/AddClientDrawer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatLTV = (val: number) => {
  if (!val) return null;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val}`;
};



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
  const { businessType } = usePersona();
  const isSolopreneur = businessType === 'solopreneur';
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsights | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Advanced settings

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [settings] = useState({
    showTags: true,
    showEmail: true,
    showAddress: true,
    compactCards: false,
  });

  // ── Fetch customers ────────────────────────────────────────────────────
  useEffect(() => {
    refreshData(['customers', 'invoices']);
  }, [refreshData]);


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
      const date = new Date(c.createdAt as any);
      return (Date.now() - date.getTime()) < 30 * 24 * 60 * 60 * 1000;
    }).length;
    return { total, withTags, recentCount };
  }, [customers]);

  // ── Filtered & Sorted ─────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    let result = customers.filter(c => {
      if (!searchLower) return true;
      const matchName = (c.name || '').toLowerCase().includes(searchLower);
      const matchEmail = (c.email || '').toLowerCase().includes(searchLower);
      const matchPhone = (c.phone || '').toLowerCase().includes(searchLower);
      const matchTag = c.tags ? c.tags.some(t => t.toLowerCase().includes(searchLower)) : false;
      return matchName || matchEmail || matchPhone || matchTag;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '');
      } else if (sortField === 'email') {
        cmp = (a.email || '').localeCompare(b.email || '');
      } else {
        const timeA = new Date(a.createdAt || (a as any).created_at || 0).getTime() || 0;
        const timeB = new Date(b.createdAt || (b as any).created_at || 0).getTime() || 0;
        cmp = timeA - timeB;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [customers, searchTerm, sortField, sortDir]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleEditCustomer = () => {
    if (!selectedCustomer) return;
    setIsEditing(true);
    setShowCustomerModal(true);
  };

  const handleDeleteCustomer = async (id?: string, name?: string) => {
    const targetId = id || selectedCustomer?.id;
    const targetName = name || selectedCustomer?.name || 'this client';
    if (!targetId) return;
    
    if (!window.confirm(`Are you sure you want to delete ${targetName}? This action cannot be undone.`)) return;
    
    try {
      // 1. Optimistically update local state so the item vanishes instantly
      setData({ customers: customers.filter(c => c.id !== targetId) });
      if (selectedCustomer?.id === targetId) {
        setSelectedCustomer(null);
        setCustomerInsights(null);
        setCustomerInvoices([]);
      }
      
      // 2. Perform actual deletion
      await dataService.deleteCustomer(targetId);
      
      // 3. Force a refresh in the background to sync stats (client counts)
      refreshData(['customers', 'stats'], true);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete client: " + (err as Error).message);
      // Revert if it fails
      refreshData(['customers'], true);
    }
  };



  // ── Loading ────────────────────────────────────────────────────────────
  if (loading && customers.length === 0) {
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

        {/* ─── ADD/EDIT DRAWER (RIGHT SLIDE OVER) ─────────────────── */}
        <AddClientDrawer
          isOpen={showCustomerModal}
          onClose={() => { setShowCustomerModal(false); setIsEditing(false); }}
          isEditing={isEditing}
          initialData={selectedCustomer}
          onSaveSuccess={(newCust) => {
            // 1. Force a background refresh of the server data to keep things in total sync
            refreshData(['customers', 'stats'], true);
            
            // 2. Optimistically update the local state for instant UI feedback
            if (isEditing) {
              setData({ 
                customers: customers.map(c => c.id === newCust.id ? newCust : c) 
              });
              
              // If we are currently viewing this customer's profile, update it instantly
              if (selectedCustomer?.id === newCust.id) {
                setSelectedCustomer(newCust);
                // Clear insights to trigger the re-fetch effect and show the fresh AI intelligence
                setCustomerInsights(null); 
              }
            } else {
              setData({ customers: [newCust, ...customers] });
            }

            setShowCustomerModal(false);
            setIsEditing(false);
          }}
        />

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
                className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition shadow-sm"
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
                <button onClick={() => handleEditCustomer()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                  <Edit size={15} /> Edit
                </button>
                <button onClick={() => handleDeleteCustomer()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 transition">
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
              <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_15px_60px_-15px_rgba(0,0,0,0.08)] p-6 flex flex-col gap-4">
                <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
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
                    <span>{[selectedCustomer.addressLine1, selectedCustomer.addressLine2, selectedCustomer.city, selectedCustomer.state, selectedCustomer.pincode, selectedCustomer.country].filter(Boolean).join(', ') || 'Not provided'}</span>
                  </div>
                </div>
                {settings.showTags && selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedCustomer.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-gray-200 rounded-lg text-xs font-medium">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Insights */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-[0_15px_60px_-15px_rgba(0,0,0,0.08)] p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
                {customerInsights ? (
                  <>
                    {(() => {
                      const churnRisk = customerInsights.churnRisk;
                      const nextPurchase = customerInsights.totalInvoices > 0 ? "Expected in ~14 days" : "No data available";
                      return (
                        <>
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5" style={{ fontFamily: 'Sora, sans-serif' }}>
                            <Activity className="w-5 h-5 text-teal-500" /> Customer Intelligence
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                            <div className="bg-gradient-to-br from-white to-teal-50/30 p-4 rounded-2xl border border-teal-100">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Revenue</p>
                              <h4 className="text-xl font-bold text-gray-900">₹{(customerInsights.totalRevenue / 1000).toFixed(1)}k</h4>
                              <p className="text-xs text-teal-600 mt-1 font-medium">{customerInsights.totalInvoices} invoices</p>
                            </div>
                            <div className="bg-gradient-to-br from-white to-teal-50/30 p-4 rounded-2xl border border-teal-100">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                <AlertCircle className={`w-3 h-3 ${churnRisk > 40 ? 'text-red-500' : 'text-teal-500'}`} />
                                Churn Risk
                              </div>
                              <h4 className="text-xl font-bold text-gray-900">{churnRisk}%</h4>
                              <p className="text-xs text-gray-400 mt-1">Mathematical Probability</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-200">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                <Calendar className="w-3 h-3 text-teal-500" />
                                Next Purchase
                              </div>
                              <h4 className="text-base font-bold text-gray-900 truncate" title={customerInsights.nextPurchase}>
                                {customerInsights.nextPurchase}
                              </h4>
                              <p className="text-xs text-gray-400 mt-1">Based on frequency</p>
                            </div>
                          </div>
                          <div className="bg-teal-50/40 p-4 rounded-2xl border border-gray-200">
                            <h4 className="text-sm font-bold text-teal-700 flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4" /> Recommended Action
                            </h4>
                            <p className="text-sm text-gray-700">
                              {customerInsights.recommendedAction}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div className="animate-pulse flex flex-col gap-4">
                    <div className="h-6 w-38 bg-gray-100 rounded" />
                    <div className="grid sm:grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-200" />)}
                    </div>
                    <div className="h-20 bg-gray-50 rounded-2xl" />
                  </div>
                )}
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                  <CreditCard size={18} className="text-teal-500" /> Transaction History
                </h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {customerInvoices.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-teal-50/10 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice #</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-950">
                      {customerInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-3.5 font-semibold text-gray-900">{invoice.invoiceNumber}</td>
                          <td className="px-6 py-3.5 text-gray-500">{new Date(invoice.date || Date.now()).toLocaleDateString()}</td>
                          <td className="px-6 py-3.5 text-gray-900 font-medium">₹{typeof invoice.total === 'number' ? invoice.total.toLocaleString() : invoice.total}</td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize bg-white border border-gray-200 text-gray-700`}>
                              {invoice.status}
                            </span>
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
                {customers.length > 0 && (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedCustomer(null);
                      setShowCustomerModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black transition shadow-xl shadow-slate-900/10"
                  >
                    <Plus size={16} /> Add Customer
                  </button>
                )}
              </div>
            </motion.div>

            {/* ─── Stat Cards ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8"
            >
              {[
                {
                  label: 'Total Clients',
                  value: stats.total.toString(),
                  sub: `${filteredCustomers.length} visible`,
                  icon: Users,
                  gradient: 'from-teal-500 to-cyan-500',
                  glow: 'shadow-teal-500/25',
                  accent: 'text-teal-600',
                  bg: 'from-teal-50/60 via-white to-cyan-50/40',
                  borderColor: 'border-teal-200/60',
                  ring: 'bg-teal-500',
                  delay: 0,
                },
                {
                  label: 'New This Month',
                  value: stats.recentCount.toString(),
                  sub: 'Last 30 days',
                  icon: TrendingUp,
                  gradient: 'from-violet-500 to-purple-500',
                  glow: 'shadow-violet-500/25',
                  accent: 'text-violet-600',
                  bg: 'from-violet-50/60 via-white to-purple-50/40',
                  borderColor: 'border-violet-200/60',
                  ring: 'bg-violet-500',
                  delay: 0.05,
                },
                {
                  label: 'Tagged Clients',
                  value: stats.withTags.toString(),
                  sub: 'Categorized',
                  icon: Filter,
                  gradient: 'from-amber-500 to-orange-500',
                  glow: 'shadow-amber-500/25',
                  accent: 'text-amber-600',
                  bg: 'from-amber-50/60 via-white to-orange-50/40',
                  borderColor: 'border-amber-200/60',
                  ring: 'bg-amber-500',
                  delay: 0.1,
                },
              ].map((card) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.45, delay: 0.05 + card.delay, ease: [0.23, 1, 0.32, 1] }}
                  className={`relative bg-white p-5 rounded-2xl border ${card.borderColor} shadow-sm hover:shadow-lg ${card.glow} hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group overflow-hidden cursor-default`}
                >
                  <div className="relative">
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


            {/* ─── Search & Controls ──────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="mb-6"
            >
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  {/* Search */}
                  <div className="relative flex-1 w-full md:max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, phone, tag..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition"
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
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 transition-all ${sortField === field
                          ? 'bg-teal-50 text-teal-700'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
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
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    Showing <strong className="text-gray-700">{filteredCustomers.length}</strong> of {customers.length} customers
                    {searchTerm && <span className="ml-1">matching "<strong className="text-teal-600">{searchTerm}</strong>"</span>}
                  </div>
                )}
              </div>
            </motion.div>

            {/* ─── Customer Grid/List ─── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              {customers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm">
                  <div className="bg-teal-50 p-4 rounded-2xl inline-flex mb-4 border border-gray-200">
                    <Users className="w-8 h-8 text-teal-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>No customers yet</h3>
                  <p className="text-gray-400 mt-2 text-sm">Add your first client to get started.</p>
                  <button
                    onClick={() => { setIsEditing(false); setSelectedCustomer(null); setShowCustomerModal(true); }}
                    className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black transition shadow-xl shadow-slate-900/10"
                  >
                    <Plus size={14} /> Add Customer
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className={`grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5`}>
                  {filteredCustomers.map((cust, idx) => {
                    return (
                      <motion.div
                        key={cust.id}
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, delay: Math.min(idx * 0.03, 0.3), ease: [0.23, 1, 0.32, 1] }}
                        className={`relative bg-white rounded-2xl border border-teal-200/60 shadow-sm hover:shadow-lg shadow-teal-500/10 hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 group overflow-hidden cursor-pointer`}
                        onClick={() => setSelectedCustomer(cust)}
                      >
                        <div className="relative p-4">
                          {/* Top row: actions only */}
                          <div className="flex items-start justify-end gap-3 mb-3">
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsEditing(true); setSelectedCustomer(cust); setShowCustomerModal(true); }}
                                className="p-1.5 hover:bg-white/80 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit size={14} className="text-gray-500" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(cust.id, cust.name); }}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 size={14} className="text-red-500" />
                              </button>
                            </div>
                          </div>

                          <h3 className="text-[13px] font-bold text-gray-900 mb-2.5 line-clamp-2 leading-snug flex items-center gap-1.5">
                            <Mail size={13} className="text-teal-500 shrink-0" />
                            <span className="truncate">{cust.email}</span>
                          </h3>

                          <div className="flex items-baseline gap-2 mb-2.5">
                            <span className="text-base font-extrabold text-gray-900 tracking-tight break-words leading-snug" style={{ fontFamily: 'Sora, sans-serif' }}>
                              {cust.name}
                            </span>
                            {/* Instead of GST, show Solopreneur Risk */}
                            {isSolopreneur && (cust as any).risk_score && (
                              <span className={`text-[10px] font-bold text-teal-600 bg-white px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-gray-100 shadow-sm`}>
                                <div 
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    (cust as any).risk_score === 'green' ? 'bg-green-500' : 
                                    (cust as any).risk_score === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                />
                                Risk
                              </span>
                            )}
                          </div>



                          <div className="flex items-center justify-between pt-2 border-t border-gray-100/80 mt-2.5">
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span>Added</span>
                              <span className="text-gray-300">·</span>
                              <span className="text-gray-400">{new Date(cust.createdAt as any || Date.now()).toLocaleDateString()}</span>
                            </div>
                            <div className={`flex items-center gap-1 text-[9px] font-bold text-teal-600 group-hover:translate-x-1 transition-transform`}>
                              <User className="w-2.5 h-2.5" />
                              Profile
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] overflow-hidden">
                  <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm">
                      <thead className="bg-teal-50/40 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tags</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-950">
                        {filteredCustomers.map(cust => (
                          <tr
                            key={cust.id}
                            className="hover:bg-gray-50 transition cursor-pointer group"
                            onClick={() => setSelectedCustomer(cust)}
                          >
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-teal-500 border border-gray-100 group-hover:scale-110 transition-transform">
                                    <User size={14} />
                                  </div>
                                  {/* Solopreneur Intelligence: Risk Dot */}
                                  {isSolopreneur && (cust as any).risk_score && (
                                    <div 
                                      className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white ${
                                        (cust as any).risk_score === 'green' ? 'bg-green-500' : 
                                        (cust as any).risk_score === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                    />
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-gray-900 group-hover:text-teal-700 transition break-words whitespace-normal">{cust.name}</div>
                                  {isSolopreneur && (
                                    <div className="flex gap-2 text-[10px] text-gray-400 font-medium">
                                      {(cust as any).avg_payment_days > 0 && (
                                        <span>~{(cust as any).avg_payment_days} days</span>
                                      )}
                                      {(cust as any).total_invoiced_lifetime > 0 && (
                                        <span className="text-teal-600/60 font-bold">{formatLTV((cust as any).total_invoiced_lifetime)} lifetime</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-gray-500">{cust.email}</td>
                            <td className="px-6 py-3.5 text-gray-500">{cust.phone || '–'}</td>
                            <td className="px-6 py-3.5">
                              <div className="flex gap-1">
                                {cust.tags?.slice(0, 2).map((tag, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-teal-50 border border-gray-200 text-teal-600 rounded text-[10px] font-semibold uppercase">{tag}</span>
                                ))}
                                {(cust.tags?.length ?? 0) > 2 && <span className="text-xs text-gray-400">+{(cust.tags?.length ?? 0) - 2}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-gray-400 text-xs">{new Date(cust.createdAt as any).toLocaleDateString()}</td>
                            <td className="px-6 py-3.5 text-right">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(cust.id, cust.name); }}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
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

    </div>
  );
}