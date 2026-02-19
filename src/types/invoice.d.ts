/**
 * Universal Invoice Engine — TypeScript Interfaces
 * =================================================
 * Maps 1:1 to the invoices_v2 / invoice_line_items_v2 / invoice_activity_logs schema.
 * All monetary values are `string` (serialized from NUMERIC) to prevent JS float loss.
 */

// ─── Enums & Literal Unions ──────────────────────────────────────────────────

export type InvoiceType =
    | 'tax_invoice'
    | 'bill_of_supply'
    | 'proforma'
    | 'credit_note'
    | 'debit_note'
    | 'delivery_challan';

export type InvoiceStatus =
    | 'draft'
    | 'awaiting_approval'
    | 'approved'
    | 'sent'
    | 'partially_paid'
    | 'paid'
    | 'void'
    | 'write_off';

export type LineItemType =
    | 'good'
    | 'service'
    | 'asset'
    | 'shipping'
    | 'adjustment';

export type GstTreatment =
    | 'regular'
    | 'sez_export'
    | 'deemed_export'
    | 'overseas'
    | 'unregistered'
    | 'composition';

export type DiscountType = 'percentage' | 'flat';

export type PaymentTermType = 'net_d' | 'due_on_receipt' | 'custom';

// ─── JSONB Sub-Types ─────────────────────────────────────────────────────────

export interface AddressSnapshot {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    state_code?: string;       // e.g. "37" for Andhra Pradesh
    postal_code?: string;
    country?: string;
    gstin?: string;
    pan?: string;
}

export interface ComplianceMeta {
    gst_treatment?: GstTreatment;
    place_of_supply?: string;   // e.g. "37-Andhra Pradesh"
    reverse_charge?: boolean;
    lut_bond_no?: string;
    eway_bill_no?: string;
    irn?: string;               // E-Invoice IRN
    ack_no?: string;
    ack_date?: string;
    vehicle_no?: string;
    port_code?: string;         // For exports
    shipping_bill_no?: string;
    shipping_bill_date?: string;
}

export interface PaymentTerms {
    type: PaymentTermType;
    days?: number;               // For net_d
    due_date?: string;           // ISO date for custom
    early_discount_percent?: number;
    early_discount_days?: number;
}

export interface DocumentDiscount {
    type: DiscountType;
    value: number;
    reason?: string;
}

export interface LineItemDiscount {
    type: DiscountType;
    value: number;
    reason?: string;
}

export interface TaxBreakdown {
    cgst_rate?: number;
    cgst?: number;
    sgst_rate?: number;
    sgst?: number;
    igst_rate?: number;
    igst?: number;
    cess_rate?: number;
    cess?: number;
}

// ─── Polymorphic Dynamic Meta ────────────────────────────────────────────────

export interface InventoryMeta {
    sku?: string;
    batch_no?: string;
    expiry?: string;             // YYYY-MM or ISO date
    serial_numbers?: string[];
    warehouse?: string;
    barcode?: string;
}

export interface ServiceMeta {
    service_period_start?: string;  // ISO date
    service_period_end?: string;
    timesheet_ids?: number[];
    milestone?: string;
    sac_description?: string;
}

export interface ConstructionMeta {
    work_order_no?: string;
    completion_pct?: number;     // 0-100
    retention_pct?: number;
    site_code?: string;
    ra_bill_no?: string;         // Running Account bill
}

export type DynamicMeta = InventoryMeta | ServiceMeta | ConstructionMeta | Record<string, unknown>;

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface InvoiceLineItemV2 {
    id: string;
    invoice_id: string;
    sort_order: number;

    // Identity
    item_type: LineItemType;
    product_id?: string | null;
    description: string;
    hsn_sac_code?: string | null;

    // Quantity
    quantity: string;            // NUMERIC(14,3) — use string to preserve precision
    unit: string;
    unit_price: string;          // NUMERIC(18,4)

    // Discount
    discount: LineItemDiscount;
    discount_amount: string;

    // Tax
    tax_rate: string;
    tax_breakdown: TaxBreakdown;
    tax_amount: string;

    // Computed
    line_total: string;
    line_total_with_tax: string;

    // Polymorphic
    dynamic_meta: DynamicMeta;

    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface InvoiceV2 {
    id: string;
    organization_id: string;
    customer_id?: string | null;

    // Header
    invoice_number: string;
    type: InvoiceType;
    status: InvoiceStatus;

    // Dates
    issue_date: string;
    due_date?: string | null;

    // Currency
    currency_code: string;       // ISO 4217
    exchange_rate: string;       // Snapshot

    // Addresses (JSONB snapshots)
    billing_address: AddressSnapshot;
    shipping_address?: AddressSnapshot;
    seller_details: AddressSnapshot;

    // Compliance
    compliance_meta: ComplianceMeta;

    // Payment Terms
    payment_terms?: PaymentTerms;

    // Document Discount
    document_discount?: DocumentDiscount;

    // Aggregated Totals
    subtotal: string;
    total_tax: string;
    total_discount: string;
    shipping_charges: string;
    grand_total: string;

    // TDS
    tds_rate: string;
    tds_amount: string;
    tds_section?: string | null;

    // Round Off
    round_off: string;

    // Payable
    payable_amount: string;
    amount_paid: string;
    balance_due: string;

    // Linked (credit/debit notes)
    linked_invoice_id?: string | null;

    // Notes
    notes?: string | null;
    internal_notes?: string | null;
    terms_text?: string | null;

    // Timestamps
    created_at: string;
    updated_at: string;
    approved_at?: string | null;
    voided_at?: string | null;
    created_by?: string | null;
    updated_by?: string | null;

    // Joined
    line_items?: InvoiceLineItemV2[];
}

// ─── Audit Trail ─────────────────────────────────────────────────────────────

export type AuditAction =
    | 'created'
    | 'field_updated'
    | 'status_changed'
    | 'line_item_added'
    | 'line_item_removed'
    | 'line_item_updated'
    | 'payment_recorded'
    | 'emailed'
    | 'voided'
    | 'approved';

export interface InvoiceActivityLog {
    id: string;
    invoice_id: string;
    user_id?: string | null;

    action: AuditAction;
    field_name?: string | null;  // e.g. 'status', 'items[2].quantity'
    old_value?: string | null;   // JSON-serialized
    new_value?: string | null;

    ip_address?: string | null;
    user_agent?: string | null;
    metadata?: Record<string, unknown>;

    created_at: string;
}

// ─── Calculator I/O Types ────────────────────────────────────────────────────

export interface LineItemInput {
    quantity: string | number;
    unit_price: string | number;
    discount?: LineItemDiscount;
    tax_rate?: string | number;
    is_interstate?: boolean;     // true → IGST, false → CGST+SGST
}

export interface InvoiceCalculationInput {
    line_items: LineItemInput[];
    document_discount?: DocumentDiscount;
    shipping_charges?: string | number;
    tds_rate?: string | number;
    tds_section?: string;
    currency_code?: string;
    exchange_rate?: string | number;
}

export interface InvoiceCalculationResult {
    line_totals: {
        line_total: string;
        discount_amount: string;
        tax_amount: string;
        tax_breakdown: TaxBreakdown;
        line_total_with_tax: string;
    }[];
    subtotal: string;
    total_discount: string;
    total_tax: string;
    shipping_charges: string;
    grand_total: string;
    tds_amount: string;
    round_off: string;
    payable_amount: string;
}
