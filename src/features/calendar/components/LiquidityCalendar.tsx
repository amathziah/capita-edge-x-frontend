import { useState, useMemo, useEffect, useCallback } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    X,
    TrendingUp,
    Sparkles,
    LayoutGrid,
    List,
    Receipt,
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    isSameMonth,
    isSameDay,
    addDays,
    startOfWeek,
    endOfWeek,
    isToday,
    eachDayOfInterval,
} from 'date-fns';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/app/providers/DataContext';
import RecordPaymentModal from '@/features/invoices/components/RecordPaymentModal';
import { Invoice } from '@/types';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type FilterStatus = 'all' | 'paid' | 'pending' | 'due_today' | 'overdue' | 'expenses';
type ViewMode = 'month' | 'list';
type NormalizedCalendarStatus = 'paid' | 'pending' | 'due_today' | 'overdue' | 'draft' | 'closed' | 'expense';
type EventType = 'inflow' | 'outflow';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    amount: number;
    status: 'paid' | 'sent' | 'partially_paid' | 'overdue' | 'draft' | 'void' | 'write_off' | 'expense';
    customerName: string;
    invoiceNumber: string;
    type: EventType;
    category?: string;
    raw: any;
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getBalanceDue(invoice: any) {
    const explicitBalance = invoice.balance_due ?? invoice.balanceDue;
    if (explicitBalance !== undefined && explicitBalance !== null) return Number(explicitBalance) || 0;
    const totalAmount = Number(invoice.netReceivable ?? invoice.net_receivable ?? invoice.total ?? 0);
    const amountPaid = Number(invoice.amountPaid ?? invoice.amount_paid ?? 0);
    return Math.max(totalAmount - amountPaid, 0);
}

function normaliseStatus(status: string, dueDate?: string, balanceDue?: number): NormalizedCalendarStatus {
    const s = (status || '').toLowerCase().trim();
    if (s === 'expense') return 'expense';
    if (s === 'draft') return 'draft';
    if (s === 'void' || s === 'write_off' || s === 'cancelled') return 'closed';
    if (s === 'paid') return 'paid';
    if (balanceDue !== undefined && Number(balanceDue) <= 0) return 'paid';
    if (s === 'overdue') return 'overdue';
    if (dueDate && ['sent', 'partially_paid', 'pending', 'viewed'].includes(s)) {
        const dueStr = new Date(dueDate).toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        if (dueStr === todayStr) return 'due_today';
    }
    if (['sent', 'partially_paid', 'pending', 'viewed'].includes(s)) return 'pending';
    return 'draft';
}

const STATUS_CONFIG: Record<string, {
    label: string;
    pill: string;
    dot: string;
    bar: string;
    card: string;
    badge: string;
    icon: any;
    iconColor: string;
}> = {
    paid: {
        label: 'Paid',
        pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        dot: 'bg-emerald-500',
        bar: 'bg-emerald-500',
        card: 'border-l-emerald-400',
        badge: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
        icon: CheckCircle2,
        iconColor: 'text-emerald-500',
    },
    pending: {
        label: 'Pending',
        pill: 'bg-amber-50 text-amber-700 border border-amber-200',
        dot: 'bg-amber-400',
        bar: 'bg-amber-400',
        card: 'border-l-amber-400',
        badge: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
        icon: Clock,
        iconColor: 'text-amber-500',
    },
    due_today: {
        label: 'Due Today',
        pill: 'bg-sky-50 text-sky-700 border border-sky-200',
        dot: 'bg-sky-500',
        bar: 'bg-sky-500',
        card: 'border-l-sky-400',
        badge: 'bg-sky-50 text-sky-600 ring-1 ring-sky-200',
        icon: AlertCircle,
        iconColor: 'text-sky-500',
    },
    overdue: {
        label: 'Overdue',
        pill: 'bg-rose-50 text-rose-700 border border-rose-200',
        dot: 'bg-rose-500',
        bar: 'bg-rose-500',
        card: 'border-l-rose-400',
        badge: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
        icon: AlertCircle,
        iconColor: 'text-rose-500',
    },
    draft: {
        label: 'Draft',
        pill: 'bg-slate-100 text-slate-500 border border-slate-200',
        dot: 'bg-slate-400',
        bar: 'bg-slate-300',
        card: 'border-l-slate-300',
        badge: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
        icon: TrendingUp,
        iconColor: 'text-slate-400',
    },
    expense: {
        label: 'Expense',
        pill: 'bg-violet-50 text-violet-700 border border-violet-200',
        dot: 'bg-violet-500',
        bar: 'bg-violet-500',
        card: 'border-l-violet-400',
        badge: 'bg-violet-50 text-violet-600 ring-1 ring-violet-200',
        icon: Receipt,
        iconColor: 'text-violet-500',
    },
};

function fmt(n: number) {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 10_00_000) return `${sign}₹${(abs / 10_00_000).toFixed(1)}L`;
    if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(0)}K`;
    return `${sign}₹${abs.toLocaleString('en-IN')}`;
}

function fmtFull(n: number) {
    if (n < 0) return `-₹${Math.abs(n).toLocaleString('en-IN')}`;
    return `₹${n.toLocaleString('en-IN')}`;
}

/* ─────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────── */
function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    iconClass,
}: {
    label: string;
    value: string;
    sub: string;
    icon: any;
    iconClass: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-slate-50 ${iconClass}`}>
                    <Icon size={14} />
                </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-0.5">{value}</h3>
            <p className="text-[11px] text-slate-400">{sub}</p>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Event Pill (inside calendar cell)
───────────────────────────────────────────── */
function EventPill({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
    const s = event.type === 'outflow'
        ? 'expense'
        : normaliseStatus(event.status, event.raw?.dueDate, getBalanceDue(event.raw));
    const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.draft;
    const borderColor =
        s === 'paid' ? '#34d399' :
        s === 'overdue' ? '#f87171' :
        s === 'due_today' ? '#0ea5e9' :
        s === 'pending' ? '#fbbf24' :
        s === 'expense' ? '#8b5cf6' :
        '#94a3b8';

    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`w-full text-left flex items-center gap-1 px-1.5 py-[3px] rounded-md text-[10px] font-semibold truncate border-l-2 ${cfg.pill} hover:brightness-95 transition-all duration-150`}
            style={{ borderLeftColor: borderColor }}
        >
            {event.type === 'outflow' ? (
                <ArrowDownLeft size={8} className="shrink-0 text-violet-500" />
            ) : (
                <span className={`shrink-0 w-[5px] h-[5px] rounded-full ${cfg.dot}`} />
            )}
            <span className="truncate">{event.customerName.split(' ')[0]}</span>
            <span className="ml-auto shrink-0 font-bold opacity-70">
                {event.type === 'outflow' ? '-' : ''}{fmt(event.amount)}
            </span>
        </button>
    );
}

/* ─────────────────────────────────────────────
   Day Cell
───────────────────────────────────────────── */
function DayCell({
    date,
    isCurrentMonth,
    events,
    onEventClick,
}: {
    date: Date;
    isCurrentMonth: boolean;
    events: CalendarEvent[];
    onEventClick: (e: CalendarEvent) => void;
}) {
    const today = isToday(date);
    const MAX = 3;
    const visible = events.slice(0, MAX);
    const overflow = events.length - MAX;

    const inflow = events.filter(e => e.type === 'inflow').reduce((s, e) => s + e.amount, 0);
    const outflow = events.filter(e => e.type === 'outflow').reduce((s, e) => s + e.amount, 0);
    const net = inflow - outflow;
    const hasActivity = events.length > 0 && isCurrentMonth;

    return (
        <div
            className={`
                min-h-[80px] sm:min-h-[112px] p-1 sm:p-2 border-b border-r border-slate-50 flex flex-col gap-0.5
                ${!isCurrentMonth ? 'bg-slate-50/40' : 'bg-white hover:bg-slate-50/50'}
                transition-colors duration-150
            `}
        >
            <div className="flex items-center justify-between mb-0.5">
                <span
                    className={`
                        text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all
                        ${today
                            ? 'bg-primary text-white shadow-md shadow-primary/30'
                            : isCurrentMonth
                                ? 'text-slate-600'
                                : 'text-slate-300'
                        }
                    `}
                >
                    {format(date, 'd')}
                </span>
                {hasActivity && (
                    <span className={`text-[10px] font-medium ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {fmt(net)}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-[2px]">
                {visible.map((ev) => (
                    <EventPill key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
                ))}
                {overflow > 0 && (
                    <button className="text-[9px] font-black text-primary/70 hover:text-primary text-left px-2 py-[2px] hover:bg-primary/5 rounded transition-colors">
                        +{overflow} more
                    </button>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   List View Row
───────────────────────────────────────────── */
function ListRow({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
    const s = event.type === 'outflow'
        ? 'expense'
        : normaliseStatus(event.status, event.raw?.dueDate, getBalanceDue(event.raw));
    const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.draft;
    const Icon = cfg.icon;

    return (
        <motion.button
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            onClick={onClick}
            className={`w-full text-left flex items-center gap-4 px-4 py-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors group border-l-3 ${cfg.card}`}
        >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 shrink-0 ${cfg.iconColor}`}>
                <Icon size={17} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800 truncate">{event.customerName}</p>
                    {event.type === 'outflow' && (
                        <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded shrink-0">Expense</span>
                    )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                    {event.type === 'outflow' ? (event.category || 'Expense') : event.invoiceNumber} &middot; {format(event.date, 'dd MMM yyyy')}
                </p>
            </div>
            <div className="text-right shrink-0">
                <p className={`text-sm font-black ${event.type === 'outflow' ? 'text-rose-600' : 'text-slate-900'}`}>
                    {event.type === 'outflow' ? '-' : ''}{fmtFull(event.amount)}
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
            </div>
            <ArrowUpRight size={15} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
        </motion.button>
    );
}

/* ─────────────────────────────────────────────
   Event Detail Modal
───────────────────────────────────────────── */
function EventModal({ event, onClose, onMarkPaid, onViewInvoice, onViewExpense }: {
    event: CalendarEvent;
    onClose: () => void;
    onMarkPaid: () => void;
    onViewInvoice: () => void;
    onViewExpense: () => void;
}) {
    const isExpense = event.type === 'outflow';
    const s = isExpense ? 'expense' : normaliseStatus(event.status, event.raw?.dueDate, getBalanceDue(event.raw));
    const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.draft;
    const Icon = cfg.icon;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4"
            onClick={onClose}
        >
            {/* backdrop */}
            <div className="absolute inset-0 bg-[#0f172a]/30 backdrop-blur-sm" />

            <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
            >
                {/* colored top strip */}
                <div className={`h-1 w-full ${cfg.bar}`} />

                <div className="p-6">
                    {/* header */}
                    <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-50 ${cfg.iconColor}`}>
                                <Icon size={20} />
                            </div>
                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${cfg.badge}`}>
                                {cfg.label}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* customer / vendor */}
                    <h2 className="text-xl font-bold text-slate-900 mb-1">{event.customerName}</h2>
                    <p className="text-xs font-mono text-slate-400 mb-6">
                        {isExpense ? (event.category || 'Expense') : event.invoiceNumber}
                    </p>

                    {/* fields */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {(isExpense ? [
                            { label: 'Amount', value: fmtFull(event.amount), highlight: true },
                            { label: 'Date', value: format(event.date, 'dd MMM yyyy'), highlight: false },
                            { label: 'Category', value: event.category || '—', highlight: false },
                            { label: 'Type', value: 'Outflow', highlight: false },
                        ] : [
                            { label: 'Amount', value: fmtFull(event.amount), highlight: true },
                            { label: 'Due Date', value: format(event.date, 'dd MMM yyyy'), highlight: false },
                            { label: 'Status', value: cfg.label, highlight: false },
                            { label: 'Invoice', value: event.invoiceNumber, highlight: false },
                        ]).map(({ label, value, highlight }) => (
                            <div key={label} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                                <p className="text-[11px] font-medium text-slate-400 mb-1">{label}</p>
                                <p className={`text-sm font-semibold truncate ${highlight ? 'text-primary' : 'text-slate-800'}`}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* actions */}
                    <div className="flex gap-2">
                        {isExpense ? (
                            <button
                                onClick={onViewExpense}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
                            >
                                View Expenses <ArrowUpRight size={14} />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={onViewInvoice}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors">
                                    View Invoice <ArrowUpRight size={14} />
                                </button>
                                {s !== 'paid' && (
                                    <button
                                        onClick={onMarkPaid}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors">
                                        Mark Paid <CheckCircle2 size={14} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>, document.body
    );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export function LiquidityCalendar() {
    const navigate = useNavigate();
    const { invoices, payments, expenses, refreshData } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [showPaymentModalFor, setShowPaymentModalFor] = useState<Invoice | null>(null);

    useEffect(() => {
        refreshData(['invoices', 'payments', 'expenses']);
    }, [refreshData]);

    /* ── Build events ── */
    const allEvents: CalendarEvent[] = useMemo(() => {
        // Invoice events (inflows)
        const invoiceEvents = invoices.map((inv: any) => {
            let eventDate = new Date(inv.dueDate || inv.date || Date.now());
            const balanceDue = getBalanceDue(inv);
            const normalizedStatus = normaliseStatus(inv.status, inv.dueDate, balanceDue);
            if (normalizedStatus === 'closed') return null;

            // If paid, show on the actual payment date
            if (normalizedStatus === 'paid') {
                const invPayments = (payments || []).filter((p: any) => p.invoiceId === inv.id && p.status === 'completed');
                if (invPayments.length > 0) {
                    const latest = [...invPayments].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    eventDate = new Date(latest.date);
                }
            }

            return {
                id: inv.id,
                title: inv.buyer?.name || 'Unknown',
                date: eventDate,
                amount: normalizedStatus === 'paid' ? Number(inv.total || 0) : balanceDue,
                status: inv.status,
                customerName: inv.buyer?.name || 'Unknown',
                invoiceNumber: inv.invoiceNumber || '—',
                type: 'inflow' as EventType,
                raw: inv,
            };
        }).filter(Boolean) as CalendarEvent[];

        // Expense events (outflows)
        const expenseEvents = (expenses || []).map((exp: any) => ({
            id: `exp-${exp.id}`,
            title: exp.description || 'Expense',
            date: new Date(exp.date || Date.now()),
            amount: Number(exp.amount || 0),
            status: 'expense' as const,
            customerName: exp.vendorName || exp.vendor_name || exp.description || 'Expense',
            invoiceNumber: exp.category || 'Expense',
            type: 'outflow' as EventType,
            category: exp.category,
            raw: exp,
        }));

        return [...invoiceEvents, ...expenseEvents];
    }, [invoices, payments, expenses]);

    const filteredEvents = useMemo(() => {
        return allEvents.filter((ev) => {
            const ns = ev.type === 'outflow'
                ? 'expense'
                : normaliseStatus(ev.status, ev.raw?.dueDate, getBalanceDue(ev.raw));
            const matchSearch =
                ev.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ev.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ev.category || '').toLowerCase().includes(searchTerm.toLowerCase());

            let matchFilter = true;
            if (filterStatus === 'expenses') {
                matchFilter = ev.type === 'outflow';
            } else if (filterStatus !== 'all') {
                if (ev.type === 'outflow') {
                    matchFilter = false;
                } else {
                    matchFilter = filterStatus === 'pending'
                        ? ns === 'pending' || ns === 'due_today'
                        : ns === filterStatus;
                }
            }

            return matchSearch && matchFilter;
        });
    }, [allEvents, searchTerm, filterStatus]);

    /* ── Stats ── */
    const stats = useMemo(() => {
        const monthEvs = allEvents.filter((e) => isSameMonth(e.date, currentDate));
        const inflowEvs = monthEvs.filter(e => e.type === 'inflow');
        const outflowEvs = monthEvs.filter(e => e.type === 'outflow');

        const totalInflow = inflowEvs.reduce((s, e) => s + e.amount, 0);
        const totalOutflow = outflowEvs.reduce((s, e) => s + e.amount, 0);

        return {
            inflow: totalInflow,
            outflow: totalOutflow,
            net: totalInflow - totalOutflow,
            collected: inflowEvs.filter((e) => normaliseStatus(e.status, e.raw?.dueDate, getBalanceDue(e.raw)) === 'paid').reduce((s, e) => s + e.amount, 0),
            pending: inflowEvs.filter((e) => {
                const status = normaliseStatus(e.status, e.raw?.dueDate, getBalanceDue(e.raw));
                return status === 'pending' || status === 'due_today';
            }).reduce((s, e) => s + e.amount, 0),
            dueToday: inflowEvs.filter((e) => normaliseStatus(e.status, e.raw?.dueDate, getBalanceDue(e.raw)) === 'due_today').reduce((s, e) => s + e.amount, 0),
            overdue: inflowEvs.filter((e) => normaliseStatus(e.status, e.raw?.dueDate, getBalanceDue(e.raw)) === 'overdue').reduce((s, e) => s + e.amount, 0),
        };
    }, [allEvents, currentDate]);

    /* ── Calendar grid days ── */
    const calendarDays = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        const gridStart = startOfWeek(start);
        const gridEnd = endOfWeek(end);
        const days: Date[] = [];
        let d = gridStart;
        while (d <= gridEnd) {
            days.push(d);
            d = addDays(d, 1);
        }
        // pad to 42
        while (days.length < 42) days.push(addDays(days[days.length - 1], 1));
        return days;
    }, [currentDate]);

    const getEventsForDay = useCallback(
        (date: Date) => filteredEvents.filter((e) => isSameDay(e.date, date)),
        [filteredEvents]
    );

    /* ── List view events (current month) ── */
    const listEvents = useMemo(() =>
        filteredEvents
            .filter((e) => isSameMonth(e.date, currentDate))
            .sort((a, b) => a.date.getTime() - b.date.getTime()),
        [filteredEvents, currentDate]
    );

    const FILTER_OPTIONS: { key: FilterStatus; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'paid', label: 'Paid' },
        { key: 'pending', label: 'Pending' },
        { key: 'due_today', label: 'Due Today' },
        { key: 'overdue', label: 'Overdue' },
        { key: 'expenses', label: 'Expenses' },
    ];

    return (
        <div className="space-y-5 pb-8">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Cash Flow Calendar
                </h1>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    label="Collected"
                    value={fmtFull(stats.collected)}
                    sub={`${fmtFull(stats.inflow)} total invoiced`}
                    icon={CheckCircle2}
                    iconClass="text-emerald-500"
                />
                <StatCard
                    label="Expenses"
                    value={fmtFull(stats.outflow)}
                    sub="This month"
                    icon={Receipt}
                    iconClass="text-violet-500"
                />
                <StatCard
                    label="Pending"
                    value={fmtFull(stats.pending)}
                    sub={stats.dueToday > 0 ? `${fmtFull(stats.dueToday)} due today` : "Awaiting payment"}
                    icon={Clock}
                    iconClass="text-amber-500"
                />
                <StatCard
                    label="Overdue"
                    value={fmtFull(stats.overdue)}
                    sub="Needs follow-up"
                    icon={AlertCircle}
                    iconClass="text-rose-500"
                />
            </div>

            {/* ── Controls Bar ── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                {/* nav */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <h2 className="text-sm font-semibold text-slate-800 min-w-[140px] text-center">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <button
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="text-xs font-medium text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                </div>

                <div className="flex-1" />

                {/* search */}
                <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search invoices & expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 w-full sm:w-56 transition-all"
                    />
                </div>

                {/* filters */}
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 gap-0.5 overflow-x-auto">
                    {FILTER_OPTIONS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilterStatus(key)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                                filterStatus === key
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* view toggle */}
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 gap-0.5">
                    {([['month', LayoutGrid], ['list', List]] as const).map(([mode, Icon]) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`w-8 h-7 flex items-center justify-center rounded-lg transition-all ${
                                viewMode === mode
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Icon size={14} />
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Calendar / List ── */}
            <AnimatePresence mode="wait">
                {viewMode === 'month' ? (
                    <motion.div
                        key="month"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                    >
                        {/* weekday headers */}
                        <div className="grid grid-cols-7 border-b border-slate-100">
                            {WEEKDAYS.map((d) => (
                                <div key={d} className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* day cells */}
                        <div className="grid grid-cols-7">
                            {calendarDays.map((date, i) => (
                                <DayCell
                                    key={i}
                                    date={date}
                                    isCurrentMonth={isSameMonth(date, currentDate)}
                                    events={getEventsForDay(date)}
                                    onEventClick={setSelectedEvent}
                                />
                            ))}
                        </div>

                        {/* legend */}
                        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 px-4 sm:px-5 py-3 border-t border-slate-50">
                            {(['paid', 'pending', 'due_today', 'overdue', 'expense'] as const).map((s) => (
                                <div key={s} className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                                    <span className="text-[11px] text-slate-400">{STATUS_CONFIG[s].label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                        className="space-y-2"
                    >
                        {listEvents.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">
                                <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm font-bold">No transactions found</p>
                                <p className="text-xs mt-1">Try adjusting your filters</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {listEvents.map((ev) => (
                                    <ListRow key={ev.id} event={ev} onClick={() => setSelectedEvent(ev)} />
                                ))}
                            </AnimatePresence>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Event Modal ── */}
            <AnimatePresence>
                {selectedEvent && (
                    <EventModal
                        event={selectedEvent}
                        onClose={() => setSelectedEvent(null)}
                        onMarkPaid={() => setShowPaymentModalFor(selectedEvent.raw)}
                        onViewInvoice={() => navigate(`/dashboard/invoices?view=${selectedEvent.id}`)}
                        onViewExpense={() => navigate('/dashboard/expenses')}
                    />
                )}
            </AnimatePresence>

            {/* ── Record Payment Modal ── */}
            <AnimatePresence>
                {showPaymentModalFor && (
                    <RecordPaymentModal
                        invoice={showPaymentModalFor}
                        onClose={() => setShowPaymentModalFor(null)}
                        onSuccess={async () => {
                            setShowPaymentModalFor(null);
                            setSelectedEvent(null);
                            await refreshData(['invoices', 'payments'], true);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ── Calendar CSS overrides (keeps grid lines crisp) ── */}
            <style>{`
                .shadow-soft { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04); }
            `}</style>
        </div>
    );
}
