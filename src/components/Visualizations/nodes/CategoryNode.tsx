import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle } from 'lucide-react';


export function CategoryNode({ data }: { data: { category: string; amount: number; total: number; isHighest: boolean } }) {
    const percentage = Math.round((data.amount / data.total) * 100) || 0;
    const pieData = [{ value: data.amount }, { value: data.total - data.amount }];

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={`relative bg-[#161a2b]/60 backdrop-blur-md rounded-2xl p-4 shadow-xl border-2 w-48 transition-all ${data.isHighest ? 'border-teal-500/40 shadow-teal-500/10' : 'border-white/[0.06] hover:border-white/[0.12]'
                }`}
        >
            {data.isHighest && (
                <div className="absolute -top-3 -right-2 bg-gradient-to-r from-teal-400 to-cyan-500 text-white text-[9px] px-2.5 py-1 rounded-full shadow-lg font-black flex items-center gap-1 z-10 tracking-widest uppercase">
                    <AlertCircle size={10} /> Peak
                </div>
            )}

            <div className="flex items-center gap-3 mb-3">
                {/* Mini Chart */}
                <div className="w-10 h-10 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                innerRadius={12}
                                outerRadius={18}
                                startAngle={90}
                                endAngle={-270}
                                stroke="none"
                            >
                                <Cell fill={data.isHighest ? "#2dd4bf" : "#818cf8"} />
                                <Cell fill="rgba(255,255,255,0.05)" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white/40">
                        {percentage}%
                    </div>
                </div>

                <div>
                    <div className="text-[13px] font-bold text-white line-clamp-1" title={data.category}>{data.category}</div>
                    <div className="text-[11px] font-black text-gray-500 tracking-tight mt-0.5">₹{data.amount.toLocaleString()}</div>
                </div>
            </div>

            <Handle type="target" position={Position.Top} className="!bg-gray-600 !w-2 !h-2 !border !border-white/10" />
            <Handle type="source" position={Position.Bottom} className="!bg-gray-600 !w-2 !h-2 !border !border-white/10" />
        </motion.div>
    );
}
