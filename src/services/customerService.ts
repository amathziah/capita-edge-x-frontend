import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Customer } from '../types';

export const customerService = {
    getCustomers: (params?: { limit?: number; offset?: number }) => {
        let url = ENDPOINTS.CUSTOMERS;
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());
        
        const queryString = queryParams.toString();
        if (queryString) url += `?${queryString}`;
        
        return api.get<Customer[]>(url);
    },

    saveCustomer: (customer: Customer) => api.post<Customer>(ENDPOINTS.CUSTOMERS, customer),

    deleteCustomer: (id: string) => api.delete<void>(ENDPOINTS.CUSTOMER(id)),

    getCustomerInsights: (id: string) => api.get<any>(ENDPOINTS.CUSTOMER_INSIGHTS(id)),

    getCustomerInvoices: (id: string) => api.get<any[]>(ENDPOINTS.CUSTOMER_INVOICES(id))
};
