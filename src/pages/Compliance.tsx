import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { FileCheck, FileText, CalendarCheck, Search, Download, ArrowUpDown, Plus, X, AlertTriangle, Clock, CheckCircle2, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { dataService } from '../services/dataService';
import { useNotifications } from "../contexts/NotificationContext";

type ComplianceTask = {
  id: string;
  type: string;
  description: string;
  due_date: string;
  status: "completed" | "pending" | "overdue";
  priority: "low" | "medium" | "high" | "critical";
  notes?: string;
};

const priorityColors = {
  low: { bg: "bg-gray-100", text: "text-gray-600", ring: "ring-gray-200" },
  medium: { bg: "bg-blue-100", text: "text-blue-600", ring: "ring-blue-200" },
  high: { bg: "bg-orange-100", text: "text-orange-600", ring: "ring-orange-200" },
  critical: { bg: "bg-red-100", text: "text-red-600", ring: "ring-red-200" },
};

const statusConfig = {
  completed: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
  pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  overdue: { bg: "bg-red-100", text: "text-red-700", icon: AlertTriangle },
};

export function Compliance() {
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "overdue">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ComplianceTask | undefined>(undefined);
  const { addNotification } = useNotifications();

  // Fetch data
  // Fetch data with silent option
  const fetchTasks = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const data = await dataService.getComplianceTasks();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch compliance tasks:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(true);
  }, []);

  // Filter + Search + Sort
  const filteredTasks = useMemo(() => {
    let data = tasks;

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
  const completed = tasks.filter((i) => i.status === "completed").length;
  const pending = tasks.filter((i) => i.status === "pending").length;
  const overdue = tasks.filter((i) => i.status === "overdue").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Mark as complete - Optimistic Update
  const handleMarkComplete = async (id: string) => {
    // 1. Optimistic UI Update
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "completed" } : t));

    try {
      // 2. Server Call
      await dataService.updateComplianceTask(id, { status: "completed" });
      // 3. Silent Refresh (optional, but good for sync)
      fetchTasks(false);
      addNotification("Task marked as completed", "success");
    } catch (error) {
      console.error("Failed to update task:", error);
      // Revert on failure
      setTasks(previousTasks);
      addNotification("Failed to mark task as complete", "error");
    }
  };

  // Handle Edit Click
  const handleEditClick = (task: ComplianceTask) => {
    setSelectedTask(task);
    setCreateModalOpen(true);
  };

  // Delete task - Optimistic Update
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    // 1. Optimistic UI Update
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      // 2. Server Call
      await dataService.deleteComplianceTask(id);
      fetchTasks(false);
      addNotification("Task deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete task:", error);
      // Revert on failure
      setTasks(previousTasks);
      addNotification("Failed to delete task", "error");
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["Type", "Description", "Due Date", "Status", "Priority"];
    const rows = tasks.map((i) => [i.type, i.description, i.due_date, i.status, i.priority]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "compliance_tasks.csv";
    link.click();
  };

  // Create or Update task
  const handleSaveTask = async (taskData: Partial<ComplianceTask>) => {
    try {
      if (selectedTask) {
        // Update
        await dataService.updateComplianceTask(selectedTask.id, {
          type: taskData.type,
          description: taskData.description,
          dueDate: taskData.due_date,
          priority: taskData.priority,
          notes: taskData.notes,
          status: taskData.status
        });
      } else {
        // Create
        await dataService.saveComplianceTask({
          type: taskData.type || "",
          description: taskData.description,
          dueDate: taskData.due_date || new Date().toISOString().split('T')[0],
          priority: taskData.priority,
          notes: taskData.notes
        });
      }
      await fetchTasks();
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

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50/50">
        <div className="relative mb-8">
          {/* Outer rotating dotted ring */}
          <div className="w-20 h-20 border-4 border-emerald-400 border-dotted rounded-full animate-spin [animation-duration:3s]"></div>

          {/* Inner pulsing glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-full opacity-10 animate-ping [animation-duration:1.5s]"></div>
          </div>

          {/* Solid center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-emerald-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h3 className="text-sm font-semibold tracking-widest text-emerald-800 uppercase">Verifying Compliance</h3>
          <div className="flex justify-center gap-1">
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-gray-900">Compliance Dashboard</h2>
        </div>
        <p className="text-sm text-gray-600">
          ⚖️ Track GST, TDS, E-Way bills, and other regulatory compliance deadlines.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-primary/20 flex flex-col items-center">
          <FileText className="w-5 h-5 text-primary mb-1" />
          <p className="text-xs font-medium text-gray-500">Total Tasks</p>
          <h3 className="text-2xl font-bold text-gray-900">{total}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-200 flex flex-col items-center">
          <Clock className="w-5 h-5 text-amber-600 mb-1" />
          <p className="text-xs font-medium text-gray-500">Pending</p>
          <h3 className="text-2xl font-bold text-amber-700">{pending}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-200 flex flex-col items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mb-1" />
          <p className="text-xs font-medium text-gray-500">Overdue</p>
          <h3 className="text-2xl font-bold text-red-700">{overdue}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-200 flex flex-col items-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-1" />
          <p className="text-xs font-medium text-gray-500">Completed</p>
          <h3 className="text-2xl font-bold text-emerald-700">{completed}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-primary/20 flex flex-col items-center">
          <CalendarCheck className="w-5 h-5 text-primary mb-1" />
          <p className="text-xs font-medium text-gray-500">Completion Rate</p>
          <h3 className="text-2xl font-bold text-primary">{completionRate}%</h3>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters + Search + Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap justify-center md:justify-start">
          {(["all", "pending", "overdue", "completed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${statusFilter === status
                ? "bg-primary text-white shadow-sm border-primary"
                : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center border rounded-lg px-3 bg-white w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedTask(undefined);
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-primary-dark transition"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col h-[calc(100vh-380px)]">
        <div className="flex-1 overflow-auto">
          <table className="min-w-full text-sm text-left relative">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Description</th>
                <th
                  className="px-6 py-3 cursor-pointer"
                  onClick={() => setSortAsc(!sortAsc)}
                >
                  <div className="flex items-center gap-1">
                    Due Date <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="px-6 py-3 text-center">Priority</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No compliance tasks found. Add one to get started.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const StatusIcon = statusConfig[task.status]?.icon || Clock;
                  const priorityStyle = priorityColors[task.priority] || priorityColors.medium;
                  const statusStyle = statusConfig[task.status] || statusConfig.pending;

                  return (
                    <tr key={task.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{task.type}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {task.description || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={task.status === "overdue" ? "text-red-600 font-medium" : ""}>
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text} ring-1 ring-inset ${priorityStyle.ring}`}
                        >
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {task.status !== "completed" && (
                            <button
                              onClick={() => handleMarkComplete(task.id)}
                              className="text-emerald-600 hover:text-emerald-800 transition"
                              title="Mark Complete"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditClick(task)}
                            className="text-blue-500 hover:text-blue-700 transition"
                            title="Edit Task"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="text-red-500 hover:text-red-700 transition"
                            title="Delete"
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
      </div>

      {/* Task Modal */}
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 text-left">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {initialData ? "Edit Compliance Task" : "Add Compliance Task"}
            </h3>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSave(formData);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Task Type *</label>
              <select
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="">Select type...</option>
                <option value="GST Return">GST Return</option>
                <option value="TDS Payment">TDS Payment</option>
                <option value="E-Way Bill">E-Way Bill</option>
                <option value="Annual Return">Annual Return</option>
                <option value="Tax Audit">Tax Audit</option>
                <option value="ROC Filing">ROC Filing</option>
                <option value="PF/ESI">PF/ESI Payment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                rows={2}
                placeholder="Additional details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  required
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {initialData && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                rows={2}
                placeholder="Internal notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition"
              >
                {initialData ? "Update Task" : "Create Task"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
