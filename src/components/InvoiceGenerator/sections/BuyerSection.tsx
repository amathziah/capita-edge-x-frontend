import React from 'react';
import InputField from '../InputField';
import { Buyer, Seller } from '../constants';
import { BusinessType } from '../../../contexts/PersonaContext';

export interface BuyerErrors {
    name?: string;
}

interface BuyerSectionProps {
    businessType: BusinessType;
    buyer: Buyer;
    setBuyer: (b: Buyer) => void;
    seller: Seller;
    customers: any[];
    isBuyerFocused: boolean;
    setIsBuyerFocused: (v: boolean) => void;
    errors?: BuyerErrors;
}

export default function BuyerSection({
    businessType, buyer, setBuyer, seller,
    customers, isBuyerFocused, setIsBuyerFocused, errors = {},
}: BuyerSectionProps) {
    return (
        <div className="space-y-4 p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-gray-200/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
                To
            </h3>

            <div className="relative">
                <InputField
                    label="Client Name"
                    required
                    placeholder={businessType === 'ca' ? "Client's Legal Business Name" : 'Client Business Name'}
                    value={buyer.name || ''}
                    onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                    onFocus={() => setIsBuyerFocused(true)}
                    onBlur={() => setTimeout(() => setIsBuyerFocused(false), 200)}
                    error={errors.name}
                />

                {/* Customer Autocomplete Dropdown */}
                {isBuyerFocused && (
                    <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 max-h-60 overflow-y-auto z-[100] animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl bg-white/95">
                        <div className="sticky top-0 bg-gray-50/90 backdrop-blur-sm px-4 py-2 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400 z-10">
                            Select Existing Customer
                        </div>
                        {customers
                            .filter(c => !buyer.name || c.name.toLowerCase().includes(buyer.name.toLowerCase()))
                            .slice(0, 10)
                            .map(customer => (
                                <button
                                    key={customer.id}
                                    className="w-full text-left px-4 py-3 hover:bg-primary-light/10 flex flex-col group transition-all duration-150 border-b border-gray-50 last:border-0"
                                    onClick={() => {
                                        setBuyer({
                                            name: customer.name,
                                            address: customer.address || "",
                                            email: customer.email || "",
                                            phone: customer.phone || "",
                                            taxId: customer.taxId || ""
                                        });
                                        setIsBuyerFocused(false);
                                    }}
                                >
                                    <div className="font-semibold text-sm text-gray-800 group-hover:text-primary transition-colors">{customer.name}</div>
                                    <div className="text-[10px] text-gray-400 truncate">{customer.email || 'No email'} • {customer.phone || 'No phone'}</div>
                                </button>
                            ))}
                        {buyer.name && customers.filter(c => c.name.toLowerCase().includes(buyer.name.toLowerCase())).length === 0 && (
                            <div className="p-4 text-center">
                                <p className="text-sm font-medium text-gray-500">No matching customers</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-text-light uppercase tracking-wider flex items-center gap-1.5">
                    Address
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-gray-400 normal-case tracking-normal bg-gray-100/80 px-1.5 py-0.5 rounded-md">optional</span>
                </label>
                <textarea
                    className="w-full bg-gray-50/80 backdrop-blur-sm border-0 border-b-2 border-gray-200 rounded-t-xl px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white outline-none resize-none transition-all duration-200 shadow-sm"
                    placeholder={businessType === 'ca' ? 'Registered Business Address' : 'Client Address'}
                    rows={3}
                    value={buyer.address || ''}
                    onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <InputField placeholder="Email" label="Email" optional value={buyer.email || ''} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
                <InputField placeholder="Phone" label="Phone" optional value={buyer.phone || ''} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} />
            </div>

            <InputField
                label={businessType === 'ca' ? 'Client GSTIN' : businessType === 'ecommerce' ? 'Buyer GSTIN' : seller.taxId ? 'GSTIN' : 'Tax ID'}
                placeholder={businessType === 'ca' ? 'e.g. 27ABCDE1234F1Z5' : businessType === 'ecommerce' ? 'e.g. 27ABCDE1234F1Z5' : seller.taxId ? 'e.g. 29ABCDE1234F1Z5' : 'Client tax identifier'}
                value={buyer.taxId || ''}
                onChange={(e) => setBuyer({ ...buyer, taxId: e.target.value })}
                optional
            />
            {businessType === 'ecommerce' && (
                <p className="text-[10px] text-text-muted -mt-1 pl-1 italic">(Required for B2B wholesale only)</p>
            )}
        </div>
    );
}
