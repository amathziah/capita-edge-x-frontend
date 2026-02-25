import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Customer } from '../types';

export const customerService = {
    getCustomers: () => api.get<Customer[]>(ENDPOINTS.CUSTOMERS),

    saveCustomer: (customer: Customer) => api.post<{ id: string }>(ENDPOINTS.CUSTOMERS, customer),

    deleteCustomer: (id: string) => api.delete<void>(ENDPOINTS.CUSTOMER(id)),

    getCustomerInsights: (id: string) => api.get<any>(ENDPOINTS.CUSTOMER_INSIGHTS(id)),

    getCustomerInvoices: (id: string) => api.get<any[]>(ENDPOINTS.CUSTOMER_INVOICES(id))
};
