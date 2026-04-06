import { api, API_URL } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { Invoice } from '@/types';

export const invoiceService = {
    getInvoices: (params?: { limit?: number; persona?: string }) => {
        let url = ENDPOINTS.INVOICES;
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.persona) queryParams.append('persona', params.persona);
        
        const queryString = queryParams.toString();
        if (queryString) url += `?${queryString}`;
        
        return api.get<Invoice[]>(url);
    },

    getInvoice: (id: string) => api.get<Invoice>(ENDPOINTS.INVOICE(id)),
    getInvoicePdfBlob: (id: string) => api.getBlob(ENDPOINTS.INVOICE_PDF(id)),

    saveInvoice: (invoice: Invoice) => {
        if (invoice.id) {
            return api.put<Invoice>(ENDPOINTS.INVOICE(invoice.id), invoice);
        }
        return api.post<Invoice>(ENDPOINTS.INVOICES, invoice);
    },

    deleteInvoice: (id: string) => api.delete<void>(ENDPOINTS.INVOICE(id)),

    duplicateInvoice: (id: string) => api.post<Invoice>(ENDPOINTS.INVOICE_DUPLICATE(id)),

    generateNumber: async () => {
        const res = await api.get<{ nextNumber: string }>(ENDPOINTS.INVOICE_NEXT_NUMBER);
        return res.nextNumber;
    },

    getDraftDefaults: () =>
        api.get<{
            nextNumber: string;
            defaults: {
                fromName: string;
                fromAddress: string;
                fromPan: string;
                fromGstin: string;
                notes: string;
                terms: string;
                currencyCode: string;
                taxLabel: string;
                dueDays: number;
                isGstRegistered: boolean;
                businessType: string;
            };
        }>('/invoices/defaults'),

    // Email Actions
    sendEmail: (invoiceId: string, to: string, pdfBase64?: string) =>
        api.post(ENDPOINTS.EMAIL_SEND_INVOICE, { invoiceId, to, pdfAttachment: pdfBase64 }),

    sendInvoice: (id: string, to: string, pdfBase64?: string | null) =>
        api.post(ENDPOINTS.INVOICE_SEND(id), { to, pdfAttachment: pdfBase64 }),

    sendReminder: (id: string, to: string, pdfBase64?: string | null) =>
        api.post(ENDPOINTS.INVOICE_REMINDER(id), { to, pdfAttachment: pdfBase64 }),

    getShareUrl: (token: string) => `${window.location.origin}/invoice/share/${token}`,

    getShareDownloadUrl: (token: string) => `${API_URL}${ENDPOINTS.INVOICE_SHARE(token)}`,
};
