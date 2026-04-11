import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Mail, Building2, Loader2, AlertCircle } from 'lucide-react';
import { API_URL } from '@/shared/api/client';
import { InvoiceDocumentPreview } from '@/features/invoices/components/InvoiceDocumentPreview';

interface SharedInvoicePayload {
  invoice: any;
  settings: {
    businessName: string;
    ownerName: string;
    businessType: string;
    companyTaxId: string;
    email: string;
    phone: string;
    address: string;
    paymentInstructions: string;
    invoiceNotes: string;
    upiId: string;
    bankName: string;
    bankAccountNumber: string;
    bankIfsc: string;
    bankDetails: string;
    logoUrl: string | null;
    paymentQrUrl: string | null;
  };
  actions: {
    downloadUrl: string;
  };
}

function getTheme(type?: string) {
  switch (type) {
    case 'subscription':
      return {
        shell: 'bg-[linear-gradient(180deg,#eef2ff_0%,#e0e7ff_100%)]',
        hero: 'bg-[#312e81] text-[#eef2ff]',
        heroMuted: 'text-[#c7d2fe]',
        cardBorder: 'border-[#c7d2fe]',
        cardBg: 'bg-white',
        accentText: 'text-[#312e81]',
        softBg: 'bg-[#eef2ff]',
        softBorder: 'border-[#c7d2fe]',
        muted: 'text-[#6366f1]',
        body: 'text-[#374151]',
      };
    case 'ecommerce':
      return {
        shell: 'bg-[linear-gradient(180deg,#fffbeb_0%,#fef3c7_100%)]',
        hero: 'bg-[#92400e] text-[#fffbeb]',
        heroMuted: 'text-[#fde68a]',
        cardBorder: 'border-[#fcd34d]',
        cardBg: 'bg-white',
        accentText: 'text-[#92400e]',
        softBg: 'bg-[#fffbeb]',
        softBorder: 'border-[#fcd34d]',
        muted: 'text-[#d97706]',
        body: 'text-[#451a03]',
      };
    case 'services_firm':
    case 'ca_firm':
      return {
        shell: 'bg-[linear-gradient(180deg,#f0fdfa_0%,#ccfbf1_100%)]',
        hero: 'bg-[#134e4a] text-[#f0fdfa]',
        heroMuted: 'text-[#99f6e4]',
        cardBorder: 'border-[#99f6e4]',
        cardBg: 'bg-white',
        accentText: 'text-[#134e4a]',
        softBg: 'bg-[#f0fdfa]',
        softBorder: 'border-[#99f6e4]',
        muted: 'text-[#0f766e]',
        body: 'text-[#134e4a]',
      };
    case 'solopreneur':
    default:
      return {
        shell: 'bg-[linear-gradient(180deg,#ecfdf5_0%,#d1fae5_100%)]',
        hero: 'bg-[#065f46] text-[#ecfdf5]',
        heroMuted: 'text-[#a7f3d0]',
        cardBorder: 'border-[#a7f3d0]',
        cardBg: 'bg-white',
        accentText: 'text-[#065f46]',
        softBg: 'bg-[#ecfdf5]',
        softBorder: 'border-[#a7f3d0]',
        muted: 'text-[#059669]',
        body: 'text-[#1f2937]',
      };
  }
}

function getDocumentTitle(invoice: any) {
  const explicitType = String(invoice?.type || '').toLowerCase();
  if (explicitType === 'bill_of_supply') return 'Bill of Supply';
  if (explicitType === 'credit_note') return 'Credit Note';
  if (explicitType === 'debit_note') return 'Debit Note';
  if (explicitType === 'delivery_challan') return 'Delivery Challan';
  return invoice?.isGstRegistered === false ? 'Bill of Supply' : 'Invoice';
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

  const theme = useMemo(() => getTheme(data?.settings.businessType || data?.invoice.persona), [data]);

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.shell} flex items-center justify-center`}>
        <div className={`flex items-center gap-3 ${theme.accentText} font-semibold`}>
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading invoice...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-screen ${theme.shell} flex items-center justify-center px-6`}>
        <div className={`max-w-md w-full ${theme.cardBg} rounded-3xl shadow-xl border ${theme.cardBorder} p-8 text-center`}>
          <AlertCircle className={`w-10 h-10 ${theme.muted} mx-auto mb-4`} />
          <h1 className={`text-2xl font-bold ${theme.accentText} mb-2`}>Invoice unavailable</h1>
          <p className={theme.body}>{error || 'This invoice could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const { invoice, settings, actions } = data;
  const documentTitle = getDocumentTitle(invoice);
  const seller = invoice.seller || {};
  const calcResult = {
    subtotal: String(Number(invoice.subtotal || 0)),
    total_tax: String(Number(invoice.taxAmount || 0)),
    total_discount: String(Number(invoice.discountAmount || invoice.discount || 0)),
    grand_total: String(Number(invoice.total || 0)),
    payable_amount: String(Number(invoice.netReceivable || invoice.total || 0)),
    tds_amount: String(Number(invoice.tdsAmount || 0)),
    shipping_charges: String(Number(invoice.shipping || 0)),
  };

  return (
    <div className={`min-h-screen ${theme.shell} px-4 py-8`}>
      <div className="max-w-5xl mx-auto">
        <div className={`${theme.hero} rounded-[28px] p-6 mb-6 shadow-[0_20px_60px_rgba(15,23,42,0.16)]`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.businessName} className="w-16 h-16 rounded-2xl bg-white object-contain p-2" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8" />
                </div>
              )}
              <div>
                <p className={`text-sm uppercase tracking-[0.2em] ${theme.heroMuted}`}>{documentTitle}</p>
                <h1 className="text-3xl font-black tracking-tight">{settings.businessName}</h1>
                <p className={`${theme.heroMuted} mt-1`}>{invoice.invoiceNumber}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={actions.downloadUrl}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white ${theme.accentText} font-semibold hover:opacity-95 transition`}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
              {settings.email && (
                <a
                  href={`mailto:${settings.email}?subject=${documentTitle} ${invoice.invoiceNumber}`}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/20 text-white font-semibold hover:bg-white/10 transition`}
                >
                  <Mail className="w-4 h-4" />
                  Contact sender
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.6fr_0.8fr] gap-6">
          <div className={`${theme.cardBg} rounded-[28px] shadow-xl border ${theme.cardBorder} overflow-hidden`}>
            <InvoiceDocumentPreview
              invoice={{
                invoiceNumber: invoice.invoiceNumber,
                date: invoice.date,
                dueDate: invoice.dueDate,
                fromName: seller.name || settings.ownerName || settings.businessName,
                fromTitle: seller.title || '',
                fromAddress: seller.address || settings.address || '',
                fromGstin: seller.gstin || seller.taxId || settings.companyTaxId || '',
                customerName: invoice.buyer?.name || '',
                customerEmail: invoice.buyer?.email || '',
                customerAddress: invoice.buyer?.address || '',
                customerGstin: invoice.buyer?.gstin || '',
                isGstRegistered: invoice.isGstRegistered !== false,
                isInterstate: invoice.gstType === 'igst' || Boolean(invoice.isInterstate),
                taxRate: invoice.taxRate || 0,
                tdsRate: invoice.tdsRate || 0,
                shipping: invoice.shipping || 0,
                bankName: seller.bankName || settings.bankName || '',
                accountNumber: seller.accountNumber || settings.bankAccountNumber || '',
                ifscCode: seller.ifscCode || settings.bankIfsc || '',
                upiId: seller.upiId || settings.upiId || '',
                paymentQrUrl: settings.paymentQrUrl || '',
                notes: invoice.notes || settings.invoiceNotes || '',
                terms: seller.terms || '',
                includeSignature: Boolean(seller.includeSignature),
                signatureName: seller.signatureName || '',
                type: invoice.type,
                items: invoice.items || [],
              }}
              calcResult={calcResult}
              discountLabel={Number(invoice.discountAmount || invoice.discount || 0) > 0 ? 'Discount' : undefined}
            />
          </div>

          {settings.email && (
            <div className="space-y-6">
              <div className={`${theme.cardBg} rounded-[28px] shadow-xl border ${theme.cardBorder} p-6`}>
                <p className={`text-xs uppercase tracking-[0.2em] ${theme.muted} mb-4`}>Contact sender</p>
                <div className={`space-y-3 text-sm ${theme.body}`}>
                  <div className="flex items-start gap-3">
                    <Mail className={`w-4 h-4 mt-0.5 ${theme.muted}`} />
                    <span>{settings.email}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
