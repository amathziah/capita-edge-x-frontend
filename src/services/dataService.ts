import { invoiceService } from './invoiceService';
import { customerService } from './customerService';
import { productService } from './productService';
import { expenseService, paymentService, reminderService, settingService, complianceService, notificationService } from './domainServices';
import { aiService } from './aiService';
import { analyticsService } from './analyticsService';
import { api } from '../api/client';

// Re-export services for direct usage
export {
  invoiceService,
  customerService,
  productService,
  expenseService,
  paymentService,
  reminderService,
  settingService,
  complianceService,
  notificationService,
  aiService,
  analyticsService
};

// Maintain backward compatibility class for existing components
class DataService {

  // Customers
  getCustomers = customerService.getCustomers;
  saveCustomer = customerService.saveCustomer;
  deleteCustomer = customerService.deleteCustomer;
  getCustomerInsights = customerService.getCustomerInsights;
  getCustomerInvoices = customerService.getCustomerInvoices;

  // Reminders
  getReminders = reminderService.getReminders;
  saveReminder = reminderService.saveReminder;
  deleteReminder = reminderService.deleteReminder;

  // Products
  getProducts = productService.getProducts;
  saveProduct = productService.saveProduct;
  updateProduct = productService.updateProduct;
  deleteProduct = productService.deleteProduct;

  // Invoices
  getInvoices = invoiceService.getInvoices;
  getInvoice = invoiceService.getInvoice;
  saveInvoice = invoiceService.saveInvoice;
  deleteInvoice = invoiceService.deleteInvoice;
  duplicateInvoice = invoiceService.duplicateInvoice;

  // Dashboard Stats
  getDashboardStats = analyticsService.getDashboardStats;

  // Payments
  getPayments = paymentService.getPayments;
  savePayment = paymentService.savePayment;

  // Expenses
  getExpenses = expenseService.getExpenses;
  saveExpense = expenseService.saveExpense;
  deleteExpense = expenseService.deleteExpense;

  // Settings
  getSettings = settingService.getSettings;
  saveSetting = settingService.saveSetting;
  testEmailConnection = settingService.testEmail;

  // Compliance
  getComplianceTasks = complianceService.getTasks;
  saveComplianceTask = complianceService.saveTask;
  updateComplianceTask = complianceService.updateTask;
  deleteComplianceTask = complianceService.deleteTask;

  // Notifications
  getNotifications = notificationService.getNotifications;

  // Utilities
  generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
  generateInvoiceNumber = invoiceService.generateNumber;

  // Email
  sendInvoiceEmail = async (invoiceId: string, to: string, pdfBlob?: Blob | null) => {
    const base64 = pdfBlob ? await aiService.blobToBase64(pdfBlob) : undefined;
    return invoiceService.sendInvoice(invoiceId, to, base64);
  };

  sendPaymentReminder = async (invoiceId: string, to: string, pdfBlob?: Blob | null) => {
    const base64 = pdfBlob ? await aiService.blobToBase64(pdfBlob) : undefined;
    return invoiceService.sendReminder(invoiceId, to, base64);
  };

  // Upload
  uploadLogo = settingService.uploadLogo;
  getLogoUrl = (filename?: string) => {
    if (!filename) return '';
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return `${API_URL}/uploads/logos/${filename}`;
  };

  // Analytics
  getRevenueTrends = analyticsService.getRevenueTrends;
  getAnalyticsCustomerInsights = analyticsService.getCustomerInsights;
  getProductPerformance = analyticsService.getProductPerformance;
  getInventorySettings = settingService.getInventorySettings;
  saveInventorySettings = settingService.saveInventorySettings;
  getCashFlowAnalysis = analyticsService.getCashFlow;
  getBusinessHealthScore = analyticsService.getHealthScore;

  // Fix exportData binding/arguments
  exportData = async (type: string = 'invoices') => {
    return analyticsService.exportData(type);
  };

  // AI
  getSafeToSpend = analyticsService.getSafeToSpend;
  generateSettlementOffer = aiService.generateSettlementOffer;
  sendCommand = aiService.sendCommand;
}

export const dataService = new DataService();