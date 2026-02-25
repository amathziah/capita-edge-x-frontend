
import InputField from '../InputField';
import { Seller } from '../constants';
import { BusinessType } from '../../../contexts/PersonaContext';

interface NotesAndExtrasSectionProps {
    businessType: BusinessType;
    notes: string;
    setNotes: (v: string) => void;
    courierTracking: string;
    setCourierTracking: (v: string) => void;
    authorizedSignatory: string;
    setAuthorizedSignatory: (v: string) => void;
    seller: Seller;
}

export default function NotesAndExtrasSection({
    businessType, notes, setNotes,
    courierTracking, setCourierTracking,
    authorizedSignatory, setAuthorizedSignatory,
    seller,
}: NotesAndExtrasSectionProps) {
    return (
        <>
            {/* Notes */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
                    Notes
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-gray-400 normal-case tracking-normal bg-gray-100/80 px-1.5 py-0.5 rounded-md">optional</span>
                </label>
                <textarea
                    className="w-full bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl px-5 py-4 text-sm font-medium focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all duration-200 shadow-sm hover:shadow-md placeholder-gray-400"
                    placeholder="Payment terms, bank details, thank you note..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            {/* Courier & Tracking for Ecommerce */}
            {businessType === 'ecommerce' && (
                <InputField
                    label="Courier & Tracking"
                    optional
                    placeholder="e.g. Delhivery AWB: 1234567890"
                    value={courierTracking}
                    onChange={(e) => setCourierTracking(e.target.value)}
                />
            )}

            {/* Authorized Signatory for Agency */}
            {businessType === 'agency' && (
                <InputField
                    label="Authorized Signatory Name"
                    optional
                    placeholder="Partner / Director name for signature line"
                    value={authorizedSignatory}
                    onChange={(e) => setAuthorizedSignatory(e.target.value)}
                />
            )}

            {/* UPI Payment Box for Solopreneur */}
            {businessType === 'solopreneur' && (seller.upiId || seller.bankDetails) && (
                <div className="bg-teal-50/80 backdrop-blur-md border border-teal-200/60 rounded-2xl p-5 space-y-4 shadow-sm">
                    <h4 className="text-xs font-bold text-teal-700 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-4 bg-gradient-to-b from-teal-500 to-teal-700 rounded-full"></div>
                        Payment Information
                    </h4>
                    {seller.upiId && (
                        <div className="bg-white/80 rounded-xl p-4 border border-teal-100">
                            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1">Pay via UPI</p>
                            <p className="text-sm font-bold text-teal-800 font-mono tracking-wide">{seller.upiId}</p>
                        </div>
                    )}
                    {seller.bankDetails && (
                        <div className="bg-white/80 rounded-xl p-4 border border-teal-100">
                            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1">Bank Transfer</p>
                            <p className="text-xs font-medium text-text-main whitespace-pre-line leading-relaxed">{seller.bankDetails}</p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
