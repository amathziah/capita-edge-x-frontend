import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';

export function TotalNode({ data }: { data: { amount: number; label: string } }) {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#161a2b]/80 backdrop-blur-xl rounded-full p-8 shadow-2xl border-4 border-white/[0.08] flex flex-col items-center justify-center w-48 h-48 relative group hover:border-teal-500/30 transition-all duration-300"
        >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,_rgba(20,184,166,0.1),_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative flex flex-col items-center">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">{data.label}</div>
                <div className="text-3xl font-black text-white tracking-tight">₹{(data.amount / 1000).toFixed(1)}k</div>
                <div className="text-[10px] text-teal-400 font-bold uppercase tracking-wider mt-1">Total Pipeline</div>
            </div>

            {/* Handles */}
            <Handle type="source" position={Position.Bottom} className="!bg-teal-500 !w-3 !h-3 !border-2 !border-[#0c0f1a]" />
            <Handle type="target" position={Position.Top} className="!bg-teal-500 !w-3 !h-3 opacity-0" />
        </motion.div>
    );
}
