import React, { useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Send, 
    AlertTriangle, 
    CheckCircle2, 
    ArrowRight
} from 'lucide-react';
import { Invoice } from '@/types';

interface InvoiceQuickViewProps {
    invoices: Invoice[];
    onStatusSelect?: (status: string) => void;
}

interface StatusGroup {
    label: string;
    icon: React.ElementType;
    count: number;
    value: number;
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    textColor: string;
    action?: string;
    statusKey: string;
}

const InvoiceQuickViewBase: React.FC<InvoiceQuickViewProps> = ({ invoices, onStatusSelect }) => {
    const navigate = useNavigate();

    const groups = useMemo(() => {
        const stats: Record<string, { count: number; value: number }> = {
            sent: { count: 0, value: 0 },
            overdue: { count: 0, value: 0 },
            paid: { count: 0, value: 0 },
        };

        const getBalanceDue = (invoice: Invoice) => {
            const explicitBalance = invoice.balance_due ?? invoice.balanceDue;
            if (explicitBalance !== undefined && explicitBalance !== null) {
                return Number(explicitBalance) || 0;
            }
            const totalAmount = Number((invoice as any).netReceivable ?? (invoice as any).net_receivable ?? invoice.total ?? 0);
            const amountPaid = Number(invoice.amountPaid ?? (invoice as any).amount_paid ?? 0);
            return Math.max(totalAmount - amountPaid, 0);
        };

        invoices.forEach((inv) => {
            const status = (inv.status || '').toLowerCase().trim();
            const balanceDue = getBalanceDue(inv);

            if (status === 'sent') {
                stats.sent.count++;
                stats.sent.value += balanceDue;
            } else if (status === 'partially_paid') {
                stats.sent.count++;
                stats.sent.value += balanceDue;
            } else if (status === 'overdue') {
                stats.overdue.count++;
                stats.overdue.value += balanceDue;
            } else if (status === 'paid') {
                stats.paid.count++;
                stats.paid.value += Number(inv.total || 0);
            }
        });

        return stats;
    }, [invoices]);

    const dueThisWeek = useMemo(() => {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return invoices.filter((inv) => {
            const status = (inv.status || '').toLowerCase().trim();
            if (!['sent', 'partially_paid'].includes(status)) return false;
            const dueDate = inv.dueDate || (inv as any).due_date;
            if (!dueDate) return false;
            const due = new Date(dueDate);
            return due >= today && due <= nextWeek;
        }).length;
    }, [invoices]);

    const statusGroups: StatusGroup[] = [
        {
            label: 'Pending',
            icon: Send,
            count: groups.sent.count,
            value: groups.sent.value,
            bg: 'bg-indigo-500/5',
            border: 'border-indigo-500/20',
            iconBg: 'bg-indigo-500/10',
            iconColor: 'text-indigo-400',
            textColor: 'text-indigo-300',
            action: dueThisWeek > 0 ? `${dueThisWeek} due this week` : 'All on track',
            statusKey: 'sent'
        },
        {
            label: 'Overdue',
            icon: AlertTriangle,
            count: groups.overdue.count,
            value: groups.overdue.value,
            bg: 'bg-red-500/5',
            border: 'border-red-500/20',
            iconBg: 'bg-red-500/10',
            iconColor: 'text-red-400',
            textColor: 'text-red-300',
            action: 'Chase now',
            statusKey: 'overdue'
        },
        {
            label: 'Collected',
            icon: CheckCircle2,
            count: groups.paid.count,
            value: groups.paid.value,
            bg: 'bg-teal-500/5',
            border: 'border-teal-500/20',
            iconBg: 'bg-teal-500/10',
            iconColor: 'text-teal-400',
            textColor: 'text-teal-300',
            action: 'View history',
            statusKey: 'paid'
        }
    ];

    const handleCardClick = (statusKey: string) => {
        if (onStatusSelect) {
            onStatusSelect(statusKey);
        } else {
            navigate(`/dashboard/invoices?status=${statusKey}`);
        }
    };

    return (
        <div className="space-y-4">
            <div className="mb-4 flex items-center justify-between sm:mb-6">
                <div>
                    <h3 className="text-base font-bold text-white sm:text-lg">Invoice Status</h3>
                    <p className="text-sm text-gray-500 mt-1">Track your money flow</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
                {statusGroups.map((group) => {
                    const Icon = group.icon;
                    return (
                        <button
                            key={group.statusKey}
                            onClick={() => handleCardClick(group.statusKey)}
                            className={`relative rounded-2xl border p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg sm:p-5 ${group.bg} ${group.border}`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${group.iconBg}`}>
                                    <Icon size={20} className={group.iconColor} />
                                </div>
                                <ArrowRight size={16} className="text-gray-600" />
                            </div>

                            <div className={`text-sm font-medium ${group.textColor}`}>
                                {group.label}
                            </div>

                            <div className="mt-1 text-xl font-black text-white sm:text-2xl">
                                {group.count}
                            </div>

                            <div className="mt-1 text-base font-bold text-white sm:text-lg">
                                ₹{group.value.toLocaleString('en-IN')}
                            </div>

                            {group.action && (
                                <div className="mt-3 pt-3 border-t border-white/5">
                                    <div className={`text-xs font-medium ${
                                        group.statusKey === 'overdue' ? 'text-red-400' :
                                        group.statusKey === 'sent' ? 'text-indigo-400' :
                                        'text-teal-400'
                                    }`}>
                                        {group.action === 'Chase now' && '⚡ '}
                                        {group.action === `${dueThisWeek} due this week` && '📅 '}
                                        {group.action}
                                    </div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {groups.overdue.count > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                        <AlertTriangle className="text-red-400" size={20} />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-400">
                                You have {groups.overdue.count} overdue invoice{groups.overdue.count > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-red-300/70 mt-0.5">
                                ₹{groups.overdue.value.toLocaleString('en-IN')} at risk • Tap to chase
                            </p>
                        </div>
                        <button
                            onClick={() => handleCardClick('overdue')}
                            className="min-h-[40px] w-full rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 sm:w-auto"
                        >
                            Chase
                        </button>
                    </div>
                </div>
            )}

            {groups.overdue.count === 0 && groups.sent.count > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-teal-400" size={20} />
                        <div>
                            <p className="text-sm font-semibold text-teal-400">
                                All caught up!
                            </p>
                            <p className="text-xs text-teal-300/70 mt-0.5">
                                No overdue invoices • {groups.sent.count} pending
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const InvoiceQuickView = memo(InvoiceQuickViewBase);
