import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { Expense, Payment } from '@/types';

export const expenseService = {
    getExpenses: (params?: { limit?: number }) => {
        let url = ENDPOINTS.EXPENSES;
        if (params?.limit) url += `?limit=${params.limit}`;
        return api.get<Expense[]>(url);
    },
    saveExpense: (expense: Expense) => api.post<{ id: string }>(ENDPOINTS.EXPENSES, expense),
    deleteExpense: (id: string) => api.delete<void>(ENDPOINTS.EXPENSE(id))
};

export const paymentService = {
    getPayments: (params?: { limit?: number }) => {
        let url = ENDPOINTS.PAYMENTS;
        if (params?.limit) url += `?limit=${params.limit}`;
        return api.get<Payment[]>(url);
    },
    savePayment: (payment: Payment) => api.post<{ id: string }>(ENDPOINTS.PAYMENTS, payment),
    downloadReceipt: (paymentId: string) => api.getBlob(ENDPOINTS.PAYMENT_RECEIPT(paymentId)),
    reconcilePayment: (paymentId: string) => api.patch(ENDPOINTS.PAYMENT_RECONCILE(paymentId), {})
};

export const settingService = {
    getSettings: () => api.get<any>(ENDPOINTS.SETTINGS),

    saveSetting: (key: string, value: string) => api.post(ENDPOINTS.SETTINGS, { key, value }),

    getInventorySettings: () => api.get<any>(ENDPOINTS.INVENTORY_SETTINGS),

    saveInventorySettings: (settings: any) => api.post(ENDPOINTS.INVENTORY_SETTINGS, settings),

    testEmail: (smtp_user: string, smtp_pass: string) => api.post(ENDPOINTS.EMAIL_TEST, { smtp_user, smtp_pass }),

    uploadLogo: (file: File) => {
        const formData = new FormData();
        formData.append('logo', file);
        return api.post<{ filename: string, url: string }>(ENDPOINTS.UPLOAD_LOGO, formData);
    },

    uploadPaymentQr: (file: File) => {
        const formData = new FormData();
        formData.append('paymentQr', file);
        return api.post<{ filename: string, url: string }>(ENDPOINTS.UPLOAD_PAYMENT_QR, formData);
    }
};

export const complianceService = {
    getTasks: () => api.get<any[]>(ENDPOINTS.COMPLIANCE),
    saveTask: (task: any) => api.post<{ id: string }>(ENDPOINTS.COMPLIANCE, task),
    updateTask: (id: string, updates: any) => api.put(ENDPOINTS.COMPLIANCE_TASK(id), updates),
    deleteTask: (id: string) => api.delete(ENDPOINTS.COMPLIANCE_TASK(id))
};

export const notificationService = {
    getNotifications: () => api.get<any[]>(ENDPOINTS.NOTIFICATIONS)
};

export const reportService = {
    getReports: () => api.get<any[]>(ENDPOINTS.REPORTS),
    createReport: (report: any) => api.post<{ success: boolean, report: any }>(ENDPOINTS.REPORTS, report)
};
