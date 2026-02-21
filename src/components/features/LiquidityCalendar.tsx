import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Calendar, dateFnsLocalizer, type Event, type EventProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { CollectionsActionModal } from './CollectionsActionModal';
import {
    Send as SendIcon,
    Search,
    CalendarDays,
    Settings2,
    Filter,
    AlertTriangle,
    FileText,
    CheckCircle2,
    Clock,
    TrendingUp,
    X,
    Eye,
    Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Invoice } from '../../types';

import 'react-big-calendar/lib/css/react-big-calendar.css';

// ---------------------------------------------------------------------------
// date-fns localizer
// ---------------------------------------------------------------------------
const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

// ---------------------------------------------------------------------------
// Calendar event type
// ---------------------------------------------------------------------------
export interface CalendarInvoiceEvent extends Event {
    id: string;
    invoiceNumber: string;
    total: number;
    type: 'income';
    status: Invoice['status'];
    customerName: string;
    reminderSent: boolean;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string; label: string; dot: string }> = {
    paid: { bg: '#0d9488', border: '#0f766e', text: '#ccfbf1', label: 'Paid', dot: 'bg-teal-500' },
    sent: { bg: '#0d9488', border: '#0f766e', text: '#ccfbf1', label: 'Sent', dot: 'bg-teal-500' },
    pending: { bg: '#d97706', border: '#b45309', text: '#fef3c7', label: 'Pending', dot: 'bg-amber-500' },
    overdue: { bg: '#dc2626', border: '#b91c1c', text: '#fee2e2', label: 'Overdue', dot: 'bg-red-500' },
    draft: { bg: '#6b7280', border: '#4b5563', text: '#f3f4f6', label: 'Draft', dot: 'bg-gray-400' },
    viewed: { bg: '#0d9488', border: '#0f766e', text: '#ccfbf1', label: 'Viewed', dot: 'bg-teal-500' },
    cancelled: { bg: '#9ca3af', border: '#6b7280', text: '#f9fafb', label: 'Cancelled', dot: 'bg-gray-400' },
    escalated: { bg: '#7c3aed', border: '#6d28d9', text: '#ede9fe', label: 'Escalated', dot: 'bg-violet-500' },
    partially_paid: { bg: '#0891b2', border: '#0e7490', text: '#cffafe', label: 'Partial', dot: 'bg-cyan-500' },
};

const VISIBLE_STATUSES = ['paid', 'sent', 'pending', 'overdue', 'draft'];

// ---------------------------------------------------------------------------
// Custom Event component
// ---------------------------------------------------------------------------
const CalendarEvent = memo(({ event }: EventProps<CalendarInvoiceEvent>) => {
    const isOverdue = event.status === 'overdue';
    const sentReminder = event.reminderSent;

    return (
        <div className="flex items-center gap-1.5 px-1 py-0.5 text-[11px] font-semibold leading-tight truncate relative" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {isOverdue && !sentReminder && (
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
                </span>
            )}
            {sentReminder && <SendIcon className="w-2.5 h-2.5 shrink-0 opacity-70" />}
            <span className={`truncate ${sentReminder ? 'opacity-60' : ''}`}>
                {event.invoiceNumber} · ₹{event.total?.toLocaleString('en-IN') ?? '0'}
            </span>
        </div>
    );
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function LiquidityCalendar() {
    const { invoices, stats: backendStats, loading, refreshData } = useData();

    // Modal state
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Ephemeral sent tracker
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());

    // Search + filters
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [showSettings, setShowSettings] = useState(false);

    // Settings
    const [settings, setSettings] = useState({
        showDraftEvents: true,
        highlightOverdue: true,
        compactEvents: false,
        weekStartsMonday: true,
    });

    // ── Data Refresh ──────────────────────────────────────────────────────────
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // ── Stats ────────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const arr = Array.isArray(invoices) ? invoices : [];
        const overdue = arr.filter(i => i.status === 'overdue' || i.status === 'escalated');
        const pending = arr.filter(i => i.status === 'pending' || i.status === 'sent' || i.status === 'viewed');
        const paid = arr.filter(i => i.status === 'paid');

        return {
            totalEvents: arr.length,
            // Use backend stats for totals if available, otherwise fallback to local calculation
            overdueCount: backendStats.overdue_invoices || overdue.length,
            overdueAmount: backendStats.overdue_revenue || overdue.reduce((s, i) => s + i.total, 0),
            pendingCount: backendStats.pending_invoices || pending.length,
            pendingAmount: backendStats.pending_payments || pending.reduce((s, i) => s + i.total, 0),
            paidAmount: backendStats.total_revenue || paid.reduce((s, i) => s + i.total, 0),
        };
    }, [invoices, backendStats]);

    // ── Filtered events ──────────────────────────────────────────────────────
    const events: CalendarInvoiceEvent[] = useMemo(() => {
        return invoices
            .filter(inv => {
                // Hide drafts if setting is off
                if (!settings.showDraftEvents && inv.status === 'draft') return false;
                // Status filter
                if (activeFilters.length > 0 && !activeFilters.includes(inv.status)) return false;
                // Search
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const matchesNumber = inv.invoiceNumber?.toLowerCase().includes(q);
                    const matchesCustomer = inv.buyer?.name?.toLowerCase().includes(q);
                    const matchesAmount = inv.total?.toString().includes(q);
                    if (!matchesNumber && !matchesCustomer && !matchesAmount) return false;
                }
                return true;
            })
            .map(inv => {
                const dueDate = new Date(inv.dueDate);
                return {
                    id: inv.id,
                    title: `${inv.invoiceNumber} · ₹${inv.total?.toLocaleString('en-IN') ?? '0'}`,
                    start: dueDate,
                    end: dueDate,
                    allDay: true,
                    invoiceNumber: inv.invoiceNumber,
                    total: inv.total,
                    type: 'income' as const,
                    status: inv.status,
                    customerName: inv.buyer?.name ?? 'Unknown',
                    reminderSent: sentIds.has(inv.id),
                };
            });
    }, [invoices, sentIds, searchQuery, activeFilters, settings.showDraftEvents]);

    // ── Event click ──────────────────────────────────────────────────────────
    const handleSelectEvent = useCallback((event: CalendarInvoiceEvent) => {
        if (event.type === 'income' && event.status === 'overdue') {
            setSelectedInvoiceId(event.id);
            setModalOpen(true);
        } else {
            console.log('[LiquidityCalendar] Selected event:', {
                id: event.id,
                invoice: event.invoiceNumber,
                status: event.status,
                customer: event.customerName,
                total: event.total,
            });
        }
    }, []);

    // ── Reminder sent ────────────────────────────────────────────────────────
    const handleReminderSent = useCallback(() => {
        if (selectedInvoiceId) {
            setSentIds(prev => new Set(prev).add(selectedInvoiceId));
        }
    }, [selectedInvoiceId]);

    // ── Event style getter ───────────────────────────────────────────────────
    const eventStyleGetter = useCallback((event: CalendarInvoiceEvent) => {
        const colors = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.draft;
        return {
            style: {
                backgroundColor: colors.bg,
                borderLeft: `3px solid ${colors.border}`,
                color: colors.text,
                borderRadius: '6px',
                fontSize: '11px',
                padding: settings.compactEvents ? '1px 4px' : '2px 6px',
                cursor: event.status === 'overdue' ? 'pointer' : 'default',
                opacity: event.reminderSent ? 0.5 : 1,
                transition: 'all 0.2s ease',
                boxShadow: event.status === 'overdue' && settings.highlightOverdue ? '0 0 8px rgba(220, 38, 38, 0.3)' : '0 1px 2px rgba(0,0,0,0.08)',
            },
        };
    }, [settings.compactEvents, settings.highlightOverdue]);

    // ── Toggle filter ────────────────────────────────────────────────────────
    const toggleFilter = (status: string) => {
        setActiveFilters(prev =>
            prev.includes(status) ? prev.filter(f => f !== status) : [...prev, status]
        );
    };

    // ── Loading state ────────────────────────────────────────────────────────
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
                    <h3 className="text-sm font-semibold tracking-widest text-teal-800 uppercase">Loading Calendar</h3>
                    <div className="flex justify-center gap-1">
                        <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full overflow-y-auto">
            {/* Background */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#e6fffa_0%,_#f0fdfa_45%,_#f5fffe_100%)]" />
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-teal-200/40 blur-3xl -z-10" />
            <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-teal-200/30 blur-[110px] -z-10" />

            <div className="p-6 lg:p-10">
                {/* ─── Header ───────────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
                >
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
                            <CalendarDays size={14} />
                            Liquidity Intelligence
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                        </div>
                        <h1 className="mt-2 text-3xl font-semibold text-gray-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                            Liquidity Calendar
                        </h1>
                        <p className="text-gray-500 mt-1.5 max-w-xl text-sm">
                            Visualize invoice timelines and engage AI Collections on overdue events.
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
                    </div>
                </motion.div>

                {/* ─── Stat Cards ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {[
                        {
                            label: 'Total Events',
                            value: stats.totalEvents,
                            sub: `${events.length} visible on calendar`,
                            icon: FileText,
                            gradient: 'from-teal-500 to-cyan-500',
                            glow: 'shadow-teal-500/25',
                            accent: 'text-teal-600',
                            bg: 'from-teal-50/60 via-white to-cyan-50/40',
                            borderColor: 'border-teal-200/60',
                            ring: 'bg-teal-500',
                            delay: 0,
                        },
                        {
                            label: 'Overdue',
                            value: stats.overdueCount,
                            sub: `₹${(stats.overdueAmount / 1000).toFixed(1)}k at risk`,
                            icon: AlertTriangle,
                            gradient: 'from-red-500 to-rose-500',
                            glow: 'shadow-red-500/25',
                            accent: 'text-red-600',
                            bg: 'from-red-50/60 via-white to-rose-50/40',
                            borderColor: 'border-red-200/60',
                            ring: 'bg-red-500',
                            pulse: true,
                            delay: 0.05,
                        },
                        {
                            label: 'Pending',
                            value: stats.pendingCount,
                            sub: `₹${(stats.pendingAmount / 1000).toFixed(1)}k awaiting`,
                            icon: Clock,
                            gradient: 'from-amber-500 to-orange-500',
                            glow: 'shadow-amber-500/25',
                            accent: 'text-amber-600',
                            bg: 'from-amber-50/60 via-white to-orange-50/40',
                            borderColor: 'border-amber-200/60',
                            ring: 'bg-amber-500',
                            delay: 0.1,
                        },
                        {
                            label: 'Cash Collected',
                            value: `₹${(stats.paidAmount / 1000).toFixed(1)}k`,
                            sub: null,
                            icon: TrendingUp,
                            gradient: 'from-emerald-500 to-teal-500',
                            glow: 'shadow-emerald-500/25',
                            accent: 'text-emerald-600',
                            bg: 'from-emerald-50/60 via-white to-teal-50/40',
                            borderColor: 'border-emerald-200/60',
                            ring: 'bg-emerald-500',
                            badge: 'Collected',
                            delay: 0.15,
                        },
                    ].map((card) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 18, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.45, delay: 0.05 + card.delay, ease: [0.23, 1, 0.32, 1] }}
                            className={`relative bg-gradient-to-br ${card.bg} backdrop-blur-xl p-5 rounded-2xl border ${card.borderColor} shadow-sm hover:shadow-lg ${card.glow} hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group overflow-hidden cursor-default`}
                        >
                            {/* Decorative glow orbs */}
                            <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-[0.07] rounded-full blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500`} />
                            <div className={`absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-tr ${card.gradient} opacity-[0.05] rounded-full blur-2xl`} />

                            {/* Shimmer line */}
                            <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />

                            <div className="relative">
                                {/* Top row: icon + badge/pulse */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2.5 bg-gradient-to-br ${card.gradient} text-white rounded-xl shadow-lg ${card.glow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                        <card.icon size={18} strokeWidth={2.2} />
                                    </div>
                                    {card.pulse && card.value > 0 && (
                                        <span className="relative flex h-3 w-3">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${card.ring} opacity-50`} />
                                            <span className={`relative inline-flex rounded-full h-3 w-3 ${card.ring} shadow-lg ${card.glow}`} />
                                        </span>
                                    )}
                                    {card.badge && (
                                        <div className={`flex items-center text-[10px] font-bold ${card.accent} bg-white/80 backdrop-blur px-2.5 py-1 rounded-lg border ${card.borderColor} shadow-sm`}>
                                            <CheckCircle2 size={11} className="mr-1" /> {card.badge}
                                        </div>
                                    )}
                                </div>

                                {/* Label */}
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-1">{card.label}</p>

                                {/* Value */}
                                <h3 className="text-[28px] font-extrabold text-gray-900 tracking-tight leading-none" style={{ fontFamily: 'Sora, sans-serif' }}>
                                    {card.value}
                                </h3>

                                {/* Sub-text */}
                                {card.sub && (
                                    <p className={`text-xs ${card.accent} mt-2 font-semibold flex items-center gap-1.5`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${card.ring}`} />
                                        {card.sub}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ─── Settings Panel ───────────────────────────────────────────── */}
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
                                        <Settings2 size={15} className="text-teal-500" />
                                        Advanced Settings
                                    </h3>
                                    <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-400">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { key: 'showDraftEvents' as const, label: 'Show Draft Events', desc: 'Include drafts on calendar', icon: Eye },
                                        { key: 'highlightOverdue' as const, label: 'Highlight Overdue', desc: 'Red glow on overdue items', icon: AlertTriangle },
                                        { key: 'compactEvents' as const, label: 'Compact Events', desc: 'Reduce event card size', icon: Filter },
                                        { key: 'weekStartsMonday' as const, label: 'Week Starts Monday', desc: 'First day of the week', icon: CalendarDays },
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
                                                    <Icon size={13} className="text-gray-400 group-hover:text-teal-500 transition" />
                                                    {label}
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

                {/* ─── Search & Filters ─────────────────────────────────────────── */}
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
                                    placeholder="Search invoices, customers, amounts..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition"
                                    style={{ fontFamily: 'Manrope, sans-serif' }}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Status Filters */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                                    <Filter size={12} /> Filter
                                </span>
                                {VISIBLE_STATUSES.map(status => {
                                    const config = STATUS_CONFIG[status];
                                    const isActive = activeFilters.includes(status);
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => toggleFilter(status)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isActive
                                                ? 'bg-teal-50 border-teal-300 text-teal-700 shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                                            {config.label}
                                        </button>
                                    );
                                })}
                                {activeFilters.length > 0 && (
                                    <button
                                        onClick={() => setActiveFilters([])}
                                        className="text-xs text-teal-600 font-medium hover:underline ml-1"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Active search / filter summary */}
                        {(searchQuery || activeFilters.length > 0) && (
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                                <Bell size={12} className="text-teal-500" />
                                Showing <strong className="text-gray-700">{events.length}</strong> of {invoices.length} events
                                {searchQuery && <span className="ml-1">matching "<strong className="text-teal-600">{searchQuery}</strong>"</span>}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* ─── Legend ───────────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="flex flex-wrap gap-3 mb-5 px-1"
                >
                    {VISIBLE_STATUSES.map(status => {
                        const config = STATUS_CONFIG[status];
                        return (
                            <div key={status} className="flex items-center gap-1.5 text-xs">
                                <span className={`w-2.5 h-2.5 rounded-sm`} style={{ backgroundColor: config.bg }} />
                                <span className="text-gray-500 font-medium">{config.label}</span>
                            </div>
                        );
                    })}
                    <div className="flex items-center gap-1.5 text-xs ml-2 pl-2 border-l border-gray-200">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
                        </span>
                        <span className="text-gray-500 font-medium">Needs action</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <SendIcon className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-500 font-medium">Reminder sent</span>
                    </div>
                </motion.div>

                {/* ─── Calendar ─────────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-teal-100/60 shadow-sm p-4 md:p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />

                        <style>{`
              .rbc-calendar { font-family: 'Manrope', sans-serif; }
              .rbc-header { padding: 10px 4px; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 2px solid #ecfdf5; background: #f0fdf4; }
              .rbc-month-view { border: none; border-radius: 16px; overflow: hidden; }
              .rbc-month-row { border-color: #ecfdf5; }
              .rbc-day-bg { border-color: #ecfdf5; }
              .rbc-today { background-color: #ecfdf5 !important; }
              .rbc-off-range-bg { background-color: #fafafa; }
              .rbc-date-cell { padding: 4px 8px; font-size: 13px; font-weight: 600; color: #374151; font-family: 'Sora', sans-serif; }
              .rbc-date-cell.rbc-now { font-weight: 700; color: #0d9488; }
              .rbc-event { border: none !important; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin: 1px 4px; }
              .rbc-event:hover { filter: brightness(1.08); transform: scale(1.02); transition: all 0.15s ease; }
              .rbc-event-content { overflow: hidden; }
              .rbc-toolbar { padding: 0 0 16px 0; gap: 8px; flex-wrap: wrap; }
              .rbc-toolbar button { border-radius: 10px; border: 1px solid #ccfbf1; padding: 7px 16px; font-size: 13px; font-weight: 600; color: #374151; transition: all 0.15s; background: white; font-family: 'Manrope', sans-serif; }
              .rbc-toolbar button:hover { background: #ecfdf5; border-color: #a7f3d0; }
              .rbc-toolbar button.rbc-active { background: #0d9488; color: white; border-color: #0d9488; box-shadow: 0 2px 8px rgba(13, 148, 136, 0.25); }
              .rbc-toolbar-label { font-size: 18px; font-weight: 700; color: #111827; font-family: 'Sora', sans-serif; }
              .rbc-show-more { color: #0d9488; font-size: 11px; font-weight: 700; font-family: 'Manrope', sans-serif; }
            `}</style>

                        <Calendar<CalendarInvoiceEvent>
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: 620 }}
                            views={['month', 'week']}
                            defaultView="month"
                            onSelectEvent={handleSelectEvent}
                            eventPropGetter={eventStyleGetter}
                            components={{ event: CalendarEvent }}
                            popup
                            selectable={false}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Collections Modal */}
            {selectedInvoiceId && (
                <CollectionsActionModal
                    invoiceId={selectedInvoiceId}
                    isOpen={modalOpen}
                    onClose={() => { setModalOpen(false); setSelectedInvoiceId(null); }}
                    onSent={handleReminderSent}
                />
            )}
        </div>
    );
}
