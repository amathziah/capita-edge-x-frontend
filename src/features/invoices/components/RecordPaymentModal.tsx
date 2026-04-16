import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Calendar, CreditCard, Banknote, Smartphone, CheckCircle, Loader2, FileX } from 'lucide-react';
import { Invoice, Payment } from '@/types';
import { dataService } from '@/shared/services/dataService';
import { useData } from '@/app/providers/DataContext';

// DB rows may still carry snake_case fields not yet normalised by the mapper
type RawInvoice = Invoice & { net_receivable?: number; amount_paid?: number };

interface RecordPaymentModalProps {
    invoice?: Invoice | null;
    invoices?: Invoice[];
    onClose: () => void;
    onSuccess: () => void | Promise<void>;
}

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

function getOutstandingBalance(invoice: Invoice) {
    const explicitBalance = invoice.balance_due ?? invoice.balanceDue;
    if (explicitBalance !== undefined && explicitBalance !== null) {
        return Math.max(Number(explicitBalance) || 0, 0);
    }
    const totalAmount = Number(invoice.netReceivable ?? (invoice as RawInvoice).net_receivable ?? invoice.total ?? 0);
    const amountPaid = Number(invoice.amountPaid ?? (invoice as RawInvoice).amount_paid ?? 0);
    return Math.max(totalAmount - amountPaid, 0);
}

function getAmountPaid(invoice: Invoice) {
    return Number(invoice.amountPaid ?? (invoice as RawInvoice).amount_paid ?? 0);
}

function getTotalAmount(invoice: Invoice) {
    return Number(invoice.netReceivable ?? (invoice as RawInvoice).net_receivable ?? invoice.total ?? 0);
}

function getCollectionStatus(invoice: Invoice, balanceDue: number): Invoice['collectionStatus'] {
    if (balanceDue <= 0) return 'closed';
    const dueDate = invoice.dueDate || invoice.date;
    if (!dueDate) return 'current';
    const todayStr = new Date().toISOString().split('T')[0];
    const dueStr = new Date(dueDate).toISOString().split('T')[0];
    if (dueStr < todayStr) return 'overdue';
    if (dueStr === todayStr) return 'due_today';
    return 'current';
}

function buildUpdatedInvoice(invoice: Invoice, paymentAmount: number): Invoice {
    const totalAmount = getTotalAmount(invoice);
    const amountPaid = Math.max(getAmountPaid(invoice) + paymentAmount, 0);
    const balanceDue = Math.max(totalAmount - amountPaid, 0);
    const paymentStatus: Invoice['paymentStatus'] = balanceDue <= 0 ? 'paid' : amountPaid > 0 ? 'partially_paid' : 'unpaid';
    const collectionStatus = getCollectionStatus(invoice, balanceDue);
    const documentStatus = invoice.documentStatus || invoice.document_status || 'issued';
    const status: Invoice['status'] = paymentStatus === 'paid'
        ? 'paid'
        : collectionStatus === 'overdue'
            ? 'overdue'
            : paymentStatus === 'partially_paid'
                ? 'partially_paid'
                : 'sent';

    return { ...invoice, amountPaid, balanceDue, paymentStatus, collectionStatus, documentStatus, status, updatedAt: new Date().toISOString() };
}

function canRecordPayment(invoice: Invoice) {
    const status = (invoice.status || '').toLowerCase().trim();
    return status !== 'draft' && status !== 'void' && status !== 'cancelled' && getOutstandingBalance(invoice) > 0;
}

function formatInvoiceOption(invoice: Invoice) {
    const customerName = invoice.buyer?.name || 'Unknown customer';
    const balance = getOutstandingBalance(invoice).toLocaleString('en-IN');
    return `${invoice.invoiceNumber} • ${customerName} • ₹${balance}`;
}

// ---------------------------------------------------------------------------
// Blocked-state variants (shown instead of the form)
// ---------------------------------------------------------------------------

interface BlockedStateProps { icon: React.ReactNode; title: string; body: string; onClose: () => void; }

function BlockedState({ icon, title, body, onClose }: BlockedStateProps) {
    return (
        <div className="p-10 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-700">{title}</p>
                <p className="text-xs text-gray-400 mt-1">{body}</p>
            </div>
            <button
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition"
            >
                Close
            </button>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RecordPaymentModal({ invoice, invoices = [], onClose, onSuccess }: RecordPaymentModalProps) {
    const { invoices: contextInvoices, payments: contextPayments, setData } = useData();

    const availableInvoices = useMemo(() => {
        if (invoice) return [];          // single-invoice mode — list not used
        return invoices.filter(canRecordPayment);
    }, [invoice, invoices]);

    const [selectedInvoiceId, setSelectedInvoiceId] = useState(availableInvoices[0]?.id || '');

    const selectedInvoice = useMemo(() => {
        if (invoice) return invoice;
        return availableInvoices.find((e) => e.id === selectedInvoiceId) ?? null;
    }, [invoice, availableInvoices, selectedInvoiceId]);

    const outstandingBalance = selectedInvoice ? getOutstandingBalance(selectedInvoice) : 0;

    const [amount, setAmount] = useState(outstandingBalance);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState<NonNullable<Payment['paymentMode']>>('bank_transfer');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Keep amount in sync when the selected invoice changes
    useEffect(() => {
        setAmount(outstandingBalance);
        setError(null);
    }, [selectedInvoice?.id, outstandingBalance]);

    // Keep selection valid when the invoice list changes
    useEffect(() => {
        if (invoice) return;
        if (!selectedInvoiceId || !availableInvoices.some((e) => e.id === selectedInvoiceId)) {
            setSelectedInvoiceId(availableInvoices[0]?.id || '');
        }
    }, [invoice, availableInvoices, selectedInvoiceId]);

    const METHOD_OPTIONS: { label: string; value: NonNullable<Payment['paymentMode']> }[] = [
        { label: 'Bank Transfer', value: 'bank_transfer' },
        { label: 'Credit Card', value: 'card' },
        { label: 'Cash', value: 'cash' },
        { label: 'UPI', value: 'upi' },
        { label: 'Cheque', value: 'cheque' },
        { label: 'Other', value: 'other' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedInvoice) {
            setError('Choose an invoice before recording payment.');
            return;
        }
        if (outstandingBalance <= 0) {
            setError('This invoice is already fully paid.');
            return;
        }
        if (!amount || Number(amount) <= 0) {
            setError('Enter a payment amount greater than ₹0.');
            return;
        }
        if (Number(amount) - outstandingBalance > 0.009) {
            setError(`Amount exceeds the remaining balance of ₹${outstandingBalance.toLocaleString('en-IN')}.`);
            return;
        }

        setLoading(true);
        try {
            const response = await dataService.savePayment({
                id: '',
                invoiceId: selectedInvoice.id,
                amount: Number(amount),
                date,
                method,
                paymentMode: method,
                notes,
                status: 'completed'
            });

            const optimisticPayment: Payment = {
                id: response?.id || `payment-${Date.now()}`,
                invoiceId: selectedInvoice.id,
                amount: Number(amount),
                date,
                method,
                paymentMode: method,
                payment_mode: method,
                notes,
                status: 'completed',
                createdAt: new Date().toISOString()
            };

            setData({
                payments: [optimisticPayment, ...contextPayments.filter((e) => e.id !== optimisticPayment.id)],
                invoices: contextInvoices.map((e) => e.id === selectedInvoice.id ? buildUpdatedInvoice(selectedInvoice, Number(amount)) : e)
            });

            await onSuccess();
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------------------------------------------------
    // Derive blocked state before rendering the form
    // -----------------------------------------------------------------------

    // Case 1: no invoices in list at all (bulk-record mode with empty list)
    const noInvoicesAtAll = !invoice && availableInvoices.length === 0;

    // Case 2: a specific invoice was passed but it's a draft
    const isDraft = invoice && (invoice.status || '').toLowerCase().trim() === 'draft';

    // Case 3: a specific invoice was passed but it's already fully paid
    const isAlreadyPaid = invoice && !isDraft && outstandingBalance <= 0;

    // Case 4: no invoice selected yet from the dropdown
    const formDisabled = !selectedInvoice;

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    const headerSubtitle = invoice
        ? `Invoice #${invoice.invoiceNumber}`
        : selectedInvoice
            ? `Invoice #${selectedInvoice.invoiceNumber}`
            : 'Choose an invoice to reconcile';

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-[#0f172a]/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90dvh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header — always visible, never scrolls */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center flex-shrink-0 rounded-t-2xl sm:rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-teal-600" />
                            Record Payment
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{headerSubtitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Blocked states */}
                {noInvoicesAtAll && (
                    <BlockedState
                        icon={<Banknote className="w-6 h-6 text-gray-400" />}
                        title="No invoices to record payment for"
                        body="All your invoices are either drafts, void, or fully paid. Create or send an invoice first."
                        onClose={onClose}
                    />
                )}

                {isDraft && (
                    <BlockedState
                        icon={<FileX className="w-6 h-6 text-gray-400" />}
                        title="Draft invoice"
                        body="Payments can only be recorded on sent or issued invoices, not drafts."
                        onClose={onClose}
                    />
                )}

                {isAlreadyPaid && (
                    <BlockedState
                        icon={<CheckCircle className="w-6 h-6 text-teal-500" />}
                        title="Invoice is fully paid"
                        body={`Invoice #${invoice!.invoiceNumber} has no remaining balance. Nothing to record.`}
                        onClose={onClose}
                    />
                )}

                {/* Form — shown only when there's something actionable */}
                {!noInvoicesAtAll && !isDraft && !isAlreadyPaid && (
                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                                <X className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Invoice selector — only in bulk mode */}
                        {!invoice && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Invoice</label>
                                <select
                                    value={selectedInvoiceId}
                                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition font-medium text-gray-900"
                                >
                                    {availableInvoices.length === 0 ? (
                                        <option value="">No open invoices available</option>
                                    ) : (
                                        availableInvoices.map((e) => (
                                            <option key={e.id} value={e.id}>{formatInvoiceOption(e)}</option>
                                        ))
                                    )}
                                </select>
                                <p className="mt-1.5 text-xs text-gray-500">Only invoices with an outstanding balance are shown.</p>
                            </div>
                        )}

                        {/* Amount */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Amount Received</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    required
                                    min="0.01"
                                    step="0.01"
                                    max={outstandingBalance}
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    disabled={formDisabled}
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition font-medium disabled:opacity-60"
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-gray-500">
                                Remaining balance: <span className="font-semibold text-gray-700">₹{outstandingBalance.toLocaleString('en-IN')}</span>
                            </p>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Payment Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    disabled={formDisabled}
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition font-medium disabled:opacity-60"
                                />
                            </div>
                        </div>

                        {/* Payment method */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Payment Method</label>
                            <div className="grid grid-cols-3 sm:grid-cols-2 gap-2">
                                {METHOD_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setMethod(opt.value)}
                                        disabled={formDisabled}
                                        className={`px-2 py-2.5 text-xs sm:text-sm font-medium rounded-lg border transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 disabled:opacity-60 ${
                                            method === opt.value
                                                ? 'bg-teal-50 border-teal-500 text-teal-700 ring-1 ring-teal-500'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        {opt.value === 'bank_transfer' && <Banknote className="w-4 h-4 flex-shrink-0" />}
                                        {opt.value === 'card' && <CreditCard className="w-4 h-4 flex-shrink-0" />}
                                        {opt.value === 'upi' && <Smartphone className="w-4 h-4 flex-shrink-0" />}
                                        <span className="leading-tight text-center">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Notes <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                            <textarea
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={formDisabled}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition text-sm disabled:opacity-60"
                                placeholder="Transaction ID, reference number, etc."
                            />
                        </div>

                        {/* Submit — inside scroll area so it's always reachable */}
                        <div className="pt-1 pb-[env(safe-area-inset-bottom)]">
                            <button
                                type="submit"
                                disabled={loading || formDisabled}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 active:bg-teal-800 shadow-lg shadow-teal-500/30 transition disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                {loading ? 'Recording…' : 'Record Payment'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
}
