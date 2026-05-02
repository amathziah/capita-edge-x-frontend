import { ShieldCheck } from 'lucide-react';
import {
  AgentCard, AgentInsight, StatGrid, Section, PriorityRow, Row, Empty,
  T, fmtCount, fmtDate,
} from './workspaceShared';

const ACCENT    = '#8B5CF6';
const ACCENT_BG = '#F5F3FF';
const ACCENT_BD = '#DDD6FE';

export function AIComplianceWorkspaceCard({ data, onSelectView, onAction, isLoadingView }: {
  data: any; onSelectView?: (id: string) => void; onAction?: (a: any) => void; isLoadingView?: boolean;
}) {
  const s        = data?.summary || {};
  const sel      = data?.selectedView || 'overview';
  const guidance = data?.guidance || {};

  const showUrgent = sel === 'overview' || sel === 'urgent' || sel === 'due_this_week';
  const showRecent = sel === 'overview' || sel === 'recent';

  const primaryList  = sel === 'due_this_week' ? (data?.dueThisWeekTasks || []) : (data?.urgentTasks || []);
  const primaryLabel = sel === 'due_this_week' ? 'Due This Week' : 'Priority Queue';
  const recent       = (data?.recentTasks || []).slice(0, 5);

  const overdueCount     = Number(s.overdueCount     || 0);
  const dueThisWeekCount = Number(s.dueThisWeekCount || 0);

  const insightLevel = overdueCount > 0 ? 'critical' : dueThisWeekCount > 0 ? 'warn' : 'ok';
  const insightText  = guidance.summary
    || (overdueCount > 0
      ? `${overdueCount} compliance task${overdueCount > 1 ? 's are' : ' is'} overdue. File immediately to avoid penalties.`
      : dueThisWeekCount > 0
        ? `${dueThisWeekCount} filing${dueThisWeekCount > 1 ? 's' : ''} due this week. Stay ahead of the deadline.`
        : 'All compliance tasks are on track. Nothing overdue.');

  return (
    <AgentCard
      icon={ShieldCheck} label={data?.workspaceLabel || 'Compliance Workspace'}
      accent={ACCENT} accentBg={ACCENT_BG}
      views={data?.availableViews} selectedView={sel} onSelectView={onSelectView}
      actions={data?.actions} onAction={onAction} isLoading={isLoadingView}
    >
      <AgentInsight
        summary={insightText}
        level={insightLevel}
      />

      <StatGrid stats={[
        { label: 'Total Tasks',   value: fmtCount(s.totalTasks) },
        { label: 'Pending',       value: fmtCount(s.pendingCount) },
        { label: 'Overdue',       value: fmtCount(s.overdueCount),       accent: overdueCount > 0 ? T.danger : T.text },
        { label: 'Due This Week', value: fmtCount(s.dueThisWeekCount),   accent: dueThisWeekCount > 0 ? ACCENT : T.text },
      ]} />

      <div className={`grid gap-3 ${showUrgent && showRecent ? 'sm:grid-cols-2' : ''}`}>
        {showUrgent && (
          <Section label={primaryLabel} accent={ACCENT} bg={ACCENT_BG} borderColor={ACCENT_BD}>
            {primaryList.length === 0
              ? <Empty text="No active compliance tasks." />
              : primaryList.slice(0, 5).map((t: any) => {
                const isOverdue = t.status === 'overdue';
                return (
                  <PriorityRow
                    key={t.id}
                    primary={t.type || t.description || 'Compliance task'}
                    secondary={`${t.priority || 'medium'} priority`}
                    meta={fmtDate(t.due_date) !== '—' ? `Due ${fmtDate(t.due_date)}` : undefined}
                    badge={isOverdue ? 'Overdue' : undefined}
                    badgeBg={isOverdue ? T.dangerBg : undefined}
                  />
                );
              })
            }
          </Section>
        )}

        {showRecent && (
          <Section label="Recent Activity" accent={ACCENT}>
            {recent.length === 0
              ? <Empty text="No recent tasks." />
              : recent.map((t: any) => (
                <Row key={t.id}
                  primary={t.type || t.description || 'Compliance task'}
                  secondary={t.status}
                  sub={fmtDate(t.due_date) !== '—' ? fmtDate(t.due_date) : undefined}
                />
              ))
            }
          </Section>
        )}
      </div>
    </AgentCard>
  );
}
