
import InputField from '../InputField';
import { Seller } from '../constants';
import { BusinessType } from '../../../contexts/PersonaContext';

export interface SellerErrors {
    name?: string;
    taxId?: string;
}

interface SellerSectionProps {
    businessType: BusinessType;
    seller: Seller;
    setSeller: (s: Seller) => void;
    taxLabel: string;
    isGstRegistered: boolean;
    setIsGstRegistered: (v: boolean) => void;
    setTaxRate: (v: number) => void;
    errors?: SellerErrors;
}

export default function SellerSection({
    businessType, seller, setSeller, taxLabel,
    isGstRegistered, setIsGstRegistered, setTaxRate, errors = {},
}: SellerSectionProps) {
    return (
        <div className="space-y-4 p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-gray-200/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
                From
            </h3>

            <InputField
                placeholder={businessType === 'solopreneur' ? 'Your Name / Studio Name' : 'Your Business Name'}
                label="Business Name"
                required
                value={seller.name || ''}
                onChange={(e) => setSeller({ ...seller, name: e.target.value })}
                error={errors.name}
            />

            {/* Tagline for solopreneur */}
            {businessType === 'solopreneur' && (
                <InputField
                    placeholder="e.g. UI/UX Designer & Developer"
                    label="Tagline"
                    optional
                    value={seller.tagline || ''}
                    onChange={(e) => setSeller({ ...seller, tagline: e.target.value })}
                />
            )}

            <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-text-light uppercase tracking-wider flex items-center gap-1.5">
                    Address
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-gray-400 normal-case tracking-normal bg-gray-100/80 px-1.5 py-0.5 rounded-md">optional</span>
                </label>
                <textarea
                    className="w-full bg-gray-50/80 backdrop-blur-sm border-0 border-b-2 border-gray-200 rounded-t-xl px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white outline-none resize-none transition-all duration-200 shadow-sm"
                    placeholder="Business Address"
                    rows={3}
                    value={seller.address || ''}
                    onChange={(e) => setSeller({ ...seller, address: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <InputField placeholder="Email" label="Email" optional value={seller.email || ''} onChange={(e) => setSeller({ ...seller, email: e.target.value })} />
                <InputField placeholder="Phone" label="Phone" optional value={seller.phone || ''} onChange={(e) => setSeller({ ...seller, phone: e.target.value })} />
            </div>

            {/* GST Toggle for Solopreneur */}
            {businessType === 'solopreneur' && (
                <div className="flex items-center justify-between bg-gray-50/80 rounded-xl px-4 py-3 border border-gray-200">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">GST Registered?</span>
                    <button
                        type="button"
                        onClick={() => {
                            const next = !isGstRegistered;
                            setIsGstRegistered(next);
                            setTaxRate(next ? 18 : 0);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${isGstRegistered ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${isGstRegistered ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            )}

            {/* GSTIN */}
            {(businessType !== 'solopreneur' || isGstRegistered) && (
                <InputField
                    label={`${taxLabel} ID`}
                    placeholder={`e.g. ${taxLabel}123456`}
                    value={seller.taxId || ''}
                    onChange={(e) => setSeller({ ...seller, taxId: e.target.value })}
                    required={businessType === 'ca' || businessType === 'agency'}
                    optional={businessType === 'solopreneur' || businessType === 'ecommerce' || businessType === 'saas'}
                    error={errors.taxId}
                />
            )}

            {/* PAN */}
            {(businessType === 'solopreneur' || businessType === 'agency' || businessType === 'ca') && (
                <InputField
                    label={businessType === 'solopreneur' ? 'PAN (for client TDS)' : 'PAN'}
                    placeholder="ABCDE1234F"
                    optional
                    value={seller.panNumber || ''}
                    onChange={(e) => setSeller({ ...seller, panNumber: e.target.value })}
                />
            )}

            {/* FRN for CA */}
            {businessType === 'ca' && (
                <InputField
                    label="FRN (ICAI)"
                    placeholder="123456W"
                    optional
                    value={seller.frnNumber || ''}
                    onChange={(e) => setSeller({ ...seller, frnNumber: e.target.value })}
                />
            )}

            <InputField label="UPI ID" placeholder="yourname@upi" optional value={seller.upiId || ''} onChange={(e) => setSeller({ ...seller, upiId: e.target.value })} />

            {/* Bank Details for solopreneur */}
            {businessType === 'solopreneur' && (
                <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-text-light uppercase tracking-wider flex items-center gap-1.5">
                        Bank Details
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-gray-400 normal-case tracking-normal bg-gray-100/80 px-1.5 py-0.5 rounded-md">optional</span>
                    </label>
                    <textarea
                        className="w-full bg-gray-50/80 backdrop-blur-sm border-0 border-b-2 border-gray-200 rounded-t-xl px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white outline-none resize-none transition-all duration-200 shadow-sm"
                        placeholder="A/C No, IFSC, Bank Name, Branch"
                        rows={2}
                        value={seller.bankDetails || ''}
                        onChange={(e) => setSeller({ ...seller, bankDetails: e.target.value })}
                    />
                </div>
            )}
        </div>
    );
}
