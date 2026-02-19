import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceV2Schema, InvoiceV2Input } from '../../validations/invoiceSchema';
import { InvoiceHeader } from './InvoiceHeader';
import { CompliancePanel } from './CompliancePanel';
import { LineItemsTable } from './LineItemsTable';
import { InvoiceFooter } from './InvoiceFooter';
import { Button } from '../ui/Button';

// Default initial values
const defaultValues: Partial<InvoiceV2Input> = {
    status: 'draft',
    type: 'tax_invoice',
    currency_code: 'INR',
    exchange_rate: '1',
    issue_date: new Date().toISOString().split('T')[0],
    shipping_charges: '0',
    tds_rate: '0',
    compliance_meta: {
        gst_treatment: 'regular',
        reverse_charge: false
    },
    line_items: [
        {
            item_type: 'good',
            description: '',
            quantity: '1',
            unit_price: '0',
            unit: 'nos',
            tax_rate: '0',
            discount: { type: 'flat', value: 0 }
        }
    ]
};

export const InvoiceEditor = () => {
    const methods = useForm<InvoiceV2Input>({
        resolver: zodResolver(invoiceV2Schema),
        defaultValues,
        mode: 'onChange' // Validate on change for snappy feedback
    });

    const { handleSubmit, formState: { errors, isValid, isSubmitting } } = methods;

    const onSubmit = async (data: InvoiceV2Input) => {
        console.log('Submitting Valid Invoice:', data);
        // TODO: Call API
        // await dataService.createInvoiceV2(data);
        alert('Invoice Saved! Check console for JSON payload.');
    };

    // Log errors for debugging
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log('Validation Errors:', errors);
        }
    }, [errors]);

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 pb-20">

                {/* Top Actions */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 font-sora">New Invoice</h1>
                        <p className="text-gray-500 mt-1">Create a new invoice for your customer.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" type="button">Save Draft</Button>
                        <Button type="submit" isLoading={isSubmitting}>
                            Save & Send
                        </Button>
                    </div>
                </div>

                {/* Validation Error Banner */}
                {!isValid && Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                        <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div>
                            <h4 className="font-bold text-sm">Please fix the following errors:</h4>
                            <ul className="text-sm list-disc pl-4 mt-1 space-y-0.5">
                                {/* Show first 3 errors to avoid clutter */}
                                {Object.entries(errors).slice(0, 3).map(([key, err]) => (
                                    <li key={key}>
                                        <span className="capitalize">{key.replace('_', ' ')}</span>: {err?.message as string}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Main Editor Components */}
                <div className="space-y-8">
                    <InvoiceHeader />
                    <CompliancePanel />
                    <LineItemsTable />
                    <InvoiceFooter />
                </div>

            </form>
        </FormProvider>
    );
};
