import { Handle, Position } from 'reactflow';
import { Download } from 'lucide-react';

export function ExportNode({ data }: { data: { onExport: () => void } }) {
    return (
        <button
            onClick={data.onExport}
            className="bg-white/5 backdrop-blur-xl text-white border border-white/[0.08] rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-2 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all hover:scale-105 active:scale-95 group"
        >
            <Download size={14} className="text-gray-400 group-hover:text-white transition-colors" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Export Analytics</span>
            <Handle type="target" position={Position.Top} className="!bg-white/20 !opacity-0" />
        </button>
    );
}
