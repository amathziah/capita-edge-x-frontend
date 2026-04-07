import React from 'react';
import { Invoice } from '../../types';
import {
    Send,
    ArrowRight,
    Gavel,
    Clock,
} from 'lucide-react';

interface ActionPanelProps {
    invoices: Invoice[];
    onExecuteAction?: (action: any) => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ invoices, onExecuteAction }) => {

    const recommendations = React.useMemo(() => {
        const actions: any[] = [];

        const overdue = invoices.filter(inv => inv.status === 'overdue' || inv.status === 'escalated');
        if (overdue.length > 0) {
            const topOverdue = overdue.sort((a, b) => b.total - a.total)[0];
            actions.push({
                id: '1',
                type: 'reminder',
                priority: 'critical',
                title: `Escalate: ${topOverdue.buyer?.name}`,
                desc: `Overdue by ${Math.floor((Date.now() - new Date(topOverdue.dueDate).getTime()) / (1000 * 3600 * 24))} days. Payment is at risk.`,
                impact: 'Likely Recovery: 60%',
                icon: Gavel,
                color: 'text-status-danger',
                bg: 'bg-status-danger-bg',
                border: 'border-status-danger/20',
                badge: 'bg-white'
            });
        }

        const drafts = invoices.filter(inv => inv.status === 'draft');
        if (drafts.length > 0) {
            actions.push({
                id: '2',
                type: 'send',
                priority: 'high',
                title: `Send ${drafts.length} Prepared Invoices`,
                desc: 'Invoices are ready to go. Don\'t delay.',
                impact: 'Start Payment Cycle',
                icon: Send,
                color: 'text-primary',
                bg: 'bg-primary-light',
                border: 'border-primary/20',
                badge: 'bg-white'
            });
        }

        return actions;
    }, [invoices]);

    return (
        <div className="space-y-3">
            {recommendations.length === 0 && (
                <div className="text-text-muted text-sm p-6 bg-gray-50 rounded-xl text-center border border-gray-100">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No invoice-specific actions at the moment.
                </div>
            )}
            {recommendations.map(action => (
                <div
                    key={action.id}
                    onClick={() => onExecuteAction && onExecuteAction(action)}
                    className={`group flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-card active:scale-[0.98] ${action.bg} ${action.border} border`}
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5 ${action.color}`}>
                            <action.icon size={18} />
                        </div>
                        <div>
                            <h4 className={`font-bold text-sm text-text-main group-hover:underline decoration-primary`}>{action.title}</h4>
                            <p className="text-xs text-text-muted mt-1 leading-relaxed">{action.desc}</p>

                            <div className="mt-3 flex items-center gap-2">
                                <span className={`text-[10px] font-bold text-text-main px-2 py-0.5 rounded-lg border border-gray-100 shadow-sm ${action.badge}`}>
                                    {action.impact}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <ArrowRight size={16} className={`${action.color} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`} />
                    </div>
                </div>
            ))}
        </div>
    );
};
