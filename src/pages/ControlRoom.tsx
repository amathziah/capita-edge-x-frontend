import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { usePersona } from '../contexts/PersonaContext';
import {
    AlertTriangle,
    TrendingUp,
    Clock,
    CheckCircle2,
    Activity,
    Users,
    FileText,
    CreditCard,
    LayoutGrid,
    Network,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvoiceLifecycleMap } from '../components/Visualizations/InvoiceLifecycleMap';
import { SYNC_STEPS } from '../utils/aiLoadingSteps';


export const ControlRoom = () => {
    const { businessType, loading: personaLoading } = usePersona();
    const navigate = useNavigate();
    const { invoices, payments, customers, expenses, stats, loading, refreshData } = useData();
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [currentStep, setCurrentStep] = useState(SYNC_STEPS[0]);


    useEffect(() => {
        refreshData(['invoices', 'stats', 'payments', 'customers', 'expenses']);
    }, [refreshData]);

    // Sync Step cycling
    useEffect(() => {
        if (!loading && !personaLoading) {
            setCurrentStep(SYNC_STEPS[0]);
            return;
        }
        let stepIdx = 0;
        const interval = setInterval(() => {
            stepIdx = (stepIdx + 1) % SYNC_STEPS.length;
            setCurrentStep(SYNC_STEPS[stepIdx]);
        }, 1800);
        return () => clearInterval(interval);
    }, [loading, personaLoading]);

    const isSolopreneur = businessType === 'solopreneur';



    const metrics = useMemo(() => {
        const overdue = Array.isArray(invoices) ? invoices.filter(i => (i.status === 'pending' && i.dueDate && new Date(i.dueDate) < new Date())) : [];

        // SaaS Specifics
        const monthlyExpenses = Array.isArray(expenses) ? expenses.reduce((sum: number, e: any) => sum + e.amount, 0) : 0;
        const collected = stats.total_revenue || (Array.isArray(invoices) ? invoices.filter(i => i.status === 'paid').reduce((sum: number, i: any) => sum + i.total, 0) : 0);
        const runway = monthlyExpenses > 0 ? Math.floor(collected / (monthlyExpenses / 3 || 1)) : 12;

        return {
            overdueInvoices: overdue,
            totalPending: stats.pending_payments || (Array.isArray(invoices) ? invoices.filter(i => i.status === 'draft' || i.status === 'pending').reduce((sum, i) => sum + i.total, 0) : 0),
            totalOverdue: stats.overdue_revenue || overdue.reduce((sum, i) => sum + i.total, 0),
            totalCollected: collected,
            pendingCount: stats.pending_invoices || (Array.isArray(invoices) ? invoices.filter(i => i.status === 'draft' || i.status === 'pending').length : 0),
            overdueCount: stats.overdue_invoices || overdue.length,
            // SaaS Extensions
            growthRate: 8.4, // Fallback placeholder but ideally calculated from historical stats
            churnRate: 1.2,
            cashRunway: Math.min(runway || 12, 24),
            activeSubscriptions: stats.total_customers || (Array.isArray(customers) ? customers.length : 0),
            // Agency Extensions
            retainerUsage: 78,
            unbilledHours: (stats.pending_invoices || 0) * 8
        };
    }, [invoices, stats, expenses, customers]);

    const {
        overdueInvoices,
        totalPending,
        totalOverdue,
        totalCollected,
        pendingCount,
        overdueCount,
        growthRate,
        churnRate,
        cashRunway,
        activeSubscriptions,
        retainerUsage,
        unbilledHours
    } = metrics;

    const activityFeed = useMemo(() => {
        return {
            recentPayments: Array.isArray(payments) ? payments.slice(0, 3) : [],
            recentInvoices: Array.isArray(invoices) ? invoices.filter(i => !(i.status === 'pending' && i.dueDate && new Date(i.dueDate) < new Date())).slice(0, 3) : []
        };
    }, [payments, invoices]);

    const { recentPayments, recentInvoices } = activityFeed;

    const solopreneurMetrics = useMemo(() => {
        if (!isSolopreneur) return null;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const isInCurrentMonth = (dateStr?: string) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        };

        const todayStr = now.toISOString().split('T')[0];

        // 1. Total Invoiced (This Month)
        const monthlyInvoices = invoices.filter(i => isInCurrentMonth(i.date) && i.status !== 'draft');
        const totalInvoicedMonth = monthlyInvoices.reduce((sum, i) => sum + (i.total || 0), 0);

        // 2. Overdue - Inclusive of Today for precise action tracing
        const overdueList = invoices.filter(i => {
            const status = (i.status || '').toLowerCase().trim();
            const isUnpaid = ['overdue', 'pending', 'sent'].includes(status);
            if (!isUnpaid || !i.dueDate) return false;
            
            const dueStr = i.dueDate.split('T')[0];
            return dueStr <= todayStr;
        });
        const totalOverdueAmount = overdueList.reduce((sum, i) => sum + (i.total || 0), 0);
        
        // 3. Cash Collected (This Month)
        const monthlyPayments = payments.filter(p => isInCurrentMonth(p.date || p.createdAt));
        const totalCollectedMonth = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Collection rate calculation
        const collectionRate = totalInvoicedMonth > 0 ? Math.round((totalCollectedMonth / totalInvoicedMonth) * 100) : 0;

        // 4. Net Receivable (Total Unpaid Pipeline)
        const unpaidInvoices = invoices.filter(i => {
            const status = (i.status || '').toLowerCase().trim();
            return ['pending', 'sent', 'overdue'].includes(status);
        });
        const netReceivableTotal = unpaidInvoices.reduce((sum, i) => sum + (i.total || 0), 0);

        // Who Owes Me - Full accurate list
        const whoOwesMe = [...overdueList]
            .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
            .slice(0, 10); // Expanded for better visibility


        return {
            totalInvoicedMonth,
            totalOverdueAmount,
            overdueCount: overdueList.length,
            totalCollectedMonth,
            collectionRate,
            netReceivableTotal,
            whoOwesMe
        };
    }, [invoices, payments, isSolopreneur]);

    if ((loading && invoices.length === 0) || personaLoading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] bg-gray-50/50 space-y-4">
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
                    <h3 className="text-sm font-semibold tracking-widest text-emerald-800 uppercase">{currentStep}</h3>
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

            <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
                >
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                            {isSolopreneur ? "Control Room" : "Mission Control"}
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <h1 className="mt-2 text-3xl font-black text-gray-900 tracking-tight">
                            {isSolopreneur ? "Control Room" : "Control Room"}
                        </h1>
                        <p className="text-gray-500 mt-1 font-bold text-xs tracking-wide">
                            {isSolopreneur ? "Your financial overview" : `${businessType || 'New'} Persona Matrix Active`}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-white p-1 rounded-xl border border-gray-200 flex items-center shadow-sm">
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
                            onClick={() => navigate('/dashboard/invoices/new')}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black transition shadow-xl shadow-slate-900/10"
                        >
                            Quick Action
                        </button>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {viewMode === 'map' ? (
                        <motion.div
                            key="map"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-[#0c0f1a] backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden relative"
                        >
                            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-[#161a2b]/80">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                                        <Network size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Lifecycle Visualization Map</h3>
                                        <p className="text-[11px] text-gray-500 mt-0.5">Invoice status • Flow analysis</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Live</span>
                                </div>
                            </div>
                            <div className="h-[600px]">
                                <InvoiceLifecycleMap invoices={invoices} />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                        >
                            {/* SaaS Metrics or Standard Stats Grid */}
                            <div className={`grid grid-cols-1 md:grid-cols-2 ${isSolopreneur ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-5 mb-10`}>
                                {businessType === 'subscription' ? (
                                    <>
                                        {/* Card 1: MRR */}
                                        <div
                                            onClick={() => navigate('/invoices')}
                                            className="relative bg-gradient-to-br from-white to-indigo-50/30 p-6 rounded-2xl border border-indigo-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-indigo-100/40 rounded-full blur-2xl" />
                                            <div className="relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                                        <Activity size={20} />
                                                    </div>
                                                    <div className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                                        <TrendingUp size={12} className="mr-1" /> +{growthRate}%
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Monthly Recurring Revenue</p>
                                                    <h3 className="text-2xl font-bold text-gray-900">₹{(totalCollected / 1000).toFixed(1)}k</h3>
                                                    <p className="text-sm text-indigo-600 mt-2 font-medium">Growth Mode Active</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 2: Churn Rate */}
                                        <div
                                            onClick={() => navigate('/customers')}
                                            className="relative bg-gradient-to-br from-white to-rose-50/30 p-6 rounded-2xl border border-rose-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-rose-200 transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-rose-100/40 rounded-full blur-2xl" />
                                            <div className="relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-rose-100 text-rose-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                                        <AlertTriangle size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Churn Rate</p>
                                                    <h3 className="text-2xl font-bold text-gray-900">{churnRate}%</h3>
                                                    <p className="text-sm text-rose-600 mt-2 font-medium">Below Target (1.5%)</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 3: Cash Runway */}
                                        <div
                                            className="relative bg-gradient-to-br from-white to-emerald-50/30 p-6 rounded-2xl border border-emerald-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-100/40 rounded-full blur-2xl" />
                                            <div className="relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                                        <Activity size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cash Runway</p>
                                                    <h3 className="text-2xl font-bold text-gray-900">{cashRunway} Months</h3>
                                                    <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                                                        <div className="bg-gradient-to-r from-emerald-400 to-teal-600 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (cashRunway / 12) * 100)}%` }} />
                                                    </div>
                                                    <p className="text-sm text-emerald-600 mt-2 font-medium">Status: {cashRunway > 6 ? 'Stable' : 'Critical'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 4: Active Subs */}
                                        <div
                                            onClick={() => navigate('/customers')}
                                            className="relative bg-gradient-to-br from-white to-emerald-50/30 p-6 rounded-2xl border border-emerald-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-100/40 rounded-full blur-2xl" />
                                            <div className="relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                                        <Users size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Subscriptions</p>
                                                    <h3 className="text-2xl font-bold text-gray-900">{activeSubscriptions}</h3>
                                                    <p className="text-sm text-emerald-600 mt-2 font-medium">Investor View Active</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : businessType === 'services_firm' ? (
                                    <>
                                        {/* Agency Card 1: Pending Revenue */}
                                        <div
                                            onClick={() => navigate('/invoices')}
                                            className="relative bg-gradient-to-br from-white to-emerald-50/30 p-6 rounded-2xl border border-emerald-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-100/40 rounded-full blur-2xl" />
                                            <div className="relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                                        <FileText size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pending Revenue</p>
                                                    <h3 className="text-2xl font-bold text-gray-900">₹{(totalPending / 1000).toFixed(1)}k</h3>
                                                    <p className="text-sm text-emerald-600 mt-2 font-medium">{pendingCount} active invoices</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Agency Card 2: Cash Collected */}
                                        <div
                                            onClick={() => navigate('/payments')}
                                            className="relative bg-gradient-to-br from-white to-emerald-50/30 p-6 rounded-2xl border border-emerald-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group overflow-hidden"
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
                                                    <p className="text-sm text-emerald-600 mt-2 font-medium">This month</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Agency Card 3: Retainer Usage */}
                                        <div
                                            className="relative bg-gradient-to-br from-white to-indigo-50/30 p-6 rounded-2xl border border-indigo-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-indigo-100/40 rounded-full blur-2xl" />
                                            <div className="relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                                        <Clock size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Retainer Usage</p>
                                                    <h3 className="text-2xl font-bold text-gray-900">{retainerUsage}%</h3>
                                                    <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                                                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full" style={{ width: `${retainerUsage}%` }} />
                                                    </div>
                                                    <p className="text-sm text-indigo-600 mt-2 font-medium">Avg. across clients</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Agency Card 4: Unbilled Hours */}
                                        <div
                                            className="relative bg-gradient-to-br from-white to-amber-50/30 p-6 rounded-2xl border border-amber-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-amber-200 transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-amber-100/40 rounded-full blur-2xl" />
                                            <div className="relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                                        <Users size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Unbilled Hours</p>
                                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight text-center">
                                                        {unbilledHours}h
                                                    </h3>
                                                    <p className="text-sm text-amber-600 mt-2 font-medium">Ready to invoice</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : isSolopreneur && solopreneurMetrics ? (
                                    <>
                                        {/* Card 1: Total Invoiced */}
                                        <div
                                            className="relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-gray-50 rounded-full blur-2xl" />
                                            <div className="relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-gray-100 text-gray-600 rounded-xl group-hover:scale-110 transition-transform">
                                                        <FileText size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Invoiced</p>
                                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">₹{solopreneurMetrics.totalInvoicedMonth.toLocaleString()}</h3>
                                                    <p className="text-xs text-gray-500 mt-2 font-medium">This month</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 2: Overdue */}
                                        <div
                                            className="relative bg-white p-6 rounded-2xl border border-amber-100 shadow-sm transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-amber-50 rounded-full blur-2xl" />
                                            <div className="relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                                                        <AlertTriangle size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Overdue</p>
                                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">₹{solopreneurMetrics.totalOverdueAmount.toLocaleString()}</h3>
                                                    <p className="text-xs text-amber-600 mt-2 font-bold">{solopreneurMetrics.overdueCount} invoices overdue</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 3: Cash Collected */}
                                        <div
                                            className="relative bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-50 rounded-full blur-2xl" />
                                            <div className="relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                                        <CheckCircle2 size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cash Collected</p>
                                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">₹{solopreneurMetrics.totalCollectedMonth.toLocaleString()}</h3>
                                                    <p className="text-xs text-emerald-600 mt-2 font-medium">{solopreneurMetrics.collectionRate}% collection rate</p>
                                                </div>
                                            </div>
                                        </div>


                                    </>
                                ) : (
                                    <>
                                        {/* Default Card 1: Pending Revenue */}
                                        <div
                                            onClick={() => navigate('/invoices')}
                                            className="relative bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-100/40 rounded-full blur-2xl" />
                                            <div className="relative text-left">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                                        <FileText size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pending Revenue</p>
                                                    <h3 className="text-2xl font-bold text-gray-900">₹{(totalPending / 1000).toFixed(1)}k</h3>
                                                    <p className="text-sm text-emerald-600 mt-2 font-medium">{pendingCount} invoices pending</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Default Card 2: Action Required */}
                                        <div
                                            onClick={() => navigate('/invoices')}
                                            className="relative bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-100/40 rounded-full blur-2xl" />
                                            {overdueCount > 0 && <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50" />}
                                            <div className="relative text-left">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                                        <AlertTriangle size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Action Required</p>
                                                    <h3 className="text-2xl font-bold text-gray-900">₹{(totalOverdue / 1000).toFixed(1)}k</h3>
                                                    <p className="text-sm text-amber-600 mt-2 font-medium">{overdueCount} overdue payments</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Default Card 3: Collected */}
                                        <div
                                            onClick={() => navigate('/payments')}
                                            className="relative bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group overflow-hidden"
                                        >
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-100/40 rounded-full blur-2xl" />
                                            <div className="relative text-left">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                                        <Activity size={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cash Collected</p>
                                                    <h3 className="text-2xl font-bold text-gray-900">₹{(totalCollected / 1000).toFixed(1)}k</h3>
                                                    <p className="text-sm text-emerald-600 mt-2 font-medium">This year</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Monitoring (Hidden for Solopreneurs) */}
                                {!isSolopreneur && (
                                    <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl border border-emerald-100/60 shadow-sm p-6 lg:p-7 relative overflow-hidden">
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

                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {recentPayments.map((pay) => (
                                                <div key={pay.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-emerald-100 hover:border-emerald-200 transition-colors shadow-sm">
                                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0"><CreditCard size={16} /></div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900">Payment Received</h3>
                                                        <p className="text-sm text-gray-500 mt-0.5">₹{pay.amount.toLocaleString()} via {pay.method}</p>
                                                        <span className="text-xs text-emerald-500 mt-2 block">{new Date(pay.createdAt || 0).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {overdueInvoices.slice(0, 2).map((inv) => (
                                                <div key={inv.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-amber-100 hover:border-amber-200 transition-colors cursor-pointer shadow-sm group" onClick={() => navigate('/invoices')}>
                                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0 group-hover:scale-110 transition-transform"><AlertTriangle size={16} /></div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900">Collection Alert</h3>
                                                        <p className="text-sm text-gray-500 mt-0.5">#{inv.invoiceNumber} for {inv.buyer?.name} is overdue.</p>
                                                        <span className="text-xs text-amber-500 mt-2 block font-medium">Action: Send Follow-up</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {recentInvoices.map((inv) => (
                                                <div key={inv.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 border border-emerald-100 hover:border-emerald-200 transition-colors shadow-sm">
                                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0"><CheckCircle2 size={16} /></div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900">Invoice {inv.status === 'draft' ? 'Draft' : 'Sent'}</h3>
                                                        <p className="text-sm text-gray-500 mt-0.5">#{inv.invoiceNumber} to {inv.buyer?.name} - ₹{inv.total.toLocaleString()}</p>
                                                        <span className="text-xs text-gray-400 mt-2 block">{new Date(inv.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Priority Queue (Always shown, full width for solopreneurs) */}
                                <div className={`${isSolopreneur ? 'lg:col-span-3' : 'lg:col-span-1'} bg-white/80 backdrop-blur-xl rounded-3xl border border-emerald-100/60 shadow-sm p-6`}>
                                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                                <AlertCircle size={18} />
                                            </div>
                                            {isSolopreneur ? "Who Owes Me" : (businessType === 'subscription' ? 'Failed Subscriptions' : 'Priority Queue')}
                                        </div>
                                        {isSolopreneur && solopreneurMetrics && (
                                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-tighter border border-amber-100">
                                                {solopreneurMetrics.overdueCount} Pending Actions
                                            </span>
                                        )}
                                    </h2>

                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {isSolopreneur && solopreneurMetrics && solopreneurMetrics.whoOwesMe.length > 0 ? (
                                            solopreneurMetrics.whoOwesMe.map((inv) => {
                                                const dueDate = new Date(inv.dueDate);
                                                const diff = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                                                
                                                return (
                                                    <div key={inv.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                                                                {inv.buyer?.name?.substring(0, 2) || "C"}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-900">{inv.buyer?.name || "Customer"}</div>
                                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{diff} days overdue</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <div className="text-sm font-black text-gray-900">₹{inv.total.toLocaleString()}</div>
                                                                <div className="text-[10px] text-amber-500 font-bold uppercase">Overdue</div>
                                                            </div>
                                                            <button 
                                                                disabled 
                                                                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 opacity-50 cursor-not-allowed"
                                                            >
                                                                Remind
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : overdueInvoices.length > 0 ? (
                                            overdueInvoices.map((inv) => (
                                                <div key={inv.id} className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 hover:bg-amber-50/50 hover:border-amber-100 transition cursor-pointer group" onClick={() => navigate('/invoices')}>
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
                                            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                                                <div className="text-2xl mb-2">🎉</div>
                                                <h3 className="text-sm font-bold text-gray-900">
                                                    {isSolopreneur ? "No overdue invoices — you're all caught up!" : "No urgent items."}
                                                </h3>
                                                <p className="text-xs text-gray-400 mt-1">Check back later for updates</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
