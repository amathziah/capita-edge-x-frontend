import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import {
  formatCount,
  formatDate,
  genCardVariants,
  genItemVariants,
  WorkspaceActionBar,
  WorkspaceViewPills,
} from './workspaceShared';

export function AIComplianceWorkspaceCard({
  data,
  onSelectView,
  onAction,
  isLoadingView,
}: {
  data: any;
  onSelectView?: (viewId: string) => void;
  onAction?: (action: any) => void;
  isLoadingView?: boolean;
}) {
  const summary = data?.summary || {};
  const urgentTasks = data?.urgentTasks || [];
  const dueThisWeekTasks = data?.dueThisWeekTasks || [];
  const recentTasks = data?.recentTasks || [];
  const selectedView = data?.selectedView || 'overview';
  const showUrgent = selectedView === 'overview' || selectedView === 'urgent' || selectedView === 'due_this_week';
  const showRecent = selectedView === 'overview' || selectedView === 'recent';
  const primaryTaskList = selectedView === 'due_this_week' ? dueThisWeekTasks : urgentTasks;
  const primaryTitle = selectedView === 'due_this_week' ? 'Due This Week' : 'Priority Tasks';

  return (
    <motion.div
      variants={genCardVariants}
      initial="hidden"
      animate="visible"
      className="mt-4 mb-2 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/8 to-black/40 p-4 shadow-lg shadow-black/20"
    >
      <motion.h4 variants={genItemVariants} className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-violet-300">
        <ShieldCheck size={14} /> {data?.workspaceLabel || 'Compliance Workspace'}
      </motion.h4>

      <WorkspaceActionBar
        actions={data?.actions}
        onAction={onAction}
        disabled={isLoadingView}
      />

      <WorkspaceViewPills
        views={data?.availableViews}
        selectedView={selectedView}
        onSelectView={onSelectView}
        disabled={isLoadingView}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Total Tasks', summary.totalTasks, 'count'],
          ['Pending', summary.pendingCount, 'count'],
          ['Overdue', summary.overdueCount, 'count'],
          ['Due This Week', summary.dueThisWeekCount, 'count'],
        ].map(([label, value]) => (
          <motion.div key={label} variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
            <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</div>
            <div className="text-[16px] font-black text-white">{formatCount(value as number | undefined | null)}</div>
          </motion.div>
        ))}
      </div>

      <div className={`grid gap-3 ${showUrgent && showRecent ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
        {showUrgent && (
        <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-violet-300">{primaryTitle}</div>
          <div className="space-y-2">
            {primaryTaskList.length === 0 ? (
              <div className="text-[11px] text-gray-500">No active compliance tasks.</div>
            ) : (
              primaryTaskList.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-200">{task.type || task.description || 'Compliance task'}</div>
                    <div className="uppercase text-gray-500">{task.priority || 'medium'} priority</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`font-bold ${task.status === 'overdue' ? 'text-red-300' : 'text-white'}`}>{task.status}</div>
                    <div className="text-[10px] text-gray-500">{formatDate(task.due_date)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
        )}

        {showRecent && (
        <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-violet-300">Recent Tasks</div>
          <div className="space-y-2">
            {recentTasks.length === 0 ? (
              <div className="text-[11px] text-gray-500">No recent compliance tasks available.</div>
            ) : (
              recentTasks.slice(0, 4).map((task: any) => (
                <div key={task.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-200">{task.type || task.description || 'Compliance task'}</div>
                    <div className="uppercase text-gray-500">{task.status}</div>
                  </div>
                  <div className="shrink-0 text-right text-[10px] text-gray-500">
                    {formatDate(task.due_date)}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
        )}
      </div>
    </motion.div>
  );
}
