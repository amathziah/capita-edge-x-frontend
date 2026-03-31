import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring, useInView } from 'framer-motion';
import {
    Zap, Target, BarChart3, ArrowRight, Shield,
    CheckCircle2, ChevronRight, Globe, Lock,
    ChevronDown, Clock, TrendingUp, Users,
    FileText, CreditCard, Calendar, Package,
    AlertTriangle, Activity, Star, Building2, X,
    Sparkles, Play
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/common/Logo';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TierType {
    slug: string; name: string; tagline: string; price: number | null;
    priceAnnual: number | null; priceLabel?: string; icon: any;
    gradient: string; borderColor: string; bgTint: string; features: string[];
    notIncluded?: string[]; cta: string; popular?: boolean;
}

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

// ─── Custom Cursor ────────────────────────────────────────────────────────────
function CustomCursor() {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    const trailX = useSpring(cursorX, { stiffness: 80, damping: 20 });
    const trailY = useSpring(cursorY, { stiffness: 80, damping: 20 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const move = (e: MouseEvent) => { cursorX.set(e.clientX); cursorY.set(e.clientY); };
        const over = (e: MouseEvent) => { if ((e.target as HTMLElement).closest('a,button,[data-hover]')) setIsHovering(true); };
        const out = () => setIsHovering(false);
        window.addEventListener('mousemove', move);
        document.addEventListener('mouseover', over);
        document.addEventListener('mouseout', out);
        return () => { window.removeEventListener('mousemove', move); document.removeEventListener('mouseover', over); document.removeEventListener('mouseout', out); };
    }, []);

    return (
        <>
            <motion.div className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
                style={{ x: cursorX, y: cursorY, translateX: '-50%', translateY: '-50%' }}>
                <motion.div animate={{ scale: isHovering ? 1.5 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-3 h-3 rounded-full bg-white" />
            </motion.div>
            <motion.div className="fixed top-0 left-0 z-[9998] pointer-events-none"
                style={{ x: trailX, y: trailY, translateX: '-50%', translateY: '-50%' }}>
                <motion.div animate={{ scale: isHovering ? 2.5 : 1, opacity: isHovering ? 0.6 : 0.2 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    className="w-8 h-8 rounded-full border border-teal-400" />
            </motion.div>
        </>
    );
}

// ─── Particle Field ───────────────────────────────────────────────────────────
function ParticleField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        let mouseX = W / 2, mouseY = H / 2;
        const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; hue: number }> = [];
        for (let i = 0; i < 70; i++) {
            particles.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, size: Math.random() * 1.5 + 0.3, alpha: Math.random() * 0.5 + 0.1, hue: 165 + Math.random() * 30 });
        }
        const onMouse = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('mousemove', onMouse);
        window.addEventListener('resize', onResize);
        let raf: number;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            particles.forEach(p => {
                const dx = mouseX - p.x, dy = mouseY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 200) { p.vx += dx / dist * 0.015; p.vy += dy / dist * 0.015; }
                p.vx *= 0.97; p.vy *= 0.97;
                p.x = (p.x + p.vx + W) % W; p.y = (p.y + p.vy + H) % H;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue},80%,65%,${p.alpha})`; ctx.fill();
            });
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 110) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(20,184,166,${0.07 * (1 - d / 110)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
                }
            }
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMouse); window.removeEventListener('resize', onResize); };
    }, []);
    return <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none opacity-60" />;
}

// ─── Morphing Blob ────────────────────────────────────────────────────────────
function Blob({ className, color, delay = 0 }: { className: string; color: string; delay?: number }) {
    return (
        <motion.div className={`absolute rounded-full pointer-events-none ${className}`}
            style={{ background: color, filter: 'blur(80px)' }}
            animate={{ x: [0, 60, -40, 0], y: [0, -70, 50, 0], scale: [1, 1.2, 0.85, 1], borderRadius: ['50%', '60% 40% 70% 30%', '40% 60% 30% 70%', '50%'] }}
            transition={{ duration: 22, delay, repeat: Infinity, ease: 'easeInOut' }} />
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

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <motion.div className="border-b border-white/[0.06] last:border-0" layout>
            <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between py-5 text-left gap-4 group">
                <span className="font-semibold text-slate-200 text-[15px] group-hover:text-white transition-colors">{q}</span>
                <motion.div animate={{ rotate: open ? 180 : 0, scale: open ? 1.15 : 1 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-teal-500/20 text-teal-400' : 'bg-white/[0.04] text-slate-500'}`}>
                    <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                        <p className="pb-5 text-slate-400 text-[14px] leading-relaxed pr-10">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
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

// ─── Geometric 3D Layer ───────────────────────────────────────────────────────
function Geometric3DLayer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        
        let mouseX = 0, mouseY = 0;
        const onMouse = (e: MouseEvent) => {
            mouseX = (e.clientX - W / 2) * 0.05;
            mouseY = (e.clientY - H / 2) * 0.05;
        };

        const nodes: any[] = [];
        for(let i=0; i<20; i++) {
            nodes.push({
                x: (Math.random() - 0.5) * W * 1.5,
                y: (Math.random() - 0.5) * H * 1.5,
                z: Math.random() * 1000,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.2
            });
        }

        const project = (x: number, y: number, z: number) => {
            const focalLength = 400;
            const scale = focalLength / (focalLength + z);
            return {
                x: x * scale + W / 2,
                y: y * scale + H / 2,
                scale
            };
        };

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            nodes.forEach(n => {
                n.z -= n.speed;
                if(n.z < -400) n.z = 1000;
                
                const p = project(n.x + mouseX * (n.z/200), n.y + mouseY * (n.z/200), n.z);
                const opacity = Math.min(1, Math.max(0, 1 - n.z/1000));
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, n.size * p.scale, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(20, 184, 166, ${opacity * 0.4})`;
                ctx.fill();

                // Draw wireframe connection to nearby nodes
                nodes.forEach(m => {
                    const dist = Math.sqrt(Math.pow(n.x-m.x, 2) + Math.pow(n.y-m.y, 2) + Math.pow(n.z-m.z, 2));
                    if(dist < 300) {
                        const p2 = project(m.x + mouseX * (m.z/200), m.y + mouseY * (m.z/200), m.z);
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(20, 184, 166, ${opacity * 0.1 * (1 - dist/300)})`;
                        ctx.stroke();
                    }
                });
            });
            requestAnimationFrame(draw);
        };
        draw();
        window.addEventListener('mousemove', onMouse);
        return () => window.removeEventListener('mousemove', onMouse);
    }, []);
    return <canvas ref={canvasRef} className="fixed inset-0 z-[2] pointer-events-none" />;
}

// ─── Perspective Grid ─────────────────────────────────────────────────────────
function PerspectiveGrid() {
    return (
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden perspective-1000">
            <motion.div 
                animate={{ 
                    rotateX: [60, 60],
                    y: [0, 60]
                }}
                transition={{ 
                    y: { duration: 2, repeat: Infinity, ease: 'linear' }
                }}
                className="absolute bottom-0 left-[-50%] w-[200%] h-[100%] grid-3d opacity-[0.15]" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-transparent to-transparent" />
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
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05, duration: 0.5 }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            className="relative group p-6 rounded-2xl border transition-all duration-400 cursor-default overflow-hidden"
            style={{ background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)', borderColor: hovered ? 'rgba(20,184,166,0.35)' : 'rgba(255,255,255,0.06)', transform: hovered ? 'translateY(-4px)' : 'none' }}>
            {hovered && <motion.div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />}
            <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden transition-all duration-300"
                style={{ background: hovered ? 'rgba(20,184,166,0.2)' : 'rgba(20,184,166,0.08)', border: `1px solid ${hovered ? 'rgba(20,184,166,0.4)' : 'rgba(20,184,166,0.15)'}` }}>
                <Icon className="text-teal-400" style={{ width: 18, height: 18 }} />
                {hovered && <motion.div className="absolute inset-0 bg-teal-400/10" initial={{ scale: 0, opacity: 1 }} animate={{ scale: 2, opacity: 0 }} transition={{ duration: 0.5 }} />}
            </div>
            <h3 className="font-black text-white text-[15px] mb-2">{title}</h3>
            <p className="text-slate-400 text-[13px] leading-relaxed">{desc}</p>
        </motion.div>
    );
}

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
function DashboardMockup() {
    const events = [
        { type: 'Payment Received', detail: 'Received ₹3,540 via cash', time: '17:57:54', ok: true },
        { type: 'Payment Received', detail: 'Received ₹60 via upi', time: '16:21:09', ok: true },
        { type: 'Invoice Overdue', detail: 'STR-5739-2359 · ₹8,644', time: '09:00:00', ok: false },
    ];
    return (
        <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/10 via-cyan-500/8 to-teal-500/10 rounded-[3rem] blur-3xl" />
            <motion.div className="relative bg-[#080c18]/95 border border-white/[0.07] rounded-[1.75rem] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.8)]"
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
                <BeamScanner />
                <div className="bg-[#0d1117]/90 border-b border-white/[0.05] px-5 py-3 flex items-center gap-2 backdrop-blur">
                    <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-400/70" /><div className="w-3 h-3 rounded-full bg-yellow-400/70" /><div className="w-3 h-3 rounded-full bg-emerald-400/70" /></div>
                    <div className="flex-1 flex justify-center">
                        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5">
                            <motion.div className="w-1.5 h-1.5 rounded-full bg-teal-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                            <span className="text-[11px] text-slate-400 font-mono">app.capita.ai/dashboard</span>
                            <Lock className="w-2.5 h-2.5 text-teal-500 ml-1" />
                        </div>
                    </div>
                </div>
                <div className="flex" style={{ minHeight: 440 }}>
                    <div className="w-44 flex-shrink-0 bg-[#070b14] border-r border-white/[0.04] p-4 flex flex-col gap-1">
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
                        <div className="grid grid-cols-4 gap-2.5 mb-3.5">
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
                        <div className="grid grid-cols-3 gap-2.5">
                            <div className="col-span-2 bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5">
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

// ─── Pricing Card ─────────────────────────────────────────────────────────────
function PricingCard({ tier, isAnnual, index }: { tier: TierType; isAnnual: boolean; index: number }) {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            className={`relative rounded-3xl p-6 flex flex-col overflow-hidden ${tier.bgTint} border ${tier.borderColor}`}
            style={{ transform: hovered ? 'translateY(-4px)' : tier.popular ? 'translateY(-12px)' : 'none', transition: 'transform 0.3s ease, box-shadow 0.3s ease', boxShadow: tier.popular ? '0 0 40px rgba(20,184,166,0.12)' : 'none' }}>
            <AnimatePresence>
                {hovered && <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ background: 'radial-gradient(circle at 50% 0%, rgba(20,184,166,0.06) 0%, transparent 70%)' }} />}
            </AnimatePresence>
            {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <motion.span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] font-black uppercase tracking-[0.15em] shadow-lg"
                        animate={{ boxShadow: ['0 0 10px rgba(20,184,166,0.3)', '0 0 25px rgba(20,184,166,0.55)', '0 0 10px rgba(20,184,166,0.3)'] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Sparkles className="w-2.5 h-2.5" /> Most Popular
                    </motion.span>
                </div>
            )}
            <div className="mt-2 mb-4">
                <motion.div className={`inline-flex p-2.5 rounded-2xl bg-gradient-to-br ${tier.gradient} shadow-lg mb-4`}
                    animate={hovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    <tier.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </motion.div>
                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                <p className="text-[11px] text-slate-500 mt-1">{tier.tagline}</p>
            </div>
            <div className="mb-5">
                <div className="flex items-baseline gap-1">
                    {tier.priceLabel ? (
                        <span className="text-[17px] font-black text-white">{tier.priceLabel}</span>
                    ) : (
                        <>
                            <AnimatePresence mode="wait">
                                <motion.span key={isAnnual ? 'a' : 'm'} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.2 }} className="text-3xl font-black text-white">
                                    {tier.price === null ? 'Custom' : tier.price === 0 ? 'Free' : isAnnual && tier.priceAnnual ? `₹${Math.round(tier.priceAnnual / 12).toLocaleString()}` : `₹${tier.price!.toLocaleString()}`}
                                </motion.span>
                            </AnimatePresence>
                            {tier.price !== null && tier.price > 0 && <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">/mo</span>}
                        </>
                    )}
                </div>
                {isAnnual && tier.priceAnnual && !tier.priceLabel && <p className="text-[10px] text-emerald-400 font-semibold mt-1">Billed ₹{tier.priceAnnual.toLocaleString()}/year</p>}
            </div>
            <ul className="space-y-2.5 mb-7 flex-1">
                {tier.features.map((f, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -5 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.04 }}
                        className="flex items-start gap-2 text-[12px] text-slate-300 font-medium">
                        <div className={`p-0.5 rounded-full bg-gradient-to-br ${tier.gradient} mt-0.5 flex-shrink-0`}>
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                        <span className="leading-snug">{f}</span>
                    </motion.li>
                ))}
            </ul>
            <Link to="/login" className={`w-full py-3 px-4 rounded-xl text-center text-[12px] font-black uppercase tracking-wider transition-all duration-300 ${tier.popular ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]' : 'bg-white/[0.05] text-white hover:bg-white/[0.1] border border-white/[0.1]'}`}>
                {tier.cta}
            </Link>
        </motion.div>
    );
}

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIERS: TierType[] = [
    { slug: 'free', name: 'Free Forever', tagline: 'Perfect to start', price: 0, priceAnnual: 0, icon: Star, gradient: 'from-gray-400 to-gray-600', borderColor: 'border-white/[0.07]', bgTint: 'bg-white/[0.02]', features: ['5 invoices/month', 'Basic GST validation', 'PDF export', '10 products/customers', 'Email support'], cta: 'Start Free' },
    { slug: 'freelancer', name: 'Freelancer', tagline: 'Solo pros & hustlers', price: 199, priceAnnual: 1990, icon: Zap, gradient: 'from-teal-400 to-cyan-500', borderColor: 'border-teal-500/30', bgTint: 'bg-teal-500/5', popular: true, features: ['Unlimited invoices', '50 AI requests/day', 'Email reminders', 'Collections coach', 'Basic inventory', 'Full reports', 'WhatsApp alerts', 'Priority support'], cta: 'Start Freelancer (₹16/mo)' },
    { slug: 'growth', name: 'Growth', tagline: 'Small teams scaling', price: 799, priceAnnual: 7990, icon: TrendingUp, gradient: 'from-emerald-400 to-teal-600', borderColor: 'border-emerald-500/30', bgTint: 'bg-emerald-500/5', features: ['Everything in Freelancer', '200 AI requests/day', 'Bulk operations', 'Advanced inventory', 'Team access (3 users)', 'API access', 'Phone support'], cta: 'Start Growth' },
    { slug: 'ca_partner', name: 'CA Partner', tagline: 'Earn ₹37/client/mo', price: 0, priceAnnual: null, priceLabel: '₹37 per active client', icon: Users, gradient: 'from-violet-500 to-purple-600', borderColor: 'border-violet-500/30', bgTint: 'bg-violet-500/5', features: ['Unlimited clients', 'White-label branding', 'Multi-client dashboard', '100 AI requests/client', 'You set client pricing', 'Compliance templates', 'CA-specific reports'], cta: 'Join Partner Program' },
    { slug: 'enterprise', name: 'Enterprise', tagline: 'Large agencies & firms', price: null, priceAnnual: null, icon: Building2, gradient: 'from-amber-500 to-orange-600', borderColor: 'border-amber-500/30', bgTint: 'bg-amber-500/5', features: ['Custom AI limits', 'Full API + webhooks', 'SLA & dedicated support', 'Custom integrations', 'On-premise option', 'Advanced security'], cta: 'Contact Sales' },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } };

// ─── Main ─────────────────────────────────────────────────────────────────────
export const Landing: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isAnnual, setIsAnnual] = useState(false);
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
        <div className="min-h-screen bg-[#050810] text-white overflow-x-hidden selection:bg-teal-500/30 cursor-none font-sans">

            <CustomCursor />
            <ParticleField />

            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[#050810]" />
                <PerspectiveGrid />
                <Geometric3DLayer />
                <Blob className="w-[800px] h-[800px] -top-60 -left-40 opacity-25" color="rgba(20,184,166,0.18)" delay={0} />
                <Blob className="w-[600px] h-[600px] top-1/2 -right-40 opacity-18" color="rgba(14,165,233,0.15)" delay={7} />
                <Blob className="w-[500px] h-[500px] bottom-0 left-1/3 opacity-12" color="rgba(20,184,166,0.12)" delay={14} />
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
                            <span className="font-display font-bold text-xl text-white tracking-tight">Capita <span className="text-teal-400">AI</span></span>
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
                <motion.div style={{ y: heroY, opacity: heroO, scale: heroScale }} className="max-w-6xl mx-auto px-6 relative z-10 w-full">
                    <div className="text-center mb-16">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-[11px] font-black uppercase tracking-[0.2em] mb-8 relative">
                                <motion.span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" animate={{ scale: [1, 1.8, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                                India's Financial OS for Agencies
                                <motion.span className="absolute inset-0 rounded-full border border-teal-500/20" animate={{ scale: [1, 1.07, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }} />
                            </div>
                        </motion.div>

                        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                            className="font-display font-bold leading-[0.87] tracking-tight mb-6" style={{ fontSize: 'clamp(48px, 9.5vw, 112px)' }}>
                            <span className="text-white">Stop Chasing</span>
                            <br />
                            <span className="relative inline-block">
                                <AnimatePresence mode="wait">
                                    <motion.span key={wIdx}
                                        className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 inline-block"
                                        initial={{ y: 60, opacity: 0, filter: 'blur(8px)' }}
                                        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                                        exit={{ y: -60, opacity: 0, filter: 'blur(8px)' }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                                        {words[wIdx]}
                                    </motion.span>
                                </AnimatePresence>
                            </span>
                        </motion.h1>

                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.35 }}
                            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                            CapitaEdgeX is the complete Financial OS for Indian marketing agencies and freelancers — invoicing, collections, payments, compliance, and reporting in one place.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                            <Magnetic>
                                <Link to="/login"
                                    className="group relative w-full sm:w-auto px-10 py-5 bg-teal-500 text-white rounded-2xl font-bold text-[17px] overflow-hidden flex items-center justify-center gap-2.5"
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
                                <div className="font-display font-bold text-4xl text-white mb-2"><Counter to={s.to} suffix={s.suffix} /></div>
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
                        <motion.h2 variants={fadeUp} className="font-display font-bold text-white leading-tight" style={{ fontSize: 'clamp(32px, 5.5vw, 64px)' }}>
                            Every financial tool<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">your agency needs.</span>
                        </motion.h2>
                    </motion.div>

                    {/* Invoice */}
                    <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[11px] font-bold uppercase tracking-[0.18em] mb-5">Invoice Management</div>
                            <h3 className="font-display font-bold text-white text-3xl md:text-4xl mb-4 leading-tight">Every invoice. Every status. <span className="text-teal-400">Total control.</span></h3>
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
                    <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="lg:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[11px] font-bold uppercase tracking-[0.18em] mb-5">Live Monitoring</div>
                            <h3 className="font-display font-bold text-white text-3xl md:text-4xl mb-4 leading-tight">Your revenue <span className="text-teal-400">command centre.</span></h3>
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
                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-400">Mission Control · Live</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5 mb-3">
                                    {[{ label: 'Pending Revenue', val: '₹27,03,800', color: 'text-white', sub: '500 invoices pending' }, { label: 'Action Required', val: '₹13,03,000', color: 'text-orange-400', sub: '250 overdue' }, { label: 'Cash Collected', val: '₹13,17,600', color: 'text-teal-400', sub: '65% of goal' }, { label: 'Active Clients', val: '4,004', color: 'text-white', sub: 'Manage clients' }].map((k, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                            className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-2.5">
                                            <div className="text-[8.5px] text-slate-600 font-semibold uppercase tracking-wider mb-1">{k.label}</div>
                                            <div className={`font-bold text-[15px] ${k.color}`}>{k.val}</div>
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
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[11px] font-bold uppercase tracking-[0.18em] mb-5">Analytics & Reports</div>
                            <h3 className="font-display font-bold text-white text-3xl md:text-4xl mb-4 leading-tight">P&L in real-time. <span className="text-teal-400">No accountant needed.</span></h3>
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
                        <div className="hidden md:block absolute top-14 left-[12.5%] right-[12.5%] h-px">
                            <motion.div className="h-full bg-gradient-to-r from-transparent via-teal-500/40 to-transparent"
                                initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.4 }} />
                        </div>
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
            <section id="pricing" className="py-24 relative z-10 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <Blob className="w-[700px] h-[700px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15" color="rgba(20,184,166,0.2)" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,transparent_40%,#050810_90%)]" />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
                        <motion.div variants={fadeUp} className="text-teal-400 font-black uppercase tracking-[0.22em] text-[11px] mb-4">Pricing</motion.div>
                        <motion.h2 variants={fadeUp} className="display font-black text-white leading-tight mb-5" style={{ fontSize: 'clamp(30px, 5vw, 60px)' }}>Simple, honest pricing.</motion.h2>
                        <motion.p variants={fadeUp} className="text-slate-400 max-w-xl mx-auto font-medium">Choose the plan that matches your business stage. Upgrade or downgrade anytime.</motion.p>
                        <motion.div variants={fadeUp} className="mt-8 inline-flex items-center gap-1 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl">
                            {['Monthly', 'Annual'].map((label, i) => {
                                const active = i === 0 ? !isAnnual : isAnnual;
                                return (
                                    <button key={label} onClick={() => setIsAnnual(i === 1)}
                                        className={`relative px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${active ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                                        {active && <motion.div layoutId="pricingToggle" className="absolute inset-0 bg-teal-500 rounded-lg shadow-[0_0_15px_rgba(20,184,166,0.3)]" />}
                                        <span className="relative z-10 flex items-center gap-2">
                                            {label}
                                            {i === 1 && <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider">Save 17%</span>}
                                        </span>
                                    </button>
                                );
                            })}
                        </motion.div>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                        {TIERS.map((tier, idx) => <PricingCard key={tier.slug} tier={tier} isAnnual={isAnnual} index={idx} />)}
                    </div>
                </div>
            </section>

            {/* TRUST */}
            <section className="py-16 relative z-10">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { icon: Shield, title: 'Bank-grade security', desc: 'All data encrypted in transit and at rest. Your financial data stays private.' },
                            { icon: Globe, title: 'Built for India', desc: 'GST, TDS, UPI, INR-native. Designed around how Indian businesses actually work.' },
                            { icon: Zap, title: 'Always up-to-date', desc: 'Continuous updates to stay compliant with the latest GST regulations and changes.' },
                        ].map((item, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex gap-4 items-start hover:border-teal-500/20 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                                    <item.icon className="w-5 h-5 text-teal-400" />
                                </div>
                                <div><h4 className="font-black text-white text-[14px] mb-1">{item.title}</h4><p className="text-slate-500 text-[12.5px] leading-relaxed">{item.desc}</p></div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-20 relative z-10">
                <div className="max-w-2xl mx-auto px-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
                        <h2 className="display font-black text-white text-3xl md:text-4xl">Questions answered.</h2>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
                        className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-8 py-4">
                        {[
                            { q: 'Is this built for Indian businesses?', a: 'Yes, completely. Capita handles GST-compliant invoicing, TDS, INR-native reporting, and is designed around how Indian agencies and freelancers actually bill clients — including UPI payment tracking and reconciliation.' },
                            { q: 'Can I import my existing invoices and clients?', a: 'You can add clients manually or in bulk. You can start fresh with Capita immediately and build your invoice history from day one.' },
                            { q: 'How does the Debt Hunter actually work?', a: 'You activate it per invoice. Capita then sends politely-worded automated email reminders on a smart schedule — escalating tone based on how overdue the invoice is. No spam, no robotic messages.' },
                            { q: 'Is my financial data secure?', a: 'Yes. All data is encrypted in transit and at rest. We follow industry-standard security practices. Your invoice and payment data is never shared or sold.' },
                            { q: "Do I need to be technical to use it?", a: 'Not at all. Capita is designed for agency owners and freelancers, not developers. If you can use Gmail, you can use Capita. The setup takes under 5 minutes.' },
                            { q: "What payment methods does Capita track?", a: 'Capita tracks UPI, cash, card, cheque, and net banking payments. You can manually record payments or link with Razorpay for automatic reconciliation.' },
                        ].map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
                    </motion.div>
                </div>
            </section>

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
            <footer className="py-12 border-t border-white/[0.05] relative z-10">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="relative">
                            <motion.div className="absolute inset-0 bg-teal-500 blur-md opacity-40 rounded-lg" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} />
                            <div className="relative w-7 h-7 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-lg flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" /></div>
                        </div>
                        <span className="display font-black text-white tracking-tight">CapitaEdgeX</span>
                        <span className="text-slate-600 text-[12px] ml-1">— Financial OS for Agencies</span>
                    </div>
                    <div className="flex gap-7 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {['Privacy', 'Terms', 'Contact'].map(l => (
                            <a key={l} href="#" className="hover:text-white transition-colors relative group">
                                {l}<span className="absolute -bottom-0.5 left-0 w-0 h-px bg-teal-400 group-hover:w-full transition-all duration-300" />
                            </a>
                        ))}
                    </div>
                    <div className="text-slate-600 text-[11px] font-semibold">© {new Date().getFullYear()} Laboratory Capita, Inc.</div>
                </div>
            </footer>
        </div>
    );
};