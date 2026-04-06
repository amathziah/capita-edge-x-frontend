import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
    AlertTriangle,
    TrendingUp,
    Clock,
    CheckCircle2,
    ArrowRight,
    Activity,
    Users,
    FileText,
    CreditCard,
    LayoutGrid,
    Network
} from 'lucide-react';
import { motion } from 'framer-motion';
import { InvoiceLifecycleMap } from '../Visualizations/InvoiceLifecycleMap';

export function OperationsRoom() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { invoices, payments, stats, loading, refreshData } = useData();

    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

    useEffect(() => {
        // Force a hard sync on entry to ignore the 5min cache TTL
        if (user) refreshData(true);
    }, [user, refreshData]);


    // Metrics Calculation - Definitive Sync with Dashboard Map
    const metrics = useMemo(() => {
        // Use YYYY-MM-DD local format for precise "Today" detection
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        const overdue = Array.isArray(invoices) ? invoices.filter(i => {
          const status = (i.status || '').toLowerCase().trim();
          const isUnpaid = ['overdue', 'pending', 'sent'].includes(status);
          if (!isUnpaid || !i.dueDate) return false;
          
          // String comparison on clean YYYY-MM-DD strings
          const dueStr = i.dueDate.split('T')[0];
          return dueStr <= todayStr;
        }) : [];

        return {
            overdueInvoices: overdue,
            totalPending: stats.pending_payments || (Array.isArray(invoices) ? invoices.filter(i => {
                const s = (i.status || '').toLowerCase().trim();
                return s === 'pending' || s === 'sent';
            }).reduce((sum, i) => sum + (i.total || 0), 0) : 0),
            totalOverdue: overdue.reduce((sum, i) => sum + (i.total || 0), 0),
            totalCollected: stats.total_revenue || (Array.isArray(invoices) ? invoices.filter(i => (i.status || '').toLowerCase().trim() === 'paid').reduce((sum, i) => sum + (i.total || 0), 0) : 0),
            pendingCount: stats.pending_invoices || (Array.isArray(invoices) ? invoices.filter(i => {
                const s = (i.status || '').toLowerCase().trim();
                return s === 'pending' || s === 'sent';
            }).length : 0),
            overdueCount: overdue.length
        };
    }, [invoices, stats]);





    const { overdueInvoices, totalPending, totalOverdue, totalCollected, pendingCount, overdueCount } = metrics;

    // Activity Feed Logic
    const activityFeed = useMemo(() => {
        return {
            recentPayments: Array.isArray(payments) ? payments.slice(0, 3) : [],
            recentInvoices: Array.isArray(invoices) ? invoices.filter(i => (i.status as string) !== 'overdue').slice(0, 3) : []
        };
    }, [payments, invoices]);

    const { recentPayments, recentInvoices } = activityFeed;

    if (loading && invoices.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-gray-50/50">
                <div className="relative mb-8">
                    {/* Outer rotating dotted ring */}
                    <div className="w-20 h-20 border-4 border-emerald-400 border-dotted rounded-full animate-spin [animation-duration:3s]"></div>

                    {/* Inner pulsing glow */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full opacity-10 animate-ping [animation-duration:1.5s]"></div>
                    </div>

                    {/* Solid center dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-emerald-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                    </div>
                </div>

                <div className="space-y-2 text-center">
                    <h3 className="text-sm font-semibold tracking-widest text-emerald-800 uppercase">Initializing Control Room</h3>
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
        <div className="relative h-full w-full">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#e8f5e9_0%,_#f1f8f6_45%,_#f6fbf7_100%)]"></div>
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl -z-10"></div>
            <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-emerald-200/30 blur-[110px] -z-10"></div>

            <div className="p-6 lg:p-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
                >
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                                Mission Control
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="ml-2 text-[10px] text-emerald-400/60 lowercase font-normal italic">(capita live sync: v1.0.5)</span>
                            </div>
                            <h1 className="mt-2 text-3xl font-semibold text-gray-900 font-display tracking-tight">Control Room</h1>
                            <p className="text-gray-600 mt-2 max-w-xl">
                                A live operational view of revenue health, collections, and status flow.
                            </p>
                        </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-white p-1 rounded-xl border border-gray-200 flex items-center shadow-sm mr-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Workflow Map"
                            >
                                <Network size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => navigate('/dashboard/invoices')}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-gray-300 hover:text-gray-900 transition"
                        >
                            Review Overdue
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/customers')}
                            className="px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                        >
                            Add Client
                        </button>
                    </div>
                </motion.div>

                {viewMode === 'map' ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                        className="bg-[#0c0f1a] backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden relative"
                    >
                        {/* Map Header */}
                        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-[#161a2b]/80">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                                    <Network size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">
                                        Lifecycle Visualization Map
                                    </h3>
                                    <p className="text-[11px] text-gray-500 mt-0.5">Invoice status • Flow analysis • Process intelligence</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Live</span>
                            </div>
                        </div>
                        <div className="h-[660px]">
                            <InvoiceLifecycleMap invoices={invoices} />
                        </div>
                    </motion.div>
                ) : (
                    <>
                        {/* Grid Layout */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.05 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10"
                        >

                            {/* Card 1: Pending Revenue */}
                            <div
                                onClick={() => navigate('/dashboard/invoices')}
                                className="relative bg-gradient-to-br from-white to-emerald-50/30 p-6 rounded-2xl border border-emerald-100 shadow-card cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group overflow-hidden"
                            >
                                <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-100/40 rounded-full blur-2xl" />
                                <div className="relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                            <TrendingUp size={12} className="mr-1" /> +12%
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pending Revenue</p>
                                        <h3 className="text-2xl font-bold text-gray-900">₹{(totalPending / 1000).toFixed(1)}k</h3>
                                        <p className="text-sm text-emerald-600 mt-2 font-medium">{pendingCount} invoices pending</p>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Overdue */}
                            <div
                                onClick={() => navigate('/dashboard/invoices')}
                                className="relative bg-gradient-to-br from-white to-emerald-50/30 p-6 rounded-2xl border border-emerald-100 shadow-card cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group overflow-hidden"
                            >
                                <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-100/40 rounded-full blur-2xl" />
                                {overdueCount > 0 && <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50" />}
                                <div className="relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                            <AlertTriangle size={20} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Action Required</p>
                                        <h3 className="text-2xl font-bold text-gray-900">₹{(totalOverdue / 1000).toFixed(1)}k</h3>
                                        <p className="text-sm text-amber-600 mt-2 font-medium">{overdueCount} overdue payments</p>
                                        <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center group-hover:gap-2 transition-all">
                                            View Details <ArrowRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Cash Flow Health */}
                            <div
                                onClick={() => navigate('/dashboard/payments')}
                                className="relative bg-gradient-to-br from-white to-emerald-50/30 p-6 rounded-2xl border border-emerald-100 shadow-card cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group overflow-hidden"
                            >
                                <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-100/40 rounded-full blur-2xl" />
                                <div className="relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                            <Activity size={20} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cash Collected</p>
                                        <h3 className="text-2xl font-bold text-gray-900">₹{(totalCollected / 1000).toFixed(1)}k</h3>
                                        <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                                            <div className="bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 h-full rounded-full transition-all duration-700" style={{ width: '65%' }} />
                                        </div>
                                        <p className="text-sm text-emerald-600 mt-2 font-medium">65% of monthly goal</p>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Active Clients */}
                            <div
                                onClick={() => navigate('/dashboard/customers')}
                                className="relative bg-gradient-to-br from-white to-emerald-50/30 p-6 rounded-2xl border border-emerald-100 shadow-card cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group overflow-hidden"
                            >
                                <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-100/40 rounded-full blur-2xl" />
                                <div className="relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                            <Users size={20} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Clients</p>
                                        <h3 className="text-2xl font-bold text-gray-900">{stats.total_customers || 0}</h3>
                                        <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center">
                                            Manage clients <ArrowRight size={12} className="ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ─── Capita Cash Flow Projection ─── */}
                        {(() => {
                          const now = Date.now();
                          const day = 1000 * 60 * 60 * 24;

                          const unpaid = Array.isArray(invoices)
                            ? invoices.filter(i => 
                                i.status !== 'paid' && 
                                i.status !== 'cancelled' &&
                                i.dueDate
                              )
                            : [];

                          const week1 = unpaid
                            .filter(i => {
                              const due = new Date(i.dueDate!).getTime();
                              return due >= now && due < now + 7 * day;
                            })
                            .reduce((s, i) => s + (i.total || 0), 0);

                          const week2 = unpaid
                            .filter(i => {
                              const due = new Date(i.dueDate!).getTime();
                              return due >= now + 7 * day && 
                                     due < now + 14 * day;
                            })
                            .reduce((s, i) => s + (i.total || 0), 0);

                          const week3 = unpaid
                            .filter(i => {
                              const due = new Date(i.dueDate!).getTime();
                              return due >= now + 14 * day && 
                                     due < now + 21 * day;
                            })
                            .reduce((s, i) => s + (i.total || 0), 0);

                          const week4 = unpaid
                            .filter(i => {
                              const due = new Date(i.dueDate!).getTime();
                              return due >= now + 21 * day && 
                                     due < now + 28 * day;
                            })
                            .reduce((s, i) => s + (i.total || 0), 0);

                          const overdue = unpaid
                            .filter(i => 
                              new Date(i.dueDate!).getTime() < now
                            )
                            .reduce((s, i) => s + (i.total || 0), 0);

                          const total30 = week1 + week2 + 
                                          week3 + week4;

                          const weeks = [
                            { label: 'This week', value: week1 },
                            { label: 'Week 2', value: week2 },
                            { label: 'Week 3', value: week3 },
                            { label: 'Week 4', value: week4 },
                          ];

                          const maxWeek = Math.max(
                            ...weeks.map(w => w.value), 1
                          );

                          if (total30 === 0 && overdue === 0) 
                            return null;

                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.08 }}
                              className="mb-6 bg-white/80 backdrop-blur-xl 
                                rounded-3xl border border-emerald-100 
                                shadow-sm p-6"
                            >
                              <div className="flex items-center 
                                justify-between mb-5">
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 bg-emerald-100 
                                    rounded-xl">
                                    <TrendingUp size={18} 
                                      className="text-emerald-600" />
                                  </div>
                                  <div>
                                    <h2 className="text-base font-bold 
                                      text-gray-900">
                                      Capita: 30-Day Cash Projection
                                    </h2>
                                    <p className="text-xs text-gray-500 
                                      mt-0.5">
                                      ₹{total30.toLocaleString()} expected 
                                      in next 30 days
                                    </p>
                                  </div>
                                </div>
                                {overdue > 0 && (
                                  <div className="text-xs font-semibold 
                                    text-red-700 bg-red-50 border 
                                    border-red-200 px-3 py-1.5 rounded-lg">
                                    ₹{overdue.toLocaleString()} overdue
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-4 gap-3">
                                {weeks.map((w, i) => (
                                  <div key={i} className="flex flex-col 
                                    gap-2">
                                    <div className="flex items-end gap-1 
                                      h-16">
                                      <div
                                        className="w-full rounded-lg 
                                          bg-emerald-100 transition-all 
                                          duration-500 relative group"
                                        style={{
                                          height: w.value > 0
                                            ? `${Math.max(
                                                (w.value / maxWeek) * 100, 
                                                8
                                              )}%`
                                            : '8%',
                                          backgroundColor: w.value > 0
                                            ? undefined
                                            : '#f3f4f6'
                                        }}
                                      >
                                        {w.value > 0 && (
                                          <div
                                            className="absolute inset-0 
                                              rounded-lg bg-gradient-to-t 
                                              from-emerald-400 to-emerald-300 
                                              opacity-80"
                                          />
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold 
                                        text-gray-500 uppercase tracking-wide">
                                        {w.label}
                                      </p>
                                      <p className={`text-sm font-bold 
                                        mt-0.5 ${w.value > 0 
                                          ? 'text-gray-900' 
                                          : 'text-gray-300'}`}>
                                        {w.value > 0
                                          ? `₹${(w.value / 1000)
                                              .toFixed(1)}k`
                                          : '—'}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          );
                        })()}

                        {/* ─── Capita Dead Money Widget ─── */}
                        {(() => {
                          const unsent = Array.isArray(invoices)
                            ? invoices.filter(i => i.status === 'draft')
                            : [];
                          const overdue30 = Array.isArray(invoices)
                            ? invoices.filter(i => {
                                if (i.status === 'paid' || i.status === 'cancelled') return false;
                                const due = new Date(i.dueDate || i.date);
                                const daysDiff = (Date.now() - due.getTime()) / (1000 * 60 * 60 * 24);
                                return daysDiff > 30;
                              })
                            : [];
                          const unsentTotal = unsent.reduce((s, i) => s + (i.total || 0), 0);
                          const overdue30Total = overdue30.reduce((s, i) => s + (i.total || 0), 0);
                          const deadTotal = unsentTotal + overdue30Total;

                          if (deadTotal === 0) return null;

                          const topItems = [
                            ...unsent.map(i => ({ ...i, _type: 'unsent' })),
                            ...overdue30.map(i => ({ ...i, _type: 'overdue' }))
                          ]
                            .sort((a, b) => (b.total || 0) - (a.total || 0))
                            .slice(0, 5);

                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.1 }}
                              className="mb-8 bg-white/80 backdrop-blur-xl rounded-3xl border border-amber-100 shadow-sm p-6"
                            >
                              <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 bg-amber-100 rounded-xl">
                                    <AlertTriangle size={18} className="text-amber-600" />
                                  </div>
                                  <div>
                                    <h2 className="text-base font-bold text-gray-900">
                                      Capita: Dead Money Alert
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      ₹{deadTotal.toLocaleString()} is sitting idle — 
                                      not invoiced or not collected
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => navigate('/dashboard/invoices')}
                                  className="text-xs font-semibold text-amber-700 bg-amber-50 
                                    border border-amber-200 px-3 py-1.5 rounded-lg 
                                    hover:bg-amber-100 transition flex items-center gap-1"
                                >
                                  View all <ArrowRight size={12} />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-5">
                                <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100">
                                  <p className="text-[10px] font-bold uppercase tracking-wider 
                                    text-amber-700 mb-1">
                                    Unsent drafts
                                  </p>
                                  <p className="text-xl font-bold text-gray-900">
                                    ₹{unsentTotal.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-amber-600 mt-1">
                                    {unsent.length} invoice{unsent.length !== 1 ? 's' : ''} 
                                    never sent
                                  </p>
                                </div>
                                <div className="bg-red-50/60 rounded-2xl p-4 border border-red-100">
                                  <p className="text-[10px] font-bold uppercase tracking-wider 
                                    text-red-700 mb-1">
                                    Overdue 30+ days
                                  </p>
                                  <p className="text-xl font-bold text-gray-900">
                                    ₹{overdue30Total.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-red-600 mt-1">
                                    {overdue30.length} invoice{overdue30.length !== 1 ? 's' : ''} 
                                    long overdue
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {topItems.map(inv => (
                                  <div
                                    key={inv.id}
                                    onClick={() => navigate('/dashboard/invoices')}
                                    className="flex items-center justify-between px-4 py-2.5 
                                      rounded-xl border border-gray-100 hover:bg-gray-50 
                                      cursor-pointer transition group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        inv._type === 'unsent' 
                                          ? 'bg-amber-400' 
                                          : 'bg-red-500'
                                      }`} />
                                      <div>
                                        <span className="text-sm font-semibold text-gray-800">
                                          {inv.buyer?.name || 'Unknown'}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-2">
                                          #{inv.invoiceNumber}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 
                                        rounded-full ${
                                          inv._type === 'unsent'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {inv._type === 'unsent' ? 'Unsent' : '30+ days overdue'}
                                      </span>
                                      <span className="text-sm font-bold text-gray-900">
                                        ₹{(inv.total || 0).toLocaleString()}
                                      </span>
                                      <ArrowRight size={14} 
                                        className="text-gray-300 group-hover:text-gray-500 
                                          group-hover:translate-x-0.5 transition-all" 
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          );
                        })()}

                        {/* Monitoring Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Agent Activity Feed */}
                            <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl border border-emerald-100/60 shadow-sm p-6 lg:p-7 relative overflow-hidden">
                                {/* Decorative Background Element */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>

                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Activity size={18} className="text-emerald-500" />
                                        Live Monitoring
                                    </h2>
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center border border-emerald-100">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                                        Systems Nominal
                                    </span>
                                </div>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {/* Recent Payments Feed */}
                                    {recentPayments.map((pay) => (
                                        <div key={pay.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-emerald-100 hover:border-emerald-200 transition-colors shadow-sm">
                                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                                                <CreditCard size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900">Payment Received</h3>
                                                <p className="text-sm text-gray-500 mt-0.5">Received ₹{pay.amount.toLocaleString()} via {pay.method}.</p>
                                                <span className="text-xs text-emerald-500 mt-2 block">{new Date(pay.createdAt || 0).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Overdue Alerts */}
                                    {overdueInvoices.slice(0, 2).map((inv) => (
                                        <div key={inv.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-amber-100 hover:border-amber-200 transition-colors cursor-pointer shadow-sm group" onClick={() => navigate('/dashboard/invoices')}>
                                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                                                <AlertTriangle size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900">Collection Alert</h3>
                                                <p className="text-sm text-gray-500 mt-0.5">Invoice #{inv.invoiceNumber} for {inv.buyer?.name} is overdue by {Math.floor((Date.now() - new Date(inv.dueDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24))} days.</p>
                                                <span className="text-xs text-amber-500 mt-2 block font-medium">Recommended: Send Follow-up</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Recent Invoice Activity */}
                                    {recentInvoices.map((inv) => (
                                        <div key={inv.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-emerald-100 hover:border-emerald-200 transition-colors shadow-sm">
                                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                                                <CheckCircle2 size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900">Invoice {inv.status === 'draft' ? 'Draft Created' : 'Generated'}</h3>
                                                <p className="text-sm text-gray-500 mt-0.5">Invoice #{inv.invoiceNumber} for {inv.buyer?.name} - ₹{inv.total.toLocaleString()}.</p>
                                                <span className="text-xs text-gray-400 mt-2 block">{new Date(inv.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Fallback */}
                                    {recentPayments.length === 0 && overdueInvoices.length === 0 && recentInvoices.length === 0 && (
                                        <div className="text-center py-6 text-gray-400 text-sm">
                                            No recent activity to display.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Priority Queue (List) */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-emerald-100/60 shadow-sm p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Clock size={18} className="text-emerald-500" />
                                    Priority Queue
                                </h2>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {overdueInvoices.length > 0 ? (
                                        overdueInvoices.map((inv) => (
                                            <div key={inv.id} className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 hover:bg-amber-50/50 hover:border-amber-100 transition cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 group-hover:scale-125 transition-transform"></div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{inv.buyer?.name}</div>
                                                        <div className="text-xs text-gray-500">{inv.invoiceNumber}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-gray-900">₹{inv.total.toLocaleString()}</div>
                                                    <div className="text-xs text-amber-500 group-hover:font-medium">Overdue</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-400 text-sm">
                                            <CheckCircle2 size={24} className="mx-auto mb-2 opacity-20" />
                                            No urgent items.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
