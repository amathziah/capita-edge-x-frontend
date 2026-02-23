import { Translation } from '../types';

export const translations: Translation = {
  // Navigation
  control_room: { en: 'Control Room' },
  invoices: { en: 'Invoices' },
  customers: { en: 'Customers' },
  payments: { en: 'Payments' },
  reminders: { en: 'Reminders' },
  expenses: { en: 'Expenses' },
  inventory: { en: 'Inventory' },
  reports: { en: 'Reports' },
  compliance: { en: 'Compliance' },

  // Common
  save: { en: 'Save' },
  cancel: { en: 'Cancel' },
  edit: { en: 'Edit' },
  delete: { en: 'Delete' },
  create: { en: 'Create' },
  search: { en: 'Search' },
  filter: { en: 'Filter' },
  total: { en: 'Total' },
  amount: { en: 'Amount' },
  date: { en: 'Date' },
  status: { en: 'Status' },

  // Invoice specific
  invoice_number: { en: 'Invoice Number' },
  due_date: { en: 'Due Date' },
  subtotal: { en: 'Subtotal' },
  gst_amount: { en: 'GST Amount' },

  // Status
  draft: { en: 'Draft' },
  sent: { en: 'Sent' },
  paid: { en: 'Paid' },
  overdue: { en: 'Overdue' },
  cancelled: { en: 'Cancelled' },

  // Malika AI
  ai_assistant: { en: 'Malika AI' },
  suggestions: { en: 'Suggestions' },

  // Reports
  profit_loss: { en: 'Profit & Loss' },
  sales_by_product: { en: 'Sales by Product' },

  // Messages
  low_stock_alert: { en: 'Low stock alert' },
  payment_reminder_sent: { en: 'Payment reminder sent' },
  invoice_created: { en: 'Invoice created successfully' },

  // WhatsApp messages
  whatsapp_reminder: {
    en: 'Hi {customerName}, your invoice {invoiceNumber} for ₹{amount} is due. Please pay at your earliest convenience. Thank you!'
  }
};