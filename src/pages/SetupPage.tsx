import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePersona, BusinessType } from '../contexts/PersonaContext';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { supabase } from '../supabaseClient';
import {
    Loader2,
    ShieldCheck,
    AlertCircle,
    Building,
    CheckCircle2,
    Zap,
    ArrowRight,
    ArrowLeft,
    Cpu,
    Globe,
    Database,
    Terminal,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'calibrate' | 'identity' | 'persona' | 'processing' | 'done';

export function SetupPage() {
    const { user, loading: authLoading } = useAuth();
    const { refreshPersona, businessType, organizationId: organizationId, loading: personaLoading } = usePersona();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('calibrate');
    const isProvisioningRef = useRef(false);

    // Guard: redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login', { replace: true });
        }
    }, [authLoading, user, navigate]);

    // Guard: hydration check - stay in neutral theme until status is 100% stable
    // (Actual early return logic moved below hooks to comply with React rules)

    // Guard: redirect out of setup if already provisioned (Strict check)
    useEffect(() => {
        if (
            !authLoading &&
            !personaLoading &&
            organizationId &&
            businessType &&
            !isProvisioningRef.current &&
            step !== 'processing' &&
            step !== 'done'
        ) {
            navigate('/dashboard', { replace: true });
        }
    }, [authLoading, personaLoading, organizationId, businessType, step, navigate]);

    const [companyName, setCompanyName] = useState(user?.user_metadata?.company_name || '');
    const [selectedPersona, setSelectedPersona] = useState<BusinessType>('solopreneur');
    const [error, setError] = useState<string | null>(null);
    const [calibrationLogs, setCalibrationLogs] = useState<string[]>([]);
    
    const initializedRef = useRef(false);

    useEffect(() => {
        if (step === 'calibrate') {
            const logs = [
                "Initializing Capita Core v2.5...",
                "Scanning secure nodes...",
                "Calibrating neural UI layers...",
                "Synchronizing with protocol...",
                "Establishment sequence ready."
            ];
            let i = 0;
            const interval = setInterval(() => {
                if (i < logs.length) {
                    setCalibrationLogs(prev => [...prev, `[SYSTEM]: ${logs[i]}`]);
                    i++;
                } else {
                    clearInterval(interval);
                    setTimeout(() => setStep('identity'), 1000);
                }
            }, 600);
            return () => clearInterval(interval);
        }
    }, [step]);

    // Pre-fill company name exactly once when user data becomes available
    useEffect(() => {
        if (user?.user_metadata?.company_name && !initializedRef.current) {
            setCompanyName(user.user_metadata.company_name);
            initializedRef.current = true;
        }
    }, [user]);

    const handleProvisioning = async () => {
        if (!companyName.trim()) {
            setError('Please enter your business name.');
            setStep('identity');
            return;
        }

        isProvisioningRef.current = true;
        setStep('processing');
        setError(null);
        try {
            // 0. Wait for Supabase session to be ready (PKCE exchange can take a moment after OAuth redirect)
            let session = null;
            for (let attempt = 0; attempt < 17; attempt++) {
                const { data } = await supabase.auth.getSession();
                if (data.session?.access_token) {
                    session = data.session;
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            if (!session?.access_token) {
                throw new Error('Authentication session not ready. Please refresh and try again.');
            }

            // 1. Call backend to provision organization
            if (!organizationId) {
                try {
                    await api.post(ENDPOINTS.AUTH_PROVISION, { 
                        companyName: companyName.trim(),
                        businessType: selectedPersona
                    });
                } catch (provisionErr: any) {
                    const msg = (provisionErr?.message ?? '').toLowerCase();
                    // Already provisioned is fine — org exists, just continue
                    if (!msg.includes('already belongs') && !msg.includes('already provisioned')) {
                        throw provisionErr; // real error — rethrow
                    }
                }
            }

            // 2. Always refresh persona after provisioning attempt
            await refreshPersona();

            // 3. Redirect
            setStep('done');
            setTimeout(() => navigate('/dashboard'), 2500);
        } catch (err: any) {
            console.error('[SetupPage] provisioning error:', err);
            const msg = (err?.message ?? '').toLowerCase();
            let friendlyError = 'Something went wrong. Please try again.';
            
            if (msg.includes('failed to fetch')) {
                friendlyError = 'Backend server unreachable. Please ensure the server is running on port 3000.';
            } else if (msg.includes('already belongs') || msg.includes('already provisioned')) {
                friendlyError = 'Your account is already set up. Redirecting...';
            } else if (msg.includes('session not ready') || msg.includes('authentication')) {
                friendlyError = 'Sign-in timed out. Please refresh and try again.';
            } else if (msg.includes('company name') || msg.includes('required')) {
                friendlyError = 'Please enter your business name.';
            }
            
            setError(friendlyError);
            setStep(organizationId ? 'persona' : 'identity');
        } finally {
            isProvisioningRef.current = false;
        }
    };

    const personas = [
        {
            id: 'solopreneur',
            label: 'Freelancer / Consultant',
            desc: 'Invoice clients, auto GST + TDS, payment reminders — 90 seconds.',
            icon: <Activity className="w-6 h-6" />,
            available: true
        },
        {
            id: 'services_firm',
            label: 'Service firm',
            desc: 'Multi-client invoicing, team approvals, smart collections.',
            icon: <Globe className="w-6 h-6" />,
            available: false
        },
        {
            id: 'ecommerce',
            label: 'Ecommerce seller',
            desc: 'Amazon + Flipkart auto-invoicing, HSN GST, marketplace reconciliation.',
            icon: <Database className="w-6 h-6" />,
            available: false
        },
        {
            id: 'subscription',
            label: 'SaaS / Subscription',
            desc: 'MRR tracking, recurring billing, OIDAR rules for foreign buyers.',
            icon: <Zap className="w-6 h-6" />,
            available: false
        },
    ];

    // Guard: hydration check - stay in neutral theme until status is 100% stable
    // MOVED here to comply with Rules of Hooks (must be after all top-level hooks)
    const isHydratingStatus = authLoading || personaLoading;
    if (isHydratingStatus) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#040608]">
                <div className="w-12 h-12 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#040608] font-sans selection:bg-teal-500/20 relative overflow-x-hidden flex flex-col items-center justify-center py-6 md:py-12 px-4">
            {/* Background Grid & Particles */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Ambient Glows */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/5 blur-[130px] rounded-full animate-pulse pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[130px] rounded-full animate-pulse pointer-events-none" />

            <div className="w-full max-w-[500px] relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-[#0c111d]/50 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 md:p-10 shadow-2xl flex flex-col min-h-[460px] w-full"
                >
                    <AnimatePresence mode="wait">
                        {step === 'calibrate' && (
                            <motion.div
                                key="calibrate"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex flex-col flex-1 justify-center items-center space-y-8"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-2xl animate-pulse" />
                                    <Terminal className="w-12 h-12 text-teal-400 relative z-10" />
                                </div>
                                <div className="w-full max-w-sm space-y-2">
                                    {calibrationLogs.map((log, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="font-mono text-[11px] text-teal-500/70"
                                        >
                                            {log}
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-teal-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 3.5, ease: "easeInOut" }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 'identity' && (
                            <motion.div
                                key="identity"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                className="space-y-10"
                            >
                                <div className="text-center space-y-3">
                                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shadow-inner">
                                        <Building className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-2">Build your space.</h1>
                                        <p className="text-gray-400 text-[13px] font-medium">Initialize your business identity in the protocol architecture.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Your business name</label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                placeholder="e.g. Rahul Mehta Designs"
                                                className="w-full px-6 py-4 bg-white/[0.04] border-2 border-white/[0.08] rounded-2xl text-white text-base font-bold focus:bg-white/[0.06] focus:border-teal-500/40 focus:ring-8 focus:ring-teal-500/5 outline-none transition-all placeholder:text-gray-700"
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                                <Cpu className="w-4 h-4 text-teal-500/50 animate-spin" />
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-5 rounded-[24px] bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-4"
                                        >
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            {error}
                                        </motion.div>
                                    )}

                                    <button
                                        onClick={() => companyName && setStep('persona')}
                                        disabled={!companyName}
                                        className="w-full py-4 bg-gradient-to-br from-teal-400 to-blue-600 hover:brightness-110 text-white rounded-2xl font-black text-sm shadow-2xl shadow-teal-500/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-30 active:scale-[0.98]"
                                    >
                                        Establish Connection
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'persona' && (
                            <motion.div
                                key="persona"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                className="space-y-10"
                            >
                                <div className="text-center space-y-3">
                                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-inner">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-2">Define Operation.</h1>
                                        <p className="text-gray-400 text-[13px] font-medium">Adapting neural UI layers to your specific business model.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {personas.map((p, idx) => (
                                        <motion.button
                                            key={p.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => p.available && setSelectedPersona(p.id as any)}
                                            disabled={!p.available}
                                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all relative group
                                                ${!p.available ? 'opacity-40 grayscale-[0.5] cursor-not-allowed border-white/5 bg-white/[0.005]' :
                                                  selectedPersona === p.id
                                                    ? 'border-teal-500/50 bg-teal-500/[0.03] shadow-sm'
                                                    : 'border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.02]'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-all
                                                ${!p.available ? 'bg-white/5 border-white/5 text-gray-600' :
                                                  selectedPersona === p.id
                                                    ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                                                    : 'bg-white/5 border-white/5 text-gray-500'}`}>
                                                {p.icon}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-bold text-sm tracking-tight ${selectedPersona === p.id ? 'text-teal-400' : 'text-white'}`}>
                                                        {p.label}
                                                    </h4>
                                                    {!p.available && (
                                                        <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-gray-500">
                                                            Soon
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">
                                                    {p.desc}
                                                </p>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                                                ${selectedPersona === p.id
                                                    ? 'border-teal-500 bg-teal-500'
                                                    : 'border-white/10'}`}>
                                                {selectedPersona === p.id && <CheckCircle2 className="w-2.5 h-2.5 text-[#040608]" />}
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep('identity')}
                                        className="px-6 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-gray-500 hover:text-white rounded-2xl border border-white/10 transition-all active:scale-95 group"
                                    >
                                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                    </button>
                                    <button
                                        onClick={handleProvisioning}
                                        className="flex-1 py-4 bg-gradient-to-br from-teal-400 to-blue-600 hover:brightness-110 text-white rounded-2xl font-black text-sm shadow-2xl shadow-teal-500/20 transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
                                    >
                                        Initialize Protocol
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
                                className="flex flex-col flex-1 justify-center items-center text-center space-y-10"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-3xl animate-ping opacity-30"></div>
                                    <div className="relative bg-[#0c111d] rounded-3xl p-8 shadow-2xl border border-white/10 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-teal-500/5 to-transparent" />
                                        <Loader2 className="w-12 h-12 text-teal-400 animate-spin relative z-10" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h1 className="text-2xl font-black text-white tracking-tight">Deploying Instance...</h1>
                                    <p className="text-gray-500 text-[13px] font-medium max-w-xs mx-auto">
                                        Seeding secure financial modules and establishing encrypted cloud connectivity.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{
                                                scale: [1, 1.5, 1],
                                                opacity: [0.3, 1, 0.3]
                                            }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1.5,
                                                delay: i * 0.2
                                            }}
                                            className="w-2 h-2 rounded-full bg-teal-500"
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 'done' && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col flex-1 justify-center items-center text-center space-y-10"
                            >
                                <motion.div
                                    initial={{ y: 20 }}
                                    animate={{ y: 0 }}
                                    className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-gradient-to-br from-emerald-400 to-teal-700 text-white shadow-3xl shadow-emerald-500/30 mb-2 border border-white/20"
                                >
                                    <CheckCircle2 className="w-12 h-12" />
                                </motion.div>
                                <div className="space-y-3">
                                    <h1 className="text-3xl font-black text-white tracking-tight">Access Granted.</h1>
                                    <p className="text-gray-500 text-[13px] font-medium">Welcome to your new autonomous financial nervous system.</p>
                                </div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="text-teal-500/50 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse"
                                >
                                    Redirecting to secure terminal...
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ delay: 1 }}
                    className="text-center mt-8 space-y-3"
                >
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500">CapitaEdgeX Protocol v2.5 // Core-Node-Alpha</p>
                    <div className="flex justify-center gap-3 opacity-30">
                        <div className="w-1 h-px bg-gray-600" />
                        <div className="w-3 h-px bg-teal-600" />
                        <div className="w-1 h-px bg-gray-600" />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
