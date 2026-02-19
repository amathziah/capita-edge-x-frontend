import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';

export function TotalNode({ data }: { data: { amount: number; label: string } }) {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-full p-8 shadow-xl border-4 border-violet-100 flex flex-col items-center justify-center w-48 h-48 relative group hover:border-violet-200 transition-colors"
        >
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{data.label}</div>
            <div className="text-3xl font-bold text-violet-700">₹{(data.amount / 1000).toFixed(1)}k</div>
            <div className="text-xs text-violet-400 mt-1">Total Spent</div>

            {/* Handles */}
            <Handle type="source" position={Position.Bottom} className="!bg-violet-400 !w-3 !h-3" />
            <Handle type="target" position={Position.Top} className="!bg-violet-400 !w-3 !h-3 opacity-0" />
        </motion.div>
    );
}
