import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InvoiceCalculator } from '@/lib/financialMath';
import { InvoiceDocumentPreview } from '@/features/invoices/components/InvoiceDocumentPreview';

type AnyInvoice = Record<string, any>;
type AnySettings = Record<string, any>;

function ensurePrintWindow(existingWindow?: Window | null) {
    if (existingWindow && !existingWindow.closed) {
        return existingWindow;
    }

    return window.open('', '_blank', 'width=1100,height=900');
}

function writeLoadingState(printWindow: Window, title = 'Preparing invoice...') {
    printWindow.document.open();
    printWindow.document.write(`
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>${title}</title>
                <style>
                    body {
                        margin: 0;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: Inter, system-ui, sans-serif;
                        background: #f8fafc;
                        color: #0f172a;
                    }
                    .wrap { text-align: center; }
                    .muted { color: #64748b; font-size: 14px; margin-top: 8px; }
                </style>
            </head>
            <body>
                <div class="wrap">
                    <div>Preparing invoice PDF...</div>
                    <div class="muted">The print dialog will open automatically.</div>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
}

function buildPreviewInvoice(invoice: AnyInvoice, settings: AnySettings = {}) {
    const seller = invoice.seller || {};
    const buyer = invoice.buyer || {};

    return {
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        dueDate: invoice.dueDate,
        fromName: seller.name || settings.owner_name || settings.ownerName || settings.businessName || '',
        fromTitle: seller.title || '',
        fromAddress: seller.address || settings.address || '',
        fromGstin: seller.gstin || seller.taxId || settings.companyTaxId || settings.gstin || '',
        customerName: buyer.name || '',
        customerEmail: buyer.email || '',
        customerAddress: buyer.address || '',
        customerGstin: buyer.gstin || buyer.taxId || '',
        isGstRegistered: invoice.isGstRegistered !== false,
        isInterstate: invoice.gstType === 'igst' || Boolean(invoice.isInterstate),
        taxRate: Number(invoice.taxRate || 0),
        tdsRate: Number(invoice.tdsRate || 0),
        shipping: Number(invoice.shipping || 0),
        bankName: seller.bankName || settings.bankName || '',
        accountNumber: seller.accountNumber || settings.bankAccountNumber || '',
        ifscCode: seller.ifscCode || settings.bankIfsc || '',
        upiId: seller.upiId || settings.upiId || '',
        notes: invoice.notes || settings.invoiceNotes || '',
        terms: seller.terms || '',
        includeSignature: Boolean(seller.includeSignature),
        signatureName: seller.signatureName || '',
        type: invoice.type,
        items: invoice.items || [],
    };
}

function buildCalcResult(invoice: AnyInvoice, previewInvoice: ReturnType<typeof buildPreviewInvoice>) {
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    return InvoiceCalculator.calculate({
        line_items: items.map((item: any) => ({
            quantity: Number(item.quantity || 0),
            unit_price: Number(item.price || 0),
            tax_rate: previewInvoice.isGstRegistered ? Number(item.tax_rate ?? invoice.taxRate ?? 0) : 0,
            is_interstate: previewInvoice.isInterstate,
            discount: Number(item.discount_percent ?? item.discountPercent ?? item.discount ?? 0) > 0
                ? { type: 'percentage' as const, value: Number(item.discount_percent ?? item.discountPercent ?? item.discount ?? 0) }
                : undefined,
        })),
        document_discount: Number(invoice.discountAmount || invoice.discount || 0) > 0
            ? {
                type: 'flat' as const,
                value: Number(invoice.discountAmount || invoice.discount || 0),
            }
            : undefined,
        shipping_charges: Number(invoice.shipping || 0),
        tds_rate: Number(invoice.tdsRate || 0),
    });
}

export function openInvoicePrintWindow(title = 'Preparing invoice...') {
    const printWindow = ensurePrintWindow();
    if (!printWindow) {
        throw new Error('Unable to open print window. Please allow pop-ups for this site.');
    }

    writeLoadingState(printWindow, title);
    return printWindow;
}

export function printInvoiceDocument(invoice: AnyInvoice, settings: AnySettings = {}, existingWindow?: Window | null) {
    const previewInvoice = buildPreviewInvoice(invoice, settings);
    const calcResult = buildCalcResult(invoice, previewInvoice);
    const stylesheetTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((node) => node.outerHTML)
        .join('\n');

    const markup = renderToStaticMarkup(
        <div className="min-h-screen bg-[#f8fafc] p-6">
            <div className="max-w-[900px] mx-auto border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <InvoiceDocumentPreview
                    invoice={previewInvoice}
                    calcResult={calcResult}
                    discountLabel={Number(invoice.discountAmount || invoice.discount || 0) > 0 ? 'Discount' : undefined}
                />
            </div>
        </div>
    );

    const printWindow = ensurePrintWindow(existingWindow);
    if (!printWindow) {
        throw new Error('Unable to open print window. Please allow pop-ups for this site.');
    }

    const title = previewInvoice.invoiceNumber
        ? `Invoice_${previewInvoice.invoiceNumber}`
        : 'Invoice';

    printWindow.document.open();
    printWindow.document.write(`
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>${title}</title>
                ${stylesheetTags}
                <style>
                    body { margin: 0; background: #f8fafc; }
                    @page { size: A4; margin: 12mm; }
                    @media print {
                        body { background: white; }
                    }
                </style>
            </head>
            <body>${markup}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    const triggerPrint = () => {
        printWindow.print();
    };

    if (printWindow.document.readyState === 'complete') {
        setTimeout(triggerPrint, 150);
    } else {
        printWindow.addEventListener('load', () => setTimeout(triggerPrint, 150), { once: true });
    }
}
