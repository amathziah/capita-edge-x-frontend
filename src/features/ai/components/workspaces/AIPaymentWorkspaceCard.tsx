import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
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

export function AIPaymentWorkspaceCard({
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
  const recentPayments = data?.recentPayments || [];
  const pendingPayments = data?.pendingPayments || [];
  const formatMoney = createMoneyFormatter(data?.currency || 'INR');
  const selectedView = data?.selectedView || 'overview';
  const showRecent = selectedView === 'overview' || selectedView === 'recent';
  const showPending = selectedView === 'overview' || selectedView === 'pending';
  const accent = '#77f7c9';
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
          style={{ background: 'rgba(119, 247, 201, 0.12)', color: accent }}
        >
          <CreditCard size={14} />
        </span>
        {data?.workspaceLabel || 'Payments Workspace'}
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
          ['Collected', formatMoney(summary.totalCollected), 'money'],
          ['This Month', formatMoney(summary.collectedThisMonth), 'money'],
          ['Completed', summary.completedCount, 'count'],
          ['Pending', summary.pendingCount, 'count'],
        ].map(([label, value, kind]) => (
          <motion.div key={label} variants={genItemVariants} className="rounded-2xl p-3" style={sectionStyle}>
            <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: AI_THEME.textFaint }}>{label}</div>
            <div className="text-[16px] font-black" style={{ color: AI_THEME.text }}>
              {kind === 'count' ? formatCount(value as number | undefined | null) : value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className={`grid gap-3 ${showRecent && showPending ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
      {showRecent && (
      <motion.div variants={genItemVariants} className="rounded-2xl p-3" style={sectionStyle}>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: accent }}>Recent Payments</div>
        <div className="space-y-2">
          {recentPayments.length === 0 ? (
            <div className="text-[11px]" style={{ color: AI_THEME.textFaint }}>No recent payments available.</div>
          ) : (
            recentPayments.slice(0, 5).map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="min-w-0">
                  <div className="truncate font-semibold" style={{ color: AI_THEME.textBody }}>{payment.reference_number || payment.method || 'Payment received'}</div>
                  <div className="uppercase" style={{ color: AI_THEME.textFaint }}>{payment.payment_mode || payment.method || payment.status || 'payment'}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono" style={{ color: AI_THEME.text }}>{formatMoney(payment.amount)}</div>
                  <div className="text-[10px]" style={{ color: AI_THEME.textFaint }}>{formatDate(payment.date)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
      )}

      {showPending && (
      <motion.div
        variants={genItemVariants}
        className="rounded-2xl p-3"
        style={{ ...sectionStyle, border: `1px solid ${AI_THEME.warningSoft}`, background: 'rgba(80, 60, 23, 0.18)' }}
      >
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: AI_THEME.warning }}>Pending Items</div>
        <div className="space-y-2">
          {pendingPayments.length === 0 ? (
            <div className="text-[11px]" style={{ color: AI_THEME.textFaint }}>No pending payment items available.</div>
          ) : (
            pendingPayments.map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="min-w-0">
                  <div className="truncate font-semibold" style={{ color: AI_THEME.textBody }}>{payment.reference_number || payment.method || 'Pending payment'}</div>
                  <div className="uppercase" style={{ color: AI_THEME.warning }}>{payment.status || 'pending'}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono" style={{ color: AI_THEME.text }}>{formatMoney(payment.amount)}</div>
                  <div className="text-[10px]" style={{ color: AI_THEME.textFaint }}>{formatDate(payment.date)}</div>
                </div>
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
