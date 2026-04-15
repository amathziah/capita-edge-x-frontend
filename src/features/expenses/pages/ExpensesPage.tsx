import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, DollarSign, Tag, Loader2, X, Calendar, Receipt, Trash2, Edit2, Grid, Map as MapIcon, Shield } from "lucide-react";
import { motion } from 'framer-motion';
import { dataService } from '@/shared/services/dataService';
import { Expense } from '@/types';
import { ExpensesMap } from '@/features/expenses/components/ExpensesMap';
import { useData } from "@/app/providers/DataContext";
import { CustomSelect } from '@/components/ui/CustomSelect';

const CATEGORIES = ["Travel", "Meals", "Supplies", "Utilities", "Marketing", "Rent", "Salary", "Other"];

export function Expenses() {
  const { expenses, loading, refreshData } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [expenseForm, setExpenseForm] = useState({
    id: '',
    description: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    gstAmount: ''
  });
  const [savingExpense, setSavingExpense] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  useEffect(() => {
    refreshData(['expenses']);
  }, [refreshData]);

  const dynCategories = useMemo(() => {
    const cats = new Set(CATEGORIES);
    expenses.forEach(e => {
        if (e.category) cats.add(e.category);
    });
    return Array.from(cats);
  }, [expenses]);


  const handleCreateOrUpdateExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      alert("Description and amount are required");
      return;
    }

    try {
      setSavingExpense(true);

      const finalCategory = isCustomCategory ? customCategoryName.trim() || 'Other' : expenseForm.category || 'Other';

      await dataService.saveExpense({
        id: expenseForm.id || '',
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        category: finalCategory,
        date: expenseForm.date,
        gstAmount: expenseForm.gstAmount ? Number(expenseForm.gstAmount) : 0,
        createdAt: new Date().toISOString()
      });

      // Reset form and close modal
      setExpenseForm({
        id: '',
        description: '',
        amount: '',
        category: 'Other',
        date: new Date().toISOString().split('T')[0],
        gstAmount: ''
      });
      setIsCustomCategory(false);
      setCustomCategoryName('');
      setShowModal(false);

      // Refresh expenses list
      refreshData(['expenses'], true);
    } catch (error) {
      console.error("Failed to save expense", error);
      alert("Failed to save expense. Please try again.");
    } finally {
      setSavingExpense(false);
    }
  };

  const handleEditExpense = (e: React.MouseEvent, expense: Expense) => {
    e.stopPropagation();
    setExpenseForm({
      id: expense.id,
      description: expense.description,
      amount: expense.amount.toString(),
      category: dynCategories.includes(expense.category || 'Other') ? (expense.category || 'Other') : 'CUSTOM_NEW',
      date: new Date(expense.date).toISOString().split('T')[0],
      gstAmount: expense.gstAmount ? expense.gstAmount.toString() : ''
    });
    if (!dynCategories.includes(expense.category || 'Other') && expense.category) {
      setIsCustomCategory(true);
      setCustomCategoryName(expense.category);
    } else {
      setIsCustomCategory(false);
      setCustomCategoryName('');
    }
    setShowModal(true);
  };

  const handleDeleteExpense = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      await dataService.deleteExpense(deleteId); // Reverted to original logic for Expenses.tsx
      refreshData(['expenses'], true); // Reverted to original logic for Expenses.tsx
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete expense", error);
      alert("Failed to delete expense. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Computed values
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => filterCategory === "All" || e.category === filterCategory)
      .filter(e => searchTerm === "" || e.description.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [expenses, filterCategory, searchTerm]);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    const now = new Date();
    const thisMonth = expenses.filter(e => {
      const expDate = new Date(e.date);
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + e.amount, 0);

    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      thisMonth,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null
    };
  }, [expenses]);

  const categoryThemes: Record<string, { gradient: string; glow: string; accent: string; bg: string; border: string; ring: string; iconBg: string }> = {
    Travel: { gradient: 'from-teal-500 to-cyan-500', glow: 'shadow-teal-500/20', accent: 'text-teal-600', bg: 'from-teal-50/60 via-white to-cyan-50/30', border: 'border-teal-200/60', ring: 'bg-teal-500', iconBg: 'from-teal-500 to-cyan-500' },
    Meals: { gradient: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/20', accent: 'text-amber-600', bg: 'from-amber-50/60 via-white to-orange-50/30', border: 'border-amber-200/60', ring: 'bg-amber-500', iconBg: 'from-amber-500 to-orange-500' },
    Supplies: { gradient: 'from-indigo-500 to-violet-500', glow: 'shadow-indigo-500/20', accent: 'text-indigo-600', bg: 'from-indigo-50/60 via-white to-violet-50/30', border: 'border-indigo-200/60', ring: 'bg-indigo-500', iconBg: 'from-indigo-500 to-violet-500' },
    Utilities: { gradient: 'from-sky-500 to-blue-500', glow: 'shadow-sky-500/20', accent: 'text-sky-600', bg: 'from-sky-50/60 via-white to-blue-50/30', border: 'border-sky-200/60', ring: 'bg-sky-500', iconBg: 'from-sky-500 to-blue-500' },
    Marketing: { gradient: 'from-pink-500 to-rose-500', glow: 'shadow-pink-500/20', accent: 'text-pink-600', bg: 'from-pink-50/60 via-white to-rose-50/30', border: 'border-pink-200/60', ring: 'bg-pink-500', iconBg: 'from-pink-500 to-rose-500' },
    Rent: { gradient: 'from-blue-500 to-indigo-500', glow: 'shadow-blue-500/20', accent: 'text-blue-600', bg: 'from-blue-50/60 via-white to-indigo-50/30', border: 'border-blue-200/60', ring: 'bg-blue-500', iconBg: 'from-blue-500 to-indigo-500' },
    Salary: { gradient: 'from-emerald-500 to-teal-500', glow: 'shadow-emerald-500/20', accent: 'text-emerald-600', bg: 'from-emerald-50/60 via-white to-teal-50/30', border: 'border-emerald-200/60', ring: 'bg-emerald-500', iconBg: 'from-emerald-500 to-teal-500' },
    Other: { gradient: 'from-gray-400 to-slate-500', glow: 'shadow-gray-400/20', accent: 'text-gray-600', bg: 'from-gray-50/60 via-white to-slate-50/30', border: 'border-gray-200/60', ring: 'bg-gray-400', iconBg: 'from-gray-400 to-slate-500' },
  };

  const getRelativeDate = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading && expenses.length === 0) {
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
          <h3 className="text-sm font-semibold tracking-widest text-emerald-800 uppercase">Analyzing Expense Reports</h3>
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
    <div className="p-4 lg:p-8 min-h-screen bg-transparent space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main flex items-center gap-3">
            <DollarSign className="w-6 h-6" style={{ color: '#14b8b8' }} />
            Expenses
          </h2>
          <p className="text-sm text-text-muted mt-1">Track and manage your business expenses.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black transition shadow-xl shadow-slate-900/10"
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          {
            label: 'Total Expenses',
            value: `₹${stats.total.toLocaleString()}`,
            sub: 'All time',
            icon: DollarSign,
            gradient: 'from-teal-500 to-cyan-500',
            glow: 'shadow-teal-500/25',
            accent: 'text-teal-600',
            bg: 'from-teal-50/60 via-white to-cyan-50/40',
            borderColor: 'border-teal-200/60',
            ring: 'bg-teal-500',
            delay: 0,
          },
          {
            label: 'This Month',
            value: `₹${stats.thisMonth.toLocaleString()}`,
            sub: new Date().toLocaleString('default', { month: 'long' }),
            icon: Calendar,
            gradient: 'from-violet-500 to-purple-500',
            glow: 'shadow-violet-500/25',
            accent: 'text-violet-600',
            bg: 'from-violet-50/60 via-white to-purple-50/40',
            borderColor: 'border-violet-200/60',
            ring: 'bg-violet-500',
            delay: 0.05,
          },
          {
            label: 'Top Category',
            value: stats.topCategory ? stats.topCategory.name : 'N/A',
            sub: stats.topCategory ? `₹${stats.topCategory.amount.toLocaleString()}` : 'No expenses yet',
            icon: Tag,
            gradient: 'from-amber-500 to-orange-500',
            glow: 'shadow-amber-500/25',
            accent: 'text-amber-600',
            bg: 'from-amber-50/60 via-white to-orange-50/40',
            borderColor: 'border-amber-200/60',
            ring: 'bg-amber-500',
            delay: 0.1,
          },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.05 + card.delay, ease: [0.23, 1, 0.32, 1] }}
            className={`relative bg-gradient-to-br ${card.bg} backdrop-blur-xl p-5 rounded-2xl border ${card.borderColor} shadow-sm hover:shadow-lg ${card.glow} hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group overflow-hidden cursor-default`}
          >
            {/* Glow orbs */}
            <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-[0.07] rounded-full blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500`} />
            <div className={`absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-tr ${card.gradient} opacity-[0.05] rounded-full blur-2xl`} />
            {/* Shimmer */}
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />

            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 bg-gradient-to-br ${card.gradient} text-white rounded-xl shadow-lg ${card.glow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <card.icon size={18} strokeWidth={2.2} />
                </div>
              </div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-1">{card.label}</p>
              <h3 className="text-[28px] font-extrabold text-gray-900 tracking-tight leading-none">{card.value}</h3>
              <p className={`text-xs ${card.accent} mt-2 font-semibold flex items-center gap-1.5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${card.ring}`} />
                {card.sub}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View Toggle & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'grid' ? 'text-white' : 'text-text-muted hover:bg-gray-50'
              }`}
            style={viewMode === 'grid' ? { backgroundColor: '#14b8b8' } : {}}
          >
            <Grid className="w-4 h-4" />
            Grid
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'map' ? 'text-white' : 'text-text-muted hover:bg-gray-50'
              }`}
            style={viewMode === 'map' ? { backgroundColor: '#14b8b8' } : {}}
          >
            <MapIcon className="w-4 h-4" />
            Map
          </button>
        </div>

        {viewMode === 'grid' && (
          <>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search expenses..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm transition"
              />
            </div>

            <div className="w-full sm:w-auto min-w-[160px] z-10">
              <CustomSelect
                value={filterCategory}
                onChange={(val) => setFilterCategory(val)}
                options={[
                  { value: 'All', label: 'All Categories' },
                  ...dynCategories.map(cat => ({ value: cat, label: cat }))
                ]}
              />
            </div>

            <div className="px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-sm text-text-muted font-medium whitespace-nowrap">
              {filteredExpenses.length} {filteredExpenses.length === 1 ? 'expense' : 'expenses'}
            </div>
          </>
        )}
      </div>

      {/* Content Area */}
      {viewMode === 'map' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Spend by Category</h3>
            <span className="text-xs text-gray-400">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
          </div>
          <ExpensesMap expenses={expenses} />
        </motion.div>
      ) : (
        <>
          {/* Expenses Grid */}
          {filteredExpenses.length === 0 && expenses.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-card">
              <div className="bg-gray-50 p-4 rounded-full inline-flex mb-4">
                <DollarSign className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-text-main">No expenses yet</h3>
              <p className="text-text-muted mt-2">Add your first expense using the button above.</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-card">
              <p className="text-text-muted">No expenses match your current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredExpenses.map((expense, idx) => {
                const theme = categoryThemes[expense.category || 'Other'] || categoryThemes.Other;
                const pct = stats.total > 0 ? Math.round((expense.amount / stats.total) * 100) : 0;
                const expDate = new Date(expense.date);

                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: Math.min(idx * 0.03, 0.3), ease: [0.23, 1, 0.32, 1] }}
                    className={`relative bg-gradient-to-br ${theme.bg} backdrop-blur-xl rounded-2xl border ${theme.border} shadow-sm hover:shadow-lg ${theme.glow} hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 group overflow-hidden`}
                  >
                    {/* Decorative glow orb */}
                    <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${theme.gradient} opacity-[0.06] rounded-full blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500`} />
                    {/* Shimmer line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />

                    <div className="relative p-5">
                      {/* Top row: category badge + actions */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r ${theme.iconBg} shadow-sm`}>
                          <Tag size={10} />
                          {expense.category}
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            type="button"
                            onClick={(e) => handleEditExpense(e, expense)}
                            className="p-1.5 hover:bg-white/80 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteExpense(e, expense.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <h3 className="text-sm font-bold text-gray-900 mb-3 line-clamp-2 leading-snug">
                        {expense.description}
                      </h3>

                      {/* Amount */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-[22px] font-extrabold text-gray-900 tracking-tight">
                          ₹{expense.amount.toLocaleString()}
                        </span>
                        {expense.gstAmount !== undefined && expense.gstAmount > 0 && (
                          <span className={`text-[10px] font-bold ${theme.accent} bg-white/70 backdrop-blur px-1.5 py-0.5 rounded-md flex items-center gap-0.5`}>
                            <Shield size={9} />
                            +₹{expense.gstAmount} GST
                          </span>
                        )}
                      </div>

                      {/* Progress bar: % of total spend */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Share of Total</span>
                          <span className={`text-[10px] font-bold ${theme.accent}`}>{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${theme.gradient} transition-all duration-700`}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer: date + receipt */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100/80">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{getRelativeDate(expDate)}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-gray-400">{expDate.toLocaleDateString()}</span>
                        </div>
                        {expense.receiptUrl && (
                          <div className={`flex items-center gap-1 text-[10px] font-bold ${theme.accent}`}>
                            <Receipt className="w-3 h-3" />
                            Receipt
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Expense Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 text-left">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-main">
                {expenseForm.id ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setExpenseForm({
                    id: '',
                    description: '',
                    amount: '',
                    category: 'Other',
                    date: new Date().toISOString().split('T')[0],
                    gstAmount: ''
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-2">Description *</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  placeholder="Office supplies"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">Amount *</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">GST</label>
                  <input
                    type="number"
                    value={expenseForm.gstAmount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, gstAmount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                    placeholder="900"
                  />
                </div>
              </div>

              <div className="relative z-[100]">
                <CustomSelect
                  label="Category *"
                  value={isCustomCategory ? 'CUSTOM_NEW' : expenseForm.category}
                  onChange={(val) => {
                    if (val === 'CUSTOM_NEW') {
                      setIsCustomCategory(true);
                      setExpenseForm({ ...expenseForm, category: 'CUSTOM_NEW' });
                    } else {
                      setIsCustomCategory(false);
                      setExpenseForm({ ...expenseForm, category: val });
                    }
                  }}
                  options={[
                    ...dynCategories.map(cat => ({ value: cat, label: cat })),
                    { value: 'CUSTOM_NEW', label: '+ Add Custom Category' }
                  ]}
                />
              </div>

              {isCustomCategory && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-medium text-text-main mb-2">Custom Category Name *</label>
                  <input
                    type="text"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                    placeholder="e.g. Server Hosting"
                  />
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-main mb-2">Date *</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setExpenseForm({
                    id: '',
                    description: '',
                    amount: '',
                    category: 'Other',
                    date: new Date().toISOString().split('T')[0],
                    gstAmount: ''
                  });
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-text-main hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrUpdateExpense}
                disabled={savingExpense}
                className="flex-1 px-4 py-2.5 text-white rounded-xl transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: '#14b8b8' }}
              >
                {savingExpense ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  expenseForm.id ? 'Update Expense' : 'Create Expense'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">

            {/* Header */}
            <div className="flex flex-col items-center text-center px-6 pt-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>

              <h3 className="text-lg font-semibold text-text-main">
                Delete expense?
              </h3>

              <p className="mt-2 text-sm text-text-muted">
                This expense will be removed from reports and analytics.
              </p>
            </div>

            {/* Divider */}
            <div className="my-6 h-px bg-gray-100" />

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-text-main hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#14b8b8' }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
