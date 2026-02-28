import { PersonaConfig } from './types';

const agencyConfig: PersonaConfig = {
    type: 'agency',

    // Defaults
    defaultUnit: 'Hours',
    defaultTaxRate: 18,

    // Item Table
    showProductAutocomplete: false,
    showSacColumn: true,
    showHsnColumn: false,
    showSkuColumn: false,
    showServicePeriod: true,

    // Seller
    showGstToggle: false,
    showTagline: false,
    showPanField: true,
    showFrnField: false,
    showBankDetails: false,
    taxIdRequired: true,

    // Header
    showPlaceOfSupply: false,
    showReverseCharge: false,
    showProjectName: true,
    showShippingAddress: false,
    showOrderNumber: false,
    showDispatchDate: false,

    // Notes & Extras
    showCourierTracking: false,
    showAuthorizedSignatory: true,
    showUpiPaymentBox: false,

    // Tax
    interStateMode: 'manual',

    // Buyer
    buyerNamePlaceholder: 'Client Business Name',
    buyerTaxIdLabel: 'GSTIN',
};

export default agencyConfig;
