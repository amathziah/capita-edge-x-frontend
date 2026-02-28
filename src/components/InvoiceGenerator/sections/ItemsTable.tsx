import { Fragment } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CurrencyOption, UNITS } from '../constants';
import { BusinessType } from '../../../contexts/PersonaContext';
import { InvoiceItem, Product } from '../../../types';

interface ItemsTableProps {
    businessType: BusinessType;
    items: InvoiceItem[];
    setItems: (items: InvoiceItem[]) => void;
    currency: CurrencyOption;
    products: Product[];
    focusedItemIndex: number | null;
    setFocusedItemIndex: (v: number | null) => void;
    showToast: (message: string, type: 'info' | 'error' | 'success') => void;
    taxRate: number;
    itemErrors?: Record<number, string>;
}

export default function ItemsTable({
    businessType, items, setItems, currency,
    products, focusedItemIndex, setFocusedItemIndex, showToast, taxRate,
    itemErrors = {},
}: ItemsTableProps) {

    const addItem = () => setItems([
        ...items,
        { description: "", quantity: 1, unit: (businessType === 'agency' || businessType === 'solopreneur') ? 'Hours' : 'Qty', price: 0, discount: 0 }
    ]);

    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const updateItem = <K extends keyof InvoiceItem>(index: number, field: K, value: InvoiceItem[K]) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    // ─── FIX 1: Dynamic grid class per businessType ────────────────────
    const gridClass = {
        solopreneur: 'grid-cols-[2fr_80px_60px_100px_80px_70px_30px]',
        agency: 'grid-cols-[2fr_80px_3fr_80px_60px_100px_80px_70px_30px]',
        saas: 'grid-cols-[2fr_3fr_80px_60px_100px_80px_70px_30px]',
        ecommerce: 'grid-cols-[2fr_80px_80px_80px_60px_100px_80px_70px_30px]',
        ca: 'grid-cols-[2fr_80px_80px_60px_100px_80px_80px_70px_70px_30px]',
    }[businessType] ?? 'grid-cols-[2fr_80px_60px_100px_80px_70px_30px]';

    const lineTotal = (item: InvoiceItem) => item.quantity * item.price * (1 - (item.discount || 0) / 100);

    return (
        <div className={`space-y-4 relative ${focusedItemIndex !== null ? 'z-[40]' : 'z-0'}`}>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-md">

                {/* ═══ DESKTOP HEADER ═══ */}
                <div className={`hidden sm:grid ${gridClass} gap-3 p-5 text-xs font-bold text-text-muted border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-primary-light/10 uppercase tracking-widest`}>
                    <div>Description</div>

                    {(businessType === 'agency' || businessType === 'ca') && <div className="text-center">SAC</div>}
                    {businessType === 'ecommerce' && <div className="text-center">HSN</div>}
                    {businessType === 'ecommerce' && <div className="text-center">SKU / Code</div>}
                    {(businessType === 'saas' || businessType === 'agency') && <div className="text-center">Service Period</div>}

                    <div className="text-center">Unit</div>
                    <div className="text-center">Qty</div>
                    <div className="text-center">Price</div>
                    <div className="text-center">Discount %</div>

                    {businessType === 'ca' && <div className="text-center text-[9px]">Taxable Value</div>}
                    {businessType === 'ca' && <div className="text-center text-[9px]">GST</div>}

                    <div className="text-center">Amount</div>
                    <div>{/* delete */}</div>
                </div>

                {/* ═══ MOBILE HEADER ═══ */}
                <div className="grid sm:hidden grid-cols-[2fr_60px_80px_70px_30px] gap-2 p-3 text-[10px] font-bold text-text-muted border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-primary-light/10 uppercase tracking-widest">
                    <div>Description</div>
                    <div className="text-center">Qty</div>
                    <div className="text-center">Price</div>
                    <div className="text-center">Total</div>
                    <div></div>
                </div>

                {/* ═══ ROWS ═══ */}
                <div className="divide-y divide-gray-100">
                    {items.map((item, idx) => {
                        const taxableValue = lineTotal(item);
                        const gstAmount = taxableValue * taxRate / 100;

                        return (
                            <Fragment key={idx}>

                                {/* ─── Desktop Row ─── */}
                                <div className={`hidden sm:grid ${gridClass} gap-3 p-4 items-center hover:bg-gradient-to-r hover:from-primary-light/10 hover:to-transparent transition-all duration-200 group relative ${focusedItemIndex === idx ? 'z-[50]' : 'z-0'}`}>

                                    {/* Description + Product Autocomplete */}
                                    <div className="relative">
                                        <input
                                            className={`w-full bg-transparent border-0 focus:outline-none p-0 text-sm font-medium text-text-main placeholder-gray-400 ${itemErrors[idx] ? 'text-red-600 placeholder-red-300' : ''}`}
                                            placeholder="Item description or search product..."
                                            value={item.description}
                                            onChange={(e) => updateItem(idx, "description", e.target.value)}
                                            onFocus={() => {
                                                if (businessType === 'ecommerce' || businessType === 'solopreneur') {
                                                    setFocusedItemIndex(idx);
                                                }
                                            }}
                                            onBlur={() => setTimeout(() => setFocusedItemIndex(null), 200)}
                                        />
                                        {itemErrors[idx] && (
                                            <p className="text-[10px] font-medium text-red-500 mt-0.5 flex items-center gap-1">
                                                <span className="inline-block w-1 h-1 rounded-full bg-red-400"></span>
                                                {itemErrors[idx]}
                                            </p>
                                        )}

                                        {/* Product Autocomplete Dropdown */}
                                        {focusedItemIndex === idx && (
                                            <div className="absolute left-0 top-full mt-2 w-[120%] min-w-[300px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 max-h-72 overflow-y-auto z-[100] animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl bg-white/95">
                                                <div className="sticky top-0 bg-gray-50/90 backdrop-blur-sm px-4 py-2 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400 z-10 flex justify-between">
                                                    <span>Available Products (Inventory)</span>
                                                    <span>Stock Health</span>
                                                </div>
                                                {products
                                                    .filter(p => {
                                                        const matchesSearch = !item.description || p.name.toLowerCase().includes(item.description.toLowerCase()) || p.sku?.toLowerCase().includes(item.description.toLowerCase());
                                                        if (!matchesSearch) return false;
                                                        return p.isInventoryTracked;
                                                    })
                                                    .slice(0, 50)
                                                    .map(product => {
                                                        const allocatedQty = items.reduce((acc, currItem, currIdx) => {
                                                            if (currIdx !== idx && (currItem.productId === product.id || currItem.description === product.name)) {
                                                                return acc + (currItem.quantity || 0);
                                                            }
                                                            return acc;
                                                        }, 0);
                                                        const availableStock = Math.max(0, product.stock - allocatedQty);
                                                        const isOutOfStock = product.isInventoryTracked && availableStock === 0;

                                                        return (
                                                            <button
                                                                key={product.id}
                                                                className={`w-full text-left px-4 py-3 hover:bg-primary-light/10 flex justify-between items-center group transition-all duration-150 border-b border-gray-50 last:border-0 ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}
                                                                disabled={isOutOfStock}
                                                                onClick={() => {
                                                                    if (isOutOfStock) return;
                                                                    const newItems = [...items];
                                                                    newItems[idx] = {
                                                                        ...newItems[idx],
                                                                        description: product.name,
                                                                        price: product.price,
                                                                        unit: product.unit,
                                                                        productId: product.id,
                                                                        sku: product.sku,
                                                                        hsnCode: product.hsnCode || '',
                                                                        quantity: newItems[idx].quantity || 1
                                                                    };
                                                                    setItems(newItems);
                                                                    if (product.isInventoryTracked && availableStock < 5) {
                                                                        showToast(`Note: Only ${availableStock} left of ${product.name}`, 'info');
                                                                    }
                                                                }}
                                                            >
                                                                <div className="space-y-0.5">
                                                                    <div className="font-semibold text-sm text-gray-800 group-hover:text-primary transition-colors">{product.name}</div>
                                                                    <div className="flex items-center gap-2">
                                                                        {product.sku && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">SKU: {product.sku}</span>}
                                                                        <span className="text-[10px] text-gray-400">{product.unit}</span>
                                                                        {!product.isInventoryTracked && (
                                                                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-bold uppercase tracking-widest">Service</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right space-y-0.5">
                                                                    <div className="font-bold text-sm text-gray-900">{currency.symbol}{product.price.toLocaleString()}</div>
                                                                    <div>
                                                                        {!product.isInventoryTracked ? (
                                                                            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center justify-end ml-auto w-fit">Unlimited</span>
                                                                        ) : availableStock > 10 ? (
                                                                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 justify-end ml-auto w-fit">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                                {availableStock} left
                                                                            </span>
                                                                        ) : availableStock > 0 ? (
                                                                            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 justify-end ml-auto w-fit">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                                                Low: {availableStock}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1 justify-end ml-auto w-fit">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                                                Sold Out
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                {item.description && products.filter(p => p.name.toLowerCase().includes(item.description.toLowerCase())).length === 0 && (
                                                    <div className="p-4 text-center space-y-1">
                                                        <p className="text-sm font-medium text-gray-500">No matching products</p>
                                                        <p className="text-xs text-gray-400">A custom item will be created</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* SAC Code (agency/CA) */}
                                    {(businessType === 'agency' || businessType === 'ca') && (
                                        <div>
                                            <input
                                                type="text"
                                                className="w-full bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl px-2 py-2 text-[11px] font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-text-muted text-center transition-all font-mono"
                                                placeholder="998311"
                                                title="Service Accounting Code — required for GST"
                                                value={item.sacCode || ''}
                                                onChange={(e) => updateItem(idx, "sacCode", e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* HSN Code (ecommerce) */}
                                    {businessType === 'ecommerce' && (
                                        <div>
                                            <input
                                                type="text"
                                                className="w-full bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl px-2 py-2 text-[11px] font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-text-muted text-center transition-all font-mono"
                                                placeholder="e.g. 6305"
                                                title="Harmonized System of Nomenclature — required for goods GST"
                                                value={item.hsnCode || ''}
                                                onChange={(e) => updateItem(idx, "hsnCode", e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* SKU (ecommerce) */}
                                    {businessType === 'ecommerce' && (
                                        <div>
                                            {item.sku ? (
                                                <span className="block w-full text-center text-[10px] font-mono text-text-muted bg-gray-100/60 rounded-lg py-2 px-1 truncate" title={item.sku}>
                                                    {item.sku}
                                                </span>
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="w-full bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl px-2 py-2 text-[11px] font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-text-muted text-center transition-all font-mono"
                                                    placeholder="SKU"
                                                    value=''
                                                    onChange={(e) => updateItem(idx, "sku", e.target.value)}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Service Period (saas/agency) — FIX 5 */}
                                    {(businessType === 'saas' || businessType === 'agency') && (
                                        <div className="flex items-center gap-1">
                                            <input type="date" className="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-1 text-xs outline-none focus:border-primary" value={item.serviceStartDate || ''} onChange={(e) => updateItem(idx, "serviceStartDate", e.target.value)} />
                                            <span className="text-[10px] text-gray-400 shrink-0">to</span>
                                            <input type="date" className="w-full bg-gray-50/50 border border-gray-100 rounded-lg p-1 text-xs outline-none focus:border-primary" value={item.serviceEndDate || ''} onChange={(e) => updateItem(idx, "serviceEndDate", e.target.value)} />
                                        </div>
                                    )}

                                    {/* Unit */}
                                    <div>
                                        <select
                                            className="w-full bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-text-muted transition-all"
                                            value={item.unit}
                                            onChange={(e) => updateItem(idx, "unit", e.target.value)}
                                        >
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>

                                    {/* Qty */}
                                    <div>
                                        <input type="number" className="w-full text-center bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:bg-white focus:border-primary text-text-main transition-all" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
                                    </div>

                                    {/* Price */}
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-xs text-text-light font-medium">{currency.symbol}</span>
                                        <input type="number" className="w-full text-right bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl py-2 pl-6 pr-3 text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white outline-none transition-all" value={item.price} onChange={(e) => updateItem(idx, "price", Number(e.target.value))} />
                                    </div>

                                    {/* Discount % — FIX 4 */}
                                    <div className="relative">
                                        <input type="number" min="0" max="100" title="Enter 0 for no discount" className="w-full text-center bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:bg-white focus:border-primary text-text-main transition-all pr-5" value={item.discount || 0} onChange={(e) => updateItem(idx, "discount", Number(e.target.value))} />
                                        <span className="absolute right-2 top-2.5 text-xs text-text-light font-medium">%</span>
                                    </div>

                                    {/* FIX 7: CA Taxable Value */}
                                    {businessType === 'ca' && (
                                        <div className="text-right text-[11px] font-semibold text-text-muted">
                                            {currency.symbol}{taxableValue.toFixed(0)}
                                        </div>
                                    )}

                                    {/* FIX 7: CA GST Amount */}
                                    {businessType === 'ca' && (
                                        <div className="text-right text-[11px] font-semibold text-primary" title="GST calculated at current tax rate">
                                            {currency.symbol}{gstAmount.toFixed(0)}
                                        </div>
                                    )}

                                    {/* Line Total / Amount */}
                                    <div className="text-right text-sm font-bold text-primary">
                                        {currency.symbol}{taxableValue.toFixed(0)}
                                    </div>

                                    {/* Delete — FIX 6 */}
                                    <div className="flex justify-end opacity-30 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-500 bg-red-50 p-2 rounded-xl hover:bg-red-100 transition-all duration-200 hover:scale-110">
                                            <Trash2 size={16} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>

                                {/* ─── Mobile Row — FIX 8 ─── */}
                                <div className={`grid sm:hidden grid-cols-[2fr_60px_80px_70px_30px] gap-2 p-3 items-center hover:bg-gradient-to-r hover:from-primary-light/10 hover:to-transparent transition-all duration-200 relative ${focusedItemIndex === idx ? 'z-[50]' : 'z-0'}`}>

                                    {/* Description */}
                                    <div className="relative">
                                        <input
                                            className="w-full bg-transparent border-0 focus:outline-none p-0 text-sm font-medium text-text-main placeholder-gray-400"
                                            placeholder="Item description..."
                                            value={item.description}
                                            onChange={(e) => updateItem(idx, "description", e.target.value)}
                                            onFocus={() => {
                                                if (businessType === 'ecommerce' || businessType === 'solopreneur') {
                                                    setFocusedItemIndex(idx);
                                                }
                                            }}
                                            onBlur={() => setTimeout(() => setFocusedItemIndex(null), 200)}
                                        />
                                    </div>

                                    {/* Qty */}
                                    <div>
                                        <input type="number" className="w-full text-center bg-gray-50/80 rounded-lg border border-gray-200 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-primary/30 focus:border-primary text-text-main transition-all" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
                                    </div>

                                    {/* Price */}
                                    <div className="relative">
                                        <span className="absolute left-2 top-2 text-[10px] text-text-light font-medium">{currency.symbol}</span>
                                        <input type="number" className="w-full text-right bg-gray-50/80 border border-gray-200 rounded-lg py-1.5 pl-5 pr-2 text-xs font-semibold focus:ring-1 focus:ring-primary/30 focus:border-primary outline-none transition-all" value={item.price} onChange={(e) => updateItem(idx, "price", Number(e.target.value))} />
                                    </div>

                                    {/* Total */}
                                    <div className="text-right text-xs font-bold text-primary">
                                        {currency.symbol}{taxableValue.toFixed(0)}
                                    </div>

                                    {/* Delete — always visible on mobile */}
                                    <div className="flex justify-end">
                                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-500 bg-red-50 p-1.5 rounded-lg hover:bg-red-100 transition-all duration-200">
                                            <Trash2 size={14} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                            </Fragment>
                        );
                    })}
                </div>
            </div>

            <button
                onClick={addItem}
                className="flex items-center gap-2 text-primary text-sm font-semibold hover:text-primary-dark transition-all duration-200 px-4 py-2 rounded-xl hover:bg-primary-light/20 w-fit hover:scale-105"
            >
                <Plus size={18} strokeWidth={2.5} /> Add Line Item
            </button>
        </div>
    );
}
