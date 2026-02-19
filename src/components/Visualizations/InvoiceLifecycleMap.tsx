import React, { useMemo, useCallback } from 'react';
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
    Eye,
    AlertTriangle,
    Zap,
    CheckCircle2,
    Bot,
    CreditCard,
    BellRing,
    Scale,
    DollarSign,
    RotateCcw,
    PieChart,
    Wallet,
    Shield,
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
        bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
        border: 'border-gray-200',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-500',
        glow: '',
        textColor: 'text-gray-700',
    },
    sent: {
        bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        glow: 'shadow-blue-100/50',
        textColor: 'text-blue-700',
    },
    viewed: {
        bg: 'bg-gradient-to-br from-indigo-50 to-violet-50',
        border: 'border-indigo-200',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        glow: 'shadow-indigo-100/50',
        textColor: 'text-indigo-700',
    },
    partially_paid: {
        bg: 'bg-gradient-to-br from-cyan-50 to-teal-50',
        border: 'border-cyan-300',
        iconBg: 'bg-cyan-100',
        iconColor: 'text-cyan-600',
        glow: 'shadow-cyan-100/50',
        textColor: 'text-cyan-700',
    },
    overdue: {
        bg: 'bg-gradient-to-br from-red-50 to-rose-50',
        border: 'border-red-300',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        glow: 'shadow-red-200/60',
        textColor: 'text-red-700',
        badge: 'ALERT',
    },
    escalated: {
        bg: 'bg-gradient-to-br from-orange-50 to-red-50',
        border: 'border-orange-300',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        glow: 'shadow-orange-200/60',
        textColor: 'text-orange-700',
    },
    paid: {
        bg: 'bg-gradient-to-br from-emerald-50 to-green-50',
        border: 'border-emerald-300',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        glow: 'shadow-emerald-200/60',
        textColor: 'text-emerald-700',
    },
    // Agentic nodes
    agent_reminder: {
        bg: 'bg-gradient-to-br from-violet-50 to-purple-50',
        border: 'border-violet-300',
        iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
        iconColor: 'text-white',
        glow: 'shadow-violet-200/60',
        textColor: 'text-violet-700',
        badge: 'AI',
    },
    agent_settlement: {
        bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
        border: 'border-amber-300',
        iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
        iconColor: 'text-white',
        glow: 'shadow-amber-200/60',
        textColor: 'text-amber-700',
        badge: 'AI',
    },
    agent_analytics: {
        bg: 'bg-gradient-to-br from-teal-50 to-emerald-50',
        border: 'border-teal-300',
        iconBg: 'bg-gradient-to-br from-teal-500 to-emerald-600',
        iconColor: 'text-white',
        glow: 'shadow-teal-200/60',
        textColor: 'text-teal-700',
        badge: 'AI',
    },
    agent_compliance: {
        bg: 'bg-gradient-to-br from-sky-50 to-blue-50',
        border: 'border-sky-300',
        iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
        iconColor: 'text-white',
        glow: 'shadow-sky-200/60',
        textColor: 'text-sky-700',
        badge: 'AI',
    },
};

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------
const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
    draft: FileText,
    sent: Send,
    viewed: Eye,
    partially_paid: DollarSign,
    overdue: AlertTriangle,
    escalated: Zap,
    paid: CheckCircle2,
    agent_reminder: BellRing,
    agent_settlement: Scale,
    agent_analytics: PieChart,
    agent_compliance: Shield,
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
    }
}) => {
    const style = NODE_STYLES[data.styleKey] || NODE_STYLES.draft;
    const Icon = ICON_MAP[data.styleKey] || FileText;

    return (
        <div className={`relative px-5 py-4 rounded-2xl border-2 min-w-[170px] transition-all duration-300 hover:scale-105 cursor-pointer ${style.bg} ${style.border} ${style.glow ? `shadow-lg ${style.glow}` : 'shadow-sm'}`}>
            <Handle type="target" position={Position.Left} className="!bg-gray-300 !w-2 !h-2 !border-2 !border-white" />

            {/* AI Badge */}
            {style.badge && (
                <div className={`absolute -top-2.5 -right-2.5 text-[9px] font-black px-2 py-0.5 rounded-full shadow-md ${style.badge === 'AI'
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                        : 'bg-red-500 text-white animate-pulse'
                    }`}>
                    {style.badge === 'AI' ? '⚡ AI' : '● ALERT'}
                </div>
            )}

            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${style.iconBg}`}>
                <Icon size={16} className={style.iconColor} />
            </div>

            {/* Label */}
            <div className={`font-bold text-sm ${style.textColor}`}>{data.label}</div>

            {/* Count */}
            <div className="text-[22px] font-black text-gray-900 leading-tight mt-0.5">{data.count}</div>

            {/* Value */}
            <div className="text-[11px] text-gray-500 font-mono mt-1">
                ₹{data.value.toLocaleString('en-IN')}
            </div>

            {/* Subtitle */}
            {data.subtitle && (
                <div className={`text-[10px] mt-1.5 font-semibold ${style.textColor} opacity-80`}>
                    {data.subtitle}
                </div>
            )}

            <Handle type="source" position={Position.Right} className="!bg-gray-300 !w-2 !h-2 !border-2 !border-white" />
        </div>
    );
};

// ---------------------------------------------------------------------------
// Agentic action node (distinct visual)
// ---------------------------------------------------------------------------
const AgentNode = ({ data }: {
    data: {
        label: string;
        description: string;
        styleKey: string;
        metric?: string;
    }
}) => {
    const style = NODE_STYLES[data.styleKey] || NODE_STYLES.agent_reminder;
    const Icon = ICON_MAP[data.styleKey] || Bot;

    return (
        <div className={`relative px-5 py-4 rounded-2xl border-2 border-dashed min-w-[180px] transition-all duration-300 hover:scale-105 cursor-pointer ${style.bg} ${style.border} ${style.glow ? `shadow-lg ${style.glow}` : 'shadow-sm'}`}>
            <Handle type="target" position={Position.Left} className="!bg-violet-400 !w-2 !h-2 !border-2 !border-white" />

            {/* AI Badge */}
            <div className="absolute -top-2.5 -right-2.5 text-[9px] font-black px-2 py-0.5 rounded-full shadow-md bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center gap-0.5">
                <Bot size={9} /> AGENT
            </div>

            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${style.iconBg}`}>
                <Icon size={16} className={style.iconColor} />
            </div>

            {/* Label */}
            <div className={`font-bold text-sm ${style.textColor}`}>{data.label}</div>

            {/* Description */}
            <div className="text-[10px] text-gray-500 mt-1 leading-tight max-w-[160px]">
                {data.description}
            </div>

            {/* Metric */}
            {data.metric && (
                <div className={`text-[11px] mt-2 font-bold ${style.textColor} bg-white/60 px-2 py-0.5 rounded-md inline-block`}>
                    {data.metric}
                </div>
            )}

            <Handle type="source" position={Position.Right} className="!bg-violet-400 !w-2 !h-2 !border-2 !border-white" />
        </div>
    );
};

// ---------------------------------------------------------------------------
// Central hub node
// ---------------------------------------------------------------------------
const HubNode = ({ data }: { data: { label: string; total: number } }) => (
    <div className="relative px-6 py-5 rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-xl shadow-emerald-100/40 min-w-[180px] text-center transition-all duration-300 hover:scale-105 cursor-pointer">
        <Handle type="target" position={Position.Left} className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-white" />

        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 shadow-lg shadow-emerald-300/40">
            <Wallet size={22} className="text-white" />
        </div>
        <div className="font-black text-base text-gray-900">{data.label}</div>
        <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{(data.total / 1000).toFixed(1)}k
        </div>
        <div className="text-[10px] text-gray-500 mt-1 font-semibold uppercase tracking-wider">Total Pipeline</div>

        {/* Animated ring */}
        <div className="absolute -inset-1 rounded-[20px] border-2 border-emerald-200/40 animate-pulse pointer-events-none" />

        <Handle type="source" position={Position.Right} className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-white" />
    </div>
);

const nodeTypes = {
    statusNode: StatusNode,
    agentNode: AgentNode,
    hubNode: HubNode,
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
interface InvoiceLifecycleMapProps {
    invoices: Invoice[];
    onStatusSelect?: (status: string) => void;
}

export const InvoiceLifecycleMap: React.FC<InvoiceLifecycleMapProps> = ({ invoices, onStatusSelect }) => {

    const stats = useMemo(() => {
        const initialStats: Record<string, { count: number; value: number }> = {
            draft: { count: 0, value: 0 },
            sent: { count: 0, value: 0 },
            viewed: { count: 0, value: 0 },
            partially_paid: { count: 0, value: 0 },
            overdue: { count: 0, value: 0 },
            escalated: { count: 0, value: 0 },
            paid: { count: 0, value: 0 },
        };

        invoices.forEach((inv) => {
            const status = inv.status;
            if (initialStats[status]) {
                initialStats[status].count++;
                initialStats[status].value += inv.total;
            }
        });
        return initialStats;
    }, [invoices]);

    const totalPipeline = invoices.reduce((s, i) => s + i.total, 0);
    const overdueCount = stats.overdue.count + stats.escalated.count;
    const pendingCount = stats.sent.count + stats.viewed.count + stats.partially_paid.count;

    // ── Nodes ─────────────────────────────────────────────────────────────────
    const nodes: Node[] = useMemo(() => [
        // Row 1: Invoice lifecycle (left to right)
        {
            id: 'draft', type: 'statusNode',
            position: { x: 50, y: 120 },
            data: { label: 'Draft', count: stats.draft.count, value: stats.draft.value, styleKey: 'draft', subtitle: 'Created' },
        },
        {
            id: 'sent', type: 'statusNode',
            position: { x: 280, y: 40 },
            data: { label: 'Sent', count: stats.sent.count, value: stats.sent.value, styleKey: 'sent', subtitle: 'Delivered' },
        },
        {
            id: 'viewed', type: 'statusNode',
            position: { x: 280, y: 200 },
            data: { label: 'Viewed', count: stats.viewed.count, value: stats.viewed.value, styleKey: 'viewed', subtitle: 'Client opened' },
        },

        // Hub node (center)
        {
            id: 'hub', type: 'hubNode',
            position: { x: 520, y: 100 },
            data: { label: 'Revenue Hub', total: totalPipeline },
        },

        // Right side: outcomes
        {
            id: 'partially_paid', type: 'statusNode',
            position: { x: 770, y: 0 },
            data: { label: 'Partial Pay', count: stats.partially_paid.count, value: stats.partially_paid.value, styleKey: 'partially_paid', subtitle: 'In progress' },
        },
        {
            id: 'paid', type: 'statusNode',
            position: { x: 1040, y: 0 },
            data: { label: 'Closed', count: stats.paid.count, value: stats.paid.value, styleKey: 'paid', subtitle: '✓ Settled' },
        },
        {
            id: 'overdue', type: 'statusNode',
            position: { x: 770, y: 165 },
            data: { label: 'Overdue', count: stats.overdue.count, value: stats.overdue.value, styleKey: 'overdue', subtitle: `${Math.floor((stats.overdue.value / (totalPipeline || 1)) * 100)}% at risk` },
        },
        {
            id: 'escalated', type: 'statusNode',
            position: { x: 770, y: 330 },
            data: { label: 'Escalated', count: stats.escalated.count, value: stats.escalated.value, styleKey: 'escalated', subtitle: 'Critical' },
        },

        // ── Agentic workflow nodes ────────────────────────────────────────────
        {
            id: 'agent_reminder', type: 'agentNode',
            position: { x: 1040, y: 155 },
            data: {
                label: 'Auto-Reminders',
                description: 'AI sends follow-ups based on payment patterns & urgency',
                styleKey: 'agent_reminder',
                metric: `${overdueCount} queued`,
            },
        },
        {
            id: 'agent_settlement', type: 'agentNode',
            position: { x: 1040, y: 320 },
            data: {
                label: 'Settlement Agent',
                description: 'Generates smart offers & negotiates payment plans',
                styleKey: 'agent_settlement',
                metric: `₹${(stats.overdue.value / 1000).toFixed(0)}k recoverable`,
            },
        },
        {
            id: 'agent_analytics', type: 'agentNode',
            position: { x: 520, y: 330 },
            data: {
                label: 'Cash Flow Intel',
                description: 'Safe-to-spend analysis, forecasting & health scoring',
                styleKey: 'agent_analytics',
                metric: `${invoices.length} analyzed`,
            },
        },
        {
            id: 'agent_compliance', type: 'agentNode',
            position: { x: 280, y: 380 },
            data: {
                label: 'Compliance Guard',
                description: 'Auto-monitors GST, TDS filings & regulatory deadlines',
                styleKey: 'agent_compliance',
                metric: 'Active',
            },
        },
    ], [stats, totalPipeline, overdueCount, invoices.length]);

    // ── Edges ─────────────────────────────────────────────────────────────────
    const edges: Edge[] = useMemo(() => [
        // Lifecycle flow
        { id: 'draft-sent', source: 'draft', target: 'sent', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' } },
        { id: 'draft-viewed', source: 'draft', target: 'viewed', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } },
        { id: 'sent-hub', source: 'sent', target: 'hub', animated: true, style: { stroke: '#10b981', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } },
        { id: 'viewed-hub', source: 'viewed', target: 'hub', animated: true, style: { stroke: '#10b981', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } },

        // Hub to outcomes
        { id: 'hub-partial', source: 'hub', target: 'partially_paid', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' } },
        { id: 'hub-overdue', source: 'hub', target: 'overdue', animated: true, style: { stroke: '#ef4444', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }, label: '⚠', labelStyle: { fontSize: 14 } },
        { id: 'hub-paid', source: 'hub', target: 'paid', animated: true, style: { stroke: '#10b981', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } },

        // Partial → Paid
        { id: 'partial-paid', source: 'partially_paid', target: 'paid', animated: true, style: { stroke: '#10b981', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } },

        // Overdue paths
        { id: 'overdue-escalated', source: 'overdue', target: 'escalated', animated: true, style: { stroke: '#dc2626', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#dc2626' } },
        { id: 'overdue-paid', source: 'overdue', target: 'paid', style: { stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '5,5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }, label: 'Recovery', labelStyle: { fontSize: 10, fill: '#10b981', fontWeight: 700 } },

        // Agentic connections (dashed, purple-tinted)
        { id: 'overdue-agent-reminder', source: 'overdue', target: 'agent_reminder', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '6,4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' }, label: '⚡ AI', labelStyle: { fontSize: 9, fill: '#8b5cf6', fontWeight: 800 } },
        { id: 'escalated-agent-settlement', source: 'escalated', target: 'agent_settlement', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '6,4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' }, label: '⚡ AI', labelStyle: { fontSize: 9, fill: '#f59e0b', fontWeight: 800 } },

        // Agent → Recovery
        { id: 'agent-reminder-paid', source: 'agent_reminder', target: 'paid', style: { stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '4,4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } },
        { id: 'agent-settlement-partial', source: 'agent_settlement', target: 'partially_paid', style: { stroke: '#06b6d4', strokeWidth: 1.5, strokeDasharray: '4,4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' } },

        // Analytics hub
        { id: 'hub-analytics', source: 'hub', target: 'agent_analytics', style: { stroke: '#14b8a6', strokeWidth: 1.5, strokeDasharray: '6,4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#14b8a6' } },

        // Compliance monitoring
        { id: 'draft-compliance', source: 'draft', target: 'agent_compliance', style: { stroke: '#0ea5e9', strokeWidth: 1.5, strokeDasharray: '6,4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0ea5e9' } },
        { id: 'compliance-analytics', source: 'agent_compliance', target: 'agent_analytics', style: { stroke: '#14b8a6', strokeWidth: 1.5, strokeDasharray: '6,4' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#14b8a6' } },
    ], []);

    const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        if (onStatusSelect && !node.id.startsWith('agent_') && node.id !== 'hub') {
            onStatusSelect(node.id);
        }
    }, [onStatusSelect]);

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden relative">
            {/* Legend */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-xl rounded-xl border border-gray-200 shadow-lg p-3 space-y-2">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Workflow Legend</div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                    <div className="w-6 h-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded" />
                    <span className="font-medium">Invoice Flow</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                    <div className="w-6 h-0.5 bg-red-500 rounded" />
                    <span className="font-medium">Risk Path</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                    <div className="w-6 h-0.5 bg-violet-500 rounded" style={{ borderTop: '2px dashed #8b5cf6' }} />
                    <span className="font-medium">AI Agent Action</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                    <div className="w-6 h-0.5 rounded" style={{ borderTop: '2px dashed #10b981' }} />
                    <span className="font-medium">Recovery Path</span>
                </div>
            </div>

            {/* Stats bar */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <div className="bg-white/90 backdrop-blur-xl rounded-lg border border-gray-200 shadow-sm px-3 py-1.5 text-center">
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Pipeline</div>
                    <div className="text-sm font-black text-gray-900">₹{(totalPipeline / 1000).toFixed(0)}k</div>
                </div>
                <div className="bg-white/90 backdrop-blur-xl rounded-lg border border-red-200 shadow-sm px-3 py-1.5 text-center">
                    <div className="text-[10px] text-red-400 font-bold uppercase">At Risk</div>
                    <div className="text-sm font-black text-red-600">{overdueCount}</div>
                </div>
                <div className="bg-white/90 backdrop-blur-xl rounded-lg border border-violet-200 shadow-sm px-3 py-1.5 text-center">
                    <div className="text-[10px] text-violet-400 font-bold uppercase">AI Agents</div>
                    <div className="text-sm font-black text-violet-600">4</div>
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
                <Background gap={20} size={1} color="#e2e8f0" />
                <Controls
                    className="!bg-white/90 !backdrop-blur !rounded-xl !border !border-gray-200 !shadow-lg"
                    showInteractive={false}
                />
            </ReactFlow>
        </div>
    );
};
