import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Sparkles } from 'lucide-react';

interface GhostSimulationProps {
    onCreateInvoice?: () => void;
}

export const GhostSimulation: React.FC<GhostSimulationProps> = ({ onCreateInvoice }) => {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-background text-text-main relative overflow-hidden">
            {/* Soft Ambient Background */}
            <div className="absolute inset-0 bg-gradient-radial from-white to-background z-0"></div>
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/subtle-white-feathers.png')]"></div>

            <div className="z-10 text-center max-w-md p-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-8 relative"
                >
                    {/* The "Lost Opportunity" Node - Softened */}
                    <div className="w-48 h-48 bg-white rounded-full mx-auto flex items-center justify-center shadow-card border-4 border-gray-50 ring-1 ring-gray-100 relative group cursor-default">

                        {/* Orbiting Elements */}
                        <div className="absolute inset-0 rounded-full border border-dashed border-gray-200 animate-[spin_10s_linear_infinite]" />
                        <div className="absolute -top-2 left-1/2 w-4 h-4 bg-primary rounded-full blur-[2px] opacity-50" />

                        <div className="text-center">
                            <div className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Potential Value</div>
                            <div className="text-3xl font-bold text-text-main tracking-tight">₹5.0 L</div>
                        </div>
                    </div>
                </motion.div>

                <h2 className="text-2xl font-bold mb-3 text-text-main tracking-tight">
                    Visualize your cash flow.
                </h2>
                <p className="text-text-muted mb-8 text-sm leading-relaxed">
                    The Operations Room uses physics to show where your money is flowing and where it's stuck. Create an invoice to start the engine.
                </p>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCreateInvoice}
                    className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-8 rounded-2xl shadow-soft hover:shadow-lg flex items-center gap-2 mx-auto transition-all"
                >
                    <PlusCircle size={20} />
                    <span className="text-sm">Create First Invoice</span>
                </motion.button>
            </div>
        </div>
    );
};
