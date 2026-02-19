import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

interface AgentNodeData {
    label: string;
    description: string;
    metric?: string;
    icon?: React.FC<{ size?: number; className?: string }>;
    gradient: string;
    iconGradient: string;
    borderColor: string;
    textColor: string;
    glowColor: string;
}

export function AgentNode({ data }: { data: AgentNodeData }) {
    const Icon = data.icon || Bot;

    return (
        <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`relative bg-gradient-to-br ${data.gradient} rounded-2xl p-4 shadow-lg border-2 border-dashed ${data.borderColor} min-w-[190px] max-w-[200px] hover:scale-105 transition-all duration-300 cursor-pointer group`}
        >
            <Handle type="target" position={Position.Top} className="!bg-violet-400 !w-2 !h-2 !border-2 !border-white" />

            {/* AI Badge */}
            <div className="absolute -top-2.5 -right-2.5 text-[9px] font-black px-2 py-0.5 rounded-full shadow-md bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center gap-0.5 z-10">
                <Bot size={9} /> AGENT
            </div>

            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 bg-gradient-to-br ${data.iconGradient} shadow-lg ${data.glowColor}`}>
                <Icon size={16} className="text-white" />
            </div>

            {/* Label */}
            <div className={`font-bold text-sm ${data.textColor}`}>{data.label}</div>

            {/* Description */}
            <div className="text-[10px] text-gray-500 mt-1 leading-tight">
                {data.description}
            </div>

            {/* Metric */}
            {data.metric && (
                <div className={`text-[11px] mt-2 font-bold ${data.textColor} bg-white/60 backdrop-blur-sm px-2 py-0.5 rounded-md inline-block`}>
                    {data.metric}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-violet-400 !w-2 !h-2 !border-2 !border-white" />
        </motion.div>
    );
}
