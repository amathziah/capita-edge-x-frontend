import { api } from '../api/client';
import { Expense, Payment } from '../types';

export const expenseService = {
    getExpenses: () => api.get<Expense[]>('/expenses'),
    saveExpense: (expense: Expense) => api.post<{ id: string }>('/expenses', expense),
    deleteExpense: (id: string) => api.delete<void>(`/expenses/${id}`)
};

export const paymentService = {
    getPayments: () => api.get<Payment[]>('/payments'),
    savePayment: (payment: Payment) => api.post<{ id: string }>('/payments', payment),
    downloadReceipt: (paymentId: string) => api.getBlob(`/payments/download-receipt/${paymentId}`),
    reconcilePayment: (paymentId: string) => api.patch(`/payments/${paymentId}/reconcile`, {})
};

export const settingService = {
    getSettings: () => api.get<any>('/settings'),

    saveSetting: (key: string, value: string) => api.post('/settings', { key, value }),

    getInventorySettings: () => api.get<any>('/inventory/settings'),

    saveInventorySettings: (settings: any) => api.post('/inventory/settings', settings),

    testEmail: (smtp_user: string, smtp_pass: string) => api.post('/email/test-connection', { smtp_user, smtp_pass }),

    uploadLogo: (file: File) => {
        const formData = new FormData();
        formData.append('logo', file);
        return api.post<{ filename: string, url: string }>('/upload/logo', formData);
    }
};

export const complianceService = {
    getTasks: () => api.get<any[]>('/compliance'),
    saveTask: (task: any) => api.post<{ id: string }>('/compliance', task),
    updateTask: (id: string, updates: any) => api.put(`/compliance/${id}`, updates),
    deleteTask: (id: string) => api.delete(`/compliance/${id}`)
};

export const notificationService = {
    getNotifications: () => api.get<any[]>('/notifications')
};
