// Helper — do not export
const round = (n: number, d: number): number => 
  Math.round(n * Math.pow(10, d)) / Math.pow(10, d);

// Returns whether a transaction is intra-state (cgst_sgst) or 
// inter-state (igst) based on GSTIN prefix vs place of supply code.
export function getGSTType(
  sellerGSTIN: string, 
  placeOfSupply: string
): 'cgst_sgst' | 'igst' | null {
  const sellerState = sellerGSTIN?.trim().substring(0, 2);
  if (!sellerState || !placeOfSupply) return null;
  return sellerState === placeOfSupply ? 'cgst_sgst' : 'igst';
}

// Computes CGST, SGST, IGST amounts from subtotal and rate.
export function computeGST(
  subtotal: number,
  gstRate: number,
  gstType: 'cgst_sgst' | 'igst' | null
): { cgst: number; sgst: number; igst: number; total: number } {
  if (!gstType || gstRate === 0) 
    return { cgst: 0, sgst: 0, igst: 0, total: 0 };
  if (gstType === 'cgst_sgst') {
    const half = round(subtotal * gstRate / 100 / 2, 2);
    return { cgst: half, sgst: half, igst: 0, total: half * 2 };
  }
  const igst = round(subtotal * gstRate / 100, 2);
  return { cgst: 0, sgst: 0, igst, total: igst };
}

// Computes the taxable value of a single line item after discount.
export function computeLineItemTotal(
  qty: number,
  unitPrice: number,
  discountPercent: number
): number {
  return round(qty * unitPrice * (1 - discountPercent / 100), 2);
}

// Computes TDS amount at 10% under Section 194J.
export function computeTDS(subtotal: number): number {
  return round(subtotal * 0.10, 2);
}
