import React, { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Node,
    Edge,
    MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Invoice } from '../../types';
import { calculateGridPosition } from '../../utils/physics';
import { HeavyNode } from './HeavyNode';
import { ElasticEdge } from './ElasticEdge';

interface KineticMapProps {
    invoices: Invoice[];
    onInvoiceSelect?: (invoice: Invoice) => void;
}

const nodeTypes = { heavy: HeavyNode };
const edgeTypes = { elastic: ElasticEdge };

const REGIONS = [
    { label: 'Drafts', x: 0, w: 600, bg: 'bg-gray-50/30' },
    { label: 'Active Process', x: 600, w: 600, bg: 'bg-white' },
    { label: 'Attention Needed', x: 1200, w: 600, bg: 'bg-red-50/20' },
    { label: 'Completed', x: 1800, w: 600, bg: 'bg-green-50/20' }
];

export const KineticMap: React.FC<KineticMapProps> = ({ invoices, onInvoiceSelect }) => {
    const totalCashFlow = useMemo(() => invoices.reduce((sum, inv) => sum + inv.total, 0), [invoices]);

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const _nodes: Node[] = [];
        const _edges: Edge[] = [];

        // 1. Create Region Visuals (Background Nodes)
        REGIONS.forEach(r => {
            // Label Node
            _nodes.push({
                id: `region-label-${r.label}`,
                type: 'input',
                position: { x: r.x, y: 50 },
                data: { label: r.label },
                style: {
                    width: r.w,
                    borderBottom: '1px solid #CBD5E1',
                    borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0,
                    background: 'transparent',
                    fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: '#94A3B8', textAlign: 'center', pointerEvents: 'none', zIndex: 0
                },
                draggable: false
            });
        });

        // 2. Group Invoices by Status/Zone for Grid Calculation
        const invoicesByZone: Record<string, Invoice[]> = {
            'draft': [], 'sent': [], 'viewed': [], 'partially_paid': [],
            'overdue': [], 'escalated': [], 'paid': []
        };

        // Helper to simplify zone grouping
        const getZoneKey = (status: string) => {
            if (status === 'overdue' || status === 'escalated') return 'attention';
            if (status === 'paid') return 'completed';
            if (status === 'draft') return 'draft';
            return 'active';
        };

        const groupedInvoices: Record<string, Invoice[]> = { 'draft': [], 'active': [], 'attention': [], 'completed': [] };

        invoices.forEach(inv => {
            const key = getZoneKey(inv.status);
            groupedInvoices[key].push(inv);
        });

        // 3. Map Invoices to Deterministic Grid
        Object.entries(groupedInvoices).forEach(([zoneKey, zoneInvoices]) => {
            zoneInvoices.forEach((inv, index) => {
                const { x, y, tier } = calculateGridPosition(inv, index, totalCashFlow);
                const isOverdue = inv.status === 'overdue' || inv.status === 'escalated';

                _nodes.push({
                    id: inv.id,
                    type: 'heavy',
                    position: { x, y },
                    data: {
                        invoice: inv,
                        tier,
                        isOverdue,
                        onClick: onInvoiceSelect,
                    },
                    draggable: true, // Allow manual tweaks but they might reset on reload (strict grid)
                });
            });
        });

        return { nodes: _nodes, edges: _edges };
    }, [invoices, totalCashFlow, onInvoiceSelect]);

    return (
        <div className="h-full w-full bg-background rounded-2xl overflow-hidden relative shadow-inner border border-background/50">
            {/* Soft Ambient Backgrounds for Zones */}
            <div className="absolute inset-0 flex pointer-events-none">
                {REGIONS.map((r, i) => (
                    <div key={i} className={`h-full border-r border-dashed border-gray-100/50 ${r.bg}`} style={{ width: 600, flexShrink: 0 }} />
                ))}
            </div>

            <ReactFlow
                nodes={initialNodes}
                edges={initialEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                className="bg-transparent font-sans"
                minZoom={0.2}
                maxZoom={2}
                snapToGrid={true}
                snapGrid={[20, 20]}
            >
                <Background color="#E2E8F0" gap={40} size={1} className="opacity-50" />
                <Controls className="bg-white border-gray-100 text-text-muted shadow-sm rounded-lg" />
                <MiniMap
                    nodeColor={(n) => {
                        if (n.id.startsWith('region')) return 'transparent';
                        const tier = n.data?.tier;
                        if (tier === 1) return '#F43F5E'; // Red
                        if (tier === 3) return '#10B981'; // Green
                        return '#14B8B8'; // Teal
                    }}
                    style={{ background: '#F8FAFC', borderRadius: '8px', opacity: 0.8 }}
                />
            </ReactFlow>
        </div>
    );
};
