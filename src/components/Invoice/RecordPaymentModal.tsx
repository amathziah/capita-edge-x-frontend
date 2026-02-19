
import { useState } from 'react';
import { X, DollarSign, Calendar, CreditCard, Banknote, Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import { Invoice, Payment } from '../../types';
import { dataService } from '../../services/dataService';

interface RecordPaymentModalProps {
    invoice: Invoice;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RecordPaymentModal({ invoice, onClose, onSuccess }: RecordPaymentModalProps) {
    const [amount, setAmount] = useState(invoice.total - (invoice.amountPaid || 0)); // Default to remaining balance if we had it, else total
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState<Payment['method']>('bank_transfer');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const METHOD_OPTIONS: { label: string; value: Payment['method'] }[] = [
        { label: 'Bank Transfer', value: 'bank_transfer' },
        { label: 'Credit Card', value: 'card' },
        { label: 'Cash', value: 'cash' },
        { label: 'UPI', value: 'upi' },
        { label: 'Check', value: 'check' },
        { label: 'Other', value: 'other' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await dataService.savePayment({
                id: '', // New payment
                invoiceId: invoice.id,
                amount: Number(amount),
                date: date,
                method: method,
                notes: notes,
                status: 'completed'
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-teal-600" />
                            Record Payment
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Invoice #{invoice.invoiceNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                            <X className="w-4 h-4 mt-0.5 shrink-0" />
                            {error}
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
                                value={amount}
                                onChange={e => setAmount(Number(e.target.value))}
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Payment Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition font-medium"
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
                                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all text-left flex items-center gap-2 ${method === option.value
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
                            onChange={e => setNotes(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition text-sm"
                            placeholder="Transaction ID, reference, etc."
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-500/30 transition disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                            {loading ? 'Recording...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
