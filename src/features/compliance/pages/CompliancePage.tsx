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
  Loader2,
  Trash2,
} from "lucide-react";
import { dataService } from '@/shared/services/dataService';
import { useNotifications } from '@/app/providers/NotificationContext';
import { useData } from '@/app/providers/DataContext';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { ComplianceTask } from '@/types';
import { CustomSelect } from '@/components/ui/CustomSelect';

const TASK_TYPES = [
  { value: "GST Return", label: "GST Return" },
  { value: "TDS Payment", label: "TDS Payment" },
  { value: "E-Way Bill", label: "E-Way Bill" },
  { value: "Annual Return", label: "Annual Return" },
  { value: "Tax Audit", label: "Tax Audit" },
  { value: "ROC Filing", label: "ROC Filing" },
  { value: "PF/ESI", label: "PF/ESI Payment" },
  { value: "Other", label: "Other" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-orange-50 text-orange-600",
  critical: "bg-red-50 text-red-600",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export function Compliance() {
  const { complianceTasks: tasks, loading, refreshData } = useData();
  const { addNotification } = useNotifications();
  const { confirm } = useConfirm();
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "overdue">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ComplianceTask | undefined>(undefined);

  useEffect(() => {
    refreshData(['complianceTasks']);
  }, [refreshData]);

  const filteredTasks = useMemo(() => {
    let data = tasks as ComplianceTask[];
    if (statusFilter !== "all") data = data.filter((t) => t.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((t) => t.type.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    return [...data].sort((a, b) =>
      sortAsc
        ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        : new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
    );
  }, [tasks, statusFilter, searchQuery, sortAsc]);

  const total = tasks.length;
  const completed = tasks.filter((t: ComplianceTask) => t.status === "completed").length;
  const pending = tasks.filter((t: ComplianceTask) => t.status === "pending").length;
  const overdue = tasks.filter((t: ComplianceTask) => t.status === "overdue").length;

  const handleMarkComplete = async (id: string) => {
    try {
      await dataService.updateComplianceTask(id, { status: "completed" });
      refreshData(['complianceTasks'], true);
      addNotification("Task marked as completed", "success");
    } catch {
      addNotification("Failed to update task", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete this compliance task?', confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    try {
      await dataService.deleteComplianceTask(id);
      refreshData(['complianceTasks'], true);
      addNotification("Task deleted", "success");
    } catch {
      addNotification("Failed to delete task", "error");
    }
  };

  const handleSave = async (taskData: Partial<ComplianceTask>) => {
    try {
      if (editingTask) {
        await dataService.updateComplianceTask(editingTask.id, {
          type: taskData.type,
          description: taskData.description,
          dueDate: taskData.due_date,
          priority: taskData.priority,
          notes: taskData.notes,
          status: taskData.status,
        });
      } else {
        await dataService.saveComplianceTask({
          type: taskData.type || "",
          description: taskData.description,
          dueDate: taskData.due_date || new Date().toISOString().split("T")[0],
          priority: taskData.priority,
          notes: taskData.notes,
        });
      }
      refreshData(['complianceTasks'], true);
      setModalOpen(false);
      setEditingTask(undefined);
      addNotification(editingTask ? "Task updated" : "Task created", "success");
    } catch {
      addNotification("Failed to save task", "error");
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-5 py-4 sm:py-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Compliance Tasks</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track your GST filings, TDS payments, audits, and other deadlines.</p>
          </div>
          <button
            onClick={() => { setEditingTask(undefined); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition"
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: "Total", value: total },
            { label: "Pending", value: pending },
            { label: "Overdue", value: overdue, warn: overdue > 0 },
            { label: "Completed", value: completed },
          ].map((card) => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{card.label}</p>
              <p className={`text-xl font-bold mt-1 ${card.warn ? "text-red-600" : "text-gray-900"}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Overdue alert */}
        {overdue > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-5">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">{overdue} overdue task{overdue > 1 ? "s" : ""}</p>
              <p className="text-xs text-red-600 mt-0.5">These are past their due date and need immediate attention.</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
            />
          </div>
          <div className="flex flex-wrap gap-1 p-1 bg-white rounded-lg border border-gray-200">
            {(["all", "pending", "overdue", "completed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                  statusFilter === s ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Task list */}
        {tasks.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <p className="text-gray-900 font-semibold">No tasks yet</p>
            <p className="text-gray-500 text-sm mt-1">Add a compliance task to start tracking your deadlines.</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <p className="text-gray-900 font-semibold">No matching tasks</p>
            <p className="text-gray-500 text-sm mt-1">Try changing the filter or search term.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 sm:px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Task</th>
                    <th className="hidden md:table-cell px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Description</th>
                    <th
                      className="px-4 sm:px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none"
                      onClick={() => setSortAsc(!sortAsc)}
                    >
                      <span className="flex items-center gap-1">
                        Due Date <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="hidden sm:table-cell px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase text-center">Priority</th>
                    <th className="px-4 sm:px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase text-center">Status</th>
                    <th className="px-4 sm:px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const days = daysUntil(task.due_date);
                    const dueSoon = task.status === "pending" && days >= 0 && days <= 7;
                    return (
                      <tr key={task.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                        <td className="px-4 sm:px-5 py-3 font-medium text-gray-900">{task.type}</td>
                        <td className="hidden md:table-cell px-5 py-3 text-gray-600 max-w-[200px] truncate">{task.description || "—"}</td>
                        <td className="px-4 sm:px-5 py-3">
                          <span className={task.status === "overdue" ? "text-red-600 font-semibold" : "text-gray-700"}>
                            {formatDate(task.due_date)}
                          </span>
                          {dueSoon && <span className="ml-2 text-xs text-yellow-600 font-medium whitespace-nowrap">Due soon</span>}
                        </td>
                        <td className="hidden sm:table-cell px-5 py-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 sm:px-5 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${STATUS_COLORS[task.status] || STATUS_COLORS.pending}`}>
                            {task.status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                            {task.status === "pending" && <Clock className="w-3 h-3" />}
                            {task.status === "overdue" && <AlertTriangle className="w-3 h-3" />}
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {task.status !== "completed" && (
                              <button
                                onClick={() => handleMarkComplete(task.id)}
                                className="p-1.5 text-gray-400 hover:text-green-600 rounded-md hover:bg-green-50 transition"
                                title="Mark complete"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => { setEditingTask(task); setModalOpen(true); }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(undefined); }}
        onSave={handleSave}
        initialData={editingTask}
      />
    </div>
  );
}

/* ─── Create / Edit Modal ─── */

function TaskModal({
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
  const [form, setForm] = useState({
    type: "",
    description: "",
    due_date: new Date().toISOString().split("T")[0],
    priority: "medium" as "low" | "medium" | "high" | "critical",
    status: "pending" as "pending" | "completed" | "overdue",
    notes: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        type: initialData.type,
        description: initialData.description || "",
        due_date: initialData.due_date,
        priority: initialData.priority,
        status: initialData.status,
        notes: initialData.notes || "",
      });
    } else {
      setForm({
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-bold text-gray-900">
            {initialData ? "Edit Task" : "New Compliance Task"}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-900 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSave(form); }}
          className="space-y-4 px-5 py-5"
        >
          {/* Type + Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <CustomSelect
                label="Task Type"
                value={form.type}
                onChange={(val: string) => setForm({ ...form, type: val })}
                options={[...TASK_TYPES]}
                placeholder="Select type"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Due Date</label>
              <input
                required
                type="date"
                className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 min-h-[70px] resize-none"
              placeholder="What needs to be done for this task?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Notes (optional)</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 min-h-[60px] resize-y"
              placeholder="Any extra details — challan number, portal link, etc."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Priority</label>
              <div className="flex gap-1.5">
                {(["low", "medium", "high", "critical"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setForm({ ...form, priority: lvl })}
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize border transition ${
                      form.priority === lvl
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
            {initialData && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Status</label>
                <div className="flex gap-1.5">
                  {(["pending", "completed"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize border transition ${
                        form.status === s
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!form.type.trim()}
              className="flex-[2] px-4 py-2.5 rounded-lg bg-gray-900 text-sm font-semibold text-white hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initialData ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
