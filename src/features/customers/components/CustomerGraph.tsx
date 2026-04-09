import React, { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Node,
    Edge,
    Position,
    Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Customer } from '@/types';

interface CustomerGraphProps {
    customers: Customer[];
    onCustomerSelect?: (customer: Customer) => void;
}

// Custom Nodes
const BusinessNode = () => (
    <div className="w-16 h-16 rounded-full bg-slate-900 border-4 border-slate-200 shadow-xl flex items-center justify-center relative">
        <Handle type="source" position={Position.Bottom} className="!bg-transparent" />
        <span className="text-2xl">🏢</span>
    </div>
);

const CustomerNode = ({ data }: { data: { label: string; risk: 'low' | 'medium' | 'high' } }) => {
    const colors = {
        low: 'bg-green-100 border-green-500 text-green-700',
        medium: 'bg-yellow-100 border-yellow-500 text-yellow-700',
        high: 'bg-red-100 border-red-500 text-red-700 animate-pulse',
    };

    return (
        <div className={`px-3 py-1.5 rounded-full border-2 text-xs font-bold shadow-sm whitespace-nowrap transition hover:scale-110 cursor-pointer ${colors[data.risk]}`}>
            <Handle type="target" position={Position.Top} className="!bg-transparent" />
            {data.label}
        </div>
    );
};

const nodeTypes = {
    business: BusinessNode,
    customer: CustomerNode,
};

export const CustomerGraph: React.FC<CustomerGraphProps> = ({ customers, onCustomerSelect }) => {

    const { nodes, edges } = useMemo(() => {
        const centerNode: Node = {
            id: 'business',
            type: 'business',
            position: { x: 0, y: 0 },
            data: { label: 'My Business' },
        };

        const custNodes: Node[] = [];
        const custEdges: Edge[] = [];

        // Simple layout: arrange in a circle or semi-circle
        // In a real app, use force-directed layout if possible, or dagre with custom config
        const radius = 250;
        const total = customers.length;

        customers.forEach((cust, idx) => {
            const angle = (idx / total) * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            // Mock risk logic
            const risk = idx % 5 === 0 ? 'high' : idx % 3 === 0 ? 'medium' : 'low';

            custNodes.push({
                id: cust.id,
                type: 'customer',
                position: { x, y },
                data: { label: cust.name, risk },
            });

            custEdges.push({
                id: `e-bus-${cust.id}`,
                source: 'business',
                target: cust.id,
                style: { stroke: risk === 'high' ? '#ef4444' : '#e2e8f0', strokeWidth: risk === 'high' ? 2 : 1 },
            });
        });

        return { nodes: [centerNode, ...custNodes], edges: custEdges };
    }, [customers]);

    return (
        <div className="h-[500px] w-full bg-slate-50 rounded-xl shadow-inner border border-slate-200">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                onNodeClick={(_, node) => {
                    if (node.type === 'customer' && onCustomerSelect) {
                        const customer = customers.find(c => c.id === node.id);
                        if (customer) onCustomerSelect(customer);
                    }
                }}
            >
                <Background gap={12} size={1} />
                <Controls />
            </ReactFlow>
        </div>
    );
};
