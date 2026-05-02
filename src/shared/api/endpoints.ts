// ═══════════════════════════════════════════════════════════════════════════
//  API Endpoints — Single source of truth for all backend route paths
// ═══════════════════════════════════════════════════════════════════════════

export const ENDPOINTS = {

    // ─── Auth ──────────────────────────────────────────────────────────
    AUTH_SIGNUP: '/auth/signup',
    AUTH_VERIFY_OTP: '/auth/verify-otp',
    AUTH_RESEND: '/auth/resend-confirmation',
    AUTH_PROVISION: '/auth/provision',

    // ─── Invoices ──────────────────────────────────────────────────────
    INVOICES: '/invoices',
    INVOICE: (id: string) => `/invoices/${id}`,
    INVOICE_PDF: (id: string) => `/invoices/${id}/pdf`,
    INVOICE_DUPLICATE: (id: string) => `/invoices/${id}/duplicate`,
    INVOICE_SHARE_MARK: (id: string) => `/invoices/${id}/share`,
    INVOICE_SEND: (id: string) => `/invoices/${id}/send`,
    INVOICE_REMINDER: (id: string) => `/invoices/${id}/reminder`,
    INVOICE_SHARE: (tok: string) => `/invoices/share/${tok}`,
    INVOICE_NEXT_NUMBER: '/invoices/next-number',

    // ─── Customers ─────────────────────────────────────────────────────
    CUSTOMERS: '/customers',
    CUSTOMER: (id: string) => `/customers/${id}`,
    CUSTOMER_INSIGHTS: (id: string) => `/customers/${id}/insights`,
    CUSTOMER_INVOICES: (id: string) => `/customers/${id}/invoices`,

    // ─── Products ──────────────────────────────────────────────────────
    PRODUCTS: '/products',
    PRODUCT: (id: string) => `/products/${id}`,

    // ─── Expenses ──────────────────────────────────────────────────────
    EXPENSES: '/expenses',
    EXPENSE: (id: string) => `/expenses/${id}`,

    // ─── Payments ──────────────────────────────────────────────────────
    PAYMENTS: '/payments',
    PAYMENT_RECEIPT: (id: string) => `/payments/download-receipt/${id}`,
    PAYMENT_RECONCILE: (id: string) => `/payments/${id}/reconcile`,

    // ─── Settings ──────────────────────────────────────────────────────
    SETTINGS: '/settings',
    INVENTORY_SETTINGS: '/inventory/settings',

    // ─── Integrations ──────────────────────────────────────────────────
    INTEGRATIONS_GOOGLE_AUTH: '/integrations/google/auth',
    INTEGRATIONS_GOOGLE_STATUS: '/integrations/google/status',
    INTEGRATIONS_GOOGLE_DISCONNECT: '/integrations/google/disconnect',
    INTEGRATIONS_GOOGLE_CALLBACK: '/integrations/google/callback',

    // ─── Email ─────────────────────────────────────────────────────────
    EMAIL_TEST: '/email/test-connection',
    EMAIL_SEND_INVOICE: '/email/send-invoice',

    // ─── Upload ────────────────────────────────────────────────────────
    UPLOAD_LOGO: '/upload/logo',
    UPLOAD_PAYMENT_QR: '/upload/payment-qr',
    LOGO_URL: (fn: string) => `/uploads/logos/${fn}`,
    PAYMENT_QR_URL: (fn: string) => `/uploads/payment-qr/${fn}`,

    // ─── Compliance ────────────────────────────────────────────────────
    COMPLIANCE: '/compliance',
    COMPLIANCE_TASK: (id: string) => `/compliance/${id}`,

    // ─── Notifications ─────────────────────────────────────────────────
    NOTIFICATIONS: '/notifications',

    // ─── Reports ───────────────────────────────────────────────────────
    REPORTS: '/reports',

    // ─── Analytics ─────────────────────────────────────────────────────
    DASHBOARD_STATS: '/dashboard-stats',
    ANALYTICS_REVENUE: '/analytics/revenue-trends',
    ANALYTICS_CUSTOMER: '/analytics/customer-insights',
    ANALYTICS_PRODUCT: '/analytics/product-performance',
    ANALYTICS_CASH_FLOW: '/analytics/cash-flow',
    ANALYTICS_HEALTH: '/analytics/health-score',
    ANALYTICS_SAFE_TO_SPEND: '/analytics/safe-to-spend',
    ANALYTICS_PERSONA: '/analytics/persona-stats',
    ANALYTICS_EXPORT: '/analytics/export',

    // ─── AI ────────────────────────────────────────────────────────────
    AI_CHAT: '/ai/chat',
    AI_CHAT_STREAM: '/ai/chat/stream',
    AI_WORKSPACE: (domain: string) => `/ai/workspaces/${domain}`,
    AI_CONFIG: '/ai/config',
    AI_MAGIC_FILL: '/ai/magic-fill',
    AI_INSIGHTS: '/ai/insights',
    AI_PREDICT_REVENUE: '/ai/predict-revenue',
    AI_COMMAND: '/ai/command',
    AI_SETTLEMENT: '/ai/settlement',
    AI_AUDIT_INVOICE: '/ai/audit-invoice',
    AI_CONVERSATIONS: '/ai/conversations',
    AI_CONVERSATION_MESSAGES: (id: string) => `/ai/conversations/${id}`,
    AI_HISTORY: '/ai/history',
    AI_ACTION_EXECUTE: '/ai/actions/execute',
    AI_USAGE: '/ai/usage',
    AI_BUDGET: '/ai/budget',

    // ─── AI Collections ────────────────────────────────────────────────
    AI_COLLECTIONS_DRAFT: '/ai/collections/generate-draft',
    AI_COLLECTIONS_SEND: '/ai/collections/send',
};
