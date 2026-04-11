import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Target, BarChart3, ArrowRight, Shield,
    CheckCircle2, Lock,
    ChevronDown, Clock, Users,
    FileText, CreditCard, Calendar, Package,
    AlertTriangle, Activity,
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

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionEyebrow({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-teal-400/90 font-medium uppercase tracking-[0.18em] text-[11px] mb-3">
            {children}
        </div>
    );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
    return (
        <motion.div
            variants={fadeUp}
            className="group relative p-6 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:border-teal-500/25 hover:bg-white/[0.03] transition-colors"
        >
            <div className="w-9 h-9 rounded-lg mb-4 flex items-center justify-center bg-teal-500/10 border border-teal-500/20">
                <Icon className="text-teal-400" style={{ width: 16, height: 16 }} />
            </div>
            <h3 className="font-semibold text-white text-[14px] mb-1.5 tracking-tight">{title}</h3>
            <p className="text-slate-400 text-[13px] leading-relaxed">{desc}</p>
        </motion.div>
    );
}

// ─── Dashboard mockup ─────────────────────────────────────────────────────────
function DashboardMockup() {
    const events = [
        { type: 'Payment received', detail: '₹3,540 via UPI', time: '17:57', ok: true },
        { type: 'Payment received', detail: '₹60 via UPI', time: '16:21', ok: true },
        { type: 'Invoice overdue', detail: 'CEX-2026-0048 · ₹8,644', time: '09:00', ok: false },
    ];
    return (
        <div className="relative">
            <div className="relative bg-[#080c18] border border-white/[0.07] rounded-2xl overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
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
                                <div className="text-[9px] text-slate-500">Financial OS</div>
                            </div>
                        </div>
                        <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600 mb-1.5 px-2">Workspace</div>
                        {[{ label: 'Overview', icon: Activity, active: true }, { label: 'Calendar', icon: Calendar }].map(item => (
                            <div key={item.label} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11.5px] font-medium ${item.active ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' : 'text-slate-500'}`}>
                                <item.icon className="w-3.5 h-3.5" />{item.label}
                            </div>
                        ))}
                        <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600 mt-3 mb-1.5 px-2">Revenue</div>
                        {[{ label: 'Invoices', icon: FileText }, { label: 'Payments', icon: CreditCard }, { label: 'Customers', icon: Users }].map(item => (
                            <div key={item.label} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11.5px] font-medium text-slate-500"><item.icon className="w-3.5 h-3.5" />{item.label}</div>
                        ))}
                        <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600 mt-3 mb-1.5 px-2">Spend</div>
                        {[{ label: 'Expenses', icon: Package }, { label: 'Compliance', icon: Shield }].map(item => (
                            <div key={item.label} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11.5px] font-medium text-slate-500"><item.icon className="w-3.5 h-3.5" />{item.label}</div>
                        ))}
                    </div>
                    <div className="flex-1 p-5 overflow-hidden">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 mb-1">Workspace</div>
                                <h2 className="text-base font-semibold text-white tracking-tight">Overview</h2>
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
        { num: 'CEX-2026-0049', date: '21 Feb 2026', customer: 'Pixel Republic Studio', total: '₹8,034', status: 'Paid', sc: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
        { num: 'CEX-2026-0048', date: '19 Feb 2026', customer: 'BlueSky Marketing', total: '₹8,644', status: 'Overdue', sc: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
        { num: 'CEX-2026-0047', date: '18 Feb 2026', customer: 'TechFlow Solutions', total: '₹4,220', status: 'Overdue', sc: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
        { num: 'CEX-2026-0046', date: '15 Feb 2026', customer: 'Nexus Creatives Pvt', total: '₹6,071', status: 'Sent', sc: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
        { num: 'CEX-2026-0045', date: '14 Feb 2026', customer: 'Craft & Canvas Co.', total: '₹5,893', status: 'Overdue', sc: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
    ];
    return (
        <div className="bg-[#0a0e1a] p-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-white text-[15px] tracking-tight">Invoices</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Track customer billing</p>
                </div>
                <button className="px-3 py-1.5 bg-teal-500 text-white text-[11px] font-medium rounded-md">+ New invoice</button>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/[0.05]">
                <div className="grid grid-cols-5 px-3 py-2 bg-white/[0.02] border-b border-white/[0.04]">
                    {['Number', 'Date', 'Customer', 'Total', 'Status'].map(h => (
                        <div key={h} className="text-[9px] font-medium uppercase tracking-[0.13em] text-slate-500">{h}</div>
                    ))}
                </div>
                {rows.map((row, i) => (
                    <div key={i} className="grid grid-cols-5 items-center px-3 py-2.5 border-b border-white/[0.025] last:border-0 hover:bg-white/[0.02] transition-colors">
                        <div className="text-[10px] font-mono text-teal-300">{row.num}</div>
                        <div className="text-[10px] text-slate-500">{row.date}</div>
                        <div className="text-[10px] text-slate-300">{row.customer}</div>
                        <div className="text-[10px] font-medium text-white">{row.total}</div>
                        <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full border w-fit ${row.sc}`}>{row.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Reports mock ─────────────────────────────────────────────────────────────
function ReportsMock() {
    return (
        <div className="bg-[#0a0e1a] p-4">
            <h3 className="font-semibold text-white text-[15px] tracking-tight">Reports</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">Real-time financial insights</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                    { label: 'Total revenue', val: '₹13,17,615', color: 'text-teal-300' },
                    { label: 'Expenses', val: '₹1,499', color: 'text-orange-300' },
                    { label: 'Net profit', val: '₹13,16,116', color: 'text-teal-300' },
                    { label: 'Avg margin', val: '100%', color: 'text-violet-300' },
                ].map((s, i) => (
                    <div key={i} className="bg-white/[0.025] border border-white/[0.05] rounded-lg p-2.5">
                        <div className="text-[9px] font-medium uppercase tracking-[0.13em] text-slate-500 mb-1.5">{s.label}</div>
                        <div className={`font-semibold text-[13px] leading-none tracking-tight ${s.color}`}>{s.val}</div>
                    </div>
                ))}
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-semibold text-white">Revenue vs expenses</div>
                    <div className="flex gap-3 text-[10px]">
                        <span className="flex items-center gap-1 text-teal-300"><span className="w-2 h-2 rounded-full bg-teal-400 inline-block" /> Revenue</span>
                        <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> Expenses</span>
                    </div>
                </div>
                <svg viewBox="0 0 300 70" className="w-full h-20">
                    <defs>
                        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(20,184,166,0.3)" />
                            <stop offset="100%" stopColor="rgba(20,184,166,0)" />
                        </linearGradient>
                    </defs>
                    <path d="M 10 62 C 50 62 90 15 150 6 C 210 -2 270 4 290 1" stroke="rgb(20,184,166)" strokeWidth="2" fill="none" />
                    <path d="M 10 62 C 50 62 90 15 150 6 C 210 -2 270 4 290 1 L 290 70 L 10 70 Z" fill="url(#rg)" />
                    <path d="M 10 66 C 80 66 150 63 290 64" stroke="rgb(100,116,139)" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />
                </svg>
            </div>
        </div>
    );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FaqSection() {
    const [openIdx, setOpenIdx] = useState<number | null>(0);
    const faqs = [
        { q: `Who is ${brandProfile.name} built for?`, a: brandProfile.faqBuiltFor },
        { q: 'Are the invoices generated GST compliant?', a: 'Yes. Every invoice generated through CapitaEdgeX adheres to current Indian GST regulations, including SGST, CGST, IGST, and HSN/SAC configurations.' },
        { q: 'What happens if I cancel my subscription?', a: 'You can cancel at any time. You retain full access to your account and historical data through the end of your billing cycle, and you can export everything to CSV at any point.' },
        { q: 'Is there a limit on how many invoices I can send?', a: 'No. All paid plans include unlimited invoicing and unlimited client profiles.' },
    ];

    return (
        <section id="faq" className="py-24 relative z-10">
            <div className="max-w-3xl mx-auto px-6">
                <div className="text-center mb-14">
                    <SectionEyebrow>FAQ</SectionEyebrow>
                    <h2 className="font-semibold text-white text-3xl md:text-4xl tracking-tight">Frequently asked questions</h2>
                </div>
                <div className="space-y-2">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className={`border rounded-lg overflow-hidden transition-colors ${openIdx === i ? 'bg-white/[0.03] border-teal-500/25' : 'bg-white/[0.015] border-white/[0.06] hover:border-white/[0.1]'}`}
                        >
                            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full px-5 py-4 flex items-center justify-between text-left">
                                <span className={`font-medium text-[14px] ${openIdx === i ? 'text-white' : 'text-slate-200'}`}>{faq.q}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openIdx === i ? 'rotate-180 text-teal-400' : 'text-slate-500'}`} />
                            </button>
                            <AnimatePresence>
                                {openIdx === i && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}>
                                        <div className="px-5 pb-5 text-[13.5px] text-slate-400 leading-relaxed border-t border-white/[0.04] pt-3.5">
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
        <div className="relative min-h-screen bg-[#050810] text-white overflow-x-hidden selection:bg-teal-500/30"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
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

            {/* Background — restrained */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[#050810]" />
                <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,1) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,1) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full" style={{ background: 'radial-gradient(ellipse at center, rgba(20,184,166,0.10) 0%, transparent 60%)' }} />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,transparent_50%,#050810_100%)]" />
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#050810] to-transparent" />
            </div>

            {/* NAV */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-5 pt-4">
                <div className="max-w-6xl mx-auto">
                    <div className={`flex items-center justify-between px-5 py-3 rounded-xl transition-all duration-300 ${scrolled ? 'bg-[#050810]/85 backdrop-blur-xl border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.3)]' : 'border border-transparent'}`}>
                        <div className="flex items-center gap-2.5">
                            <Logo size={28} />
                            <span className="font-semibold text-[17px] text-white tracking-tight">Capita<span className="text-teal-400">EdgeX</span></span>
                        </div>
                        <div className="hidden md:flex items-center gap-7">
                            {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#pricing', 'Pricing'], ['#faq', 'FAQ']].map(([href, label]) => (
                                <a key={label} href={href} className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">
                                    {label}
                                </a>
                            ))}
                        </div>
                        <Link to="/login" className="bg-teal-500 hover:bg-teal-400 text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors">
                            Get started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section className="relative pt-36 pb-16 lg:pt-48 lg:pb-24 overflow-hidden">
                <div className="max-w-6xl mx-auto px-6 relative z-10 w-full">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] font-medium tracking-wide mb-7">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                Financial OS for Indian businesses
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.05 }}
                            className="font-semibold leading-[1.04] tracking-[-0.02em] mb-6 text-white"
                            style={{ fontSize: 'clamp(40px, 7vw, 76px)' }}
                        >
                            Invoicing, payments and<br />
                            compliance, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">in one place.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.15 }}
                            className="text-slate-400 text-[17px] md:text-[18px] max-w-2xl mx-auto mb-9 leading-relaxed"
                        >
                            {brandProfile.heroDescription}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-9"
                        >
                            <Link
                                to="/login"
                                className="w-full sm:w-auto px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-lg font-semibold text-[14px] transition-colors flex items-center justify-center gap-2"
                            >
                                Get started free
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="#product"
                                className="w-full sm:w-auto px-6 py-3 bg-white/[0.04] border border-white/[0.1] text-white rounded-lg font-semibold text-[14px] hover:bg-white/[0.07] transition-colors"
                            >
                                See the product
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-slate-500"
                        >
                            {['GST-compliant invoicing', 'UPI & Razorpay ready', 'No credit card required'].map(f => (
                                <div key={f} className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />{f}
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                <div id="product" className="max-w-6xl mx-auto px-6 relative z-10">
                    <DashboardMockup />
                </div>
            </section>

            {/* STATS */}
            <section className="py-16 relative z-10">
                <div className="max-w-5xl mx-auto px-6">
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.06]"
                    >
                        {[
                            { val: '1,000+', label: 'Invoices managed' },
                            { val: '9 modules', label: 'Fully integrated' },
                            { val: '100%', label: 'GST compliant' },
                            { val: '5 min', label: 'Setup time' },
                        ].map((s, i) => (
                            <motion.div key={i} variants={fadeUp} className="bg-[#050810] p-7 text-center">
                                <div className="font-semibold text-3xl text-white tracking-tight mb-1.5">{s.val}</div>
                                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-[0.12em]">{s.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="py-24 relative z-10">
                <div className="max-w-6xl mx-auto px-6 space-y-28">
                    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center max-w-2xl mx-auto">
                        <motion.div variants={fadeUp}>
                            <SectionEyebrow>Platform</SectionEyebrow>
                        </motion.div>
                        <motion.h2 variants={fadeUp} className="font-semibold text-white text-3xl md:text-5xl tracking-[-0.02em] leading-tight">
                            Every financial tool your business needs.
                        </motion.h2>
                    </motion.div>

                    {/* Invoice */}
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="grid lg:grid-cols-2 gap-14 items-center">
                        <div>
                            <SectionEyebrow>Invoice management</SectionEyebrow>
                            <h3 className="font-semibold text-white text-2xl md:text-3xl mb-4 leading-tight tracking-tight">Every invoice. Every status. <span className="text-teal-300">Total control.</span></h3>
                            <p className="text-slate-400 text-[15px] leading-relaxed mb-6">Create, send and track unlimited invoices with real-time status — Paid, Sent, Overdue, Draft.</p>
                            <ul className="space-y-2.5">
                                {[
                                    'Unlimited GST-compliant invoices',
                                    'Bulk email reminders for overdue clients',
                                    'Pagination and instant search across thousands',
                                    'One-click PDF download and sharing',
                                ].map(f => (
                                    <li key={f} className="flex items-center gap-3 text-[14px] text-slate-300"><CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />{f}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
                                <InvoicesMock />
                            </div>
                        </div>
                    </motion.div>

                    {/* Workspace */}
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="grid lg:grid-cols-2 gap-14 items-center">
                        <div className="lg:order-2">
                            <SectionEyebrow>Live workspace</SectionEyebrow>
                            <h3 className="font-semibold text-white text-2xl md:text-3xl mb-4 leading-tight tracking-tight">Your revenue, <span className="text-teal-300">at a glance.</span></h3>
                            <p className="text-slate-400 text-[15px] leading-relaxed mb-6">A live workspace that surfaces overdue invoices, payment events and revenue health in one view.</p>
                            <ul className="space-y-2.5">
                                {[
                                    'Live payment events from UPI, cash and card',
                                    'Priority queue of overdue clients by value',
                                    'Pending revenue versus cash collected',
                                    'One-click resolution for action items',
                                ].map(f => (
                                    <li key={f} className="flex items-center gap-3 text-[14px] text-slate-300"><CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />{f}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="lg:order-1 relative">
                            <div className="relative bg-[#0a0e1a] border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)] p-4">
                                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 mb-3">Workspace · Live</div>
                                <div className="grid grid-cols-2 gap-2.5 mb-3">
                                    {[
                                        { label: 'Pending revenue', val: '₹27,03,800', color: 'text-white', sub: '500 invoices pending' },
                                        { label: 'Action required', val: '₹13,03,000', color: 'text-orange-300', sub: '250 overdue' },
                                        { label: 'Cash collected', val: '₹13,17,600', color: 'text-teal-300', sub: '65% of goal' },
                                        { label: 'Active clients', val: '4,004', color: 'text-white', sub: 'Manage clients' },
                                    ].map((k, i) => (
                                        <div key={i} className="bg-white/[0.025] border border-white/[0.05] rounded-lg p-2.5">
                                            <div className="text-[9px] text-slate-500 font-medium uppercase tracking-[0.12em] mb-1">{k.label}</div>
                                            <div className={`font-semibold text-[15px] tracking-tight ${k.color}`}>{k.val}</div>
                                            <div className="text-[9.5px] text-slate-500 mt-0.5">{k.sub}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 mb-2 text-[10.5px] font-semibold text-white"><Activity className="w-3.5 h-3.5 text-teal-400" />Recent activity</div>
                                    {[
                                        { ev: 'Payment received', detail: '₹3,540 via UPI', t: '17:57', ok: true },
                                        { ev: 'Payment received', detail: '₹8,034 via Razorpay', t: '16:21', ok: true },
                                        { ev: 'Invoice overdue', detail: 'CEX-2026-0048 · ₹8,644', t: '09:00', ok: false },
                                    ].map((e, i) => (
                                        <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.03] last:border-0">
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${e.ok ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                                <CreditCard className={`w-2.5 h-2.5 ${e.ok ? 'text-emerald-400' : 'text-rose-400'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-medium text-slate-200">{e.ev}</div>
                                                <div className="text-[9.5px] text-slate-500 truncate">{e.detail}</div>
                                            </div>
                                            <div className="text-[9.5px] text-slate-500 font-mono">{e.t}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Reports */}
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="grid lg:grid-cols-2 gap-14 items-center">
                        <div>
                            <SectionEyebrow>Analytics & reports</SectionEyebrow>
                            <h3 className="font-semibold text-white text-2xl md:text-3xl mb-4 leading-tight tracking-tight">P&L in real time, <span className="text-teal-300">no accountant required.</span></h3>
                            <p className="text-slate-400 text-[15px] leading-relaxed mb-6">Track total revenue, expenses, net profit and average margin automatically. Compare months at a glance and export when you need to.</p>
                            <ul className="space-y-2.5">
                                {[
                                    'Automatic profit and loss calculation',
                                    'Revenue vs expenses trend chart',
                                    'Month-by-month comparative analysis',
                                    'One-click CSV and PDF export',
                                ].map(f => (
                                    <li key={f} className="flex items-center gap-3 text-[14px] text-slate-300"><CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />{f}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
                                <ReportsMock />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FEATURE GRID */}
            <section className="py-20 relative z-10">
                <div className="max-w-6xl mx-auto px-6">
                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 max-w-2xl mx-auto">
                        <SectionEyebrow>Everything included</SectionEyebrow>
                        <h2 className="font-semibold text-white text-3xl md:text-4xl tracking-tight">No hidden add-ons</h2>
                    </motion.div>
                    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { icon: FileText, title: 'Smart invoice generation', desc: 'AI-assisted invoices with GST, TDS, line items and your branding in seconds.' },
                            { icon: Target, title: 'Automated collections', desc: 'Email follow-ups that escalate intelligently based on client history.' },
                            { icon: CreditCard, title: 'Payment reconciliation', desc: 'Match incoming UPI, cash, card and cheque payments to invoices automatically.' },
                            { icon: Calendar, title: 'Invoice calendar', desc: 'See due dates, overdue bills and payment deadlines in a visual calendar.' },
                            { icon: Users, title: 'Client management', desc: 'Full client profiles with payment history, contact info and invoice linkage.' },
                            { icon: BarChart3, title: 'Revenue analytics', desc: 'Real-time P&L, cash flow trends and month-on-month comparisons.' },
                            { icon: Package, title: 'Inventory tracking', desc: 'Track products, stock levels, reorder alerts and AI replenishment suggestions.' },
                            { icon: Shield, title: 'Compliance manager', desc: 'Track GST filings, annual returns and regulatory deadlines without missing one.' },
                            { icon: Activity, title: 'Expense tracking', desc: 'Categorise and monitor business expenses with share-of-total breakdowns.' },
                        ].map(f => <FeatureCard key={f.title} {...f} />)}
                    </motion.div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="py-24 relative z-10">
                <div className="max-w-5xl mx-auto px-6">
                    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14 max-w-2xl mx-auto">
                        <motion.div variants={fadeUp}>
                            <SectionEyebrow>How it works</SectionEyebrow>
                        </motion.div>
                        <motion.h2 variants={fadeUp} className="font-semibold text-white text-3xl md:text-4xl tracking-tight">Up and running in under five minutes</motion.h2>
                    </motion.div>
                    <div className="grid md:grid-cols-4 gap-3">
                        {[
                            { n: '01', t: 'Create account', d: 'Sign up with your email. No credit card required.' },
                            { n: '02', t: 'Add your clients', d: 'Import or add clients manually. We store the billing details.' },
                            { n: '03', t: 'Create an invoice', d: 'Generate a GST-compliant invoice in seconds. Send or save as draft.' },
                            { n: '04', t: 'Activate collections', d: 'Turn on automated follow-ups for overdue invoices.' },
                        ].map((s, i) => (
                            <motion.div
                                key={s.n}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08, duration: 0.5 }}
                                className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 hover:border-teal-500/25 transition-colors"
                            >
                                <div className="text-[11px] font-medium text-teal-400 mb-3 tracking-[0.12em]">{s.n}</div>
                                <h3 className="font-semibold text-white text-[15px] mb-1.5 tracking-tight">{s.t}</h3>
                                <p className="text-slate-400 text-[13px] leading-relaxed">{s.d}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section id="pricing" className="relative z-20 w-full lg:max-w-5xl mx-auto px-4 md:px-6 pt-10 pb-20 scale-100 lg:scale-90 lg:origin-top">
                <Pricing isEmbedded={true} />
            </section>

            {/* FAQ */}
            <FaqSection />

            {/* FINAL CTA */}
            <section className="py-28 relative z-10 text-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full" style={{ background: 'radial-gradient(circle at center, rgba(20,184,166,0.10) 0%, transparent 60%)' }} />
                </div>
                <div className="max-w-2xl mx-auto px-6 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                        <SectionEyebrow>Get started</SectionEyebrow>
                        <h2 className="font-semibold text-white leading-[1.05] tracking-[-0.02em] mb-5" style={{ fontSize: 'clamp(36px, 6vw, 64px)' }}>
                            Get paid. <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">Stay paid.</span>
                        </h2>
                        <p className="text-slate-400 text-[16px] max-w-md mx-auto mb-8">Start your free trial today. No credit card, no setup fees.</p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-lg font-semibold text-[14px] transition-colors"
                        >
                            Get started free
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <p className="text-slate-600 text-[12.5px] mt-4">No credit card required · Cancel anytime</p>
                    </motion.div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="pb-10 pt-16 border-t border-white/[0.06] relative z-10">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
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

                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/[0.05]">
                    <div className="text-slate-500 text-[12px]">© {new Date().getFullYear()} CapitaEdgeX. All rights reserved.</div>
                    <div className="text-slate-500 text-[12px]">Made in India</div>
                </div>
            </footer>

            <LegalModal isOpen={!!legalModalType} onClose={() => setLegalModalType(null)} type={legalModalType} />
        </div>
    );
};
