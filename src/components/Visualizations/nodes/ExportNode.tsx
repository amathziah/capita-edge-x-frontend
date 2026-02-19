import { Handle, Position } from 'reactflow';
import { Download } from 'lucide-react';

export function ExportNode({ data }: { data: { onExport: () => void } }) {
    return (
        <button
            onClick={data.onExport}
            className="bg-gray-900 text-white rounded-xl px-4 py-2 shadow-lg flex items-center gap-2 hover:bg-black transition hover:scale-105 active:scale-95"
        >
            <Download size={14} />
            <span className="text-xs font-semibold">Export Report</span>
            <Handle type="target" position={Position.Top} className="!bg-gray-900 !opacity-0" />
        </button>
    );
}
