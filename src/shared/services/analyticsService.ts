import { api, API_URL } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

export const analyticsService = {
    getDashboardStats: () => api.get(ENDPOINTS.DASHBOARD_STATS),

    getRevenueTrends: (period: string = 'monthly') => api.get(`${ENDPOINTS.ANALYTICS_REVENUE}?period=${period}`),

    getCustomerInsights: () => api.get(ENDPOINTS.ANALYTICS_CUSTOMER),

    getProductPerformance: () => api.get(ENDPOINTS.ANALYTICS_PRODUCT),

    getCashFlow: () => api.get(ENDPOINTS.ANALYTICS_CASH_FLOW),

    getHealthScore: () => api.get(ENDPOINTS.ANALYTICS_HEALTH),

    getSafeToSpend: () => api.get(ENDPOINTS.ANALYTICS_SAFE_TO_SPEND),

    getPersonaStats: (persona: string) => api.get(`${ENDPOINTS.ANALYTICS_PERSONA}?persona=${persona}`),

    exportData: async (type: string = 'invoices') => {
        const token = localStorage.getItem('sb-access-token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}${ENDPOINTS.ANALYTICS_EXPORT}?type=${type}`, { headers });
        if (!res.ok) throw new Error('Failed to export');

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
};
