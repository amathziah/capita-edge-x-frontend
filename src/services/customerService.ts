import { api } from '../api/client';
import { Customer } from '../types';

export const customerService = {
    getCustomers: () => api.get<Customer[]>('/customers'),

    saveCustomer: (customer: Customer) => api.post<{ id: string }>('/customers', customer),

    deleteCustomer: (id: string) => api.delete<void>(`/customers/${id}`),

    getCustomerInsights: (id: string) => api.get<any>(`/customers/${id}/insights`),

    getCustomerInvoices: (id: string) => api.get<any[]>(`/customers/${id}/invoices`)
};
