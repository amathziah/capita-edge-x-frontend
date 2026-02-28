import { PersonaConfig } from './types';

const caConfig: PersonaConfig = {
    type: 'ca',

    // Defaults
    defaultUnit: 'Qty',
    defaultTaxRate: 18,

    // Item Table
    showProductAutocomplete: false,
    showSacColumn: true,
    showHsnColumn: false,
    showSkuColumn: false,
    showServicePeriod: false,

    // Seller
    showGstToggle: false,
    showTagline: false,
    showPanField: true,
    showFrnField: true,
    showBankDetails: false,
    taxIdRequired: true,

    // Header
    showPlaceOfSupply: true,
    showReverseCharge: true,
    showProjectName: false,
    showShippingAddress: false,
    showOrderNumber: false,
    showDispatchDate: false,

    // Notes & Extras
    showCourierTracking: false,
    showAuthorizedSignatory: false,
    showUpiPaymentBox: false,

    // Tax
    interStateMode: 'auto-place-of-supply',

    // Buyer
    buyerNamePlaceholder: "Client's Legal Business Name",
    buyerTaxIdLabel: 'Client GSTIN',
};

export default caConfig;
