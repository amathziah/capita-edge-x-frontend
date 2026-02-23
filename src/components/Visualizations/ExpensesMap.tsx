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
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

import { Expense } from '../../types';
import { TotalNode } from './nodes/TotalNode';
import { CategoryNode } from './nodes/CategoryNode';
import { InsightNode } from './nodes/InsightNode';
import { ExportNode } from './nodes/ExportNode';
import { ElasticEdge } from './ElasticEdge';
import {
} from 'lucide-react';

const nodeTypes = {
    total: TotalNode,
    category: CategoryNode,
    insight: InsightNode,
    export: ExportNode,
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
        <div className="w-full h-full rounded-2xl overflow-hidden relative bg-[#0c0f1a]">
            {/* Legend */}
            <div className="absolute top-4 left-4 z-10 bg-[#161a2b]/80 backdrop-blur-xl rounded-xl border border-white/[0.06] shadow-2xl p-3 space-y-2">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Expense Flow</div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <div className="w-5 h-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded" />
                    <span className="font-medium">Category Flow</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <div className="w-5 h-0.5 rounded" style={{ borderTop: '2px dashed #818cf8' }} />
                    <span className="font-medium">Insight Link</span>
                </div>
            </div>

            {/* Stats bar */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <div className="bg-[#161a2b]/80 backdrop-blur-xl rounded-lg border border-white/[0.06] shadow-sm px-3 py-1.5 text-center">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Total</div>
                    <div className="text-sm font-black text-white">₹{(expenses.reduce((s, e) => s + Number(e.amount || 0), 0) / 1000).toFixed(0)}k</div>
                </div>
                <div className="bg-teal-500/10 backdrop-blur-xl rounded-lg border border-teal-500/20 shadow-sm px-3 py-1.5 text-center">
                    <div className="text-[10px] text-teal-400 font-bold uppercase tracking-tight">Categories</div>
                    <div className="text-sm font-black text-teal-500">{Object.keys(expenses.reduce((acc, e) => { acc[e.category || 'Other'] = true; return acc; }, {} as Record<string, boolean>)).length}</div>
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
                    color="rgba(255, 255, 255, 0.05)"
                    gap={40}
                    size={1}
                    variant={BackgroundVariant.Dots}
                />
                <Controls
                    className="!bg-[#161a2b]/80 !backdrop-blur !rounded-xl !border !border-white/[0.06] !shadow-2xl [&_button]:!invert [&_button]:!opacity-60 hover:[&_button]:!opacity-100"
                    showInteractive={false}
                />
            </ReactFlow>

            {isInitialLoad && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none z-[2]" />
            )}
        </div>
    );
}
