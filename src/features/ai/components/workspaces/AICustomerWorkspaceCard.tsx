import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import {
  createMoneyFormatter,
  formatCount,
  genCardVariants,
  genItemVariants,
  WorkspaceActionBar,
  WorkspaceViewPills,
} from './workspaceShared';

export function AICustomerWorkspaceCard({
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
  const customers = Array.isArray(data?.customers) ? data.customers : [];
  const formatMoney = createMoneyFormatter(data?.currency || 'INR');
  const selectedView = data?.selectedView || 'overview';
  const showTopClients = selectedView === 'overview' || selectedView === 'top_clients';

  const sortedByRevenue = [...customers].sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0));
  const totalRevenue = customers.reduce((acc: number, c: any) => acc + (c.total_revenue || 0), 0);
  const avgValue = customers.length > 0 ? totalRevenue / customers.length : 0;

  return (
    <motion.div
      variants={genCardVariants}
      initial="hidden"
      animate="visible"
      className="mt-4 mb-2 rounded-2xl border border-teal-400/20 bg-gradient-to-br from-teal-500/8 to-black/40 p-4 shadow-lg shadow-black/20"
    >
      <motion.h4 variants={genItemVariants} className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-teal-300">
        <Users size={14} /> {data?.workspaceLabel || 'Customers'}
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

      <div className="mb-4 grid grid-cols-2 gap-3">
        <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
          <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500">Total Clients</div>
          <div className="text-[16px] font-black text-white">{formatCount(customers.length)}</div>
        </motion.div>
        <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
          <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500">Avg Value</div>
          <div className="text-[16px] font-black text-white">{formatMoney(avgValue)}</div>
        </motion.div>
      </div>

      {showTopClients && (
        <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-teal-300">Top Revenue Clients</div>
          <div className="space-y-2">
            {sortedByRevenue.length === 0 ? (
              <div className="text-[11px] text-gray-500">No client data available.</div>
            ) : (
              sortedByRevenue.slice(0, 5).map((customer: any) => (
                <div key={customer.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-200">{customer.name}</div>
                    <div className="text-[9px] text-gray-500 uppercase">{customer.order_count || 0} orders</div>
                  </div>
                  <div className="shrink-0 font-mono text-white">{formatMoney(customer.total_revenue)}</div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
