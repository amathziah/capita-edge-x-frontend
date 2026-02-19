/**
 * Universal Invoice Engine — Financial Math
 * ==========================================
 * Precision-first calculation engine using decimal.js.
 * NEVER uses native JS floats for monetary arithmetic.
 *
 * Usage:
 *   import { InvoiceCalculator } from '@/lib/financialMath';
 *   const result = InvoiceCalculator.calculate({ line_items, tds_rate, ... });
 */

import Decimal from 'decimal.js';
import type {
    LineItemInput,
    LineItemDiscount,
    TaxBreakdown,
    InvoiceCalculationInput,
    InvoiceCalculationResult,
    InvoiceStatus,
} from '../types/invoice';

// Configure decimal.js for financial precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDecimal(value: string | number | undefined | null): Decimal {
    if (value === undefined || value === null || value === '') return new Decimal(0);
    return new Decimal(value);
}

function toFixed4(d: Decimal): string {
    return d.toFixed(4);
}

function toFixed2(d: Decimal): string {
    return d.toFixed(2);
}

// ─── Line Item Calculations ──────────────────────────────────────────────────

export class InvoiceCalculator {

    /**
     * Calculate total for a single line item BEFORE tax.
     * line_total = (quantity × unit_price) − discount
     */
    static calculateLineTotal(
        quantity: string | number,
        unitPrice: string | number,
        discount?: LineItemDiscount
    ): { lineTotal: Decimal; discountAmount: Decimal } {
        const qty = toDecimal(quantity);
        const price = toDecimal(unitPrice);
        const gross = qty.mul(price);

        let discountAmount = new Decimal(0);

        if (discount && discount.value) {
            const discountValue = toDecimal(discount.value);
            if (discount.type === 'percentage') {
                // Percentage of gross
                discountAmount = gross.mul(discountValue).div(100);
            } else {
                // Flat amount
                discountAmount = discountValue;
            }
        }

        // Discount cannot exceed gross
        if (discountAmount.gt(gross)) {
            discountAmount = gross;
        }

        const lineTotal = gross.minus(discountAmount);
        return { lineTotal, discountAmount };
    }

    /**
     * Calculate tax breakdown for a line item.
     * If `isInterstate` → full amount goes to IGST.
     * Otherwise → split 50/50 into CGST + SGST.
     */
    static calculateTaxForLine(
        lineTotal: Decimal,
        taxRate: string | number,
        isInterstate: boolean = false
    ): { taxAmount: Decimal; breakdown: TaxBreakdown } {
        const rate = toDecimal(taxRate);

        if (rate.isZero()) {
            return {
                taxAmount: new Decimal(0),
                breakdown: {
                    cgst_rate: 0, cgst: 0,
                    sgst_rate: 0, sgst: 0,
                    igst_rate: 0, igst: 0,
                    cess_rate: 0, cess: 0,
                },
            };
        }

        const taxAmount = lineTotal.mul(rate).div(100);

        let breakdown: TaxBreakdown;

        if (isInterstate) {
            breakdown = {
                cgst_rate: 0,
                cgst: 0,
                sgst_rate: 0,
                sgst: 0,
                igst_rate: Number(rate.toFixed(2)),
                igst: Number(taxAmount.toFixed(2)),
                cess_rate: 0,
                cess: 0,
            };
        } else {
            const halfRate = rate.div(2);
            const halfTax = taxAmount.div(2);
            breakdown = {
                cgst_rate: Number(halfRate.toFixed(2)),
                cgst: Number(halfTax.toFixed(2)),
                sgst_rate: Number(halfRate.toFixed(2)),
                sgst: Number(halfTax.toFixed(2)),
                igst_rate: 0,
                igst: 0,
                cess_rate: 0,
                cess: 0,
            };
        }

        return { taxAmount, breakdown };
    }

    /**
     * Full invoice calculation pipeline.
     *
     * Flow:
     *   1. Per-line: lineTotal, discount, tax
     *   2. Subtotal = Σ lineTotals
     *   3. Document discount (on subtotal)
     *   4. Grand Total = subtotal − doc_discount + total_tax + shipping
     *   5. TDS = tds_rate% of subtotal (deducted from payable)
     *   6. Round Off = nearest ₹1
     *   7. Payable = grand_total − tds + round_off
     */
    static calculate(input: InvoiceCalculationInput): InvoiceCalculationResult {
        const lineTotals: InvoiceCalculationResult['line_totals'] = [];

        let subtotal = new Decimal(0);
        let totalTax = new Decimal(0);
        let totalLineDiscount = new Decimal(0);

        // ── Step 1: Per-Line Calculations ──────────────────────────────────────

        for (const item of input.line_items) {
            const { lineTotal, discountAmount } = this.calculateLineTotal(
                item.quantity,
                item.unit_price,
                item.discount
            );

            const { taxAmount, breakdown } = this.calculateTaxForLine(
                lineTotal,
                item.tax_rate ?? 0,
                item.is_interstate ?? false
            );

            const lineTotalWithTax = lineTotal.plus(taxAmount);

            lineTotals.push({
                line_total: toFixed4(lineTotal),
                discount_amount: toFixed4(discountAmount),
                tax_amount: toFixed4(taxAmount),
                tax_breakdown: breakdown,
                line_total_with_tax: toFixed4(lineTotalWithTax),
            });

            subtotal = subtotal.plus(lineTotal);
            totalTax = totalTax.plus(taxAmount);
            totalLineDiscount = totalLineDiscount.plus(discountAmount);
        }

        // ── Step 2: Document-Level Discount ────────────────────────────────────

        let docDiscountAmount = new Decimal(0);
        if (input.document_discount && input.document_discount.value) {
            const discVal = toDecimal(input.document_discount.value);
            if (input.document_discount.type === 'percentage') {
                docDiscountAmount = subtotal.mul(discVal).div(100);
            } else {
                docDiscountAmount = discVal;
            }
            if (docDiscountAmount.gt(subtotal)) {
                docDiscountAmount = subtotal;
            }
        }

        const totalDiscount = totalLineDiscount.plus(docDiscountAmount);
        const discountedSubtotal = subtotal.minus(docDiscountAmount);

        // ── Step 3: Shipping ───────────────────────────────────────────────────

        const shippingCharges = toDecimal(input.shipping_charges);

        // ── Step 4: Grand Total ────────────────────────────────────────────────
        // Grand Total = discountedSubtotal + totalTax + shipping
        const grandTotal = discountedSubtotal.plus(totalTax).plus(shippingCharges);

        // ── Step 5: TDS (Tax Deducted at Source) ──────────────────────────────
        // TDS is calculated on the BASE amount (subtotal before tax), not on grand total.
        // Example: Invoice = ₹1,00,000 + ₹18,000 GST = ₹1,18,000
        //          TDS @ 10% of ₹1,00,000 = ₹10,000
        //          Payable = ₹1,18,000 − ₹10,000 = ₹1,08,000
        const tdsRate = toDecimal(input.tds_rate);
        const tdsAmount = discountedSubtotal.mul(tdsRate).div(100);

        // ── Step 6: Round Off ──────────────────────────────────────────────────
        // Auto round to nearest ₹1 (or currency unit)
        const preRound = grandTotal.minus(tdsAmount);
        const rounded = preRound.round();
        const roundOff = rounded.minus(preRound);

        // ── Step 7: Payable Amount ─────────────────────────────────────────────
        const payableAmount = rounded;

        return {
            line_totals: lineTotals,
            subtotal: toFixed4(subtotal),
            total_discount: toFixed4(totalDiscount),
            total_tax: toFixed4(totalTax),
            shipping_charges: toFixed4(shippingCharges),
            grand_total: toFixed4(grandTotal),
            tds_amount: toFixed4(tdsAmount),
            round_off: toFixed4(roundOff),
            payable_amount: toFixed4(payableAmount),
        };
    }

    // ─── Payment Status Engine ─────────────────────────────────────────────────

    /**
     * Determine invoice status based on payments received.
     * Compares sum of payments against payable amount.
     */
    static calculatePaymentStatus(
        payableAmount: string | number,
        payments: { amount: string | number; status?: string }[]
    ): InvoiceStatus {
        const payable = toDecimal(payableAmount);

        if (payable.isZero()) return 'paid';

        const totalPaid = payments
            .filter(p => !p.status || p.status === 'completed')
            .reduce((sum, p) => sum.plus(toDecimal(p.amount)), new Decimal(0));

        if (totalPaid.isZero()) return 'sent';         // No payment yet
        if (totalPaid.gte(payable)) return 'paid';      // Fully paid
        return 'partially_paid';                        // Some payment
    }

    // ─── Multi-Currency Conversion ─────────────────────────────────────────────

    /**
     * Convert an amount using exchange rate snapshot.
     * Always returns string with controlled precision.
     */
    static convertCurrency(
        amount: string | number,
        exchangeRate: string | number,
        decimalPlaces: number = 2
    ): string {
        const amt = toDecimal(amount);
        const rate = toDecimal(exchangeRate);
        return amt.mul(rate).toFixed(decimalPlaces);
    }

    // ─── Utility: Reverse Calculate TDS ────────────────────────────────────────

    /**
     * Given a payable amount after TDS, reverse-calculate the original base.
     * Useful when client communicates "I'll pay ₹X after TDS".
     */
    static reverseCalculateTDS(
        payableAfterTDS: string | number,
        tdsRate: string | number,
        taxRate: string | number
    ): { baseAmount: string; tdsAmount: string; taxAmount: string; grossPayable: string } {
        const payable = toDecimal(payableAfterTDS);
        const tds = toDecimal(tdsRate);
        const tax = toDecimal(taxRate);

        // payable = base + (base * tax / 100) - (base * tds / 100)
        // payable = base * (1 + tax/100 - tds/100)
        const multiplier = new Decimal(1)
            .plus(tax.div(100))
            .minus(tds.div(100));

        const base = payable.div(multiplier);
        const tdsAmount = base.mul(tds).div(100);
        const taxAmount = base.mul(tax).div(100);
        const gross = base.plus(taxAmount);

        return {
            baseAmount: toFixed2(base),
            tdsAmount: toFixed2(tdsAmount),
            taxAmount: toFixed2(taxAmount),
            grossPayable: toFixed2(gross),
        };
    }

    // ─── Utility: Compute Cess (for luxury/sin goods) ─────────────────────────

    static calculateCess(
        lineTotal: string | number,
        cessRate: string | number
    ): string {
        return toFixed4(toDecimal(lineTotal).mul(toDecimal(cessRate)).div(100));
    }
}

export { Decimal, toDecimal, toFixed2, toFixed4 };
