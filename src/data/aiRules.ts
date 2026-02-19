import { AIRule } from '../types';

export const aiRules: AIRule[] = [
  {
    id: 'low-stock-alert',
    name: 'Low Stock Alert',
    description: 'Alert when product stock is below minimum threshold',
    condition: [
      { field: 'stock', operator: 'lte', value: 'minStock' }
    ],
    action: {
      type: 'warn',
      message: 'Stock is running low. Consider reordering soon.',
      data: { severity: 'medium' }
    },
    priority: 1,
    enabled: true
  },
  {
    id: 'overdue-payment-reminder',
    name: 'Overdue Payment Reminder',
    description: 'Suggest sending reminder for overdue invoices',
    condition: [
      { field: 'dueDate', operator: 'lt', value: 'today' },
      { field: 'status', operator: 'eq', value: 'sent' }
    ],
    action: {
      type: 'suggest',
      message: 'This invoice is overdue. Send a payment reminder?',
      data: { action: 'send_reminder' }
    },
    priority: 2,
    enabled: true
  },
  {
    id: 'large-order-discount',
    name: 'Large Order Discount Suggestion',
    description: 'Suggest discount for large quantity orders',
    condition: [
      { field: 'totalQuantity', operator: 'gte', value: 10 }
    ],
    action: {
      type: 'suggest',
      message: 'Consider offering a bulk discount for this large order.',
      data: { suggestedDiscount: 5 }
    },
    priority: 3,
    enabled: true
  },
  {
    id: 'duplicate-customer-check',
    name: 'Duplicate Customer Check',
    description: 'Check for potential duplicate customers',
    condition: [
      { field: 'phone', operator: 'eq', value: 'existing_phone' }
    ],
    action: {
      type: 'warn',
      message: 'A customer with this phone number already exists.',
      data: { severity: 'high' }
    },
    priority: 1,
    enabled: true
  },
  {
    id: 'gst-validation',
    name: 'GST Number Validation',
    description: 'Validate GST number format',
    condition: [
      { field: 'taxId', operator: 'contains', value: 'invalid_format' }
    ],
    action: {
      type: 'warn',
      message: 'GST number format appears invalid. Please verify.',
      data: { severity: 'high' }
    },
    priority: 1,
    enabled: true
  },
  {
    id: 'payment-follow-up',
    name: 'Payment Follow-up',
    description: 'Suggest follow-up for pending payments',
    condition: [
      { field: 'daysSinceInvoice', operator: 'gte', value: 15 },
      { field: 'status', operator: 'eq', value: 'sent' }
    ],
    action: {
      type: 'suggest',
      message: 'This invoice is 15+ days old. Consider a follow-up call.',
      data: { action: 'schedule_call' }
    },
    priority: 2,
    enabled: true
  },
  {
    id: 'inventory-reorder-point',
    name: 'Inventory Reorder Point',
    description: 'Calculate optimal reorder point based on sales velocity',
    condition: [
      { field: 'averageDailySales', operator: 'gt', value: 0 },
      { field: 'stock', operator: 'lte', value: 'reorderPoint' }
    ],
    action: {
      type: 'suggest',
      message: 'Based on sales velocity, reorder this item soon.',
      data: { suggestedQuantity: 'calculated' }
    },
    priority: 2,
    enabled: true
  },
  {
    id: 'seasonal-demand-forecast',
    name: 'Seasonal Demand Forecast',
    description: 'Predict seasonal demand changes',
    condition: [
      { field: 'month', operator: 'eq', value: 'peak_season' }
    ],
    action: {
      type: 'suggest',
      message: 'Peak season approaching. Consider stocking up on popular items.',
      data: { factor: 1.5 }
    },
    priority: 3,
    enabled: true
  },
  {
    id: 'customer-credit-limit',
    name: 'Customer Credit Limit Check',
    description: 'Check customer outstanding against credit limit',
    condition: [
      { field: 'outstandingAmount', operator: 'gte', value: 'creditLimit' }
    ],
    action: {
      type: 'warn',
      message: 'Customer has reached their credit limit.',
      data: { severity: 'high' }
    },
    priority: 1,
    enabled: true
  },
  {
    id: 'tax-compliance-check',
    name: 'Tax Compliance Check',
    description: 'Ensure tax calculations are compliant',
    condition: [
      { field: 'gstRate', operator: 'eq', value: 0 },
      { field: 'total', operator: 'gt', value: 10000 }
    ],
    action: {
      type: 'warn',
      message: 'High-value transaction without GST. Please verify.',
      data: { severity: 'high' }
    },
    priority: 1,
    enabled: true
  }
];

export const cannedResponses = {
  payment_reminder: {
    en: {
      friendly: "Hi {customerName}! Just a gentle reminder that your invoice #{invoiceNumber} for ₹{amount} is due. Please let us know if you need any assistance. Thank you!",
      formal: "Dear {customerName}, This is a reminder that invoice #{invoiceNumber} for ₹{amount} is due for payment. Please process the payment at your earliest convenience.",
      urgent: "URGENT: Invoice #{invoiceNumber} for ₹{amount} is overdue. Please settle this immediately to avoid service disruption."
    },
    hi: {
      friendly: "नमस्ते {customerName}! आपका चालान #{invoiceNumber} ₹{amount} का बकाया है। कृपया भुगतान करें। धन्यवाद!",
      formal: "प्रिय {customerName}, यह अनुस्मारक है कि चालान #{invoiceNumber} ₹{amount} का भुगतान देय है।",
      urgent: "तत्काल: चालान #{invoiceNumber} ₹{amount} का भुगतान लंबित है। कृपया तुरंत भुगतान करें।"
    },
    mr: {
      friendly: "नमस्कार {customerName}! तुमचा बिल #{invoiceNumber} ₹{amount} चा थकीत आहे. कृपया पेमेंट करा. धन्यवाद!",
      formal: "प्रिय {customerName}, हे स्मरणपत्र आहे की बिल #{invoiceNumber} ₹{amount} चे पेमेंट थकीत आहे.",
      urgent: "तातडीने: बिल #{invoiceNumber} ₹{amount} चे पेमेंट थकीत आहे. कृपया तातडीने पेमेंट करा."
    }
  }
};