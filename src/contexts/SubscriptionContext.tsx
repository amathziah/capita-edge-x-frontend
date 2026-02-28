import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';

// ═══════════════════════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════════════════════

export type PlanTier = 'starter' | 'freelancer' | 'smb' | 'ca_pro' | 'enterprise';

interface UsageStats {
    current: number;
    limit: number;
}

interface PlanFeatures {
    email_invoices: boolean;
    bulk_email: boolean;
    pdf_download: boolean;
    reports: string;       // 'basic' | 'full' | 'custom'
    white_label: boolean;
    multi_client: boolean;
    priority_support: boolean;
    inventory: string | boolean;    // false | 'basic' | 'full'
}

interface PlanStatus {
    plan_tier: PlanTier;
    plan_name: string;
    plan_label: string;
    usage: {
        invoices: UsageStats;
        ai_requests: UsageStats;
        products: { limit: number };
        customers: { limit: number };
    };
    features: PlanFeatures;
}

interface SubscriptionContextType {
    planStatus: PlanStatus | null;
    loading: boolean;
    refreshPlanStatus: () => Promise<void>;
    isLimitReached: (feature: 'invoices' | 'ai_requests') => boolean;
    hasFeature: (feature: keyof PlanFeatures) => boolean;
    tierName: string;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
    planStatus: null,
    loading: true,
    refreshPlanStatus: async () => { },
    isLimitReached: () => false,
    hasFeature: () => false,
    tierName: 'Starter',
});

// ═══════════════════════════════════════════════════════════════════════
//  Provider
// ═══════════════════════════════════════════════════════════════════════

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
        if (!usage || usage.limit === Infinity || usage.limit === null) return false;
        return usage.current >= usage.limit;
    };

    const hasFeature = (feature: keyof PlanFeatures) => {
        if (!planStatus) return false;
        const val = planStatus.features[feature];
        return val === true || val === 'full' || val === 'custom' || val === 'basic';
    };

    const tierName = planStatus?.plan_name || 'Starter';

    return (
        <SubscriptionContext.Provider value={{
            planStatus,
            loading,
            refreshPlanStatus: fetchPlanStatus,
            isLimitReached,
            hasFeature,
            tierName,
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
