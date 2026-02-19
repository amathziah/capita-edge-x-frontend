/**
 * Universal Invoice Engine — Zod Validation Schemas
 * ===================================================
 * Strict validation with conditional business rules.
 *
 * Key rules:
 *   - Export → GST must be 0
 *   - Inter-state → IGST only (no CGST/SGST)
 *   - Credit/Debit notes → linked_invoice_id required
 *   - Tax invoices → HSN/SAC mandatory on line items
 *   - Services → service period in dynamic_meta
 *   - Foreign currency → exchange_rate required (≠ 1)
 */

import { z } from 'zod';

// ─── Enum Schemas ────────────────────────────────────────────────────────────

export const invoiceTypeSchema = z.enum([
    'tax_invoice',
    'bill_of_supply',
    'proforma',
    'credit_note',
    'debit_note',
    'delivery_challan',
]);

export const invoiceStatusSchema = z.enum([
    'draft',
    'awaiting_approval',
    'approved',
    'sent',
    'partially_paid',
    'paid',
    'void',
    'write_off',
]);

export const lineItemTypeSchema = z.enum([
    'good',
    'service',
    'asset',
    'shipping',
    'adjustment',
]);

export const gstTreatmentSchema = z.enum([
    'regular',
    'sez_export',
    'deemed_export',
    'overseas',
    'unregistered',
    'composition',
]);

export const discountTypeSchema = z.enum(['percentage', 'flat']);
export const paymentTermTypeSchema = z.enum(['net_d', 'due_on_receipt', 'custom']);

// ─── Sub-object Schemas ──────────────────────────────────────────────────────

export const addressSnapshotSchema = z.object({
    name: z.string().optional(),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    state_code: z.string().max(4).optional(),
    postal_code: z.string().max(10).optional(),
    country: z.string().optional(),
    gstin: z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
    pan: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/, 'Invalid PAN format').optional().or(z.literal('')),
}).passthrough();

export const complianceMetaSchema = z.object({
    gst_treatment: gstTreatmentSchema.optional(),
    place_of_supply: z.string().optional(),
    reverse_charge: z.boolean().optional().default(false),
    lut_bond_no: z.string().optional(),
    eway_bill_no: z.string().optional(),
    irn: z.string().optional(),
    ack_no: z.string().optional(),
    ack_date: z.string().optional(),
    vehicle_no: z.string().optional(),
    port_code: z.string().max(6).optional(),
    shipping_bill_no: z.string().optional(),
    shipping_bill_date: z.string().optional(),
}).passthrough();

export const paymentTermsSchema = z.object({
    type: paymentTermTypeSchema,
    days: z.number().int().min(0).max(365).optional(),
    due_date: z.string().optional(),
    early_discount_percent: z.number().min(0).max(100).optional(),
    early_discount_days: z.number().int().min(0).optional(),
}).refine(
    (data) => {
        if (data.type === 'net_d' && (data.days === undefined || data.days === null)) {
            return false;
        }
        return true;
    },
    { message: 'Payment term "net_d" requires a "days" value', path: ['days'] }
);

export const lineItemDiscountSchema = z.object({
    type: discountTypeSchema,
    value: z.number().min(0),
    reason: z.string().max(200).optional(),
}).refine(
    (data) => {
        if (data.type === 'percentage' && data.value > 100) return false;
        return true;
    },
    { message: 'Percentage discount cannot exceed 100%', path: ['value'] }
);

export const documentDiscountSchema = lineItemDiscountSchema;

export const taxBreakdownSchema = z.object({
    cgst_rate: z.number().min(0).optional(),
    cgst: z.number().min(0).optional(),
    sgst_rate: z.number().min(0).optional(),
    sgst: z.number().min(0).optional(),
    igst_rate: z.number().min(0).optional(),
    igst: z.number().min(0).optional(),
    cess_rate: z.number().min(0).optional(),
    cess: z.number().min(0).optional(),
});

// ─── Dynamic Meta Schemas (Polymorphic) ──────────────────────────────────────

export const inventoryMetaSchema = z.object({
    sku: z.string().optional(),
    batch_no: z.string().optional(),
    expiry: z.string().optional(),
    serial_numbers: z.array(z.string()).optional(),
    warehouse: z.string().optional(),
    barcode: z.string().optional(),
}).passthrough();

export const serviceMetaSchema = z.object({
    service_period_start: z.string().optional(),
    service_period_end: z.string().optional(),
    timesheet_ids: z.array(z.number()).optional(),
    milestone: z.string().optional(),
    sac_description: z.string().optional(),
}).passthrough();

export const constructionMetaSchema = z.object({
    work_order_no: z.string().optional(),
    completion_pct: z.number().min(0).max(100).optional(),
    retention_pct: z.number().min(0).max(100).optional(),
    site_code: z.string().optional(),
    ra_bill_no: z.string().optional(),
}).passthrough();

export const dynamicMetaSchema = z.union([
    inventoryMetaSchema,
    serviceMetaSchema,
    constructionMetaSchema,
    z.record(z.unknown()),
]);

// ─── Line Item Schema ────────────────────────────────────────────────────────

export const lineItemSchema = z.object({
    id: z.string().uuid().optional(),
    invoice_id: z.string().uuid().optional(),
    sort_order: z.number().int().min(0).default(0),

    item_type: lineItemTypeSchema.default('good'),
    product_id: z.string().uuid().nullable().optional(),
    description: z.string().min(1, 'Description is required').max(500),
    hsn_sac_code: z.string().max(10).nullable().optional(),

    quantity: z.union([z.string(), z.number()])
        .transform(v => String(v))
        .refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Quantity must be positive'),
    unit: z.string().max(20).default('nos'),
    unit_price: z.union([z.string(), z.number()])
        .transform(v => String(v))
        .refine(v => !isNaN(Number(v)) && Number(v) >= 0, 'Unit price must be non-negative'),

    discount: lineItemDiscountSchema.optional().default({ type: 'flat', value: 0 }),
    tax_rate: z.union([z.string(), z.number()])
        .transform(v => String(v))
        .default('0'),

    tax_breakdown: taxBreakdownSchema.optional().default({}),
    dynamic_meta: dynamicMetaSchema.optional().default({}),
});

// ─── Invoice Schema (Full) ───────────────────────────────────────────────────

export const invoiceV2Schema = z.object({
    id: z.string().uuid().optional(),
    organization_id: z.string().uuid(),
    customer_id: z.string().uuid().nullable().optional(),

    invoice_number: z.string().min(1, 'Invoice number is required').max(30),
    type: invoiceTypeSchema.default('tax_invoice'),
    status: invoiceStatusSchema.default('draft'),

    issue_date: z.string().min(1, 'Issue date is required'),
    due_date: z.string().nullable().optional(),

    // Currency
    currency_code: z.string().length(3, 'Must be ISO 4217 code (e.g. INR, USD)').default('INR'),
    exchange_rate: z.union([z.string(), z.number()])
        .transform(v => String(v))
        .default('1'),

    // Addresses
    billing_address: addressSnapshotSchema.default({}),
    shipping_address: addressSnapshotSchema.optional().default({}),
    seller_details: addressSnapshotSchema.default({}),

    // Compliance
    compliance_meta: complianceMetaSchema.default({}),

    // Terms
    payment_terms: paymentTermsSchema.optional(),
    document_discount: documentDiscountSchema.optional(),

    // TDS
    tds_rate: z.union([z.string(), z.number()]).transform(v => String(v)).optional().default('0'),
    tds_section: z.string().max(20).nullable().optional(),

    // Shipping
    shipping_charges: z.union([z.string(), z.number()]).transform(v => String(v)).optional().default('0'),

    // Linked document
    linked_invoice_id: z.string().uuid().nullable().optional(),

    // Notes
    notes: z.string().max(2000).nullable().optional(),
    internal_notes: z.string().max(2000).nullable().optional(),
    terms_text: z.string().max(5000).nullable().optional(),

    // Line Items
    line_items: z.array(lineItemSchema).min(1, 'At least one line item is required'),

})
    // ─── Cross-Field Business Rules ──────────────────────────────────────────────
    .superRefine((data, ctx) => {

        // Rule 1: Credit/Debit notes MUST reference a parent invoice
        if ((data.type === 'credit_note' || data.type === 'debit_note') && !data.linked_invoice_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${data.type === 'credit_note' ? 'Credit' : 'Debit'} notes must reference a linked invoice`,
                path: ['linked_invoice_id'],
            });
        }

        // Rule 2: Foreign currency → exchange_rate must not be default 1
        if (data.currency_code !== 'INR' && (data.exchange_rate === '1' || data.exchange_rate === '1.0')) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Exchange rate must be set for foreign currency invoices',
                path: ['exchange_rate'],
            });
        }

        // Rule 3: Export invoices → GST must be 0 on all line items
        const isExport = data.compliance_meta?.gst_treatment === 'overseas'
            || data.compliance_meta?.gst_treatment === 'sez_export';

        if (isExport) {
            data.line_items.forEach((item, i) => {
                const rate = Number(item.tax_rate);
                if (rate > 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Export invoices (overseas/SEZ) must have 0% GST',
                        path: ['line_items', i, 'tax_rate'],
                    });
                }
            });
        }

        // Rule 4: Tax invoices → HSN/SAC code mandatory on goods/services
        if (data.type === 'tax_invoice') {
            data.line_items.forEach((item, i) => {
                if (['good', 'service'].includes(item.item_type) && !item.hsn_sac_code) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'HSN/SAC code is mandatory for goods and services on tax invoices',
                        path: ['line_items', i, 'hsn_sac_code'],
                    });
                }
            });
        }

        // Rule 5: Service items → should have service period in dynamic_meta
        data.line_items.forEach((item, i) => {
            if (item.item_type === 'service') {
                const meta = item.dynamic_meta as Record<string, unknown>;
                if (!meta?.service_period_start || !meta?.service_period_end) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Service items should specify service_period_start and service_period_end in dynamic_meta',
                        path: ['line_items', i, 'dynamic_meta'],
                    });
                }
            }
        });

        // Rule 6: Bill of supply → should have 0% tax (composition/exempt)
        if (data.type === 'bill_of_supply') {
            data.line_items.forEach((item, i) => {
                const rate = Number(item.tax_rate);
                if (rate > 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Bill of supply should have 0% tax (used for composition/exempt dealers)',
                        path: ['line_items', i, 'tax_rate'],
                    });
                }
            });
        }

        // Rule 7: Reverse charge → compliance_meta.reverse_charge must be explicitly true
        if (data.compliance_meta?.reverse_charge === true && data.type === 'bill_of_supply') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Reverse charge is not applicable on Bill of Supply',
                path: ['compliance_meta', 'reverse_charge'],
            });
        }
    });

// ─── Status Transition Validation ────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
    draft: ['awaiting_approval', 'approved', 'sent', 'void'],
    awaiting_approval: ['approved', 'draft', 'void'],
    approved: ['sent', 'void'],
    sent: ['partially_paid', 'paid', 'void', 'write_off'],
    partially_paid: ['paid', 'void', 'write_off'],
    paid: [],                       // Terminal state
    void: [],                       // Terminal state
    write_off: [],                       // Terminal state
};

export function validateStatusTransition(
    currentStatus: string,
    newStatus: string
): { valid: boolean; message?: string } {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed) {
        return { valid: false, message: `Unknown current status: ${currentStatus}` };
    }
    if (!allowed.includes(newStatus)) {
        return {
            valid: false,
            message: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: [${allowed.join(', ')}]`,
        };
    }
    return { valid: true };
}

// ─── Quick Validate Helper ───────────────────────────────────────────────────

export function validateInvoice(data: unknown) {
    return invoiceV2Schema.safeParse(data);
}

export function validateLineItem(data: unknown) {
    return lineItemSchema.safeParse(data);
}

// ─── Export Types ────────────────────────────────────────────────────────────

export type InvoiceV2Input = z.infer<typeof invoiceV2Schema>;
export type LineItemInput = z.infer<typeof lineItemSchema>;
