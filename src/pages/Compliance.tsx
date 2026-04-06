import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
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
import { CustomSelect } from '../components/ui/CustomSelect';

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

const auditTypeOptions = [
  { value: "GST Return", label: "GST Return", description: "Monthly or quarterly GST filing" },
  { value: "TDS Payment", label: "TDS Payment", description: "Deposit tax deducted at source" },
  { value: "E-Way Bill", label: "E-Way Bill", description: "Movement and dispatch documentation" },
  { value: "Annual Return", label: "Annual Return", description: "Year-end statutory submission" },
  { value: "Tax Audit", label: "Tax Audit", description: "Prepare and track audit deliverables" },
  { value: "ROC Filing", label: "ROC Filing", description: "Registrar of Companies filing" },
  { value: "PF/ESI", label: "PF/ESI Payment", description: "Payroll compliance payment" },
  { value: "Other", label: "Other", description: "A custom compliance work item" }
] as const;

const quickScopeHints = [
  "Attach the return period, owner, and documents needed before filing.",
  "Mention the regulator, exact due date, and what must be submitted.",
  "Capture dependencies like reconciliations, challans, or customer confirmations."
];

export function Compliance() {
  const { complianceTasks: tasks, loading, refreshData } = useData();
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "overdue">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ComplianceTask | undefined>(undefined);
  const { addNotification } = useNotifications();

  useEffect(() => {
    refreshData(['complianceTasks']);
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
  const upcoming = filteredTasks.filter((task) => {
    if (task.status !== "pending") return false;
    const diff = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000);
    return diff >= 0 && diff <= 7;
  });
  const nextDeadline = filteredTasks.find((task) => task.status !== "completed");

  // Mark as complete
  const handleMarkComplete = async (id: string) => {
    try {
      await dataService.updateComplianceTask(id, { status: "completed" });
      refreshData(['complianceTasks'], true);
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
      refreshData(['complianceTasks'], true);
      addNotification("Task deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete task:", error);
      addNotification("Failed to delete task", "error");
    }
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
      refreshData(['complianceTasks'], true);
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
      <div className="h-full min-h-0 p-4 space-y-4 bg-gray-50 animate-pulse overflow-hidden">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-96 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 h-20"></div>
          ))}
        </div>
        <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-full min-h-0 w-full max-w-[1600px] px-4 py-4 sm:px-5 lg:px-6 lg:py-5 flex flex-col gap-4 overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#e8f5e9_0%,_#f1f8f6_45%,_#f6fbf7_100%)]" />
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl -z-10" />
      <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-emerald-50 blur-[110px] -z-10" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between shrink-0"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">
            Compliance Monitoring
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-2xl lg:text-[28px] font-semibold text-gray-900 tracking-tight leading-none">
            Compliance Taskboard
          </h2>
          <p className="text-gray-600 mt-1 text-sm">Track due dates, risk, and completion status for your compliance tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="bg-white/80 backdrop-blur rounded-xl border border-emerald-200/50 shadow-sm px-4 py-2 text-center"
            title="Task completion ratio based on compliance tasks recorded in your workspace"
          >
            <div className="text-[10px] text-emerald-600 font-bold uppercase">Health Score</div>
            <div className="text-lg font-black text-gray-900">{completionRate}%</div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {[
          { label: 'Total Tasks', value: total, icon: Boxes, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-200/60', delay: 0 },
          { label: 'Pending', value: pending, icon: Clock, gradient: 'from-amber-400 to-orange-500', glow: 'shadow-amber-200/60', delay: 0.04 },
          { label: 'Overdue', value: overdue, icon: AlertTriangle, gradient: 'from-rose-500 to-red-600', glow: 'shadow-rose-200/60', delay: 0.08, pulse: overdue > 0 },
          { label: 'Due in 7 Days', value: upcoming.length, icon: Shield, gradient: 'from-slate-700 to-slate-900', glow: 'shadow-slate-200/60', delay: 0.12 },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            whileHover={{ y: -5, scale: 1.02 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: card.delay, ease: [0.23, 1, 0.32, 1] }}
            className="relative bg-white/90 backdrop-blur-2xl p-4 rounded-3xl border border-emerald-50 shadow-sm group overflow-hidden min-h-[88px]"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:opacity-[0.08] transition-opacity duration-700`} />
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-xl ${card.glow} group-hover:scale-110 transition-transform duration-500`}>
                <card.icon size={18} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{card.label}</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight truncate">{card.value}</h3>
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

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4 flex-1 min-h-0 overflow-hidden">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-emerald-100/60 p-4 flex flex-col gap-3 shrink-0">
          <div>
            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Action Queue</div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">What needs attention</h3>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-rose-600">Overdue</div>
            <div className="text-2xl font-black text-gray-900 mt-1">{overdue}</div>
            <p className="text-xs text-gray-600 mt-1">Tasks already past due and needing follow-up.</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-600">Next Deadline</div>
            <div className="text-sm font-black text-gray-900 mt-1 truncate">{nextDeadline?.type || 'No open tasks'}</div>
            <p className="text-xs text-gray-600 mt-1">
              {nextDeadline
                ? new Date(nextDeadline.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'You are currently clear.'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">Backend Scope</div>
            <p className="text-xs text-gray-600 leading-relaxed mt-1">
              This module currently manages task records with due date, status, priority, notes, and overdue normalization. It is not yet a filing engine or automated regulator sync.
            </p>
          </div>
          <div className="mt-auto flex gap-2">
            <button
              onClick={() => {
                setSelectedTask(undefined);
                setCreateModalOpen(true);
              }}
              className="group relative flex-1 px-5 py-2.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 hover:shadow-emerald-500/30 transition-all duration-400 active:scale-95 flex items-center justify-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center gap-2 text-sm font-black tracking-wide">
                <Plus className="w-4 h-4" />
                Add Task
              </div>
            </button>
          </div>
        </div>

        {/* Filters + Table */}
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
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
        </div>

      {/* Compliance Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden border border-emerald-100/60 flex flex-col flex-1 min-h-0"
      >
        <div className="flex-1 overflow-auto scroll-smooth">
          <table className="min-w-full text-sm text-left relative border-separate border-spacing-0">
            <thead className="bg-gray-50/50 backdrop-blur sticky top-0 z-10">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Task</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Category</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 cursor-pointer group" onClick={() => setSortAsc(!sortAsc)}>
                  <div className="flex items-center gap-2">
                    Due Date <ArrowUpDown className={`w-3 h-3 transition-colors ${sortAsc ? 'text-emerald-500' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Priority</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Action</th>
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
                        <p className="font-bold text-gray-900 text-lg">All clear</p>
                      <p className="text-sm mt-1 max-w-[280px]">No open compliance tasks are currently recorded for this workspace.</p>
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
      </div>
      </div>

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
          className="relative z-10 my-4 w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-emerald-50 bg-white shadow-2xl sm:my-6 sm:max-h-[calc(100vh-3rem)]"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-gray-50/95 px-5 py-5 backdrop-blur sm:px-7">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  {initialData ? "Edit Compliance Task" : "Create Compliance Task"}
                </h3>
                <p className="text-[11px] text-emerald-700 font-semibold">
                  {initialData ? "Update the filing or audit details below." : "Log a filing, audit, or statutory task with a clear owner-ready brief."}
                </p>
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
            className="space-y-6 px-5 py-5 sm:px-7 sm:py-6"
          >
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">What this should contain</div>
              <p className="mt-2 text-sm text-gray-700">
                Add the exact filing or audit type, when it is due, and the minimum scope someone needs to complete it without follow-up.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 relative z-50">
                <CustomSelect
                  label="Task Type"
                  value={formData.type}
                  onChange={(val: string) => setFormData({ ...formData, type: val })}
                  options={[...auditTypeOptions]}
                  placeholder="Select task type"
                />
                <p className="mt-2 text-xs text-gray-500">Choose the statutory activity you need to track.</p>
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Due Date</label>
                <input
                  required
                  type="date"
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold transition-all outline-none"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
                <p className="mt-2 text-xs text-gray-500">Use the actual statutory deadline, not an internal reminder date.</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Common Tasks</label>
              <div className="flex flex-wrap gap-2">
                {auditTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: option.value })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                      formData.type === option.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:text-emerald-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Task Scope</label>
              <textarea
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-semibold transition-all outline-none min-h-[80px] resize-none"
                placeholder="Describe the filing period, documents needed, reviewer, and submission outcome..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="mt-2 flex flex-col gap-1">
                {quickScopeHints.map((hint) => (
                  <p key={hint} className="text-xs text-gray-500">{hint}</p>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Notes</label>
              <textarea
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm font-medium transition-all outline-none min-h-[96px] resize-y"
                placeholder="Optional: add owner, portal reference, challan number, or blockers."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Priority</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'critical'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: lvl })}
                      className={`py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wide border-2 transition-all ${formData.priority === lvl
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
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                  {(['pending', 'completed'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: s })}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.status === s
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
                className="flex-1 rounded-2xl border border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.type.trim()}
                className="flex-[2] rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black tracking-widest uppercase text-white shadow-xl shadow-slate-200 transition-all hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {initialData ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
