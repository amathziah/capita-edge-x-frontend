import { Handle, Position } from 'reactflow';
import { Sparkles } from 'lucide-react';

export function InsightNode({ data }: { data: { label: string } }) {
    return (
        <div className="bg-gradient-to-br from-violet-50 to-white rounded-xl p-3 shadow-sm border border-violet-100 w-40 hover:shadow-md transition cursor-pointer group">
            <div className="flex items-start gap-2">
                <Sparkles size={14} className="text-violet-500 mt-0.5" />
                <div className="text-xs text-violet-800 font-medium leading-tight group-hover:text-violet-900">
                    {data.label}
                </div>
            </div>
            <Handle type="target" position={Position.Top} className="!bg-violet-200" />
        </div>
    );
}
