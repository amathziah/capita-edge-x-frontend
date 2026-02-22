import React from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LimitReachedModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    feature: 'invoices' | 'ai_requests';
}

export const LimitReachedModal: React.FC<LimitReachedModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    feature
}) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleUpgrade = () => {
        onClose();
        navigate('/pricing');
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#0c0f1a]/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[#161a2b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-primary" />

                <div className="p-8">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400/10 to-cyan-500/10 border border-teal-500/20 flex items-center justify-center mb-6">
                        {feature === 'invoices' ? (
                            <Zap className="w-7 h-7 text-teal-400" />
                        ) : (
                            <Cpu className="w-7 h-7 text-cyan-400" />
                        )}
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8">
                        {description}
                    </p>

                    {/* Benfits List */}
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Unlimited invoices & tracking</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Unlimited 24/7 AI Assistance</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Priority support & early access</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleUpgrade}
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98]"
                        >
                            Upgrade to Pro <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>,
        document.body
    );
};
