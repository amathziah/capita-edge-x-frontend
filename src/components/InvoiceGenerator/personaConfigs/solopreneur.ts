import { PersonaConfig } from './types';

const solopreneurConfig: PersonaConfig = {
    type: 'solopreneur',

    // Defaults
    defaultUnit: 'Hours',
    defaultTaxRate: 0,

    // Item Table
    showProductAutocomplete: true,
    showSacColumn: false,
    showHsnColumn: false,
    showSkuColumn: false,
    showServicePeriod: false,

    // Seller
    showGstToggle: true,
    showTagline: true,
    showPanField: true,
    showFrnField: false,
    showBankDetails: true,
    taxIdRequired: false,

    // Header
    showPlaceOfSupply: false,
    showReverseCharge: false,
    showProjectName: false,
    showShippingAddress: false,
    showOrderNumber: false,
    showDispatchDate: false,

    // Notes & Extras
    showCourierTracking: false,
    showAuthorizedSignatory: false,
    showUpiPaymentBox: true,

    // Tax
    interStateMode: 'none',

    // Buyer
    buyerNamePlaceholder: 'Client Business Name',
    buyerTaxIdLabel: 'Tax ID',
};

export default solopreneurConfig;
