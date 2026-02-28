export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string; // Standardized from gstin
  tags: string[];
  organization_id?: string;
  createdAt: Date;
  updatedAt: Date;
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
  price: number;
  unit?: string;
  discount?: number;
  // Persona Specifics
  serviceStartDate?: string;
  serviceEndDate?: string;
  // Inventory Link
  productId?: string;
  sku?: string;
  sacCode?: string;
  hsnCode?: string;
}

export interface Invoice {
  id: string; // UUID
  invoiceNumber: string;
  customerId?: string; // Link to Customer (optional for backward compatibility)
  date: string; // ISO Date
  dueDate: string; // ISO Date

  // Denormalized for display/history
  seller: any;
  buyer: any;
  shipTo?: any;
  shippingAddress?: string; // For E-commerce
  projectName?: string;     // For Agency
  orderNumber?: string;     // For E-commerce/SaaS

  items: InvoiceItem[];

  // Financials
  subtotal: number;
  taxAmount: number;
  taxType?: string;
  taxRate?: number;
  discount?: number;
  shipping?: number;
  total: number;
  amountPaid?: number; // Calculated field

  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'sent' | 'viewed' | 'cancelled' | 'escalated' | 'partially_paid';
  type?: 'one-off' | 'subscription' | 'recurring';
  is_recurring?: boolean;
  notes?: string;
  share_token?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'check' | 'other';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: Date;
  date?: string; // Standardized ISO date for payment recording
  notes?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  gstAmount: number;
  createdAt: Date;
  receiptUrl?: string;
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
export type BusinessType = 'solopreneur' | 'agency' | 'saas' | 'ecommerce';

export interface UserProfile {
  id: string;
  businessType: BusinessType;
  updatedAt: Date;
}