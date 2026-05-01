import { CreditCard } from 'lucide-react';
import {
  AgentCard, AgentInsight, StatGrid, Section, Row, Empty,
  T, fmt, fmtCount, fmtDate,
} from './workspaceShared';

const ACCENT    = '#22C55E';
const ACCENT_BG = '#ECFDF5';

export function AIPaymentWorkspaceCard({ data, onSelectView, onAction, isLoadingView }: {
  data: any; onSelectView?: (id: string) => void; onAction?: (a: any) => void; isLoadingView?: boolean;
}) {
  const s        = data?.summary || {};
  const cur      = data?.currency || 'USD';
  const sel      = data?.selectedView || 'overview';
  const guidance = data?.guidance || {};

  const showRecent  = sel === 'overview' || sel === 'recent'  || sel === 'monthly';
  const showPending = sel === 'overview' || sel === 'pending';

  const recent  = (data?.recentPayments  || []).slice(0, 5);
  const pending = (data?.pendingPayments || []).slice(0, 5);

  const monthCollected = Number(s.collectedThisMonth || 0);
  const pendingCount   = Number(s.pendingCount || 0);
  const insightLevel   = pendingCount > 3 ? 'warn' : monthCollected > 0 ? 'ok' : 'info';
  const insightText    = guidance.summary
    || (monthCollected > 0
      ? `${fmt(monthCollected, cur)} collected this month. ${pendingCount > 0 ? `${pendingCount} payment${pendingCount > 1 ? 's' : ''} still pending.` : 'No outstanding items.'}`
      : 'No payments recorded yet this month.');

  return (
    <AgentCard
      icon={CreditCard} label={data?.workspaceLabel || 'Payments Workspace'}
      accent={ACCENT} accentBg={ACCENT_BG}
      views={data?.availableViews} selectedView={sel} onSelectView={onSelectView}
      actions={data?.actions} onAction={onAction} isLoading={isLoadingView}
    >
      <AgentInsight
        summary={insightText}
        level={insightLevel}
        action={pendingCount > 0 ? { id: 'view_pending', label: 'See Pending' } : undefined}
        onAction={() => onSelectView?.('pending')}
      />

      <StatGrid stats={[
        { label: 'Total Collected', value: fmt(s.totalCollected, cur),    accent: ACCENT },
        { label: 'This Month',      value: fmt(s.collectedThisMonth, cur), accent: ACCENT },
        { label: 'Completed',       value: fmtCount(s.completedCount) },
        { label: 'Pending',         value: fmtCount(s.pendingCount),       accent: pendingCount > 0 ? T.warning : T.text },
      ]} />

      <div className={`grid gap-3 ${showRecent && showPending ? 'sm:grid-cols-2' : ''}`}>
        {showRecent && (
          <Section label="Recent Payments" accent={ACCENT} bg={ACCENT_BG} borderColor={T.successBorder}>
            {recent.length === 0
              ? <Empty text="No recent payments." />
              : recent.map((p: any) => (
                <Row key={p.id}
                  primary={p.reference_number || p.method || 'Payment'}
                  secondary={p.payment_mode || p.status || 'received'}
                  amount={fmt(p.amount, cur)}
                  sub={fmtDate(p.date)}
                  amountColor={ACCENT}
                />
              ))
            }
          </Section>
        )}

        {showPending && (
          <Section label="Pending Items" accent={T.warning} bg={T.warningBg} borderColor={T.warningBorder}>
            {pending.length === 0
              ? <Empty text="No pending items." />
              : pending.map((p: any) => (
                <Row key={p.id}
                  primary={p.reference_number || 'Pending payment'}
                  secondary={p.status || 'pending'}
                  amount={fmt(p.amount, cur)}
                  sub={fmtDate(p.date)}
                  amountColor={T.warning}
                />
              ))
            }
            {pending.length > 0 && (
              <p className="pt-1 text-[10px]" style={{ color: T.warning }}>
                Follow up to close these out.
              </p>
            )}
          </Section>
        )}
      </div>
    </AgentCard>
  );
}
