import { PersonaConfig } from './types';

const solopreneurConfig: PersonaConfig = {
    type: 'solopreneur',

    // // Defaults
    defaultUnit: 'Hours',
    defaultTaxRate: 18,

    // // Header fields
    showPlaceOfSupply: false,
    showReverseCharge: false,
    showProjectName: false,
    showShippingAddress: false,
    showOrderNumber: false,
    showDispatchDate: false,

    // // Seller fields
    showGstToggle: true,
    showTagline: true,
    showPanField: true,
    showFrnField: false,
    showBankDetails: true,
    taxIdRequired: false,

    // // Buyer fields
    buyerTaxIdRequired: false,

    // // Line items
    showProductAutocomplete: true,
    showSacColumn: false,
    showHsnColumn: false,
    showSkuColumn: false,
    showServicePeriod: false,
    showServicePeriodPerLine: false,
    showTaxableValueColumn: false,
    showGstColumn: false,
    inventoryEnabled: false,

    // // Tax behavior
    interStateMode: 'none',
    showTaxPlaceholderUntilStateSelected: false,
    showTDSToggle: true,
    showTDSInTotals: true,
    showShippingInTotals: false,

    // // Payment & notes
    showCourierTracking: false,
    showAuthorizedSignatory: false,
    showUpiPaymentBox: true,

    // // Labels & placeholders
    buyerNamePlaceholder: 'Client Name',
    buyerTaxIdLabel: 'Tax ID',
    placeOfSupplyLabel: '',
};

export default solopreneurConfig;
