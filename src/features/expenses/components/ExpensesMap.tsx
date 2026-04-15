import { useMemo } from 'react';
import { Expense } from '@/types';

interface ExpensesMapProps {
    expenses: Expense[];
}

const COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#f97316', '#06b6d4',
    '#84cc16', '#f43f5e',
];

const fmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` :
    n >= 1000   ? `₹${(n / 1000).toFixed(1)}k`   :
    `₹${n.toLocaleString('en-IN')}`;

export function ExpensesMap({ expenses }: ExpensesMapProps) {
    const { total, categories } = useMemo(() => {
        const agg: Record<string, number> = {};
        expenses.forEach(e => {
            const cat = e.category || 'Other';
            agg[cat] = (agg[cat] || 0) + Number(e.amount || 0);
        });
        const total = Object.values(agg).reduce((s, v) => s + v, 0);
        const categories = Object.entries(agg)
            .map(([cat, amount]) => ({ cat, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
            .sort((a, b) => b.amount - a.amount);
        return { total, categories };
    }, [expenses]);

    if (expenses.length === 0) {
        return (
            <div className="flex items-center justify-center py-14 text-gray-400 text-sm">
                No expenses to show.
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-5 space-y-3">
            {/* Total */}
            <div className="flex items-baseline justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total spend</span>
                <span className="text-xl font-black text-gray-900">{fmt(total)}</span>
            </div>

            {/* Category rows */}
            {categories.map(({ cat, amount, pct }, idx) => (
                <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="text-sm font-medium text-gray-700">{cat}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="text-gray-400">{pct.toFixed(1)}%</span>
                            <span className="font-semibold text-gray-900 w-16 text-right">{fmt(amount)}</span>
                        </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
