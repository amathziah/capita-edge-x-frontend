export interface Customer {
  id: string;
  organizationId?: string;
  organization_id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  tags?: string[];
  // Indian compliance
  gstin?: string;
  pan?: string;
  state?: string;
  city?: string;
  pincode?: string;
  country?: string;
  // Capita intelligence (computed)
  avgPaymentDays?: number;
  avg_payment_days?: number;
  totalInvoicedLifetime?: number;
  totalPaidLifetime?: number;
  latePaymentCount?: number;
  lastInvoiceDate?: string;
  riskScore?: 'green' | 'yellow' | 'red';
  risk_score?: 'green' | 'yellow' | 'red';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  // New Inventory Brain fields
  sku?: string;
  category?: string;
  vendor?: string;
  costPrice?: number;   // Maps to cost_price
  taxRate?: number;     // Maps to tax_rate
  reorderLevel?: number;// Maps to reorder_level
  isInventoryTracked?: boolean;
  itemType?: 'physical' | 'service';
  status?: 'Active' | 'Inactive' | 'Archived';
  gstRate?: number;     // Legacy support
  hsnCode?: string;     // HSN code for e-commerce
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  price?: number;
  unit?: string;
  discount?: number;
  discountPercent?: number;
  serviceStartDate?: string;
  serviceEndDate?: string;
  productId?: string;
  sku?: string;
  // GST codes
  sacCode?: string;
  sac_code?: string;
  hsnCode?: string;
  hsn_code?: string;
  // Tax per line
  taxRate?: number;
  tax_rate?: number;
  is_exempt?: boolean;
  cgstRate?: number;
  cgst_rate?: number;
  sgstRate?: number;
  sgst_rate?: number;
  igstRate?: number;
  igst_rate?: number;
  cgstAmount?: number;
  cgst_amount?: number;
  sgstAmount?: number;
  sgst_amount?: number;
  igstAmount?: number;
  igst_amount?: number;
  taxableValue?: number;
  taxable_value?: number;
  sortOrder?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customer_id?: string;
  date: string;
  dueDate: string;
  seller: any;
  buyer: any;
  shipTo?: any;
  items: InvoiceItem[];
  // Core totals
  subtotal: number;
  taxAmount: number;
  taxType?: string;
  taxRate?: number;
  discount?: number;
  discountAmount?: number;
  shipping?: number;
  total: number;
  amountPaid?: number;
  // GST split
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  gstType?: 'cgst_sgst' | 'igst' | 'exempt' | 'not_applicable';
  // TDS
  tdsApplicable?: boolean;
  tdsRate?: number;
  tdsAmount?: number;
  netReceivable?: number;
  // Compliance
  placeOfSupply?: string;
  reverseCharge?: boolean;
  isGstRegistered?: boolean;
  frn?: string;
  lutNumber?: string;
  // Persona
  persona?: string;
  // Services firm
  projectName?: string;
  // Ecommerce
  shippingAddress?: string;
  orderNumber?: string;
  orderRef?: string;
  courierName?: string;
  courierTracking?: string;
  dispatchDate?: string;
  // Status and tracking
  status: 'draft' | 'sent' | 'viewed' | 'paid' |
          'partially_paid' | 'overdue' |
          'cancelled' | 'escalated';
  type?: string;
  is_recurring?: boolean;
  notes?: string;
  share_token?: string;
  shareViewedAt?: string;
  // Follow-up tracking
  followUpCount?: number;
  followUp1SentAt?: string;
  followUp2SentAt?: string;
  followUp3SentAt?: string;
  followUpLastSentAt?: string;
  // Timestamps
  createdAt: string;
  updatedAt?: string;
  // Relations
  items_data?: InvoiceItem[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  organizationId?: string;
  organization_id?: string;
  amount: number;
  date: string;
  method?: string;
  paymentMode?: 'upi' | 'neft' | 'imps' | 'rtgs' |
               'cheque' | 'cash' | 'razorpay' |
               'stripe' | 'other';
  referenceNumber?: string;
  upiTransactionId?: string;
  notes?: string;
  status?: string;
  createdAt?: string;
}

export interface Expense {
  id: string;
  organizationId?: string;
  organization_id?: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  vendorName?: string;
  vendor_name?: string;
  gstAmount?: number;
  isItcEligible?: boolean;
  is_itc_eligible?: boolean;
  receiptUrl?: string;
  receipt_url?: string;
  paymentMode?: string;
  referenceNumber?: string;
  createdAt?: string;
}

export interface Reminder {
  id: string;
  title: string; // Used to be 'task'
  dueDate: string; // ISO string 
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Snoozed' | 'Completed' | 'Overdue';
  referenceType?: 'Invoice' | 'Client' | 'Expense' | 'General' | null;
  referenceId?: string | null;
  actionText?: string | null;
  completed?: boolean; // Kept for backward compatibility
  snoozedUntil?: string | null;
  organization_id?: string;
  user_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AIRule {
  id: string;
  name: string;
  description: string;
  condition: {
    field: string;
    operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
    value: any;
  }[];
  action: {
    type: 'suggest' | 'warn' | 'auto';
    message: string;
    data?: any;
  };
  priority: number;
  enabled: boolean;
}

export interface DashboardStats {
  totalRevenue?: number;
  totalInvoices?: number;
  pendingPayments?: number;
  overdueInvoices?: number;
  lowStockItems?: number;
  total_customers?: number;
  pending_payments?: number;
  overdue_revenue?: number;
  total_revenue?: number;
  pending_invoices?: number;
  overdue_invoices?: number;
  recentActivity?: any[];
  [key: string]: any;
}

export type Language = 'en';

export interface Translation {
  [key: string]: {
    en: string;
  };
}

export interface AISuggestion {
  id: string;
  type: 'suggest' | 'warn' | 'auto';
  message: string;
  data?: any;
  priority: number;
}

export interface CustomerInsights {
  totalInvoices: number;
  totalRevenue: number;
  lastTransactionDate: string | null;
  invoiceStatusBreakdown: {
    paid: number;
    pending: number;
    overdue: number;
    draft: number;
  };
  healthScore: number;
  churnRisk: number;
  healthLabel: 'VIP' | 'Active' | 'Regular' | 'At Risk' | 'New';
}

export interface ComplianceTask {
  id: string;
  type: string;
  description: string;
  due_date: string;
  status: "completed" | "pending" | "overdue";
  priority: "low" | "medium" | "high" | "critical";
  notes?: string;
}

export interface ProductPerformance {
  id: string;
  name: string;
  total_quantity_sold?: number;
  sales?: number;
  revenue?: number;
}

// Adaptive UI / Business Personas
export type BusinessType = 'solopreneur' | 'services_firm' | 'subscription' | 'ecommerce' | 'ca';

export interface UserProfile {
  id: string;
  businessType: BusinessType;
  updatedAt: Date;
}