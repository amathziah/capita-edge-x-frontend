import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Calendar, CreditCard, Banknote, Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import { Invoice, Payment } from '@/types';
import { dataService } from '@/shared/services/dataService';
import { useData } from '@/app/providers/DataContext';

interface RecordPaymentModalProps {
    invoice?: Invoice | null;
    invoices?: Invoice[];
    onClose: () => void;
    onSuccess: () => void | Promise<void>;
}

function getOutstandingBalance(invoice: Invoice) {
    const explicitBalance = invoice.balance_due ?? invoice.balanceDue;
    if (explicitBalance !== undefined && explicitBalance !== null) {
        return Math.max(Number(explicitBalance) || 0, 0);
    }

    const totalAmount = Number(invoice.netReceivable ?? (invoice as any).net_receivable ?? invoice.total ?? 0);
    const amountPaid = Number(invoice.amountPaid ?? (invoice as any).amount_paid ?? 0);
    return Math.max(totalAmount - amountPaid, 0);
}

function getAmountPaid(invoice: Invoice) {
    return Number(invoice.amountPaid ?? (invoice as any).amount_paid ?? 0);
}

function getTotalAmount(invoice: Invoice) {
    return Number(invoice.netReceivable ?? (invoice as any).net_receivable ?? invoice.total ?? 0);
}

function getCollectionStatus(invoice: Invoice, balanceDue: number) {
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
    const paymentStatus = balanceDue <= 0 ? 'paid' : amountPaid > 0 ? 'partially_paid' : 'unpaid';
    const collectionStatus = getCollectionStatus(invoice, balanceDue);
    const documentStatus = invoice.documentStatus || invoice.document_status || 'issued';
    const status = paymentStatus === 'paid'
        ? 'paid'
        : collectionStatus === 'overdue'
            ? 'overdue'
            : paymentStatus === 'partially_paid'
                ? 'partially_paid'
                : 'sent';

    return {
        ...invoice,
        amountPaid,
        amount_paid: amountPaid as any,
        balanceDue: balanceDue as any,
        balance_due: balanceDue as any,
        paymentStatus,
        payment_status: paymentStatus,
        collectionStatus,
        collection_status: collectionStatus,
        documentStatus,
        document_status: documentStatus,
        status,
        updatedAt: new Date().toISOString()
    };
}

function canRecordPayment(invoice: Invoice) {
    const status = (invoice.status || '').toLowerCase().trim();
    return status !== 'draft' && getOutstandingBalance(invoice) > 0;
}

function formatInvoiceOption(invoice: Invoice) {
    const customerName = invoice.buyer?.name || 'Unknown customer';
    const balance = getOutstandingBalance(invoice).toLocaleString('en-IN');
    return `${invoice.invoiceNumber} • ${customerName} • ₹${balance}`;
}

export default function RecordPaymentModal({ invoice, invoices = [], onClose, onSuccess }: RecordPaymentModalProps) {
    const { invoices: contextInvoices, payments: contextPayments, setData } = useData();
    const availableInvoices = useMemo(() => {
        if (invoice) return [invoice];
        return invoices.filter(canRecordPayment);
    }, [invoice, invoices]);

    const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoice?.id || availableInvoices[0]?.id || '');
    const selectedInvoice = useMemo(() => {
        if (invoice) return invoice;
        return availableInvoices.find((entry) => entry.id === selectedInvoiceId) || null;
    }, [invoice, availableInvoices, selectedInvoiceId]);

    const outstandingBalance = selectedInvoice ? getOutstandingBalance(selectedInvoice) : 0;
    const [amount, setAmount] = useState(outstandingBalance);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState<NonNullable<Payment['paymentMode']>>('bank_transfer');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (invoice?.id) {
            setSelectedInvoiceId(invoice.id);
            return;
        }

        if (!selectedInvoiceId || !availableInvoices.some((entry) => entry.id === selectedInvoiceId)) {
            setSelectedInvoiceId(availableInvoices[0]?.id || '');
        }
    }, [invoice?.id, availableInvoices, selectedInvoiceId]);

    useEffect(() => {
        setAmount(outstandingBalance);
        setError(null);
    }, [selectedInvoice?.id, outstandingBalance]);

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
        setLoading(true);
        setError(null);

        if (!selectedInvoice) {
            setError('Choose an invoice before recording payment.');
            setLoading(false);
            return;
        }

        if (outstandingBalance <= 0) {
            setError('This invoice is already fully paid.');
            setLoading(false);
            return;
        }

        if (Number(amount) - outstandingBalance > 0.009) {
            setError(`Amount exceeds the remaining balance of ₹${outstandingBalance.toLocaleString('en-IN')}.`);
            setLoading(false);
            return;
        }

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
            const updatedInvoice = buildUpdatedInvoice(selectedInvoice, Number(amount));

            setData({
                payments: [optimisticPayment, ...contextPayments.filter((entry) => entry.id !== optimisticPayment.id)],
                invoices: contextInvoices.map((entry) => entry.id === selectedInvoice.id ? updatedInvoice : entry)
            });

            await onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    const noAvailableInvoices = !selectedInvoice && !invoice;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#0f172a]/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-teal-600" />
                            Record Payment
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {selectedInvoice ? `Invoice #${selectedInvoice.invoiceNumber}` : 'Choose an invoice to reconcile'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                            <X className="w-4 h-4 mt-0.5 shrink-0" />
                            {error}
                        </div>
                    )}

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
                                    availableInvoices.map((entry) => (
                                        <option key={entry.id} value={entry.id}>
                                            {formatInvoiceOption(entry)}
                                        </option>
                                    ))
                                )}
                            </select>
                            <p className="mt-1.5 text-xs text-gray-500">
                                Only invoices with an outstanding balance are shown here.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Amount Received</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                max={outstandingBalance}
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                disabled={noAvailableInvoices}
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition font-medium disabled:opacity-60"
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-500">
                            Remaining balance: ₹{outstandingBalance.toLocaleString('en-IN')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Payment Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                disabled={noAvailableInvoices}
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition font-medium disabled:opacity-60"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Payment Method</label>
                        <div className="grid grid-cols-2 gap-2">
                            {METHOD_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setMethod(option.value)}
                                    disabled={noAvailableInvoices}
                                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all text-left flex items-center gap-2 disabled:opacity-60 ${method === option.value
                                        ? 'bg-teal-50 border-teal-500 text-teal-700 ring-1 ring-teal-500'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {option.value === 'bank_transfer' && <Banknote className="w-4 h-4" />}
                                    {option.value === 'card' && <CreditCard className="w-4 h-4" />}
                                    {option.value === 'upi' && <Smartphone className="w-4 h-4" />}
                                    {method === option.value && <CheckCircle className="w-3.5 h-3.5 ml-auto text-teal-600" />}
                                    <span className="truncate">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Notes (Optional)</label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={noAvailableInvoices}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition text-sm disabled:opacity-60"
                            placeholder="Transaction ID, reference, etc."
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || noAvailableInvoices}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-500/30 transition disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                            {loading ? 'Recording...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
