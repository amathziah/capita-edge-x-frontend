import { BusinessType } from '../../../contexts/PersonaContext';
import { PersonaConfig } from './types';
import solopreneurConfig from './solopreneur';
import agencyConfig from './agency';
import caConfig from './ca';
import ecommerceConfig from './ecommerce';
import saasConfig from './saas';

// ─── Config Registry ───────────────────────────────────────────────────
// To add a new persona, create a config file and register it here.
const configMap: Record<BusinessType, PersonaConfig> = {
    solopreneur: solopreneurConfig,
    agency: agencyConfig,
    ca: caConfig,
    ecommerce: ecommerceConfig,
    saas: saasConfig,
};

/**
 * Resolve the persona configuration for a given business type.
 * Falls back to solopreneur if the type is not recognized.
 */
export function getPersonaConfig(businessType: BusinessType): PersonaConfig {
    return configMap[businessType] ?? solopreneurConfig;
}

export type { PersonaConfig } from './types';
