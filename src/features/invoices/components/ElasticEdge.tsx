import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow';
import { motion } from 'framer-motion';

export const ElasticEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data
}: EdgeProps) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetPosition,
        targetX,
        targetY,
    });

    // Tension Logic: If data.tension is high (e.g. overdue), animate
    const isTense = data?.isOverdue;

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeOpacity: 0 }} />
            <motion.path
                id={id}
                style={style}
                d={edgePath}
                fill="none"
                className="react-flow__edge-path"
                initial={{ pathLength: 0, strokeDasharray: "10, 5" }}
                animate={{
                    pathLength: 1,
                    stroke: isTense ? '#e11d48' : '#64748b', // Rose-600 vs Slate-500
                    strokeWidth: isTense ? 3 : 1.5,
                    filter: isTense ? 'drop-shadow(0 0 3px rgba(225, 29, 72, 0.5))' : 'none',
                    // Vibration effect if tense
                    x: isTense ? [0, -1, 1, -1, 0] : 0,
                }}
                transition={{
                    duration: 1.5,
                    // Continuous jitter if tense
                    x: isTense ? { repeat: Infinity, duration: 0.2 } : {}
                }}
            />
        </>
    );
};
