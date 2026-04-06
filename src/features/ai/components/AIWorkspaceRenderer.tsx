import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

const genCardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 250,
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

const genItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
};

function createMoneyFormatter(currencyCode = 'INR') {
  const currencySymbol = currencyCode === 'USD' ? '$' : '₹';
  return (value: number | undefined | null) => `${currencySymbol}${Number(value || 0).toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return 'No date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No date' : date.toLocaleDateString();
}

export function AIWorkspaceRenderer({ component, data }: { component: string; data: any }) {
  const formatMoney = createMoneyFormatter(data?.currency || 'INR');

  if (component === 'ai_domain_invoices') {
    const summary = data?.summary || {};
    const recentInvoices = data?.recentInvoices || [];
    const overdueInvoices = data?.overdueInvoices || [];

    return (
      <motion.div
        variants={genCardVariants}
        initial="hidden"
        animate="visible"
        className="mt-4 mb-2 p-4 rounded-2xl bg-gradient-to-br from-sky-500/8 to-black/40 border border-sky-400/20 shadow-lg shadow-black/20"
      >
        <motion.h4 variants={genItemVariants} className="text-[12px] font-bold text-sky-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <LucideIcons.FileText size={14} /> Invoice Workspace
        </motion.h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            ['Total', summary.totalInvoices, 'count'],
            ['Drafts', summary.draftCount, 'count'],
            ['Outstanding', formatMoney(summary.totalOutstanding), 'money'],
            ['Overdue', formatMoney(summary.overdueAmount), 'money'],
          ].map(([label, value]) => (
            <motion.div key={label} variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">{label}</div>
              <div className="text-[16px] font-black text-white">{value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
            <div className="text-[10px] text-sky-300 uppercase tracking-widest font-bold mb-2">Recent Invoices</div>
            <div className="space-y-2">
              {recentInvoices.slice(0, 4).map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-200 truncate">#{invoice.invoiceNumber}</div>
                    <div className="text-gray-500 uppercase">{invoice.status}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-white">{formatMoney(invoice.total)}</div>
                    <div className="text-[10px] text-gray-500">{formatDate(invoice.dueDate)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={genItemVariants} className="rounded-xl border border-red-500/15 bg-red-500/5 p-3">
            <div className="text-[10px] text-red-300 uppercase tracking-widest font-bold mb-2">Attention Required</div>
            <div className="space-y-2">
              {overdueInvoices.length === 0 ? (
                <div className="text-[11px] text-gray-500">No overdue invoices right now.</div>
              ) : (
                overdueInvoices.slice(0, 4).map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between gap-3 text-[11px]">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-200 truncate">#{invoice.invoiceNumber}</div>
                      <div className="text-red-300 uppercase">{invoice.daysOverdue || 0} days overdue</div>
                    </div>
                    <div className="font-mono text-white shrink-0">{formatMoney(invoice.balanceDue)}</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (component === 'ai_domain_payments') {
    const summary = data?.summary || {};
    const recentPayments = data?.recentPayments || [];

    return (
      <motion.div
        variants={genCardVariants}
        initial="hidden"
        animate="visible"
        className="mt-4 mb-2 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/8 to-black/40 border border-emerald-400/20 shadow-lg shadow-black/20"
      >
        <motion.h4 variants={genItemVariants} className="text-[12px] font-bold text-emerald-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <LucideIcons.CreditCard size={14} /> Payments Workspace
        </motion.h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            ['Collected', formatMoney(summary.totalCollected), 'money'],
            ['This Month', formatMoney(summary.collectedThisMonth), 'money'],
            ['Completed', summary.completedCount, 'count'],
            ['Pending', summary.pendingCount, 'count'],
          ].map(([label, value]) => (
            <motion.div key={label} variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">{label}</div>
              <div className="text-[16px] font-black text-white">{value}</div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
          <div className="text-[10px] text-emerald-300 uppercase tracking-widest font-bold mb-2">Recent Payments</div>
          <div className="space-y-2">
            {recentPayments.slice(0, 5).map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-200 truncate">{payment.reference_number || payment.method || 'Payment received'}</div>
                  <div className="text-gray-500 uppercase">{payment.payment_mode || payment.method || payment.status || 'payment'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-white">{formatMoney(payment.amount)}</div>
                  <div className="text-[10px] text-gray-500">{formatDate(payment.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (component === 'ai_domain_expenses') {
    const summary = data?.summary || {};
    const recentExpenses = data?.recentExpenses || [];
    const topCategories = data?.topCategories || [];

    return (
      <motion.div
        variants={genCardVariants}
        initial="hidden"
        animate="visible"
        className="mt-4 mb-2 p-4 rounded-2xl bg-gradient-to-br from-amber-500/8 to-black/40 border border-amber-400/20 shadow-lg shadow-black/20"
      >
        <motion.h4 variants={genItemVariants} className="text-[12px] font-bold text-amber-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <LucideIcons.Receipt size={14} /> Expenses Workspace
        </motion.h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            ['Total Spend', formatMoney(summary.totalSpend), 'money'],
            ['This Month', formatMoney(summary.spendThisMonth), 'money'],
            ['Expenses', summary.totalExpenses, 'count'],
            ['Avg Expense', formatMoney(summary.averageExpense), 'money'],
          ].map(([label, value]) => (
            <motion.div key={label} variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">{label}</div>
              <div className="text-[16px] font-black text-white">{value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
            <div className="text-[10px] text-amber-300 uppercase tracking-widest font-bold mb-2">Recent Expenses</div>
            <div className="space-y-2">
              {recentExpenses.slice(0, 4).map((expense: any) => (
                <div key={expense.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-200 truncate">{expense.description || expense.category || 'Expense'}</div>
                    <div className="text-gray-500 uppercase">{expense.category || 'other'}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-white">{formatMoney(expense.amount)}</div>
                    <div className="text-[10px] text-gray-500">{formatDate(expense.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
            <div className="text-[10px] text-amber-300 uppercase tracking-widest font-bold mb-2">Top Categories</div>
            <div className="space-y-2">
              {topCategories.length === 0 ? (
                <div className="text-[11px] text-gray-500">No category breakdown available.</div>
              ) : (
                topCategories.map((entry: any) => (
                  <div key={entry.category} className="flex items-center justify-between gap-3 text-[11px]">
                    <div className="font-semibold text-gray-200 truncate">{entry.category}</div>
                    <div className="font-mono text-white shrink-0">{formatMoney(entry.amount)}</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (component === 'ai_domain_compliance') {
    const summary = data?.summary || {};
    const urgentTasks = data?.urgentTasks || [];

    return (
      <motion.div
        variants={genCardVariants}
        initial="hidden"
        animate="visible"
        className="mt-4 mb-2 p-4 rounded-2xl bg-gradient-to-br from-violet-500/8 to-black/40 border border-violet-400/20 shadow-lg shadow-black/20"
      >
        <motion.h4 variants={genItemVariants} className="text-[12px] font-bold text-violet-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <LucideIcons.ShieldCheck size={14} /> Compliance Workspace
        </motion.h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            ['Total Tasks', summary.totalTasks, 'count'],
            ['Pending', summary.pendingCount, 'count'],
            ['Overdue', summary.overdueCount, 'count'],
            ['Due This Week', summary.dueThisWeekCount, 'count'],
          ].map(([label, value]) => (
            <motion.div key={label} variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">{label}</div>
              <div className="text-[16px] font-black text-white">{value}</div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
          <div className="text-[10px] text-violet-300 uppercase tracking-widest font-bold mb-2">Priority Tasks</div>
          <div className="space-y-2">
            {urgentTasks.length === 0 ? (
              <div className="text-[11px] text-gray-500">No active compliance tasks.</div>
            ) : (
              urgentTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-200 truncate">{task.type || task.description || 'Compliance task'}</div>
                    <div className="text-gray-500 uppercase">{task.priority || 'medium'} priority</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold ${task.status === 'overdue' ? 'text-red-300' : 'text-white'}`}>{task.status}</div>
                    <div className="text-[10px] text-gray-500">{formatDate(task.due_date)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return null;
}
