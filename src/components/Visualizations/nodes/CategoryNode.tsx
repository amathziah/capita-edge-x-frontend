import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle } from 'lucide-react';

const COLORS = ["#10B981", "#E5E7EB"]; // Green vs Gray

export function CategoryNode({ data }: { data: { category: string; amount: number; total: number; isHighest: boolean } }) {
    const percentage = Math.round((data.amount / data.total) * 100) || 0;
    const pieData = [{ value: data.amount }, { value: data.total - data.amount }];

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={`relative bg-white rounded-2xl p-4 shadow-md border-2 w-48 transition-all ${data.isHighest ? 'border-emerald-400 ring-4 ring-emerald-50' : 'border-gray-100 hover:border-gray-200'
                }`}
        >
            {data.isHighest && (
                <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-full shadow-sm font-bold flex items-center gap-1 z-10">
                    <AlertCircle size={10} /> Highest
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
                                <Cell fill={data.isHighest ? "#10B981" : "#8B5CF6"} />
                                <Cell fill="#F3F4F6" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-gray-400">
                        {percentage}%
                    </div>
                </div>

                <div>
                    <div className="text-sm font-bold text-gray-800 line-clamp-1" title={data.category}>{data.category}</div>
                    <div className="text-xs font-semibold text-gray-500">₹{data.amount.toLocaleString()}</div>
                </div>
            </div>

            <Handle type="target" position={Position.Top} className="!bg-gray-300" />
            <Handle type="source" position={Position.Bottom} className="!bg-gray-300" />
        </motion.div>
    );
}
