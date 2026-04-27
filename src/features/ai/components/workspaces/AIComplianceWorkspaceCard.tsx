import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import {
  AI_THEME,
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
  const accent = '#c59cf8';
  const cardStyle = {
    background: 'linear-gradient(180deg, rgba(13, 22, 30, 0.96) 0%, rgba(9, 16, 23, 0.98) 100%)',
    border: `1px solid ${AI_THEME.border}`,
    boxShadow: AI_THEME.shadow,
  };
  const sectionStyle = {
    background: AI_THEME.surfaceSoft,
    border: `1px solid ${AI_THEME.border}`,
  };

  return (
    <motion.div
      variants={genCardVariants}
      initial="hidden"
      animate="visible"
      className="mt-4 mb-2 rounded-[28px] p-4 sm:p-5"
      style={cardStyle}
    >
      <motion.h4
        variants={genItemVariants}
        className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.24em]"
        style={{ color: accent }}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(197, 156, 248, 0.12)', color: accent }}
        >
          <ShieldCheck size={14} />
        </span>
        {data?.workspaceLabel || 'Compliance Workspace'}
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
          <motion.div key={label} variants={genItemVariants} className="rounded-2xl p-3" style={sectionStyle}>
            <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: AI_THEME.textFaint }}>{label}</div>
            <div className="text-[16px] font-black" style={{ color: AI_THEME.text }}>{formatCount(value as number | undefined | null)}</div>
          </motion.div>
        ))}
      </div>

      <div className={`grid gap-3 ${showUrgent && showRecent ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
        {showUrgent && (
        <motion.div variants={genItemVariants} className="rounded-2xl p-3" style={sectionStyle}>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: accent }}>{primaryTitle}</div>
          <div className="space-y-2">
            {primaryTaskList.length === 0 ? (
              <div className="text-[11px]" style={{ color: AI_THEME.textFaint }}>No active compliance tasks.</div>
            ) : (
              primaryTaskList.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="truncate font-semibold" style={{ color: AI_THEME.textBody }}>{task.type || task.description || 'Compliance task'}</div>
                    <div className="uppercase" style={{ color: AI_THEME.textFaint }}>{task.priority || 'medium'} priority</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div
                      className="font-bold"
                      style={{ color: task.status === 'overdue' ? AI_THEME.danger : AI_THEME.text }}
                    >
                      {task.status}
                    </div>
                    <div className="text-[10px]" style={{ color: AI_THEME.textFaint }}>{formatDate(task.due_date)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
        )}

        {showRecent && (
        <motion.div variants={genItemVariants} className="rounded-2xl p-3" style={sectionStyle}>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: accent }}>Recent Tasks</div>
          <div className="space-y-2">
            {recentTasks.length === 0 ? (
              <div className="text-[11px]" style={{ color: AI_THEME.textFaint }}>No recent compliance tasks available.</div>
            ) : (
              recentTasks.slice(0, 4).map((task: any) => (
                <div key={task.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="truncate font-semibold" style={{ color: AI_THEME.textBody }}>{task.type || task.description || 'Compliance task'}</div>
                    <div className="uppercase" style={{ color: AI_THEME.textFaint }}>{task.status}</div>
                  </div>
                  <div className="shrink-0 text-right text-[10px]" style={{ color: AI_THEME.textFaint }}>
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
