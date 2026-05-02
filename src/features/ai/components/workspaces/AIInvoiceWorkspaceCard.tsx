import { FileText } from 'lucide-react';
import {
  AgentCard, AgentInsight, StatGrid, Section, PriorityRow, Row, Empty,
  T, fmt, fmtCount, fmtDate, fmtDays, itemVariants,
} from './workspaceShared';
import { motion } from 'framer-motion';

const ACCENT    = '#14B8B8'; // app primary
const ACCENT_BG = '#ECF6F8';

export function AIInvoiceWorkspaceCard({ data, onSelectView, onAction, isLoadingView }: {
  data: any; onSelectView?: (id: string) => void; onAction?: (a: any) => void; isLoadingView?: boolean;
}) {
  const s       = data?.summary || {};
  const cur     = data?.currency || 'USD';
  const sel     = data?.selectedView || 'overview';
  const guidance = data?.guidance || {};

  const showOverdue = sel === 'overview' || sel === 'overdue';
  const showRecent  = sel === 'overview' || sel === 'recent';
  const showDebtors = sel === 'overview' || sel === 'debtors';

  const overdue = (data?.overdueInvoices || []).slice(0, 5);
  const recent  = (data?.recentInvoices  || []).slice(0, 4);
  const debtors = (data?.topDebtors      || []).slice(0, 4);

  // Derive agent insight level from live data
  const overdueCount  = Number(s.overdueCount  || 0);
  const overdueAmount = Number(s.overdueAmount || 0);
  const insightLevel  = overdueCount >= 3 ? 'critical' : overdueCount >= 1 ? 'warn' : 'ok';
  const insightText   = guidance.summary
    || (overdueCount > 0
      ? `${overdueCount} invoice${overdueCount > 1 ? 's are' : ' is'} overdue totalling ${fmt(overdueAmount, cur)}. Follow up with your oldest debtor first.`
      : 'All invoices are current. No overdue balances detected.');

  return (
    <AgentCard
      icon={FileText} label={data?.workspaceLabel || 'Invoice Workspace'}
      accent={ACCENT} accentBg={ACCENT_BG}
      views={data?.availableViews} selectedView={sel} onSelectView={onSelectView}
      actions={data?.actions} onAction={onAction} isLoading={isLoadingView}
    >
      {/* Agent insight */}
      <AgentInsight
        summary={insightText}
        level={insightLevel}
      />

      {/* Live stats */}
      <StatGrid stats={[
        { label: 'Tracked',     value: fmtCount(s.totalInvoices) },
        { label: 'Drafts',      value: fmtCount(s.draftCount) },
        { label: 'Outstanding', value: fmt(s.totalOutstanding, cur), accent: T.primary },
        { label: 'Overdue',     value: fmt(s.overdueAmount, cur),    accent: overdueCount > 0 ? T.danger : T.text },
      ]} />

      <div className={`grid gap-3 ${showOverdue && showRecent ? 'sm:grid-cols-2' : ''}`}>
        {/* Priority overdue queue */}
        {showOverdue && (
          <Section label="Overdue Queue" accent={T.danger} bg={T.dangerBg} borderColor={T.dangerBorder}>
            {overdue.length === 0
              ? <Empty text="No overdue invoices. Great shape!" />
              : overdue.map((inv: any) => {
                const days = Number(inv.daysOverdue || 0);
                const riskBg = days > 30 ? T.dangerBg : days > 14 ? T.warningBg : T.bg;
                const riskColor = days > 30 ? T.danger : days > 14 ? T.warning : T.muted;
                return (
                  <PriorityRow
                    key={inv.id}
                    primary={inv.buyer?.name || `Invoice #${inv.invoiceNumber}`}
                    secondary={`#${inv.invoiceNumber}`}
                    meta={days > 0 ? `${days}d overdue` : 'Overdue'}
                    amount={fmt(inv.balanceDue, cur)}
                    amountColor={riskColor}
                    badge={days > 30 ? 'Critical' : days > 14 ? 'Urgent' : undefined}
                    badgeBg={riskBg}
                  />
                );
              })
            }
            {overdue[0] && (
              <motion.div variants={itemVariants}
                className="mt-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                style={{ background: '#fecaca40', color: T.danger }}>
                Start with #{overdue[0].invoiceNumber} — longest overdue
              </motion.div>
            )}
          </Section>
        )}

        {/* Recent invoices */}
        {showRecent && (
          <Section label="Recent Invoices" accent={ACCENT}>
            {recent.length === 0
              ? <Empty text="No recent invoices." />
              : recent.map((inv: any) => (
                <Row key={inv.id}
                  primary={`#${inv.invoiceNumber}`}
                  secondary={inv.status}
                  amount={fmt(inv.total, cur)}
                  sub={fmtDate(inv.dueDate)}
                />
              ))
            }
          </Section>
        )}
      </div>

      {/* Top debtors */}
      {showDebtors && debtors.length > 0 && (
        <Section label="Top Debtors" accent={ACCENT}>
          {debtors.map((d: any) => (
            <PriorityRow
              key={d.name}
              primary={d.name}
              amount={fmt(d.balanceDue, cur)}
              amountColor={T.danger}
            />
          ))}
        </Section>
      )}
    </AgentCard>
  );
}
