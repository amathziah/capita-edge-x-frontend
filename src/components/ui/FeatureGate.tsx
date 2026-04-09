import React from 'react';
import { usePersona } from '@/app/providers/PersonaContext';
import type { PlanTier } from '@/shared/lib/config/persona.config';

type FeatureKey = keyof typeof import('../lib/config/persona.config').PERSONA_CONFIGS['solopreneur']['features'];

interface FeatureGateProps {
  feature: FeatureKey;
  minTier?: PlanTier;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({
  feature,
  minTier = 'free',
  fallback = null,
  children,
}: FeatureGateProps) {
  const { can, tier } = usePersona();

  if (!can(feature as any)) return <>{fallback}</>;
  if (!tier(minTier)) return <>{fallback}</>;

  return <>{children}</>;
}
