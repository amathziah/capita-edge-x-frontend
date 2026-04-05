import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Mail, Phone, MapPin, Building2, Loader2, AlertCircle } from 'lucide-react';
import { API_URL } from '../api/client';

interface SharedInvoicePayload {
  invoice: any;
  settings: {
    businessName: string;
    email: string;
    phone: string;
    address: string;
    paymentInstructions: string;
    upiId: string;
    bankDetails: string;
    logoUrl: string | null;
  };
  actions: {
    downloadUrl: string;
  };
}

export function SharedInvoicePage() {
  const { token } = useParams();
  const [data, setData] = useState<SharedInvoicePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/invoices/share/${token}/details`);
        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Invoice link is invalid or expired.' : 'Failed to load invoice.');
        }
        const payload = await response.json();
        if (!cancelled) setData(payload);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load invoice.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (token) load();
    else {
      setError('Missing invoice token.');
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#21312b] font-semibold">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading invoice...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#e7e0d4] p-8 text-center">
          <AlertCircle className="w-10 h-10 text-[#c75c3a] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#21312b] mb-2">Invoice unavailable</h1>
          <p className="text-[#5d6a63]">{error || 'This invoice could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const { invoice, settings, actions } = data;
  const buyer = invoice.buyer || {};
  const items = invoice.items || [];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f1ea_0%,#efe8dc_100%)] px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-[#21312b] text-[#f4f1ea] rounded-[28px] p-6 mb-6 shadow-[0_20px_60px_rgba(33,49,43,0.2)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.businessName} className="w-16 h-16 rounded-2xl bg-white object-contain p-2" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#f4f1ea]/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8" />
                </div>
              )}
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#d6cbb8]">Invoice from</p>
                <h1 className="text-3xl font-black tracking-tight">{settings.businessName}</h1>
                <p className="text-[#d6cbb8] mt-1">Invoice {invoice.invoiceNumber}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={actions.downloadUrl}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#f4f1ea] text-[#21312b] font-semibold hover:bg-white transition"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
              {buyer.email && (
                <a
                  href={`mailto:${settings.email || buyer.email}?subject=Invoice ${invoice.invoiceNumber}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-[#d6cbb8]/30 text-[#f4f1ea] font-semibold hover:bg-[#2a3d35] transition"
                >
                  <Mail className="w-4 h-4" />
                  Contact sender
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.6fr_0.8fr] gap-6">
          <div className="bg-white rounded-[28px] shadow-xl border border-[#e7e0d4] p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-6 pb-6 border-b border-[#eee5d8]">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8b8a84] mb-2">Bill to</p>
                <p className="text-lg font-bold text-[#21312b]">{buyer.name || 'Customer'}</p>
                {buyer.email && <p className="text-[#5d6a63] mt-1">{buyer.email}</p>}
                {buyer.phone && <p className="text-[#5d6a63]">{buyer.phone}</p>}
                {buyer.address && <p className="text-[#5d6a63] mt-1 whitespace-pre-line">{buyer.address}</p>}
              </div>
              <div className="md:text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8b8a84] mb-2">Details</p>
                <p className="text-[#21312b]"><span className="font-semibold">Issue date:</span> {invoice.date}</p>
                <p className="text-[#21312b]"><span className="font-semibold">Due date:</span> {invoice.dueDate}</p>
                <p className="text-[#21312b]"><span className="font-semibold">Status:</span> {invoice.status}</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[#eee5d8]">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[#f9f6f0] text-xs font-bold uppercase tracking-[0.2em] text-[#8b8a84]">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              {items.map((item: any, index: number) => (
                <div key={item.id || index} className="grid grid-cols-12 gap-2 px-4 py-4 border-t border-[#eee5d8] text-sm">
                  <div className="col-span-6 text-[#21312b] font-medium">{item.description}</div>
                  <div className="col-span-2 text-center text-[#5d6a63]">{item.quantity}</div>
                  <div className="col-span-2 text-right text-[#5d6a63]">₹{Number(item.price || 0).toFixed(2)}</div>
                  <div className="col-span-2 text-right font-semibold text-[#21312b]">₹{(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {invoice.notes && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8b8a84] mb-2">Notes</p>
                <p className="text-[#5d6a63] whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[28px] shadow-xl border border-[#e7e0d4] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8b8a84] mb-4">Summary</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#5d6a63]">
                  <span>Subtotal</span>
                  <span>₹{Number(invoice.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#5d6a63]">
                  <span>Tax</span>
                  <span>₹{Number(invoice.taxAmount || 0).toFixed(2)}</span>
                </div>
                {Number(invoice.shipping || 0) > 0 && (
                  <div className="flex justify-between text-[#5d6a63]">
                    <span>Shipping</span>
                    <span>₹{Number(invoice.shipping || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-[#eee5d8] flex justify-between text-lg font-bold text-[#21312b]">
                  <span>Total</span>
                  <span>₹{Number(invoice.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[28px] shadow-xl border border-[#e7e0d4] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8b8a84] mb-4">Sender details</p>
              <div className="space-y-3 text-sm text-[#5d6a63]">
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 mt-0.5 text-[#8b8a84]" />
                  <span>{settings.businessName}</span>
                </div>
                {settings.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 mt-0.5 text-[#8b8a84]" />
                    <span>{settings.email}</span>
                  </div>
                )}
                {settings.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 mt-0.5 text-[#8b8a84]" />
                    <span>{settings.phone}</span>
                  </div>
                )}
                {settings.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-0.5 text-[#8b8a84]" />
                    <span className="whitespace-pre-line">{settings.address}</span>
                  </div>
                )}
              </div>
            </div>

            {(settings.paymentInstructions || settings.bankDetails || settings.upiId) && (
              <div className="bg-white rounded-[28px] shadow-xl border border-[#e7e0d4] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8b8a84] mb-4">Payment instructions</p>
                <div className="space-y-3 text-sm text-[#5d6a63]">
                  {settings.paymentInstructions && <p>{settings.paymentInstructions}</p>}
                  {settings.upiId && <p><span className="font-semibold text-[#21312b]">UPI:</span> {settings.upiId}</p>}
                  {settings.bankDetails && <p className="whitespace-pre-line">{settings.bankDetails}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
