import { PersonaConfig } from './types';

const servicesFirmConfig: PersonaConfig = {
    type: 'services_firm',

    // // Defaults
    defaultUnit: 'Hours',
    defaultTaxRate: 18,

    // // Header fields
    showPlaceOfSupply: false,
    showReverseCharge: false,
    showProjectName: true,
    showShippingAddress: false,
    showOrderNumber: false,
    showDispatchDate: false,

    // // Seller fields
    showGstToggle: false,
    showTagline: false,
    showPanField: true,
    showFrnField: false,
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
    showServicePeriodPerLine: true,
    showTaxableValueColumn: false,
    showGstColumn: false,
    inventoryEnabled: false,

    // // Tax behavior
    interStateMode: 'manual',
    showTaxPlaceholderUntilStateSelected: false,
    showTDSToggle: false,
    showTDSInTotals: false,
    showShippingInTotals: false,

    // // Payment & notes
    showCourierTracking: false,
    showAuthorizedSignatory: true,
    showUpiPaymentBox: false,

    // // Labels & placeholders
    buyerNamePlaceholder: 'Client / Company Name',
    buyerTaxIdLabel: 'GSTIN',
    placeOfSupplyLabel: '',
};

export default servicesFirmConfig;
