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

        setupOrganization();
    }, [user, navigate, refreshOrgContext]);

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
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3.5 px-4 bg-slate-800 text-white rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all"
                        >
                            Try Again
                        </button>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
