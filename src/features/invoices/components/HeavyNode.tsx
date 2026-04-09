import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Invoice } from '@/types';
import { AlertTriangle, CheckCircle, Clock, Send, Star } from 'lucide-react';
import { NodeTier } from '@/shared/utils/physics';

interface HeavyNodeProps {
    data: {
        invoice: Invoice;
        tier: NodeTier; // Use tier from physics
        isOverdue: boolean;
        onClick?: (invoice: Invoice) => void;
    }
}

export const HeavyNode = memo(({ data }: HeavyNodeProps) => {
    const { invoice, tier, isOverdue } = data;

    // Scale Styles based on Tier
    const tierStyles = {
        [NodeTier.TIER_1_CRITICAL]: { width: 280, scale: 1.05, shadow: 'shadow-2xl', z: 30 },
        [NodeTier.TIER_2_ACTIVE]: { width: 220, scale: 1, shadow: 'shadow-card', z: 20 },
        [NodeTier.TIER_3_PASSIVE]: { width: 180, scale: 0.95, shadow: 'shadow-sm', z: 10 }
    };

    const currentStyle = tierStyles[tier] || tierStyles[NodeTier.TIER_2_ACTIVE];

    const variants = {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        hover: {
            scale: 1.05,
            zIndex: 40,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }
    };

    const StatusIcon = isOverdue ? AlertTriangle
        : invoice.status === 'paid' ? CheckCircle
            : invoice.status === 'sent' ? Send
                : Clock;

    const statusColors = isOverdue
        ? 'bg-status-danger-bg border-status-danger text-status-danger'
        : invoice.status === 'paid'
            ? 'bg-status-success-bg border-status-success text-status-success'
            : invoice.status === 'sent'
                ? 'bg-status-info-bg border-status-info text-status-info'
                : 'bg-gray-50 border-gray-200 text-text-muted';

    return (
        <motion.div
            className={`bg-white rounded-xl border transition-all cursor-pointer overflow-hidden group 
                ${isOverdue ? 'border-status-danger/60 ring-4 ring-status-danger/5' : 'border-gray-100'}
                ${currentStyle.shadow}
            `}
            style={{ width: currentStyle.width, zIndex: currentStyle.z }}
            variants={variants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            onClick={() => data.onClick && data.onClick(invoice)}
        >
            <Handle type="target" position={Position.Left} className="!bg-gray-300 w-2 h-2" />

            {/* Tier 1 Badge */}
            {tier === NodeTier.TIER_1_CRITICAL && (
                <div className="absolute top-0 right-0 p-1">
                    <div className="bg-yellow-400 text-yellow-900 rounded-bl-lg rounded-tr-lg p-1 shadow-sm">
                        <Star size={10} fill="currentColor" />
                    </div>
                </div>
            )}

            <div className={`p-3 ${tier === NodeTier.TIER_3_PASSIVE ? 'opacity-70 group-hover:opacity-100' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-text-light uppercase tracking-wide">INV-{invoice.invoiceNumber}</span>
                    <div className={`p-1 rounded-md ${statusColors}`}>
                        <StatusIcon size={12} />
                    </div>
                </div>

                <h4 className="text-sm font-bold text-text-main truncate mb-1" title={invoice.buyer?.name}>
                    {invoice.buyer?.name || 'Unknown Buyer'}
                </h4>

                <div className="flex items-baseline gap-1">
                    <span className={`${tier === NodeTier.TIER_1_CRITICAL ? 'text-xl' : 'text-lg'} font-bold text-text-main`}>
                        ₹{(invoice.total / 1000).toFixed(1)}k
                    </span>
                </div>

                {isOverdue && (
                    <div className="mt-2 text-[10px] font-bold text-status-danger flex items-center gap-1 bg-status-danger-bg px-2 py-1 rounded">
                        Due {new Date(invoice.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                )}
            </div>

            <div className="h-1 w-full bg-gray-50">
                <div
                    className={`h-full ${isOverdue ? 'bg-status-danger' : invoice.status === 'paid' ? 'bg-status-success' : 'bg-primary'}`}
                    style={{ width: invoice.status === 'paid' ? '100%' : '30%' }}
                />
            </div>

            <Handle type="source" position={Position.Right} className="!bg-gray-300 w-2 h-2" />
        </motion.div>
    );
});
