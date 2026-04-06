import React, { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { InvoiceV2Input } from '../../validations/invoiceSchema';
import { useCustomers } from '../../hooks/useCustomers'; // I'll assume this hook exists or mock it

export const InvoiceHeader = () => {
    const { register, setValue, formState: { errors }, control } = useFormContext<InvoiceV2Input>();

    // Watch fields for side-effects
    const selectedCustomerId = useWatch({ control, name: 'customer_id' });

    // Mock customers for now if hook doesn't exist
    // In real app: const { customers } = useCustomers();
    const customers = [
        { id: 'c1', name: 'Acme Corp', gstin: '27ABCDE1234F1Z5', state: 'Maharashtra', contact: 'John Doe' },
        { id: 'c2', name: 'Global Inc (Overseas)', gstin: '', state: '', contact: 'Jane Smith', isOverseas: true },
    ];

    // Auto-fill customer details when selected
    useEffect(() => {
        if (selectedCustomerId) {
            const customer = customers.find(c => c.id === selectedCustomerId);
            if (customer) {
                setValue('billing_address.name', customer.name);
                setValue('billing_address.gstin', customer.gstin);
                setValue('billing_address.state', customer.state);

                // Auto-switch currency if overseas
                if (customer.isOverseas) {
                    setValue('currency_code', 'USD');
                    setValue('compliance_meta.gst_treatment', 'overseas');
                    setValue('compliance_meta.place_of_supply', '96-Foreign Country');
                } else {
                    setValue('currency_code', 'INR');
                    setValue('exchange_rate', '1');
                    setValue('compliance_meta.gst_treatment', 'regular');
                }
            }
        }
    }, [selectedCustomerId, setValue]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-teal-100">
            {/* Column 1: Customer Selection */}
            <div className="md:col-span-4 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 font-sora">Bill To</h3>

                <Select
                    label="Customer"
                    {...register('customer_id')}
                    options={[
                        { label: 'Select Customer...', value: '' },
                        ...customers.map(c => ({ label: c.name, value: c.id }))
                    ]}
                    error={errors.customer_id?.message}
                />

                <div className="grid grid-cols-1 gap-2">
                    <Input
                        {...register('billing_address.name')}
                        placeholder="Business Name"
                        error={errors.billing_address?.name?.message}
                    />
                    <Input
                        {...register('billing_address.gstin')}
                        placeholder="GSTIN"
                        error={errors.billing_address?.gstin?.message}
                    />
                    <Input
                        {...register('billing_address.state')}
                        placeholder="State / Region"
                        error={errors.billing_address?.state?.message}
                    />
                </div>
            </div>

            {/* Column 2: Invoice Details */}
            <div className="md:col-span-4 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 font-sora">Invoice Details</h3>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Invoice #"
                        {...register('invoice_number')}
                        error={errors.invoice_number?.message}
                    />
                    <Select
                        label="Type"
                        {...register('type')}
                        options={[
                            { label: 'Tax Invoice', value: 'tax_invoice' },
                            { label: 'Bill of Supply', value: 'bill_of_supply' },
                            { label: 'Credit Note', value: 'credit_note' },
                        ]}
                        error={errors.type?.message}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        type="date"
                        label="Issue Date"
                        {...register('issue_date')}
                        error={errors.issue_date?.message}
                    />
                    <Input
                        type="date"
                        label="Due Date"
                        {...register('due_date')}
                        error={errors.due_date?.message}
                    />
                </div>
            </div>

            {/* Column 3: Payment & Currency */}
            <div className="md:col-span-4 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 font-sora">Payment & Currency</h3>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Currency"
                        {...register('currency_code')}
                        options={[
                            { label: 'INR - Indian Rupee', value: 'INR' },
                            { label: 'USD - US Dollar', value: 'USD' },
                            { label: 'EUR - Euro', value: 'EUR' },
                            { label: 'GBP - British Pound', value: 'GBP' },
                        ]}
                        error={errors.currency_code?.message}
                    />

                    {/* Show Exchange Rate only if non-INR */}
                    {useWatch({ control, name: 'currency_code' }) !== 'INR' && (
                        <Input
                            label="Exchange Rate"
                            type="number"
                            step="0.0001"
                            {...register('exchange_rate')}
                            error={errors.exchange_rate?.message}
                        />
                    )}
                </div>

                {/* Dynamic Swift Code for Overseas */}
                {useWatch({ control, name: 'currency_code' }) !== 'INR' && (
                    <Input
                        label="Swift Code"
                        placeholder="BANKUS33"
                        {...register('seller_details.bank_swift' as any)} // Assuming extended schema or just loose typing for now
                    />
                )}
            </div>
        </div>
    );
};
