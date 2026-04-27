import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
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
  const accent = '#7dd3fc';
  const cardStyle = {
    background: '#ffffff',
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
          style={{ background: 'rgba(125, 211, 252, 0.12)', color: accent }}
        >
          <FileText size={14} />
        </span>
        {data?.workspaceLabel || 'Invoice Workspace'}
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
          ['Tracked', summary.totalInvoices, 'count'],
          ['Drafts', summary.draftCount, 'count'],
          ['Outstanding', formatMoney(summary.totalOutstanding), 'money'],
          ['Overdue', formatMoney(summary.overdueAmount), 'money'],
        ].map(([label, value, kind]) => (
          <motion.div key={label} variants={genItemVariants} className="rounded-2xl p-3" style={sectionStyle}>
            <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: AI_THEME.textFaint }}>{label}</div>
            <div className="text-[16px] font-black" style={{ color: AI_THEME.text }}>
              {kind === 'count' ? formatCount(value as number | undefined | null) : value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className={`grid gap-3 ${showRecent && showOverdue ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
        {showRecent && (
        <motion.div variants={genItemVariants} className="rounded-2xl p-3" style={sectionStyle}>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: accent }}>Recent Invoices</div>
          <div className="space-y-2">
            {recentInvoices.length === 0 ? (
              <div className="text-[11px]" style={{ color: AI_THEME.textFaint }}>No recent invoices available.</div>
            ) : (
              recentInvoices.slice(0, 4).map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="truncate font-semibold" style={{ color: AI_THEME.textBody }}>#{invoice.invoiceNumber}</div>
                    <div className="uppercase" style={{ color: AI_THEME.textFaint }}>{invoice.status}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono" style={{ color: AI_THEME.text }}>{formatMoney(invoice.total)}</div>
                    <div className="text-[10px]" style={{ color: AI_THEME.textFaint }}>{formatDate(invoice.dueDate)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
        )}

        {showOverdue && (
        <motion.div
          variants={genItemVariants}
          className="rounded-2xl p-3"
          style={{ ...sectionStyle, border: `1px solid ${AI_THEME.dangerSoft}`, background: 'rgba(88, 24, 25, 0.18)' }}
        >
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: AI_THEME.danger }}>Collections Queue</div>
          <div className="space-y-2">
            {overdueInvoices.length === 0 ? (
              <div className="text-[11px]" style={{ color: AI_THEME.textFaint }}>No overdue invoices right now.</div>
            ) : (
              overdueInvoices.slice(0, 4).map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="truncate font-semibold" style={{ color: AI_THEME.textBody }}>
                      #{invoice.invoiceNumber}
                      {invoice.buyer?.name ? ` · ${invoice.buyer.name}` : ''}
                    </div>
                    <div className="uppercase" style={{ color: AI_THEME.danger }}>
                      {typeof invoice.daysOverdue === 'number' && invoice.daysOverdue > 0
                        ? `${invoice.daysOverdue} days overdue`
                        : 'Overdue'}
                    </div>
                  </div>
                  <div className="shrink-0 font-mono" style={{ color: AI_THEME.text }}>{formatMoney(invoice.balanceDue)}</div>
                </div>
              ))
            )}
            {topOverdue && (
              <div
                className="mt-3 rounded-xl px-3 py-2 text-[11px]"
                style={{ border: `1px solid #fecaca`, background: '#fef2f2', color: '#dc2626' }}
              >
                Next action: follow up on #{topOverdue.invoiceNumber}
                {topOverdue.buyer?.name ? ` for ${topOverdue.buyer.name}` : ''} first.
              </div>
            )}
          </div>
        </motion.div>
        )}
      </div>

      {showDebtors && (
      <motion.div variants={genItemVariants} className="mt-3 rounded-2xl p-3" style={sectionStyle}>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: accent }}>Top Debtors</div>
        <div className="space-y-2">
          {topDebtors.length === 0 ? (
            <div className="text-[11px]" style={{ color: AI_THEME.textFaint }}>No debtor concentration available.</div>
          ) : (
            topDebtors.map((debtor: any) => (
              <div key={debtor.name} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="truncate font-semibold" style={{ color: AI_THEME.textBody }}>{debtor.name}</div>
                <div className="shrink-0 font-mono" style={{ color: AI_THEME.text }}>{formatMoney(debtor.balanceDue)}</div>
              </div>
            ))
          )}
        </div>
      </motion.div>
      )}
    </motion.div>
  );
}
