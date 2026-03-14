import { BusinessType } from '../../../contexts/PersonaContext';
import { PersonaConfig } from './types';
import solopreneurConfig from './solopreneur';
import servicesFirmConfig from './services_firm';
import subscriptionConfig from './subscription';
import ecommerceConfig from './ecommerce';
import caConfig from './ca';

/**
 * Registry of all available persona configurations.
 * Map the BusinessType string to its corresponding config object.
 */
const configMap: Record<BusinessType, PersonaConfig> = {
    solopreneur: solopreneurConfig,
    services_firm: servicesFirmConfig,
    subscription: subscriptionConfig,
    ecommerce: ecommerceConfig,
    ca: caConfig,
};

/**
 * Resolve the persona configuration for a given business type.
 * Falls back to solopreneur if the type is not recognized.
 */
export function getPersonaConfig(businessType: BusinessType | null): PersonaConfig {
    if (!businessType || !configMap[businessType]) {
        return solopreneurConfig;
    }
    return configMap[businessType];
}

export { configMap as personaRegistry };
export type { PersonaConfig } from './types';
