import { CurrencyOption } from '../constants';
import { BusinessType } from '../../../contexts/PersonaContext';
import { numberToIndianWords } from '../utils';

interface TotalsSectionProps {
    businessType: BusinessType;
    currency: CurrencyOption;
    subtotal: number;
    taxAmount: number;
    taxRate: number;
    setTaxRate: (v: number) => void;
    taxLabel: string;
    shipping: number | undefined;
    setShipping: (v: number | undefined) => void;
    discountAmount: number | undefined;
    setDiscountAmount: (v: number | undefined) => void;
    total: number;
    // Solopreneur
    isGstRegistered: boolean;
    tdsEnabled?: boolean;
    tdsAmount?: number;
    tdsRate?: number;
    netReceivable?: number;
    resolvedGstType?: 'cgst_sgst' | 'igst' | 'not_applicable' | 'exempt';
    // CA
    reverseCharge: boolean;
    placeOfSupply: string;
    // Agency
}

export default function TotalsSection({
    businessType, currency, subtotal, taxAmount, taxRate, setTaxRate, taxLabel,
    shipping, setShipping, discountAmount, setDiscountAmount, total,
    isGstRegistered, tdsEnabled, tdsAmount, tdsRate, netReceivable,
    resolvedGstType, reverseCharge, placeOfSupply,
}: TotalsSectionProps) {

    /** Shared CGST/SGST display */
    const CgstSgstDisplay = ({ rate, amount }: { rate: number; amount: number }) => (
        <>
            <div className="flex justify-between items-center text-sm text-text-muted font-medium">
                <span>CGST @ {(rate / 2).toFixed(1)}%</span>
                <span className="font-semibold text-text-main">{currency.symbol}{(amount / 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-text-muted font-medium">
                <span>SGST @ {(rate / 2).toFixed(1)}%</span>
                <span className="font-semibold text-text-main">{currency.symbol}{(amount / 2).toFixed(2)}</span>
            </div>
        </>
    );

    /** Shared IGST display */
    const IgstDisplay = ({ rate, amount }: { rate: number; amount: number }) => (
        <div className="flex justify-between items-center text-sm text-text-muted font-medium">
            <span>IGST @ {rate}%</span>
            <span className="font-semibold text-text-main">{currency.symbol}{amount.toFixed(2)}</span>
        </div>
    );

    /** Shared GST rate input */
    const GstRateInput = ({ label = "GST Rate" }: { label?: string }) => (
        <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted font-medium">{label}</span>
            <div className="relative w-16">
                <input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full border-b-2 border-primary/30 bg-transparent text-center focus:border-primary focus:outline-none text-xs font-semibold py-1 transition-all" />
                <span className="absolute right-0 top-1 text-xs font-medium">%</span>
            </div>
        </div>
    );

    return (
        <div className="flex justify-end pt-8 border-t border-gray-200/60 mt-6">
            <div className="w-full sm:w-1/2 md:w-1/3 space-y-5 bg-gradient-to-br from-white/80 to-primary-light/10 backdrop-blur-md p-7 rounded-3xl border border-gray-200/50 shadow-md">

                {/* Subtotal */}
                <div className="flex justify-between text-sm text-text-muted font-medium">
                    <span>Subtotal</span>
                    <span className="font-semibold text-text-main">{currency.symbol}{subtotal.toFixed(2)}</span>
                </div>

                {/* ─── Tax Breakdown by Persona ─── */}
                {businessType === 'solopreneur' && !isGstRegistered ? (
                    taxAmount > 0 ? (
                        <div className="flex justify-between items-center text-sm text-text-muted font-medium">
                            <span>{taxLabel}</span>
                            <span className="font-semibold text-text-main">{currency.symbol}{taxAmount.toFixed(2)}</span>
                        </div>
                    ) : null
                ) : businessType === 'ca_firm' ? (
                    <>
                        <div className="flex justify-between text-sm text-text-muted font-medium">
                            <span>Taxable Value</span>
                            <span className="font-semibold text-text-main">{currency.symbol}{subtotal.toFixed(2)}</span>
                        </div>
                        {reverseCharge && (
                            <div className="flex justify-between items-center text-sm text-text-muted font-medium">
                                <span>Reverse Charge</span>
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">Yes</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-[11px] text-text-muted font-medium bg-gray-50/80 rounded-lg px-3 py-2">
                            <span>Place of Supply</span>
                            <span className="font-semibold text-text-main">{placeOfSupply}</span>
                        </div>
                        <GstRateInput />
                        {resolvedGstType === 'igst'
                            ? <IgstDisplay rate={taxRate} amount={taxAmount} />
                            : <CgstSgstDisplay rate={taxRate} amount={taxAmount} />}
                    </>

                ) : businessType === 'services_firm' ? (
                    <>
                        {resolvedGstType === 'igst'
                            ? <IgstDisplay rate={taxRate} amount={taxAmount} />
                            : <CgstSgstDisplay rate={taxRate} amount={taxAmount} />}
                    </>

                ) : businessType === 'ecommerce' ? (
                    <>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 mb-2">
                             <div className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg text-center ${resolvedGstType === 'igst'
                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                {resolvedGstType === 'igst' ? 'Interstate (IGST)' : 'Intra-state (CGST+SGST)'}
                            </div>
                        </div>
                        <GstRateInput />
                        {resolvedGstType === 'igst'
                            ? <IgstDisplay rate={taxRate} amount={taxAmount} />
                            : <CgstSgstDisplay rate={taxRate} amount={taxAmount} />}
                    </>

                ) : (
                    /* Default: simple tax line */
                    <div className="flex justify-between items-center text-sm text-text-muted gap-4 font-medium">
                        <div className="flex items-center gap-2">
                            <span>{taxLabel}</span>
                            <div className="relative w-16">
                                <input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))}
                                    className="w-full border-b-2 border-primary/30 bg-transparent text-center focus:border-primary focus:outline-none text-xs font-semibold py-1 transition-all" />
                                <span className="absolute right-0 top-1 text-xs font-medium">%</span>
                            </div>
                        </div>
                        <span className="font-semibold text-text-main">{currency.symbol}{taxAmount.toFixed(2)}</span>
                    </div>
                )}

                {/* TDS Deduction (Solopreneur) */}
                {tdsEnabled && tdsAmount && tdsAmount > 0 && (
                    <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                                    You will receive
                                </p>
                                <p className="text-[10px] text-green-600 mt-0.5">
                                    After TDS {tdsRate}% deduction under Sec 194J
                                </p>
                            </div>
                            <p className="text-3xl font-black text-green-700">
                                ₹{netReceivable?.toFixed(2)}
                            </p>
                        </div>
                        <p className="text-[10px] text-green-600 mt-2 border-t border-green-200 pt-2">
                            Client deducts ₹{tdsAmount?.toFixed(2)} TDS and pays you the remainder.
                            Request Form 16A from client by 15 Jun {new Date().getFullYear()}.
                        </p>
                    </div>
                )}

                {/* Discount */}
                <div className="flex justify-between items-center text-sm text-text-muted gap-4 font-medium">
                    <span>Discount</span>
                    <div className="relative w-28">
                        <span className="absolute left-3 top-2 text-xs text-text-light font-medium">{currency.symbol}</span>
                        <input type="number" value={discountAmount ?? ''} onChange={(e) => setDiscountAmount(e.target.value === '' ? undefined : Number(e.target.value))}
                            className="w-full bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 pl-7 text-right text-xs font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all shadow-sm" />
                    </div>
                </div>

                {/* Shipping */}
                <div className="flex justify-between items-center text-sm text-text-muted gap-4 font-medium">
                    <span>Shipping</span>
                    <div className="relative w-28">
                        <span className="absolute left-3 top-2 text-xs text-text-light font-medium">{currency.symbol}</span>
                        <input type="number" value={shipping ?? ''} onChange={(e) => setShipping(e.target.value === '' ? undefined : Number(e.target.value))}
                            className="w-full bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 pl-7 text-right text-xs font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all shadow-sm" />
                    </div>
                </div>

                {/* Grand Total */}
                <div className="flex justify-between text-xl font-bold text-text-main border-t-2 border-primary/20 pt-5 mt-3">
                    <span>Total</span>
                    <span className="text-primary bg-primary-light/30 px-4 py-1 rounded-xl">{currency.symbol}{total.toFixed(2)}</span>
                </div>

                {/* Amount in Words */}
                {currency.code === 'INR' && total > 0 && (
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Amount in Words</p>
                        <p className="text-xs font-semibold text-text-main bg-gray-50/80 rounded-xl px-4 py-2.5 border border-gray-100 italic">
                            {numberToIndianWords(total)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
