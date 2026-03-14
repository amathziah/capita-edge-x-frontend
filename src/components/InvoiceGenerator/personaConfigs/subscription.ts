import { PersonaConfig } from './types';

const subscriptionConfig: PersonaConfig = {
    type: 'subscription',

    // // Defaults
    defaultUnit: 'Qty',
    defaultTaxRate: 18,

    // // Header fields
    showPlaceOfSupply: false,
    showReverseCharge: false,
    showProjectName: false,
    showShippingAddress: false,
    showOrderNumber: true,
    showDispatchDate: false,

    // // Seller fields
    showGstToggle: false,
    showTagline: false,
    showPanField: false,
    showFrnField: false,
    showBankDetails: true,
    taxIdRequired: false,

    // // Buyer fields
    buyerTaxIdRequired: false,

    // // Line items
    showProductAutocomplete: false,
    showSacColumn: false,
    showHsnColumn: false,
    showSkuColumn: false,
    showServicePeriod: true,
    showServicePeriodPerLine: true,
    showTaxableValueColumn: false,
    showGstColumn: false,
    inventoryEnabled: false,

    // // Tax behavior
    interStateMode: 'none',
    showTaxPlaceholderUntilStateSelected: false,
    showTDSToggle: false,
    showTDSInTotals: false,
    showShippingInTotals: false,

    // // Payment & notes
    showCourierTracking: false,
    showAuthorizedSignatory: false,
    showUpiPaymentBox: false,

    // // Labels & placeholders
    buyerNamePlaceholder: 'Company / Subscriber Name',
    buyerTaxIdLabel: 'Tax ID',
    placeOfSupplyLabel: '',
};

export default subscriptionConfig;
