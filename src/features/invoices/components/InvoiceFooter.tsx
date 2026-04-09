import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { InvoiceV2Input } from '@/shared/validations/invoiceSchema';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { InvoiceCalculator } from '@/shared/lib/financialMath';

export const InvoiceFooter = () => {
    const { register, control, watch } = useFormContext<InvoiceV2Input>();

    // Watch all fields relevant to calculation
    const values = useWatch({ control });

    // Perform live calculation
    // Note: In strict production app, we might debounce this or use a dedicated hook
    // But for this scale, reactively calculating on render is fast enough (few ms)
    const items = values.line_items || [];
    const result = InvoiceCalculator.calculate({
        line_items: items.map(item => ({
            quantity: item.quantity as string,
            unit_price: item.unit_price as string,
            tax_rate: item.tax_rate,
            discount: item.discount,
            // Logic: Inter-state if Place of Supply != Org State (Mocking Org State as 'Maharashtra' for now)
            is_interstate: values.compliance_meta?.place_of_supply?.toLowerCase().includes('maharashtra') === false
        })),
        shipping_charges: values.shipping_charges as string,
        tds_rate: values.tds_rate as string,
        document_discount: values.document_discount
    });

    const currencySymbol = values.currency_code === 'USD' ? '$' : '₹';

    return (
        <div className="flex flex-col md:flex-row gap-8 mt-8">
            {/* Left Side: Notes & Terms */}
            <div className="flex-1 space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer Notes</label>
                    <textarea
                        {...register('notes')}
                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none"
                        placeholder="Thank you for your business..."
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Terms & Conditions</label>
                    <textarea
                        {...register('terms_text')}
                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none"
                        placeholder="1. Payment due within 30 days..."
                    />
                </div>
            </div>

            {/* Right Side: Totals */}
            <div className="w-full md:w-96 space-y-3 bg-gray-50 p-6 rounded-2xl h-fit">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-mono">{currencySymbol} {result.subtotal}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                    <span>Discount</span>
                    <span className="font-mono text-emerald-600">- {currencySymbol} {result.total_discount}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (GST)</span>
                    <span className="font-mono">{currencySymbol} {result.total_tax}</span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600 py-2">
                    <span>Shipping</span>
                    <Input
                        {...register('shipping_charges')}
                        className="w-24 h-8 text-right bg-white"
                        type="number"
                    />
                </div>

                {/* TDS Section */}
                <div className="flex justify-between items-center text-sm text-gray-600 py-2 border-t border-dashed border-gray-300">
                    <div className="flex items-center gap-2">
                        <span>TDS</span>
                        <Select
                            className="w-20 h-7 text-xs py-0"
                            {...register('tds_rate')}
                            options={[
                                { label: '0%', value: '0' },
                                { label: '2%', value: '2' },
                                { label: '10%', value: '10' },
                            ]}
                        />
                    </div>
                    <span className="font-mono text-red-500">- {currencySymbol} {result.tds_amount}</span>
                </div>

                {/* Round Off */}
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Round Off</span>
                    <span className="font-mono">{result.round_off}</span>
                </div>

                <div className="border-t border-gray-300 pt-4 mt-2">
                    <div className="flex justify-between items-end">
                        <span className="text-base font-bold text-gray-900">Total Payable</span>
                        <span className="text-2xl font-bold text-teal-700 font-sora">
                            {currencySymbol} {result.payable_amount}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
