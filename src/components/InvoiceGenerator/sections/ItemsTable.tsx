import { Fragment } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CurrencyOption, UNITS } from '../constants';
import { BusinessType } from '../../../contexts/PersonaContext';
import { InvoiceItem, Product } from '../../../types';
import { autoSuggestSac, getSacInfo } from '../../../lib/sacDatabase';

interface ItemsTableProps {
    businessType: BusinessType;
    items: InvoiceItem[];
    setItems: (items: InvoiceItem[]) => void;
    currency: CurrencyOption;
    products: Product[];
    focusedItemIndex: number | null;
    setFocusedItemIndex: (v: number | null) => void;
    itemErrors?: Record<number, string>;
    taxRate: number;
}

export default function ItemsTable({
    businessType, items, setItems, currency,
    products, focusedItemIndex, setFocusedItemIndex, taxRate,
    itemErrors = {},
}: ItemsTableProps) {

    const addItem = () => setItems([
        ...items,
        { description: "", quantity: 1, unit: (businessType === 'services_firm' || businessType === 'solopreneur') ? 'Hours' : 'Qty', price: 0, discount: 0, sac_code: "", tax_rate: 18, is_exempt: false }
    ]);

    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const updateItem = (index: number, updates: Partial<InvoiceItem>) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], ...updates };
        setItems(newItems);
    };

    // ─── FIX 1: Dynamic grid class per businessType ────────────────────
    const gridClass = {
        solopreneur: 'grid-cols-[2fr_80px_60px_100px_80px_70px_30px]',
        services_firm: 'grid-cols-[2fr_80px_3fr_80px_60px_100px_80px_70px_30px]',
        subscription: 'grid-cols-[2fr_3fr_80px_60px_100px_80px_70px_30px]',
        ecommerce: 'grid-cols-[2fr_80px_80px_80px_60px_100px_80px_70px_30px]',
        ca: 'grid-cols-[2fr_80px_80px_60px_100px_80px_80px_70px_70px_30px]',
    }[businessType] ?? 'grid-cols-[2fr_80px_60px_100px_80px_70px_30px]';

    const lineTotal = (item: InvoiceItem) => item.quantity * item.price * (1 - (item.discount || 0) / 100);

    return (
        <div className={`space-y-4 relative ${focusedItemIndex !== null ? 'z-[40]' : 'z-0'}`}>
            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-visible">

                {/* ═══ DESKTOP HEADER (STICKY) ═══ */}
                <div className={`hidden sm:grid ${gridClass} gap-3 px-6 py-4 text-[10px] font-black text-gray-400 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-30 uppercase tracking-widest rounded-t-3xl`}>
                    <div>Description</div>
                    {(businessType === 'services_firm' || businessType === 'ca') && <div className="text-center">SAC</div>}
                    {businessType === 'ecommerce' && <div className="text-center">HSN</div>}
                    {businessType === 'ecommerce' && <div className="text-center">SKU / Code</div>}
                    {(businessType === 'subscription' || businessType === 'services_firm') && <div className="text-center">Service Period</div>}
                    <div className="text-center">Unit</div>
                    <div className="text-center">Qty</div>
                    <div className="text-center">Price</div>
                    <div className="text-center">Disc (%)</div>
                    {businessType === 'ca' && <div className="text-center text-[9px]">Taxable</div>}
                    {businessType === 'ca' && <div className="text-center text-[9px]">GST</div>}
                    <div className="text-right">Amount</div>
                    <div></div>
                </div>

                {/* ═══ MOBILE HEADER ═══ */}
                <div className="grid sm:hidden grid-cols-[2fr_60px_80px_70px_30px] gap-2 p-4 text-[10px] font-black text-gray-400 border-b border-gray-100 bg-gray-50/50 uppercase tracking-widest rounded-t-3xl">
                    <div>Description</div>
                    <div className="text-center">Qty</div>
                    <div className="text-center">Price</div>
                    <div className="text-right">Total</div>
                    <div></div>
                </div>

                {/* ═══ ROWS ═══ */}
                <div className="divide-y divide-gray-50">
                    {items.map((item, idx) => {
                        const taxableValue = lineTotal(item);

                        return (
                            <Fragment key={idx}>
                                {/* ─── Desktop Row ─── */}
                                <div className={`hidden sm:grid ${gridClass} gap-3 px-6 py-4 items-center group relative transition-all duration-200 ${focusedItemIndex === idx ? 'bg-primary-light/5 z-20' : 'hover:bg-gray-50/50'}`}>
                                    
                                    {/* Description + Autocomplete */}
                                    <div className="relative">
                                        <input
                                            className={`w-full bg-transparent border-none p-0 text-sm font-semibold text-text-main placeholder-gray-300 focus:ring-0 outline-none transition-all ${itemErrors[idx] ? 'text-red-500 placeholder-red-200' : ''}`}
                                            placeholder="Item name / search..."
                                            value={item.description}
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                const suggestion = autoSuggestSac(newValue);
                                                if (suggestion && !item.sac_code) {
                                                    updateItem(idx, {
                                                        description: newValue,
                                                        sac_code: suggestion.sacCode,
                                                        tax_rate: suggestion.entry.gstRate,
                                                        is_exempt: suggestion.entry.isExempt,
                                                    });
                                                } else {
                                                    updateItem(idx, { description: newValue });
                                                }
                                            }}
                                            onFocus={() => (businessType === 'ecommerce' || businessType === 'solopreneur') && setFocusedItemIndex(idx)}
                                            onBlur={() => setTimeout(() => setFocusedItemIndex(null), 200)}
                                        />
                                        {itemErrors[idx] && <p className="text-[9px] text-red-500 mt-0.5 font-bold uppercase tracking-tighter">{itemErrors[idx]}</p>}
                                        
                                        {item.sac_code && (
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 leading-none">
                                                    SAC {item.sac_code}
                                                </span>
                                                <span className="text-[10px] text-gray-400 leading-none">
                                                    {getSacInfo(item.sac_code).label}
                                                </span>
                                                {item.is_exempt && (
                                                    <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded px-1.5 py-0.5 leading-none">
                                                        NIL
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        
                                        {focusedItemIndex === idx && (
                                            <div className="absolute left-0 top-full mt-2 w-[140%] min-w-[320px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 max-h-72 overflow-y-auto z-[100] animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl bg-white/95 ring-1 ring-black/5">
                                                <div className="sticky top-0 bg-gray-50/90 backdrop-blur-sm px-4 py-2 border-b border-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-400 z-10 flex justify-between">
                                                    <span>Inventory Match</span>
                                                    <span>Stock Health</span>
                                                </div>
                                                {products
                                                    .filter(p => !item.description || p.name.toLowerCase().includes(item.description.toLowerCase()) || p.sku?.toLowerCase().includes(item.description.toLowerCase()))
                                                    .slice(0, 15)
                                                    .map(product => {
                                                        const allocatedQty = items.reduce((acc, currItem, currIdx) => 
                                                            currIdx !== idx && (currItem.productId === product.id || currItem.description === product.name) 
                                                            ? acc + (currItem.quantity || 0) : acc, 0);
                                                        const availableStock = Math.max(0, product.stock - allocatedQty);
                                                        const isOutOfStock = product.isInventoryTracked && availableStock === 0;

                                                        return (
                                                            <button
                                                                key={product.id}
                                                                className={`w-full text-left px-4 py-3 hover:bg-primary/5 flex justify-between items-center group/item transition-all border-b border-gray-50 last:border-0 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                                                                disabled={isOutOfStock}
                                                                onClick={() => {
                                                                    updateItem(idx, {
                                                                        description: product.name,
                                                                        price: product.price,
                                                                        unit: product.unit,
                                                                        productId: product.id,
                                                                        sku: product.sku,
                                                                        hsn_code: product.hsnCode || ''
                                                                    });
                                                                }}
                                                            >
                                                                <div className="space-y-0.5">
                                                                    <div className="font-bold text-xs text-gray-800 group-hover/item:text-primary transition-colors">{product.name}</div>
                                                                    <div className="flex items-center gap-2">
                                                                        {product.sku && <span className="text-[9px] font-mono text-gray-400">SKU: {product.sku}</span>}
                                                                        {!product.isInventoryTracked && <span className="text-[9px] text-blue-500 font-black uppercase">Service</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-black text-xs text-gray-900">{currency.symbol}{product.price.toLocaleString()}</div>
                                                                    <div className={`text-[9px] font-bold uppercase ${availableStock < 5 ? 'text-amber-500' : 'text-gray-400'}`}>{availableStock} {product.unit} left</div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </div>

                                    {/* SAC/HSN */}
                                    {(businessType === 'services_firm' || businessType === 'ca') && (
                                        <div className="text-center">
                                            <input
                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-lg px-2 py-1.5 text-[10px] font-mono focus:border-primary focus:bg-white outline-none text-center transition-all"
                                                placeholder="SAC"
                                                maxLength={6}
                                                value={item.sac_code || ''}
                                                onChange={(e) => {
                                                    const code = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                    const info = getSacInfo(code);
                                                    updateItem(idx, {
                                                        sac_code: code,
                                                        tax_rate: info.gstRate,
                                                        is_exempt: info.isExempt,
                                                    });
                                                }}
                                            />
                                        </div>
                                    )}
                                    {businessType === 'ecommerce' && (
                                        <div className="text-center">
                                            <input className="w-full bg-gray-50/50 border border-gray-100 rounded-lg px-2 py-1.5 text-[10px] font-mono focus:border-primary focus:bg-white outline-none text-center transition-all" placeholder="HSN" value={item.hsn_code || ''} onChange={(e) => updateItem(idx, { hsn_code: e.target.value })} />
                                        </div>
                                    )}
                                    {businessType === 'ecommerce' && (
                                        <div className="text-center">
                                            <input className="w-full bg-gray-50/50 border border-gray-100 rounded-lg px-2 py-1.5 text-[10px] font-mono focus:border-primary focus:bg-white outline-none text-center transition-all" placeholder="SKU" value={item.sku || ''} onChange={(e) => updateItem(idx, { sku: e.target.value })} />
                                        </div>
                                    )}

                                    {/* Service Period */}
                                    {(businessType === 'subscription' || businessType === 'services_firm') && (
                                        <div className="flex items-center gap-1 justify-center bg-gray-50/50 rounded-lg p-1">
                                            <input type="date" className="bg-transparent border-none p-0 text-[10px] outline-none w-18" value={item.serviceStartDate || ''} onChange={(e) => updateItem(idx, { serviceStartDate: e.target.value })} />
                                            <span className="text-gray-300 text-[10px]">-</span>
                                            <input type="date" className="bg-transparent border-none p-0 text-[10px] outline-none w-18" value={item.serviceEndDate || ''} onChange={(e) => updateItem(idx, { serviceEndDate: e.target.value })} />
                                        </div>
                                    )}

                                    {/* Unit */}
                                    <div>
                                        <select className="w-full bg-transparent border-none text-[10px] font-bold p-0 focus:ring-0 outline-none text-center cursor-pointer" value={item.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })}>
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>

                                    {/* Qty */}
                                    <div>
                                        <input type="number" className="w-full text-center bg-gray-50/50 border border-gray-100 rounded-lg py-1.5 text-xs font-black focus:bg-white focus:border-primary transition-all" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
                                    </div>

                                    {/* Price */}
                                    <div className="text-center group-hover:bg-gray-50/80 rounded-lg transition-all">
                                        <input type="number" className="w-full text-center bg-transparent border-none p-2 text-xs font-black text-text-main focus:ring-0 outline-none" value={item.price} onChange={(e) => updateItem(idx, { price: Number(e.target.value) })} />
                                    </div>

                                    {/* Discount */}
                                    <div>
                                        <input type="number" className="w-full text-center bg-gray-50/50 border border-gray-100 rounded-lg py-1.5 text-xs font-black focus:bg-white focus:border-primary transition-all" value={item.discount || 0} onChange={(e) => updateItem(idx, { discount: Number(e.target.value) })} />
                                    </div>

                                    {/* CA Tax breakdown */}
                                    {businessType === 'ca' && <div className="text-center text-[10px] font-bold text-gray-500">{currency.symbol}{taxableValue.toLocaleString()}</div>}
                                    {businessType === 'ca' && (
                                        <div className="text-center group-hover:bg-gray-50/80 rounded-lg transition-all relative">
                                            <input
                                                type="number"
                                                className="w-full text-center bg-transparent border-none p-1 text-[10px] font-black text-primary focus:ring-0 outline-none"
                                                value={item.is_exempt ? 0 : (item.tax_rate ?? 18)}
                                                onChange={(e) => {
                                                    updateItem(idx, { tax_rate: parseFloat(e.target.value) || 0 });
                                                }}
                                            />
                                            <span className="absolute right-1 top-1 text-[8px] font-bold text-primary/40">%</span>
                                        </div>
                                    )}

                                    {/* Total Amount */}
                                    <div className="text-right text-xs font-black text-primary">
                                        {currency.symbol}{taxableValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end">
                                        <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1.5">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* ─── Mobile Row ─── */}
                                <div className="sm:hidden grid grid-cols-[2fr_60px_80px_70px_30px] gap-2 p-4 items-center relative">
                                    <div className="relative">
                                        <input className="w-full bg-transparent border-none p-0 text-sm font-semibold text-text-main outline-none" placeholder="Item name..." value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
                                    </div>
                                    <div><input type="number" className="w-full text-center bg-gray-50/50 border border-gray-100 rounded-lg py-1.5 text-xs font-black" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} /></div>
                                    <div className="text-center"><span className="text-[10px] text-gray-400 font-bold mr-1">{currency.symbol}</span><input type="number" className="w-14 text-center bg-transparent border-none p-0 text-xs font-black outline-none" value={item.price} onChange={(e) => updateItem(idx, { price: Number(e.target.value) })} /></div>
                                    <div className="text-right text-xs font-black text-primary">{currency.symbol}{taxableValue.toLocaleString()}</div>
                                    <div className="flex justify-end"><button onClick={() => removeItem(idx)} className="text-red-400 p-1.5"><Trash2 size={14} /></button></div>
                                </div>
                            </Fragment>
                        );
                    })}
                </div>
            </div>

            <button
                onClick={addItem}
                className="group flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest bg-white border border-gray-200 px-5 py-3 rounded-2xl hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 active:scale-95 shadow-sm"
            >
                <Plus size={14} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
                Add Line Item
            </button>
        </div>
    );
}
