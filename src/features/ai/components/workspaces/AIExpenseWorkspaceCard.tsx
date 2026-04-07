import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import {
  createMoneyFormatter,
  formatCount,
  formatDate,
  genCardVariants,
  genItemVariants,
  WorkspaceActionBar,
  WorkspaceGuidancePanel,
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

  return (
    <motion.div
      variants={genCardVariants}
      initial="hidden"
      animate="visible"
      className="mt-4 mb-2 rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/8 to-black/40 p-4 shadow-lg shadow-black/20"
    >
      <motion.h4 variants={genItemVariants} className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-amber-300">
        <LucideIcons.Receipt size={14} /> {data?.workspaceLabel || 'Expenses Workspace'}
      </motion.h4>

      <WorkspaceGuidancePanel
        guidance={data?.guidance}
        onSelectStep={onSelectView}
        disabled={isLoadingView}
      />

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
          ['Total Spend', formatMoney(summary.totalSpend), 'money'],
          ['This Month', formatMoney(summary.spendThisMonth), 'money'],
          ['Expenses', summary.totalExpenses, 'count'],
          ['Avg Expense', formatMoney(summary.averageExpense), 'money'],
        ].map(([label, value, kind]) => (
          <motion.div key={label} variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
            <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</div>
            <div className="text-[16px] font-black text-white">
              {kind === 'count' ? formatCount(value as number | undefined | null) : value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className={`grid gap-3 ${showRecent && showCategories ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
        {showRecent && (
        <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-300">Recent Expenses</div>
          <div className="space-y-2">
            {recentExpenses.length === 0 ? (
              <div className="text-[11px] text-gray-500">No recent expenses available.</div>
            ) : (
              recentExpenses.slice(0, 4).map((expense: any) => (
                <div key={expense.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-200">{expense.description || expense.category || 'Expense'}</div>
                    <div className="uppercase text-gray-500">{expense.category || 'other'}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-white">{formatMoney(expense.amount)}</div>
                    <div className="text-[10px] text-gray-500">{formatDate(expense.date)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
        )}

        {showCategories && (
        <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-300">Top Categories</div>
          <div className="space-y-2">
            {topCategories.length === 0 ? (
              <div className="text-[11px] text-gray-500">No category breakdown available.</div>
            ) : (
              topCategories.map((entry: any) => (
                <div key={entry.category} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="truncate font-semibold text-gray-200">{entry.category}</div>
                  <div className="shrink-0 font-mono text-white">{formatMoney(entry.amount)}</div>
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
