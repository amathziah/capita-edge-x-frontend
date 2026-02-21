import { api } from '../api/client';
import { Invoice } from '../types';

export const invoiceService = {
    getInvoices: () => api.get<Invoice[]>('/invoices'),

    getInvoice: (id: string) => api.get<Invoice>(`/invoices/${id}`),

    saveInvoice: (invoice: Invoice) => api.post<{ id: string }>('/invoices', invoice),

    deleteInvoice: (id: string) => api.delete<void>(`/invoices/${id}`),

    duplicateInvoice: (id: string) => api.post<Invoice>(`/invoices/${id}/duplicate`),

    generateNumber: async () => {
        const res = await api.get<{ nextNumber: string }>('/invoices/next-number');
        return res.nextNumber;
    },

    // Email Actions
    sendEmail: (invoiceId: string, to: string, pdfBase64?: string) =>
        api.post('/email/send-invoice', { invoiceId, to, pdfAttachment: pdfBase64 }), // Note: route might need checking if it was moved to /api/invoices/:id/send in backend?
    // Backend refactor put it at `invoiceRoutes.post('/:id/send', ...)` -> `/api/invoices/:id/send`
    // BUT legacy `server.js` had `/api/email/send-invoice`.
    // My backend refactor might have changed this if I wasn't careful.
    // Let's check `invoiceController.js`. It has `sendInvoiceEmail`. 
    // And `invoiceRoutes.js` mounts it at `/:id/send` -> `/api/invoices/:id/send`.
    // If I want to match the NEW backend structure, I should use `/invoices/${id}/send`.
    // If I want to verify what I deployed in server.js...
    // I deployed `invoiceRoutes` at `/api/invoices`.
    // So `router.post('/:id/send')` is `/api/invoices/:id/send`.
    // I should update this service to match that NEW structure.
    // The old `dataService` used `/email/send-invoice`.
    // I must make sure the backend supports that OR update frontend here.
    // Since I am updating frontend now, I will use the NEW Clean path.

    sendInvoice: (id: string, to: string, pdfBase64?: string | null) =>
        api.post(`/invoices/${id}/send`, { to, pdfAttachment: pdfBase64 }),

    sendReminder: (id: string, to: string, pdfBase64?: string | null) =>
        api.post(`/invoices/${id}/reminder`, { to, pdfAttachment: pdfBase64 }),

    getShareUrl: (token: string) => {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        return `${baseUrl}/invoices/share/${token}`;
    }
};
