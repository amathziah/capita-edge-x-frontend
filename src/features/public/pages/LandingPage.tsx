import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring, useInView } from 'framer-motion';
import {
    Zap, Target, BarChart3, ArrowRight, Shield,
    CheckCircle2, ChevronRight, Lock,
    ChevronDown, Clock, TrendingUp, Users,
    FileText, CreditCard, Calendar, Package,
    AlertTriangle, Activity,
    Sparkles, Play
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { Pricing } from '@/features/public/pages/PricingPage';
import { CapitaCore } from '@/features/public/components/CapitaCore';
import { LegalModal, PolicyType } from '@/features/compliance/components/LegalModal';
import { brandProfile } from '@/shared/lib/config/brandProfile';

// ─── Types ────────────────────────────────────────────────────────────────────
// ─── Magnetic Button ──────────────────────────────────────────────────────────
function Magnetic({ children, strength = 0.3 }: { children: React.ReactNode; strength?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 150, damping: 15 });
    const springY = useSpring(y, { stiffness: 150, damping: 15 });
    const handleMouse = (e: React.MouseEvent) => {
        const rect = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
        y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
    };
    return (
        <motion.div ref={ref} style={{ x: springX, y: springY }} onMouseMove={handleMouse} onMouseLeave={() => { x.set(0); y.set(0); }}>
            {children}
        </motion.div>
    );
}


// ─── Particle Field (3D Point Cloud) ──────────────────────────────────────────
function ParticleField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        
        const FOCAL_LENGTH = 1000;
        const particles: Array<{ x: number; y: number; z: number; size: number; alpha: number; hue: number }> = [];
        
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: (Math.random() - 0.5) * 4000,
                y: (Math.random() - 0.5) * 4000,
                z: Math.random() * 4000,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.4 + 0.1,
                hue: 165 + Math.random() * 30
            });
        }

        const onResize = () => {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', onResize);

        let rotation = 0;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            rotation += 0.001;

            particles.forEach(p => {
                let x = p.x;
                let z = p.z - 2000;
                const cos = Math.cos(rotation);
                const sin = Math.sin(rotation);
                const rx = x * cos - z * sin;
                const rz = x * sin + z * cos;
                const finalX = rx;
                const finalY = p.y;
                const finalZ = rz + 2000;

                if (finalZ > 0) {
                    const scale = FOCAL_LENGTH / (FOCAL_LENGTH + finalZ);
                    const px = finalX * scale + W / 2;
                    const py = finalY * scale + H / 2;
                    const pSize = p.size * scale;

                    ctx.beginPath();
                    ctx.arc(px, py, pSize, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha * scale * 2})`;
                    ctx.fill();
                }
            });
            id = requestAnimationFrame(draw);
        };
        
        let id = requestAnimationFrame(draw);
        return () => {
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(id);
        };
    }, []);
    return <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none opacity-40" />;
}

// ─── Space Debris (Parallax Floating Orbs) ─────────────────────────────────────
function SpaceDebris() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {[...Array(3)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-64 h-64 rounded-full"
                    style={{
                        background: `radial-gradient(circle, rgba(20,184,166,${0.03 + i * 0.01}) 0%, transparent 70%)`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                />
            ))}
        </div>
    );
}

// ─── Morphing Blob ────────────────────────────────────────────────────────────
function Blob({ className, color }: { className: string; color: string }) {
    return (
        <div className={`absolute rounded-full pointer-events-none ${className}`}
            style={{ backgroundImage: `radial-gradient(circle at center, ${color} 0%, transparent 70%)` }} />
    );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    useEffect(() => {
        if (!inView) return;
        let start: number | null = null;
        const step = (ts: number) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / 2200, 1);
            setCount(Math.floor((1 - Math.pow(1 - p, 4)) * to));
            if (p < 1) requestAnimationFrame(step); else setCount(to);
        };
        requestAnimationFrame(step);
    }, [inView, to]);
    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ─── Floating Badge ───────────────────────────────────────────────────────────
function FloatingBadge({ children, className, delay = 0 }: { children: React.ReactNode; className: string; delay?: number }) {
    return (
        <motion.div className={`absolute ${className} z-20 pointer-events-none`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay }}>
                {children}
            </motion.div>
        </motion.div>
    );
}

// ─── Beam Scanner ─────────────────────────────────────────────────────────────
function BeamScanner() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
            <motion.div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent"
                animate={{ y: [-10, '100%', -10] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
        </div>
    );
}

// ─── Orbit Rings ──────────────────────────────────────────────────────────────
function OrbitRings() {
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            {[200, 380, 560].map((size, i) => (
                <motion.div key={size} className="absolute rounded-full border border-teal-500/[0.06]"
                    style={{ width: size, height: size }}
                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 18 + i * 9, repeat: Infinity, ease: 'linear' }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal-400/50" />
                </motion.div>
            ))}
        </div>
    );
}

// ─── Scrolling Ticker ─────────────────────────────────────────────────────────
function ScrollTicker({ items }: { items: string[] }) {
    return (
        <div className="relative overflow-hidden py-3 border-y border-white/[0.04]">
            <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-[#050810] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-[#050810] to-transparent z-10 pointer-events-none" />
            <motion.div className="flex gap-8 whitespace-nowrap"
                animate={{ x: ['0%', '-50%'] }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}>
                {[...items, ...items].map((item, i) => (
                    <span key={i} className="text-[12px] font-semibold text-slate-500 flex items-center gap-3">
                        <span className="w-1 h-1 rounded-full bg-teal-500/50 inline-block" />{item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, index }: { icon: any; title: string; desc: string; index: number }) {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.div 
            initial={{ opacity: 0, y: 50, rotateX: 25, z: -100 }} 
            whileInView={{ opacity: 1, y: 0, rotateX: 0, z: 0 }} 
            viewport={{ once: true, margin: "-100px" }} 
            transition={{ delay: index * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            className="relative group p-6 rounded-2xl border transition-all duration-400 cursor-default overflow-hidden transform-style-3d"
            style={{ 
                background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)', 
                borderColor: hovered ? 'rgba(20,184,166,0.35)' : 'rgba(255,255,255,0.06)', 
                transform: hovered ? 'translateY(-8px) rotateX(4deg)' : 'none' 
            }}>
            {hovered && <motion.div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />}
            <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden transition-all duration-300"
                style={{ background: hovered ? 'rgba(20,184,166,0.2)' : 'rgba(20,184,166,0.08)', border: `1px solid ${hovered ? 'rgba(20,184,166,0.4)' : 'rgba(20,184,166,0.15)'}` }}>
                <Icon className="text-teal-400" style={{ width: 18, height: 18 }} />
            </div>
            <h3 className="font-black text-white text-[15px] mb-2">{title}</h3>
            <p className="text-slate-400 text-[13px] leading-relaxed">{desc}</p>
        </motion.div>
    );
}

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
function DashboardMockup() {
    // Removed heavy 3D mouse tracking tilt logic
    const events = [
        { type: 'Payment Received', detail: 'Received ₹3,540 via cash', time: '17:57:54', ok: true },
        { type: 'Payment Received', detail: 'Received ₹60 via upi', time: '16:21:09', ok: true },
        { type: 'Invoice Overdue', detail: 'STR-5739-2359 · ₹8,644', time: '09:00:00', ok: false },
    ];
    return (
        <div className="relative perspective-1000">
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/10 via-cyan-500/8 to-teal-500/10 rounded-[3rem] opacity-50" />
            <motion.div 
                style={{ transformStyle: "preserve-3d" }}
                className="relative bg-[#080c18]/95 border border-white/[0.07] rounded-[1.75rem] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.8)]"
                initial={{ y: 40, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
                <BeamScanner />
                <div className="bg-[#0d1117]/90 border-b border-white/[0.05] px-5 py-3 flex items-center gap-2 backdrop-blur">
                    <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-400/70" /><div className="w-3 h-3 rounded-full bg-yellow-400/70" /><div className="w-3 h-3 rounded-full bg-emerald-400/70" /></div>
                    <div className="flex-1 flex justify-center">
                        <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5">
                            <motion.div className="w-1.5 h-1.5 rounded-full bg-teal-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                            <span className="text-[11px] text-slate-400 font-mono">app.capita.ai/dashboard</span>
                            <Lock className="w-2.5 h-2.5 text-teal-500 ml-1" />
                        </div>
                        <div className="flex sm:hidden items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                             <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Capita AI Dashboard</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row" style={{ minHeight: 440 }}>
                    <div className="hidden md:flex w-44 flex-shrink-0 bg-[#070b14] border-r border-white/[0.04] p-4 flex-col gap-1">
                        <div className="flex items-center gap-2 mb-5"><Logo size={26} /><div><div className="text-[12px] font-bold text-white">Capita</div><div className="text-[9px] text-slate-500">Financial OS</div></div></div>
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-700 mb-1.5 px-2">Headquarters</div>
                        {[{ label: 'Control Room', icon: Activity, active: true }, { label: 'Calendar', icon: Calendar }].map(item => (
                            <div key={item.label} className={`flex items-center gap-2 px-2 py-2 rounded-lg text-[11.5px] font-semibold ${item.active ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20' : 'text-slate-600'}`}>
                                <item.icon className="w-3.5 h-3.5" />{item.label}
                            </div>
                        ))}
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-700 mt-3 mb-1.5 px-2">Revenue Ops</div>
                        {[{ label: 'Invoices', icon: FileText }, { label: 'Payments', icon: CreditCard }, { label: 'Customers', icon: Users }].map(item => (
                            <div key={item.label} className="flex items-center gap-2 px-2 py-2 rounded-lg text-[11.5px] font-semibold text-slate-600"><item.icon className="w-3.5 h-3.5" />{item.label}</div>
                        ))}
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-700 mt-3 mb-1.5 px-2">Spend</div>
                        {[{ label: 'Expenses', icon: Package }, { label: 'Compliance', icon: Shield }].map(item => (
                            <div key={item.label} className="flex items-center gap-2 px-2 py-2 rounded-lg text-[11.5px] font-semibold text-slate-600"><item.icon className="w-3.5 h-3.5" />{item.label}</div>
                        ))}
                    </div>
                    <div className="flex-1 p-5 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-400 mb-1 flex items-center gap-1.5">
                                    <motion.span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />MISSION CONTROL
                                </div>
                                <h2 className="text-lg font-black text-white">Control Room</h2>
                                <p className="text-[10px] text-slate-500 mt-0.5">A live operational view of revenue health</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 border border-slate-700/50 rounded-lg">Review Overdue</button>
                                <button className="px-3 py-1.5 text-[10px] font-semibold text-teal-400 border border-teal-500/30 rounded-lg bg-teal-500/8">Add Client</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3.5">
                            {[
                                { label: 'PENDING REVENUE', val: '₹27.03L', sub: '500 invoices pending', icon: FileText, color: 'teal' },
                                { label: 'ACTION REQUIRED', val: '₹13.03L', sub: '250 overdue payments', icon: AlertTriangle, color: 'orange', dot: true },
                                { label: 'CASH COLLECTED', val: '₹13.17L', sub: '65% of monthly goal', icon: Activity, color: 'teal' },
                                { label: 'ACTIVE CLIENTS', val: '4,004', sub: 'Manage clients', icon: Users, color: 'slate' },
                            ].map((kpi, i) => (
                                <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 + i * 0.1 }}
                                    className="bg-white/[0.025] border border-white/[0.04] rounded-xl p-3 relative">
                                    {(kpi as any).dot && <motion.div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-orange-400" animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />}
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2.5 ${kpi.color === 'teal' ? 'bg-teal-500/15' : kpi.color === 'orange' ? 'bg-orange-500/15' : 'bg-slate-500/10'}`}>
                                        <kpi.icon className={`w-3.5 h-3.5 ${kpi.color === 'teal' ? 'text-teal-400' : kpi.color === 'orange' ? 'text-orange-400' : 'text-slate-400'}`} />
                                    </div>
                                    <div className="text-[8.5px] font-black uppercase tracking-[0.15em] text-slate-600 mb-1">{kpi.label}</div>
                                    <div className="font-black text-white text-[17px] leading-none mb-1">{kpi.val}</div>
                                    <div className={`text-[9.5px] font-semibold ${kpi.color === 'orange' ? 'text-orange-400' : 'text-teal-400'}`}>{kpi.sub}</div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            <div className="col-span-1 md:col-span-2 bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5">
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-white"><Activity className="w-3.5 h-3.5 text-teal-400" />Live Monitoring</div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-400">
                                        <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />Systems Nominal
                                    </div>
                                </div>
                                {events.map((ev, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 + i * 0.15 }}
                                        className="flex items-center gap-2.5 bg-white/[0.02] rounded-lg px-2.5 py-2 mb-1.5 last:mb-0">
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${ev.ok ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                                            <CreditCard className={`w-3 h-3 ${ev.ok ? 'text-emerald-400' : 'text-rose-400'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-semibold text-slate-200">{ev.type}</div>
                                            <div className="text-[10px] text-slate-500 truncate">{ev.detail}</div>
                                        </div>
                                        <div className="text-[10px] text-teal-400 font-mono flex-shrink-0">{ev.time}</div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white mb-3"><Clock className="w-3.5 h-3.5 text-orange-400" />Priority Queue</div>
                                {[{ name: 'Stress Client 419', inv: 'STR-5740-2419', amt: '₹2,871' }, { name: 'Stress Client 415', inv: 'STR-5740-2415', amt: '₹6,817' }, { name: 'Stress Client 411', inv: 'STR-5740-2411', amt: '₹10,103' }].map((c, i) => (
                                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 + i * 0.1 }} className="flex items-center gap-2 mb-2.5 last:mb-0">
                                        <motion.div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
                                        <div className="flex-1 min-w-0"><div className="text-[11px] font-semibold text-slate-200 truncate">{c.name}</div><div className="text-[10px] text-slate-600">{c.inv}</div></div>
                                        <div className="text-[11px] font-black text-rose-400 flex-shrink-0">{c.amt}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <FloatingBadge className="-top-4 -right-4 hidden lg:block" delay={1.5}>
                <div className="bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-xl rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /></div>
                    <div><div className="text-[11px] font-black text-white">+₹3,540 received</div><div className="text-[9px] text-emerald-400 font-semibold">Just now via UPI</div></div>
                </div>
            </FloatingBadge>
            <FloatingBadge className="-bottom-4 -left-4 hidden lg:block" delay={2}>
                <div className="bg-teal-500/10 border border-teal-500/25 backdrop-blur-xl rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
                    <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center"><Shield className="w-3.5 h-3.5 text-teal-400" /></div>
                    <div><div className="text-[11px] font-black text-white">GST Compliant</div><div className="text-[9px] text-teal-400 font-semibold">All invoices verified</div></div>
                </div>
            </FloatingBadge>
        </div>
    );
}

// ─── Invoice Mock ─────────────────────────────────────────────────────────────
function InvoicesMock() {
    const rows = [
        { num: 'STR-5739-2289', date: '21 Feb 2026', customer: 'Stress Client 289', total: '₹8,034', status: 'Paid', sc: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
        { num: 'STR-5739-2359', date: '21 Feb 2026', customer: 'Stress Client 359', total: '₹8,644', status: 'Overdue', sc: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
        { num: 'STR-5738-2119', date: '21 Feb 2026', customer: 'Stress Client 119', total: '₹4,220', status: 'Overdue', sc: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
        { num: 'STR-5737-1826', date: '21 Feb 2026', customer: 'Stress Client 826', total: '₹6,071', status: 'Sent', sc: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
        { num: 'STR-5736-1691', date: '21 Feb 2026', customer: 'Stress Client 691', total: '₹5,893', status: 'Overdue', sc: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
    ];
    return (
        <div className="bg-[#0a0e1a] p-4">
            <div className="flex items-center justify-between mb-3">
                <div><h3 className="font-black text-white text-base">Invoices</h3><p className="text-[10px] text-slate-500">Track your business payments</p></div>
                <button className="px-3 py-1.5 bg-teal-500 text-white text-[11px] font-bold rounded-lg">+ New Invoice</button>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/[0.04]">
                <div className="grid grid-cols-5 px-3 py-2 bg-white/[0.02] border-b border-white/[0.04]">
                    {['NUMBER', 'DATE', 'CUSTOMER', 'TOTAL', 'STATUS'].map(h => <div key={h} className="text-[8.5px] font-black uppercase tracking-[0.15em] text-slate-600">{h}</div>)}
                </div>
                {rows.map((row, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                        className="grid grid-cols-5 items-center px-3 py-2.5 border-b border-white/[0.025] last:border-0 hover:bg-white/[0.02] transition-colors">
                        <div className="text-[10px] font-mono text-teal-400">{row.num}</div>
                        <div className="text-[10px] text-slate-500">{row.date}</div>
                        <div className="text-[10px] text-slate-300">{row.customer}</div>
                        <div className="text-[10px] font-semibold text-white">{row.total}</div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border w-fit ${row.sc}`}>{row.status}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── Reports Mock ─────────────────────────────────────────────────────────────
function ReportsMock() {
    return (
        <div className="bg-[#0a0e1a] p-4">
            <h3 className="font-black text-white text-base mb-0.5">Reports</h3>
            <p className="text-[10px] text-slate-500 mb-3">Real-time insights into your performance.</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
                {[{ label: 'TOTAL REVENUE', val: '₹13,17,615', color: 'text-teal-400' }, { label: 'EXPENSES', val: '₹1,499', color: 'text-orange-400' }, { label: 'NET PROFIT', val: '₹13,16,116', color: 'text-teal-400' }, { label: 'AVG MARGIN', val: '100%', color: 'text-violet-400' }].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                        className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-2.5">
                        <div className="text-[8px] font-black uppercase tracking-wider text-slate-600 mb-1.5">{s.label}</div>
                        <div className={`font-black text-[13px] leading-none ${s.color}`}>{s.val}</div>
                    </motion.div>
                ))}
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-bold text-white">Revenue vs Expenses</div>
                    <div className="flex gap-2 text-[9px]">
                        <span className="flex items-center gap-1 text-teal-400"><span className="w-2 h-2 rounded-full bg-teal-400 inline-block" /> Revenue</span>
                        <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> Expenses</span>
                    </div>
                </div>
                <svg viewBox="0 0 300 70" className="w-full h-20">
                    <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(20,184,166,0.35)" /><stop offset="100%" stopColor="rgba(20,184,166,0)" /></linearGradient></defs>
                    <path d="M 10 62 C 50 62 90 15 150 6 C 210 -2 270 4 290 1" stroke="rgb(20,184,166)" strokeWidth="2" fill="none" />
                    <path d="M 10 62 C 50 62 90 15 150 6 C 210 -2 270 4 290 1 L 290 70 L 10 70 Z" fill="url(#rg)" />
                    <path d="M 10 66 C 80 66 150 63 290 64" stroke="rgb(100,116,139)" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />
                </svg>
            </div>
        </div>
    );
}

// ─── FAQ ────────────────────────────────────────────────────────────────
function FaqSection() {
    const [openIdx, setOpenIdx] = useState<number | null>(0);
    const faqs = [
        { q: `Who is ${brandProfile.name} built for?`, a: brandProfile.faqBuiltFor },
        { q: "Are the invoices generated GST compliant?", a: "Absolutely. All invoices generated through CapitaEdgeX automatically adhere to the latest Indian GST regulations, including field tracking for SGST, CGST, IGST, and proper HSN/SAC configurations." },
        { q: "What happens if I cancel my subscription?", a: "You can cancel anytime with zero hidden fees. You will retain full access to your account and historical data until the end of your billing cycle. We don't lock your data—you can export everything to standard CSVs at any click." },
        { q: "Is there a limit on how many invoices I can send?", a: "No! All of our premium plans offer unlimited invoicing and unlimited client profiles. Stop tracking arbitrary tier limits and focus purely on closing more business." }
    ];

    return (
        <section id="faq" className="py-24 relative z-10">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <div className="text-teal-400 font-black uppercase tracking-[0.22em] text-[11px] mb-4">Clear Answers</div>
                        <h2 className="display font-black text-white text-3xl md:text-5xl">Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Questions</span></h2>
                    </motion.div>
                </div>
                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className={`border ${openIdx === i ? 'bg-white/[0.04] border-teal-500/30' : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.03]'} rounded-2xl overflow-hidden transition-colors`}>
                            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full px-6 py-5 flex items-center justify-between text-left">
                                <span className={`font-bold text-[15px] ${openIdx === i ? 'text-teal-400' : 'text-slate-200'}`}>{faq.q}</span>
                                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openIdx === i ? 'rotate-180 text-teal-400' : 'text-slate-500'}`} />
                            </button>
                            <AnimatePresence>
                                {openIdx === i && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                                        <div className="px-6 pb-6 text-[14px] text-slate-400 leading-relaxed border-t border-white/[0.03] pt-4">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any } } };

// ─── Main ─────────────────────────────────────────────────────────────────────
export const Landing: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [legalModalType, setLegalModalType] = useState<PolicyType | null>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
    const heroO = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

    const words = ['Payments.', 'Invoices.', 'Overdue Bills.', 'Revenue.'];
    const [wIdx, setWIdx] = useState(0);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    useEffect(() => {
        const id = setInterval(() => setWIdx(i => (i + 1) % words.length), 2800);
        return () => clearInterval(id);
    }, []);

    const tickerItems = ['GST-compliant invoicing', 'UPI & Razorpay integration', 'Automated collections', 'Real-time P&L', 'WhatsApp alerts', 'AI-powered follow-ups', 'Multi-client dashboard', 'Compliance tracking', 'Inventory management'];

    return (
        <div className="relative min-h-screen bg-[#050810] text-white overflow-x-hidden selection:bg-teal-500/30"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap');
                .display { font-family: 'Outfit', sans-serif; }
                html { scroll-behavior: smooth; }
            `}</style>

            <ParticleField />
            <SpaceDebris />
            <CapitaCore />

            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[#050810]" />
                <Blob className="w-[800px] h-[800px] -top-60 -left-40 opacity-25" color="rgba(20,184,166,0.18)" />
                <Blob className="w-[600px] h-[600px] top-1/2 -right-40 opacity-18" color="rgba(14,165,233,0.15)" />
                <Blob className="w-[500px] h-[500px] bottom-0 left-1/3 opacity-12" color="rgba(20,184,166,0.12)" />
                <div className="absolute inset-0 opacity-[0.022]" style={{ backgroundImage: 'linear-gradient(rgba(20,184,166,1) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,transparent_40%,#050810_100%)]" />
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#050810] to-transparent" />
            </div>

            {/* NAV */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-5 pt-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className={`flex items-center justify-between px-5 py-3 rounded-2xl transition-all duration-500 ${scrolled ? 'bg-[#050810]/80 backdrop-blur-3xl border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.4)]' : 'border border-transparent'}`}>
                        <div className="flex items-center gap-2.5">
                            <Logo size={32} />
                            <span className="display font-black text-xl text-white tracking-tight">Capita <span className="text-teal-400">AI</span></span>
                        </div>
                        <div className="hidden md:flex items-center gap-6">
                            {[['#features', 'Features'], ['#how-it-works', 'How it Works'], ['#pricing', 'Pricing'], ['#faq', 'FAQ']].map(([href, label]) => (
                                <a key={label} href={href} className="text-[13px] font-semibold text-slate-400 hover:text-white transition-colors relative group">
                                    {label}
                                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-teal-400 group-hover:w-full transition-all duration-300" />
                                </a>
                            ))}
                        </div>
                        <Magnetic>
                            <Link to="/login" className="relative overflow-hidden group bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl text-[13px] font-black transition-all active:scale-95 inline-block"
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 25px rgba(20,184,166,0.5)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                                Get Started
                            </Link>
                        </Magnetic>
                    </motion.div>
                </div>
            </nav>

            {/* HERO */}
            <section ref={heroRef} className="relative pt-36 pb-16 lg:pt-52 lg:pb-24 overflow-hidden min-h-screen flex flex-col justify-center">
                <OrbitRings />
                <motion.div 
                    style={{ 
                        y: heroY, 
                        opacity: heroO, 
                        scale: heroScale,
                        rotateX: useTransform(scrollYProgress, [0, 0.4], [0, 15]),
                        z: useTransform(scrollYProgress, [0, 0.4], [0, -200])
                    }} 
                    className="max-w-6xl mx-auto px-6 relative z-10 w-full transform-style-3d">
                    <div className="text-center mb-16">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-[11px] font-black uppercase tracking-[0.2em] mb-8 relative">
                                <motion.span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" animate={{ scale: [1, 1.8, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                                India's Financial OS for Agencies
                                <motion.span className="absolute inset-0 rounded-full border border-teal-500/20" animate={{ scale: [1, 1.07, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }} />
                            </div>
                        </motion.div>

                        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                            className="display font-black leading-[0.87] tracking-tight mb-6" style={{ fontSize: 'clamp(48px, 9.5vw, 112px)' }}>
                            <span className="text-white">Stop Chasing</span>
                            <br />
                            <span className="relative inline-block">
                                <AnimatePresence mode="wait">
                                    <motion.span key={wIdx}
                                        className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 inline-block"
                                        initial={{ y: 60, opacity: 0, filter: 'blur(8px)' }}
                                        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                                        exit={{ y: -60, opacity: 0, filter: 'blur(8px)' }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}>
                                        {words[wIdx]}
                                    </motion.span>
                                </AnimatePresence>
                            </span>
                        </motion.h1>

                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.35 }}
                            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                            {brandProfile.heroDescription}
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                            <Magnetic>
                                <Link to="/login"
                                    className="group relative w-full sm:w-auto px-10 py-5 bg-teal-500 text-white rounded-2xl font-black text-[17px] overflow-hidden flex items-center justify-center gap-2.5"
                                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 40px rgba(20,184,166,0.5)')}
                                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                                    <motion.div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <span className="relative z-10">Get Started Free</span>
                                    <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="relative z-10">
                                        <ArrowRight className="w-5 h-5" />
                                    </motion.div>
                                </Link>
                            </Magnetic>
                            <Magnetic>
                                <a href="#product" className="group w-full sm:w-auto px-10 py-5 bg-white/[0.04] border border-white/[0.1] text-white rounded-2xl font-black text-[17px] hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2">
                                    <Play className="w-4 h-4 text-teal-400 fill-teal-400" />
                                    See the Product
                                </a>
                            </Magnetic>
                        </motion.div>

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.7 }}
                            className="flex flex-wrap items-center justify-center gap-5 text-[12px] font-semibold text-slate-500">
                            {['GST-compliant invoicing', 'UPI & Razorpay ready', 'Built for Indian agencies', 'No credit card needed'].map((f, i) => (
                                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 + i * 0.08 }}
                                    className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />{f}
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>

                <div id="product" className="max-w-6xl mx-auto px-6 relative z-10">
                    <DashboardMockup />
                </div>
            </section>

            {/* TICKER */}
            <div className="relative z-10">
                <ScrollTicker items={tickerItems} />
            </div>

            {/* STATS */}
            <section className="py-20 relative z-10">
                <div className="max-w-5xl mx-auto px-6">
                    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-3xl overflow-hidden border border-white/[0.06]">
                        {[
                            { to: 1000, suffix: '+', label: 'Invoices Managed', icon: FileText },
                            { to: 9, suffix: ' modules', label: 'Fully Integrated', icon: Package },
                            { to: 100, suffix: '%', label: 'GST Compliant', icon: Shield },
                            { to: 5, suffix: ' min', label: 'Setup Time', icon: Zap },
                        ].map((s, i) => (
                            <motion.div key={i} variants={fadeUp} className="bg-[#050810] p-8 text-center relative group overflow-hidden">
                                <motion.div className="absolute inset-0 bg-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <s.icon className="w-5 h-5 text-teal-500/50 mx-auto mb-3" />
                                <div className="display font-black text-4xl text-white mb-2"><Counter to={s.to} suffix={s.suffix} /></div>
                                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{s.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="py-24 relative z-10">
                <div className="max-w-6xl mx-auto px-6 space-y-32">
                    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
                        <motion.div variants={fadeUp} className="text-teal-400 font-black uppercase tracking-[0.22em] text-[11px] mb-4">Complete Platform</motion.div>
                        <motion.h2 variants={fadeUp} className="display font-black text-white leading-tight" style={{ fontSize: 'clamp(32px, 5.5vw, 64px)' }}>
                            Every financial tool<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">your agency needs.</span>
                        </motion.h2>
                    </motion.div>

                    {/* Invoice */}
                    <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as any }} className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[11px] font-black uppercase tracking-[0.18em] mb-5">Invoice Management</div>
                            <h3 className="display font-black text-white text-3xl md:text-4xl mb-4 leading-tight">Every invoice. Every status. <span className="text-teal-400">Total control.</span></h3>
                            <p className="text-slate-400 text-[15px] leading-relaxed mb-6">Create, send, and track unlimited invoices with real-time status updates — Paid, Sent, Overdue, Draft.</p>
                            <ul className="space-y-3">
                                {['Unlimited GST-compliant invoices', 'Bulk email sending to overdue clients', '1,000+ invoice pagination with instant search', 'One-click PDF download and sharing'].map((f, i) => (
                                    <motion.li key={i} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 * i }}
                                        className="flex items-center gap-3 text-[14px] text-slate-300 font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />{f}
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-3 bg-teal-500/5 rounded-3xl blur-2xl" />
                            <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl"><InvoicesMock /></div>
                        </div>
                    </motion.div>

                    {/* Control Room */}
                    <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as any }} className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="lg:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[11px] font-black uppercase tracking-[0.18em] mb-5">Live Monitoring</div>
                            <h3 className="display font-black text-white text-3xl md:text-4xl mb-4 leading-tight">Your revenue <span className="text-teal-400">command centre.</span></h3>
                            <p className="text-slate-400 text-[15px] leading-relaxed mb-6">The Control Room shows live payment events, overdue prioritisation, and total revenue health in real-time.</p>
                            <ul className="space-y-3">
                                {['Live payment event stream (UPI, Cash, Card)', 'Priority queue of overdue clients by value', 'Pending revenue vs cash collected view', 'Action Required alerts with one-click resolution'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[14px] text-slate-300 font-medium"><CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />{f}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="lg:order-1 relative">
                            <div className="absolute -inset-3 bg-teal-500/5 rounded-3xl blur-2xl" />
                            <div className="relative bg-[#0a0e1a] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl p-4">
                                <BeamScanner />
                                <div className="flex items-center gap-2 mb-4">
                                    <motion.span className="w-1.5 h-1.5 rounded-full bg-teal-400" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-400">Mission Control · Live</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5 mb-3">
                                    {[{ label: 'Pending Revenue', val: '₹27,03,800', color: 'text-white', sub: '500 invoices pending' }, { label: 'Action Required', val: '₹13,03,000', color: 'text-orange-400', sub: '250 overdue' }, { label: 'Cash Collected', val: '₹13,17,600', color: 'text-teal-400', sub: '65% of goal' }, { label: 'Active Clients', val: '4,004', color: 'text-white', sub: 'Manage clients' }].map((k, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                            className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-2.5">
                                            <div className="text-[8.5px] text-slate-600 font-semibold uppercase tracking-wider mb-1">{k.label}</div>
                                            <div className={`font-black text-[15px] ${k.color}`}>{k.val}</div>
                                            <div className="text-[9px] text-slate-500 mt-0.5">{k.sub}</div>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="bg-white/[0.02] rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-white"><Activity className="w-3.5 h-3.5 text-teal-400" />Live Events</div>
                                    {[{ ev: 'Payment Received', detail: '₹3,540 via cash', t: '17:57', ok: true }, { ev: 'Payment Received', detail: '₹60 via UPI', t: '16:21', ok: true }, { ev: 'Invoice Overdue', detail: 'STR-5739-2359 · ₹8,644', t: '09:00', ok: false }].map((e, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                            className="flex items-start gap-2 py-1.5 border-b border-white/[0.03] last:border-0">
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${e.ok ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                                                <CreditCard className={`w-2.5 h-2.5 ${e.ok ? 'text-emerald-400' : 'text-rose-400'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0"><div className="text-[10px] font-semibold text-slate-200">{e.ev}</div><div className="text-[9px] text-slate-500 truncate">{e.detail}</div></div>
                                            <div className="text-[9px] text-teal-400 font-mono">{e.t}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Reports */}
                    <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[11px] font-black uppercase tracking-[0.18em] mb-5">Analytics & Reports</div>
                            <h3 className="display font-black text-white text-3xl md:text-4xl mb-4 leading-tight">P&L in real-time. <span className="text-teal-400">No accountant needed.</span></h3>
                            <p className="text-slate-400 text-[15px] leading-relaxed mb-6">Track total revenue, expenses, net profit, and average margin automatically. Revenue vs Expenses charts give you the full financial picture every month.</p>
                            <ul className="space-y-3">
                                {['Automatic P&L calculation', 'Revenue vs Expenses trend chart', 'Comparative month-by-month analysis', 'One-click export'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[14px] text-slate-300 font-medium"><CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />{f}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-3 bg-teal-500/5 rounded-3xl blur-2xl" />
                            <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl"><ReportsMock /></div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FEATURE GRID */}
            <section className="py-20 relative z-10">
                <div className="max-w-6xl mx-auto px-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
                        <h2 className="display font-black text-white text-3xl md:text-4xl">Everything included. <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">No add-ons.</span></h2>
                    </motion.div>
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
                        ].map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="py-24 relative z-10">
                <div className="max-w-5xl mx-auto px-6">
                    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
                        <motion.div variants={fadeUp} className="text-teal-400 font-black uppercase tracking-[0.22em] text-[11px] mb-4">Get Running Fast</motion.div>
                        <motion.h2 variants={fadeUp} className="display font-black text-white leading-tight" style={{ fontSize: 'clamp(30px, 5vw, 60px)' }}>
                            Up and running<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">in under 5 minutes.</span>
                        </motion.h2>
                    </motion.div>
                    <div className="grid md:grid-cols-4 gap-4 relative">
                        {[
                            { n: '01', t: 'Create Account', d: 'Sign up with your email. No credit card required. Your Financial OS is ready instantly.' },
                            { n: '02', t: 'Add Your Clients', d: 'Import or add clients manually. Capita stores all their billing info for fast invoicing.' },
                            { n: '03', t: 'Create an Invoice', d: 'Generate a GST-compliant invoice in seconds. Customise, send, or save as draft.' },
                            { n: '04', t: 'Activate Collections', d: 'Turn on automated follow-ups for overdue invoices and let Capita do the chasing.' },
                        ].map((s, i) => (
                            <motion.div key={s.n} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-teal-500/25 group relative overflow-hidden">
                                <motion.div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center mb-5">
                                    <span className="display font-black text-[13px] text-teal-400">{s.n}</span>
                                </div>
                                <h3 className="display font-black text-white text-[15px] mb-2">{s.t}</h3>
                                <p className="text-slate-400 text-[12.5px] leading-relaxed">{s.d}</p>
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
            <section className="py-28 lg:py-40 relative z-10 text-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <Blob className="w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" color="rgba(20,184,166,0.2)" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,transparent_30%,#050810_85%)]" />
                </div>
                <div className="max-w-3xl mx-auto px-6 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
                        <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] font-black uppercase tracking-[0.2em] mb-8"
                            animate={{ boxShadow: ['0 0 0 0 rgba(20,184,166,0)', '0 0 20px 5px rgba(20,184,166,0.15)', '0 0 0 0 rgba(20,184,166,0)'] }} transition={{ duration: 3, repeat: Infinity }}>
                            <Sparkles className="w-3.5 h-3.5" /> Start for free today
                        </motion.div>
                        <h2 className="display font-black text-white leading-[0.9] tracking-tight mb-6" style={{ fontSize: 'clamp(48px, 8.5vw, 100px)' }}>
                            Get paid.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-400">Stay paid.</span>
                        </h2>
                        <p className="text-slate-400 text-xl max-w-xl mx-auto mb-10">Start your free trial today. No credit card, no setup fees, no catch.</p>
                        <Magnetic>
                            <Link to="/login" className="group inline-flex items-center gap-3 px-12 py-5 bg-teal-500 text-white rounded-2xl font-black text-xl transition-all hover:-translate-y-1 active:scale-95 relative overflow-hidden"
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 60px rgba(20,184,166,0.5)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                                <motion.div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className="relative z-10">Get Started Free</span>
                                <motion.div animate={{ x: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="relative z-10">
                                    <ChevronRight className="w-6 h-6" />
                                </motion.div>
                            </Link>
                        </Magnetic>
                        <p className="text-slate-600 text-[13px] mt-5 font-medium">No credit card required · Cancel anytime</p>
                    </motion.div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="pb-12 pt-20 border-t border-white/[0.05] relative z-10">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <motion.div className="absolute inset-0 bg-teal-500 blur-md opacity-40 rounded-lg" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} />
                                <div className="relative w-7 h-7 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-lg flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" /></div>
                            </div>
                            <span className="display font-black text-white tracking-tight text-xl">CapitaEdgeX</span>
                        </div>
                        <p className="text-slate-400 text-[14px] leading-relaxed max-w-sm">
                            {brandProfile.footerDescription}
                        </p>
                    </div>

                    <div>
                        <h4 className="font-black text-white text-[15px] mb-4">Platform</h4>
                        <ul className="space-y-3">
                            <li><a href="#features" className="text-[13px] text-slate-400 hover:text-white transition-colors">Features</a></li>
                            <li><a href="#how-it-works" className="text-[13px] text-slate-400 hover:text-white transition-colors">How it Works</a></li>
                            <li><a href="#pricing" className="text-[13px] text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black text-white text-[15px] mb-4">Compliance</h4>
                        <ul className="space-y-3">
                            <li><button onClick={() => setLegalModalType('about')} className="text-[13px] text-slate-400 hover:text-white transition-colors">About Us</button></li>
                            <li><button onClick={() => setLegalModalType('contact')} className="text-[13px] text-slate-400 hover:text-white transition-colors">Contact Us</button></li>
                            <li><button onClick={() => setLegalModalType('terms')} className="text-[13px] text-slate-400 hover:text-white transition-colors">Terms & Conditions</button></li>
                            <li><button onClick={() => setLegalModalType('privacy')} className="text-[13px] text-slate-400 hover:text-white transition-colors">Privacy Policy</button></li>
                            <li><button onClick={() => setLegalModalType('refund')} className="text-[13px] text-slate-400 hover:text-white transition-colors">Refund & Cancellations</button></li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/[0.05]">
                    <div className="text-slate-500 text-[12px]">© {new Date().getFullYear()} CapitaEdgeX. All rights reserved.</div>
                    <div className="text-slate-500 text-[12px]">Made in India</div>
                </div>
            </footer>
            
            <LegalModal isOpen={!!legalModalType} onClose={() => setLegalModalType(null)} type={legalModalType} />
        </div>
    );
};
