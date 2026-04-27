import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import {
  AI_THEME,
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
  const accent = '#6fe4d8';
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
          style={{ background: 'rgba(111, 228, 216, 0.12)', color: accent }}
        >
          <Users size={14} />
        </span>
        {data?.workspaceLabel || 'Customers'}
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
        <motion.div variants={genItemVariants} className="rounded-2xl p-3" style={sectionStyle}>
          <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: AI_THEME.textFaint }}>Total Clients</div>
          <div className="text-[16px] font-black" style={{ color: AI_THEME.text }}>{formatCount(customers.length)}</div>
        </motion.div>
        <motion.div variants={genItemVariants} className="rounded-2xl p-3" style={sectionStyle}>
          <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: AI_THEME.textFaint }}>Avg Value</div>
          <div className="text-[16px] font-black" style={{ color: AI_THEME.text }}>{formatMoney(avgValue)}</div>
        </motion.div>
      </div>

      {showTopClients && (
        <motion.div variants={genItemVariants} className="rounded-2xl p-3" style={sectionStyle}>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: accent }}>Top Revenue Clients</div>
          <div className="space-y-2">
            {sortedByRevenue.length === 0 ? (
              <div className="text-[11px]" style={{ color: AI_THEME.textFaint }}>No client data available.</div>
            ) : (
              sortedByRevenue.slice(0, 5).map((customer: any) => (
                <div key={customer.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="min-w-0">
                    <div className="truncate font-semibold" style={{ color: AI_THEME.textBody }}>{customer.name}</div>
                    <div className="text-[9px] uppercase" style={{ color: AI_THEME.textFaint }}>{customer.order_count || 0} orders</div>
                  </div>
                  <div className="shrink-0 font-mono" style={{ color: AI_THEME.text }}>{formatMoney(customer.total_revenue)}</div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
