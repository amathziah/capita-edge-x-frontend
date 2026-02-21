import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function SetupPage() {
    const { user, refreshOrgContext } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [manualCompanyName, setManualCompanyName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const setupOrganization = async () => {
            if (!user) return;

            try {
                // 1. Get company name from metadata
                const companyName = user.user_metadata?.company_name || 'My Business';

                // 2. Call backend to provision
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

                // 3. Refresh context and redirect
                await refreshOrgContext();
                setStatus('success');
                setTimeout(() => navigate('/'), 2000);
            } catch (err: any) {
                console.error('Setup error:', err);
                setError(err.message);
                setStatus('error');
            }
        };

        if (status === 'loading') {
            setupOrganization();
        }
    }, [user, navigate, refreshOrgContext, status]);

    const handleManualSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualCompanyName) return;

        setSubmitting(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/provision`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await (await import('../supabaseClient')).supabase.auth.getSession()).data.session?.access_token}`,
                },
                body: JSON.stringify({ companyName: manualCompanyName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to set up organization');
            }

            await refreshOrgContext();
            setStatus('success');
            setTimeout(() => navigate('/'), 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#F0F4F8] font-sans">
            <div className="w-full max-w-[420px] px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] p-10 text-center shadow-xl"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 mb-8 text-white">
                        {status === 'loading' ? (
                            <Loader2 className="w-10 h-10 animate-spin" />
                        ) : status === 'error' ? (
                            <AlertCircle className="w-10 h-10" />
                        ) : (
                            <ShieldCheck className="w-10 h-10" />
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-slate-800 mb-4">
                        {status === 'loading' ? 'Setting up your space...' :
                            status === 'error' ? 'Something went wrong' :
                                'All set!'}
                    </h1>

                    <p className="text-slate-500 text-sm leading-relaxed mb-8">
                        {status === 'loading' ? 'We are initializing your secure financial environment and provisioning your workspace. This only takes a moment.' :
                            status === 'error' ? error :
                                'Your organization has been successfully provisioned. Redirecting to your dashboard...'}
                    </p>

                    {status === 'error' && (
                        <div className="space-y-6">
                            <form onSubmit={handleManualSetup} className="space-y-4">
                                <div className="text-left">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                        Business Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your business name"
                                        value={manualCompanyName}
                                        onChange={(e) => setManualCompanyName(e.target.value)}
                                        required
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Setup'}
                                </button>
                            </form>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">Or</span></div>
                            </div>

                            <button
                                onClick={() => setStatus('loading')}
                                className="w-full py-3 px-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                            >
                                Refresh & Retry Auto-Setup
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
