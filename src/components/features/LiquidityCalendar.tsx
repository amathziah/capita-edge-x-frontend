import { useState, useMemo, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    Filter, 
    Download,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    Search,
    LayoutGrid,
    Target,
    Settings
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth, isSameDay, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../contexts/DataContext';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse: (str: string) => new Date(str),
    startOfWeek,
    getDay: (date: Date) => date.getDay(),
    locales,
});

export function LiquidityCalendar() {
    const { invoices, loading, refreshData } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<any>(Views.MONTH);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

    // ── Data Refresh ──────────────────────────────────────────────────────────
    useEffect(() => {
        refreshData(['invoices']);
    }, [refreshData]);

    // ── Stats ────────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const monthInvoices = invoices.filter(inv => isSameMonth(new Date(inv.date || Date.now()), currentDate));
        const projected = monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const collected = monthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
        const pending = monthInvoices.filter(inv => inv.status === 'sent' || inv.status === 'viewed' || inv.status === 'partially_paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
        const overdue = monthInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total || 0), 0);

        return { projected, collected, pending, overdue };
    }, [invoices, currentDate]);

    // ── Events ───────────────────────────────────────────────────────────────
    const events = useMemo(() => {
        return invoices
            .filter(inv => {
                const buyerName = inv.buyer?.name || '';
                const matchesSearch = buyerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                     inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = filterStatus === 'all' || 
                                    (filterStatus === 'pending' ? (inv.status === 'sent' || inv.status === 'viewed' || inv.status === 'partially_paid') : inv.status === filterStatus);
                return matchesSearch && matchesStatus;
            })
            .map(inv => ({
                id: inv.id,
                title: `${inv.buyer?.name || 'Unknown'} - ₹${inv.total?.toLocaleString()}`,
                start: new Date(inv.date || Date.now()),
                end: new Date(inv.date || Date.now()),
                resource: inv,
                allDay: true
            }));
    }, [invoices, searchTerm, filterStatus]);

    const eventStyleGetter = (event: any) => {
        const status = event.resource.status;
        let backgroundColor = '#f3f4f6';
        let borderColor = '#e5e7eb';
        let color = '#374151';

        if (status === 'paid') {
            backgroundColor = '#ecfdf5';
            borderColor = '#10b981';
            color = '#065f46';
        } else if (status === 'sent' || status === 'viewed' || status === 'partially_paid') {
            backgroundColor = '#fffbeb';
            borderColor = '#f59e0b';
            color = '#92400e';
        } else if (status === 'overdue') {
            backgroundColor = '#fef2f2';
            borderColor = '#ef4444';
            color = '#991b1b';
        }

        return {
            style: {
                backgroundColor,
                borderColor,
                color,
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '600',
                padding: '2px 6px',
                borderLeft: `3px solid ${borderColor}`
            }
        };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-1">
                        <CalendarIcon size={14} />
                        Liquidity Planner
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cash Flow Calendar</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                        <Download size={16} /> Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-slate-900/10">
                        <Plus size={16} /> Add Forecast
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Projected</p>
                    <h3 className="text-xl font-black text-slate-900">₹{stats.projected.toLocaleString()}</h3>
                    <div className="flex items-center gap-1 mt-1 text-emerald-500 font-bold text-xs">
                        <ArrowUpRight size={12} /> Total Invoiced
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Collected</p>
                    <h3 className="text-xl font-black text-slate-900">₹{stats.collected.toLocaleString()}</h3>
                    <div className="flex items-center gap-1 mt-1 text-emerald-500 font-bold text-xs">
                        <CheckCircle2 size={12} /> Paid Invoices
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Upcoming</p>
                    <h3 className="text-xl font-black text-slate-900">₹{stats.pending.toLocaleString()}</h3>
                    <div className="flex items-center gap-1 mt-1 text-amber-500 font-bold text-xs">
                        <Clock size={12} /> Pending Payments
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Overdue</p>
                    <h3 className="text-xl font-black text-slate-900">₹{stats.overdue.toLocaleString()}</h3>
                    <div className="flex items-center gap-1 mt-1 text-rose-500 font-bold text-xs">
                        <AlertCircle size={12} /> Needs Action
                    </div>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                        <ChevronLeft size={20} className="text-slate-400" />
                    </button>
                    <h2 className="text-lg font-black text-slate-900 min-w-[150px] text-center">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                        <ChevronRight size={20} className="text-slate-400" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="ml-2 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-all">
                        Today
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search invoices..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-primary/30 w-full md:w-64 transition-all"
                        />
                    </div>
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                        {(['paid', 'pending', 'overdue'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                                    filterStatus === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Big Calendar */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-soft h-[700px]">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    date={currentDate}
                    onNavigate={date => setCurrentDate(date)}
                    view={view}
                    onView={v => setView(v)}
                    eventPropGetter={eventStyleGetter}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    toolbar={false}
                    className="custom-calendar"
                    onSelectEvent={event => setSelectedEvent(event)}
                />
            </div>

            {/* Event Details Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEvent(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    selectedEvent.resource.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                    selectedEvent.resource.status === 'overdue' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                    {selectedEvent.resource.status}
                                </span>
                                <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Customer</p>
                                    <h3 className="text-xl font-black text-slate-900">{selectedEvent.resource.customerName}</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Invoice Amount</p>
                                        <p className="text-lg font-bold text-slate-900">₹{selectedEvent.resource.total?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Due Date</p>
                                        <p className="text-lg font-bold text-slate-900">{format(new Date(selectedEvent.resource.date), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-50">
                                    <button className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2">
                                        View Full Invoice <ArrowUpRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-calendar .rbc-month-view { border: none; }
                .custom-calendar .rbc-header { padding: 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; border: none; }
                .custom-calendar .rbc-day-bg { border: 1px solid #f8fafc; }
                .custom-calendar .rbc-off-range-bg { background-color: #fafafa; }
                .custom-calendar .rbc-today { background-color: #f1f5f9; }
                .custom-calendar .rbc-date-cell { padding: 12px; font-size: 13px; font-weight: 700; color: #64748b; }
                .custom-calendar .rbc-event { border: none !important; margin-bottom: 2px; }
                .custom-calendar .rbc-show-more { font-size: 10px; font-weight: 800; color: #14b8a6; background: transparent; }
            `}} />
        </div>
    );
}

function X({ size, className }: { size: number, className: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    );
}
