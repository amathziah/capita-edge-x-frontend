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
import { Invoice } from '../../types';
import {
    FileText,
    Send,
    AlertTriangle,
    Zap,
    CheckCircle2,
    Wallet,
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
    pending: {
        bg: 'bg-indigo-500/5',
        border: 'border-indigo-500/20',
        iconBg: 'bg-indigo-500/10',
        iconColor: 'text-indigo-400',
        glow: 'shadow-indigo-500/10',
        textColor: 'text-indigo-300',
    },
    viewed: {
        bg: 'bg-cyan-500/5',
        border: 'border-cyan-500/20',
        iconBg: 'bg-cyan-500/10',
        iconColor: 'text-cyan-400',
        glow: 'shadow-cyan-400/20',
        textColor: 'text-cyan-300',
        badge: 'TRACKED',
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
    cancelled: {
        bg: 'bg-gray-500/5',
        border: 'border-gray-500/20',
        iconBg: 'bg-gray-500/10',
        iconColor: 'text-gray-500',
        glow: '',
        textColor: 'text-gray-500',
    },
};

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------
const ICON_MAP: Record<string, any> = {
    draft: FileText,
    pending: Send,
    viewed: Zap,
    overdue: AlertTriangle,
    paid: CheckCircle2,
    cancelled: FileText,
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
                <div className={`absolute -top-2.5 -right-2.5 text-[9px] font-black px-2 py-0.5 rounded-full shadow-md ${data.styleKey === 'overdue' ? 'bg-red-500 text-white animate-pulse' : 'bg-cyan-400 text-black'}`}>
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
            <div className="text-[10px] text-gray-500 mt-1 font-semibold uppercase tracking-wider">Total Pipeline</div>
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
            pending: { count: 0, value: 0 },
            viewed: { count: 0, value: 0 },
            overdue: { count: 0, value: 0 },
            paid: { count: 0, value: 0 },
            cancelled: { count: 0, value: 0 },
        };

        const now = new Date();

        invoices.forEach((inv) => {
            const status = inv.status;
            
            // Map core statuses
            if (status === 'draft') {
                initialStats.draft.count++;
                initialStats.draft.value += inv.total;
            } else if (status === 'paid') {
                initialStats.paid.count++;
                initialStats.paid.value += inv.total;
            } else if (status === 'cancelled') {
                initialStats.cancelled.count++;
                initialStats.cancelled.value += inv.total;
            } else if (status === 'pending') {
                // Determine if it's Viewed or Overdue (sub-states of pending)
                const isOverdue = inv.dueDate && new Date(inv.dueDate) < now;
                const isViewed = !!(inv.shareViewedAt || (inv as any).share_viewed_at);

                if (isOverdue) {
                    initialStats.overdue.count++;
                    initialStats.overdue.value += inv.total;
                } else if (isViewed) {
                    initialStats.viewed.count++;
                    initialStats.viewed.value += inv.total;
                } else {
                    initialStats.pending.count++;
                    initialStats.pending.value += inv.total;
                }
            }
        });
        return initialStats;
    }, [invoices]);

    const totalPipeline = invoices.reduce((s, i) => s + i.total, 0);
    const overdueCount = stats.overdue.count;

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
            id: 'pending', type: 'statusNode',
            position: { x: 280, y: 40 },
            data: { label: 'Pending', count: stats.pending.count, value: stats.pending.value, styleKey: 'pending', subtitle: 'Dispatched' },
        },
        // Engagement stage
        {
            id: 'viewed', type: 'statusNode',
            position: { x: 280, y: 220 },
            data: { label: 'Viewed', count: stats.viewed.count, value: stats.viewed.value, styleKey: 'viewed', subtitle: 'Client Engagement', badge: 'TRACKED' },
        },

        // Hub node (center)
        {
            id: 'hub', type: 'hubNode',
            position: { x: 520, y: 120 },
            data: { label: 'Revenue Hub', total: totalPipeline },
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
            id: 'cancelled', type: 'statusNode',
            position: { x: 770, y: 330 },
            data: { label: 'Voided', count: stats.cancelled.count, value: stats.cancelled.value, styleKey: 'cancelled', subtitle: 'Cancelled' },
        },
    ], [stats, totalPipeline]);

    // ── Edges ─────────────────────────────────────────────────────────────────
    const edges: Edge[] = useMemo(() => [
        // Creation to Dispatch
        { id: 'draft-pending', source: 'draft', target: 'pending', animated: true, style: { stroke: '#818cf8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' } },
        
        // Dispatch to Engagement
        { id: 'pending-viewed', source: 'pending', target: 'viewed', animated: true, style: { stroke: '#22d3ee', strokeWidth: 2, strokeDasharray: '4,4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22d3ee' } },
        
        // Paths to Revenue Hub
        { id: 'pending-hub', source: 'pending', target: 'hub', animated: true, style: { stroke: '#2dd4bf', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2dd4bf' } },
        { id: 'viewed-hub', source: 'viewed', target: 'hub', animated: true, style: { stroke: '#2dd4bf', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2dd4bf' } },

        // Hub to terminal states
        { id: 'hub-overdue', source: 'hub', target: 'overdue', animated: true, style: { stroke: '#f87171', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f87171' }, label: '⚠ Late', labelStyle: { fontSize: 10, fill: '#f87171', fontWeight: 900 } },
        { id: 'hub-paid', source: 'hub', target: 'paid', animated: true, style: { stroke: '#2dd4bf', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2dd4bf' } },
        { id: 'hub-cancelled', source: 'hub', target: 'cancelled', style: { stroke: '#9ca3af', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' } },

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
                <div className="bg-red-500/10 backdrop-blur-xl rounded-lg border border-red-500/20 shadow-sm px-3 py-1.5 text-center">
                    <div className="text-[10px] text-red-400 font-bold uppercase tracking-tight">At Risk</div>
                    <div className="text-sm font-black text-red-500">{overdueCount}</div>
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
