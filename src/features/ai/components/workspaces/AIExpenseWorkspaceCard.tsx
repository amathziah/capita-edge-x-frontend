import { Receipt } from 'lucide-react';
import {
  AgentCard, AgentInsight, StatGrid, Section, Row, Empty,
  T, fmt, fmtCount, fmtDate,
} from './workspaceShared';

const ACCENT    = '#F59E0B';
const ACCENT_BG = '#FFFBEB';

export function AIExpenseWorkspaceCard({ data, onSelectView, onAction, isLoadingView }: {
  data: any; onSelectView?: (id: string) => void; onAction?: (a: any) => void; isLoadingView?: boolean;
}) {
  const s        = data?.summary || {};
  const cur      = data?.currency || 'USD';
  const sel      = data?.selectedView || 'overview';
  const guidance = data?.guidance || {};

  const showRecent     = sel === 'overview' || sel === 'recent' || sel === 'monthly';
  const showCategories = sel === 'overview' || sel === 'categories';

  const recent     = (data?.recentExpenses || []).slice(0, 5);
  const categories = (data?.topCategories  || []).slice(0, 5);

  const spendThisMonth = Number(s.spendThisMonth || 0);
  const totalExpenses  = Number(s.totalExpenses  || 0);

  // Spot anomalies: top category consuming >60% of spend
  const topCat       = categories[0];
  const topCatAmount = Number(topCat?.amount || 0);
  const topCatShare  = spendThisMonth > 0 ? (topCatAmount / spendThisMonth) * 100 : 0;
  const hasConcentration = topCatShare > 60 && topCat;

  const insightLevel = hasConcentration ? 'warn' : spendThisMonth > 0 ? 'info' : 'ok';
  const insightText  = guidance.summary
    || (hasConcentration
      ? `${topCat.category} is ${Math.round(topCatShare)}% of your spend this month (${fmt(topCatAmount, cur)}). Check if this is expected.`
      : spendThisMonth > 0
        ? `${fmt(spendThisMonth, cur)} spent this month across ${totalExpenses} expense${totalExpenses !== 1 ? 's' : ''}.`
        : 'No expenses recorded this month.');

  return (
    <AgentCard
      icon={Receipt} label={data?.workspaceLabel || 'Expenses Workspace'}
      accent={ACCENT} accentBg={ACCENT_BG}
      views={data?.availableViews} selectedView={sel} onSelectView={onSelectView}
      actions={data?.actions} onAction={onAction} isLoading={isLoadingView}
    >
      <AgentInsight
        summary={insightText}
        level={insightLevel}
      />

      <StatGrid stats={[
        { label: 'Total Spend',  value: fmt(s.totalSpend, cur) },
        { label: 'This Month',   value: fmt(s.spendThisMonth, cur), accent: ACCENT },
        { label: 'Expenses',     value: fmtCount(s.totalExpenses) },
        { label: 'Avg Expense',  value: fmt(s.averageExpense, cur) },
      ]} />

      <div className={`grid gap-3 ${showRecent && showCategories ? 'sm:grid-cols-2' : ''}`}>
        {showRecent && (
          <Section label="Recent Expenses" accent={ACCENT} bg={ACCENT_BG} borderColor={T.warningBorder}>
            {recent.length === 0
              ? <Empty text="No recent expenses." />
              : recent.map((e: any) => (
                <Row key={e.id}
                  primary={e.description || e.category || 'Expense'}
                  secondary={e.category || 'other'}
                  amount={fmt(e.amount, cur)}
                  sub={fmtDate(e.date)}
                />
              ))
            }
          </Section>
        )}

        {showCategories && (
          <Section label="Top Categories" accent={ACCENT}>
            {categories.length === 0
              ? <Empty text="No category breakdown." />
              : categories.map((c: any, i: number) => {
                const share = spendThisMonth > 0 ? Math.round((Number(c.amount) / spendThisMonth) * 100) : 0;
                return (
                  <Row key={c.category}
                    primary={c.category}
                    secondary={share > 0 ? `${share}% of spend` : undefined}
                    amount={fmt(c.amount, cur)}
                    amountColor={i === 0 && topCatShare > 60 ? T.warning : T.text}
                  />
                );
              })
            }
          </Section>
        )}
      </div>
    </AgentCard>
  );
}
