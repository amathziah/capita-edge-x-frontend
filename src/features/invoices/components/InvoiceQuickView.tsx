import React, { useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Invoice } from '@/types';

interface InvoiceQuickViewProps {
    invoices: Invoice[];
    onStatusSelect?: (status: string) => void;
}

const InvoiceQuickViewBase: React.FC<InvoiceQuickViewProps> = ({ invoices, onStatusSelect }) => {
    const navigate = useNavigate();

    const groups = useMemo(() => {
        const stats = {
            sent:    { count: 0, value: 0 },
            overdue: { count: 0, value: 0 },
            paid:    { count: 0, value: 0 },
        };

        const getBalanceDue = (inv: Invoice) => {
            const explicit = inv.balance_due ?? inv.balanceDue;
            if (explicit !== undefined && explicit !== null) return Number(explicit) || 0;
            const total   = Number((inv as any).netReceivable ?? (inv as any).net_receivable ?? inv.total ?? 0);
            const paid    = Number(inv.amountPaid ?? (inv as any).amount_paid ?? 0);
            return Math.max(total - paid, 0);
        };

        invoices.forEach((inv) => {
            const s = (inv.status || '').toLowerCase().trim();
            const bal = getBalanceDue(inv);
            if (s === 'sent' || s === 'partially_paid') {
                stats.sent.count++;
                stats.sent.value += bal;
            } else if (s === 'overdue') {
                stats.overdue.count++;
                stats.overdue.value += bal;
            } else if (s === 'paid') {
                stats.paid.count++;
                stats.paid.value += Number(inv.total || 0);
            }
        });

        return stats;
    }, [invoices]);

    const dueThisWeek = useMemo(() => {
        const today   = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return invoices.filter((inv) => {
            const s = (inv.status || '').toLowerCase().trim();
            if (!['sent', 'partially_paid'].includes(s)) return false;
            const due = new Date(inv.dueDate ?? (inv as any).due_date ?? '');
            return due >= today && due <= nextWeek;
        }).length;
    }, [invoices]);

    const handleClick = (key: string) => {
        onStatusSelect ? onStatusSelect(key) : navigate(`/dashboard/invoices?status=${key}`);
    };

    const cols = [
        {
            key:   'sent',
            label: 'Pending',
            icon:  Send,
            count: groups.sent.count,
            value: groups.sent.value,
            accent:  'text-indigo-600',
            hint: dueThisWeek > 0 ? `${dueThisWeek} due this week` : null,
        },
        {
            key:   'overdue',
            label: 'Overdue',
            icon:  AlertTriangle,
            count: groups.overdue.count,
            value: groups.overdue.value,
            accent:  'text-red-500',
            hint: groups.overdue.count > 0 ? 'Chase now' : null,
        },
        {
            key:   'paid',
            label: 'Collected',
            icon:  CheckCircle2,
            count: groups.paid.count,
            value: groups.paid.value,
            accent:  'text-green-600',
            hint: null,
        },
    ];

    return (
        <div className="grid grid-cols-3 divide-x divide-gray-100">
            {cols.map(({ key, label, icon: Icon, count, value, accent, hint }) => (
                <button
                    key={key}
                    onClick={() => handleClick(key)}
                    className="flex flex-col gap-0.5 px-3 sm:px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${accent}`}>
                        <Icon size={12} />
                        {label}
                    </div>

                    <div className={`text-base sm:text-xl font-black mt-1 ${key === 'overdue' && count > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        ₹{value.toLocaleString('en-IN')}
                    </div>

                    <div className="text-xs text-gray-400">
                        {count} invoice{count !== 1 ? 's' : ''}
                        {hint && (
                            <span className={`ml-1.5 font-semibold ${key === 'overdue' ? 'text-red-500' : 'text-indigo-500'}`}>
                                · {hint}
                            </span>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
};

export const InvoiceQuickView = memo(InvoiceQuickViewBase);
