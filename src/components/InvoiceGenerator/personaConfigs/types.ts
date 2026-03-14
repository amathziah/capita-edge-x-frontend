import { BusinessType } from '../../../contexts/PersonaContext';

// ─── Persona Configuration Type ────────────────────────────────────────
// Each persona defines its defaults, field visibility, and behavior.
// Adding a new persona = creating a new config file that satisfies this type.

/**
 * BusinessType defines the different categories of businesses that can generate invoices.
 * Each type has unique invoicing requirements and UI layouts.
 */
// Note: BusinessType is imported from PersonaContext, but we should reflect the changes here if it was partially redefined or for documentation.
// The user asked to change BusinessType to: 'solopreneur' | 'services_firm' | 'subscription' | 'ecommerce' | 'ca'

/**
 * PersonaConfig defines the feature flags and default values for each business persona.
 * This determines which fields are shown in the Invoice Generator UI.
 */
export interface PersonaConfig {
    /** The business type this config applies to */
    type: BusinessType;

    // // Defaults
    /** Default unit for line items (e.g. 'Hours' for services, 'Qty' for ecommerce) */
    defaultUnit: string;
    /** Default tax rate (e.g. 18 for most, 0 for solopreneur) */
    defaultTaxRate: number;

    // // Header fields
    /** Show Place of Supply dropdown (CA/GST) */
    showPlaceOfSupply: boolean;
    /** Show Reverse Charge toggle (CA/GST) */
    showReverseCharge: boolean;
    /** Show Project Name field (Services) */
    showProjectName: boolean;
    /** Show Shipping Address field (Ecommerce) */
    showShippingAddress: boolean;
    /** Show Order/Ref # field */
    showOrderNumber: boolean;
    /** Show Dispatch Date field (Ecommerce) */
    showDispatchDate: boolean;

    // // Seller fields
    /** Show "GST Registered?" toggle (solopreneur only) */
    showGstToggle: boolean;
    /** Show tagline field */
    showTagline: boolean;
    /** Show PAN field */
    showPanField: boolean;
    /** Show FRN (ICAI) field */
    showFrnField: boolean;
    /** Show bank details textarea */
    showBankDetails: boolean;
    /** Whether tax ID is required for validation */
    taxIdRequired: boolean;

    // // Buyer fields
    /** Whether buyer tax ID is required */
    buyerTaxIdRequired: boolean;

    // // Line items
    /** Show product autocomplete dropdown in description field */
    showProductAutocomplete: boolean;
    /** Show SAC code column (Service Accounting Code) */
    showSacColumn: boolean;
    /** Show HSN code column (Harmonized System of Nomenclature) */
    showHsnColumn: boolean;
    /** Show SKU column */
    showSkuColumn: boolean;
    /** Show service period (start/end date) column for the whole invoice */
    showServicePeriod: boolean;
    /** Show service period fields on each individual line item */
    showServicePeriodPerLine: boolean;
    /** Show taxable value column in line items table */
    showTaxableValueColumn: boolean;
    /** Show GST amount column per item in the table */
    showGstColumn: boolean;
    /** Whether inventory/stock tracking is enabled for this persona */
    inventoryEnabled: boolean;

    // // Tax behavior
    /**
     * How inter-state transactions are determined:
     * - 'none': No inter-state logic (solopreneur, subscription)
     * - 'manual': User toggles intra/inter-state (services_firm)
     * - 'auto-place-of-supply': Determined by Place of Supply vs Seller GSTIN (ca)
     * - 'auto-delivery-state': Determined by Delivery State vs Seller GSTIN (ecommerce)
     */
    interStateMode: 'none' | 'manual' | 'auto-place-of-supply' | 'auto-delivery-state';
    /** Hide tax values until a state is selected in the UI */
    showTaxPlaceholderUntilStateSelected: boolean;
    /** Show TDS (Tax Deducted at Source) toggle */
    showTDSToggle: boolean;
    /** Show TDS breakdown in totals */
    showTDSInTotals: boolean;
    /** Show shipping charges in totals breakdown */
    showShippingInTotals: boolean;

    // // Payment & notes
    /** Show Courier & Tracking field */
    showCourierTracking: boolean;
    /** Show Authorized Signatory field */
    showAuthorizedSignatory: boolean;
    /** Show UPI Payment Information box */
    showUpiPaymentBox: boolean;

    // // Labels & placeholders
    /** Placeholder for buyer name field */
    buyerNamePlaceholder: string;
    /** Label for buyer tax ID field */
    buyerTaxIdLabel: string;
    /** Custom label for the 'Place of Supply' field */
    placeOfSupplyLabel: string;
}
