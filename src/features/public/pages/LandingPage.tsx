import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Target, BarChart3, ArrowRight, Shield,
    CheckCircle2, Lock,
    ChevronDown, Clock, Users,
    FileText, CreditCard, Calendar, Package,
    AlertTriangle, Activity,
    Mic, Command, MessageSquare, Gavel, Send, Receipt, ShieldCheck, Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { Pricing } from '@/features/public/pages/PricingPage';
import { LegalModal, PolicyType } from '@/features/compliance/components/LegalModal';
import { LogoSplash } from '@/features/public/components/LogoSplash';
import { brandProfile } from '@/shared/lib/config/brandProfile';

// ─── Motion presets ───────────────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as any } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

// ─── Section eyebrow ──────────────────────────────────────────────────────────
function SectionEyebrow({ children, light }: { children: React.ReactNode; light?: boolean }) {
    return (
        <div className={`font-semibold uppercase tracking-[0.18em] text-[11px] mb-3 ${light ? 'text-teal-500' : 'text-teal-400/90'}`}>
            {children}
        </div>
    );
}

// ─── Early access banner ──────────────────────────────────────────────────────
function EarlyAccessBanner() {
    return (
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold tracking-wide mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Early access · Built in public for Indian founders
        </div>
    );
}

// ─── Feature card (light bg) ──────────────────────────────────────────────────
function FeatureCard({
    icon: Icon,
    title,
    desc,
    badge,
}: {
    icon: any;
    title: string;
    desc: string;
    badge?: { label: string; type: 'live' | 'coming' };
}) {
    return (
        <motion.div
            variants={fadeUp}
            className="group relative p-6 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm transition-all"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-teal-50 border border-teal-100">
                    <Icon className="text-teal-600" style={{ width: 16, height: 16 }} />
                </div>
                {badge && (
                    <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                            badge.type === 'live'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                : 'bg-amber-50 text-amber-600 border-amber-200'
                        }`}
                    >
                        {badge.label}
                    </span>
                )}
            </div>
            <h3 className="font-semibold text-slate-900 text-[14px] mb-1.5 tracking-tight">{title}</h3>
            <p className="text-slate-500 text-[13px] leading-relaxed">{desc}</p>
        </motion.div>
    );
}

// ─── Dashboard mockup (stays dark – it's an app UI) ──────────────────────────
function DashboardMockup() {
    const events = [
        { type: 'Payment recorded', detail: '₹3,540 · Cash', time: '17:57', ok: true },
        { type: 'Payment recorded', detail: '₹60 · Bank transfer', time: '16:21', ok: true },
        { type: 'Invoice overdue', detail: 'CEX-2026-0048 · ₹8,644', time: '09:00', ok: false },
    ];
    return (
        <div className="relative">
            <div className="relative bg-[#080c18] border border-white/[0.07] rounded-2xl overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
                <div className="bg-[#0b1019] border-b border-white/[0.05] px-4 py-2.5 flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="hidden sm:flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] rounded-md px-3 py-1">
                            <span className="text-[11px] text-slate-400 font-mono">app.capitaedgex.com/workspace</span>
                            <Lock className="w-2.5 h-2.5 text-slate-500" />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row" style={{ minHeight: 440 }}>
                    <div className="hidden md:flex w-44 flex-shrink-0 bg-[#070b14] border-r border-white/[0.04] p-4 flex-col gap-1">
                        <div className="flex items-center gap-2 mb-5">
                            <Logo size={24} />
                            <div>
                                <div className="text-[12px] font-semibold text-white">CapitaEdgeX</div>
                                <div className="text-[9px] text-slate-500">Finance Workspace</div>
                            </div>
                        </div>
                        <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600 mb-1.5 px-2">Workspace</div>
                        {[{ label: 'Overview', icon: Activity, active: true }, { label: 'Calendar', icon: Calendar }].map(item => (
                            <div key={item.label} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11.5px] font-medium ${item.active ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' : 'text-slate-500'}`}>
                                <item.icon className="w-3.5 h-3.5" />{item.label}
                            </div>
                        ))}
                        <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600 mt-3 mb-1.5 px-2">Revenue</div>
                        {[{ label: 'Invoices', icon: FileText }, { label: 'Payments', icon: CreditCard }, { label: 'Clients', icon: Users }].map(item => (
                            <div key={item.label} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11.5px] font-medium text-slate-500"><item.icon className="w-3.5 h-3.5" />{item.label}</div>
                        ))}
                        <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600 mt-3 mb-1.5 px-2">Spend</div>
                        {[{ label: 'Expenses', icon: Package }, { label: 'Tax & Compliance', icon: Shield }].map(item => (
                            <div key={item.label} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11.5px] font-medium text-slate-500"><item.icon className="w-3.5 h-3.5" />{item.label}</div>
                        ))}
                    </div>
                    <div className="flex-1 p-5 overflow-hidden">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 mb-1">Business Overview</div>
                                <h2 className="text-base font-semibold text-white tracking-tight">Dashboard</h2>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 text-[11px] font-medium text-slate-300 border border-white/[0.08] rounded-md">Review overdue</button>
                                <button className="px-3 py-1.5 text-[11px] font-medium text-teal-300 border border-teal-500/30 rounded-md bg-teal-500/10">Add client</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3.5">
                            {[
                                { label: 'Pending revenue', val: '₹27.03L', sub: '500 invoices pending', icon: FileText, accent: 'text-teal-300' },
                                { label: 'Action required', val: '₹13.03L', sub: '250 overdue', icon: AlertTriangle, accent: 'text-orange-300' },
                                { label: 'Cash collected', val: '₹13.17L', sub: '65% of monthly goal', icon: Activity, accent: 'text-teal-300' },
                                { label: 'Active clients', val: '4,004', sub: 'Manage clients', icon: Users, accent: 'text-slate-300' },
                            ].map(kpi => (
                                <div key={kpi.label} className="bg-white/[0.025] border border-white/[0.05] rounded-lg p-3">
                                    <div className="w-7 h-7 rounded-md flex items-center justify-center mb-2.5 bg-white/[0.04]">
                                        <kpi.icon className={`w-3.5 h-3.5 ${kpi.accent}`} />
                                    </div>
                                    <div className="text-[9px] font-medium uppercase tracking-[0.13em] text-slate-500 mb-1">{kpi.label}</div>
                                    <div className="font-semibold text-white text-[16px] leading-none mb-1 tracking-tight">{kpi.val}</div>
                                    <div className={`text-[10px] font-medium ${kpi.accent}`}>{kpi.sub}</div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            <div className="col-span-1 md:col-span-2 bg-white/[0.02] border border-white/[0.05] rounded-lg p-3.5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white"><Activity className="w-3.5 h-3.5 text-teal-400" />Activity</div>
                                    <div className="text-[10px] text-slate-500">Last 24 hours</div>
                                </div>
                                {events.map((ev, i) => (
                                    <div key={i} className="flex items-center gap-2.5 bg-white/[0.02] rounded-md px-2.5 py-2 mb-1.5 last:mb-0">
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${ev.ok ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                            <CreditCard className={`w-3 h-3 ${ev.ok ? 'text-emerald-400' : 'text-rose-400'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-medium text-slate-200">{ev.type}</div>
                                            <div className="text-[10px] text-slate-500 truncate">{ev.detail}</div>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono flex-shrink-0">{ev.time}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white mb-3"><Clock className="w-3.5 h-3.5 text-orange-300" />Priority queue</div>
                                {[
                                    { name: 'BlueSky Marketing', inv: 'CEX-2026-0048', amt: '₹8,644' },
                                    { name: 'TechFlow Solutions', inv: 'CEX-2026-0047', amt: '₹4,220' },
                                    { name: 'Craft & Canvas Co.', inv: 'CEX-2026-0045', amt: '₹5,893' },
                                ].map((c, i) => (
                                    <div key={i} className="flex items-center gap-2 mb-3 last:mb-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-medium text-slate-200 truncate">{c.name}</div>
                                            <div className="text-[10px] text-slate-500">{c.inv}</div>
                                        </div>
                                        <div className="text-[11px] font-semibold text-rose-300 flex-shrink-0">{c.amt}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Invoices mock ─────────────────────────────────────────────────────────────
function InvoicesMock() {
    const rows = [
        { num: 'CEX-2026-0049', date: '21 Feb 2026', customer: 'Pixel Republic Studio', total: '₹8,034', status: 'Paid', sc: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { num: 'CEX-2026-0048', date: '19 Feb 2026', customer: 'BlueSky Marketing', total: '₹8,644', status: 'Overdue', sc: 'bg-rose-50 text-rose-700 border-rose-200' },
        { num: 'CEX-2026-0047', date: '18 Feb 2026', customer: 'TechFlow Solutions', total: '₹4,220', status: 'Overdue', sc: 'bg-rose-50 text-rose-700 border-rose-200' },
        { num: 'CEX-2026-0046', date: '15 Feb 2026', customer: 'Nexus Creatives Pvt', total: '₹6,071', status: 'Sent', sc: 'bg-blue-50 text-blue-700 border-blue-200' },
        { num: 'CEX-2026-0045', date: '14 Feb 2026', customer: 'Craft & Canvas Co.', total: '₹5,893', status: 'Overdue', sc: 'bg-rose-50 text-rose-700 border-rose-200' },
    ];
    return (
        <div className="bg-white p-4 rounded-xl">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-slate-900 text-[15px] tracking-tight">Invoices</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Track customer billing</p>
                </div>
                <button className="px-3 py-1.5 bg-teal-600 text-white text-[11px] font-semibold rounded-lg">+ New invoice</button>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-5 px-3 py-2 bg-slate-50 border-b border-slate-200">
                    {['Number', 'Date', 'Customer', 'Total', 'Status'].map(h => (
                        <div key={h} className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-500">{h}</div>
                    ))}
                </div>
                {rows.map((row, i) => (
                    <div key={i} className="grid grid-cols-5 items-center px-3 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <div className="text-[10px] font-mono text-teal-700">{row.num}</div>
                        <div className="text-[10px] text-slate-500">{row.date}</div>
                        <div className="text-[10px] text-slate-700">{row.customer}</div>
                        <div className="text-[10px] font-semibold text-slate-900">{row.total}</div>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border w-fit ${row.sc}`}>{row.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Payment records mock ─────────────────────────────────────────────────────
function PaymentsMock() {
    const payments = [
        { from: 'Pixel Republic Studio', method: 'Bank Transfer', amt: '₹8,034', date: '21 Feb', inv: 'CEX-2026-0049', ok: true },
        { from: 'BlueSky Marketing', method: 'Cash', amt: '₹3,540', date: '17 Feb', inv: 'Partial · CEX-2026-0048', ok: true },
        { from: 'TechFlow Solutions', method: 'UPI', amt: '₹4,220', date: '14 Feb', inv: 'CEX-2026-0043', ok: true },
    ];
    return (
        <div className="bg-[#0a0e1a] p-5 rounded-xl border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 mb-1">Payment Records</div>
                    <h3 className="font-semibold text-white text-[15px]">Recent payments</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-medium text-emerald-300">Live sync</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
                {[
                    { label: 'This month', val: '₹15,794', color: 'text-teal-300' },
                    { label: 'Pending', val: '₹18,757', color: 'text-orange-300' },
                ].map((s, i) => (
                    <div key={i} className="bg-white/[0.025] border border-white/[0.05] rounded-lg p-2.5">
                        <div className="text-[9px] text-slate-500 font-medium uppercase tracking-[0.12em] mb-1">{s.label}</div>
                        <div className={`font-semibold text-[15px] tracking-tight ${s.color}`}>{s.val}</div>
                    </div>
                ))}
            </div>
            <div className="space-y-2">
                {payments.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-white truncate">{p.from}</div>
                            <div className="text-[9.5px] text-slate-500">{p.method} · {p.inv}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="text-[12px] font-semibold text-emerald-300">{p.amt}</div>
                            <div className="text-[9.5px] text-slate-500">{p.date}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Expense tracker mock ─────────────────────────────────────────────────────
function ExpensesMock() {
    const cats = [
        { label: 'Software & Tools', amt: '₹4,299', pct: 42, color: 'bg-teal-500' },
        { label: 'Travel', amt: '₹2,100', pct: 21, color: 'bg-violet-500' },
        { label: 'Office Supplies', amt: '₹1,800', pct: 18, color: 'bg-orange-400' },
        { label: 'Marketing', amt: '₹1,950', pct: 19, color: 'bg-blue-500' },
    ];
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-slate-900 text-[15px] tracking-tight">Expense Tracker</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">April 2026 · ₹10,149 total</p>
                </div>
                <button className="px-3 py-1.5 bg-slate-900 text-white text-[11px] font-semibold rounded-lg">+ Add expense</button>
            </div>
            <div className="space-y-3">
                {cats.map((c, i) => (
                    <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[12px] font-medium text-slate-700">{c.label}</span>
                            <span className="text-[12px] font-semibold text-slate-900">{c.amt}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">vs last month</span>
                <span className="text-[11px] font-semibold text-emerald-600">↓ 12% lower spend</span>
            </div>
        </div>
    );
}

// ─── Tax reminders mock ───────────────────────────────────────────────────────
function TaxRemindersMock() {
    const deadlines = [
        { label: 'GSTR-1 Filing', due: '11 May 2026', days: 24, type: 'warning' },
        { label: 'GSTR-3B Filing', due: '20 May 2026', days: 33, type: 'info' },
        { label: 'TDS Payment (Q4)', due: '7 May 2026', days: 20, type: 'danger' },
        { label: 'Advance Tax Q1', due: '15 Jun 2026', days: 59, type: 'info' },
    ];
    return (
        <div className="bg-[#0a0e1a] p-5 rounded-xl border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 mb-1">Compliance Calendar</div>
                    <h3 className="font-semibold text-white text-[15px]">Tax reminders</h3>
                </div>
                <Bell className="w-4 h-4 text-teal-400" />
            </div>
            <div className="space-y-2.5">
                {deadlines.map((d, i) => {
                    const colors = {
                        danger: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-300', badge: 'text-rose-400' },
                        warning: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-300', badge: 'text-amber-400' },
                        info: { bg: 'bg-teal-500/10 border-teal-500/20', text: 'text-teal-300', badge: 'text-teal-400' },
                    }[d.type] || {};
                    return (
                        <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${colors.bg}`}>
                            <div className="flex-1 min-w-0">
                                <div className={`text-[11px] font-semibold ${colors.text}`}>{d.label}</div>
                                <div className="text-[9.5px] text-slate-500 mt-0.5">Due {d.due}</div>
                            </div>
                            <div className={`text-[10px] font-bold ${colors.badge} whitespace-nowrap`}>{d.days}d left</div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.05] text-center">
                <span className="text-[10.5px] text-slate-500">Reminders sent automatically before each deadline</span>
            </div>
        </div>
    );
}

// ─── Reports mock ─────────────────────────────────────────────────────────────
function ReportsMock() {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-900 text-[15px] tracking-tight">Reports</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">Real-time financial insights</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                    { label: 'Total revenue', val: '₹13,17,615', color: 'text-teal-700' },
                    { label: 'Expenses', val: '₹1,499', color: 'text-orange-600' },
                    { label: 'Net profit', val: '₹13,16,116', color: 'text-teal-700' },
                    { label: 'Avg margin', val: '100%', color: 'text-violet-700' },
                ].map((s, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        <div className="text-[9px] font-medium uppercase tracking-[0.13em] text-slate-500 mb-1.5">{s.label}</div>
                        <div className={`font-semibold text-[13px] leading-none tracking-tight ${s.color}`}>{s.val}</div>
                    </div>
                ))}
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-semibold text-slate-900">Revenue vs expenses</div>
                    <div className="flex gap-3 text-[10px]">
                        <span className="flex items-center gap-1 text-teal-600"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> Revenue</span>
                        <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> Expenses</span>
                    </div>
                </div>
                <svg viewBox="0 0 300 70" className="w-full h-20">
                    <defs>
                        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(20,184,166,0.2)" />
                            <stop offset="100%" stopColor="rgba(20,184,166,0)" />
                        </linearGradient>
                    </defs>
                    <path d="M 10 62 C 50 62 90 15 150 6 C 210 -2 270 4 290 1" stroke="rgb(13,148,136)" strokeWidth="2" fill="none" />
                    <path d="M 10 62 C 50 62 90 15 150 6 C 210 -2 270 4 290 1 L 290 70 L 10 70 Z" fill="url(#rg)" />
                    <path d="M 10 66 C 80 66 150 63 290 64" stroke="rgb(203,213,225)" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />
                </svg>
            </div>
        </div>
    );
}

// ─── AI Workspace chat mock (dark – it's a power-feature callout) ─────────────
const AI_DOMAINS = [
    { icon: FileText,    label: 'Invoices',    desc: 'Filter, send reminders, view overdue', active: false },
    { icon: CreditCard,  label: 'Payments',    desc: 'Record, reconcile, track collection',   active: true  },
    { icon: Receipt,     label: 'Expenses',    desc: 'Log, categorise, see margin impact',     active: false },
    { icon: ShieldCheck, label: 'Compliance',  desc: 'GST deadlines & filing reminders',       active: false },
    { icon: Users,       label: 'Customers',   desc: 'Client history, balances, contacts',     active: false },
];

function ChatBubble({ role, children }: { role: 'user' | 'ai'; children: React.ReactNode }) {
    return (
        <div className={`flex items-start gap-2.5 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                role === 'ai'
                    ? 'bg-teal-500/15 border border-teal-500/25 text-teal-300'
                    : 'bg-white/5 border border-white/10 text-slate-400'
            }`}>
                {role === 'ai' ? 'AI' : 'U'}
            </div>
            <div className={`px-3.5 py-2.5 rounded-xl text-[12.5px] leading-[1.55] max-w-[calc(100%-3rem)] sm:max-w-[420px] ${
                role === 'ai'
                    ? 'bg-white/[0.03] border border-white/[0.06] text-slate-300'
                    : 'bg-teal-500/10 border border-teal-500/20 text-slate-200'
            }`}>
                {children}
            </div>
        </div>
    );
}

function AIWorkspaceMock() {
    return (
        <div className="bg-[#080c18] border border-white/[0.07] rounded-2xl overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
            <div className="bg-[#0b1019] border-b border-white/[0.05] px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                </div>
                <div className="ml-3 text-[11px] text-slate-500 font-medium">Smart Assistant · CapitaEdgeX</div>
            </div>
            <div className="p-5 flex flex-col gap-4">
                <ChatBubble role="user">Show me all overdue invoices from this month</ChatBubble>
                <ChatBubble role="ai">
                    Found 3 overdue invoices totalling ₹18,757. Which workspace would you like to open?
                </ChatBubble>
                <div className="ml-0 sm:ml-9 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                    {AI_DOMAINS.map(({ icon: Icon, label, desc, active }) => (
                        <div key={label} className={`rounded-xl border p-3 transition-all ${
                            active
                                ? 'border-teal-500/40 bg-teal-500/10'
                                : 'border-white/[0.05] bg-black/20'
                        }`}>
                            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-teal-500/10 border border-teal-500/15 mb-2">
                                <Icon className="text-teal-400" style={{ width: 11, height: 11 }} />
                            </div>
                            <div className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-teal-300 mb-1 truncate">{label}</div>
                            <div className="text-[8px] text-slate-500 leading-[1.2] truncate">{desc}</div>
                        </div>
                    ))}
                </div>
                <ChatBubble role="user">Payments</ChatBubble>
                <ChatBubble role="ai">
                    Opening the Payments workspace — 3 overdue invoices sorted by value. Record a payment or send a reminder directly from here.
                </ChatBubble>
            </div>
        </div>
    );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FaqSection() {
    const [openIdx, setOpenIdx] = useState<number | null>(0);
    const faqs = [
        {
            q: `Who is ${brandProfile.name} built for?`,
            a: brandProfile.faqBuiltFor,
        },
        {
            q: 'Are the invoices generated GST compliant?',
            a: 'Yes. Every invoice generated through CapitaEdgeX adheres to current Indian GST regulations, including SGST, CGST, IGST, and HSN/SAC configurations.',
        },
        {
            q: 'How do I record payments?',
            a: 'You can manually record payments against any invoice — cash, cheque, bank transfer, or UPI. The platform updates your cash collected and reconciles it against pending revenue automatically. Direct payment gateway integrations are on our roadmap.',
        },
        {
            q: 'How do tax reminders work?',
            a: 'CapitaEdgeX tracks all major GST and income tax deadlines for Indian businesses — GSTR-1, GSTR-3B, TDS payments, advance tax dates, and more. You get reminders before each deadline so you never face a late penalty.',
        },
        {
            q: 'What happens if I cancel my subscription?',
            a: 'You can cancel at any time. You retain full access to your account and historical data through the end of your billing cycle, and you can export everything to CSV at any point.',
        },
        {
            q: 'Is there a limit on how many invoices I can send?',
            a: 'No. All paid plans include unlimited invoicing and unlimited client profiles.',
        },
        {
            q: 'Is this product fully launched?',
            a: 'CapitaEdgeX is in early access. Core features — invoicing, expense tracking, payment records, compliance reminders, and P&L reporting — are live. We are actively building with early users and shipping improvements every week.',
        },
    ];

    return (
        <section id="faq" className="py-24 bg-white relative z-10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-14">
                    <SectionEyebrow light>FAQ</SectionEyebrow>
                    <h2 className="font-semibold text-slate-900 text-3xl md:text-4xl tracking-tight">Frequently asked questions</h2>
                </div>
                <div className="space-y-2">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className={`border rounded-lg overflow-hidden transition-colors ${openIdx === i ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                        >
                            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full px-5 py-4 flex items-center justify-between text-left">
                                <span className={`font-medium text-[14px] ${openIdx === i ? 'text-slate-900' : 'text-slate-700'}`}>{faq.q}</span>
                                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${openIdx === i ? 'rotate-180 text-teal-600' : 'text-slate-400'}`} />
                            </button>
                            <AnimatePresence>
                                {openIdx === i && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}>
                                        <div className="px-5 pb-5 text-[13.5px] text-slate-600 leading-relaxed border-t border-teal-100 pt-3.5">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export const Landing: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [legalModalType, setLegalModalType] = useState<PolicyType | null>(null);
    const [splashDone, setSplashDone] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        return sessionStorage.getItem('cex_splash_seen') === '1';
    });

    useEffect(() => {
        if (splashDone) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [splashDone]);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    return (
        <div
            className="relative min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-teal-500/20"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                html { scroll-behavior: smooth; }
            `}</style>

            {!splashDone && (
                <LogoSplash
                    onComplete={() => {
                        sessionStorage.setItem('cex_splash_seen', '1');
                        setSplashDone(true);
                    }}
                />
            )}

            {/* ── NAV ── light glass ────────────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-5 pt-3 sm:pt-4">
                <div className="max-w-6xl mx-auto">
                    <div className={`flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 rounded-xl transition-all duration-300 ${
                        scrolled
                            ? 'bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm'
                            : 'border border-transparent'
                    }`}>
                        <div className="flex items-center gap-2 sm:gap-2.5">
                            <Logo size={24} className="sm:w-[28px] sm:h-[28px]" />
                            <span className={`font-semibold text-[15px] sm:text-[17px] tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                                Capita<span className="text-teal-500">EdgeX</span>
                            </span>
                        </div>
                        <div className="hidden md:flex items-center gap-7">
                            {[
                                ['#features', 'Features'],
                                ['#how-it-works', 'How it works'],
                                ['#pricing', 'Pricing'],
                                ['#faq', 'FAQ'],
                            ].map(([href, label]) => (
                                <a key={label} href={href} className={`text-[13px] font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>
                                    {label}
                                </a>
                            ))}
                        </div>
                        <Link
                            to="/login"
                            className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[12px] sm:text-[13px] font-semibold transition-colors whitespace-nowrap shadow-sm"
                        >
                            <span className="hidden sm:inline">Get started free</span>
                            <span className="sm:hidden">Join</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── dark gradient background ─────────────────────────────── */}
            <section className="relative pt-36 pb-20 lg:pt-48 lg:pb-28 overflow-hidden bg-[#0f172a]">
                {/* Hero background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
                        style={{ background: 'radial-gradient(ellipse at center, rgba(20,184,166,0.12) 0%, transparent 65%)' }}
                    />
                    <div
                        className="absolute inset-0 opacity-[0.02]"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(148,163,184,1) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,1) 1px,transparent 1px)',
                            backgroundSize: '64px 64px',
                        }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-slate-50" />
                </div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 w-full">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <EarlyAccessBanner />
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.05 }}
                            className="font-semibold leading-[1.1] sm:leading-[1.04] tracking-[-0.02em] mb-6 text-white"
                            style={{ fontSize: 'clamp(32px, 8vw, 72px)' }}
                        >
                            Invoices. Payments.{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">
                                Always on time.
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.15 }}
                            className="text-slate-300 text-[17px] md:text-[18px] max-w-2xl mx-auto mb-9 leading-relaxed"
                        >
                            Create GST-compliant invoices, track every payment, manage expenses,
                            and get tax deadline reminders — all in one workspace built for Indian businesses.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-9"
                        >
                            <Link
                                to="/login"
                                className="w-full sm:w-auto px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-lg font-semibold text-[14px] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25"
                            >
                                Start for free
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="#product"
                                className="w-full sm:w-auto px-6 py-3 bg-white/[0.06] border border-white/[0.12] text-white rounded-lg font-semibold text-[14px] hover:bg-white/[0.10] transition-colors"
                            >
                                See the product
                            </a>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-slate-400"
                        >
                            {['GST-compliant invoicing', 'Tax deadline reminders', 'No credit card required'].map(f => (
                                <div key={f} className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                                    {f}
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* Dashboard mockup – overflows into light section */}
                <div id="product" className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                    <DashboardMockup />
                </div>
            </section>

            {/* ── STATS ── light ────────────────────────────────────────────────── */}
            <section className="py-16 bg-white relative z-10 border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-200"
                    >
                        {[
                            { val: 'Invoices', label: 'GST-compliant, unlimited', icon: FileText },
                            { val: 'Payments', label: 'Cash, cheque, UPI, bank', icon: CreditCard },
                            { val: 'Expenses', label: 'Categorised, margin-aware', icon: Package },
                            { val: 'Tax alerts', label: 'Never miss a deadline', icon: Bell },
                        ].map((s, i) => (
                            <motion.div key={i} variants={fadeUp} className="bg-white p-7 text-center flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-1">
                                    <s.icon className="w-5 h-5 text-teal-600" />
                                </div>
                                <div className="font-semibold text-xl text-slate-900 tracking-tight">{s.val}</div>
                                <div className="text-[11px] font-medium text-slate-500">{s.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── FEATURES ── alternating light / dark ─────────────────────────── */}
            <section id="features" className="relative z-10">

                {/* 1. Invoice management – light section */}
                <div className="py-20 bg-white">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="grid lg:grid-cols-2 gap-14 items-center"
                        >
                            <div>
                                <SectionEyebrow light>Invoice Management</SectionEyebrow>
                                <h3 className="font-semibold text-slate-900 text-2xl md:text-3xl mb-4 leading-tight tracking-tight">
                                    Every invoice. Every status.{' '}
                                    <span className="text-teal-600">Total control.</span>
                                </h3>
                                <p className="text-slate-600 text-[15px] leading-relaxed mb-6">
                                    Create, send and track unlimited GST-compliant invoices. See real-time status
                                    — Paid, Sent, Overdue, Draft — and send bulk reminders to overdue clients in one click.
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        'Unlimited GST-compliant invoices with SGST/CGST/IGST',
                                        'Bulk email reminders for overdue clients',
                                        'Instant search and filter across all invoices',
                                        'One-click PDF download and sharing',
                                    ].map(f => (
                                        <li key={f} className="flex items-start gap-3 text-[14px] text-slate-700">
                                            <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="relative shadow-xl shadow-slate-200 rounded-xl overflow-hidden">
                                <InvoicesMock />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* 2. Payment records – dark section */}
                <div className="py-20 bg-[#0f172a]">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="grid lg:grid-cols-2 gap-14 items-center"
                        >
                            <div className="lg:order-2">
                                <SectionEyebrow>Payment Records</SectionEyebrow>
                                <h3 className="font-semibold text-white text-2xl md:text-3xl mb-4 leading-tight tracking-tight">
                                    Know exactly what you've collected.{' '}
                                    <span className="text-teal-300">And what's still due.</span>
                                </h3>
                                <p className="text-slate-400 text-[15px] leading-relaxed mb-6">
                                    Record every payment against its invoice — cash, cheque, bank transfer, UPI.
                                    Your cash collected and pending revenue update live so you always know where you stand.
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        'Record payments by cash, cheque, UPI, or bank transfer',
                                        'Auto-reconcile against the matching invoice',
                                        'Priority queue of highest-value overdue clients',
                                        'Payment activity log with timestamps',
                                    ].map(f => (
                                        <li key={f} className="flex items-start gap-3 text-[14px] text-slate-300">
                                            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="lg:order-1">
                                <PaymentsMock />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* 3. Expense tracker – light section */}
                <div className="py-20 bg-slate-50">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="grid lg:grid-cols-2 gap-14 items-center"
                        >
                            <div>
                                <SectionEyebrow light>Expense Tracker</SectionEyebrow>
                                <h3 className="font-semibold text-slate-900 text-2xl md:text-3xl mb-4 leading-tight tracking-tight">
                                    See where your money goes.{' '}
                                    <span className="text-teal-600">Every rupee.</span>
                                </h3>
                                <p className="text-slate-600 text-[15px] leading-relaxed mb-6">
                                    Log and categorise business expenses in seconds. Get a clear picture of your
                                    spend breakdown — and see exactly how each category affects your profit margin.
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        'Categorise by software, travel, marketing, and more',
                                        'Month-on-month spend comparison',
                                        'See how expenses affect your net margin in real time',
                                        'Export spend reports to CSV or PDF',
                                    ].map(f => (
                                        <li key={f} className="flex items-start gap-3 text-[14px] text-slate-700">
                                            <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="shadow-lg shadow-slate-200 rounded-xl overflow-hidden">
                                <ExpensesMock />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* 4. Tax reminders – dark section */}
                <div className="py-20 bg-[#0f172a]">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="grid lg:grid-cols-2 gap-14 items-center"
                        >
                            <div className="lg:order-2">
                                <div className="inline-flex items-center gap-2 mb-3">
                                    <SectionEyebrow>Tax Reminders</SectionEyebrow>
                                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-300 border-emerald-500/20 -mt-3">Live</span>
                                </div>
                                <h3 className="font-semibold text-white text-2xl md:text-3xl mb-4 leading-tight tracking-tight">
                                    Never miss a GST deadline.{' '}
                                    <span className="text-teal-300">Or pay a penalty.</span>
                                </h3>
                                <p className="text-slate-400 text-[15px] leading-relaxed mb-6">
                                    CapitaEdgeX tracks all major Indian tax deadlines — GSTR-1, GSTR-3B, TDS,
                                    advance tax, and more. Get automatic reminders before each due date so you
                                    always file on time, every time.
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        'GSTR-1, GSTR-3B, TDS, and advance tax deadlines',
                                        'Reminders sent days before each due date',
                                        'Colour-coded urgency — critical, upcoming, planned',
                                        'Full compliance calendar in one view',
                                    ].map(f => (
                                        <li key={f} className="flex items-start gap-3 text-[14px] text-slate-300">
                                            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="lg:order-1">
                                <TaxRemindersMock />
                            </div>
                        </motion.div>
                    </div>
                </div>

            </section>

            {/* ── FEATURE GRID ── light ─────────────────────────────────────────── */}
            <section className="py-20 bg-white border-t border-slate-100 relative z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 max-w-2xl mx-auto"
                    >
                        <SectionEyebrow light>Everything included</SectionEyebrow>
                        <h2 className="font-semibold text-slate-900 text-3xl md:text-4xl tracking-tight">No hidden add-ons</h2>
                        <p className="text-slate-500 text-[13px] mt-3">
                            Live features available now. Features marked "coming soon" are on the roadmap.
                        </p>
                    </motion.div>
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-3"
                    >
                        {[
                            {
                                icon: FileText,
                                title: 'GST-compliant invoicing',
                                desc: 'Create and send invoices with SGST, CGST, IGST, HSN/SAC codes and your branding. Unlimited.',
                                badge: { label: 'Live', type: 'live' as const },
                            },
                            {
                                icon: CreditCard,
                                title: 'Payment records',
                                desc: 'Record payments received — cash, cheque, bank transfer, UPI — against invoices instantly.',
                                badge: { label: 'Live', type: 'live' as const },
                            },
                            {
                                icon: Package,
                                title: 'Expense tracking',
                                desc: 'Log and categorise business expenses. See your spend breakdown and how it affects margin.',
                                badge: { label: 'Live', type: 'live' as const },
                            },
                            {
                                icon: Bell,
                                title: 'Tax reminders',
                                desc: 'Automatic reminders for GSTR-1, GSTR-3B, TDS, advance tax and other Indian deadlines.',
                                badge: { label: 'Live', type: 'live' as const },
                            },
                            {
                                icon: Activity,
                                title: 'Cash flow workspace',
                                desc: 'See pending revenue, cash collected, and overdue clients in a single live view.',
                                badge: { label: 'Live', type: 'live' as const },
                            },
                            {
                                icon: BarChart3,
                                title: 'P&L and analytics',
                                desc: 'Real-time profit and loss, revenue vs expense charts, and month-on-month comparisons.',
                                badge: { label: 'Live', type: 'live' as const },
                            },
                            {
                                icon: Calendar,
                                title: 'Invoice calendar',
                                desc: 'See all due dates, overdue bills and payment deadlines in a visual calendar view.',
                                badge: { label: 'Live', type: 'live' as const },
                            },
                            {
                                icon: Users,
                                title: 'Client management',
                                desc: 'Full client profiles with invoice history, contact info and outstanding balance tracking.',
                                badge: { label: 'Live', type: 'live' as const },
                            },
                            {
                                icon: MessageSquare,
                                title: 'Smart assistant',
                                desc: 'Ask anything in plain English — invoices, payments, expenses, compliance — it opens the right workspace.',
                                badge: { label: 'Live', type: 'live' as const },
                            },
                            {
                                icon: Mic,
                                title: 'Voice commands',
                                desc: 'Tap the mic and speak. Navigate your entire financial workspace hands-free.',
                                badge: { label: 'Live', type: 'live' as const },
                            },
                            {
                                icon: Shield,
                                title: 'Compliance desk',
                                desc: 'Full GST filing status, due dates, and regulatory deadlines in one compliance workspace.',
                                badge: { label: 'Live', type: 'live' as const },
                            },
                            {
                                icon: Target,
                                title: 'Cash runway forecast',
                                desc: 'Predictive signals on how long your cash lasts and which receivables to prioritise first.',
                                badge: { label: 'Coming soon', type: 'coming' as const },
                            },
                        ].map(f => (
                            <FeatureCard key={f.title} {...f} />
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── SMART ASSISTANT (AI CFO as a feature) ── dark ─────────────────── */}
            <section className="py-20 bg-[#0f172a] relative z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="grid lg:grid-cols-2 gap-14 items-center"
                    >
                        <div>
                            <div className="inline-flex items-center gap-2 mb-3">
                                <SectionEyebrow>Smart Assistant</SectionEyebrow>
                                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border bg-teal-500/10 text-teal-300 border-teal-500/20 -mt-3">AI-powered</span>
                            </div>
                            <h3 className="font-semibold text-white text-2xl md:text-3xl mb-4 leading-tight tracking-tight">
                                Ask anything about your finances.{' '}
                                <span className="text-teal-300">In plain English.</span>
                            </h3>
                            <p className="text-slate-400 text-[15px] leading-relaxed mb-6">
                                The built-in smart assistant understands your entire financial picture.
                                Ask about overdue invoices, cash collected, tax deadlines, or specific clients —
                                it opens the right workspace instantly, no filters needed.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    '5 specialised workspaces: invoices, payments, expenses, compliance, customers',
                                    'Natural language queries — no filters to configure manually',
                                    'AI surfaces context-aware data for every question you ask',
                                    'Instantly navigates to the right view and surfaces the right action',
                                ].map(f => (
                                    <li key={f} className="flex items-start gap-3 text-[14px] text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <AIWorkspaceMock />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── light ─────────────────────────────────────────── */}
            <section id="how-it-works" className="py-24 bg-slate-50 relative z-10 border-t border-slate-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="text-center mb-14 max-w-2xl mx-auto"
                    >
                        <motion.div variants={fadeUp}><SectionEyebrow light>How it works</SectionEyebrow></motion.div>
                        <motion.h2 variants={fadeUp} className="font-semibold text-slate-900 text-3xl md:text-4xl tracking-tight">
                            Up and running in under five minutes
                        </motion.h2>
                    </motion.div>
                    <div className="grid md:grid-cols-4 gap-3">
                        {[
                            { n: '01', t: 'Create account', d: 'Sign up with your email. No credit card required.' },
                            { n: '02', t: 'Add your clients', d: 'Add clients manually or import them. Store billing and contact details.' },
                            { n: '03', t: 'Send your first invoice', d: 'Generate a GST-compliant invoice in seconds. Send by email or share the link.' },
                            { n: '04', t: 'Track and collect', d: 'Record payments, monitor expenses, and get reminded before every tax deadline.' },
                        ].map((s, i) => (
                            <motion.div
                                key={s.n}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08, duration: 0.5 }}
                                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-teal-300 hover:shadow-sm transition-all"
                            >
                                <div className="text-[11px] font-bold text-teal-600 mb-3 tracking-[0.12em]">{s.n}</div>
                                <h3 className="font-semibold text-slate-900 text-[15px] mb-1.5 tracking-tight">{s.t}</h3>
                                <p className="text-slate-500 text-[13px] leading-relaxed">{s.d}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRICING ── light ──────────────────────────────────────────────── */}
            <section
                id="pricing"
                className="relative z-20 w-full lg:max-w-5xl mx-auto px-4 md:px-6 pt-10 pb-20 scale-100 lg:scale-90 lg:origin-top"
            >
                <Pricing isEmbedded={true} />
            </section>

            {/* ── FAQ ── white ──────────────────────────────────────────────────── */}
            <FaqSection />

            {/* ── FINAL CTA ── dark with teal ───────────────────────────────────── */}
            <section className="py-28 bg-[#0f172a] relative z-10 text-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
                        style={{ background: 'radial-gradient(circle at center, rgba(20,184,166,0.10) 0%, transparent 60%)' }}
                    />
                </div>
                <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <SectionEyebrow>Get started</SectionEyebrow>
                        <h2
                            className="font-semibold text-white leading-[1.05] tracking-[-0.02em] mb-5"
                            style={{ fontSize: 'clamp(36px, 6vw, 64px)' }}
                        >
                            Your finances.{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">
                                Finally organised.
                            </span>
                        </h2>
                        <p className="text-slate-400 text-[16px] max-w-md mx-auto mb-8">
                            Join early access today — free to start, no credit card, no setup fees.
                            Built for Indian founders who want clarity over their money.
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-lg font-semibold text-[14px] transition-colors shadow-lg shadow-teal-500/25"
                        >
                            Start for free
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <p className="text-slate-600 text-[12.5px] mt-4">No credit card required · Cancel anytime · Built in India</p>
                    </motion.div>
                </div>
            </section>

            {/* ── FOOTER ── dark ────────────────────────────────────────────────── */}
            <footer className="pb-10 pt-16 bg-[#0a0f1e] border-t border-white/[0.06] relative z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-lg flex items-center justify-center">
                                <Zap className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-semibold text-white tracking-tight text-[17px]">CapitaEdgeX</span>
                        </div>
                        <p className="text-slate-400 text-[13.5px] leading-relaxed max-w-sm">
                            {brandProfile.footerDescription}
                        </p>
                        <p className="text-slate-600 text-[11px]">
                            Currently in early access. Core features are live. We ship improvements every week.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white text-[13px] mb-4 uppercase tracking-[0.12em]">Platform</h4>
                        <ul className="space-y-2.5">
                            <li><a href="#features" className="text-[13px] text-slate-400 hover:text-white transition-colors">Features</a></li>
                            <li><a href="#how-it-works" className="text-[13px] text-slate-400 hover:text-white transition-colors">How it works</a></li>
                            <li><a href="#pricing" className="text-[13px] text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white text-[13px] mb-4 uppercase tracking-[0.12em]">Company</h4>
                        <ul className="space-y-2.5">
                            <li><button onClick={() => setLegalModalType('about')} className="text-[13px] text-slate-400 hover:text-white transition-colors">About</button></li>
                            <li><button onClick={() => setLegalModalType('contact')} className="text-[13px] text-slate-400 hover:text-white transition-colors">Contact</button></li>
                            <li><button onClick={() => setLegalModalType('terms')} className="text-[13px] text-slate-400 hover:text-white transition-colors">Terms</button></li>
                            <li><button onClick={() => setLegalModalType('privacy')} className="text-[13px] text-slate-400 hover:text-white transition-colors">Privacy</button></li>
                            <li><button onClick={() => setLegalModalType('refund')} className="text-[13px] text-slate-400 hover:text-white transition-colors">Refunds</button></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/[0.05]">
                    <div className="text-slate-500 text-[12px]">© {new Date().getFullYear()} CapitaEdgeX. All rights reserved.</div>
                    <div className="text-slate-500 text-[12px]">Made in India · Early access</div>
                </div>
            </footer>

            <LegalModal isOpen={!!legalModalType} onClose={() => setLegalModalType(null)} type={legalModalType} />
        </div>
    );
};
