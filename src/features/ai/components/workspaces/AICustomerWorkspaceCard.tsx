import { Users } from 'lucide-react';
import {
  AgentCard, AgentInsight, StatGrid, Section, PriorityRow, Empty,
  T, fmt, fmtCount,
} from './workspaceShared';

const ACCENT    = '#3B82F6';
const ACCENT_BG = '#EFF6FF';
const ACCENT_BD = '#BFDBFE';

export function AICustomerWorkspaceCard({ data, onSelectView, onAction, isLoadingView }: {
  data: any; onSelectView?: (id: string) => void; onAction?: (a: any) => void; isLoadingView?: boolean;
}) {
  const cur      = data?.currency || 'USD';
  const sel      = data?.selectedView || 'overview';
  const guidance = data?.guidance || {};
  const customers = Array.isArray(data?.customers) ? data.customers : [];

  const showTopClients  = sel === 'overview' || sel === 'top_clients';
  const showRiskAnalysis = sel === 'overview' || sel === 'risk_analysis';

  const sorted       = [...customers].sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0));
  const totalRevenue = customers.reduce((acc: number, c: any) => acc + (c.total_revenue || 0), 0);
  const avgValue     = customers.length > 0 ? totalRevenue / customers.length : 0;

  // Classify churn risk: clients with 0 recent orders in last period = at risk
  const atRisk = customers.filter((c: any) => Number(c.order_count || 0) === 0).length;
  const insightLevel = atRisk > 2 ? 'warn' : customers.length === 0 ? 'info' : 'ok';
  const insightText  = guidance.summary
    || (atRisk > 0
      ? `${atRisk} client${atRisk > 1 ? 's have' : ' has'} no recorded orders — potential churn risk. Re-engage them.`
      : customers.length > 0
        ? `${customers.length} active clients generating ${fmt(totalRevenue, cur)} total revenue.`
        : 'No client data available yet.');

  return (
    <AgentCard
      icon={Users} label={data?.workspaceLabel || 'Customer Intelligence'}
      accent={ACCENT} accentBg={ACCENT_BG}
      views={data?.availableViews} selectedView={sel} onSelectView={onSelectView}
      actions={data?.actions} onAction={onAction} isLoading={isLoadingView}
    >
      <AgentInsight
        summary={insightText}
        level={insightLevel}
      />

      <StatGrid stats={[
        { label: 'Total Clients', value: fmtCount(customers.length) },
        { label: 'Avg Value',     value: fmt(avgValue, cur),     accent: ACCENT },
        { label: 'Total Revenue', value: fmt(totalRevenue, cur), accent: ACCENT },
        { label: 'At Risk',       value: fmtCount(atRisk),       accent: atRisk > 0 ? T.warning : T.text },
      ]} />

      <div className={`grid gap-3 ${showTopClients && showRiskAnalysis && atRisk > 0 ? 'sm:grid-cols-2' : ''}`}>
        {showTopClients && (
          <Section label="Top Clients by Revenue" accent={ACCENT} bg={ACCENT_BG} borderColor={ACCENT_BD}>
            {sorted.length === 0
              ? <Empty text="No client data available." />
              : sorted.slice(0, 5).map((c: any, i: number) => {
                const revenueShare = totalRevenue > 0
                  ? Math.round((Number(c.total_revenue) / totalRevenue) * 100) : 0;
                return (
                  <PriorityRow
                    key={c.id}
                    primary={c.name}
                    secondary={`${c.order_count || 0} orders`}
                    meta={revenueShare > 0 ? `${revenueShare}% of revenue` : undefined}
                    amount={fmt(c.total_revenue, cur)}
                    amountColor={i === 0 ? ACCENT : T.text}
                    badge={i === 0 ? 'Top Client' : undefined}
                    badgeBg={ACCENT_BG}
                  />
                );
              })
            }
          </Section>
        )}

        {showRiskAnalysis && atRisk > 0 && (
          <Section label="Churn Risk" accent={T.warning} bg={T.warningBg} borderColor={T.warningBorder}>
            {customers
              .filter((c: any) => Number(c.order_count || 0) === 0)
              .slice(0, 4)
              .map((c: any) => (
                <PriorityRow
                  key={c.id}
                  primary={c.name}
                  secondary="No recent orders"
                  badge="At Risk"
                  badgeBg={T.warningBg}
                  amount={fmt(c.total_revenue, cur)}
                />
              ))
            }
          </Section>
        )}
      </div>
    </AgentCard>
  );
}
