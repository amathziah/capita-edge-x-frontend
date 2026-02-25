import React from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import InputField from '../InputField';
import { InvoiceMeta, INDIAN_STATES } from '../constants';
import { BusinessType } from '../../../contexts/PersonaContext';

export interface HeaderErrors {
    date?: string;
}

interface InvoiceHeaderProps {
    businessType: BusinessType;
    logo: string | null;
    activeAction: string | null;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    meta: InvoiceMeta;
    setMeta: (m: InvoiceMeta) => void;
    // CA-specific
    placeOfSupply: string;
    setPlaceOfSupply: (v: string) => void;
    reverseCharge: boolean;
    setReverseCharge: (v: boolean) => void;
    // Agency
    projectName: string;
    setProjectName: (v: string) => void;
    // Ecommerce
    shippingAddress: string;
    setShippingAddress: (v: string) => void;
    orderNumber: string;
    setOrderNumber: (v: string) => void;
    dispatchDate: string;
    setDispatchDate: (v: string) => void;
    errors?: HeaderErrors;
}

export default function InvoiceHeader({
    businessType, logo, activeAction, handleLogoUpload,
    meta, setMeta,
    placeOfSupply, setPlaceOfSupply, reverseCharge, setReverseCharge,
    projectName, setProjectName,
    shippingAddress, setShippingAddress, orderNumber, setOrderNumber,
    dispatchDate, setDispatchDate, errors = {},
}: InvoiceHeaderProps) {
    return (
        <>
            {/* Logo + Meta Row */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Logo Upload */}
                <div className="w-full md:w-2/3">
                    <div className="relative w-40 h-40 bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-3xl flex items-center justify-center cursor-pointer group border-2 border-dashed border-gray-300 hover:border-primary/50 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg">
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleLogoUpload} />
                        {logo ? (
                            <div className="relative w-full h-full p-3">
                                <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary-dark/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 text-sm font-semibold backdrop-blur-sm rounded-3xl">
                                    {activeAction === 'uploading' ? <Loader2 className="animate-spin" /> : "Change Logo"}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-400 group-hover:text-primary transition-all duration-300">
                                {activeAction === 'uploading' ? (
                                    <Loader2 size={32} className="mb-3 animate-spin text-primary" strokeWidth={2.5} />
                                ) : (
                                    <ImageIcon size={32} className="mb-3 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" strokeWidth={2} />
                                )}
                                <span className="text-sm font-semibold">{activeAction === 'uploading' ? 'Uploading...' : 'Upload Logo'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Invoice Meta */}
                <div className="w-full md:w-1/3 space-y-4">
                    <InputField label="Invoice #" value={meta.number || ''} readOnly={true} />
                    <InputField label="Date" type="date" required value={meta.date || ''} onChange={(e) => setMeta({ ...meta, date: e.target.value })} error={errors.date} />
                    <InputField label="Due Date" type="date" optional value={meta.dueDate || ''} onChange={(e) => setMeta({ ...meta, dueDate: e.target.value })} />

                    {/* Place of Supply (CA) */}
                    {businessType === 'ca' && (
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-text-light uppercase tracking-wider flex items-center gap-1.5">
                                Place of Supply
                                <span className="text-red-400 text-[10px]">*</span>
                            </label>
                            <select
                                value={placeOfSupply}
                                onChange={(e) => setPlaceOfSupply(e.target.value)}
                                className="bg-gray-50/80 backdrop-blur-sm border-0 border-b-2 border-gray-200 rounded-t-xl px-4 py-3 text-sm font-medium outline-none transition-all duration-200 text-text-main focus:border-primary focus:bg-white hover:bg-gray-100/60 shadow-sm"
                            >
                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Reverse Charge (CA) */}
                    {businessType === 'ca' && (
                        <div className="flex items-center justify-between bg-gray-50/80 rounded-xl px-4 py-3 border border-gray-200">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider leading-tight">Reverse Charge<br />Applicable (Y/N)</span>
                            <button
                                type="button"
                                onClick={() => setReverseCharge(!reverseCharge)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${reverseCharge ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${reverseCharge ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Re: Project Name (Agency) */}
            {businessType === 'agency' && projectName && (
                <div className="bg-primary-light/10 border border-primary/20 rounded-2xl px-5 py-3">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Re: </span>
                    <span className="text-sm font-semibold text-text-main">{projectName}</span>
                </div>
            )}

            {/* Persona-Specific Global Inputs */}
            {(businessType === 'agency' || businessType === 'ecommerce' || businessType === 'saas') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-gray-200/50 shadow-sm">
                    {businessType === 'agency' && (
                        <InputField label="Project Name" optional placeholder="e.g. Website Redesign" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                    )}
                    {businessType === 'ecommerce' && (
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-xs font-semibold text-text-light uppercase tracking-wider flex items-center gap-1.5">
                                Shipping Address
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-gray-400 normal-case tracking-normal bg-gray-100/80 px-1.5 py-0.5 rounded-md">optional</span>
                            </label>
                            <textarea
                                className="bg-gray-50/80 backdrop-blur-sm border-0 border-b-2 border-gray-200 rounded-t-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:bg-white hover:bg-gray-100/60 transition-all shadow-sm"
                                placeholder="Enter full shipping destination"
                                rows={1}
                                value={shippingAddress}
                                onChange={(e) => setShippingAddress(e.target.value)}
                            />
                        </div>
                    )}
                    {(businessType === 'ecommerce' || businessType === 'saas') && (
                        <InputField label="Order / Ref #" optional placeholder="e.g. ORD-9981" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
                    )}
                    {businessType === 'ecommerce' && (
                        <InputField label="Dispatch Date" optional type="date" placeholder={new Date().toISOString().split('T')[0]} value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} />
                    )}
                </div>
            )}
        </>
    );
}
