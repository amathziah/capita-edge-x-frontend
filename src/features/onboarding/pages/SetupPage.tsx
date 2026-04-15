import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { usePersona, BusinessType } from '@/app/providers/PersonaContext';
import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { supabase } from '@/shared/lib/supabaseClient';
import { hasCompletedOnboarding } from '@/shared/lib/authFlow';
import {
    Loader2,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Zap,
    Activity,
    Globe,
    Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'identity' | 'persona';

export function SetupPage() {
    const { user, loading: authLoading } = useAuth();
    const { refreshPersona, businessType, organizationId: organizationId, loading: personaLoading } = usePersona();
    const navigate = useNavigate();
    const isHydratingStatus = authLoading || personaLoading;
    const isOnboarded = hasCompletedOnboarding(organizationId, businessType);

    const [step, setStep] = useState<Step>('identity');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // useRef guard prevents double-submit race: React state batching means two
    // rapid clicks both see isSubmitting=false before the first re-render.
    const submittingRef = useRef(false);

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
            !isHydratingStatus &&
            isOnboarded &&
            !isSubmitting
        ) {
            navigate('/dashboard', { replace: true });
        }
    }, [isHydratingStatus, isOnboarded, isSubmitting, navigate]);

    const [companyName, setCompanyName] = useState(user?.user_metadata?.company_name || '');
    const [selectedPersona, setSelectedPersona] = useState<BusinessType>('solopreneur');
    const [error, setError] = useState<string | null>(null);
    
    const initializedRef = useRef(false);

    // Pre-fill company name exactly once when user data becomes available
    useEffect(() => {
        if (user?.user_metadata?.company_name && !initializedRef.current) {
            setCompanyName(user.user_metadata.company_name);
            initializedRef.current = true;
        }
    }, [user]);

    // Wraps any promise with a timeout that rejects with a clear message.
    const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
        Promise.race([
            promise,
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`${label} timed out. Please try again.`)), ms)
            ),
        ]);

    const handleProvisioning = async () => {
        // Synchronous ref check prevents double-submit race before React re-renders
        if (submittingRef.current) return;
        submittingRef.current = true;

        if (!companyName.trim()) {
            setError('Please enter your business name.');
            setStep('identity');
            submittingRef.current = false;
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            // 0. Ensure session is valid before calling backend
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session?.access_token) {
                throw new Error('Session expired. Please sign in again.');
            }

            // 1. Provision organization (30-second timeout)
            if (!isOnboarded) {
                try {
                    await withTimeout(
                        api.post(ENDPOINTS.AUTH_PROVISION, {
                            companyName: companyName.trim(),
                            businessType: selectedPersona,
                        }),
                        30_000,
                        'Workspace setup'
                    );
                } catch (provisionErr: any) {
                    const msg = (provisionErr?.message ?? '').toLowerCase();
                    // "Already provisioned" is not an error — org exists, continue
                    if (!msg.includes('already belongs') && !msg.includes('already provisioned')) {
                        throw provisionErr;
                    }
                }
            }

            // 2. Refresh persona context (10-second timeout)
            await withTimeout(refreshPersona(), 10_000, 'Profile sync');

            // 3. Navigate to dashboard
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            console.error('[SetupPage] provisioning error:', err);
            const msg = (err?.message ?? '').toLowerCase();
            let friendlyError = 'Something went wrong. Please try again.';

            if (msg.includes('timed out')) {
                friendlyError = 'The server took too long to respond. Please try again.';
            } else if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network')) {
                friendlyError = 'We could not reach the server. Check your connection and try again.';
            } else if (msg.includes('already belongs') || msg.includes('already provisioned')) {
                friendlyError = 'Your account is already set up. Redirecting...';
                navigate('/dashboard', { replace: true });
            } else if (msg.includes('session expired') || msg.includes('session not ready') || msg.includes('authentication')) {
                friendlyError = 'Your session expired. Please refresh and sign in again.';
            } else if (msg.includes('company name') || msg.includes('required')) {
                friendlyError = 'Please enter your business name.';
            } else if (msg.includes('seeding') || msg.includes('synchronization') || msg.includes('initialization')) {
                friendlyError = 'Setup was interrupted. Your account is safe — please try again.';
            }

            setError(friendlyError);
            setStep(hasMultiplePersonaChoices && companyName.trim() ? 'persona' : 'identity');
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
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

    const availablePersonas = personas.filter((persona) => persona.available);
    const hasMultiplePersonaChoices = availablePersonas.length > 1;
    const primaryPersona = availablePersonas[0] ?? null;

    const handleIdentityContinue = async () => {
        if (!companyName.trim()) {
            setError('Please enter your business name.');
            return;
        }

        if (hasMultiplePersonaChoices) {
            setStep('persona');
            return;
        }

        await handleProvisioning();
    };

    // Guard: hydration check - stay in neutral theme until status is 100% stable
    // MOVED here to comply with Rules of Hooks (must be after all top-level hooks)
    if (isHydratingStatus) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#040608]">
                <div className="w-12 h-12 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#040608] font-sans selection:bg-teal-500/20 relative overflow-x-hidden flex flex-col items-center justify-center px-4">
            {/* Background Grid & Particles */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Ambient Glows */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/5 blur-[130px] rounded-full animate-pulse pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[130px] rounded-full animate-pulse pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-[#0c111d]/50 backdrop-blur-2xl border border-white/10 rounded-[24px] p-6 shadow-2xl flex flex-col w-full"
                >
                    <AnimatePresence mode="wait">
                        {step === 'identity' && (
                            <motion.div
                                key="identity"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                className="space-y-5"
                            >
                                <div className="text-center space-y-1">
                                    <h1 className="text-xl font-bold text-white">What's your business name?</h1>
                                    <p className="text-gray-400 text-sm">This will appear on your invoices.</p>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="e.g. Rahul Mehta Designs"
                                        disabled={isSubmitting}
                                        className="w-full px-4 py-3 bg-white/[0.04] border-2 border-white/[0.08] rounded-xl text-white text-sm font-medium focus:bg-white/[0.06] focus:border-teal-500/40 outline-none transition-all placeholder:text-gray-600"
                                    />

                                    {!hasMultiplePersonaChoices && primaryPersona && (
                                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3 flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                                                {primaryPersona.icon}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400/80">
                                                    Starting Workspace
                                                </p>
                                                <p className="text-sm font-medium text-white">{primaryPersona.label}</p>
                                                <p className="text-xs text-gray-400">{primaryPersona.desc}</p>
                                            </div>
                                        </div>
                                    )}

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2"
                                        >
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            {error}
                                        </motion.div>
                                    )}

                                    <button
                                        onClick={handleIdentityContinue}
                                        disabled={!companyName.trim() || isSubmitting}
                                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Setting up...
                                            </>
                                        ) : (
                                            <>
                                                {hasMultiplePersonaChoices ? 'Continue' : 'Enter Workspace'}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
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
                                className="space-y-4"
                            >
                                <div className="text-center space-y-1">
                                    <h1 className="text-lg font-bold text-white">How do you work?</h1>
                                    <p className="text-gray-400 text-sm">This helps us customize your experience.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    {personas.map((p, idx) => (
                                        <motion.button
                                            key={p.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => p.available && setSelectedPersona(p.id as any)}
                                            disabled={!p.available || isSubmitting}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                                                ${!p.available ? 'opacity-40 grayscale-[0.5] cursor-not-allowed border-white/5 bg-white/[0.005]' :
                                                  selectedPersona === p.id
                                                    ? 'border-teal-500/50 bg-teal-500/[0.03]'
                                                    : 'border-white/10 bg-white/[0.01] hover:border-white/20'}`}
                                        >
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center
                                                ${!p.available ? 'bg-white/5 text-gray-600' :
                                                  selectedPersona === p.id
                                                    ? 'bg-teal-500/10 text-teal-400'
                                                    : 'bg-white/5 text-gray-500'}`}>
                                                {p.icon}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h4 className={`font-medium text-sm ${selectedPersona === p.id ? 'text-teal-400' : 'text-white'}`}>
                                                    {p.label}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    {p.desc}
                                                </p>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                                                ${selectedPersona === p.id ? 'border-teal-500 bg-teal-500' : 'border-white/10'}`}>
                                                {selectedPersona === p.id && <CheckCircle2 className="w-2 h-2 text-[#040608]" />}
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setStep('identity')}
                                        disabled={isSubmitting}
                                        className="px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 rounded-lg border border-white/10 transition-all text-sm"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleProvisioning}
                                        disabled={isSubmitting}
                                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Setting up...
                                            </>
                                        ) : (
                                            <>
                                                Continue
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ delay: 1 }}
                    className="text-center mt-5"
                >
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500">CapitaEdgeX Protocol v2.5 // Core-Node-Alpha</p>
                </motion.div>
            </div>
        </div>
    );
}
