import { api, API_URL } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Invoice } from '../types';

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

    saveInvoice: (invoice: Invoice) => api.post<{ id: string }>(ENDPOINTS.INVOICES, invoice),

    deleteInvoice: (id: string) => api.delete<void>(ENDPOINTS.INVOICE(id)),

    duplicateInvoice: (id: string) => api.post<Invoice>(ENDPOINTS.INVOICE_DUPLICATE(id)),

    generateNumber: async () => {
        const res = await api.get<{ nextNumber: string }>(ENDPOINTS.INVOICE_NEXT_NUMBER);
        return res.nextNumber;
    },

    // Email Actions
    sendEmail: (invoiceId: string, to: string, pdfBase64?: string) =>
        api.post(ENDPOINTS.EMAIL_SEND_INVOICE, { invoiceId, to, pdfAttachment: pdfBase64 }),

    sendInvoice: (id: string, to: string, pdfBase64?: string | null) =>
        api.post(ENDPOINTS.INVOICE_SEND(id), { to, pdfAttachment: pdfBase64 }),

    sendReminder: (id: string, to: string, pdfBase64?: string | null) =>
        api.post(ENDPOINTS.INVOICE_REMINDER(id), { to, pdfAttachment: pdfBase64 }),

    getShareUrl: (token: string) => {
        return `${API_URL}${ENDPOINTS.INVOICE_SHARE(token)}`;
    }
};
