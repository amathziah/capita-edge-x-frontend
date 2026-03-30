import { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Download,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    Search,
    X,
    TrendingUp,
    Sparkles,
    LayoutGrid,
    List,
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
    getDaysInMonth,
    getDay,
    parseISO,
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../contexts/DataContext';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type FilterStatus = 'all' | 'paid' | 'pending' | 'overdue';
type ViewMode = 'month' | 'list';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    amount: number;
    status: 'paid' | 'sent' | 'viewed' | 'partially_paid' | 'overdue' | 'draft';
    customerName: string;
    invoiceNumber: string;
    raw: any;
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function normaliseStatus(status: string): 'paid' | 'pending' | 'overdue' | 'draft' {
    if (status === 'paid') return 'paid';
    if (status === 'overdue') return 'overdue';
    if (['sent', 'viewed', 'partially_paid'].includes(status)) return 'pending';
    return 'draft';
}

const STATUS_CONFIG = {
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
};

function fmt(n: number) {
    if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n.toLocaleString('en-IN')}`;
}

function fmtFull(n: number) {
    return `₹${n.toLocaleString('en-IN')}`;
}

/* ─────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────── */
function StatCard({
    label,
    value,
    sub,
    accent,
    icon: Icon,
    iconClass,
    delay = 0,
}: {
    label: string;
    value: string;
    sub: string;
    accent: string;
    icon: any;
    iconClass: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white rounded-2xl border border-slate-100 p-5 overflow-hidden group hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100/80 transition-all duration-300"
        >
            {/* top accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${accent} rounded-t-2xl`} />

            <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50 group-hover:scale-110 transition-transform duration-300 ${iconClass}`}>
                    <Icon size={15} />
                </div>
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{value}</h3>
            <p className="text-[11px] font-semibold text-slate-400">{sub}</p>

            {/* subtle shimmer on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/60 via-transparent to-transparent" />
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   Event Pill (inside calendar cell)
───────────────────────────────────────────── */
function EventPill({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
    const s = normaliseStatus(event.status);
    const cfg = STATUS_CONFIG[s];
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`w-full text-left flex items-center gap-1.5 px-2 py-[3px] rounded-md text-[10px] font-semibold truncate border-l-2 ${cfg.pill} hover:brightness-95 transition-all duration-150 group/pill`}
            style={{ borderLeftColor: s === 'paid' ? '#34d399' : s === 'overdue' ? '#f87171' : s === 'pending' ? '#fbbf24' : '#94a3b8' }}
        >
            <span className={`shrink-0 w-[5px] h-[5px] rounded-full ${cfg.dot}`} />
            <span className="truncate">{event.customerName.split(' ')[0]}</span>
            <span className="ml-auto shrink-0 font-bold opacity-70">{fmt(event.amount)}</span>
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

    const dayTotal = events.reduce((s, e) => s + e.amount, 0);

    return (
        <div
            className={`
                min-h-[108px] p-2 border-b border-r border-slate-50 flex flex-col gap-1
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
                {events.length > 0 && isCurrentMonth && (
                    <span className="text-[9px] font-black text-slate-300">{fmt(dayTotal)}</span>
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
    const s = normaliseStatus(event.status);
    const cfg = STATUS_CONFIG[s];
    const Icon = cfg.icon;
    return (
        <motion.button
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            onClick={onClick}
            className={`w-full text-left flex items-center gap-4 px-5 py-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 hover:shadow-md hover:shadow-slate-100 transition-all duration-200 group border-l-4 ${cfg.card}`}
        >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 shrink-0 ${cfg.iconColor}`}>
                <Icon size={17} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{event.customerName}</p>
                <p className="text-[11px] text-slate-400 font-mono">{event.invoiceNumber} · {format(event.date, 'dd MMM yyyy')}</p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm font-black text-slate-900">{fmtFull(event.amount)}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
            </div>
            <ArrowUpRight size={15} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
        </motion.button>
    );
}

/* ─────────────────────────────────────────────
   Event Detail Modal
───────────────────────────────────────────── */
function EventModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
    const s = normaliseStatus(event.status);
    const cfg = STATUS_CONFIG[s];
    const Icon = cfg.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
            onClick={onClose}
        >
            {/* backdrop */}
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />

            <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-900/15 overflow-hidden"
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
                            <div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cfg.badge}`}>
                                    {cfg.label}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* customer */}
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{event.customerName}</h2>
                    <p className="text-xs font-mono text-slate-400 mb-6">{event.invoiceNumber}</p>

                    {/* fields */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {[
                            { label: 'Amount', value: fmtFull(event.amount), highlight: true },
                            { label: 'Due Date', value: format(event.date, 'dd MMM yyyy'), highlight: false },
                            { label: 'Status', value: cfg.label, highlight: false },
                            { label: 'Invoice', value: event.invoiceNumber, highlight: false },
                        ].map(({ label, value, highlight }) => (
                            <div key={label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">{label}</p>
                                <p className={`text-base font-black truncate ${highlight ? 'text-primary' : 'text-slate-800'}`}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* actions */}
                    <div className="flex gap-2">
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-colors">
                            View Invoice <ArrowUpRight size={15} />
                        </button>
                        {s !== 'paid' && (
                            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-sm font-bold hover:bg-emerald-100 transition-colors">
                                Mark Paid <CheckCircle2 size={15} />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export function LiquidityCalendar() {
    const { invoices, loading, refreshData } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    useEffect(() => {
        refreshData(['invoices']);
    }, [refreshData]);

    /* ── Build events ── */
    const allEvents: CalendarEvent[] = useMemo(() =>
        invoices.map((inv: any) => ({
            id: inv.id,
            title: inv.buyer?.name || 'Unknown',
            date: new Date(inv.date || Date.now()),
            amount: inv.total || 0,
            status: inv.status,
            customerName: inv.buyer?.name || 'Unknown',
            invoiceNumber: inv.invoiceNumber || '—',
            raw: inv,
        })),
        [invoices]
    );

    const filteredEvents = useMemo(() => {
        return allEvents.filter((ev) => {
            const ns = normaliseStatus(ev.status);
            const matchSearch =
                ev.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ev.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
            const matchFilter =
                filterStatus === 'all' ||
                (filterStatus === 'pending' ? ns === 'pending' : ns === filterStatus);
            return matchSearch && matchFilter;
        });
    }, [allEvents, searchTerm, filterStatus]);

    /* ── Stats ── */
    const stats = useMemo(() => {
        const monthEvs = allEvents.filter((e) => isSameMonth(e.date, currentDate));
        return {
            projected: monthEvs.reduce((s, e) => s + e.amount, 0),
            collected: monthEvs.filter((e) => e.status === 'paid').reduce((s, e) => s + e.amount, 0),
            pending: monthEvs.filter((e) => ['sent', 'viewed', 'partially_paid'].includes(e.status)).reduce((s, e) => s + e.amount, 0),
            overdue: monthEvs.filter((e) => e.status === 'overdue').reduce((s, e) => s + e.amount, 0),
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
        { key: 'overdue', label: 'Overdue' },
    ];

    return (
        <div className="space-y-5 pb-8">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary mb-1.5">
                        <CalendarIcon size={12} />
                        Liquidity Planner
                    </div>
                    <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-tight">
                        Cash Flow Calendar
                    </h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                        <Download size={13} /> Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg shadow-slate-900/20">
                        <Plus size={13} /> Add Forecast
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    label="Projected"
                    value={fmtFull(stats.projected)}
                    sub="Total this month"
                    accent="bg-gradient-to-r from-violet-400 to-indigo-400"
                    icon={TrendingUp}
                    iconClass="text-violet-500"
                    delay={0}
                />
                <StatCard
                    label="Collected"
                    value={fmtFull(stats.collected)}
                    sub="Paid invoices"
                    accent="bg-gradient-to-r from-emerald-400 to-teal-400"
                    icon={CheckCircle2}
                    iconClass="text-emerald-500"
                    delay={0.06}
                />
                <StatCard
                    label="Upcoming"
                    value={fmtFull(stats.pending)}
                    sub="Awaiting payment"
                    accent="bg-gradient-to-r from-amber-400 to-orange-400"
                    icon={Clock}
                    iconClass="text-amber-500"
                    delay={0.12}
                />
                <StatCard
                    label="Overdue"
                    value={fmtFull(stats.overdue)}
                    sub="Needs action"
                    accent="bg-gradient-to-r from-rose-400 to-pink-400"
                    icon={AlertCircle}
                    iconClass="text-rose-500"
                    delay={0.18}
                />
            </div>

            {/* ── Controls Bar ── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
                {/* nav */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <h2 className="text-base font-black text-slate-900 min-w-[148px] text-center tracking-tight">
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
                        className="text-[11px] font-black text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all"
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
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 w-full sm:w-52 transition-all"
                    />
                </div>

                {/* filters */}
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 gap-0.5">
                    {FILTER_OPTIONS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilterStatus(key)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
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
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                        {/* weekday headers */}
                        <div className="grid grid-cols-7 border-b border-slate-100">
                            {WEEKDAYS.map((d) => (
                                <div key={d} className="py-3 text-center text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
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
                        <div className="flex items-center justify-end gap-5 px-5 py-3 border-t border-slate-50">
                            {(['paid', 'pending', 'overdue', 'draft'] as const).map((s) => (
                                <div key={s} className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                                    <span className="text-[10px] font-bold text-slate-400 capitalize">{STATUS_CONFIG[s].label}</span>
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
                                <p className="text-sm font-bold">No invoices found</p>
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
                    <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
                )}
            </AnimatePresence>

            {/* ── Calendar CSS overrides (keeps grid lines crisp) ── */}
            <style>{`
                .shadow-soft { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04); }
            `}</style>
        </div>
    );
}