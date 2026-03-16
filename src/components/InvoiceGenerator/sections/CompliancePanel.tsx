

interface CompliancePanelProps {
  resolvedGstType: 'cgst_sgst' | 'igst' | 'not_applicable' | 'exempt';
  tdsEnabled: boolean;
  tdsRate: number;
  tdsSection: string;
  grandTotal: number;
  tdsAmount: number;
  netReceivable: number;
  is44ADA: boolean;
  hasNilRatedItems: boolean;
  persona: string;
  isLutActive: boolean;
  isReverseCharge: boolean;
}

export function CompliancePanel(props: CompliancePanelProps) {
  const {
    resolvedGstType,
    tdsEnabled,
    tdsRate,
    tdsSection,
    grandTotal,
    tdsAmount,
    netReceivable,
    is44ADA,
    hasNilRatedItems,
    persona,
    isLutActive,
    isReverseCharge,
  } = props;

  const renderSection1 = () => {
    const pills = [];

    if (resolvedGstType === 'igst') {
      pills.push(
        <div key="igst" className="flex items-start gap-2 text-xs py-1.5 px-2.5 rounded-lg border-l-2 border-l-blue-400 bg-blue-50 text-blue-700">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 bg-blue-400" />
          <span>Inter-state transaction detected — IGST applies</span>
        </div>
      );
    }

    if (resolvedGstType === 'not_applicable') {
      pills.push(
        <div key="na" className="flex items-start gap-2 text-xs py-1.5 px-2.5 rounded-lg border-l-2 border-l-amber-400 bg-amber-50 text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 bg-amber-400" />
          <span>GST Not Applicable — Turnover below ₹20L</span>
        </div>
      );
    }

    if (isLutActive) {
      pills.push(
        <div key="lut" className="flex items-start gap-2 text-xs py-1.5 px-2.5 rounded-lg border-l-2 border-l-green-400 bg-green-50 text-green-700">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 bg-green-400" />
          <span>LUT Active — Zero-rated export. GST = ₹0</span>
        </div>
      );
    }

    if (isReverseCharge) {
      pills.push(
        <div key="rc" className="flex items-start gap-2 text-xs py-1.5 px-2.5 rounded-lg border-l-2 border-l-purple-400 bg-purple-50 text-purple-700">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 bg-purple-400" />
          <span>Reverse Charge — Buyer pays GST directly</span>
        </div>
      );
    }

    if (hasNilRatedItems) {
      pills.push(
        <div key="nil" className="flex items-start gap-2 text-xs py-1.5 px-2.5 rounded-lg border-l-2 border-l-green-400 bg-green-50 text-green-700">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 bg-green-400" />
          <span>Invoice contains NIL-rated items — GST = ₹0 on those lines</span>
        </div>
      );
    }

    if (tdsEnabled) {
      pills.push(
        <div key="tds" className="flex items-start gap-2 text-xs py-1.5 px-2.5 rounded-lg border-l-2 border-l-gray-300 bg-gray-50 text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 bg-gray-400" />
          <span>TDS Sec {tdsSection} @ {tdsRate}% will be deducted by client</span>
        </div>
      );
    }

    if (persona === 'ca' || persona === 'ca_firm') {
      pills.push(
        <div key="ca" className="flex items-start gap-2 text-xs py-1.5 px-2.5 rounded-lg border-l-2 border-l-blue-300 bg-blue-50 text-blue-600">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 bg-blue-300" />
          <span>Verify Place of Supply is set — mandatory for CA invoices</span>
        </div>
      );
    }

    if (pills.length === 0) return null;

    return (
      <div className="space-y-1.5">
        {pills}
      </div>
    );
  };

  const renderSection2 = () => {
    if (!tdsEnabled || tdsAmount <= 0) return null;

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Invoice total</span>
          <span>₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">
            TDS Sec {tdsSection} @ {tdsRate}%
          </span>
          <span className="text-red-500 font-medium">
            − ₹{tdsAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="border-t border-gray-200 pt-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-gray-700">You receive</span>
            <span className="text-green-600">
              ₹{netReceivable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 leading-relaxed">
          Client deposits TDS with govt on your behalf.
          Claim as credit when filing your ITR.
        </p>
      </div>
    );
  };

  const renderSection3 = () => {
    if (!is44ADA) return null;

    return (
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Advance Tax — FY 2025-26
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-gray-700">15%</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Jun 15</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-gray-700">45%</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Sep 15</div>
          </div>
          <div className="bg-amber-500 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-white">75%</div>
            <div className="text-[10px] text-amber-100 mt-0.5">Dec 15</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-gray-700">100%</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Mar 15</div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          44ADA: Pay income tax on 50% of gross receipts only.
        </p>
      </div>
    );
  };

  const sec1 = renderSection1();
  const sec2 = renderSection2();
  const sec3 = renderSection3();

  if (!sec1 && !sec2 && !sec3) {
    return <div />;
  }

  return (
    <div className="space-y-4">
      {sec1}
      {sec2}
      {sec3}
    </div>
  );
}

export default CompliancePanel;
