import { motion } from 'framer-motion';
import { Scale, BookOpen, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TermsPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#040608] text-gray-300 font-sans selection:bg-teal-500/30 selection:text-teal-200">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
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
                        <Scale className="w-5 h-5" />
                        Legal Framework
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Terms of Service</h1>
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
                                <BookOpen className="w-5 h-5 text-teal-400" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Acceptance of Terms</h2>
                        </div>
                        <p className="leading-relaxed text-gray-400">
                            By accessing or using CapitaEdgeX, you agree to be bound by these Terms of Service. These terms govern your use of our software, AI features, and integrated services. If you do not agree, you must cease use of the platform immediately.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">User Responsibilities</h2>
                        </div>
                        <p className="leading-relaxed text-gray-400">
                            Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account.
                        </p>
                        <ul className="space-y-3 text-gray-400 list-disc pl-5">
                            <li>You must provide accurate and complete business information.</li>
                            <li>You are responsible for the legality of the invoices you generate and send.</li>
                            <li>You agree not to use the AI assistant for any fraudulent or malicious activities.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-rose-400" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Limitations of Liability</h2>
                        </div>
                        <p className="leading-relaxed text-gray-400">
                            CapitaEdgeX is an AI-powered assistant. While we strive for 100% accuracy, we do not guarantee the correctness of financial estimates or AI-generated tax advice.
                        </p>
                        <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 italic text-sm text-gray-400">
                            "The platform is provided 'as-is' without warranties of any kind. CapitaEdgeX shall not be liable for any direct or indirect damages resulting from the use of our services."
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold tracking-tight text-white">Third-Party Integrations</h2>
                        <p className="leading-relaxed text-gray-400">
                            Our platform integrates with Google Services. Your use of these integrations is also subject to Google's Terms of Service and Privacy Policies. We are not responsible for any issues arising from third-party provider outages.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold tracking-tight text-white">Termination</h2>
                        <p className="leading-relaxed text-gray-400">
                            We reserve the right to suspend or terminate accounts that violate these terms or engage in behavior that threatens the integrity of our platform.
                        </p>
                    </section>

                    <footer className="pt-12 border-t border-white/10 text-center">
                        <p className="text-gray-500 text-sm">
                            Legal inquiries: <a href="mailto:legal@capitaedgex.com" className="text-teal-500">legal@capitaedgex.com</a>
                        </p>
                    </footer>
                </motion.div>
            </div>
        </div>
    );
}
