import { api } from '../api/client';

export const analyticsService = {
    getDashboardStats: () => api.get('/dashboard-stats'), // Mounted at /api/dashboard-stats

    getRevenueTrends: (period: string = 'monthly') => api.get(`/analytics/revenue-trends?period=${period}`),

    getCustomerInsights: () => api.get('/analytics/customer-insights'),

    getProductPerformance: () => api.get('/analytics/product-performance'),

    getCashFlow: () => api.get('/analytics/cash-flow'),

    getHealthScore: () => api.get('/analytics/health-score'),

    getSafeToSpend: () => api.get('/analytics/safe-to-spend'),

    exportData: async (type: string = 'invoices') => {
        // This returns a blob/csv, not JSON. api client expects JSON by default.
        // We need to handle this manually or extend api client.
        // For now, let's use the fetch wrapper logic but handle blob.

        // Actually, let's just do a direct fetch here or add getBlob to api client.
        // Re-implementing logic for brevity:
        const token = localStorage.getItem('sb-access-token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${API_URL}/analytics/export?type=${type}`, { headers });
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
