import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Logo } from './common/Logo';

type AuthView = 'signin' | 'signup' | 'forgot_password';

export default function AuthComponent() {
    const [view, setView] = useState<AuthView>('signin');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (error: any) {
            setError(error.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName) {
            setError('Company Name is required for signup');
            return;
        }
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            // Call backend API instead of direct Supabase signup
            // This ensures the confirmation email is sent via our SMTP service
            await api.post<any>(ENDPOINTS.AUTH_SIGNUP, { email, password, companyName });

            setMessage('Account created! Please check your email for the 6-digit verification code.');
            setShowOtpInput(true);
        } catch (error: any) {
            setError(error.message || 'Failed to sign up');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post<any>(ENDPOINTS.AUTH_VERIFY_OTP, { email, otp });

            setMessage('Email verified successfully! You can now sign in.');
            setShowOtpInput(false);
            setView('signin');
            setPassword('');
        } catch (error: any) {
            setError(error.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });
            if (error) throw error;
            setMessage('Password reset link sent to your email.');
        } catch (error: any) {
            setError(error.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        try {
                const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin.replace(/\/$/, ''),
                },
            });
            if (error) throw error;
        } catch (error: any) {
            setError(error.message || `Failed to sign in with ${provider}`);
        }
    };

    const handleResendEmail = async () => {
        if (!email) {
            setError('Please enter your email address first.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Call backend API instead of direct Supabase resend
            // This allows us to use our own SMTP as a fallback
            await api.post<any>(ENDPOINTS.AUTH_RESEND, { email });

            setMessage('A new verification code has been sent to your email.');
        } catch (error: any) {
            console.error('Resend error:', error);
            setError(error.message || 'Failed to resend confirmation email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#F0F4F8] relative overflow-hidden font-sans">
            {/* Background Ambience */}
            <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-teal-400/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-[420px] relative z-10 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 overflow-hidden relative"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center justify-center mb-6"
                        >
                            <Logo size={64} />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2 font-display">
                            {showOtpInput ? 'Verify Email' : view === 'signin' ? 'Welcome Back' : view === 'signup' ? 'Create Account' : 'Reset Password'}
                        </h1>
                        <p className="text-slate-500 text-sm">
                            {showOtpInput ? 'Enter the 6-digit code sent to your email' :
                                view === 'signin' ? 'Sign in to manage your finances securely' :
                                    view === 'signup' ? 'Start your financial journey today' :
                                        'Enter your email to receive recovery instructions'}
                        </p>
                    </div>

                    {/* Alert Messages */}
                    <AnimatePresence mode='wait'>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600 text-sm font-medium"
                            >
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>{error}</p>
                            </motion.div>
                        )}
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col gap-3 text-emerald-600 text-sm font-medium"
                            >
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 shrink-0" />
                                    <p>{message}</p>
                                </div>
                                {message.includes('check your email') && (
                                    <button
                                        onClick={handleResendEmail}
                                        disabled={loading}
                                        className="text-xs text-emerald-700 underline hover:text-emerald-800 disabled:opacity-50 text-left pl-8"
                                    >
                                        Didn't receive it? Resend confirmation email
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={showOtpInput ? handleVerifyOtp : view === 'signin' ? handleEmailLogin : view === 'signup' ? handleSignUp : handleResetPassword} className="space-y-4">
                        <div className="space-y-4">
                            {!showOtpInput ? (
                                <>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="email"
                                            placeholder="Email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>

                                    {view === 'signup' && (
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Company / Business Name"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                required
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                    )}

                                    {view !== 'forgot_password' && (
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-2xl font-bold tracking-[0.5em] text-emerald-600 placeholder:text-slate-300 placeholder:tracking-normal placeholder:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            )}
                        </div>

                        {view === 'signin' && !showOtpInput && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setView('forgot_password')}
                                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>
                                        {showOtpInput ? 'Verify Code' : view === 'signin' ? 'Sign In' : view === 'signup' ? 'Create Account' : 'Send Recovery Link'}
                                    </span>
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    {view !== 'forgot_password' && !showOtpInput && (
                        <>
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-100"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[#FBFDFE] px-3 src-auth-bg text-slate-400 font-semibold tracking-wider">Or continue with</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleOAuthLogin('google')}
                                    className="flex items-center justify-center gap-2 py-3.5 px-4 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm uppercase tracking-tight w-full"
                                >
                                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Continue with Google
                                </button>
                            </div>
                        </>
                    )}

                    {/* Footer Toggle */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500 font-medium">
                            {showOtpInput ? (
                                <button
                                    onClick={() => {
                                        setError(null);
                                        setMessage(null);
                                        setShowOtpInput(false);
                                        setView('signup');
                                    }}
                                    className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors underline flex items-center gap-1 mx-auto"
                                >
                                    <ArrowRight className="w-4 h-4 rotate-180" />
                                    Back to signup
                                </button>
                            ) : (
                                <>
                                    {view === 'signin' ? "Don't have an account? " :
                                        view === 'signup' ? "Already have an account? " :
                                            "Remember your password? "}
                                    <button
                                        onClick={() => {
                                            setError(null);
                                            setMessage(null);
                                            setView(view === 'signin' ? 'signup' : 'signin');
                                        }}
                                        className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                                    >
                                        {view === 'signin' ? 'Sign up' : 'Sign in'}
                                    </button>
                                </>
                            )}
                        </p>
                    </div>
                </motion.div>

                {/* Secure Badge */}
                <div className="text-center mt-8 opacity-60">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <Lock className="w-3 h-3" />
                        256-bit Secure Encryption
                    </div>
                </div>
            </div>
        </div>
    );
}
