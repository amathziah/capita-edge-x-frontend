import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FileText, Download, Mail, Loader2, Eye, Printer, X, Plus, Search, Filter, Edit2, Trash2, DollarSign, CheckCircle, Share2 } from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from '../components/PDF/InvoicePDF';
import { dataService } from '../services/dataService';
import { Invoice } from '../types';
import InvoiceGenerator from '../components/InvoiceGenerator/InvoiceGenerator';
import { Toast, ToastType } from '../components/Toast';
import RecordPaymentModal from '../components/Invoice/RecordPaymentModal';
import { useData } from "../contexts/DataContext";
import { usePersona } from "../contexts/PersonaContext";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-status-success-bg text-status-success border-status-success/10",
  overdue: "bg-status-danger-bg text-status-danger border-status-danger/10",
  pending: "bg-status-warning-bg text-status-warning border-status-warning/10",
  partially_paid: "bg-status-warning-bg text-status-warning border-status-warning/10",
  sent: "bg-status-info-bg text-status-info border-status-info/10",
  viewed: "bg-blue-50 text-blue-600 border-blue-100",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-50 text-red-500 border-red-100",
  escalated: "bg-purple-50 text-purple-600 border-purple-100",
};

export function Invoices() {
  const { filteredInvoices: invoices, loading, refreshData, setData } = useData();
  const { businessType } = usePersona();

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [sortKey, setSortKey] = useState<"invoiceNumber" | "buyer" | "total" | "status" | "date">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // View Modal State
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const [viewLoading, setViewLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [recordingPaymentFor, setRecordingPaymentFor] = useState<Invoice | null>(null);


  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);


  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Fetch full invoice details when ID changes
  useEffect(() => {
    if (viewInvoiceId) {
      const fetchDetails = async () => {
        setViewLoading(true);
        try {
          const inv = await dataService.getInvoice(viewInvoiceId);
          setViewInvoice(inv);
        } catch (err) {
          console.error("Failed to fetch invoice details", err);
          showToast("Could not load invoice details.", 'error');
          setViewInvoiceId(null);
        } finally {
          setViewLoading(false);
        }
      };
      fetchDetails();
    } else {
      setViewInvoice(null);
    }
  }, [viewInvoiceId]);


  // Filtering
  const filtered = useMemo(() => {
    return invoices
      .filter((inv) => {
        const buyerName = inv.buyer?.name || "Unknown";
        const amountStr = inv.total.toString();
        const dateStr = inv.date || "";
        return buyerName.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
          inv.invoiceNumber.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
          dateStr.includes(searchTerm.trim()) ||
          amountStr.includes(searchTerm.trim());
      })
      .filter((inv) => {
        if (filterStatus === "All") return true;
        if (filterStatus === "recurring") return inv.is_recurring || inv.type === 'subscription' || inv.type === 'recurring';
        return inv.status === filterStatus;
      });
  }, [invoices, searchTerm, filterStatus]);

  // Sorting
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "total") return dir * (a.total - b.total);
      if (sortKey === "buyer") {
        const nameA = a.buyer?.name || "";
        const nameB = b.buyer?.name || "";
        return dir * nameA.localeCompare(nameB);
      }
      if (sortKey === "status") return dir * a.status.localeCompare(b.status);
      if (sortKey === "invoiceNumber") return dir * a.invoiceNumber.localeCompare(b.invoiceNumber);
      // date fallback
      return dir * (new Date(a.date || a.createdAt || 0).getTime() - new Date(b.date || b.createdAt || 0).getTime());
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  // Totals
  const totalVisible = useMemo(() => sorted.reduce((s, i) => s + i.total, 0), [sorted]);

  // Helpers
  const toggleSelectAllOnPage = () => {
    const allSelected = paged.every((p) => selected[p.id]);
    const newSel = { ...selected };
    paged.forEach((p) => {
      newSel[p.id] = !allSelected;
    });
    setSelected(newSel);
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const exportCSV = (rows: Invoice[]) => {
    const header = ["Number", "Customer", "Total", "Status", "Date"];
    const csvRows = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.invoiceNumber,
          `"${(r.buyer?.name || "").replace(/"/g, '""')}"`,
          r.total,
          r.status,
          r.date || new Date(r.createdAt || Date.now()).toLocaleDateString(),
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const bulkSendReminder = async () => {
    const toRemind = invoices.filter((inv) => selected[inv.id]);
    if (toRemind.length === 0) {
      showToast("Select one or more invoices to send reminders.", 'info');
      return;
    }

    setBulkSending(true);
    let successCount = 0;
    try {
      // Process sequentially to avoid freezing UI with multiple PDF generations
      for (let i = 0; i < toRemind.length; i++) {
        const inv = toRemind[i];
        try {
          // Update toast with progress
          showToast(`Sending ${i + 1} of ${toRemind.length}: ${inv.invoiceNumber}...`, 'info');

          if (!inv.buyer?.email) {
            console.warn(`No email for invoice ${inv.invoiceNumber}`);
            continue;
          }

          // Generate PDF client-side (Premium Design)
          const settings = await dataService.getSettings();
          const blob = await pdf(
            <InvoicePDF
              invoice={inv}
              settings={{ ...settings, businessType }}
              logoUrl={dataService.getLogoUrl(settings.logoFilename)}
            />
          ).toBlob();

          if (inv.status === 'paid') {
            await dataService.sendInvoiceEmail(inv.id, inv.buyer.email, blob);
            successCount++;
          } else {
            await dataService.sendPaymentReminder(inv.id, inv.buyer.email, blob);
            successCount++;
          }

          // Optimistically update status if it was draft
          setData({
            invoices: invoices.map(item =>
              item.id === inv.id && item.status === 'draft'
                ? { ...item, status: 'sent' }
                : item
            )
          });
        } catch (err: any) {
          console.error(`Failed to send reminder for ${inv.invoiceNumber}`, err);
          showToast(err.message || `Failed to send reminder for ${inv.invoiceNumber}`, 'error');
        }
      }
      showToast(`Completed! Sent ${successCount} of ${toRemind.length} reminders.`, 'success');
    } catch (error) {
      console.error("Bulk send error:", error);
      showToast("An error occurred during bulk sending.", 'error');
    } finally {
      setBulkSending(false);
    }
  };

  const rowActionRemind = async (inv: Invoice) => {
    if (!inv.buyer?.email) {
      showToast("No email address for this customer.", 'error');
      return;
    }
    setActionLoading(inv.id);
    try {
      // Generate PDF client-side
      const settings = await dataService.getSettings();
      const blob = await pdf(
        <InvoicePDF
          invoice={inv}
          settings={{ ...settings, businessType }}
          logoUrl={dataService.getLogoUrl(settings.logoFilename)}
        />
      ).toBlob();

      await dataService.sendPaymentReminder(inv.id, inv.buyer.email, blob);
      showToast(`Reminder sent for ${inv.invoiceNumber}`, 'success');

      // Update local state
      setData({
        invoices: invoices.map(item =>
          item.id === inv.id && item.status === 'draft'
            ? { ...item, status: 'sent' }
            : item
        )
      });
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to send reminder", 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // UI helpers for sort
  const setSort = (key: typeof sortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 min-h-screen bg-transparent space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex gap-4">
            <div className="h-10 w-64 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
          <div className="space-y-4 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 w-4 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-gray-100 rounded animate-pulse flex-1"></div>
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
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
          <h2 className="text-2xl font-bold text-text-main">Invoices</h2>
          <p className="text-sm text-text-muted mt-1">Manage and track your business payments.</p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
        >
          <Plus className="w-5 h-5" /> New Invoice
        </button>
      </div>

      {/* Control Bar - Premium Glass Style */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">

        {/* Left: Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by number or customer..."
              className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <select
              className="w-full sm:w-48 pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none transition-all cursor-pointer"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              {(["All", "paid", "overdue", "sent", "draft", "cancelled", "recurring"]).map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            {/* Custom chevron if needed, or rely on browser default hidden by appearance-none if styled */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Right: Actions Toolbar */}
        <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
            {/* Compute if any selected are paid */}
            {(() => {
              const selectedIds = Object.keys(selected).filter(k => selected[k]);
              const containsPaidInvoices = invoices.some(inv => selectedIds.includes(inv.id) && inv.status === 'paid');

              return (
                <div className="flex items-center">
                  <button
                    onClick={() => exportCSV(sorted)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all"
                    title="Export Visible"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                  <div className="w-px bg-gray-200 my-1 mx-1"></div>
                  <button
                    onClick={() => bulkSendReminder()}
                    disabled={bulkSending || containsPaidInvoices}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white hover:text-primary hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={containsPaidInvoices ? "Cannot bulk email paid invoices" : "Send Reminders"}
                  >
                    {bulkSending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    {bulkSending ? 'Sending...' : 'Send Bulk Emails'}
                  </button>
                </div>
              );
            })()}
          </div>

          <button
            onClick={() => {
              setSelected({});
              setPage(1);
              setSearchTerm("");
              setFilterStatus("All");
            }}
            className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Reset Filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 w-12 text-left">
                  <input
                    aria-label="Select all on page"
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary/20"
                    checked={paged.length > 0 && paged.every((p) => selected[p.id])}
                    onChange={toggleSelectAllOnPage}
                  />
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:text-primary transition" onClick={() => setSort("invoiceNumber")}>
                  Number
                  {sortKey === "invoiceNumber" && <span className="ml-1 opacity-70">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:text-primary transition" onClick={() => setSort("date")}>
                  Date
                  {sortKey === "date" && <span className="ml-1 opacity-70">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:text-primary transition" onClick={() => setSort("buyer")}>
                  Customer
                  {sortKey === "buyer" && <span className="ml-1 opacity-70">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right cursor-pointer hover:text-primary transition" onClick={() => setSort("total")}>
                  Total
                  {sortKey === "total" && <span className="ml-1 opacity-70">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">
                  Net Receivable
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:text-primary transition" onClick={() => setSort("status")}>
                  Status
                  {sortKey === "status" && <span className="ml-1 opacity-70">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 opacity-20" />
                      <p>No invoices found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        aria-label={`Select invoice ${inv.invoiceNumber}`}
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary/20"
                        checked={!!selected[inv.id]}
                        onChange={() => toggleSelect(inv.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-text-main">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-text-muted">
                      {new Date(inv.date || inv.createdAt || Date.now()).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-text-main">{inv.buyer?.name || "Unknown"}</td>
                    <td className="px-6 py-4 text-right font-medium text-text-main">₹{inv.total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-sm">
                      {inv.netReceivable
                        ? <span className="font-medium text-green-600">
                            ₹{Number(inv.netReceivable).toLocaleString('en-IN')}
                          </span>
                        : <span className="text-gray-400 text-xs">No TDS</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize border ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                        {inv.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setViewInvoiceId(inv.id)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary-light transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingInvoice(inv)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          title="Edit Invoice"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              showToast("Generating PDF...", "info");
                              const settings = await dataService.getSettings();
                              const blob = await pdf(
                                <InvoicePDF
                                  invoice={inv}
                                  settings={{ ...settings, businessType }}
                                  logoUrl={dataService.getLogoUrl(settings.logoFilename)}
                                />
                              ).toBlob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `Invoice_${inv.invoiceNumber}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              showToast("PDF Downloaded", "success");
                            } catch (e) {
                              console.error(e);
                              showToast("Failed to generate PDF", "error");
                            }
                          }}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-gray-100 transition"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => rowActionRemind(inv)}
                          disabled={actionLoading === inv.id || inv.status === 'paid'}
                          className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light transition disabled:opacity-50"
                          title={inv.status === 'paid' ? "Already Paid" : "Send Reminder"}
                        >
                          {actionLoading === inv.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (!inv.share_token) {
                              showToast("Share link not available for this invoice.", 'error');
                              return;
                            }
                            const url = dataService.getShareUrl(inv.share_token);
                            navigator.clipboard.writeText(url);
                            showToast("Share link copied to clipboard!", 'success');
                          }}
                          className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light transition"
                          title="Copy Share Link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Delete invoice ${inv.invoiceNumber}? This action cannot be undone.`)) return;
                            try {
                              await dataService.deleteInvoice(inv.id);
                              setData({ invoices: invoices.filter(i => i.id !== inv.id) });
                              showToast(`Invoice ${inv.invoiceNumber} deleted`, 'success');
                            } catch (e: any) {
                              showToast(e.message || 'Failed to delete invoice', 'error');
                            }
                          }}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Footer: totals */}
            <tfoot className="bg-gray-50/50 border-t border-gray-100">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-xs font-medium text-text-light uppercase tracking-wide">
                  Page {page} of {totalPages} • {sorted.length} Total Invoices
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-text-main">
                  Total: ₹{totalVisible.toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                  Net: ₹{sorted.reduce((s, i) =>
                    s + (Number(i.netReceivable) || Number(i.total) || 0), 0
                  ).toLocaleString('en-IN')}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 bg-transparent border-b border-gray-200 focus:border-primary outline-none transition font-medium text-text-main"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            disabled={page === 1}
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {viewInvoiceId && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 text-left">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity" onClick={() => setViewInvoiceId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Invoice Details
              </h3>
              <button
                onClick={() => setViewInvoiceId(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition text-text-muted hover:text-text-main"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-white" id="printable-invoice">
              {viewLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              ) : viewInvoice ? (
                <div className="space-y-8">
                  {/* Top Info */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold text-text-main">INVOICE</h1>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${STATUS_COLORS[viewInvoice.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {viewInvoice.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-text-muted text-lg tracking-tight">#{viewInvoice.invoiceNumber}</p>
                      {viewInvoice.projectName && (
                        <p className="text-primary font-bold text-sm mt-2 flex items-center gap-1">
                          <span className="text-text-light uppercase tracking-widest text-[10px]">Project:</span> {viewInvoice.projectName}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-xs font-medium text-text-light uppercase tracking-wide">Date Issued</div>
                      <div className="font-medium text-text-main">{new Date(viewInvoice.date || viewInvoice.createdAt || Date.now()).toLocaleDateString()}</div>
                      <div className="text-xs font-medium text-text-light uppercase tracking-wide mt-3">Due Date</div>
                      <div className="font-medium text-text-main">{viewInvoice.dueDate ? new Date(viewInvoice.dueDate).toLocaleDateString() : '—'}</div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-12">
                    <div>
                      <h4 className="text-xs font-bold text-text-light uppercase tracking-wide mb-3">From</h4>
                      <div className="font-bold text-text-main text-lg mb-1">{viewInvoice.seller?.name}</div>
                      <div className="text-sm text-text-muted space-y-0.5">
                        <p className="whitespace-pre-line">{viewInvoice.seller?.address}</p>
                        <p>{viewInvoice.seller?.email}</p>
                        <p>{viewInvoice.seller?.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h4 className="text-xs font-bold text-text-light uppercase tracking-wide mb-3">Bill To</h4>
                      <div className="font-bold text-text-main text-lg mb-1">{viewInvoice.buyer?.name}</div>
                      <div className="text-sm text-text-muted space-y-0.5">
                        <p>{viewInvoice.buyer?.phone}</p>
                      </div>
                    </div>
                  </div>

                  {viewInvoice.shippingAddress && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                      <h4 className="text-[10px] font-bold text-text-light uppercase tracking-wider mb-1">Shipping Destination</h4>
                      <p className="text-sm text-text-main font-medium">{viewInvoice.shippingAddress}</p>
                    </div>
                  )}

                  {/* Items Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50/50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-text-muted">Description</th>
                          {(viewInvoice?.projectName || viewInvoice?.items?.some(i => i.serviceStartDate)) && (
                            <th className="px-6 py-3 text-center font-semibold text-text-muted">Service Period</th>
                          )}
                          <th className="px-6 py-3 text-center font-semibold text-text-muted">Unit</th>
                          <th className="px-6 py-3 text-center font-semibold text-text-muted">Qty</th>
                          <th className="px-6 py-3 text-right font-semibold text-text-muted">Price</th>
                          <th className="px-6 py-3 text-right font-semibold text-text-muted">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {viewInvoice.items && viewInvoice.items.length > 0 ? (
                          viewInvoice.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4 font-medium text-text-main">
                                {item.description}
                                {item.sku && <span className="block text-[10px] text-text-light mt-0.5">SKU: {item.sku}</span>}
                              </td>
                              {(viewInvoice?.projectName || viewInvoice?.items?.some(i => i.serviceStartDate)) && (
                                <td className="px-6 py-4 text-center text-[10px] text-text-muted">
                                  {item.serviceStartDate ? `${new Date(item.serviceStartDate).toLocaleDateString()} - ${item.serviceEndDate ? new Date(item.serviceEndDate).toLocaleDateString() : ''}` : '—'}
                                </td>
                              )}
                              <td className="px-6 py-4 text-center text-text-muted">{item.unit || "Qty"}</td>
                              <td className="px-6 py-4 text-center text-text-main">{item.quantity}</td>
                              <td className="px-6 py-4 text-right text-text-muted">₹{item.price.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right font-bold text-text-main">₹{(item.quantity * item.price).toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={5} className="p-6 text-center text-text-muted">No items found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-end">
                    <div className="w-72 bg-gray-50/50 p-6 rounded-xl space-y-3">

                      <div className="flex justify-between text-sm text-text-muted">
                        <span>Subtotal</span>
                        <span className="font-medium text-text-main">
                          ₹{(viewInvoice.subtotal || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {viewInvoice.discountAmount && viewInvoice.discountAmount > 0 ? (
                        <div className="flex justify-between text-sm text-text-muted">
                          <span>Discount</span>
                          <span className="font-medium text-red-500">
                            − ₹{viewInvoice.discountAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ) : null}

                      {viewInvoice.gstType === 'cgst_sgst' && (
                        <>
                          <div className="flex justify-between text-sm text-text-muted">
                            <span>CGST</span>
                            <span className="font-medium text-blue-600">
                              ₹{(viewInvoice.cgstAmount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm text-text-muted">
                            <span>SGST</span>
                            <span className="font-medium text-blue-600">
                              ₹{(viewInvoice.sgstAmount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </>
                      )}

                      {viewInvoice.gstType === 'igst' && (
                        <div className="flex justify-between text-sm text-text-muted">
                          <span>IGST</span>
                          <span className="font-medium text-blue-600">
                            ₹{(viewInvoice.igstAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      {viewInvoice.gstType === 'not_applicable' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-text-muted">GST</span>
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                            Not Applicable
                          </span>
                        </div>
                      )}

                      {(viewInvoice.shipping || 0) > 0 && (
                        <div className="flex justify-between text-sm text-text-muted">
                          <span>Shipping</span>
                          <span className="font-medium text-text-main">
                            ₹{(viewInvoice.shipping || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between text-xl font-bold text-primary">
                          <span>Total</span>
                          <span>₹{(viewInvoice.total || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {viewInvoice.tdsApplicable && viewInvoice.tdsAmount && viewInvoice.tdsAmount > 0 ? (
                        <div className="bg-gray-100 rounded-lg p-3 space-y-1.5 mt-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>
                              TDS Sec 194J
                              @ {viewInvoice.tdsRate || 10}%
                            </span>
                            <span className="text-red-500 font-medium">
                              − ₹{(viewInvoice.tdsAmount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold">
                            <span className="text-gray-700">You receive</span>
                            <span className="text-green-600">
                              ₹{(viewInvoice.netReceivable || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ) : null}

                    </div>
                  </div>

                  {/* Notes */}
                  {viewInvoice.notes && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-900">
                      <strong className="block mb-1 font-semibold">Notes:</strong>
                      {viewInvoice.notes}
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center text-gray-500 py-20">Failed to load details.</div>
              )}
            </div>

            {/* Modal Footer (Actions) */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-text-main hover:bg-gray-50 shadow-sm transition"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={async () => {
                  if (!viewInvoice) return;
                  try {
                    showToast("Generating PDF...", "info");
                    const settings = await dataService.getSettings();
                    const blob = await pdf(
                      <InvoicePDF
                        invoice={viewInvoice}
                        settings={{ ...settings, businessType }}
                        logoUrl={dataService.getLogoUrl(settings.logoFilename)}
                      />
                    ).toBlob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Invoice_${viewInvoice.invoiceNumber}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    showToast("PDF Downloaded", "success");
                  } catch (e) {
                    console.error("PDF Error", e);
                    showToast("Failed to generate PDF", "error");
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-text-main hover:bg-gray-50 shadow-sm transition"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
              <button
                onClick={() => {
                  if (!viewInvoice?.share_token) {
                    showToast("Share link not available.", 'error');
                    return;
                  }
                  const url = dataService.getShareUrl(viewInvoice.share_token);
                  navigator.clipboard.writeText(url);
                  showToast("Share link copied to clipboard!", 'success');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition"
              >
                <Share2 className="w-4 h-4" /> Copy Share Link
              </button>
              <button
                onClick={async () => {
                  if (!viewInvoice) return;
                  // Simple prompt for now (ideally use a modal)
                  const email = prompt("Enter customer email:", viewInvoice.buyer?.email || "");
                  if (email) {
                    try {
                      setEmailSending(true);
                      showToast("Generating PDF and sending...", "info");

                      // Generate PDF
                      const settings = await dataService.getSettings();
                      const blob = await pdf(
                        <InvoicePDF
                          invoice={viewInvoice}
                          settings={{ ...settings, businessType }}
                          logoUrl={dataService.getLogoUrl(settings.logoFilename)}
                        />
                      ).toBlob();

                      // Send
                      await dataService.sendInvoiceEmail(viewInvoice.id, email, blob);
                      showToast("Email sent successfully!", "success");

                      // Update local state
                      setData({
                        invoices: invoices.map(item =>
                          item.id === viewInvoice.id && item.status === 'draft'
                            ? { ...item, status: 'sent' }
                            : item
                        )
                      });
                      if (viewInvoice.status === 'draft') {
                        setViewInvoice(prev => prev ? { ...prev, status: 'sent' } : null);
                      }

                      setViewInvoiceId(null);
                    } catch (e) {
                      console.error(e);
                      showToast("Failed to send email", "error");
                    } finally {
                      setEmailSending(false);
                    }
                  }
                }}
                disabled={emailSending}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark shadow-soft hover:shadow-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {emailSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {emailSending ? 'Sending...' : (viewInvoice?.status === 'paid' ? 'Email Receipt' : 'Email Customer')}
              </button>

              {viewInvoice?.status === 'overdue' && (
                <button
                  onClick={async () => {
                    const offer = await dataService.generateSettlementOffer(viewInvoice.id) as any;
                    if (offer) {
                      alert(`Negotiation Email Draft:\n\nSubject: ${offer.subject}\n\n${offer.body}\n\nDiscount Offered: ${offer.discountOffered ? 'Yes (5%)' : 'No'}`);
                    } else {
                      showToast('Could not generate offer.', 'error');
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-status-danger text-white rounded-xl text-sm font-medium hover:bg-red-600 shadow-soft hover:shadow-lg transition"
                >
                  Recover Payment
                </button>
              )}

              {/* Edit Button In Detail Modal */}
              <button
                onClick={() => {
                  setRecordingPaymentFor(viewInvoice);
                  setViewInvoiceId(null);
                }}
                disabled={viewInvoice?.status === 'paid' || viewInvoice?.status === 'draft'}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium shadow-soft transition ${(viewInvoice?.status === 'paid' || viewInvoice?.status === 'draft')
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-lg'
                  }`}
                title={viewInvoice?.status === 'draft' ? "Please send or view the invoice before recording payment" : ""}
              >
                {viewInvoice?.status === 'paid' ? <CheckCircle className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                {viewInvoice?.status === 'paid' ? 'Payment Recorded' : (viewInvoice?.status === 'draft' ? 'Payment Restricted' : 'Record Payment')}
              </button>

              <button
                onClick={() => {
                  setEditingInvoice(viewInvoice);
                  setViewInvoiceId(null);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-soft hover:shadow-lg transition"
              >
                <Edit2 className="w-4 h-4" /> Edit Invoice
              </button>
            </div>

          </div>
        </div>,
        document.body
      )
      }

      {/* Create Invoice Modal */}
      {
        showCreate && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 text-left">
            <div className="bg-white w-full max-w-[98vw] h-[98vh] rounded-2xl overflow-hidden shadow-2xl relative">
              <InvoiceGenerator
                onClose={() => {
                  setShowCreate(false);
                  refreshData(true);
                }}
              />
            </div>
          </div>,
          document.body
        )
      }

      {/* Edit Invoice Modal */}
      {
        editingInvoice && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 text-left">
            <div className="bg-white w-full max-w-[98vw] h-[98vh] rounded-2xl overflow-hidden shadow-2xl relative">
              <InvoiceGenerator
                editingInvoice={editingInvoice}
                onClose={async () => {
                  setEditingInvoice(null);
                  refreshData(true);
                }}
              />
            </div>
          </div>,
          document.body
        )
      }


      {/* Record Payment Modal */}
      {
        recordingPaymentFor && createPortal(
          <RecordPaymentModal
            invoice={recordingPaymentFor}
            onClose={() => setRecordingPaymentFor(null)}
            onSuccess={async () => {
              showToast('Payment recorded successfully', 'success');
              refreshData(true);
            }}
          />,
          document.body
        )
      }



      {
        toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )
      }
    </div >
  );
}

export default Invoices;
