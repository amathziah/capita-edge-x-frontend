import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Download,
  ArrowUpDown,
  Plus,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Edit,
  Activity,
  Shield,
  Boxes
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { dataService } from '../services/dataService';
import { useNotifications } from "../contexts/NotificationContext";
import { useData } from '../contexts/DataContext';
import { ComplianceTask } from '../types';


const priorityColors = {
  low: { bg: "bg-gray-100", text: "text-gray-600", ring: "ring-gray-200" },
  medium: { bg: "bg-blue-100", text: "text-blue-600", ring: "ring-blue-200" },
  high: { bg: "bg-orange-100", text: "text-orange-600", ring: "ring-orange-200" },
  critical: { bg: "bg-red-100", text: "text-red-600", ring: "ring-red-200" },
};

const statusConfig = {
  completed: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    icon: CheckCircle2
  },
  pending: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    icon: Clock
  },
  overdue: {
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    icon: AlertTriangle
  },
};

export function Compliance() {
  const { complianceTasks: tasks, loading, refreshData } = useData();
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "overdue">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ComplianceTask | undefined>(undefined);
  const { addNotification } = useNotifications();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Filter + Search + Sort
  const filteredTasks = useMemo(() => {
    let data = tasks as ComplianceTask[];

    if (statusFilter !== "all") {
      data = data.filter((item) => item.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.type.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    data = [...data].sort((a, b) =>
      sortAsc
        ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        : new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
    );

    return data;
  }, [tasks, statusFilter, searchQuery, sortAsc]);

  // KPI Stats
  const total = tasks.length;
  const completed = tasks.filter((i: ComplianceTask) => i.status === "completed").length;
  const pending = tasks.filter((i: ComplianceTask) => i.status === "pending").length;
  const overdue = tasks.filter((i: ComplianceTask) => i.status === "overdue").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Mark as complete
  const handleMarkComplete = async (id: string) => {
    try {
      await dataService.updateComplianceTask(id, { status: "completed" });
      refreshData(true);
      addNotification("Task marked as completed", "success");
    } catch (error) {
      console.error("Failed to update task:", error);
      addNotification("Failed to mark task as complete", "error");
    }
  };

  // Handle Edit Click
  const handleEditClick = (task: ComplianceTask) => {
    setSelectedTask(task);
    setCreateModalOpen(true);
  };

  // Delete task
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this compliance task?")) return;
    try {
      await dataService.deleteComplianceTask(id);
      refreshData(true);
      addNotification("Task deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete task:", error);
      addNotification("Failed to delete task", "error");
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["Type", "Description", "Due Date", "Status", "Priority"];
    const rows = tasks.map((i: ComplianceTask) => [i.type, i.description, i.due_date, i.status, i.priority]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "compliance_tasks.csv";
    link.click();
  };

  const handleSaveTask = async (taskData: Partial<ComplianceTask>) => {
    try {
      if (selectedTask) {
        await dataService.updateComplianceTask(selectedTask.id, {
          type: taskData.type,
          description: taskData.description,
          dueDate: taskData.due_date,
          priority: taskData.priority,
          notes: taskData.notes,
          status: taskData.status
        });
      } else {
        await dataService.saveComplianceTask({
          type: taskData.type || "",
          description: taskData.description,
          dueDate: taskData.due_date || new Date().toISOString().split('T')[0],
          priority: taskData.priority,
          notes: taskData.notes
        });
      }
      refreshData(true);
      setCreateModalOpen(false);
      setSelectedTask(undefined);
      addNotification(
        selectedTask ? "Task updated successfully" : "New compliance task created",
        "success"
      );
    } catch (error) {
      console.error("Failed to save task:", error);
      addNotification("Failed to save task", "error");
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="p-6 space-y-8 bg-gray-50 min-h-screen animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-96 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 h-24"></div>
          ))}
        </div>
        <div className="h-[400px] w-full bg-white rounded-xl border border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="relative p-6 space-y-8 min-h-screen">
      {/* Premium Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#e8f5e9_0%,_#f1f8f6_45%,_#f6fbf7_100%)]" />
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl -z-10" />
      <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-emerald-50 blur-[110px] -z-10" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">
            Compliance Monitoring
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Compliance Dashboard
          </h2>
          <p className="text-gray-600 mt-1.5">⚖️ Tracking regulatory deadlines & financial compliance tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/80 backdrop-blur rounded-xl border border-emerald-200/50 shadow-sm px-4 py-2 text-center">
            <div className="text-[10px] text-emerald-600 font-bold uppercase">Health Score</div>
            <div className="text-lg font-black text-gray-900">{completionRate}%</div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { label: 'Total Tasks', value: total, icon: Boxes, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-200/60', accent: 'text-emerald-600', delay: 0 },
          { label: 'Pending', value: pending, icon: Clock, gradient: 'from-amber-400 to-orange-500', glow: 'shadow-amber-200/60', accent: 'text-amber-600', delay: 0.04 },
          { label: 'Overdue', value: overdue, icon: AlertTriangle, gradient: 'from-rose-500 to-red-600', glow: 'shadow-rose-200/60', accent: 'text-rose-600', delay: 0.08, pulse: overdue > 0 },
          { label: 'Completed', value: completed, icon: CheckCircle2, gradient: 'from-emerald-400 to-emerald-600', glow: 'shadow-emerald-200/60', accent: 'text-emerald-600', delay: 0.12 },
          { label: 'Security', value: 'Shielded', icon: Shield, gradient: 'from-slate-700 to-slate-900', glow: 'shadow-slate-200/60', accent: 'text-slate-700', delay: 0.16 },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            whileHover={{ y: -5, scale: 1.02 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: card.delay, ease: [0.23, 1, 0.32, 1] }}
            className="relative bg-white/90 backdrop-blur-2xl p-5 rounded-3xl border border-emerald-50 shadow-sm group overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:opacity-[0.08] transition-opacity duration-700`} />
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-xl ${card.glow} group-hover:scale-110 transition-transform duration-500`}>
                <card.icon size={20} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{card.label}</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight truncate">{card.value}</h3>
                  {card.pulse && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 w-full flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search audits and tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all"
              />
            </div>
            <div className="flex gap-1.5 p-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto scrollbar-hide">
              {(["all", "pending", "overdue", "completed"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === status
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={exportCSV}
              className="p-3 bg-white text-gray-400 rounded-2xl shadow-sm border border-gray-100 hover:text-emerald-600 hover:border-emerald-600/30 hover:shadow-md transition-all duration-300"
              title="Export Report"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setSelectedTask(undefined);
                setCreateModalOpen(true);
              }}
              className="group relative px-6 py-2.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 hover:shadow-emerald-500/30 transition-all duration-400 active:scale-95 flex items-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center gap-2 text-sm font-black tracking-wide">
                <Plus className="w-4 h-4" />
                Declare Task
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden border border-emerald-100/60 flex flex-col h-[calc(100vh-360px)] min-h-[400px]"
      >
        <div className="flex-1 overflow-auto scroll-smooth">
          <table className="min-w-full text-sm text-left relative border-separate border-spacing-0">
            <thead className="bg-gray-50/50 backdrop-blur sticky top-0 z-10">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Audit Node</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Task Scope</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 cursor-pointer group" onClick={() => setSortAsc(!sortAsc)}>
                  <div className="flex items-center gap-2">
                    Maturity <ArrowUpDown className={`w-3 h-3 transition-colors ${sortAsc ? 'text-emerald-500' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Priority</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Verification</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Directives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-800">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-4 bg-emerald-50 rounded-3xl mb-4">
                        <Activity className="w-10 h-10 text-emerald-400" />
                      </div>
                      <p className="font-bold text-gray-900 text-lg">System Baseline Clear</p>
                      <p className="text-sm mt-1 max-w-[240px]">No compliance risks or tasks detected in this sector.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const priorityStyle = priorityColors[task.priority] || priorityColors.medium;
                  const statusStyle = statusConfig[task.status] || statusConfig.pending;
                  const StatusIcon = statusStyle.icon;

                  return (
                    <tr key={task.id} className="hover:bg-emerald-50/30 transition-all duration-300 group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl ${statusStyle.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-all duration-500`}>
                            <StatusIcon size={18} className={statusStyle.iconColor} strokeWidth={2} />
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-900 text-sm tracking-tight">{task.type}</div>
                            <div className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">UID: {task.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-medium text-gray-600 line-clamp-1">{task.description || "System protocol standard"}</div>
                        {task.notes && <div className="text-[10px] text-gray-400 mt-1 italic">{task.notes}</div>}
                      </td>
                      <td className="px-6 py-5">
                        <div className={`text-sm font-black ${task.status === "overdue" ? "text-rose-600" : "text-gray-900"}`}>
                          {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Deadline</div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${priorityStyle.bg} ${priorityStyle.text} border border-current opacity-70 group-hover:opacity-100 transition-opacity`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${statusStyle.bg} shadow-sm`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {task.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                          {task.status !== "completed" && (
                            <button
                              onClick={() => handleMarkComplete(task.id)}
                              className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-300"
                              title="Resolve Node"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditClick(task)}
                            className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
                            title="Edit Protocol"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-300"
                            title="Purge Task"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Compliance Task Modal */}
      <ComplianceTaskModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setSelectedTask(undefined);
        }}
        onSave={handleSaveTask}
        initialData={selectedTask}
      />
    </div>
  );
}

function ComplianceTaskModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ComplianceTask>) => void;
  initialData?: ComplianceTask;
}) {
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    due_date: new Date().toISOString().split("T")[0],
    priority: "medium" as "low" | "medium" | "high" | "critical",
    status: "pending" as "pending" | "completed" | "overdue",
    notes: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        description: initialData.description || "",
        due_date: initialData.due_date,
        priority: initialData.priority,
        status: initialData.status,
        notes: initialData.notes || "",
      });
    } else {
      setFormData({
        type: "",
        description: "",
        due_date: new Date().toISOString().split("T")[0],
        priority: "medium",
        status: "pending",
        notes: "",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 text-left font-inter">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  {initialData ? "Modify Audit Task" : "Declare Audit Node"}
                </h3>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Compliance Intelligence</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSave(formData);
            }}
            className="p-8 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Audit Type</label>
                <select
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold transition-all outline-none"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="">Select Protocol</option>
                  <option value="GST Return">GST Return</option>
                  <option value="TDS Payment">TDS Payment</option>
                  <option value="E-Way Bill">E-Way Bill</option>
                  <option value="Annual Return">Annual Return</option>
                  <option value="Tax Audit">Tax Audit</option>
                  <option value="ROC Filing">ROC Filing</option>
                  <option value="PF/ESI">PF/ESI Payment</option>
                  <option value="Other">Other Protocol</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Maturity Date</label>
                <input
                  required
                  type="date"
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold transition-all outline-none"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Task Scope</label>
              <textarea
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold transition-all outline-none min-h-[80px] resize-none"
                placeholder="Describe the regulatory requirement..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'critical'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: lvl })}
                      className={`py-2 px-1 rounded-xl text-[8px] font-black uppercase tracking-tighter border-2 transition-all ${formData.priority === lvl
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-100 text-gray-400 hover:border-emerald-200'
                        }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Node Status</label>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                  {(['pending', 'completed'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: s })}
                      className={`flex-1 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${formData.status === s
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-gray-400'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[2] px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black tracking-widest uppercase shadow-xl shadow-slate-200 hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {initialData ? "Commit Modifications" : "Initialize Audit Node"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
