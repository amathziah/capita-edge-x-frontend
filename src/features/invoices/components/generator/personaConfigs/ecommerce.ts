import { PersonaConfig } from './types';

const ecommerceConfig: PersonaConfig = {
    type: 'ecommerce',

    // // Defaults
    defaultUnit: 'Qty',
    defaultTaxRate: 18,

    // // Header fields
    showPlaceOfSupply: true,
    showReverseCharge: false,
    showProjectName: false,
    showShippingAddress: true,
    showOrderNumber: true,
    showDispatchDate: true,

    // // Seller fields
    showGstToggle: false,
    showTagline: false,
    showPanField: false,
    showFrnField: false,
    showBankDetails: false,
    taxIdRequired: false,

    // // Buyer fields
    buyerTaxIdRequired: false,

    // // Line items
    showProductAutocomplete: true,
    showSacColumn: false,
    showHsnColumn: true,
    showSkuColumn: true,
    showServicePeriod: false,
    showServicePeriodPerLine: false,
    showTaxableValueColumn: false,
    showGstColumn: false,
    inventoryEnabled: true,

    // // Tax behavior
    interStateMode: 'auto-delivery-state',
    showTaxPlaceholderUntilStateSelected: true,
    showTDSToggle: false,
    showTDSInTotals: false,
    showShippingInTotals: true,

    // // Payment & notes
    showCourierTracking: true,
    showAuthorizedSignatory: false,
    showUpiPaymentBox: false,

    // // Labels & placeholders
    buyerNamePlaceholder: 'Buyer / Company Name',
    buyerTaxIdLabel: 'Buyer GSTIN',
    placeOfSupplyLabel: 'Delivery State',
};

export default ecommerceConfig;
