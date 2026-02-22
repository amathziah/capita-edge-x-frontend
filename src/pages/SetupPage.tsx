import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePersona } from '../contexts/PersonaContext';
import { Loader2, ShieldCheck, AlertCircle, Building, CheckCircle2, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'identity' | 'persona' | 'processing' | 'done';

export function SetupPage() {
    const { user, refreshOrgContext, orgId } = useAuth();
    const { businessType, updatePersona } = usePersona();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('identity');
    const [companyName, setCompanyName] = useState(user?.user_metadata?.company_name || '');
    const [selectedPersona, setSelectedPersona] = useState<'solopreneur' | 'agency' | 'saas' | 'ecommerce'>('solopreneur');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (orgId && !businessType) {
            setStep('persona');
        }
    }, [orgId, businessType]);

    useEffect(() => {
        if (user?.user_metadata?.company_name && !companyName) {
            setCompanyName(user.user_metadata.company_name);
        }
    }, [user, companyName]);

    const handleProvisioning = async () => {
        setStep('processing');
        setError(null);
        try {
            // 1. Call backend to provision organization (only if not already set)
            if (!orgId) {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/provision`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${(await (await import('../supabaseClient')).supabase.auth.getSession()).data.session?.access_token}`,
                    },
                    body: JSON.stringify({ companyName }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to set up organization');
                }
            }

            // 2. Update persona
            await updatePersona(selectedPersona);

            // 3. Refresh context and redirect
            await refreshOrgContext();
            setStep('done');
            setTimeout(() => navigate('/'), 2000);
        } catch (err: any) {
            console.error('Setup error:', err);
            setError(err.message);
            setStep('identity'); // Go back to start on error
        }
    };

    const personas = [
        { id: 'solopreneur', label: 'Solopreneur', desc: 'Managing it all myself.', icon: '🧑‍💻' },
        { id: 'saas', label: 'SaaS Founder', desc: 'Subscriptions & MRR.', icon: '🚀' },
        { id: 'agency', label: 'Agency Owner', desc: 'Clients & Projects.', icon: '🏢' },
        { id: 'ecommerce', label: 'E-commerce', desc: 'Products & Orders.', icon: '📦' },
    ];

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#080a14] font-sans selection:bg-teal-500/20 overflow-hidden relative">
            {/* Background Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />

            <div className="w-full max-w-[540px] px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-[#111625]/80 backdrop-blur-xl border border-white/10 rounded-[40px] p-10 shadow-2xl shadow-black/40"
                >
                    <AnimatePresence mode="wait">
                        {step === 'identity' && (
                            <motion.div
                                key="identity"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-400 mb-6 shadow-lg shadow-teal-500/10">
                                        <Building className="w-10 h-10" />
                                    </div>
                                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Build your space.</h1>
                                    <p className="text-gray-400 text-sm font-medium">Initialize your business identity in the protocol.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 ml-1">Workspace Identity</label>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="e.g. Malika Core"
                                            className="w-full px-6 py-4.5 bg-white/[0.03] border-2 border-white/[0.06] rounded-[24px] text-white font-bold focus:bg-white/[0.05] focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/5 outline-none transition-all placeholder:text-gray-600"
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-4 rounded-[20px] bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-3 animate-shake">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => companyName && setStep('persona')}
                                        disabled={!companyName}
                                        className="w-full py-5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white rounded-[24px] font-black text-sm shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-20 group active:scale-[0.98]"
                                    >
                                        Next Component
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'persona' && (
                            <motion.div
                                key="persona"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-400 mb-6 shadow-lg shadow-teal-500/10">
                                        <Zap className="w-10 h-10" />
                                    </div>
                                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">How do you work?</h1>
                                    <p className="text-gray-400 text-sm font-medium">The UI will adapt its neural layout to your model.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {personas.map((p, idx) => (
                                        <motion.button
                                            key={p.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => setSelectedPersona(p.id as any)}
                                            className={`p-5 rounded-[28px] border-2 text-left transition-all relative group h-full
                                                ${selectedPersona === p.id
                                                    ? 'border-teal-500 bg-teal-500/10 ring-8 ring-teal-500/5'
                                                    : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'}`}
                                        >
                                            <div className="text-3xl mb-4 grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110 origin-left">
                                                {p.icon}
                                            </div>
                                            <h4 className={`font-black text-sm tracking-tight ${selectedPersona === p.id ? 'text-teal-400' : 'text-white'}`}>
                                                {p.label}
                                            </h4>
                                            <p className="text-[10px] text-gray-500 font-bold mt-1.5 leading-relaxed group-hover:text-gray-400 transition-colors">
                                                {p.desc}
                                            </p>
                                            {selectedPersona === p.id && (
                                                <div className="absolute top-4 right-4 text-teal-400">
                                                    <CheckCircle2 className="w-6 h-6 fill-teal-400/10" />
                                                </div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep('identity')}
                                        className="p-5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-[24px] border border-white/5 transition-all active:scale-95"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleProvisioning}
                                        className="flex-1 py-5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white rounded-[24px] font-black text-sm shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
                                    >
                                        Launch Platform
                                        <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12"
                            >
                                <div className="relative inline-flex mb-10">
                                    <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping"></div>
                                    <div className="relative bg-[#0c0f1a] rounded-full p-8 shadow-2xl border border-teal-500/20">
                                        <Loader2 className="w-14 h-14 text-teal-400 animate-spin" />
                                    </div>
                                </div>
                                <h1 className="text-2xl font-black text-white mb-3 tracking-tight">Deploying Workspace...</h1>
                                <p className="text-gray-500 text-sm font-medium">Initializing secure modules and adapting neural UI layers.</p>
                            </motion.div>
                        )}

                        {step === 'done' && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12"
                            >
                                <div className="inline-flex items-center justify-center w-28 h-28 rounded-[36px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-500/30 mb-10">
                                    <ShieldCheck className="w-14 h-14" />
                                </div>
                                <h1 className="text-2xl font-black text-white mb-3 tracking-tight">Ready to Go.</h1>
                                <p className="text-gray-500 text-sm font-medium">Welcome to your new financial nervous system.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <div className="text-center mt-12">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700/60">Malika AI Protocol v2.5 // Secure Node</p>
                </div>
            </div>
        </div>
    );
}
