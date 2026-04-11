import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogoSplashProps {
    onComplete: () => void;
}

export function LogoSplash({ onComplete }: LogoSplashProps) {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setShow(false), 2600);
        return () => clearTimeout(t);
    }, []);

    return (
        <AnimatePresence onExitComplete={onComplete}>
            {show && (
                <motion.div
                    key="splash"
                    className="fixed inset-0 z-[100] bg-[#050810] flex items-center justify-center"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: 'blur(8px)' }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Background grid */}
                    <div
                        className="absolute inset-0 opacity-[0.025] pointer-events-none"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(148,163,184,1) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,1) 1px,transparent 1px)',
                            backgroundSize: '64px 64px',
                        }}
                    />

                    {/* Soft radial glow */}
                    <motion.div
                        className="absolute w-[700px] h-[700px] rounded-full pointer-events-none"
                        style={{
                            background:
                                'radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 60%)',
                        }}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                    />

                    {/* Expanding rings */}
                    {[0, 0.4, 0.8].map((delay, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full border border-teal-500/20 pointer-events-none"
                            style={{ width: 160, height: 160 }}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 2.6, opacity: 0 }}
                            transition={{
                                duration: 2.2,
                                delay,
                                ease: [0.16, 1, 0.3, 1],
                                repeat: 0,
                            }}
                        />
                    ))}

                    <div className="relative flex flex-col items-center gap-6">
                        {/* Logo tile with animated SVG paths */}
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className="relative"
                        >
                            <div
                                className="absolute inset-0 rounded-[28px]"
                                style={{
                                    background: '#0d0d0d',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    boxShadow:
                                        '0 30px 80px -20px rgba(20,184,166,0.35), 0 0 0 1px rgba(20,184,166,0.05)',
                                }}
                            />

                            <svg
                                viewBox="0 0 110 110"
                                className="relative w-36 h-36 p-5"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Outer "C" — strokes itself in, then fills */}
                                <motion.path
                                    d="M80 20 L40 20 L18 42 L18 68 L40 90 L80 90 L80 76 L48 76 L32 62 L32 48 L48 34 L80 34 Z"
                                    stroke="white"
                                    strokeWidth={1.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="white"
                                    initial={{ pathLength: 0, fillOpacity: 0 }}
                                    animate={{ pathLength: 1, fillOpacity: 1 }}
                                    transition={{
                                        pathLength: {
                                            duration: 1.3,
                                            ease: [0.16, 1, 0.3, 1],
                                            delay: 0.2,
                                        },
                                        fillOpacity: { duration: 0.5, delay: 1.05 },
                                    }}
                                />

                                {/* Inner accent — strokes in, then fills teal */}
                                <motion.path
                                    d="M58 34 L44 48 L44 62 L58 76 L68 76 L54 62 L54 48 L68 34 Z"
                                    stroke="#1D9E75"
                                    strokeWidth={1.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="#1D9E75"
                                    initial={{ pathLength: 0, fillOpacity: 0 }}
                                    animate={{ pathLength: 1, fillOpacity: 1 }}
                                    transition={{
                                        pathLength: {
                                            duration: 0.9,
                                            ease: [0.16, 1, 0.3, 1],
                                            delay: 0.95,
                                        },
                                        fillOpacity: { duration: 0.45, delay: 1.55 },
                                    }}
                                />
                            </svg>

                            {/* Scan line across the logo tile */}
                            <motion.div
                                className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.4, delay: 0.3 }}
                            >
                                <motion.div
                                    className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-300/70 to-transparent"
                                    initial={{ y: -4 }}
                                    animate={{ y: 144 }}
                                    transition={{ duration: 1.4, delay: 0.3, ease: 'linear' }}
                                />
                            </motion.div>
                        </motion.div>

                        {/* Wordmark */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.45, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                            className="text-center"
                        >
                            <div className="font-semibold text-white text-[26px] tracking-tight">
                                Capita<span className="text-teal-400">EdgeX</span>
                            </div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.7, duration: 0.5 }}
                                className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-slate-500 mt-2"
                            >
                                Financial OS · Made in India
                            </motion.div>
                        </motion.div>

                        {/* Progress bar */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                            className="w-36 h-px bg-white/10 relative overflow-hidden mt-2"
                        >
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-400 to-cyan-300"
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2.1, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
