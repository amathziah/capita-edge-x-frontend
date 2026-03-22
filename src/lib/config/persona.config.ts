export type Segment = 'solopreneur' | 'services_firm' | 'ecommerce' | 'subscription' | 'ca_firm';
export type PlanTier = 'free' | 'pro' | 'ca_firm' | 'enterprise';

export interface NavItem {
  id: string;
  label: string;
  section: 'headquarters' | 'revenue-ops' | 'spend-assets' | 'analytics';
  badge?: string | null;
}

export interface InvoiceFormConfig {
  sections: string[];
  visibleFields: string[];
  requiredFields: string[];
  hiddenFields: string[];
  lineItemCols: string[];
}

export interface FeatureConfig {
  enabled: boolean;
  [key: string]: any;
}

export interface PersonaConfig {
  label: string;
  pricing: Record<string, number>;
  features: Record<string, FeatureConfig>;
  invoiceForm: InvoiceFormConfig;
  taxEngine: 'basic_gst' | 'services_gst' | 'ecomm_gst' | 'ca_expert';
  collectionsModel: 'rules' | 'ml' | 'automated' | 'ca_coach';
  nav: NavItem[];
}

export const PERSONA_CONFIGS: Record<Segment, PersonaConfig> = {
  solopreneur: {
    label: 'Freelancer',
    pricing: { free: 0, premium: 199 },
    features: {
      invoiceCreation:   { enabled: true },
      paymentTracking:   { enabled: true },
      aiCollections:     { enabled: true, model: 'rules' },
      cashForecast:      { enabled: true },
      settlementNeg:     { enabled: false },
      reports:           { enabled: true, count: 5 },
      marketplaceSync:   { enabled: false },
      teamCollaboration: { enabled: false },
      whiteLabel:        { enabled: false },
      complianceChecker: { enabled: true },
      recurringInvoices: { enabled: false },
      mrrTracking:       { enabled: false },
      skuProfitability:  { enabled: false },
      expenses:          { enabled: false },
      inventory:         { enabled: false },
    },
    invoiceForm: {
      sections:       ['header', 'line_items', 'totals'],
      visibleFields:  ['customer', 'description', 'amount', 'due_date', 'service_type', 'notes'],
      requiredFields: ['customer', 'amount', 'due_date', 'service_type'],
      hiddenFields:   ['hsn_code', 'ship_to', 'frn', 'courier', 'tcs', 'e_way_bill', 'billing_period', 'renewal_date', 'po_reference', 'dispatch_date'],
      lineItemCols:   ['description', 'sac', 'qty', 'rate', 'gst_pct', 'amount'],
    },
    taxEngine: 'basic_gst',
    collectionsModel: 'rules',
    nav: [
      { id: 'control-room', label: 'Control Room', section: 'headquarters' },
      { id: 'calendar',     label: 'Calendar',     section: 'headquarters', badge: 'due dates' },
      { id: 'invoices',     label: 'Invoices',     section: 'revenue-ops' },
      { id: 'payments',     label: 'Payments',     section: 'revenue-ops' },
      { id: 'customers',    label: 'Customers',    section: 'revenue-ops' },
      { id: 'compliance',   label: 'Compliance',   section: 'spend-assets', badge: 'GST' },
      { id: 'reports',      label: 'Reports',      section: 'analytics' },
    ],
  },

  services_firm: {
    label: 'Service firm',
    pricing: { free: 0, premium: 499, pro: 999 },
    features: {
      invoiceCreation:   { enabled: true },
      paymentTracking:   { enabled: true },
      aiCollections:     { enabled: true, model: 'ml' },
      cashForecast:      { enabled: true },
      settlementNeg:     { enabled: true },
      reports:           { enabled: true, count: 10 },
      marketplaceSync:   { enabled: false },
      teamCollaboration: { enabled: true, maxUsers: 10 },
      whiteLabel:        { enabled: false },
      complianceChecker: { enabled: true },
      recurringInvoices: { enabled: true },
      mrrTracking:       { enabled: false },
      skuProfitability:  { enabled: false },
      expenses:          { enabled: true },
      inventory:         { enabled: false },
    },
    invoiceForm: {
      sections:       ['header', 'line_items', 'totals'],
      visibleFields:  ['customer', 'description', 'amount', 'due_date', 'service_type', 'billing_period', 'po_reference', 'project_name', 'notes'],
      requiredFields: ['customer', 'amount', 'due_date', 'service_type'],
      hiddenFields:   ['hsn_code', 'ship_to', 'courier', 'tcs', 'e_way_bill', 'renewal_date', 'dispatch_date'],
      lineItemCols:   ['description', 'sac', 'qty', 'rate', 'gst_pct', 'discount', 'amount'],
    },
    taxEngine: 'services_gst',
    collectionsModel: 'ml',
    nav: [
      { id: 'control-room', label: 'Control Room', section: 'headquarters' },
      { id: 'calendar',     label: 'Calendar',     section: 'headquarters', badge: 'cash flow' },
      { id: 'invoices',     label: 'Invoices',     section: 'revenue-ops' },
      { id: 'payments',     label: 'Payments',     section: 'revenue-ops' },
      { id: 'customers',    label: 'Customers',    section: 'revenue-ops' },
      { id: 'projects',     label: 'Projects',     section: 'revenue-ops' },
      { id: 'expenses',     label: 'Expenses',     section: 'spend-assets' },
      { id: 'compliance',   label: 'Compliance',   section: 'spend-assets' },
      { id: 'reports',      label: 'Reports',      section: 'analytics' },
      { id: 'team',         label: 'Team',         section: 'analytics' },
    ],
  },

  ecommerce: {
    label: 'Ecommerce seller',
    pricing: { free: 0, premium: 499, pro: 999, enterprise: 2000 },
    features: {
      invoiceCreation:   { enabled: true, autoGenerate: true },
      paymentTracking:   { enabled: true },
      aiCollections:     { enabled: true, model: 'automated' },
      cashForecast:      { enabled: true },
      settlementNeg:     { enabled: true },
      reports:           { enabled: true, count: 15 },
      marketplaceSync:   { enabled: true, platforms: ['amazon', 'flipkart', 'shopify'] },
      teamCollaboration: { enabled: true, maxUsers: 10 },
      whiteLabel:        { enabled: false },
      complianceChecker: { enabled: true },
      recurringInvoices: { enabled: false },
      mrrTracking:       { enabled: false },
      skuProfitability:  { enabled: true },
      expenses:          { enabled: true },
      inventory:         { enabled: true },
    },
    invoiceForm: {
      sections:       ['header', 'shipment', 'line_items', 'totals'],
      visibleFields:  ['customer', 'ship_to', 'dispatch_date', 'courier', 'po_reference', 'description', 'amount', 'due_date', 'notes'],
      requiredFields: ['customer', 'ship_to', 'dispatch_date', 'amount'],
      hiddenFields:   ['sac_code', 'frn', 'billing_period', 'renewal_date', 'service_type'],
      lineItemCols:   ['description', 'hsn', 'sku', 'qty', 'rate', 'gst_pct', 'igst_amount', 'amount'],
    },
    taxEngine: 'ecomm_gst',
    collectionsModel: 'automated',
    nav: [
      { id: 'control-room', label: 'Control Room', section: 'headquarters' },
      { id: 'calendar',     label: 'Calendar',     section: 'headquarters', badge: 'settlements' },
      { id: 'invoices',     label: 'Invoices',     section: 'revenue-ops' },
      { id: 'payments',     label: 'Payments',     section: 'revenue-ops' },
      { id: 'customers',    label: 'Customers',    section: 'revenue-ops' },
      { id: 'marketplace',  label: 'Marketplace',  section: 'revenue-ops' },
      { id: 'expenses',     label: 'Expenses',     section: 'spend-assets' },
      { id: 'inventory',    label: 'Inventory',    section: 'spend-assets' },
      { id: 'compliance',   label: 'Compliance',   section: 'spend-assets' },
      { id: 'reports',      label: 'Reports',      section: 'analytics' },
      { id: 'sku-pl',       label: 'SKU P&L',      section: 'analytics' },
    ],
  },

  subscription: {
    label: 'SaaS',
    pricing: { free: 0, premium: 499, pro: 999 },
    features: {
      invoiceCreation:   { enabled: true },
      paymentTracking:   { enabled: true },
      aiCollections:     { enabled: true, model: 'rules' },
      cashForecast:      { enabled: true },
      settlementNeg:     { enabled: false },
      reports:           { enabled: true, count: 8 },
      marketplaceSync:   { enabled: false },
      teamCollaboration: { enabled: true, maxUsers: 5 },
      whiteLabel:        { enabled: false },
      complianceChecker: { enabled: true },
      recurringInvoices: { enabled: true },
      mrrTracking:       { enabled: true },
      skuProfitability:  { enabled: false },
      expenses:          { enabled: false },
      inventory:         { enabled: false },
    },
    invoiceForm: {
      sections:       ['header', 'line_items', 'totals'],
      visibleFields:  ['customer', 'description', 'amount', 'due_date', 'billing_period', 'renewal_date', 'plan_name', 'seat_count', 'notes'],
      requiredFields: ['customer', 'amount', 'billing_period', 'plan_name'],
      hiddenFields:   ['hsn_code', 'ship_to', 'frn', 'courier', 'tcs', 'e_way_bill', 'dispatch_date', 'service_type'],
      lineItemCols:   ['description', 'sac', 'qty', 'rate', 'gst_pct', 'amount'],
    },
    taxEngine: 'services_gst',
    collectionsModel: 'rules',
    nav: [
      { id: 'control-room', label: 'Control Room', section: 'headquarters' },
      { id: 'calendar',     label: 'Calendar',     section: 'headquarters', badge: 'renewals' },
      { id: 'invoices',     label: 'Invoices',     section: 'revenue-ops' },
      { id: 'payments',     label: 'Payments',     section: 'revenue-ops' },
      { id: 'customers',    label: 'Customers',    section: 'revenue-ops' },
      { id: 'subscribers',  label: 'Subscribers',  section: 'revenue-ops' },
      { id: 'compliance',   label: 'Compliance',   section: 'spend-assets' },
      { id: 'reports',      label: 'Reports',      section: 'analytics' },
      { id: 'mrr',          label: 'MRR',          section: 'analytics' },
    ],
  },

  ca_firm: {
    label: 'CA firm',
    pricing: { free: 0, premium: 2000 },
    features: {
      invoiceCreation:   { enabled: true },
      paymentTracking:   { enabled: true },
      aiCollections:     { enabled: true, model: 'ca_coach' },
      cashForecast:      { enabled: true },
      settlementNeg:     { enabled: true },
      reports:           { enabled: true, count: 20 },
      marketplaceSync:   { enabled: false },
      teamCollaboration: { enabled: true, maxUsers: 20 },
      whiteLabel:        { enabled: true },
      complianceChecker: { enabled: true },
      recurringInvoices: { enabled: true },
      mrrTracking:       { enabled: false },
      skuProfitability:  { enabled: false },
      expenses:          { enabled: true },
      inventory:         { enabled: false },
    },
    invoiceForm: {
      sections:       ['header', 'line_items', 'totals'],
      visibleFields:  ['customer', 'description', 'amount', 'due_date', 'service_type', 'frn', 'billing_period', 'po_reference', 'notes'],
      requiredFields: ['customer', 'amount', 'due_date', 'frn'],
      hiddenFields:   ['hsn_code', 'ship_to', 'courier', 'tcs', 'e_way_bill', 'renewal_date', 'dispatch_date'],
      lineItemCols:   ['description', 'sac', 'qty', 'rate', 'gst_pct', 'tds', 'amount'],
    },
    taxEngine: 'ca_expert',
    collectionsModel: 'ca_coach',
    nav: [
      { id: 'control-room', label: 'Control Room', section: 'headquarters' },
      { id: 'calendar',     label: 'Calendar',     section: 'headquarters', badge: 'filings' },
      { id: 'invoices',     label: 'Invoices',     section: 'revenue-ops' },
      { id: 'payments',     label: 'Payments',     section: 'revenue-ops' },
      { id: 'clients',      label: 'Clients',      section: 'revenue-ops' },
      { id: 'expenses',     label: 'Expenses',     section: 'spend-assets' },
      { id: 'compliance',   label: 'Compliance',   section: 'spend-assets' },
      { id: 'reports',      label: 'Reports',      section: 'analytics' },
    ],
  },
};
