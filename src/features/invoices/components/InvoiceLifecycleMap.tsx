import React, { useMemo, useCallback, memo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Handle,
    Position,
    Node,
    Edge,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Invoice } from '@/types';
import {
    FileText,
    Send,
    AlertTriangle,
    Zap,
    CheckCircle2,
    Wallet,
    Ban,
    ReceiptText,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Node style configs
// ---------------------------------------------------------------------------
interface NodeStyleConfig {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    glow: string;
    textColor: string;
    badge?: string;
}

const NODE_STYLES: Record<string, NodeStyleConfig> = {
    draft: {
        bg: 'bg-white/[0.03]',
        border: 'border-white/[0.08]',
        iconBg: 'bg-white/[0.05]',
        iconColor: 'text-gray-400',
        glow: '',
        textColor: 'text-gray-300',
    },
    sent: {
        bg: 'bg-indigo-500/5',
        border: 'border-indigo-500/20',
        iconBg: 'bg-indigo-500/10',
        iconColor: 'text-indigo-400',
        glow: 'shadow-indigo-500/10',
        textColor: 'text-indigo-300',
    },
    partially_paid: {
        bg: 'bg-amber-500/5',
        border: 'border-amber-500/20',
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-400',
        glow: 'shadow-amber-400/20',
        textColor: 'text-amber-300',
        badge: 'PARTIAL',
    },
    overdue: {
        bg: 'bg-red-500/5',
        border: 'border-red-500/20',
        iconBg: 'bg-red-500/10',
        iconColor: 'text-red-400',
        glow: 'shadow-red-500/10',
        textColor: 'text-red-300',
        badge: 'LATE',
    },
    paid: {
        bg: 'bg-teal-500/5',
        border: 'border-teal-500/20',
        iconBg: 'bg-teal-500/10',
        iconColor: 'text-teal-400',
        glow: 'shadow-teal-500/10',
        textColor: 'text-teal-300',
    },
    void: {
        bg: 'bg-gray-500/5',
        border: 'border-gray-500/20',
        iconBg: 'bg-gray-500/10',
        iconColor: 'text-gray-500',
        glow: '',
        textColor: 'text-gray-500',
    },
    write_off: {
        bg: 'bg-fuchsia-500/5',
        border: 'border-fuchsia-500/20',
        iconBg: 'bg-fuchsia-500/10',
        iconColor: 'text-fuchsia-400',
        glow: 'shadow-fuchsia-500/10',
        textColor: 'text-fuchsia-300',
        badge: 'WRITE-OFF',
    },
};

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------
const ICON_MAP: Record<string, any> = {
    draft: FileText,
    sent: Send,
    partially_paid: Zap,
    overdue: AlertTriangle,
    paid: CheckCircle2,
    void: Ban,
    write_off: ReceiptText,
};

// ---------------------------------------------------------------------------
// Custom status node
// ---------------------------------------------------------------------------
const StatusNode = ({ data }: {
    data: {
        label: string;
        count: number;
        value: number;
        styleKey: string;
        subtitle?: string;
        badge?: string;
    }
}) => {
    const style = NODE_STYLES[data.styleKey] || NODE_STYLES.draft;
    const Icon = ICON_MAP[data.styleKey] || FileText;

    return (
        <div className={`relative px-5 py-4 rounded-2xl border backdrop-blur-md min-w-[170px] transition-all duration-300 hover:scale-105 cursor-pointer ${style.bg} ${style.border} ${style.glow ? `shadow-lg ${style.glow}` : 'shadow-sm'}`}>
            <Handle type="target" position={Position.Left} className="!bg-gray-600 !w-2 !h-2 !border !border-white/10" />

            {data.badge && (
                <div
                    className={`absolute -top-2.5 -right-2.5 text-[9px] font-black px-2 py-0.5 rounded-full shadow-md ${
                        data.styleKey === 'overdue'
                            ? 'bg-red-500 text-white animate-pulse'
                            : data.styleKey === 'partially_paid'
                                ? 'bg-amber-400 text-black'
                                : data.styleKey === 'write_off'
                                    ? 'bg-fuchsia-500 text-white'
                                    : 'bg-cyan-400 text-black'
                    }`}
                >
                    ● {data.badge}
                </div>
            )}

            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${style.iconBg}`}>
                <Icon size={16} className={style.iconColor} />
            </div>

            {/* Label */}
            <div className={`font-bold text-sm ${style.textColor}`}>{data.label}</div>

            {/* Count */}
            <div className="text-[22px] font-black text-white leading-tight mt-0.5">{data.count}</div>

            {/* Value */}
            <div className="text-[11px] text-gray-500 font-mono mt-1">
                ₹{data.value.toLocaleString('en-IN')}
            </div>

            {/* Subtitle */}
            {data.subtitle && (
                <div className={`text-[10px] mt-1.5 font-semibold ${style.textColor} opacity-60`}>
                    {data.subtitle}
                </div>
            )}

            <Handle type="source" position={Position.Right} className="!bg-gray-600 !w-2 !h-2 !border !border-white/10" />
        </div>
    );
};

// ---------------------------------------------------------------------------
// Central hub node
// ---------------------------------------------------------------------------
const HubNode = ({ data }: { data: { label: string; total: number } }) => (
    <div className="relative px-6 py-5 rounded-3xl border border-white/[0.08] bg-[#161a2b] shadow-2xl shadow-teal-500/10 min-w-[180px] text-center transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.1),_transparent_60%)]" />
        <Handle type="target" position={Position.Left} className="!bg-teal-400 !w-3 !h-3 !border !border-white/20" />

        <div className="relative">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-3 shadow-lg shadow-teal-500/25">
                <Wallet size={22} className="text-white" />
            </div>
            <div className="font-black text-base text-white">{data.label}</div>
            <div className="text-2xl font-black text-teal-400 mt-1">
                ₹{(data.total / 1000).toFixed(1)}k
            </div>
            <div className="text-[10px] text-gray-500 mt-1 font-semibold uppercase tracking-wider">Open Balance</div>
        </div>

        {/* Animated ring */}
        <div className="absolute -inset-1 rounded-[24px] border border-teal-500/20 animate-pulse pointer-events-none" />

        <Handle type="source" position={Position.Right} className="!bg-teal-400 !w-3 !h-3 !border !border-white/20" />
    </div>
);

const nodeTypes = {
    statusNode: StatusNode,
    hubNode: HubNode,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
interface InvoiceLifecycleMapProps {
    invoices: Invoice[];
    onStatusSelect?: (status: string) => void;
}

const InvoiceLifecycleMapBase: React.FC<InvoiceLifecycleMapProps> = ({ invoices, onStatusSelect }) => {

    const stats = useMemo(() => {
        const initialStats: Record<string, { count: number; value: number }> = {
            draft: { count: 0, value: 0 },
            sent: { count: 0, value: 0 },
            partially_paid: { count: 0, value: 0 },
            overdue: { count: 0, value: 0 },
            paid: { count: 0, value: 0 },
            void: { count: 0, value: 0 },
            write_off: { count: 0, value: 0 },
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

            if (status === 'draft') {
                initialStats.draft.count++;
                initialStats.draft.value += Number(inv.total || 0);
            } else if (status === 'paid') {
                initialStats.paid.count++;
                initialStats.paid.value += Number(inv.total || 0);
            } else if (status === 'sent') {
                initialStats.sent.count++;
                initialStats.sent.value += balanceDue;
            } else if (status === 'partially_paid') {
                initialStats.partially_paid.count++;
                initialStats.partially_paid.value += balanceDue;
            } else if (status === 'overdue') {
                initialStats.overdue.count++;
                initialStats.overdue.value += balanceDue;
            } else if (status === 'void') {
                initialStats.void.count++;
                initialStats.void.value += Number(inv.total || 0);
            } else if (status === 'write_off') {
                initialStats.write_off.count++;
                initialStats.write_off.value += balanceDue;
            }
        });
        return initialStats;
    }, [invoices]);

    const totalPipeline = stats.sent.value + stats.partially_paid.value + stats.overdue.value;
    const dueTodayCount = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return invoices.filter((invoice) => {
            const status = (invoice.status || '').toLowerCase().trim();
            if (!['sent', 'partially_paid'].includes(status)) return false;
            const dueDate = invoice.dueDate || (invoice as any).due_date;
            if (!dueDate) return false;
            return new Date(dueDate).toISOString().split('T')[0] === todayStr;
        }).length;
    }, [invoices]);

    // ── Nodes ─────────────────────────────────────────────────────────────────
    const nodes: Node[] = useMemo(() => [
        // Row 1: Invoice creation
        {
            id: 'draft', type: 'statusNode',
            position: { x: 50, y: 120 },
            data: { label: 'Draft', count: stats.draft.count, value: stats.draft.value, styleKey: 'draft', subtitle: 'Prepared' },
        },
        // Dispatched stage
        {
            id: 'sent', type: 'statusNode',
            position: { x: 280, y: 40 },
            data: { label: 'Sent', count: stats.sent.count, value: stats.sent.value, styleKey: 'sent', subtitle: 'Live receivables' },
        },
        {
            id: 'partially_paid', type: 'statusNode',
            position: { x: 280, y: 220 },
            data: { label: 'Partially Paid', count: stats.partially_paid.count, value: stats.partially_paid.value, styleKey: 'partially_paid', subtitle: 'Balance still open', badge: 'PARTIAL' },
        },

        // Hub node (center)
        {
            id: 'hub', type: 'hubNode',
            position: { x: 520, y: 120 },
            data: { label: 'Open Receivables', total: totalPipeline },
        },

        // Outcomes
        {
            id: 'paid', type: 'statusNode',
            position: { x: 770, y: 0 },
            data: { label: 'Collected', count: stats.paid.count, value: stats.paid.value, styleKey: 'paid', subtitle: '✓ Settled' },
        },
        {
            id: 'overdue', type: 'statusNode',
            position: { x: 770, y: 165 },
            data: { label: 'Overdue', count: stats.overdue.count, value: stats.overdue.value, styleKey: 'overdue', subtitle: `${Math.floor((stats.overdue.value / (totalPipeline || 1)) * 100)}% at risk`, badge: 'LATE' },
        },
        {
            id: 'void', type: 'statusNode',
            position: { x: 770, y: 330 },
            data: { label: 'Voided', count: stats.void.count, value: stats.void.value, styleKey: 'void', subtitle: 'Cancelled' },
        },
        {
            id: 'write_off', type: 'statusNode',
            position: { x: 770, y: 495 },
            data: { label: 'Written Off', count: stats.write_off.count, value: stats.write_off.value, styleKey: 'write_off', subtitle: 'Uncollectible' },
        },
    ], [stats, totalPipeline]);

    // ── Edges ─────────────────────────────────────────────────────────────────
    const edges: Edge[] = useMemo(() => [
        // Creation to Dispatch
        { id: 'draft-sent', source: 'draft', target: 'sent', animated: true, style: { stroke: '#818cf8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' } },
        
        { id: 'sent-partially-paid', source: 'sent', target: 'partially_paid', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '4,4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' } },
        
        // Paths to Revenue Hub
        { id: 'sent-hub', source: 'sent', target: 'hub', animated: true, style: { stroke: '#2dd4bf', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2dd4bf' } },
        { id: 'partial-hub', source: 'partially_paid', target: 'hub', animated: true, style: { stroke: '#2dd4bf', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2dd4bf' } },

        // Hub to terminal states
        { id: 'hub-overdue', source: 'hub', target: 'overdue', animated: true, style: { stroke: '#f87171', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f87171' }, label: '⚠ Late', labelStyle: { fontSize: 10, fill: '#f87171', fontWeight: 900 } },
        { id: 'hub-paid', source: 'hub', target: 'paid', animated: true, style: { stroke: '#2dd4bf', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2dd4bf' } },
        { id: 'hub-void', source: 'hub', target: 'void', style: { stroke: '#9ca3af', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' } },
        { id: 'hub-write-off', source: 'hub', target: 'write_off', style: { stroke: '#d946ef', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#d946ef' } },

        // Recovery path
        { id: 'overdue-paid', source: 'overdue', target: 'paid', style: { stroke: '#2dd4bf', strokeWidth: 1.5, strokeDasharray: '5,5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2dd4bf' }, label: 'Recovery', labelStyle: { fontSize: 10, fill: '#2dd4bf', fontWeight: 700 } },
    ], []);

    const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        if (onStatusSelect && node.id !== 'hub') {
            onStatusSelect(node.id);
        }
    }, [onStatusSelect]);

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden relative bg-[#0c0f1a]">
            {/* Legend */}
            <div className="absolute top-4 left-4 z-10 bg-[#161a2b]/80 backdrop-blur-xl rounded-xl border border-white/[0.06] shadow-2xl p-3 space-y-2">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Workflow Legend</div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <div className="w-6 h-0.5 bg-gradient-to-r from-indigo-500 to-teal-500 rounded" />
                    <span className="font-medium">Invoice Flow</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <div className="w-6 h-0.5 bg-red-500 rounded" />
                    <span className="font-medium">Risk Path</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <div className="w-6 h-0.5 rounded" style={{ borderTop: '2px dashed #2dd4bf' }} />
                    <span className="font-medium">Recovery Path</span>
                </div>
            </div>

            {/* Stats bar */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <div className="bg-[#161a2b]/80 backdrop-blur-xl rounded-lg border border-white/[0.06] shadow-sm px-3 py-1.5 text-center">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Pipeline</div>
                    <div className="text-sm font-black text-white">₹{(totalPipeline / 1000).toFixed(0)}k</div>
                </div>
                <div className="bg-sky-500/10 backdrop-blur-xl rounded-lg border border-sky-500/20 shadow-sm px-3 py-1.5 text-center">
                    <div className="text-[10px] text-sky-400 font-bold uppercase tracking-tight">Due Today</div>
                    <div className="text-sm font-black text-sky-500">{dueTodayCount}</div>
                </div>
                <div className="bg-red-500/10 backdrop-blur-xl rounded-lg border border-red-500/20 shadow-sm px-3 py-1.5 text-center">
                    <div className="text-[10px] text-red-400 font-bold uppercase tracking-tight">At Risk</div>
                    <div className="text-sm font-black text-red-500">{stats.overdue.count}</div>
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                onNodeClick={handleNodeClick}
                proOptions={{ hideAttribution: true }}
                minZoom={0.4}
                maxZoom={1.5}
            >
                <Background gap={20} size={1} color="rgba(255, 255, 255, 0.05)" />
                <Controls
                    className="!bg-[#161a2b]/80 !backdrop-blur !rounded-xl !border !border-white/[0.06] !shadow-2xl [&_button]:!invert [&_button]:!opacity-60 hover:[&_button]:!opacity-100"
                    showInteractive={false}
                />
            </ReactFlow>
        </div>
    );
};

export const InvoiceLifecycleMap = memo(InvoiceLifecycleMapBase);
