import { BusinessType } from '../../../contexts/PersonaContext';

// ─── Persona Configuration Type ────────────────────────────────────────
// Each persona defines its defaults, field visibility, and behavior.
// Adding a new persona = creating a new config file that satisfies this type.

export interface PersonaConfig {
    /** The business type this config applies to */
    type: BusinessType;

    // ─── Defaults ─────────────────────────────────────────────────────
    /** Default unit for line items (e.g. 'Hours' for agency, 'Qty' for ecommerce) */
    defaultUnit: string;
    /** Default tax rate (e.g. 18 for most, 0 for solopreneur) */
    defaultTaxRate: number;

    // ─── Item Table Columns ───────────────────────────────────────────
    /** Show product autocomplete dropdown in description field */
    showProductAutocomplete: boolean;
    /** Show SAC code column (Service Accounting Code) */
    showSacColumn: boolean;
    /** Show HSN code column (Harmonized System of Nomenclature) */
    showHsnColumn: boolean;
    /** Show SKU column */
    showSkuColumn: boolean;
    /** Show service period (start/end date) column */
    showServicePeriod: boolean;

    // ─── Seller Fields ────────────────────────────────────────────────
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

    // ─── Header Fields ────────────────────────────────────────────────
    /** Show Place of Supply dropdown (CA) */
    showPlaceOfSupply: boolean;
    /** Show Reverse Charge toggle (CA) */
    showReverseCharge: boolean;
    /** Show Project Name field (Agency) */
    showProjectName: boolean;
    /** Show Shipping Address field (Ecommerce) */
    showShippingAddress: boolean;
    /** Show Order/Ref # field */
    showOrderNumber: boolean;
    /** Show Dispatch Date field (Ecommerce) */
    showDispatchDate: boolean;

    // ─── Notes & Extras ───────────────────────────────────────────────
    /** Show Courier & Tracking field */
    showCourierTracking: boolean;
    /** Show Authorized Signatory field */
    showAuthorizedSignatory: boolean;
    /** Show UPI Payment Information box */
    showUpiPaymentBox: boolean;

    // ─── Tax Behavior ─────────────────────────────────────────────────
    /**
     * How inter-state transactions are determined:
     * - 'none': No inter-state logic (solopreneur, saas)
     * - 'manual': User toggles intra/inter-state (agency)
     * - 'auto-place-of-supply': Determined by Place of Supply vs Seller GSTIN (CA)
     * - 'auto-delivery-state': Determined by Delivery State vs Seller GSTIN (ecommerce)
     */
    interStateMode: 'none' | 'manual' | 'auto-place-of-supply' | 'auto-delivery-state';

    // ─── Buyer Field Labels ───────────────────────────────────────────
    /** Placeholder for buyer name field */
    buyerNamePlaceholder: string;
    /** Label for buyer tax ID field */
    buyerTaxIdLabel: string;
}
