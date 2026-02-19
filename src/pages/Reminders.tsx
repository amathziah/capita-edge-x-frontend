import { useEffect, useState, useMemo } from "react";
import {
  CheckCircle, XCircle, Bell, Plus, Clock, AlertCircle, Search, Zap,
  Calendar, TrendingUp, X, Settings2, Eye, LayoutGrid, List,
  SortAsc, SortDesc, Filter, Timer, AlarmClock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { dataService } from '../services/dataService';
import { Reminder } from '../types';

// ---------------------------------------------------------------------------
// Types & Helpers
// ---------------------------------------------------------------------------
type Priority = "High" | "Medium" | "Low";
type ViewMode = 'grid' | 'list';

const now = () => new Date();
const toISO = (d: Date) => d.toISOString();
const daysUntil = (iso: string) => {
  const target = new Date(iso);
  const diffMs = +target - +now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

function parseQuickInput(input: string): { task: string; date?: Date } {
  const text = input.trim();
  const lower = text.toLowerCase();
  let date: Date | undefined;
  if (lower.includes("tomorrow")) { const d = new Date(); d.setDate(d.getDate() + 1); date = d; }
  else if (lower.includes("today")) { date = new Date(); }
  else { const inDays = lower.match(/in\s+(\d+)\s+days?/); if (inDays) { const d = new Date(); d.setDate(d.getDate() + Number(inDays[1])); date = d; } }

  if (date) {
    const timeMatch = lower.match(/(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      let hrs = Number(timeMatch[1]);
      const mins = timeMatch[2] ? Number(timeMatch[2]) : 0;
      const ampm = timeMatch[3];
      if (ampm) { if (ampm === "pm" && hrs < 12) hrs += 12; if (ampm === "am" && hrs === 12) hrs = 0; }
      date.setHours(hrs, mins, 0, 0);
    } else { date.setHours(18, 0, 0, 0); }
  }
  return { task: text, date };
}

function suggestPriority(dueISO?: string | null, text?: string): Priority {
  const t = (text || "").toLowerCase();
  const urgentWords = ["urgent", "asap", "due", "submit", "expire", "renew", "deadline"];
  if (urgentWords.some(w => t.includes(w))) return "High";
  if (!dueISO) return "Medium";
  const days = daysUntil(dueISO);
  if (days <= 1) return "High";
  if (days <= 7) return "Medium";
  return "Low";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickText, setQuickText] = useState("");
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<"All" | Priority>("All");
  const [sortBy, setSortBy] = useState<"due" | "priority" | "created">("due");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Advanced settings
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    showDueDate: true,
    showPriorityBadge: true,
    showSnoozeButtons: true,
    compactCards: false,
  });

  // ── Fetch ──────────────────────────────────────────────────────────
  const transformReminders = (data: any[]) =>
    data.map((r: any) => ({
      ...r,
      dueDate: r.due_date || r.dueDate,
      snoozedUntil: r.snoozed_until || r.snoozedUntil,
      createdAt: r.created_at || r.createdAt,
      updatedAt: r.updated_at || r.updatedAt,
    }));

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await dataService.getReminders();
        setReminders(transformReminders(data));
      } catch (error) {
        console.error("Failed to fetch reminders", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Actions ────────────────────────────────────────────────────────
  const addReminderFromQuick = async () => {
    if (!quickText.trim()) return;
    const parsed = parseQuickInput(quickText);
    const due = parsed.date ?? now();
    const priority = suggestPriority(toISO(due), parsed.task);
    try {
      await dataService.saveReminder({ task: parsed.task, dueDate: toISO(due), priority, completed: false, snoozedUntil: null });
      const data = await dataService.getReminders();
      setReminders(transformReminders(data));
      setQuickText("");
    } catch (error) {
      console.error("Failed to create reminder", error);
      alert("Failed to create reminder. Please try again.");
    }
  };

  const toggleComplete = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    try {
      await dataService.saveReminder({ id, task: reminder.task, dueDate: reminder.dueDate, priority: reminder.priority, completed: !reminder.completed, snoozedUntil: null });
      setReminders(prev => prev.map(r => (r.id === id ? { ...r, completed: !r.completed, snoozedUntil: null } : r)));
    } catch (error) {
      console.error("Failed to update reminder", error);
    }
  };

  const removeReminder = async (id: string) => {
    try {
      await dataService.deleteReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Failed to delete reminder", error);
    }
  };

  const snooze = async (id: string, minutes: number) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    const d = new Date(reminder.snoozedUntil ?? reminder.dueDate);
    d.setMinutes(d.getMinutes() + minutes);
    const newSnoozedUntil = toISO(d);
    try {
      await dataService.saveReminder({ id, task: reminder.task, dueDate: reminder.dueDate, priority: reminder.priority, completed: reminder.completed, snoozedUntil: newSnoozedUntil });
      setReminders(prev => prev.map(r => (r.id === id ? { ...r, snoozedUntil: newSnoozedUntil } : r)));
    } catch (error) {
      console.error("Failed to snooze reminder", error);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reminders
      .filter(r => (filterPriority === "All" ? true : r.priority === filterPriority))
      .filter(r => (q ? r.task.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        if (sortBy === "due") return +new Date(a.snoozedUntil ?? a.dueDate) - +new Date(b.snoozedUntil ?? b.dueDate);
        if (sortBy === "created") return +new Date(b.createdAt) - +new Date(a.createdAt);
        const order: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
        return order[a.priority] - order[b.priority];
      });
  }, [reminders, search, filterPriority, sortBy]);

  const insights = useMemo(() => ({
    upcoming: reminders.filter(r => +new Date(r.snoozedUntil ?? r.dueDate) - +now() <= 1000 * 60 * 60 * 24 * 2 && !r.completed).length,
    overdue: reminders.filter(r => +new Date(r.snoozedUntil ?? r.dueDate) < +now() && !r.completed).length,
    completed: reminders.filter(r => r.completed).length,
  }), [reminders]);

  const priorityColors: Record<Priority, { bg: string; text: string; border: string }> = {
    High: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    Medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    Low: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  };

  // ── Loading ────────────────────────────────────────────────────────
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
          <h3 className="text-sm font-semibold tracking-widest text-teal-800 uppercase">Loading Reminders</h3>
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
        {/* ── Header ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              <Bell size={14} />
              Smart Reminders
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              Reminders
            </h1>
            <p className="text-gray-500 mt-1.5 max-w-xl text-sm">
              Smart reminders with quick-add and natural language parsing.
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
              onClick={() => setQuickText("Pay subscription tomorrow 9am")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-gray-300 transition"
            >
              <Zap size={16} className="text-teal-500" /> Example
            </button>
          </div>
        </motion.div>

        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8"
        >
          {[
            { label: 'Upcoming', value: insights.upcoming, sub: 'Due within 48h', icon: Calendar, badge: insights.upcoming > 0 ? 'Soon' : null },
            { label: 'Overdue', value: insights.overdue, sub: 'Requires attention', icon: AlertCircle, badge: insights.overdue > 0 ? 'Action needed' : null },
            { label: 'Completed', value: insights.completed, sub: 'Tasks done', icon: CheckCircle, badge: null },
          ].map(({ label, value, sub, icon: Icon, badge }, idx) => (
            <div key={idx} className="relative bg-gradient-to-br from-white to-teal-50/30 p-5 rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
              <div className="absolute -top-8 -right-8 w-20 h-20 bg-teal-100/40 rounded-full blur-2xl" />
              <div className="relative">
                {badge && (
                  <span className={`absolute top-0 right-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${label === 'Overdue' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
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

        {/* ── Advanced Settings ────────────────────────────────────── */}
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
                    { key: 'showDueDate' as const, label: 'Due Date', desc: 'Show due date info', icon: Clock },
                    { key: 'showPriorityBadge' as const, label: 'Priority Badge', desc: 'Show priority labels', icon: AlertCircle },
                    { key: 'showSnoozeButtons' as const, label: 'Snooze Controls', desc: 'Show snooze options', icon: AlarmClock },
                    { key: 'compactCards' as const, label: 'Compact View', desc: 'Reduce card padding', icon: Eye },
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

        {/* ── Quick Add ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="mb-6"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-teal-100/60 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-teal-500" />
              <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>Quick Add</h3>
            </div>
            <div className="flex gap-3">
              <input
                value={quickText}
                onChange={e => setQuickText(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addReminderFromQuick()}
                placeholder='Try: "Pay rent tomorrow 5pm" or "Renew license in 3 days"'
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
              <button
                onClick={addReminderFromQuick}
                className="px-6 py-2.5 rounded-xl text-white flex items-center gap-2 font-semibold text-sm transition shadow-md"
                style={{ backgroundColor: '#0d9488', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' }}
              >
                <Plus size={16} /> Add
              </button>
            </div>
            <AnimatePresence>
              {quickText.trim() && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-100">
                    <p className="text-sm font-semibold text-gray-800 mb-1">Preview:</p>
                    <p className="text-sm text-gray-600">
                      {(() => {
                        const parsed = parseQuickInput(quickText.trim());
                        const iso = parsed.date ? toISO(parsed.date) : toISO(now());
                        return `${parsed.task} — ${new Date(iso).toLocaleString()} • Priority: ${suggestPriority(iso, parsed.task)}`;
                      })()}
                    </p>
                    <p className="text-xs text-teal-600 mt-2 font-medium">💡 Tip: use "tomorrow", "in 3 days", or times like "5pm"</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Search & Controls ────────────────────────────────────── */}
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
                  placeholder="Search reminders..."
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

              {/* Priority filter chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1"><Filter size={12} className="inline" /></span>
                {(["All", "High", "Medium", "Low"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPriority(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filterPriority === p
                        ? 'bg-teal-50 border-teal-300 text-teal-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Second row: sort + view */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sort</span>
                {([
                  { value: 'due' as const, label: 'Due Date' },
                  { value: 'priority' as const, label: 'Priority' },
                  { value: 'created' as const, label: 'Created' },
                ]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSortBy(value)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${sortBy === value
                        ? 'bg-teal-50 border-teal-300 text-teal-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {label}
                    {sortBy === value && <SortAsc size={12} />}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  <strong className="text-gray-700">{filtered.length}</strong> of {reminders.length}
                </span>
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

        {/* ── Reminders List ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {filtered.length === 0 && reminders.length === 0 ? (
            <div className="text-center py-20 bg-white/80 backdrop-blur-xl rounded-3xl border border-teal-100/60 shadow-sm">
              <div className="bg-teal-50 p-4 rounded-2xl inline-flex mb-4 border border-teal-100">
                <Bell className="w-8 h-8 text-teal-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>No reminders yet</h3>
              <p className="text-gray-400 mt-2 text-sm">Add your first reminder using the quick-add box above.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-xl rounded-3xl border border-teal-100/60 shadow-sm">
              <p className="text-gray-400 text-sm">No reminders match your current filters.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(r => {
                const effectiveISO = r.snoozedUntil ?? r.dueDate;
                const effectiveDate = new Date(effectiveISO);
                const overdue = !r.completed && +effectiveDate < +now();
                const days = daysUntil(effectiveISO);
                const pc = priorityColors[r.priority];

                return (
                  <div
                    key={r.id}
                    className={`group bg-white/80 backdrop-blur-xl border rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden ${r.completed ? 'opacity-60' : ''
                      } border-teal-100/60 hover:border-teal-300 ${settings.compactCards ? 'p-4' : 'p-5'}`}
                  >
                    {/* Header: task + priority */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className={`text-sm font-bold flex-1 ${r.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {r.task}
                      </h3>
                      {settings.showPriorityBadge && (
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${pc.bg} ${pc.text} ${pc.border}`}>
                          {r.priority}
                        </span>
                      )}
                    </div>

                    {/* Due date & tags */}
                    {settings.showDueDate && (
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock size={13} className="text-gray-400" />
                          <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                            {effectiveDate.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.snoozedUntil && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md text-[10px] font-bold">
                              Snoozed
                            </span>
                          )}
                          <span className={`text-[11px] font-semibold ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                            {days <= 0 ? (overdue ? "⚠️ Overdue" : "📅 Due today") : `${days} day${days !== 1 ? 's' : ''} left`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => toggleComplete(r.id)}
                        className={`w-full px-4 py-2 rounded-xl text-xs font-semibold transition ${r.completed
                            ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                            : 'text-white'
                          }`}
                        style={!r.completed ? { backgroundColor: '#0d9488' } : undefined}
                      >
                        <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />
                        {r.completed ? "Completed" : "Mark Done"}
                      </button>

                      {settings.showSnoozeButtons && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => snooze(r.id, 60)}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
                            title="Snooze 1 hour"
                          >
                            <Timer size={11} className="inline mr-1" /> 1h
                          </button>
                          <button
                            onClick={() => snooze(r.id, 60 * 24)}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
                            title="Snooze 1 day"
                          >
                            <Timer size={11} className="inline mr-1" /> 1d
                          </button>
                          <button
                            onClick={() => removeReminder(r.id)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                            title="Remove"
                          >
                            <XCircle size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-teal-100/60 shadow-sm overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="bg-teal-50/40 border-b border-teal-100/60 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50">
                    {filtered.map(r => {
                      const effectiveISO = r.snoozedUntil ?? r.dueDate;
                      const effectiveDate = new Date(effectiveISO);
                      const overdue = !r.completed && +effectiveDate < +now();
                      const days = daysUntil(effectiveISO);
                      const pc = priorityColors[r.priority];

                      return (
                        <tr key={r.id} className={`hover:bg-teal-50/30 transition ${r.completed ? 'opacity-60' : ''}`}>
                          <td className={`px-6 py-3.5 font-semibold ${r.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {r.task}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${pc.bg} ${pc.text} ${pc.border}`}>
                              {r.priority}
                            </span>
                          </td>
                          <td className={`px-6 py-3.5 text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                            {effectiveDate.toLocaleDateString()}
                            <span className="block text-[11px] mt-0.5">
                              {days <= 0 ? (overdue ? "Overdue" : "Due today") : `${days}d left`}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${r.completed
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : overdue
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                              {r.completed ? 'Done' : overdue ? 'Overdue' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => toggleComplete(r.id)}
                                className="p-1.5 rounded-lg hover:bg-teal-50 text-teal-600 transition"
                                title={r.completed ? 'Undo' : 'Mark Done'}
                              >
                                <CheckCircle size={15} />
                              </button>
                              {settings.showSnoozeButtons && (
                                <button
                                  onClick={() => snooze(r.id, 60)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                                  title="Snooze 1h"
                                >
                                  <Timer size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => removeReminder(r.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                                title="Delete"
                              >
                                <XCircle size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
