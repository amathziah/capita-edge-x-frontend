import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { InvoiceV2Input } from '../../validations/invoiceSchema';

export const CompliancePanel = () => {
    const { register, control, formState: { errors } } = useFormContext<InvoiceV2Input>();

    const gstTreatment = useWatch({ control, name: 'compliance_meta.gst_treatment' });
    const isExport = gstTreatment === 'overseas' || gstTreatment === 'sez_export' || gstTreatment === 'deemed_export';

    return (
        <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 mt-6">
            <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Tax & Compliance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Select
                    label="GST Treatment"
                    {...register('compliance_meta.gst_treatment')}
                    options={[
                        { label: 'Regular Registered', value: 'regular' },
                        { label: 'Unregistered Business', value: 'unregistered' },
                        { label: 'Overseas / Export', value: 'overseas' },
                        { label: 'SEZ Export (With Payment)', value: 'sez_export' },
                        { label: 'Deemed Export', value: 'deemed_export' },
                        { label: 'Composition Dealer', value: 'composition' },
                    ]}
                    error={errors.compliance_meta?.gst_treatment?.message}
                />

                <Input
                    label="Place of Supply"
                    placeholder="e.g. 37-Andhra Pradesh"
                    {...register('compliance_meta.place_of_supply')}
                    error={errors.compliance_meta?.place_of_supply?.message}
                />

                {/* Show Export Details if export */}
                {isExport && (
                    <>
                        <Input
                            label="Shipping Bill No"
                            {...register('compliance_meta.shipping_bill_no')}
                        />
                        <Input
                            label="Port Code"
                            {...register('compliance_meta.port_code')}
                        />
                    </>
                )}

                <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                            {...register('compliance_meta.reverse_charge')}
                        />
                        <span className="text-sm font-medium text-gray-700">Reverse Charge Applicable?</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
