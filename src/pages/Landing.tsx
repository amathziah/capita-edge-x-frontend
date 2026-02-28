import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    Zap, Target, BarChart3, ArrowRight, Shield,
    CheckCircle2, ChevronRight, Globe, Lock,
    ChevronDown, Clock, TrendingUp, Users,
    FileText, CreditCard, Calendar, Package,
    AlertTriangle, Activity, Star, Crown, Briefcase, Building2, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Morphing Blob ───────────────────────────────────────────────────────────
function Blob({ className, color, delay = 0 }: { className: string; color: string; delay?: number }) {
    return (
        <motion.div
            className={`absolute rounded-[60%_40%_30%_70%/60%_30%_70%_40%] pointer-events-none ${className}`}
            style={{ background: color }}
            animate={{
                borderRadius: [
                    '60% 40% 30% 70% / 60% 30% 70% 40%',
                    '30% 60% 70% 40% / 50% 60% 30% 60%',
                    '55% 45% 50% 65% / 40% 70% 55% 35%',
                    '60% 40% 30% 70% / 60% 30% 70% 40%',
                ],
            }}
            transition={{ duration: 22, delay, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
}

// ─── Animated Counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
    const [count, setCount] = useState(0);
    const [inView, setInView] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.5 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!inView) return;
        let start: number | null = null;
        const step = (ts: number) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / 2000, 1);
            setCount(Math.floor((1 - Math.pow(1 - p, 3)) * to));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [inView, to]);

    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ─── FAQ Item ────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-slate-800 last:border-0">
            <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between py-5 text-left gap-4 group">
                <span className="font-semibold text-slate-200 text-[15px] group-hover:text-white transition-colors">{q}</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }} className="flex-shrink-0 text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-5 text-slate-400 text-[14px] leading-relaxed">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Real Dashboard Mockup ───────────────────────────────────────────────────
function DashboardMockup() {
    return (
        <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-teal-500/15 via-cyan-500/10 to-teal-500/15 rounded-[2rem] blur-2xl" />
            <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-[1.75rem] overflow-hidden shadow-2xl">
                {/* Title bar */}
                <div className="bg-[#0d1117] border-b border-white/[0.05] px-5 py-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                    <div className="flex-1 flex justify-center">
                        <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.07] rounded-md px-3 py-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                            <span className="text-[11px] text-slate-400 font-mono">app.malika.ai/dashboard</span>
                        </div>
                    </div>
                </div>
                <div className="flex bg-[#0a0e1a]" style={{ minHeight: 420 }}>
                    {/* Sidebar */}
                    <div className="w-44 flex-shrink-0 bg-[#080c16] border-r border-white/[0.04] p-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-[10px] font-black text-white">M</div>
                            <div>
                                <div className="text-[12px] font-bold text-white">Malika</div>
                                <div className="text-[9px] text-slate-500">Financial OS</div>
                            </div>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600 mb-2 px-2">Headquarters</div>
                        {[{ label: 'Control Room', icon: Activity, active: true }, { label: 'Calendar', icon: Calendar }].map(item => (
                            <div key={item.label} className={`flex items-center gap-2 px-2 py-2 rounded-lg text-[12px] font-semibold ${item.active ? 'bg-teal-500/15 text-teal-400 border border-teal-500/25' : 'text-slate-500'}`}>
                                <item.icon className="w-3.5 h-3.5" />{item.label}
                            </div>
                        ))}
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600 mt-3 mb-2 px-2">Revenue Ops</div>
                        {[{ label: 'Invoices', icon: FileText }, { label: 'Payments', icon: CreditCard }, { label: 'Customers', icon: Users }].map(item => (
                            <div key={item.label} className="flex items-center gap-2 px-2 py-2 rounded-lg text-[12px] font-semibold text-slate-500">
                                <item.icon className="w-3.5 h-3.5" />{item.label}
                            </div>
                        ))}
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600 mt-3 mb-2 px-2">Spend & Assets</div>
                        {[{ label: 'Expenses', icon: Package }, { label: 'Compliance', icon: Shield }].map(item => (
                            <div key={item.label} className="flex items-center gap-2 px-2 py-2 rounded-lg text-[12px] font-semibold text-slate-500">
                                <item.icon className="w-3.5 h-3.5" />{item.label}
                            </div>
                        ))}
                    </div>
                    {/* Main */}
                    <div className="flex-1 p-5 overflow-hidden">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-400 mb-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse inline-block" />MISSION CONTROL
                                </div>
                                <h2 className="text-xl font-black text-white">Control Room</h2>
                                <p className="text-[11px] text-slate-500 mt-0.5">A live operational view of revenue health, collections, and status flow.</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border border-slate-700 rounded-lg">Review Overdue</button>
                                <button className="px-3 py-1.5 text-[11px] font-semibold text-teal-400 border border-teal-500/40 rounded-lg bg-teal-500/10">Add Client</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            {[
                                { label: 'PENDING REVENUE', val: '₹27.03L', sub: '500 invoices pending', icon: FileText, color: 'teal', trend: '+12%' },
                                { label: 'ACTION REQUIRED', val: '₹13.03L', sub: '250 overdue payments', icon: AlertTriangle, color: 'orange', dot: true },
                                { label: 'CASH COLLECTED', val: '₹13.17L', sub: '65% of monthly goal', icon: Activity, color: 'teal' },
                                { label: 'ACTIVE CLIENTS', val: '4,004', sub: 'Manage clients', icon: Users, color: 'slate' },
                            ].map((kpi, i) => (
                                <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                    className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3.5 relative">
                                    {kpi.dot && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-3 ${kpi.color === 'teal' ? 'bg-teal-500/15' : kpi.color === 'orange' ? 'bg-orange-500/15' : 'bg-slate-500/15'}`}>
                                        <kpi.icon className={`w-3.5 h-3.5 ${kpi.color === 'teal' ? 'text-teal-400' : kpi.color === 'orange' ? 'text-orange-400' : 'text-slate-400'}`} />
                                    </div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 mb-1">{kpi.label}</div>
                                    <div className="font-black text-white text-lg leading-none mb-1">{kpi.val}</div>
                                    <div className={`text-[10px] font-semibold ${kpi.color === 'orange' ? 'text-orange-400' : 'text-teal-400'}`}>{kpi.sub}</div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-[12px] font-bold text-white"><Activity className="w-3.5 h-3.5 text-teal-400" />Live Monitoring</div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Systems Nominal</div>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { type: 'Payment Received', detail: 'Received ₹3,540 via cash', time: '17:57:54' },
                                        { type: 'Payment Received', detail: 'Received ₹60 via upi', time: '16:21:09' },
                                        { type: 'Invoice Overdue', detail: 'STR-5739-2359 · ₹8,644', time: '09:00:00' },
                                    ].map((ev, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white/[0.02] rounded-lg px-3 py-2">
                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${ev.type.includes('Received') ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                                                <CreditCard className={`w-3 h-3 ${ev.type.includes('Received') ? 'text-emerald-400' : 'text-rose-400'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-semibold text-slate-200">{ev.type}</div>
                                                <div className="text-[10px] text-slate-500 truncate">{ev.detail}</div>
                                            </div>
                                            <div className="text-[10px] text-teal-400 font-mono flex-shrink-0">{ev.time}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                                <div className="flex items-center gap-2 text-[12px] font-bold text-white mb-3"><Clock className="w-3.5 h-3.5 text-orange-400" />Priority Queue</div>
                                <div className="space-y-2.5">
                                    {[
                                        { name: 'Stress Client 419', inv: 'STR-5740-2419', amt: '₹2,871' },
                                        { name: 'Stress Client 415', inv: 'STR-5740-2415', amt: '₹6,817' },
                                        { name: 'Stress Client 411', inv: 'STR-5740-2411', amt: '₹10,103' },
                                    ].map((c, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-semibold text-slate-200 truncate">{c.name}</div>
                                                <div className="text-[10px] text-slate-500">{c.inv}</div>
                                            </div>
                                            <div className="text-[11px] font-black text-rose-400 flex-shrink-0">{c.amt}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InvoicesMock() {
    const rows = [
        { num: 'STR-5739-2289', date: '21 Feb 2026', customer: 'Stress Client 289', total: '₹8,034', status: 'Paid', sc: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
        { num: 'STR-5739-2359', date: '21 Feb 2026', customer: 'Stress Client 359', total: '₹8,644', status: 'Overdue', sc: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
        { num: 'STR-5738-2119', date: '21 Feb 2026', customer: 'Stress Client 119', total: '₹4,220', status: 'Overdue', sc: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
        { num: 'STR-5737-1826', date: '21 Feb 2026', customer: 'Stress Client 826', total: '₹6,071', status: 'Sent', sc: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
        { num: 'STR-5736-1691', date: '21 Feb 2026', customer: 'Stress Client 691', total: '₹5,893', status: 'Overdue', sc: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
        { num: 'STR-5740-2432', date: '20 Feb 2026', customer: 'Stress Client 432', total: '₹3,521', status: 'Draft', sc: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
    ];
    return (
        <div className="bg-[#0a0e1a] p-4">
            <div className="flex items-center justify-between mb-4">
                <div><h3 className="font-black text-white text-lg">Invoices</h3><p className="text-[11px] text-slate-500">Manage and track your business payments.</p></div>
                <button className="flex items-center gap-1.5 px-3 py-2 bg-teal-500 text-white text-[12px] font-bold rounded-lg">+ New Invoice</button>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/[0.05]">
                <div className="grid grid-cols-5 px-3 py-2 bg-white/[0.02] border-b border-white/[0.04]">
                    {['NUMBER', 'DATE', 'CUSTOMER', 'TOTAL', 'STATUS'].map(h => <div key={h} className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">{h}</div>)}
                </div>
                {rows.map((row, i) => (
                    <div key={i} className="grid grid-cols-5 items-center px-3 py-2.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                        <div className="text-[11px] font-mono text-teal-400">{row.num}</div>
                        <div className="text-[11px] text-slate-400">{row.date}</div>
                        <div className="text-[11px] text-slate-300">{row.customer}</div>
                        <div className="text-[11px] font-semibold text-white">{row.total}</div>
                        <div><span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${row.sc}`}>{row.status}</span></div>
                    </div>
                ))}
            </div>
            <div className="mt-2 text-[10px] text-slate-600 font-medium">PAGE 1 OF 100 · 1000 TOTAL INVOICES &nbsp;·&nbsp; Total: ₹5,398,237</div>
        </div>
    );
}

function ReportsMock() {
    return (
        <div className="bg-[#0a0e1a] p-4">
            <h3 className="font-black text-white text-lg mb-1">Reports</h3>
            <p className="text-[11px] text-slate-500 mb-4">Real-time insights into your business performance and health.</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                    { label: 'TOTAL REVENUE', val: '₹13,17,615', color: 'text-teal-400' },
                    { label: 'TOTAL EXPENSES', val: '₹1,499', color: 'text-orange-400' },
                    { label: 'NET PROFIT', val: '₹13,16,116', color: 'text-teal-400' },
                    { label: 'AVG MARGIN', val: '100%', color: 'text-violet-400' },
                ].map((s, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                        <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 mb-2">{s.label}</div>
                        <div className={`font-black text-[14px] leading-none ${s.color}`}>{s.val}</div>
                    </div>
                ))}
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-[11px] font-bold text-white">Revenue vs Expenses</div>
                        <div className="text-[10px] text-slate-500">Monthly cash flow trends</div>
                    </div>
                    <div className="flex gap-3 text-[10px]">
                        <div className="flex items-center gap-1 text-teal-400"><span className="w-2 h-2 rounded-full bg-teal-400 inline-block" /> Revenue</div>
                        <div className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> Expenses</div>
                    </div>
                </div>
                <div className="relative h-24">
                    <svg viewBox="0 0 300 80" className="w-full h-full">
                        <defs>
                            <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(20,184,166,0.3)" />
                                <stop offset="100%" stopColor="rgba(20,184,166,0)" />
                            </linearGradient>
                        </defs>
                        <path d="M 10 70 C 50 70 90 20 150 10 C 210 2 270 8 290 5" stroke="rgb(20,184,166)" strokeWidth="2" fill="none" />
                        <path d="M 10 70 C 50 70 90 20 150 10 C 210 2 270 8 290 5 L 290 80 L 10 80 Z" fill="url(#revGrad2)" />
                        <path d="M 10 75 C 80 75 150 72 290 73" stroke="rgb(100,116,139)" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />
                        <rect x="95" y="15" width="80" height="42" rx="5" fill="rgba(15,20,35,0.95)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                        <text x="105" y="28" fontSize="7" fill="rgb(148,163,184)">2026-02</text>
                        <text x="105" y="38" fontSize="6.5" fill="rgb(20,184,166)">Revenue ₹13,17,615</text>
                        <text x="105" y="47" fontSize="6.5" fill="rgb(148,163,184)">Expenses ₹1,499</text>
                        <text x="105" y="56" fontSize="6.5" fill="rgb(20,184,166)">Net +₹13,16,116</text>
                    </svg>
                </div>
            </div>
        </div>
    );
}

// ─── Tier config for landing page ──────────────────────────────────────────
const TIERS = [
    {
        slug: 'starter',
        name: 'Starter',
        tagline: 'Get started for free',
        price: 0,
        priceAnnual: 0,
        icon: Star,
        gradient: 'from-gray-400 to-gray-600',
        borderColor: 'border-white/[0.08]',
        bgTint: 'bg-white/[0.02]',
        features: [
            '5 Invoices',
            '10 AI Requests/day',
            'PDF Download',
            '20 Products & Customers',
            'Basic Reports',
        ],
        notIncluded: ['Email Invoices', 'Bulk Email', 'Priority Support'],
        cta: 'Get Started Free',
    },
    {
        slug: 'freelancer',
        name: 'Freelancer',
        tagline: 'For solo hustlers scaling up',
        price: 499,
        priceAnnual: 4990,
        icon: Zap,
        gradient: 'from-blue-500 to-indigo-600',
        borderColor: 'border-blue-500/30',
        bgTint: 'bg-blue-500/5',
        popular: true,
        features: [
            'Unlimited Invoices',
            '100 AI Requests/day',
            'Email Invoices',
            'PDF Download',
            'Full Reports & Analytics',
            'Unlimited Products & Customers',
            'Basic Inventory',
        ],
        cta: 'Start Freelancer',
    },
    {
        slug: 'smb',
        name: 'SMB',
        tagline: 'For growing teams & agencies',
        price: 1499,
        priceAnnual: 14990,
        icon: Briefcase,
        gradient: 'from-violet-500 to-purple-700',
        borderColor: 'border-violet-500/30',
        bgTint: 'bg-violet-500/5',
        features: [
            'Unlimited Everything',
            '500 AI Requests/day',
            'Email + Bulk Email',
            'Priority Support',
            'Full Inventory Management',
            'Advanced Reports',
        ],
        cta: 'Go SMB',
    },
    {
        slug: 'ca_pro',
        name: 'CA Pro',
        tagline: 'White-label for CAs',
        price: 10000,
        priceAnnual: null,
        priceLabel: '₹10K + ₹500/mo',
        icon: Crown,
        gradient: 'from-amber-500 to-orange-600',
        borderColor: 'border-amber-500/30',
        bgTint: 'bg-amber-500/5',
        features: [
            'White-label Branding',
            'Multi-client Management',
            '200 AI Requests/day',
            'Compliance-ready Templates',
            'Priority Support',
            'Unlimited Invoices',
        ],
        cta: 'Start CA Pro',
    },
    {
        slug: 'enterprise',
        name: 'Enterprise',
        tagline: 'Custom solutions at scale',
        price: null,
        priceAnnual: null,
        icon: Building2,
        gradient: 'from-emerald-500 to-teal-700',
        borderColor: 'border-emerald-500/30',
        bgTint: 'bg-emerald-500/5',
        features: [
            'Everything in SMB',
            'Unlimited AI Requests',
            'Custom Integrations',
            'Dedicated Account Manager',
            'SLA Guarantee',
            'Custom Reports',
        ],
        cta: 'Contact Sales',
    },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export const Landing: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
    const heroO = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    const words = ['Payments.', 'Invoices.', 'Overdue Bills.', 'Revenue.'];
    const [wIdx, setWIdx] = useState(0);
    const [isAnnual, setIsAnnual] = useState(false);

    useEffect(() => {
        const id = setInterval(() => setWIdx(i => (i + 1) % words.length), 2800);
        return () => clearInterval(id);
    }, []);

    return (
        <div
            className="min-h-screen bg-[#050810] text-white overflow-x-hidden selection:bg-teal-500/30"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bricolage+Grotesque:wght@700;800;900&display=swap');
                .display { font-family: 'Bricolage Grotesque', sans-serif; }
                html { scroll-behavior: smooth; }
            `}</style>

            {/* BG */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[#050810]" />
                <Blob className="w-[600px] h-[600px] -top-40 -left-20 opacity-25 blur-[100px]" color="rgba(20,184,166,0.2)" delay={0} />
                <Blob className="w-[500px] h-[500px] top-1/3 -right-20 opacity-15 blur-[80px]" color="rgba(14,165,233,0.18)" delay={6} />
                <Blob className="w-[400px] h-[400px] bottom-0 left-1/3 opacity-12 blur-[80px]" color="rgba(20,184,166,0.15)" delay={12} />
                <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'linear-gradient(rgba(20,184,166,1) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)', backgroundSize: '72px 72px' }} />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,transparent_50%,#050810_100%)]" />
            </div>

            {/* NAV */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-5 pt-4">
                <div className="max-w-6xl mx-auto">
                    <div className={`flex items-center justify-between px-5 py-3 rounded-2xl transition-all duration-400 ${scrolled ? 'bg-[#050810]/90 backdrop-blur-2xl border border-white/[0.07] shadow-2xl' : 'border border-transparent'}`}>
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <div className="absolute inset-0 bg-teal-500 blur-lg opacity-40 rounded-lg" />
                                <div className="relative w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
                                    <Zap className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <span className="display font-black text-xl text-white tracking-tight">Malika <span className="text-teal-400">AI</span></span>
                        </div>
                        <div className="hidden md:flex items-center gap-7">
                            {[['#features', 'Features'], ['#how-it-works', 'How it Works'], ['#pricing', 'Pricing'], ['#faq', 'FAQ']].map(([href, label]) => (
                                <a key={label} href={href} className="text-[13px] font-semibold text-slate-400 hover:text-white transition-colors">{label}</a>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl text-[13px] font-black transition-all hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] active:scale-95">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section ref={heroRef} className="relative pt-36 pb-16 lg:pt-52 lg:pb-20 overflow-hidden">
                <motion.div style={{ y: heroY, opacity: heroO }} className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-14">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-[11px] font-black uppercase tracking-[0.2em] mb-8">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                                India's Financial OS for Agencies
                            </div>
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 0.15 }}
                            className="display font-black leading-[0.88] tracking-tight mb-6" style={{ fontSize: 'clamp(46px, 9vw, 104px)' }}>
                            <span className="text-white">Stop Chasing</span>
                            <br />
                            <span className="relative inline-block">
                                <AnimatePresence mode="wait">
                                    <motion.span key={wIdx}
                                        className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 inline-block"
                                        initial={{ y: 55, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -55, opacity: 0 }}
                                        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}>
                                        {words[wIdx]}
                                    </motion.span>
                                </AnimatePresence>
                            </span>
                        </motion.h1>
                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.32 }}
                            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                            Malika AI is the complete Financial OS for Indian marketing agencies and freelancers — invoicing, collections, payments, compliance, and reporting, all in one place.
                        </motion.p>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.48 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/login"
                                className="group w-full sm:w-auto px-10 bg-teal-500 hover:bg-teal-400 text-white rounded-2xl font-black text-[17px] transition-all hover:shadow-[0_0_40px_rgba(20,184,166,0.4)] hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2.5"
                                style={{ paddingTop: '1.1rem', paddingBottom: '1.1rem' }}>
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#product"
                                className="w-full sm:w-auto px-10 bg-white/[0.04] border border-white/[0.1] text-white rounded-2xl font-black text-[17px] hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2"
                                style={{ paddingTop: '1.1rem', paddingBottom: '1.1rem' }}>
                                See the Product
                            </a>
                        </motion.div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.7 }}
                            className="flex flex-wrap items-center justify-center gap-6 mt-10 text-[13px] font-semibold text-slate-500">
                            {['GST-compliant invoicing', 'UPI & Razorpay ready', 'Built for Indian agencies', 'No credit card needed'].map((f, i) => (
                                <div key={i} className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />{f}</div>
                            ))}
                        </motion.div>
                    </div>
                    <motion.div id="product" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6 }}>
                        <DashboardMockup />
                    </motion.div>
                </motion.div>
            </section>

            {/* STATS */}
            <section className="py-16 relative z-10">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.06]">
                        {[
                            { to: 1000, suffix: '+', label: 'Invoices Managed' },
                            { to: 9, suffix: ' modules', label: 'Fully Integrated' },
                            { to: 100, suffix: '%', label: 'GST Compliant' },
                            { to: 5, suffix: ' min', label: 'Setup Time' },
                        ].map((s, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="bg-[#050810] p-8 text-center">
                                <div className="display font-black text-4xl text-white mb-2"><Counter to={s.to} suffix={s.suffix} /></div>
                                <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{s.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="py-24 relative z-10">
                <div className="max-w-6xl mx-auto px-6 space-y-28">
                    <div className="text-center">
                        <div className="text-teal-400 font-black uppercase tracking-[0.22em] text-[11px] mb-4">Complete Platform</div>
                        <h2 className="display font-black text-white leading-tight" style={{ fontSize: 'clamp(30px, 5vw, 60px)' }}>
                            Every financial tool<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">your agency needs.</span>
                        </h2>
                    </div>

                    {/* Invoice feature */}
                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                        className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[11px] font-black uppercase tracking-[0.18em] mb-5">Invoice Management</div>
                            <h3 className="display font-black text-white text-3xl md:text-4xl mb-4 leading-tight">Every invoice. Every status. Total control.</h3>
                            <p className="text-slate-400 text-[15px] leading-relaxed mb-6">Create, send, and track unlimited invoices with real-time status updates — Paid, Sent, Overdue, Draft. Search, filter, export, and send bulk emails all from one view.</p>
                            <ul className="space-y-3">
                                {['Unlimited GST-compliant invoices', 'Bulk email sending to overdue clients', '1,000+ invoice pagination with instant search', 'One-click PDF download and sharing'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[14px] text-slate-300 font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />{f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-2 bg-teal-500/5 rounded-2xl blur-xl" />
                            <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl"><InvoicesMock /></div>
                        </div>
                    </motion.div>

                    {/* Control Room */}
                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                        className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="lg:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[11px] font-black uppercase tracking-[0.18em] mb-5">Live Monitoring</div>
                            <h3 className="display font-black text-white text-3xl md:text-4xl mb-4 leading-tight">Your revenue command centre.</h3>
                            <p className="text-slate-400 text-[15px] leading-relaxed mb-6">The Control Room shows live payment events, overdue prioritisation, and total revenue health in real-time. See who just paid and who needs a nudge, the moment it happens.</p>
                            <ul className="space-y-3">
                                {['Live payment event stream (UPI, Cash, Card)', 'Priority queue of overdue clients by value', 'Pending revenue vs cash collected view', 'Action Required alerts with one-click resolution'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[14px] text-slate-300 font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />{f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="lg:order-1 relative">
                            <div className="absolute -inset-2 bg-teal-500/5 rounded-2xl blur-xl" />
                            <div className="relative bg-[#0a0e1a] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-400">Mission Control · Live</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {[
                                        { label: 'Pending Revenue', val: '₹27,03,800', color: 'text-white', sub: '500 invoices pending' },
                                        { label: 'Action Required', val: '₹13,03,000', color: 'text-orange-400', sub: '250 overdue' },
                                        { label: 'Cash Collected', val: '₹13,17,600', color: 'text-teal-400', sub: '65% of goal' },
                                        { label: 'Active Clients', val: '4,004', color: 'text-white', sub: 'Manage clients' },
                                    ].map((k, i) => (
                                        <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                                            <div className="text-[9px] text-slate-600 font-semibold uppercase tracking-wider mb-1">{k.label}</div>
                                            <div className={`font-black text-[16px] ${k.color}`}>{k.val}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">{k.sub}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white/[0.02] rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-bold text-white"><Activity className="w-3.5 h-3.5 text-teal-400" />Live Events</div>
                                    {[
                                        { ev: 'Payment Received', detail: '₹3,540 via cash · Stress Client 419', t: '17:57' },
                                        { ev: 'Payment Received', detail: '₹60 via UPI · Stress Client 415', t: '16:21' },
                                        { ev: 'Invoice Overdue', detail: 'STR-5739-2359 · ₹8,644', t: '09:00' },
                                    ].map((e, i) => (
                                        <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.03] last:border-0">
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${e.ev.includes('Received') ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                                                <CreditCard className={`w-2.5 h-2.5 ${e.ev.includes('Received') ? 'text-emerald-400' : 'text-rose-400'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-semibold text-slate-200">{e.ev}</div>
                                                <div className="text-[10px] text-slate-500 truncate">{e.detail}</div>
                                            </div>
                                            <div className="text-[10px] text-teal-400 font-mono">{e.t}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Reports */}
                    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                        className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[11px] font-black uppercase tracking-[0.18em] mb-5">Analytics & Reports</div>
                            <h3 className="display font-black text-white text-3xl md:text-4xl mb-4 leading-tight">P&L in real-time. No accountant needed.</h3>
                            <p className="text-slate-400 text-[15px] leading-relaxed mb-6">Malika's Reports module tracks total revenue, expenses, net profit, and average margin automatically. Revenue vs Expenses charts with comparative analysis give you the full financial picture every month.</p>
                            <ul className="space-y-3">
                                {['Automatic P&L calculation', 'Revenue vs Expenses trend chart', 'Comparative month-by-month analysis', 'One-click export'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[14px] text-slate-300 font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />{f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-2 bg-teal-500/5 rounded-2xl blur-xl" />
                            <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl"><ReportsMock /></div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FULL FEATURE GRID */}
            <section className="py-20 relative z-10">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <h2 className="display font-black text-white text-3xl md:text-4xl">Everything included. No add-ons.</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { icon: FileText, title: 'Smart Invoice Generation', desc: 'AI-assisted invoices with GST, TDS, line items, and your branding in seconds.' },
                            { icon: Target, title: 'Debt Hunter Collections', desc: 'Automated follow-ups via email that escalate intelligently based on client history.' },
                            { icon: CreditCard, title: 'Payment Reconciliation', desc: 'Match incoming UPI, cash, card, and cheque payments to invoices automatically.' },
                            { icon: Calendar, title: 'Invoice Calendar', desc: 'See all due dates, overdue bills, and payment deadlines on a visual calendar.' },
                            { icon: Users, title: 'Client Management', desc: 'Full client profiles with payment history, contact info, and invoice linkage.' },
                            { icon: BarChart3, title: 'Revenue Analytics', desc: 'Real-time P&L, cash flow trends, and comparative month-by-month analysis.' },
                            { icon: Package, title: 'Inventory Tracking', desc: 'Track products, stock levels, reorder alerts, and AI-driven replenishment strategy.' },
                            { icon: Shield, title: 'Compliance Manager', desc: 'Track GST filings, annual returns, and regulatory deadlines — never miss one.' },
                            { icon: Activity, title: 'Expense Tracking', desc: 'Categorise and monitor business expenses with share-of-total breakdowns.' },
                        ].map((f, i) => (
                            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                                whileHover={{ y: -4 }}
                                className="group p-6 bg-white/[0.025] border border-white/[0.06] rounded-2xl hover:border-teal-500/30 hover:bg-white/[0.04] transition-all cursor-default">
                                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-colors">
                                    <f.icon className="text-teal-400" style={{ width: 18, height: 18 }} />
                                </div>
                                <h3 className="font-black text-white text-[15px] mb-2">{f.title}</h3>
                                <p className="text-slate-400 text-[13px] leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="py-24 relative z-10">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="text-teal-400 font-black uppercase tracking-[0.22em] text-[11px] mb-4">Get Running Fast</div>
                        <h2 className="display font-black text-white leading-tight" style={{ fontSize: 'clamp(30px, 5vw, 60px)' }}>
                            Up and running<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">in under 5 minutes.</span>
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-4 gap-5 relative">
                        <div className="hidden md:block absolute top-14 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
                        {[
                            { n: '01', t: 'Create Account', d: 'Sign up with your email. No credit card required. Your Financial OS is ready instantly.' },
                            { n: '02', t: 'Add Your Clients', d: 'Import or add clients manually. Malika stores all their billing info for fast invoicing.' },
                            { n: '03', t: 'Create an Invoice', d: 'Generate a GST-compliant invoice in seconds. Customise, send, or save as draft.' },
                            { n: '04', t: 'Activate Collections', d: 'Turn on automated follow-ups for overdue invoices and let Malika do the chasing.' },
                        ].map((s, i) => (
                            <motion.div key={s.n} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                                className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-6">
                                <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-5">
                                    <span className="display font-black text-[13px] text-teal-400">{s.n}</span>
                                </div>
                                <h3 className="display font-black text-white text-[16px] mb-2">{s.t}</h3>
                                <p className="text-slate-400 text-[13px] leading-relaxed">{s.d}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section id="pricing" className="py-24 relative z-10 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <Blob className="w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-12 blur-[100px]" color="rgba(20,184,166,0.25)" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,transparent_40%,#050810_90%)]" />
                </div>
                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-12">
                        <div className="text-teal-400 font-black uppercase tracking-[0.22em] text-[11px] mb-4">Pricing</div>
                        <h2 className="display font-black text-white leading-tight mb-5" style={{ fontSize: 'clamp(30px, 5vw, 60px)' }}>Simple, honest pricing.</h2>
                        <p className="text-slate-400 max-w-xl mx-auto font-medium">Choose the plan that matches your business stage. Upgrade or downgrade anytime.</p>

                        {/* Monthly / Annual Toggle */}
                        <div className="mt-8 inline-flex items-center gap-2 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl">
                            <button
                                onClick={() => setIsAnnual(false)}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${!isAnnual ? 'bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'text-slate-400 hover:text-white'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsAnnual(true)}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isAnnual ? 'bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'text-slate-400 hover:text-white'}`}
                            >
                                Annual
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider">Save 17%</span>
                            </button>
                        </div>
                    </div>

                    {/* Tier Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 max-w-7xl mx-auto">
                        {TIERS.map((tier: any, idx: number) => (
                            <motion.div
                                key={tier.slug}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className={`relative rounded-3xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05] ${tier.bgTint} border ${tier.borderColor} ${tier.popular ? 'shadow-[0_0_30px_rgba(59,130,246,0.15)] md:-translate-y-2' : ''}`}
                            >
                                {tier.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-full px-4 text-center">
                                        <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-blue-500/30">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="mt-2 mb-4">
                                    <div className={`inline-flex p-2.5 rounded-2xl bg-gradient-to-br ${tier.gradient} shadow-lg mb-4`}>
                                        <tier.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                                    <p className="text-[11px] text-slate-400 mt-1">{tier.tagline}</p>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        {tier.priceLabel ? (
                                            <span className="text-xl md:text-[18px] lg:text-[20px] font-black text-white leading-tight">
                                                {tier.priceLabel}
                                            </span>
                                        ) : (
                                            <>
                                                <span className="text-3xl font-black text-white">
                                                    {tier.price === null ? 'Custom' : tier.price === 0 ? 'Free' : isAnnual && tier.priceAnnual ? `₹${Math.round(tier.priceAnnual / 12).toLocaleString()}` : `₹${tier.price.toLocaleString()}`}
                                                </span>
                                                {tier.price !== null && tier.price > 0 && (
                                                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">/mo</span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    {isAnnual && tier.priceAnnual && !tier.priceLabel && (
                                        <p className="text-[10px] text-emerald-400 font-semibold mt-1">Billed ₹{tier.priceAnnual.toLocaleString()}/year</p>
                                    )}
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {tier.features.map((f: any, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-[12px] text-slate-300 font-medium tracking-tight">
                                            <div className={`p-0.5 rounded-full bg-gradient-to-br ${tier.gradient} mt-0.5 flex-shrink-0`}>
                                                <CheckCircle2 className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                            </div>
                                            <span className="leading-snug">{f}</span>
                                        </li>
                                    ))}
                                    {tier.notIncluded?.map((f: any, i: number) => (
                                        <li key={`no-${i}`} className="flex items-start gap-2 text-[12px] text-slate-600 font-medium tracking-tight">
                                            <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" strokeWidth={2} />
                                            <span className="line-through leading-snug">{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link to="/login" className={`w-full py-3 px-4 rounded-xl text-center text-[12px] font-black uppercase tracking-wider transition-all duration-300 ${tier.popular ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-white/[0.05] text-white hover:bg-white/[0.1] border border-white/[0.1]'}`}>
                                    {tier.cta}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-20 relative z-10">
                <div className="max-w-2xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="display font-black text-white text-3xl md:text-4xl">Questions answered.</h2>
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-8 py-4">
                        {[
                            { q: 'Is this built for Indian businesses?', a: 'Yes, completely. Malika handles GST-compliant invoicing, TDS, INR-native reporting, and is designed around how Indian agencies and freelancers actually bill clients — including UPI payment tracking and reconciliation.' },
                            { q: 'Can I import my existing invoices and clients?', a: 'You can add clients manually or in bulk. You can start fresh with Malika immediately and build your invoice history from day one.' },
                            { q: 'How does the Debt Hunter actually work?', a: 'You activate it per invoice. Malika then sends politely-worded automated email reminders on a smart schedule — escalating tone based on how overdue the invoice is. No spam, no robotic messages.' },
                            { q: 'Is my financial data secure?', a: 'Yes. All data is encrypted in transit and at rest. We follow industry-standard security practices. Your invoice and payment data is never shared or sold.' },
                            { q: "Do I need to be technical to use it?", a: 'Not at all. Malika is designed for agency owners and freelancers, not developers. If you can use Gmail, you can use Malika. The setup takes under 5 minutes.' },
                            { q: "What payment methods does Malika track?", a: 'Malika tracks UPI, cash, card, cheque, and net banking payments. You can manually record payments or link with Razorpay for automatic reconciliation.' },
                        ].map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-28 lg:py-40 relative z-10 text-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <Blob className="w-[700px] h-[700px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-18 blur-[100px]" color="rgba(20,184,166,0.25)" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,transparent_30%,#050810_85%)]" />
                </div>
                <div className="max-w-3xl mx-auto px-6 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="display font-black text-white leading-[0.9] tracking-tight mb-6" style={{ fontSize: 'clamp(42px, 8vw, 92px)' }}>
                            Get paid.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-400">Stay paid.</span>
                        </h2>
                        <p className="text-slate-400 text-xl max-w-xl mx-auto mb-10">Start your free trial today. No credit card, no setup fees, no catch.</p>
                        <Link to="/login" className="group inline-flex items-center gap-3 px-12 py-5 bg-teal-500 hover:bg-teal-400 text-white rounded-2xl font-black text-xl transition-all hover:shadow-[0_0_50px_rgba(20,184,166,0.5)] hover:-translate-y-1 active:scale-95">
                            Get Started
                            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 border-t border-white/[0.05] bg-black/20 backdrop-blur-xl relative z-10">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-teal-500 blur-md opacity-40 rounded-lg" />
                            <div className="relative w-7 h-7 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-lg flex items-center justify-center">
                                <Zap className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>
                        <span className="display font-black text-white tracking-tight">Malika AI</span>
                        <span className="text-slate-600 text-[12px] ml-1">— Financial OS for Agencies</span>
                    </div>
                    <div className="flex gap-7 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {['Privacy', 'Terms', 'Contact'].map(l => <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>)}
                    </div>
                    <div className="text-slate-600 text-[11px] font-semibold">© {new Date().getFullYear()} Laboratory Malika, Inc.</div>
                </div>
            </footer>
        </div>
    );
};