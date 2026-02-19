import { Translation } from '../types';

export const translations: Translation = {
  // Navigation
  control_room: { en: 'Control Room', hi: 'कंट्रोल रूम', mr: 'नियंत्रण कक्ष' },
  invoices: { en: 'Invoices', hi: 'चालान', mr: 'बिल' },
  customers: { en: 'Customers', hi: 'ग्राहक', mr: 'ग्राहक' },
  payments: { en: 'Payments', hi: 'भुगतान', mr: 'पेमेंट' },
  reminders: { en: 'Reminders', hi: 'अनुस्मारक', mr: 'स्मरणपत्र' },
  expenses: { en: 'Expenses', hi: 'खर्च', mr: 'खर्च' },
  inventory: { en: 'Inventory', hi: 'सामग्री', mr: 'साठा' },
  reports: { en: 'Reports', hi: 'रिपोर्ट', mr: 'अहवाल' },
  compliance: { en: 'Compliance', hi: 'अनुपालन', mr: 'अनुपालन' },

  // Common
  save: { en: 'Save', hi: 'सेव करें', mr: 'सेव्ह करा' },
  cancel: { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा' },
  edit: { en: 'Edit', hi: 'संपादित करें', mr: 'संपादित करा' },
  delete: { en: 'Delete', hi: 'हटाएं', mr: 'डिलीट करा' },
  create: { en: 'Create', hi: 'बनाएं', mr: 'तयार करा' },
  search: { en: 'Search', hi: 'खोजें', mr: 'शोधा' },
  filter: { en: 'Filter', hi: 'फ़िल्टर', mr: 'फिल्टर' },
  total: { en: 'Total', hi: 'कुल', mr: 'एकूण' },
  amount: { en: 'Amount', hi: 'राशि', mr: 'रक्कम' },
  date: { en: 'Date', hi: 'दिनांक', mr: 'दिनांक' },
  status: { en: 'Status', hi: 'स्थिति', mr: 'स्थिती' },

  // Invoice specific
  invoice_number: { en: 'Invoice Number', hi: 'चालान संख्या', mr: 'बिल नंबर' },
  due_date: { en: 'Due Date', hi: 'नियत तारीख', mr: 'देय दिनांक' },
  subtotal: { en: 'Subtotal', hi: 'उप-योग', mr: 'उप-एकूण' },
  gst_amount: { en: 'GST Amount', hi: 'जीएसटी राशि', mr: 'जीएसटी रक्कम' },

  // Status
  draft: { en: 'Draft', hi: 'मसौदा', mr: 'मसुदा' },
  sent: { en: 'Sent', hi: 'भेजा गया', mr: 'पाठवले' },
  paid: { en: 'Paid', hi: 'भुगतान हुआ', mr: 'पेमेंट झाले' },
  overdue: { en: 'Overdue', hi: 'देरी से', mr: 'मुदत संपली' },
  cancelled: { en: 'Cancelled', hi: 'रद्द', mr: 'रद्द' },

  // Malika AI
  ai_assistant: { en: 'Malika AI', hi: 'मलिका एआई', mr: 'मलिका एआय' },
  suggestions: { en: 'Suggestions', hi: 'सुझाव', mr: 'सूचना' },

  // Reports
  profit_loss: { en: 'Profit & Loss', hi: 'लाभ हानि', mr: 'नफा तोटा' },
  sales_by_product: { en: 'Sales by Product', hi: 'उत्पाद के अनुसार बिक्री', mr: 'उत्पादानुसार विक्री' },

  // Messages
  low_stock_alert: { en: 'Low stock alert', hi: 'कम स्टॉक चेतावनी', mr: 'कमी साठा चेतावणी' },
  payment_reminder_sent: { en: 'Payment reminder sent', hi: 'भुगतान अनुस्मारक भेजा गया', mr: 'पेमेंट स्मरणपत्र पाठवले' },
  invoice_created: { en: 'Invoice created successfully', hi: 'चालान सफलतापूर्वक बनाया गया', mr: 'बिल यशस्वीरित्या तयार केले' },

  // WhatsApp messages
  whatsapp_reminder: {
    en: 'Hi {customerName}, your invoice {invoiceNumber} for ₹{amount} is due. Please pay at your earliest convenience. Thank you!',
    hi: 'नमस्ते {customerName}, आपका चालान {invoiceNumber} ₹{amount} का देय है। कृपया जल्दी भुगतान करें। धन्यवाद!',
    mr: 'नमस्कार {customerName}, तुमचा बिल {invoiceNumber} ₹{amount} चा देय आहे. कृपया लवकर पेमेंट करा. धन्यवाद!'
  }
};