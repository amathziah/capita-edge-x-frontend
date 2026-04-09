import { Handle, Position } from 'reactflow';
import { Sparkles } from 'lucide-react';

export function InsightNode({ data }: { data: { label: string } }) {
    return (
        <div className="bg-[#161a2b]/80 backdrop-blur-xl rounded-xl p-3 shadow-2xl border border-violet-500/20 w-40 hover:border-violet-500/40 transition-all cursor-pointer group">
            <div className="flex items-start gap-2">
                <Sparkles size={14} className="text-violet-400 mt-0.5" />
                <div className="text-[11px] text-violet-100 font-bold leading-tight group-hover:text-white transition-colors">
                    {data.label}
                </div>
            </div>
            <Handle type="target" position={Position.Top} className="!bg-violet-500/50 !w-2 !h-2 !border !border-white/10" />
        </div>
    );
}
