import React from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { InvoiceV2Input } from '@/shared/validations/invoiceSchema';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export const LineItemsTable = () => {
    const { register, control, formState: { errors } } = useFormContext<InvoiceV2Input>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'line_items'
    });

    const currencyCode = useWatch({ control, name: 'currency_code' });

    // Add default item if empty
    React.useEffect(() => {
        if (fields.length === 0) {
            append({
                item_type: 'good',
                description: '',
                quantity: '1',
                unit_price: '0',
                unit: 'nos',
                tax_rate: '0',
                discount: { type: 'flat', value: 0 }
            });
        }
    }, [fields.length, append]);

    return (
        <div className="mt-8">
            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-12">#</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-64">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">HSN/SAC</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Qty</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Price ({currencyCode})</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Disc</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Tax %</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Total</th>
                            <th className="px-4 py-3 w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {fields.map((field, index) => (
                            <LineItemRow key={field.id} index={index} remove={remove} />
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => append({
                        item_type: 'good',
                        description: '',
                        quantity: '1',
                        unit_price: '0',
                        unit: 'nos', // Default unit
                        tax_rate: '0',
                        discount: { type: 'flat', value: 0 }
                    })}
                >
                    + Add Line Item
                </Button>
            </div>
        </div>
    );
};

// Extracted Row Component for better perf (memoization candidate)
const LineItemRow = ({ index, remove }: { index: number, remove: (index: number) => void }) => {
    const { register, control, watch } = useFormContext<InvoiceV2Input>();

    // Calculate row total on the fly for display (rough calc, source of truth is backend/calculator)
    const qty = parseFloat(watch(`line_items.${index}.quantity` as any) || '0');
    const price = parseFloat(watch(`line_items.${index}.unit_price` as any) || '0');
    // We could use the InvoiceCalculator here too if we wanted perfection, but simple math is fine for placeholder
    const total = (qty * price).toFixed(2);

    // Dynamic logic: If "Service", hide Qty/Unit optionally or change placeholder
    const itemType = watch(`line_items.${index}.item_type`);

    return (
        <tr className="hover:bg-gray-50/50 transition-colors">
            <td className="px-4 py-3 text-gray-400 text-xs text-center">
                {index + 1}
            </td>
            <td className="px-4 py-3">
                <div className="space-y-2">
                    <Select
                        className="h-8 text-xs mb-1 w-24"
                        {...register(`line_items.${index}.item_type`)}
                        options={[
                            { label: 'Good', value: 'good' },
                            { label: 'Service', value: 'service' },
                        ]}
                    />
                    <Input
                        placeholder="Item Description"
                        {...register(`line_items.${index}.description`)}
                        className="h-9"
                    />
                    {itemType === 'service' && (
                        <div className="text-xs text-gray-500 flex gap-2">
                            {/* Service Period Inputs */}
                            <input
                                type="date"
                                className="border rounded px-1 py-0.5"
                                {...register(`line_items.${index}.dynamic_meta.service_period_start` as any)}
                            /> to
                            <input
                                type="date"
                                className="border rounded px-1 py-0.5"
                                {...register(`line_items.${index}.dynamic_meta.service_period_end` as any)}
                            />
                        </div>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 top-align">
                <Input
                    placeholder="HSN/SAC"
                    {...register(`line_items.${index}.hsn_sac_code`)}
                    className="h-9"
                />
            </td>
            <td className="px-4 py-3 top-align">
                <div className="flex gap-1">
                    <Input
                        type="number"
                        step="0.001"
                        {...register(`line_items.${index}.quantity`)}
                        className="h-9 text-right"
                    />
                    <Input
                        placeholder="Unit"
                        {...register(`line_items.${index}.unit`)}
                        className="h-9 w-12 text-center text-xs px-0"
                    />
                </div>
            </td>
            <td className="px-4 py-3 top-align">
                <Input
                    type="number"
                    step="0.01"
                    {...register(`line_items.${index}.unit_price`)}
                    className="h-9 text-right"
                />
            </td>
            <td className="px-4 py-3 top-align">
                <Input
                    type="number"
                    placeholder="0"
                    {...register(`line_items.${index}.discount.value`)}
                    className="h-9 text-right"
                />
            </td>
            <td className="px-4 py-3 top-align">
                <Select
                    className="h-9 text-right w-20 ml-auto"
                    {...register(`line_items.${index}.tax_rate`)}
                    options={[
                        { label: '0%', value: '0' },
                        { label: '5%', value: '5' },
                        { label: '12%', value: '12' },
                        { label: '18%', value: '18' },
                        { label: '28%', value: '28' },
                    ]}
                />
            </td>
            <td className="px-4 py-3 text-right font-mono text-sm font-medium pt-5">
                {total}
            </td>
            <td className="px-2 py-3 text-center pt-4">
                <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </td>
        </tr>
    );
};
