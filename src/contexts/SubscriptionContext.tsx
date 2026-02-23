import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';

export type PlanTier = 'free' | 'pro';

interface UsageStats {
    current: number;
    limit: number;
}

interface PlanStatus {
    plan_tier: PlanTier;
    usage: {
        invoices: UsageStats;
        ai_requests: UsageStats;
    };
}

interface SubscriptionContextType {
    planStatus: PlanStatus | null;
    loading: boolean;
    refreshPlanStatus: () => Promise<void>;
    isLimitReached: (feature: 'invoices' | 'ai_requests') => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
    planStatus: null,
    loading: true,
    refreshPlanStatus: async () => { },
    isLimitReached: () => false,
});

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, orgId } = useAuth();
    const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPlanStatus = useCallback(async () => {
        if (!session || !orgId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await api.get<PlanStatus>('/plans/status');
            setPlanStatus(data);
        } catch (err) {
            console.error('Error fetching plan status:', err);
        } finally {
            setLoading(false);
        }
    }, [session, orgId]);

    useEffect(() => {
        fetchPlanStatus();
    }, [fetchPlanStatus]);

    const isLimitReached = (feature: 'invoices' | 'ai_requests') => {
        if (!planStatus) return false;
        const usage = planStatus.usage[feature];
        return usage.current >= usage.limit;
    };

    return (
        <SubscriptionContext.Provider value={{
            planStatus,
            loading,
            refreshPlanStatus: fetchPlanStatus,
            isLimitReached
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
