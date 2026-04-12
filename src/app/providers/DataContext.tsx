import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Invoice, Payment, Customer, Expense, Product, ProductPerformance, ComplianceTask, DashboardStats } from '@/types';
import { dataService } from '@/shared/services/dataService';
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
}

type DataEntity = keyof DataState;

interface DataContextType extends DataState {
    loading: boolean;
    refreshData: (entities?: DataEntity[] | boolean, force?: boolean) => Promise<void>;
    setData: (data: Partial<DataState>) => void;
    filteredInvoices: Invoice[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { organizationId, businessType } = usePersona();
    const [loading, setLoading] = useState(false);
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
    });
    
    const lastFetchedRef = useRef<Record<string, number>>({});
    const inFlightRequests = useRef<Record<string, Promise<any> | null>>({});
    const requestVersionRef = useRef<Record<string, number>>({});

    const refreshData = useCallback(async (entitiesOrForce: DataEntity[] | boolean = false, force = false) => {
        if (!organizationId) return;
        
        const now = Date.now();
        const forceFetch = typeof entitiesOrForce === 'boolean' ? entitiesOrForce : force;
        const allEntities: DataEntity[] = ['invoices', 'stats', 'payments', 'customers', 'expenses', 'products', 'performance', 'complianceTasks', 'reports'];
        const requestedEntities = Array.isArray(entitiesOrForce) 
            ? entitiesOrForce 
            : allEntities;

        const entitiesToFetch = requestedEntities.filter(entity => {
            if (forceFetch) return true;
            const lastFetched = lastFetchedRef.current[entity];
            return !lastFetched || (now - lastFetched > CACHE_TTL);
        });

        if (entitiesToFetch.length === 0) return;

        // Prevent redundant in-flight requests for the same entities
        const actualEntitiesToFetch = forceFetch
            ? entitiesToFetch
            : entitiesToFetch.filter(entity => !inFlightRequests.current[entity]);
        if (actualEntitiesToFetch.length === 0) return;

        try {
            setLoading(true);
            
            const fetchPromises: Record<string, Promise<any>> = {};
            
            actualEntitiesToFetch.forEach(entity => {
                let promise: Promise<any>;
                switch(entity) {
                    case 'invoices': promise = dataService.getInvoices({ limit: 1000 }); break;
                    case 'stats': promise = dataService.getDashboardStats(); break;
                    case 'payments': promise = dataService.getPayments({ limit: 1000 }); break;
                    case 'customers': promise = dataService.getCustomers({ limit: 1000 }); break;
                    case 'expenses': promise = dataService.getExpenses({ limit: 1000 }); break;
                    case 'products': promise = dataService.getProducts().catch(() => []); break;
                    case 'performance': promise = dataService.getProductPerformance().catch(() => []); break;
                    case 'complianceTasks': promise = dataService.getComplianceTasks(); break;
                    case 'reports': promise = dataService.getReports(); break;
                    default: return;
                }

                const requestVersion = (requestVersionRef.current[entity] || 0) + 1;
                requestVersionRef.current[entity] = requestVersion;
                
                const wrappedPromise = promise.then(data => {
                    lastFetchedRef.current[entity] = Date.now();
                    if (inFlightRequests.current[entity] === wrappedPromise) {
                        inFlightRequests.current[entity] = null;
                    }
                    
                    // Ignore stale responses when a newer force-refresh finished later.
                    if (requestVersionRef.current[entity] === requestVersion) {
                        setState(prev => ({
                            ...prev,
                            [entity]: data || (entity === 'stats' ? { total_customers: 0 } : [])
                        }));
                    }
                    
                    return data;
                }).catch(err => {
                    if (inFlightRequests.current[entity] === wrappedPromise) {
                        inFlightRequests.current[entity] = null;
                    }
                    throw err;
                });
                
                inFlightRequests.current[entity] = wrappedPromise;
                fetchPromises[entity] = wrappedPromise;
            });

            // We wait for all to finish only to stop the global loading spinner
            await Promise.allSettled(Object.values(fetchPromises));

        } catch (error) {
            console.error("Error refreshing global data:", error);
        } finally {
            // Check if any requests are still in flight
            const stillInFlight = Object.values(inFlightRequests.current).some(p => p !== null);
            if (!stillInFlight) setLoading(false);
        }
    }, [organizationId]);

    // Fetch initial data when organizationId changes
    useEffect(() => {
        if (organizationId) {
            refreshData();
        } else {
            // Clear state when user logs out or switches org
            lastFetchedRef.current = {};
            inFlightRequests.current = {};
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
            });
        }
    }, [organizationId, refreshData]);

    const setData = useCallback((newData: Partial<DataState>) => {
        setState(prev => ({ ...prev, ...newData }));
    }, []);

    const filteredInvoices = React.useMemo(
        () => state.invoices.filter(inv => !businessType || !inv.persona || inv.persona === businessType),
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
