import { useEffect, useState } from 'react';
import { InventoryService } from '../../services/inventoryAnalysis';
import { Activity, AlertCircle, Zap } from 'lucide-react';

interface InsightSummary {
    cash_locked: number;
    risks: number;
    health_percent: number;
    total_products: number;
}

export const InventoryInsights = () => {
    const [summary, setSummary] = useState<InsightSummary>({
        cash_locked: 0,
        risks: 0,
        health_percent: 100,
        total_products: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const data = await InventoryService.analyzeInventoryHealth();
                setSummary({
                    cash_locked: data.summary.cash_locked_in_dead_stock,
                    risks: data.summary.stockout_risks,
                    health_percent: data.summary.health_percent,
                    total_products: data.summary.total_products
                });
            } catch (err) {
                console.error("Failed to load inventory insights", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse h-[104px] bg-gray-100 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Widget 1: Dead Stock Value — Now using Strict Primary */}
            <div className="bg-white/60 backdrop-blur-sm border border-primary/10 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                <div>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Liquid Capital Locked
                    </h4>
                    <p className="text-2xl font-black text-gray-900 font-display">
                        ₹{summary.cash_locked.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Dead Stock Value ({'>'}60d)</p>
                </div>
                <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
                    <Activity className="w-5 h-5" strokeWidth={2.5} />
                </div>
            </div>

            {/* Widget 2: Allocation Risks — Now using Strict Primary */}
            <div className="bg-white/60 backdrop-blur-sm border border-primary/10 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                <div>
                    <h4 className="text-[10px] font-black text-primary-dark uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Replenishment Risks
                    </h4>
                    <p className="text-2xl font-black text-gray-900 font-display">
                        {summary.risks} {summary.risks === 1 ? 'Node' : 'Nodes'}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Forecasted Outages (7d)</p>
                </div>
                <div className="p-2.5 bg-primary-light rounded-xl text-primary">
                    <AlertCircle className="w-5 h-5" strokeWidth={2.5} />
                </div>
            </div>

            {/* Widget 3: Operational Health — Primary #14B8B8 */}
            <div className="bg-primary border border-primary-dark/20 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all group">
                <div>
                    <h4 className="text-[10px] font-black text-white/90 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Operational Grade
                    </h4>
                    <p className="text-2xl font-black text-white font-display">
                        {summary.health_percent}%
                    </p>
                    <p className="text-[10px] text-white/70 font-bold mt-1 uppercase tracking-tighter">
                        {summary.health_percent >= 80 ? 'Optimal Efficiency' : summary.health_percent >= 50 ? 'Maintenance Required' : 'Critical Refactor'}
                    </p>
                </div>
                <div className="p-2.5 bg-white/20 rounded-xl text-white group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5" strokeWidth={2.5} />
                </div>
            </div>
        </div>
    );
};

/**
 * VelocityBadge — Shows stock health badge on product rows.
 * Only renders a badge when there's meaningful data to show (avoids false positives).
 */
export const VelocityBadge = ({ velocity, daysRemaining, lastSoldDate, hasSalesData, isInventoryTracked }: {
    velocity: number;
    daysRemaining: number;
    lastSoldDate?: string | null;
    hasSalesData?: boolean; // Whether we have reliable sales data
    isInventoryTracked?: boolean;
}) => {
    // If it's a service/non-tracked item, don't show inventory-specific badges
    if (isInventoryTracked === false) return null;

    // If no sales data available at all, don't show misleading badges
    if (!hasSalesData && !lastSoldDate) return null;

    // Dead Stock: Has a lastSoldDate that's > 60 days ago
    const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000;
    const isDead = lastSoldDate &&
        (new Date().getTime() - new Date(lastSoldDate).getTime()) > SIXTY_DAYS;

    if (isDead) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-gray-900 text-white border border-gray-800 tracking-tighter uppercase" title="No sales in 60+ days">
                Static Node
            </span>
        );
    }

    // Stockout Risk: Less than 7 days of stock remaining
    if (daysRemaining < 7 && daysRemaining > 0 && velocity > 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-tighter uppercase" title={`${Math.floor(daysRemaining)} days left`}>
                Alert ({Math.floor(daysRemaining)}d)
            </span>
        );
    }

    // Fast Mover: High velocity
    if (velocity > 2) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-primary text-white border border-primary/20 tracking-tighter uppercase" title="High sales velocity">
                High Velocity
            </span>
        );
    }

    return null;
};
