import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Invoice, Payment, Customer, Expense, Product, ProductPerformance, ComplianceTask, DashboardStats } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from './AuthContext';
import { usePersona } from './PersonaContext';

interface DataState {
    invoices: Invoice[];
    payments: Payment[];
    customers: Customer[];
    expenses: Expense[];
    products: Product[];
    performance: ProductPerformance[];
    complianceTasks: ComplianceTask[];
    stats: DashboardStats;
    reports: any[];
    lastFetched: number | null;
}

interface DataContextType extends DataState {
    loading: boolean;
    refreshData: (force?: boolean) => Promise<void>;
    setData: (data: Partial<DataState>) => void;
    filteredInvoices: Invoice[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<DataState>({
        invoices: [],
        payments: [],
        customers: [],
        expenses: [],
        products: [],
        performance: [],
        complianceTasks: [],
        stats: { total_customers: 0 } as DashboardStats,
        reports: [],
        lastFetched: null,
    });
    const [loading, setLoading] = useState(false);
    const { orgId } = useAuth();
    const { businessType } = usePersona();

    // Clear state when user logs out or switches org
    useEffect(() => {
        if (!orgId) {
            setState({
                invoices: [],
                payments: [],
                customers: [],
                expenses: [],
                products: [],
                performance: [],
                complianceTasks: [],
                stats: { total_customers: 0 } as DashboardStats,
                reports: [],
                lastFetched: null,
            });
        }
    }, [orgId]);

    const refreshData = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && state.lastFetched && (now - state.lastFetched < CACHE_TTL)) {
            return;
        }

        try {
            setLoading(true);
            const [fetchedInvoices, fetchedStats, fetchedPayments, fetchedCustomers, fetchedExpenses, fetchedProducts, fetchedPerformance, fetchedCompliance, fetchedReports] = await Promise.all([
                dataService.getInvoices({ limit: 1000 }) as Promise<Invoice[]>,
                dataService.getDashboardStats() as Promise<DashboardStats>,
                dataService.getPayments({ limit: 1000 }) as Promise<Payment[]>,
                dataService.getCustomers() as Promise<Customer[]>,
                dataService.getExpenses() as Promise<Expense[]>,
                dataService.getProducts() as Promise<Product[]>,
                dataService.getProductPerformance().catch(() => []) as Promise<ProductPerformance[]>,
                dataService.getComplianceTasks() as Promise<ComplianceTask[]>,
                dataService.getReports() as Promise<any[]>
            ]);

            setState({
                invoices: fetchedInvoices || [],
                stats: fetchedStats || { total_customers: 0 },
                payments: fetchedPayments || [],
                customers: fetchedCustomers || [],
                expenses: fetchedExpenses || [],
                products: fetchedProducts || [],
                performance: fetchedPerformance || [],
                complianceTasks: fetchedCompliance || [],
                reports: fetchedReports || [],
                lastFetched: now,
            });
        } catch (error) {
            console.error("Error refreshing global data:", error);
        } finally {
            setLoading(false);
        }
    }, [state.lastFetched]);

    const setData = useCallback((newData: Partial<DataState>) => {
        setState(prev => ({ ...prev, ...newData }));
    }, []);

    const filteredInvoices = React.useMemo(() => 
        state.invoices.filter(inv => !businessType || inv.persona === businessType),
        [state.invoices, businessType]
    );

    const value = {
        ...state,
        loading,
        refreshData,
        setData,
        filteredInvoices,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
