import { PersonaConfig } from './types';

const saasConfig: PersonaConfig = {
    type: 'saas',

    // Defaults
    defaultUnit: 'Qty',
    defaultTaxRate: 18,

    // Item Table
    showProductAutocomplete: false,
    showSacColumn: false,
    showHsnColumn: false,
    showSkuColumn: false,
    showServicePeriod: true,

    // Seller
    showGstToggle: false,
    showTagline: false,
    showPanField: false,
    showFrnField: false,
    showBankDetails: false,
    taxIdRequired: false,

    // Header
    showPlaceOfSupply: false,
    showReverseCharge: false,
    showProjectName: false,
    showShippingAddress: false,
    showOrderNumber: true,
    showDispatchDate: false,

    // Notes & Extras
    showCourierTracking: false,
    showAuthorizedSignatory: false,
    showUpiPaymentBox: false,

    // Tax
    interStateMode: 'none',

    // Buyer
    buyerNamePlaceholder: 'Client Business Name',
    buyerTaxIdLabel: 'Tax ID',
};

export default saasConfig;
