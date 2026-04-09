import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, AlertTriangle } from "lucide-react";
import { dataService } from "../../services/dataService";

export default function SafeToSpendCard() {
    const [data, setData] = useState<{
        safeToSpend: number;
        totalRevenue: number;
        taxes: number;
        overdueRisk: number;
        currency?: string;
        reserves?: {
            gst?: number;
            incomeTax?: number;
            atRisk?: number;
        };
    } | null>(null);

    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        dataService.getSafeToSpend().then((res) => {
            const taxes = Number(res?.reserves?.gst || 0) + Number(res?.reserves?.incomeTax || 0);
            const overdueRisk = Number(res?.reserves?.atRisk || 0);
            setData({
                safeToSpend: res.safeToSpend,
                totalRevenue: res.totalRevenue || 0,
                taxes,
                overdueRisk,
                ...res
            });
        });
    }, []);

    if (!data) return <div className="animate-pulse h-48 bg-gray-100 rounded-2xl"></div>;

    const currencySymbol = data.currency === 'USD' ? '$' : '₹';
    const percentage = data.totalRevenue > 0
        ? Math.min((data.safeToSpend / data.totalRevenue) * 100, 100)
        : 0;

    return (
        <motion.div
            className="relative overflow-hidden rounded-2xl shadow-lg border border-violet-100 bg-white p-6"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-white to-emerald-50/30 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            True Liquidity
                        </h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-bold text-gray-900">
                                {currencySymbol}{data.safeToSpend.toLocaleString()}
                            </span>
                            <motion.span
                                className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                Safe to Spend
                            </motion.span>

                        </div>
                    </div>

                    <div className="p-3 bg-violet-100/50 rounded-xl">
                        {isHovered ? (
                            <Unlock className="w-6 h-6 text-violet-600" />
                        ) : (
                            <Lock className="w-6 h-6 text-violet-600" />
                        )}
                    </div>
                </div>

                {/* The Vault Visualizer */}
                <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Revenue Flow</span>
                        <span>{Math.round(percentage)}% Liquid</span>
                    </div>

                    <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex relative">
                        {/* Safe Portion */}
                        <motion.div
                            className="h-full bg-gradient-to-r from-violet-500 to-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />

                        {/* Locked Portion (Taxes + Risk) */}
                        <motion.div
                            className="h-full bg-gray-300 relative group cursor-help"
                            initial={{ width: 0 }}
                            animate={{ width: `${100 - percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                        >
                            {/* Pattern overlay for "Vault" look */}
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]" />
                        </motion.div>
                    </div>

                    {/* Breakdown Legend (Visible on Hover or always) */}
                    <AnimatePresence>
                        {isHovered && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="grid grid-cols-2 gap-2 text-xs pt-2"
                            >
                                <div className="flex items-center gap-1.5 text-gray-500">
                                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                                    <span>Taxes: {currencySymbol}{data.taxes.toLocaleString()} (Locked)</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-rose-500">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Risk: {currencySymbol}{data.overdueRisk.toLocaleString()}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
