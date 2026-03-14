import { PersonaConfig } from './types';

const caConfig: PersonaConfig = {
    type: 'ca',

    // // Defaults
    defaultUnit: 'Qty',
    defaultTaxRate: 18,

    // // Header fields
    showPlaceOfSupply: true,
    showReverseCharge: true,
    showProjectName: false,
    showShippingAddress: false,
    showOrderNumber: false,
    showDispatchDate: false,

    // // Seller fields
    showGstToggle: false,
    showTagline: false,
    showPanField: true,
    showFrnField: true,
    showBankDetails: true,
    taxIdRequired: true,

    // // Buyer fields
    buyerTaxIdRequired: false,

    // // Line items
    showProductAutocomplete: false,
    showSacColumn: true,
    showHsnColumn: false,
    showSkuColumn: false,
    showServicePeriod: false,
    showServicePeriodPerLine: false,
    showTaxableValueColumn: true,
    showGstColumn: true,
    inventoryEnabled: false,

    // // Tax behavior
    interStateMode: 'auto-place-of-supply',
    showTaxPlaceholderUntilStateSelected: false,
    showTDSToggle: false,
    showTDSInTotals: false,
    showShippingInTotals: false,

    // // Payment & notes
    showCourierTracking: false,
    showAuthorizedSignatory: false,
    showUpiPaymentBox: false,

    // // Labels & placeholders
    buyerNamePlaceholder: 'Client Name',
    buyerTaxIdLabel: 'Client GSTIN',
    placeOfSupplyLabel: 'Place of Supply',
};

export default caConfig;
