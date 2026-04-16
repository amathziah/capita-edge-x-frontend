import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import {
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

  return (
    <motion.div
      variants={genCardVariants}
      initial="hidden"
      animate="visible"
      className="mt-4 mb-2 rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/8 to-black/40 p-4 shadow-lg shadow-black/20"
    >
      <motion.h4 variants={genItemVariants} className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-emerald-300">
        <CreditCard size={14} /> {data?.workspaceLabel || 'Payments Workspace'}
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

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Collected', formatMoney(summary.totalCollected), 'money'],
          ['This Month', formatMoney(summary.collectedThisMonth), 'money'],
          ['Completed', summary.completedCount, 'count'],
          ['Pending', summary.pendingCount, 'count'],
        ].map(([label, value, kind]) => (
          <motion.div key={label} variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
            <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</div>
            <div className="text-[16px] font-black text-white">
              {kind === 'count' ? formatCount(value as number | undefined | null) : value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className={`grid gap-3 ${showRecent && showPending ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
      {showRecent && (
      <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300">Recent Payments</div>
        <div className="space-y-2">
          {recentPayments.length === 0 ? (
            <div className="text-[11px] text-gray-500">No recent payments available.</div>
          ) : (
            recentPayments.slice(0, 5).map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-gray-200">{payment.reference_number || payment.method || 'Payment received'}</div>
                  <div className="uppercase text-gray-500">{payment.payment_mode || payment.method || payment.status || 'payment'}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-white">{formatMoney(payment.amount)}</div>
                  <div className="text-[10px] text-gray-500">{formatDate(payment.date)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
      )}

      {showPending && (
      <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300">Pending Items</div>
        <div className="space-y-2">
          {pendingPayments.length === 0 ? (
            <div className="text-[11px] text-gray-500">No pending payment items available.</div>
          ) : (
            pendingPayments.map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-gray-200">{payment.reference_number || payment.method || 'Pending payment'}</div>
                  <div className="uppercase text-amber-300">{payment.status || 'pending'}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-white">{formatMoney(payment.amount)}</div>
                  <div className="text-[10px] text-gray-500">{formatDate(payment.date)}</div>
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
