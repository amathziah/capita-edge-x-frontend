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

export function AIInvoiceWorkspaceCard({
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
  const recentInvoices = data?.recentInvoices || [];
  const overdueInvoices = data?.overdueInvoices || [];
  const topDebtors = data?.topDebtors || [];
  const topOverdue = overdueInvoices[0];
  const formatMoney = createMoneyFormatter(data?.currency || 'INR');
  const selectedView = data?.selectedView || 'overview';
  const showRecent = selectedView === 'overview' || selectedView === 'recent';
  const showOverdue = selectedView === 'overview' || selectedView === 'overdue';
  const showDebtors = selectedView === 'overview' || selectedView === 'debtors';

  return (
    <motion.div
      variants={genCardVariants}
      initial="hidden"
      animate="visible"
      className="mt-4 mb-2 rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500/8 to-black/40 p-4 shadow-lg shadow-black/20"
    >
      <motion.h4 variants={genItemVariants} className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-sky-300">
        <LucideIcons.FileText size={14} /> {data?.workspaceLabel || 'Invoice Workspace'}
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
          ['Tracked', summary.totalInvoices, 'count'],
          ['Drafts', summary.draftCount, 'count'],
          ['Outstanding', formatMoney(summary.totalOutstanding), 'money'],
          ['Overdue', formatMoney(summary.overdueAmount), 'money'],
        ].map(([label, value, kind]) => (
          <motion.div key={label} variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
            <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</div>
            <div className="text-[16px] font-black text-white">
              {kind === 'count' ? formatCount(value as number | undefined | null) : value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className={`grid gap-3 ${showRecent && showOverdue ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
        {showRecent && (
        <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sky-300">Recent Invoices</div>
          <div className="space-y-2">
            {recentInvoices.length === 0 ? (
              <div className="text-[11px] text-gray-500">No recent invoices available.</div>
            ) : (
              recentInvoices.slice(0, 4).map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-200">#{invoice.invoiceNumber}</div>
                    <div className="uppercase text-gray-500">{invoice.status}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-white">{formatMoney(invoice.total)}</div>
                    <div className="text-[10px] text-gray-500">{formatDate(invoice.dueDate)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
        )}

        {showOverdue && (
        <motion.div variants={genItemVariants} className="rounded-xl border border-red-500/15 bg-red-500/5 p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-red-300">Collections Queue</div>
          <div className="space-y-2">
            {overdueInvoices.length === 0 ? (
              <div className="text-[11px] text-gray-500">No overdue invoices right now.</div>
            ) : (
              overdueInvoices.slice(0, 4).map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-200">
                      #{invoice.invoiceNumber}
                      {invoice.buyer?.name ? ` · ${invoice.buyer.name}` : ''}
                    </div>
                    <div className="uppercase text-red-300">
                      {typeof invoice.daysOverdue === 'number' && invoice.daysOverdue > 0
                        ? `${invoice.daysOverdue} days overdue`
                        : 'Overdue'}
                    </div>
                  </div>
                  <div className="shrink-0 font-mono text-white">{formatMoney(invoice.balanceDue)}</div>
                </div>
              ))
            )}
            {topOverdue && (
              <div className="mt-3 rounded-lg border border-red-500/20 bg-black/20 px-3 py-2 text-[11px] text-red-100">
                Next action: follow up on #{topOverdue.invoiceNumber}
                {topOverdue.buyer?.name ? ` for ${topOverdue.buyer.name}` : ''} first.
              </div>
            )}
          </div>
        </motion.div>
        )}
      </div>

      {showDebtors && (
      <motion.div variants={genItemVariants} className="mt-3 rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sky-300">Top Debtors</div>
        <div className="space-y-2">
          {topDebtors.length === 0 ? (
            <div className="text-[11px] text-gray-500">No debtor concentration available.</div>
          ) : (
            topDebtors.map((debtor: any) => (
              <div key={debtor.name} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="truncate font-semibold text-gray-200">{debtor.name}</div>
                <div className="shrink-0 font-mono text-white">{formatMoney(debtor.balanceDue)}</div>
              </div>
            ))
          )}
        </div>
      </motion.div>
      )}
    </motion.div>
  );
}
