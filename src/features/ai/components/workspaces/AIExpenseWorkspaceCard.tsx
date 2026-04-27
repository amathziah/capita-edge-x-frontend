import { motion } from 'framer-motion';
import { Receipt } from 'lucide-react';
import {
  AI_THEME,
  createMoneyFormatter,
  formatCount,
  formatDate,
  genCardVariants,
  genItemVariants,
  WorkspaceActionBar,
  WorkspaceViewPills,
} from './workspaceShared';

export function AIExpenseWorkspaceCard({
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
  const recentExpenses = data?.recentExpenses || [];
  const topCategories = data?.topCategories || [];
  const formatMoney = createMoneyFormatter(data?.currency || 'INR');
  const selectedView = data?.selectedView || 'overview';
  const showRecent = selectedView === 'overview' || selectedView === 'recent' || selectedView === 'monthly';
  const showCategories = selectedView === 'overview' || selectedView === 'categories';
  const accent = '#f6c775';
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
          style={{ background: 'rgba(246, 199, 117, 0.12)', color: accent }}
        >
          <Receipt size={14} />
        </span>
        {data?.workspaceLabel || 'Expenses Workspace'}
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

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ['Total Spend', formatMoney(summary.totalSpend), 'money'],
          ['This Month', formatMoney(summary.spendThisMonth), 'money'],
          ['Expenses', summary.totalExpenses, 'count'],
          ['Avg Expense', formatMoney(summary.averageExpense), 'money'],
        ].map(([label, value, kind]) => (
          <motion.div key={label} variants={genItemVariants} className="rounded-2xl p-3" style={sectionStyle}>
            <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: AI_THEME.textFaint }}>{label}</div>
            <div className="text-[16px] font-black" style={{ color: AI_THEME.text }}>
              {kind === 'count' ? formatCount(value as number | undefined | null) : value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className={`grid gap-3 ${showRecent && showCategories ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
        {showRecent && (
        <motion.div variants={genItemVariants} className="rounded-2xl p-3" style={sectionStyle}>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: accent }}>Recent Expenses</div>
          <div className="space-y-2">
            {recentExpenses.length === 0 ? (
              <div className="text-[11px]" style={{ color: AI_THEME.textFaint }}>No recent expenses available.</div>
            ) : (
              recentExpenses.slice(0, 4).map((expense: any) => (
                <div key={expense.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="truncate font-semibold" style={{ color: AI_THEME.textBody }}>{expense.description || expense.category || 'Expense'}</div>
                    <div className="uppercase" style={{ color: AI_THEME.textFaint }}>{expense.category || 'other'}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono" style={{ color: AI_THEME.text }}>{formatMoney(expense.amount)}</div>
                    <div className="text-[10px]" style={{ color: AI_THEME.textFaint }}>{formatDate(expense.date)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
        )}

        {showCategories && (
        <motion.div variants={genItemVariants} className="rounded-2xl p-3" style={sectionStyle}>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: accent }}>Top Categories</div>
          <div className="space-y-2">
            {topCategories.length === 0 ? (
              <div className="text-[11px]" style={{ color: AI_THEME.textFaint }}>No category breakdown available.</div>
            ) : (
              topCategories.map((entry: any) => (
                <div key={entry.category} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="truncate font-semibold" style={{ color: AI_THEME.textBody }}>{entry.category}</div>
                  <div className="shrink-0 font-mono" style={{ color: AI_THEME.text }}>{formatMoney(entry.amount)}</div>
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
