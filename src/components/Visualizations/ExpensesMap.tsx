import { useMemo, useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Edge,
    Node,
    useNodesState,
    useEdgesState,
    Position,
    ConnectionLineType,
    BackgroundVariant,
    MarkerType,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

import { Expense } from '../../types';
import { TotalNode } from './nodes/TotalNode';
import { CategoryNode } from './nodes/CategoryNode';
import { InsightNode } from './nodes/InsightNode';
import { ExportNode } from './nodes/ExportNode';
import { AgentNode } from './nodes/AgentNode';
import { ElasticEdge } from './ElasticEdge';
import {
    Shield,
    TrendingDown,
    Wallet,
    Radar,
    Bot,
} from 'lucide-react';

const nodeTypes = {
    total: TotalNode,
    category: CategoryNode,
    insight: InsightNode,
    export: ExportNode,
    agent: AgentNode,
};

const edgeTypes = {
    elastic: ElasticEdge,
};

// Layout using Dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir: 'TB',
        nodesep: 100,
        ranksep: 130,
        marginx: 60,
        marginy: 60,
    });

    nodes.forEach((node) => {
        let width = 200;
        let height = 100;
        if (node.type === 'total') { width = 280; height = 280; }
        if (node.type === 'category') { width = 240; height = 140; }
        if (node.type === 'insight') { width = 200; height = 90; }
        if (node.type === 'export') { width = 160; height = 60; }
        if (node.type === 'agent') { width = 210; height = 140; }

        dagreGraph.setNode(node.id, { width, height });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            position: {
                x: nodeWithPosition.x - nodeWithPosition.width / 2,
                y: nodeWithPosition.y - nodeWithPosition.height / 2,
            },
        };
    });

    return { nodes: newNodes, edges };
};

interface ExpensesMapProps {
    expenses: Expense[];
    onExport: () => void;
}

export function ExpensesMap({ expenses, onExport }: ExpensesMapProps) {
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const _nodes: Node[] = [];
        const _edges: Edge[] = [];

        // ── 1. Total Node ───────────────────────────────────────────────────
        const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const totalGST = expenses.reduce((sum, e) => sum + Number(e.gstAmount || 0), 0);
        _nodes.push({
            id: 'total',
            type: 'total',
            data: { amount: totalAmount, label: 'Total Expenses' },
            position: { x: 0, y: 0 },
        });

        // ── 2. Category Nodes ───────────────────────────────────────────────
        const catAgg: Record<string, number> = {};
        expenses.forEach(e => {
            const cat = e.category || 'Uncategorized';
            catAgg[cat] = (catAgg[cat] || 0) + Number(e.amount || 0);
        });

        const categories = Object.entries(catAgg)
            .map(([cat, amount]) => ({ cat, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 8);

        const highestAmount = categories.length > 0 ? categories[0].amount : 0;

        const categoryColors = [
            '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
            '#10b981', '#3b82f6', '#f97316', '#06b6d4',
        ];

        categories.forEach((c, idx) => {
            const id = `cat-${idx}`;
            _nodes.push({
                id,
                type: 'category',
                data: {
                    category: c.cat,
                    amount: c.amount,
                    total: totalAmount,
                    isHighest: c.amount === highestAmount && c.amount > 0,
                    color: categoryColors[idx % categoryColors.length],
                },
                position: { x: 0, y: 0 },
            });

            const percentage = totalAmount > 0 ? (c.amount / totalAmount) * 100 : 0;
            const strokeWidth = Math.max(2, Math.min(8, percentage / 5));

            _edges.push({
                id: `e-total-${id}`,
                source: 'total',
                target: id,
                type: 'elastic',
                style: {
                    stroke: categoryColors[idx % categoryColors.length],
                    strokeWidth,
                    opacity: 0.6,
                },
                animated: true,
            });
        });

        // ── 3. AI Insights ──────────────────────────────────────────────────
        if (categories.length > 0) {
            const topCategory = categories[0];
            const topPercentage = totalAmount > 0 ? ((topCategory.amount / totalAmount) * 100).toFixed(1) : 0;

            _nodes.push({
                id: 'insight-1',
                type: 'insight',
                data: { label: `${topPercentage}% spent on ${topCategory.cat}` },
                position: { x: 0, y: 0 },
            });

            _edges.push({
                id: 'e-cat-0-insight-1',
                source: 'cat-0',
                target: 'insight-1',
                type: 'elastic',
                style: { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '8,4' },
                animated: true,
            });
        }

        if (categories.length > 1) {
            const avgSpend = totalAmount / categories.length;
            const aboveAvg = categories.filter(c => c.amount > avgSpend).length;

            _nodes.push({
                id: 'insight-2',
                type: 'insight',
                data: { label: `${aboveAvg} categories above average` },
                position: { x: 0, y: 0 },
            });

            _edges.push({
                id: 'e-total-insight-2',
                source: 'total',
                target: 'insight-2',
                type: 'elastic',
                style: { stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '8,4', opacity: 0.5 },
            });
        }

        // ── 4. Agentic Workflow Nodes ────────────────────────────────────────
        // Month-over-month growth
        const now = new Date();
        const thisMonthTotal = expenses
            .filter(e => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthTotal = expenses
            .filter(e => { const d = new Date(e.date); return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear(); })
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const growthPct = lastMonthTotal > 0
            ? (((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(0)
            : '0';

        // Detect anomalies (expenses > 2x average)
        const avgExpense = expenses.length > 0 ? totalAmount / expenses.length : 0;
        const anomalyCount = expenses.filter(e => Number(e.amount) > avgExpense * 2).length;

        // Agent: Budget Guardian (aligned with /analytics/safe-to-spend)
        _nodes.push({
            id: 'agent-budget',
            type: 'agent',
            data: {
                label: 'Budget Guardian',
                description: 'Monitors safe-to-spend thresholds & auto-alerts on overspend',
                metric: `₹${(thisMonthTotal / 1000).toFixed(0)}k this month`,
                icon: Wallet,
                gradient: 'from-emerald-50 to-teal-50',
                iconGradient: 'from-emerald-500 to-teal-600',
                borderColor: 'border-emerald-300',
                textColor: 'text-emerald-700',
                glowColor: 'shadow-emerald-300/40',
            },
            position: { x: 0, y: 0 },
        });

        _edges.push({
            id: 'e-total-agent-budget',
            source: 'total',
            target: 'agent-budget',
            type: 'elastic',
            style: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '6,4' },
            animated: true,
        });

        // Agent: GST Compliance (aligned with /compliance-tasks)
        _nodes.push({
            id: 'agent-gst',
            type: 'agent',
            data: {
                label: 'GST Compliance',
                description: 'Auto-tracks ITC claims, validates GST amounts & filing deadlines',
                metric: `₹${(totalGST / 1000).toFixed(1)}k GST tracked`,
                icon: Shield,
                gradient: 'from-sky-50 to-blue-50',
                iconGradient: 'from-sky-500 to-blue-600',
                borderColor: 'border-sky-300',
                textColor: 'text-sky-700',
                glowColor: 'shadow-sky-300/40',
            },
            position: { x: 0, y: 0 },
        });

        _edges.push({
            id: 'e-total-agent-gst',
            source: 'total',
            target: 'agent-gst',
            type: 'elastic',
            style: { stroke: '#0ea5e9', strokeWidth: 2, strokeDasharray: '6,4' },
            animated: true,
        });

        // Agent: Spend Trends (aligned with /analytics/cash-flow)
        _nodes.push({
            id: 'agent-trends',
            type: 'agent',
            data: {
                label: 'Spend Trends',
                description: 'Analyzes month-over-month patterns & forecasts future spend',
                metric: `${Number(growthPct) >= 0 ? '+' : ''}${growthPct}% MoM`,
                icon: TrendingDown,
                gradient: 'from-violet-50 to-purple-50',
                iconGradient: 'from-violet-500 to-purple-600',
                borderColor: 'border-violet-300',
                textColor: 'text-violet-700',
                glowColor: 'shadow-violet-300/40',
            },
            position: { x: 0, y: 0 },
        });

        // Connect insight to trends agent
        if (categories.length > 0) {
            _edges.push({
                id: 'e-insight-1-agent-trends',
                source: 'insight-1',
                target: 'agent-trends',
                type: 'elastic',
                style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '6,4' },
                animated: true,
            });
        }

        // Also connect total to trends
        _edges.push({
            id: 'e-total-agent-trends',
            source: 'total',
            target: 'agent-trends',
            type: 'elastic',
            style: { stroke: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '6,4', opacity: 0.4 },
        });

        // Agent: Anomaly Detector (aligned with /analytics/health-score)
        _nodes.push({
            id: 'agent-anomaly',
            type: 'agent',
            data: {
                label: 'Anomaly Detector',
                description: 'Flags unusual expenses, duplicate entries & spending spikes',
                metric: `${anomalyCount} flagged`,
                icon: Radar,
                gradient: 'from-amber-50 to-orange-50',
                iconGradient: 'from-amber-500 to-orange-600',
                borderColor: 'border-amber-300',
                textColor: 'text-amber-700',
                glowColor: 'shadow-amber-300/40',
            },
            position: { x: 0, y: 0 },
        });

        // Connect highest category to anomaly detector
        if (categories.length > 0) {
            _edges.push({
                id: 'e-cat-0-agent-anomaly',
                source: 'cat-0',
                target: 'agent-anomaly',
                type: 'elastic',
                style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '6,4' },
                animated: true,
            });
        }

        // ── 5. Export Node ───────────────────────────────────────────────────
        _nodes.push({
            id: 'export',
            type: 'export',
            data: { onExport },
            position: { x: 0, y: 0 },
        });

        _edges.push({
            id: 'e-total-export',
            source: 'total',
            target: 'export',
            type: 'elastic',
            style: { stroke: '#d1d5db', strokeWidth: 1.5, strokeDasharray: '4,4', opacity: 0.4 },
        });

        return getLayoutedElements(_nodes, _edges);
    }, [expenses, onExport]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    useEffect(() => {
        const layouted = getLayoutedElements(initialNodes, initialEdges);

        if (isInitialLoad) {
            setTimeout(() => {
                setNodes(layouted.nodes);
                setEdges(layouted.edges);
                setIsInitialLoad(false);
            }, 100);
        } else {
            setNodes(layouted.nodes);
            setEdges(layouted.edges);
        }
    }, [initialNodes, initialEdges, setNodes, setEdges, isInitialLoad]);

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden relative">
            {/* Legend */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-xl rounded-xl border border-gray-200 shadow-lg p-3 space-y-2">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expense Workflow</div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                    <div className="w-5 h-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded" />
                    <span className="font-medium">Category Flow</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                    <div className="w-5 h-0.5 rounded" style={{ borderTop: '2px dashed #8b5cf6' }} />
                    <span className="font-medium">AI Agent Pipeline</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                    <div className="w-5 h-0.5 rounded" style={{ borderTop: '2px dashed #a855f7' }} />
                    <span className="font-medium">Insight Link</span>
                </div>
            </div>

            {/* Stats bar */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <div className="bg-white/90 backdrop-blur-xl rounded-lg border border-gray-200 shadow-sm px-3 py-1.5 text-center">
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Total</div>
                    <div className="text-sm font-black text-gray-900">₹{(expenses.reduce((s, e) => s + Number(e.amount || 0), 0) / 1000).toFixed(0)}k</div>
                </div>
                <div className="bg-white/90 backdrop-blur-xl rounded-lg border border-violet-200 shadow-sm px-3 py-1.5 text-center">
                    <div className="text-[10px] text-violet-400 font-bold uppercase">AI Agents</div>
                    <div className="text-sm font-black text-violet-600">4</div>
                </div>
                <div className="bg-white/90 backdrop-blur-xl rounded-lg border border-emerald-200 shadow-sm px-3 py-1.5 text-center">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">Categories</div>
                    <div className="text-sm font-black text-emerald-600">{Object.keys(expenses.reduce((acc, e) => { acc[e.category || 'Other'] = true; return acc; }, {} as Record<string, boolean>)).length}</div>
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                fitViewOptions={{ padding: 0.15, duration: 800 }}
                minZoom={0.3}
                maxZoom={1.2}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                className="bg-transparent"
                proOptions={{ hideAttribution: true }}
                nodesDraggable={true}
                nodesConnectable={false}
                elementsSelectable={true}
                panOnScroll={true}
                zoomOnScroll={true}
                zoomOnDoubleClick={false}
            >
                <Background
                    color="#e5e7eb"
                    gap={40}
                    size={1.5}
                    variant={BackgroundVariant.Dots}
                    className="opacity-30"
                />
                <Controls
                    className="!bg-white/90 !backdrop-blur !rounded-xl !border !border-gray-200 !shadow-lg"
                    showInteractive={false}
                />
            </ReactFlow>

            {isInitialLoad && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none z-[2]" />
            )}
        </div>
    );
}
