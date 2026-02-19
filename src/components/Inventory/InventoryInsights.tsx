import { useEffect, useState } from 'react';
import { InventoryService } from '../../services/inventoryAnalysis';

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
            {/* Widget 1: Dead Stock Value — Uses danger status colors */}
            <div className="bg-status-danger-bg border border-red-200/60 rounded-xl p-4 flex items-center justify-between shadow-card hover:shadow-soft transition-shadow">
                <div>
                    <h4 className="text-[11px] font-bold text-status-danger uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-danger animate-pulse" />
                        Dead Stock Value
                    </h4>
                    <p className="text-2xl font-bold text-gray-900 font-display">
                        ₹{summary.cash_locked.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-text-muted mt-1">Cash tied up in slow movers ({'>'}60d)</p>
                </div>
                <div className="p-2.5 bg-red-100 rounded-xl text-status-danger">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
            </div>

            {/* Widget 2: Stockout Risks — Uses warning/success colors */}
            <div className={`border rounded-xl p-4 flex items-center justify-between shadow-card hover:shadow-soft transition-shadow ${summary.risks > 0
                    ? 'bg-status-warning-bg border-yellow-200/60'
                    : 'bg-status-success-bg border-green-200/60'
                }`}>
                <div>
                    <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${summary.risks > 0 ? 'text-status-warning' : 'text-status-success'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${summary.risks > 0 ? 'bg-status-warning animate-pulse' : 'bg-status-success'}`} />
                        Stockout Risks
                    </h4>
                    <p className="text-2xl font-bold text-gray-900 font-display">
                        {summary.risks} {summary.risks === 1 ? 'Item' : 'Items'}
                    </p>
                    <p className="text-[11px] text-text-muted mt-1">Predicted within next 7 days</p>
                </div>
                <div className={`p-2.5 rounded-xl ${summary.risks > 0 ? 'bg-yellow-100 text-status-warning' : 'bg-green-100 text-status-success'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
            </div>

            {/* Widget 3: System Health — Uses primary teal */}
            <div className="bg-primary-light border border-primary/20 rounded-xl p-4 flex items-center justify-between shadow-card hover:shadow-soft transition-shadow">
                <div>
                    <h4 className="text-[11px] font-bold text-primary-dark uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        System Health
                    </h4>
                    <p className="text-2xl font-bold text-gray-900 font-display">
                        {summary.health_percent}%
                    </p>
                    <p className="text-[11px] text-text-muted mt-1">
                        {summary.health_percent >= 80 ? 'Optimal stock levels' : summary.health_percent >= 50 ? 'Needs attention' : 'Critical — review stock'}
                    </p>
                </div>
                <div className="p-2.5 bg-primary/15 rounded-xl text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
            </div>
        </div>
    );
};

/**
 * VelocityBadge — Shows stock health badge on product rows.
 * Only renders a badge when there's meaningful data to show (avoids false positives).
 */
export const VelocityBadge = ({ velocity, daysRemaining, lastSoldDate, hasSalesData }: {
    velocity: number;
    daysRemaining: number;
    lastSoldDate?: string | null;
    hasSalesData?: boolean; // Whether we have reliable sales data
}) => {
    // If no sales data available at all, don't show misleading badges
    if (!hasSalesData && !lastSoldDate) return null;

    // Dead Stock: Has a lastSoldDate that's > 60 days ago
    const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000;
    const isDead = lastSoldDate &&
        (new Date().getTime() - new Date(lastSoldDate).getTime()) > SIXTY_DAYS;

    if (isDead) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-900/5 text-gray-700 border border-gray-200 ring-1 ring-inset ring-gray-900/5" title="No sales in 60+ days">
                💀 Dead Stock
            </span>
        );
    }

    // Stockout Risk: Less than 7 days of stock remaining
    if (daysRemaining < 7 && daysRemaining > 0 && velocity > 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-status-warning-bg text-amber-700 border border-amber-200 ring-1 ring-inset ring-amber-500/10" title={`${Math.floor(daysRemaining)} days left`}>
                ⚠️ Low Stock ({Math.floor(daysRemaining)}d)
            </span>
        );
    }

    // Fast Mover: High velocity
    if (velocity > 2) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary-light text-primary-dark border border-primary/20 ring-1 ring-inset ring-primary/10" title="High sales velocity">
                🔥 Fast Mover
            </span>
        );
    }

    return null;
};
