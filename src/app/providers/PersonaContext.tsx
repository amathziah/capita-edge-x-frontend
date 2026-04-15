import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuth } from './AuthContext';
import { PERSONA_CONFIGS } from '@/shared/lib/config/persona.config';
import { setOrgId, markOrgReady } from '@/shared/api/client';
import type { PersonaConfig, Segment, PlanTier } from '@/shared/lib/config/persona.config';

export type BusinessType = Segment;
export type { Segment, PlanTier };

type FeatureKey = keyof typeof PERSONA_CONFIGS['solopreneur']['features'];

interface PersonaContextType {
  businessType: Segment | null;
  organizationId: string | null;
  planTier: PlanTier | null;
  loading: boolean;
  config: PersonaConfig | null;
  form: PersonaConfig['invoiceForm'] | null;
  nav: PersonaConfig['nav'] | null;
  can: (feature: FeatureKey) => boolean;
  tier: (minTier: PlanTier) => boolean;
  refreshPersona: () => Promise<void>;
  updatePersona: (newType: Segment) => Promise<void>;
}

const TIER_ORDER: PlanTier[] = ['free', 'pro', 'ca_firm', 'enterprise'];

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [businessType, setBusinessType] = useState<Segment | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [planTier, setPlanTier] = useState<PlanTier | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPersona = useCallback(async (userId: string) => {
    try {
      setLoading(true);

      // Race the Supabase query against a 10-second timeout.
      // If the query hangs, we resolve to fresh state so the user is sent
      // to /setup rather than spinning forever.
      const query = supabase
        .from('profiles')
        .select('business_type, organization_id, organizations(plan_tier)')
        .eq('id', userId)
        .maybeSingle();

      const timeoutFallback = new Promise<{ data: null; error: null }>((resolve) =>
        setTimeout(() => {
          console.warn('[PersonaContext] fetchPersona timed out — treating as fresh user');
          resolve({ data: null, error: null });
        }, 10_000)
      );

      const { data, error } = await Promise.race([query, timeoutFallback]) as { data: any; error: any };

      // Don't throw on join errors — extract what we can
      if (error && !data) throw error;

      // Fresh auth state: logged in but no profile row yet (new OAuth user, or profile not yet created)
      if (!data && !error) {
        setBusinessType(null);
        setOrganizationId(null);
        setOrgId(null);
        setPlanTier(null);
        return;
      }

      // Handle both array and object return from Supabase join
      const orgData = data?.organizations as any;
      const rawTier = Array.isArray(orgData)
        ? orgData[0]?.plan_tier
        : orgData?.plan_tier;
      const resolvedTier = (rawTier as PlanTier) ?? 'free';

      const bType = (data?.business_type as Segment) ?? null;
      const orgId = data?.organization_id ?? null;

      setBusinessType(bType);
      setOrganizationId(orgId);
      setOrgId(orgId);
      setPlanTier(orgId ? resolvedTier : null);
    } catch (err) {
      console.error('[PersonaContext] fetchPersona error:', err);
      setBusinessType(null);
      setOrganizationId(null);
      setOrgId(null);
    } finally {
      // Always unblock the API client and stop the loading state,
      // regardless of whether the query succeeded, failed, or timed out.
      markOrgReady();
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchPersona(user.id);
    else {
      setBusinessType(null);
      setOrganizationId(null);
      setOrgId(null);
      markOrgReady(); // Allow unauthenticated flows to proceed
      setLoading(false);
    }
  }, [user, fetchPersona]);


  const config = businessType ? (PERSONA_CONFIGS[businessType] ?? null) : null;

  const can = useCallback(
    (feature: FeatureKey): boolean => config?.features[feature]?.enabled ?? false,
    [config]
  );

  const tier = useCallback(
    (minTier: PlanTier): boolean => {
      if (!planTier) return false;
      return TIER_ORDER.indexOf(planTier) >= TIER_ORDER.indexOf(minTier);
    },
    [planTier]
  );

  const refreshPersona = useCallback(async () => {
    if (user) {
      await fetchPersona(user.id);
    }
  }, [user, fetchPersona]);

  const updatePersona = useCallback(async (newType: Segment) => {
    if (!user) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ business_type: newType })
        .eq('id', user.id);
      if (error) throw new Error(error.message);
      setBusinessType(newType);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return (
    <PersonaContext.Provider value={{
      businessType,
      organizationId,
      planTier,
      loading,
      config,
      form: config?.invoiceForm ?? null,
      nav: config?.nav ?? null,
      can,
      tier,
      refreshPersona,
      updatePersona,
    }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
};
