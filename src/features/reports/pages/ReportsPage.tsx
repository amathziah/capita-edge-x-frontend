import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { dataService } from '@/shared/services/dataService';
import { useData } from '@/app/providers/DataContext';

type ReportsSnapshot = {
  trends: any[];
  cashFlow: any | null;
  stats: any | null;
};

function fmt(value: number) {
  return `₹${Math.round(value || 0).toLocaleString()}`;
}

function periodLabel(period: string) {
  if (!period) return "";
  const [year, month] = period.split("-");
  if (year && month) {
    return new Date(Number(year), Number(month) - 1, 1)
      .toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  return period;
}

export function Reports() {
  const { invoices } = useData();

  const [data, setData] = useState<ReportsSnapshot>({ trends: [], cashFlow: null, stats: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [trends, cashFlow, stats] = await Promise.all([
          dataService.getRevenueTrends("monthly"),
          dataService.getCashFlowAnalysis(),
          dataService.getDashboardStats()
        ]);
        setData({
          trends: Array.isArray(trends) ? trends : [],
          cashFlow,
          stats
        });
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows = data.trends.map((item) => ({
    ...item,
    label: periodLabel(item.period),
    revenue: Number(item.revenue || 0),
    expenses: Number(item.expenses || 0),
    profit: Number(item.revenue || 0) - Number(item.expenses || 0),
  }));

  const totalRevenue = Number(data.stats?.total_revenue || 0);
  const totalExpenses = Number(data.stats?.total_expenses || 0);
  const pending = Number(data.stats?.pending_payments || 0);
  const overdue = Number(data.stats?.overdue_revenue || 0);
  const netCashFlow = Number(data.cashFlow?.net_cash_flow || 0);
  const profit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;

  if (loading && data.trends.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-5xl px-5 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">What came in, what went out, what's pending.</p>
          </div>
          <button
            onClick={() => dataService.exportData("invoices")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <p className="text-gray-900 font-semibold">No data yet</p>
            <p className="text-gray-500 text-sm mt-1">Create invoices and record expenses to see your report.</p>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Revenue", value: fmt(totalRevenue) },
                { label: "Expenses", value: fmt(totalExpenses) },
                { label: "Profit", value: fmt(profit), sub: `${margin}% margin` },
                { label: "Cash Flow", value: fmt(netCashFlow), warn: netCashFlow < 0 },
              ].map((card) => (
                <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{card.label}</p>
                  <p className={`text-xl font-bold mt-1 ${card.warn ? 'text-red-600' : 'text-gray-900'}`}>{card.value}</p>
                  {card.sub && <p className="text-xs text-gray-400 mt-1">{card.sub}</p>}
                </div>
              ))}
            </div>

            {/* Unpaid */}
            {(pending > 0 || overdue > 0) && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Unpaid invoices</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fmt(pending)} pending{overdue > 0 ? `, ${fmt(overdue)} overdue` : ''}
                  </p>
                </div>
                {overdue > 0 && (
                  <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg">
                    Needs follow-up
                  </span>
                )}
              </div>
            )}

            {/* Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Income vs Expenses</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rows} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const r = payload[0]?.payload;
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs">
                            <p className="font-semibold text-gray-700 mb-2">{label}</p>
                            <p className="flex justify-between gap-6"><span className="text-gray-500">Income</span><span className="font-bold text-gray-900">{fmt(r?.revenue)}</span></p>
                            <p className="flex justify-between gap-6"><span className="text-gray-500">Expenses</span><span className="font-bold text-gray-900">{fmt(r?.expenses)}</span></p>
                            <p className="flex justify-between gap-6 border-t border-gray-100 pt-1.5 mt-1.5"><span className="text-gray-500">Profit</span><span className={`font-bold ${(r?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(r?.profit)}</span></p>
                          </div>
                        );
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#revFill)" dot={false} />
                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#expFill)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-5 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-green-500 rounded-full" /> Income</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-red-500 rounded-full" /> Expenses</span>
              </div>
            </div>

            {/* Month-by-month table */}
            {rows.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Monthly breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Month</th>
                        <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase text-right">Income</th>
                        <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase text-right">Expenses</th>
                        <th className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.label} className="border-b border-gray-50 last:border-0">
                          <td className="px-5 py-2.5 font-medium text-gray-900">{row.label}</td>
                          <td className="px-5 py-2.5 text-right text-gray-700">{fmt(row.revenue)}</td>
                          <td className="px-5 py-2.5 text-right text-gray-700">{fmt(row.expenses)}</td>
                          <td className={`px-5 py-2.5 text-right font-semibold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(row.profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
