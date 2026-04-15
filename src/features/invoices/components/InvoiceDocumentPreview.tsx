import React from 'react';

type PreviewItem = {
    description?: string;
    quantity?: number;
    price?: number;
    discount?: number;
    discountPercent?: number;
    discount_percent?: number;
};

type PreviewForm = {
    invoiceNumber?: string;
    date?: string;
    dueDate?: string;
    fromName?: string;
    fromTitle?: string;
    fromAddress?: string;
    fromGstin?: string;
    customerName?: string;
    customerEmail?: string;
    customerAddress?: string;
    customerGstin?: string;
    isGstRegistered?: boolean;
    isInterstate?: boolean;
    taxRate?: number;
    tdsRate?: number;
    discount?: number;
    shipping?: number;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    paymentQrUrl?: string;
    notes?: string;
    terms?: string;
    includeSignature?: boolean;
    signatureName?: string;
    type?: string;
    items?: PreviewItem[];
};

function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

function numberToWords(num: number): string {
    num = Math.floor(num);
    if (num === 0) return 'Indian Rupee Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
        'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
        'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const cvt = (n: number): string => {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ` ${ones[n % 10]}` : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ` ${cvt(n % 100)}` : '');
        if (n < 100000) return cvt(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ` ${cvt(n % 1000)}` : '');
        if (n < 10000000) return cvt(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ` ${cvt(n % 100000)}` : '');
        return cvt(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ` ${cvt(n % 10000000)}` : '');
    };
    return `Indian Rupee ${cvt(num)}`;
}

function parseNonNegativeNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function formatInrAmount(value: unknown) {
    const amount = Number(value || 0);
    return amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function getLineAmount(item: PreviewItem) {
    const quantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const discountPercent = Number(item.discount_percent ?? item.discountPercent ?? item.discount ?? 0);
    const gross = quantity * price;
    return Math.max(gross - (gross * discountPercent) / 100, 0);
}

function getDocumentTitle(isGstRegistered: boolean, explicitType?: string) {
    const normalized = String(explicitType || '').toLowerCase();
    if (normalized === 'bill_of_supply') return 'BILL OF SUPPLY';
    if (normalized === 'credit_note') return 'CREDIT NOTE';
    if (normalized === 'debit_note') return 'DEBIT NOTE';
    return isGstRegistered ? 'INVOICE' : 'BILL OF SUPPLY';
}

function getGeneratedPaymentQrUrl(invoice: PreviewForm, amount: number) {
    if (!invoice.upiId) return '';
    const uri = `upi://pay?pa=${invoice.upiId}&pn=${encodeURIComponent(invoice.fromName || 'Business')}&am=${amount.toFixed(2)}&cu=INR`;
    return `https://quickchart.io/qr?size=160&text=${encodeURIComponent(uri)}`;
}

export function InvoiceDocumentPreview({
    invoice,
    calcResult,
    discountLabel,
}: {
    invoice: PreviewForm;
    calcResult: any;
    discountLabel?: string;
}) {
    const subtotal = parseFloat(calcResult.subtotal);
    const taxAmount = parseFloat(calcResult.total_tax);
    const discountAmt = parseFloat(calcResult.total_discount);
    const grandTotal = parseFloat(calcResult.grand_total);
    const netReceivable = parseFloat(calcResult.payable_amount);
    const tdsAmount = parseFloat(calcResult.tds_amount);
    const watchedShipping = parseFloat(calcResult.shipping_charges);
    const taxRate = parseNonNegativeNumber(invoice.taxRate, 0);
    const documentTitle = getDocumentTitle(!!invoice.isGstRegistered, invoice.type);
    const qrAmount = Number(tdsAmount > 0 ? netReceivable : grandTotal);
    const effectivePaymentQrUrl = invoice.paymentQrUrl || getGeneratedPaymentQrUrl(invoice, qrAmount);
    const paymentQrSourceLabel = invoice.paymentQrUrl
        ? 'Uploaded payment QR'
        : effectivePaymentQrUrl
            ? 'Generated from UPI ID'
            : '';

    const watchedItems = (invoice.items || []) as PreviewItem[];
    const hasItems = watchedItems.some(i => i.description);

    return (
        <div className="w-full bg-white">
            <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        {invoice.fromName
                            ? <p className="text-base font-bold text-gray-900">{invoice.fromName}</p>
                            : <p className="text-sm text-gray-300 italic">Your name</p>
                        }
                        {invoice.fromTitle && <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-1">{invoice.fromTitle}</p>}
                        {invoice.fromAddress && <p className="text-xs text-gray-500 mt-0.5">{invoice.fromAddress}</p>}
                        {invoice.fromGstin && <p className="text-xs text-gray-500 mt-0.5">GSTIN: {invoice.fromGstin}</p>}
                    </div>
                    <div className="min-w-0 sm:max-w-[11rem] sm:text-right">
                        <p className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 leading-none break-words">{documentTitle}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest break-all">{invoice.invoiceNumber}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 mb-5">
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Billed From</p>
                        {invoice.fromName
                            ? <p className="text-sm font-semibold text-gray-800">{invoice.fromName}</p>
                            : <p className="text-xs text-gray-300 italic">—</p>
                        }
                        {invoice.fromAddress && <p className="text-xs text-gray-500 mt-0.5">{invoice.fromAddress}</p>}
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</p>
                        {invoice.customerName ? (
                            <>
                                <p className="text-sm font-semibold text-gray-800">{invoice.customerName}</p>
                                {invoice.customerEmail && <p className="text-xs text-gray-500 mt-0.5">{invoice.customerEmail}</p>}
                                {invoice.customerAddress && <p className="text-xs text-gray-500 mt-0.5">{invoice.customerAddress}</p>}
                                {invoice.customerGstin && <p className="text-xs text-gray-500 mt-0.5">GSTIN: {invoice.customerGstin}</p>}
                            </>
                        ) : (
                            <p className="text-xs text-gray-300 italic">Select a client…</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 mb-5 pb-4 border-b border-gray-100">
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Invoice Date</p>
                        <p className="text-sm font-bold text-gray-800">{fmtDate(invoice.date)}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
                        <p className="text-sm font-bold text-gray-800">{fmtDate(invoice.dueDate)}</p>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
                    <div className="hidden sm:grid grid-cols-12 bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <div className="col-span-6 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Description</div>
                        <div className="col-span-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center">Qty</div>
                        <div className="col-span-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-right">Rate</div>
                        <div className="col-span-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</div>
                    </div>
                    {!hasItems ? (
                        <div className="py-6 text-center">
                            <p className="text-xs text-gray-300 italic">No items added yet</p>
                        </div>
                    ) : (
                        <>
                            <div className="sm:hidden divide-y divide-gray-100">
                                {watchedItems.map((item, i) => item.description ? (
                                    <div key={i} className="px-4 py-3 space-y-2">
                                        <div className="text-sm font-semibold text-gray-800 break-words">{item.description}</div>
                                        <div className="grid grid-cols-3 gap-3 text-[11px]">
                                            <div>
                                                <p className="text-gray-400 uppercase tracking-wide">Qty</p>
                                                <p className="mt-1 font-medium text-gray-700">{item.quantity}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 uppercase tracking-wide">Rate</p>
                                                <p className="mt-1 font-medium text-gray-700 tabular-nums break-all">₹{formatInrAmount(item.price || 0)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-gray-400 uppercase tracking-wide">Amount</p>
                                                <p className="mt-1 font-semibold text-gray-800 tabular-nums break-all">₹{formatInrAmount(getLineAmount(item))}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null)}
                            </div>
                            <div className="hidden sm:block">
                                {watchedItems.map((item, i) => item.description ? (
                                    <div key={i} className="grid grid-cols-12 px-4 py-2.5 border-b border-gray-100 last:border-0">
                                        <div className="col-span-6 text-xs font-medium text-gray-800 break-words">{item.description}</div>
                                        <div className="col-span-2 text-xs text-gray-500 text-center">{item.quantity}</div>
                                        <div className="col-span-2 text-xs text-gray-500 text-right tabular-nums break-all">₹{formatInrAmount(item.price || 0)}</div>
                                        <div className="col-span-2 text-xs font-semibold text-gray-800 text-right tabular-nums break-all">
                                            ₹{formatInrAmount(getLineAmount(item))}
                                        </div>
                                    </div>
                                ) : null)}
                            </div>
                        </>
                    )}
                </div>

                <div className="ml-auto w-full max-w-[18rem] space-y-1.5 mb-1">
                    <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Subtotal</span>
                        <span className="text-xs font-medium text-gray-700 tabular-nums break-all text-right max-w-[10rem]">₹{formatInrAmount(subtotal)}</span>
                    </div>
                    {invoice.isGstRegistered && (
                        <>
                            {invoice.isInterstate ? (
                                <div className="flex justify-between">
                                    <span className="text-xs text-gray-400">IGST ({taxRate}%)</span>
                                    <span className="text-xs font-medium text-gray-700 tabular-nums break-all text-right max-w-[10rem]">₹{formatInrAmount(taxAmount)}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-400">CGST ({(taxRate / 2).toFixed(2)}%)</span>
                                        <span className="text-xs font-medium text-gray-700 tabular-nums break-all text-right max-w-[10rem]">₹{formatInrAmount(taxAmount / 2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-400">SGST ({(taxRate / 2).toFixed(2)}%)</span>
                                        <span className="text-xs font-medium text-gray-700 tabular-nums break-all text-right max-w-[10rem]">₹{formatInrAmount(taxAmount / 2)}</span>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                    {discountAmt > 0 && (
                        <div className="flex justify-between">
                            <span className="text-xs text-red-400">{discountLabel || 'Discount'}</span>
                            <span className="text-xs font-medium text-red-400 tabular-nums break-all text-right max-w-[10rem]">−₹{formatInrAmount(discountAmt)}</span>
                        </div>
                    )}
                    {watchedShipping > 0 && (
                        <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Shipping</span>
                            <span className="text-xs font-medium text-gray-700 tabular-nums break-all text-right max-w-[10rem]">₹{formatInrAmount(watchedShipping)}</span>
                        </div>
                    )}
                    {tdsAmount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-xs text-amber-500 font-medium">TDS ({invoice.tdsRate || 0}%)</span>
                            <span className="text-xs font-medium text-amber-500 tabular-nums break-all text-right max-w-[10rem]">−₹{formatInrAmount(tdsAmount)}</span>
                        </div>
                    )}
                    <div className="border-t-2 border-gray-900 pt-2 flex justify-between items-baseline">
                        <span className="text-sm font-bold text-gray-900">Total</span>
                        <span className="text-xl font-black text-emerald-600 leading-tight tabular-nums break-all text-right max-w-[10rem]">₹{formatInrAmount(grandTotal)}</span>
                    </div>
                    {tdsAmount > 0 && (
                        <div className="flex justify-between pt-1">
                            <span className="text-xs text-amber-500 font-medium">You Receive</span>
                            <span className="text-sm font-bold text-amber-500 tabular-nums break-all text-right max-w-[10rem]">₹{formatInrAmount(netReceivable)}</span>
                        </div>
                    )}
                    <p className="text-right text-[10px] text-gray-400 italic leading-tight break-words">
                        {numberToWords(Math.floor(netReceivable))}
                    </p>
                </div>

                {(invoice.bankName || invoice.upiId || effectivePaymentQrUrl) && (
                    <div className="mt-8 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Payment Instructions</p>
                        <div className="grid grid-cols-1 gap-4 items-start sm:grid-cols-[minmax(0,1fr)_auto]">
                            <div className="space-y-2">
                                {invoice.bankName && (
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Bank Transfer</p>
                                        <p className="text-[11px] font-bold text-gray-800 break-words">{invoice.bankName}</p>
                                        <p className="text-[10px] text-gray-500 break-all">A/C: {invoice.accountNumber}</p>
                                        <p className="text-[10px] text-gray-500 break-all">IFSC: {invoice.ifscCode}</p>
                                    </div>
                                )}
                                {invoice.upiId && (
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">UPI Payment</p>
                                        <p className="text-[11px] font-bold text-emerald-600 break-all">{invoice.upiId}</p>
                                    </div>
                                )}
                            </div>
                            {effectivePaymentQrUrl && (
                                <div className="text-center sm:justify-self-end">
                                    <img src={effectivePaymentQrUrl} alt="Payment QR" className="mx-auto h-24 w-24 sm:w-28 sm:h-28 object-contain rounded-lg border border-gray-200 bg-white p-2" />
                                    <p className="text-[9px] text-gray-400 font-medium mt-2">Scan to Pay</p>
                                    {paymentQrSourceLabel && <p className="text-[9px] text-gray-400 mt-1">{paymentQrSourceLabel}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {invoice.notes && (
                    <div className="mt-5 pt-4 border-t border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Notes</p>
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{invoice.notes}</p>
                    </div>
                )}

                {invoice.terms && (
                    <div className="mt-3">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Terms & Conditions</p>
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{invoice.terms}</p>
                    </div>
                )}

                {invoice.includeSignature && (
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-start sm:justify-end">
                        <div className="w-full max-w-[10rem] text-center">
                            <p className="text-lg text-gray-700 italic" style={{ fontFamily: '"Times New Roman", serif' }}>
                                {invoice.signatureName || invoice.fromName || 'Signature'}
                            </p>
                            <div className="border-t border-gray-400 pt-1 mt-2">
                                <p className="text-[9px] text-gray-400 font-medium">Authorised Signature</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
