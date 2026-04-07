import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import {
  createMoneyFormatter,
  formatCount,
  genCardVariants,
  genItemVariants,
  WorkspaceActionBar,
  WorkspaceGuidancePanel,
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
  const intelligence = data?.intelligence || {};
  const formatMoney = createMoneyFormatter(data?.currency || 'INR');
  const selectedView = data?.selectedView || 'overview';

  const isDetailView = selectedView === 'detail' || !!intelligence.id;
  const showTopClients = selectedView === 'overview' || selectedView === 'top_clients';
  const showRiskAnalysis = selectedView === 'overview' || selectedView === 'risk_analysis';

  const sortedByRevenue = [...customers].sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0));
  const sortedByRisk = [...customers].sort((a, b) => (b.churn_risk_score || 0) - (a.churn_risk_score || 0));

  return (
    <motion.div
      variants={genCardVariants}
      initial="hidden"
      animate="visible"
      className="mt-4 mb-2 rounded-2xl border border-teal-400/20 bg-gradient-to-br from-teal-500/8 to-black/40 p-4 shadow-lg shadow-black/20"
    >
      <motion.h4 variants={genItemVariants} className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-teal-300">
        <LucideIcons.Users size={14} /> {data?.workspaceLabel || 'Customer Intelligence'}
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

      {isDetailView ? (
        <div className="space-y-4">
          <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h5 className="text-[14px] font-bold text-white">{intelligence.name || 'Customer Details'}</h5>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{intelligence.email || 'No email provided'}</p>
              </div>
              <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                (intelligence.churn_risk_score || 0) > 70 ? 'bg-red-500/20 text-red-300' :
                (intelligence.churn_risk_score || 0) > 30 ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-green-500/20 text-green-300'
              }`}>
                Risk: {intelligence.churn_risk_score || 0}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">Total Revenue</div>
                <div className="text-[16px] font-black text-white">{formatMoney(intelligence.total_revenue)}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">Order Count</div>
                <div className="text-[16px] font-black text-white">{formatCount(intelligence.order_count)}</div>
              </div>
            </div>

            {intelligence.predicted_next_purchase && (
              <div className="mt-4 p-3 rounded-lg bg-teal-500/5 border border-teal-500/10">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-400 mb-1">AI Prediction</div>
                <div className="text-[11px] text-teal-100 italic">
                  "Next purchase likely around **{intelligence.predicted_next_purchase}**"
                </div>
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500">Portfolio Size</div>
              <div className="text-[16px] font-black text-white">{formatCount(customers.length)}</div>
            </motion.div>
            <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500">Avg Value</div>
              <div className="text-[16px] font-black text-white">
                {formatMoney(customers.reduce((acc: number, c: any) => acc + (c.total_revenue || 0), 0) / Math.max(1, customers.length))}
              </div>
            </motion.div>
          </div>

          <div className={`grid gap-3 ${showTopClients && showRiskAnalysis ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
            {showTopClients && (
              <motion.div variants={genItemVariants} className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-teal-300">Top Revenue Clients</div>
                <div className="space-y-2">
                  {sortedByRevenue.length === 0 ? (
                    <div className="text-[11px] text-gray-500">No client data available.</div>
                  ) : (
                    sortedByRevenue.slice(0, 4).map((customer: any) => (
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

            {showRiskAnalysis && (
              <motion.div variants={genItemVariants} className="rounded-xl border border-red-500/15 bg-red-500/5 p-3">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-red-300">Retention Risk</div>
                <div className="space-y-2">
                  {sortedByRisk.filter(c => (c.churn_risk_score || 0) > 0).length === 0 ? (
                    <div className="text-[11px] text-gray-500">All client relationships are healthy.</div>
                  ) : (
                    sortedByRisk.slice(0, 4).map((customer: any) => (
                      <div key={customer.id} className="flex items-center justify-between gap-3 text-[11px]">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-gray-200">{customer.name}</div>
                          <div className={`text-[9px] font-bold uppercase ${(customer.churn_risk_score || 0) > 50 ? 'text-red-400' : 'text-yellow-400'}`}>
                            {customer.churn_risk_score}% Churn Risk
                          </div>
                        </div>
                        <div className="shrink-0 text-gray-500 text-[10px]">Score: {customer.churn_risk_score}</div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
