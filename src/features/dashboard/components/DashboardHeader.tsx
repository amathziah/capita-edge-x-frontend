import { RefreshCw, Download, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardHeader({
  loadDashboardData,
  exportCSV,
}: {
  loadDashboardData: () => void;
  exportCSV: () => void;
}) {
  return (
    <div className="flex items-start justify-between border-b pb-4 mb-6">
      {/* Left Side */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Management Console
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400 text-sm">
          Welcome to your invoice management dashboard
        </p>
      </div>

      {/* Right Side Controls */}
      <div className="flex items-center gap-3">
        {/* Refresh */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={loadDashboardData}
          aria-label="Refresh dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </motion.button>

        {/* Export */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={exportCSV}
          aria-label="Export dashboard CSV"
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-500 bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition"
        >
          <Download className="w-4 h-4" /> Export
        </motion.button>

        {/* Settings */}
        <motion.button
          whileHover={{ rotate: 30 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Dashboard settings"
          className="inline-flex items-center rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <Settings className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
