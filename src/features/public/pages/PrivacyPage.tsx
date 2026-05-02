import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PrivacyPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#040608] text-gray-300 font-sans selection:bg-teal-500/30 selection:text-teal-200">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
                {/* Header */}
                <header className="mb-16">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-teal-500 hover:text-teal-400 transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-bold tracking-tight">Back to Home</span>
                    </button>
                    
                    <div className="flex items-center gap-3 text-teal-500 mb-4 uppercase tracking-[0.2em] font-black text-xs">
                        <Shield className="w-5 h-5" />
                        Trust & Security
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Privacy Policy</h1>
                    <p className="text-gray-500 text-lg">Last updated: May 3, 2026</p>
                </header>

                {/* Content */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                >
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-teal-400" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Introduction</h2>
                        </div>
                        <p className="leading-relaxed text-gray-400">
                            At CapitaEdgeX, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our AI-powered business management platform. By using CapitaEdgeX, you agree to the terms described herein.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Information We Collect</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                <h3 className="text-white font-bold">Account Data</h3>
                                <p className="text-sm text-gray-400">Basic identity information like your name, business name, and email address provided during signup.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                <h3 className="text-white font-bold">Financial Data</h3>
                                <p className="text-sm text-gray-400">Invoice details, customer lists, and transaction metadata required to provide our accounting services.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                <h3 className="text-white font-bold">Integration Data</h3>
                                <p className="text-sm text-gray-400">OAuth tokens and basic profile info when you connect third-party services like Google (Gmail/Calendar).</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                <h3 className="text-white font-bold">Usage Data</h3>
                                <p className="text-sm text-gray-400">Diagnostic logs and platform interaction patterns used to train our AI and improve system stability.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Google OAuth & Data Use</h2>
                        </div>
                        <p className="leading-relaxed text-gray-400">
                            CapitaEdgeX's use and transfer of information received from Google APIs to any other app will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" className="text-teal-500 hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
                        </p>
                        <ul className="space-y-3 text-gray-400 list-disc pl-5">
                            <li>We use Gmail scopes strictly to send invoices on your behalf.</li>
                            <li>We do not store your emails or read your personal messages.</li>
                            <li>Integration data is never sold to third parties or used for advertising.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold tracking-tight text-white">Data Retention</h2>
                        <p className="leading-relaxed text-gray-400">
                            We retain your information as long as your account is active. You may request the deletion of your account and all associated data at any time through the support portal.
                        </p>
                    </section>

                    <footer className="pt-12 border-t border-white/10 text-center">
                        <p className="text-gray-500 text-sm">
                            Questions about this policy? Contact our integrity team at <a href="mailto:integrity@capitaedgex.com" className="text-teal-500">integrity@capitaedgex.com</a>
                        </p>
                    </footer>
                </motion.div>
            </div>
        </div>
    );
}
