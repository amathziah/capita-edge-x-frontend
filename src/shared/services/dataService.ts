import { invoiceService } from './invoiceService';
import { customerService } from './customerService';
import { productService } from './productService';
import { expenseService, paymentService, settingService, complianceService, notificationService, reportService } from './domainServices';
import { aiService } from './aiService';
import { analyticsService } from './analyticsService';
import { API_URL } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

// Re-export services for direct usage
export {
  invoiceService,
  customerService,
  productService,
  expenseService,
  paymentService,
  settingService,
  complianceService,
  notificationService,
  reportService,
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
  getShareUrl = invoiceService.getShareUrl;

  // Dashboard Stats
  getDashboardStats = analyticsService.getDashboardStats;

  // Payments
  getPayments = paymentService.getPayments;
  savePayment = paymentService.savePayment;
  downloadReceipt = paymentService.downloadReceipt;
  reconcilePayment = paymentService.reconcilePayment;

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

  // Reports (Operational Integrity)
  getReports = reportService.getReports;
  createReport = reportService.createReport;

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
    return `${API_URL}${ENDPOINTS.LOGO_URL(filename)}`;
  };

  // Cache for analytics and AI
  private cache: { [key: string]: { data: any, timestamp: number } } = {};
  private CACHE_TTL = 1000 * 60 * 5; // 5 minutes

  // Analytics
  getRevenueTrends = async (period: string = 'monthly') => {
    const cacheKey = `revenue_trends_${period}`;
    const cached = this.cache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.data;
    }
    const data = await analyticsService.getRevenueTrends(period);
    this.cache[cacheKey] = { data, timestamp: Date.now() };
    return data;
  };
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
  getAiInsights = async (persona?: string) => {
    const cacheKey = `ai_insights_${persona || 'general'}`;
    const cached = this.cache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.data;
    }
    const data = await aiService.getInsights(persona);
    this.cache[cacheKey] = { data, timestamp: Date.now() };
    return data;
  };
  sendCommand = aiService.sendCommand;
}

export const dataService = new DataService();
