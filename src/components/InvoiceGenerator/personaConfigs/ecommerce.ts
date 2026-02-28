import { PersonaConfig } from './types';

const ecommerceConfig: PersonaConfig = {
    type: 'ecommerce',

    // Defaults
    defaultUnit: 'Qty',
    defaultTaxRate: 18,

    // Item Table
    showProductAutocomplete: true,
    showSacColumn: false,
    showHsnColumn: true,
    showSkuColumn: true,
    showServicePeriod: false,

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
    showShippingAddress: true,
    showOrderNumber: true,
    showDispatchDate: true,

    // Notes & Extras
    showCourierTracking: true,
    showAuthorizedSignatory: false,
    showUpiPaymentBox: false,

    // Tax
    interStateMode: 'auto-delivery-state',

    // Buyer
    buyerNamePlaceholder: 'Client Business Name',
    buyerTaxIdLabel: 'Buyer GSTIN',
};

export default ecommerceConfig;
