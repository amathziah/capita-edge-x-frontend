import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileText, Download, Mail, Loader2, Eye, Printer, X, Plus, Search, Edit2, Trash2, DollarSign, CheckCircle, Share2 } from "lucide-react";
import { dataService } from '@/services/dataService';
import { InvoiceDocumentPreview } from '@/features/invoices/components/InvoiceDocumentPreview';
import { Invoice } from '@/types';
import { Toast, ToastType } from '@/components/Toast';
import RecordPaymentModal from '@/components/Invoice/RecordPaymentModal';
import { useData } from "@/contexts/DataContext";
import { CustomSelect } from '@/components/ui/CustomSelect';
import { downloadCsv } from '@/shared/lib/export';

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-status-success-bg text-status-success border-status-success/10",
  overdue: "bg-status-danger-bg text-status-danger border-status-danger/10",
  pending: "bg-status-warning-bg text-status-warning border-status-warning/10",
  partially_paid: "bg-status-warning-bg text-status-warning border-status-warning/10",
  sent: "bg-status-info-bg text-status-info border-status-info/10",
  viewed: "bg-blue-50 text-blue-600 border-blue-100",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  void: "bg-red-50 text-red-500 border-red-100",
  write_off: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-500 border-red-100",
  escalated: "bg-purple-50 text-purple-600 border-purple-100",
};

const formatInrAmount = (value: unknown) =>
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getDocumentTitle = (invoice: Invoice | null) => {
  if (!invoice) return 'INVOICE';
  const explicitType = String((invoice as any).type || '').toLowerCase();
  if (explicitType === 'bill_of_supply') return 'BILL OF SUPPLY';
  if (explicitType === 'credit_note') return 'CREDIT NOTE';
  if (explicitType === 'debit_note') return 'DEBIT NOTE';
  if (explicitType === 'delivery_challan') return 'DELIVERY CHALLAN';
  return invoice.isGstRegistered === false ? 'BILL OF SUPPLY' : 'INVOICE';
};

const getLineAmount = (item: any) => {
  const quantity = Number(item.quantity || 0);
  const price = Number(item.price || 0);
  const discountPercent = Number(item.discount_percent ?? item.discountPercent ?? item.discount ?? 0);
  const gross = quantity * price;
  return Math.max(gross - (gross * discountPercent) / 100, 0);
};

export function Invoices() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filteredInvoices: invoices, loading, refreshData, setData } = useData();

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
  const [viewSettings, setViewSettings] = useState<any | null>(null);

  const [viewLoading, setViewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [recordingPaymentFor, setRecordingPaymentFor] = useState<Invoice | null>(null);


  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);


  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };


  // Check for view parameter on mount
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId) {
      setViewInvoiceId(viewId);
      // Clean up the URL without reloading
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('view');
      setSearchParams(newParams, { replace: true });
    }
  }, []);


  // Fetch initial data
  useEffect(() => {
    refreshData(['invoices', 'stats']);
  }, [refreshData]);


  // Fetch full invoice details when ID changes
  useEffect(() => {
    if (viewInvoiceId) {
      const fetchDetails = async () => {
        setViewLoading(true);
        try {
          const [inv, settings] = await Promise.all([
            dataService.getInvoice(viewInvoiceId),
            dataService.getSettings(),
          ]);
          setViewInvoice(inv);
          setViewSettings(settings);
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
      setViewSettings(null);
    }
  }, [viewInvoiceId]);


  // Filtering
  const filtered = useMemo(() => {
    return invoices
      .filter((inv) => {
        const buyerName = inv.buyer?.name || "Unknown";
        const amountStr = (inv.total || 0).toString();
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
  const totalVisible = useMemo(() => sorted.reduce((s, i) => s + (i.total || 0), 0), [sorted]);

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
    downloadCsv(
      `invoices_export_${new Date().toISOString().slice(0, 10)}.csv`,
      ["Number", "Customer", "Total", "Status", "Date"],
      rows.map((invoice) => [
        invoice.invoiceNumber,
        invoice.buyer?.name || "",
        invoice.total || 0,
        invoice.status,
        invoice.date || new Date(invoice.createdAt || Date.now()).toLocaleDateString(),
      ])
    );
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

          if (inv.status === 'paid') {
            await dataService.sendInvoiceEmail(inv.id, inv.buyer.email);
            successCount++;
          } else {
            await dataService.sendPaymentReminder(inv.id, inv.buyer.email);
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
      await dataService.sendPaymentReminder(inv.id, inv.buyer.email);
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

  if (loading && invoices.length === 0) {
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
          onClick={() => navigate('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black transition shadow-xl shadow-slate-900/10"
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

          <div className="relative group z-10 w-full sm:w-48">
            <CustomSelect
              value={filterStatus}
              onChange={(val) => {
                setFilterStatus(val);
                setPage(1);
              }}
              options={(["All", "paid", "sent", "partially_paid", "overdue", "draft", "void", "write_off", "recurring"]).map((s) => ({
                value: s,
                label: s === "All" ? "All Statuses" : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
              }))}
              className="w-full"
            />
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
                  <td colSpan={8} className="p-16 text-center text-text-muted bg-gray-50/20">
                    <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-2">
                        <FileText className="w-8 h-8 text-gray-200" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-text-main">No invoices found</p>
                        <p className="text-sm text-text-light px-4">We couldn't find any invoices matching your current filters or search terms.</p>
                      </div>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFilterStatus("All");
                        }}
                        className="mt-2 text-primary font-bold text-xs uppercase tracking-widest hover:underline"
                      >
                        Clear All Filters
                      </button>
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
                    <td className="px-6 py-4 text-right font-medium text-text-main">₹{(inv.total || 0).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-right text-sm">
                      {inv.netReceivable
                        ? <span className="font-medium text-green-600">
                            ₹{Number(inv.netReceivable).toLocaleString('en-IN')}
                          </span>
                        : <span className="text-gray-400 text-xs">No TDS</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const dispStatus = inv.status;
                        return (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize border ${STATUS_COLORS[dispStatus as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {dispStatus.replace(/_/g, ' ')}
                          </span>
                        );
                      })()}
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
                          onClick={() => navigate(`${inv.id}/edit`)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          title="Edit Invoice"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              showToast("Generating PDF...", "info");
                              await dataService.downloadInvoicePdf(inv.id, inv.invoiceNumber);
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
                          onClick={async () => {
                            if (!inv.share_token) {
                              showToast("Share link not available for this invoice.", 'error');
                              return;
                            }
                            try {
                              const result = await dataService.markInvoiceShared(inv.id);
                              const nextInvoice = result?.invoice;
                              if (nextInvoice) {
                                setData({
                                  invoices: invoices.map(item => item.id === inv.id ? nextInvoice : item)
                                });
                              }
                              const url = dataService.getShareUrl(result?.shareToken || inv.share_token);
                              await navigator.clipboard.writeText(url);
                              showToast("Share link copied to clipboard!", 'success');
                            } catch (e) {
                              console.error(e);
                              showToast("Failed to prepare share link", 'error');
                            }
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
                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                  <InvoiceDocumentPreview
                    invoice={{
                      invoiceNumber: viewInvoice.invoiceNumber,
                      date: viewInvoice.date,
                      dueDate: viewInvoice.dueDate,
                      fromName: viewInvoice.seller?.name || viewSettings?.owner_name || viewSettings?.businessName || '',
                      fromTitle: (viewInvoice as any).seller?.title || '',
                      fromAddress: viewInvoice.seller?.address || viewSettings?.address || '',
                      fromGstin: (viewInvoice as any).seller?.gstin || (viewInvoice as any).seller?.taxId || viewSettings?.companyTaxId || '',
                      customerName: viewInvoice.buyer?.name || '',
                      customerEmail: viewInvoice.buyer?.email || '',
                      customerAddress: viewInvoice.buyer?.address || '',
                      customerGstin: viewInvoice.buyer?.gstin || '',
                      isGstRegistered: viewInvoice.isGstRegistered !== false,
                      isInterstate: viewInvoice.gstType === 'igst' || Boolean((viewInvoice as any).isInterstate),
                      taxRate: viewInvoice.taxRate || 0,
                      tdsRate: viewInvoice.tdsRate || 0,
                      shipping: viewInvoice.shipping || 0,
                      bankName: (viewInvoice as any).seller?.bankName || viewSettings?.bankName || '',
                      accountNumber: (viewInvoice as any).seller?.accountNumber || viewSettings?.bankAccountNumber || '',
                      ifscCode: (viewInvoice as any).seller?.ifscCode || viewSettings?.bankIfsc || '',
                      upiId: (viewInvoice as any).seller?.upiId || viewSettings?.upiId || '',
                      paymentQrUrl: viewSettings?.paymentQrFilename ? dataService.getPaymentQrUrl(viewSettings.paymentQrFilename) : '',
                      notes: viewInvoice.notes || viewSettings?.invoiceNotes || '',
                      terms: (viewInvoice as any).seller?.terms || '',
                      includeSignature: Boolean((viewInvoice as any).seller?.includeSignature),
                      signatureName: (viewInvoice as any).seller?.signatureName || '',
                      type: (viewInvoice as any).type,
                      items: viewInvoice.items || [],
                    }}
                    calcResult={{
                      subtotal: String(Number(viewInvoice.subtotal || 0)),
                      total_tax: String(Number(viewInvoice.taxAmount || 0)),
                      total_discount: String(Number(viewInvoice.discountAmount || viewInvoice.discount || 0)),
                      grand_total: String(Number(viewInvoice.total || 0)),
                      payable_amount: String(Number(viewInvoice.netReceivable || viewInvoice.total || 0)),
                      tds_amount: String(Number(viewInvoice.tdsAmount || 0)),
                      shipping_charges: String(Number(viewInvoice.shipping || 0)),
                    }}
                    discountLabel={Number(viewInvoice.discountAmount || viewInvoice.discount || 0) > 0 ? 'Discount' : undefined}
                  />
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
                    await dataService.downloadInvoicePdf(viewInvoice.id, viewInvoice.invoiceNumber);
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
                onClick={async () => {
                  if (!viewInvoice?.share_token) {
                    showToast("Share link not available.", 'error');
                    return;
                  }
                  try {
                    const result = await dataService.markInvoiceShared(viewInvoice.id);
                    const nextInvoice = result?.invoice;
                    if (nextInvoice) {
                      setViewInvoice(nextInvoice as any);
                      setData({
                        invoices: invoices.map(item => item.id === viewInvoice.id ? nextInvoice : item)
                      });
                    }
                    const url = dataService.getShareUrl(result?.shareToken || viewInvoice.share_token);
                    await navigator.clipboard.writeText(url);
                    showToast("Share link copied to clipboard!", 'success');
                  } catch (e) {
                    console.error(e);
                    showToast("Failed to prepare share link", 'error');
                  }
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
                      showToast("Sending invoice...", "info");

                      // Send
                      await dataService.sendInvoiceEmail(viewInvoice.id, email);
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

              {(viewInvoice?.status === 'overdue') && (
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
                  if (viewInvoice) {
                    navigate(`${viewInvoice.id}/edit`);
                    setViewInvoiceId(null);
                  }
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
