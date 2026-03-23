import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoiceState } from './hooks/useInvoiceState';
import { useInvoiceActions } from './hooks/useInvoiceActions';
import { usePersona } from '../../contexts/PersonaContext';
import { Invoice, InvoiceItem } from '../../types';
import { dataService } from '../../services/dataService';
import { CURRENCIES, TAX_LABELS, UNITS, INDIAN_STATES, InvoiceMeta, Buyer } from './constants';
import { numberToIndianWords } from './utils';
import { autoSuggestSac } from '../../lib/sacDatabase';
import { validateGstin, getStateFromGstin, getGstinStateDisplay } from '../../lib/gstUtils';
import { Toast } from '../Toast';

// ─── Constants & Helper Components ─────────────────────────────────────

const underlineStyle: React.CSSProperties = {
  width: '100%', border: 'none', borderBottom: '1px solid #e5e7eb',
  background: 'transparent', padding: '6px 0', fontSize: 13, outline: 'none', display: 'block'
};

const Label = ({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) => (
  <label style={{ fontSize:10, fontWeight:700, color:'#9ca3af', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
    {children}
    {required && <span style={{ color:'#ef4444' }}>*</span>}
    {optional && <span style={{ fontSize:9, color:'#d1d5db', background:'#f3f4f6', padding:'2px 6px', borderRadius:4 }}>optional</span>}
  </label>
);

const FieldGroup = ({ children }: { children: React.ReactNode }) => (
  <div style={{ marginBottom: 12 }}>{children}</div>
);

const ErrMsg = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize:10, color:'#ef4444', fontWeight:700, display:'block', marginTop:2 }}>{children}</span>
);

const TRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
    <span style={{ color:'#9ca3af' }}>{label}</span>
    <span style={{ fontWeight:500 }}>{value}</span>
  </div>
);

const PILL_COLORS = {
  blue:   { bg:'#eff6ff', border:'#3b82f6', text:'#1e40af' },
  amber:  { bg:'#fffbeb', border:'#f59e0b', text:'#92400e' },
  green:  { bg:'#f0fdf4', border:'#22c55e', text:'#166534' },
  purple: { bg:'#faf5ff', border:'#a855f7', text:'#6b21a8' },
  gray:   { bg:'#f9fafb', border:'#9ca3af', text:'#374151' },
};

const Pill = ({ color, children }: { color: keyof typeof PILL_COLORS; children: React.ReactNode }) => {
  const c = PILL_COLORS[color];
  return (
    <div style={{ borderLeft:`3px solid ${c.border}`, background:c.bg, borderRadius:'0 8px 8px 0', padding:'7px 12px' }}>
      <span style={{ fontSize:11, color:c.text }}>{children}</span>
    </div>
  );
};

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button type="button" onClick={() => onChange(!value)}
    style={{ width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', background:value?'#1D9E75':'#d1d5db', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
    <span style={{ position:'absolute', top:3, left:value?22:3, width:18, height:18, borderRadius:'50%', background:'white', transition:'left 0.2s', display:'block' }} />
  </button>
);

const GRID_COLS: Record<string, string> = {
  solopreneur:   '2fr 60px 80px 70px 20px',
  services_firm: '2fr 60px 60px 90px 70px 70px 20px',
  ecommerce:     '2fr 60px 60px 90px 70px 70px 20px',
  ca_firm:       '2fr 60px 60px 90px 70px 70px 20px',
  subscription:  '2fr 120px 60px 90px 70px 70px 20px',
};

const InputField = ({ label, required, optional, error, ...props }: any) => (
  <FieldGroup>
    <Label required={required} optional={optional}>{label}</Label>
    <input style={underlineStyle} {...props} />
    {error && <ErrMsg>{error}</ErrMsg>}
  </FieldGroup>
);

// ─── Props ─────────────────────────────────────────────────────────────
export interface InvoiceGeneratorProps {
    onClose?: () => void;
    editingInvoice?: Invoice;
    initialData?: {
        invoice?: Partial<InvoiceMeta>;
        buyer?: Partial<Buyer>;
        items?: InvoiceItem[];
        voiceDraft?: string;
    };
}

export default function InvoiceGenerator({ onClose, initialData, editingInvoice }: InvoiceGeneratorProps) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { businessType: _bt } = usePersona();
    const businessType = _bt ?? 'solopreneur';

    const [fetchedInvoice, setFetchedInvoice] = React.useState<Invoice | undefined>(editingInvoice);

    React.useEffect(() => {
        if (id && !editingInvoice) {
            dataService.getInvoice(id)
                .then(setFetchedInvoice)
                .catch(err => console.error("Failed to fetch invoice", err));
        }
    }, [id, editingInvoice]);

    const handleClose = () => {
        if (onClose) onClose();
        else navigate('/dashboard/invoices');
    };

    const state = useInvoiceState({ businessType, editingInvoice: fetchedInvoice, initialData });
    const actions = useInvoiceActions(state, onClose);

    const {
        currency, setCurrency, taxLabel, setTaxLabel, logo,
        seller, setSeller, buyer, setBuyer, notes, setNotes, meta, setMeta,
        projectName, setProjectName,
        orderNumber, setOrderNumber,
        isGstRegistered, setIsGstRegistered,
        authorizedSignatory, setAuthorizedSignatory,
        placeOfSupply, setPlaceOfSupply, reverseCharge, setReverseCharge,
        dispatchDate, setDispatchDate,
        courierTracking, setCourierTracking,
        items, setItems, taxRate, setTaxRate, shipping, setShipping, discountAmount, setDiscountAmount,
        tdsEnabled, tdsRate,
        subtotal, taxAmount, total, tdsAmount, resolvedGstType,
        activeAction, loading,
        isEmailModalOpen, setIsEmailModalOpen, emailTo, setEmailTo,
        toast, setToast,
        sellerErrors, buyerErrors, headerErrors, itemErrors,
        clearErrors,
        products, focusedItemIndex, setFocusedItemIndex,
        customers, isBuyerFocused, setIsBuyerFocused,
        lutNumber,
    } = state;

    const {
        handleLogoUpload,
    } = actions;

    const updateItem = (idx: number, updates: Partial<InvoiceItem>) => {
        const next = [...items];
        next[idx] = { ...next[idx], ...updates };
        setItems(next);
    };



return (
    <div style={{ 
        display: 'grid', 
        gridTemplateRows: 'auto 1fr', 
        height: '100%',          // fills whatever the dashboard gives it
        overflow: 'hidden',      // kills page-level scroll entirely
        background: 'white',
        borderRadius: 12,
        border: '1px solid #f3f4f6'
    }}>

        {/* Email Modal — stays fixed so it covers full screen */}
        {isEmailModalOpen && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
                <div style={{ background:'white', borderRadius:20, padding:32, width:'100%', maxWidth:400, boxShadow:'0 20px 50px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ fontSize:18, fontWeight:700, margin:'0 0 20px' }}>Send Invoice</h3>
                    <Label>RECIPIENT EMAIL</Label>
                    <input value={emailTo} onChange={e=>setEmailTo(e.target.value)} placeholder="client@example.com" style={{ ...underlineStyle, marginBottom:20 }} />
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        <button onClick={()=>setIsEmailModalOpen(false)} style={{ padding:12, borderRadius:10, border:'1px solid #e5e7eb', background:'transparent', cursor:'pointer', fontSize:13, fontWeight:500, color:'#6b7280' }}>Cancel</button>
                        <button onClick={actions.handleSendEmail} disabled={loading} style={{ padding:12, borderRadius:10, border:'none', background:'#1D9E75', color:'white', cursor:'pointer', fontSize:13, fontWeight:700 }}>
                            {activeAction==='emailing' ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}

        {/* ── STICKY TOP BAR ── */}
        <div style={{ 
            display:'flex', alignItems:'center', justifyContent:'space-between', 
            padding:'10px 24px', borderBottom:'1px solid #f3f4f6', 
            background:'white', flexShrink:0 
        }}>
            {/* Left: back + title */}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <button onClick={handleClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e5e7eb', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', fontSize:16 }}>
                    ←
                </button>
                <h1 style={{ fontSize:16, fontWeight:700, color:'#111827', margin:0 }}>
                    {fetchedInvoice ? 'Edit Invoice' : 'Create New Invoice'}
                </h1>
            </div>

            {/* Center: currency + tax selects */}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:10, fontWeight:700, color:'#9ca3af', letterSpacing:'0.08em' }}>CURRENCY</span>
                <select value={currency.code} onChange={e => setCurrency(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0])}
                    style={{ fontSize:12, fontWeight:500, border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', outline:'none' }}>
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                </select>
                <span style={{ fontSize:10, fontWeight:700, color:'#9ca3af', letterSpacing:'0.08em' }}>TAX</span>
                <select value={taxLabel} onChange={e => setTaxLabel(e.target.value)}
                    style={{ fontSize:12, fontWeight:500, border:'1px solid #e5e7eb', borderRadius:8, padding:'4px 8px', outline:'none' }}>
                    {TAX_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>

            {/* Right: action buttons — Variabl-style */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={handleClose}
                    style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #e5e7eb', background:'transparent', cursor:'pointer', fontSize:12, fontWeight:500, color:'#6b7280' }}>
                    Discard
                </button>
                <button onClick={actions.handleSaveOnly} disabled={loading}
                    style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #e5e7eb', background:'transparent', cursor:'pointer', fontSize:12, fontWeight:500, color:'#374151', opacity:loading?0.6:1 }}>
                    {activeAction==='saving' ? '...' : 'Save as Draft'}
                </button>
                <button onClick={actions.handleSaveAndDownload} disabled={loading}
                    style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #1D9E75', background:'transparent', cursor:'pointer', fontSize:12, fontWeight:600, color:'#1D9E75', opacity:loading?0.6:1 }}>
                    {activeAction==='downloading' ? 'Generating...' : 'Save & PDF'}
                </button>
                <button onClick={actions.handleSaveOnly} disabled={loading}
                    style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'#1D9E75', color:'white', cursor:'pointer', fontSize:12, fontWeight:700, opacity:loading?0.6:1 }}>
                    {activeAction==='saving' ? '...' : 'Create Invoice'}
                </button>
            </div>
        </div>

        {/* ── BODY: two panels, each scrolls independently ── */}
        <div style={{ 
            display:'grid', 
            gridTemplateColumns:'1fr 380px', 
            overflow:'hidden',   // parent must not scroll
            minHeight:0          // critical — lets grid children shrink below content size
        }}>

            {/* LEFT — form, scrollable */}
            <div style={{ overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:20, borderRight:'1px solid #f3f4f6' }}>

                {/* Logo + Meta row */}
                <div style={{ display:'grid', gridTemplateColumns:'88px 1fr', gap:16, alignItems:'start' }}>
                    <div style={{ width:88, height:88, border:'2px dashed #e5e7eb', borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, cursor:'pointer', position:'relative', overflow:'hidden' }}>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', zIndex:1 }} />
                        {logo ? <img src={logo} alt="logo" style={{ width:'100%', height:'100%', objectFit:'contain', padding:6 }} />
                               : <><div style={{ fontSize:20, color:'#d1d5db' }}>⊞</div><span style={{ fontSize:9, color:'#9ca3af' }}>Logo</span></>}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                        <div style={{ gridColumn:'1/-1' }}>
                            <InputField label="INVOICE #" value={meta.number||''} readOnly />
                        </div>
                        <InputField label="DATE" type="date" value={meta.date||''} onChange={e=>setMeta({...meta,date:e.target.value})} required error={headerErrors?.date} />
                        <InputField label="DUE DATE" type="date" value={meta.dueDate||''} onChange={e=>setMeta({...meta,dueDate:e.target.value})} optional />
                        {/* Persona extras inline */}
                        {businessType==='services_firm' && (
                            <InputField label="PROJECT NAME" value={projectName} onChange={e=>setProjectName(e.target.value)} optional placeholder="Website Redesign" />
                        )}
                        {(businessType==='ecommerce'||businessType==='subscription') && (
                            <InputField label="ORDER / REF #" value={orderNumber} onChange={e=>setOrderNumber(e.target.value)} optional placeholder="ORD-9981" />
                        )}
                        {businessType==='ecommerce' && (
                            <InputField label="DISPATCH DATE" type="date" value={dispatchDate} onChange={e=>setDispatchDate(e.target.value)} optional />
                        )}
                    </div>
                </div>

                {businessType==='ca_firm' && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <div>
                            <Label required>PLACE OF SUPPLY</Label>
                            <select value={placeOfSupply} onChange={e=>setPlaceOfSupply(e.target.value)} style={underlineStyle}>
                                {INDIAN_STATES.map(s=><option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f9fafb', borderRadius:10, padding:'8px 12px', border:'1px solid #f3f4f6', alignSelf:'end' }}>
                            <span style={{ fontSize:11, fontWeight:600, color:'#6b7280' }}>Reverse Charge</span>
                            <Toggle value={reverseCharge} onChange={setReverseCharge} />
                        </div>
                    </div>
                )}

                <hr style={{ border:'none', borderTop:'1px solid #f3f4f6', margin:0 }} />

                {/* FROM / TO */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

                    {/* FROM */}
                    <div style={{ background:'#f9fafb', borderRadius:12, padding:14, border:'1px solid #f3f4f6', display:'flex', flexDirection:'column', gap:10 }}>
                        <p style={{ fontSize:10, fontWeight:700, color:'#1D9E75', letterSpacing:'0.08em', margin:0 }}>FROM</p>
                        <InputField label="BUSINESS NAME" required value={seller.name||''} onChange={e=>{setSeller({...seller,name:e.target.value});clearErrors();}} placeholder={businessType==='solopreneur'?'Your Name / Studio':'Your Business Name'} error={sellerErrors?.name} />
                        <div>
                            <Label optional>ADDRESS</Label>
                            <textarea rows={2} value={seller.address||''} onChange={e=>setSeller({...seller,address:e.target.value})} style={{...underlineStyle,resize:'none'}} placeholder="Business Address" />
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                            <InputField label="EMAIL" optional value={seller.email||''} onChange={e=>setSeller({...seller,email:e.target.value})} placeholder="Email" />
                            <InputField label="PHONE" optional value={seller.phone||''} onChange={e=>setSeller({...seller,phone:e.target.value})} placeholder="Phone" />
                        </div>
                        {businessType==='solopreneur' && (
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'white', borderRadius:8, padding:'6px 10px', border:'1px solid #f3f4f6' }}>
                                <span style={{ fontSize:11, fontWeight:600, color:'#6b7280' }}>GST Registered?</span>
                                <Toggle value={isGstRegistered} onChange={v=>{setIsGstRegistered(v);setTaxRate(v?18:0);}} />
                            </div>
                        )}
                        {(businessType!=='solopreneur'||isGstRegistered) && (
                            <InputField label="GST ID" optional={businessType==='solopreneur'} required={businessType==='ca_firm'||businessType==='services_firm'} value={seller.taxId||''} onChange={e=>setSeller({...seller,taxId:e.target.value})} placeholder="GST123456" />
                        )}
                        {(businessType==='services_firm'||businessType==='ca_firm') && (
                            <InputField label="PAN" optional value={seller.panNumber||''} onChange={e=>setSeller({...seller,panNumber:e.target.value})} placeholder="ABCDE1234F" />
                        )}
                        {businessType==='ca_firm' && (
                            <InputField label="FRN (ICAI)" optional value={seller.frnNumber||''} onChange={e=>setSeller({...seller,frnNumber:e.target.value})} placeholder="123456W" />
                        )}
                        <InputField label="UPI ID" optional value={seller.upiId||''} onChange={e=>setSeller({...seller,upiId:e.target.value})} placeholder="yourname@upi" />
                        {businessType==='solopreneur' && (
                            <div>
                                <Label optional>BANK DETAILS</Label>
                                <textarea rows={2} value={seller.bankDetails||''} onChange={e=>setSeller({...seller,bankDetails:e.target.value})} style={{...underlineStyle,resize:'none'}} placeholder="A/C No, IFSC, Bank Name" />
                            </div>
                        )}
                    </div>

                    {/* TO */}
                    <div style={{ background:'#f9fafb', borderRadius:12, padding:14, border:'1px solid #f3f4f6', display:'flex', flexDirection:'column', gap:10, position:'relative' }}>
                        <p style={{ fontSize:10, fontWeight:700, color:'#1D9E75', letterSpacing:'0.08em', margin:0 }}>TO</p>
                        <div style={{ position:'relative' }}>
                            <InputField label="CLIENT NAME" required value={buyer.name||''} onChange={e=>{setBuyer({...buyer,name:e.target.value});clearErrors();}} onFocus={()=>setIsBuyerFocused(true)} onBlur={()=>setTimeout(()=>setIsBuyerFocused(false),200)} placeholder="Client Business Name" error={buyerErrors?.name} />
                            {isBuyerFocused && customers.length > 0 && (
                                <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'white', borderRadius:10, boxShadow:'0 10px 30px rgba(0,0,0,0.1)', border:'1px solid #f3f4f6', maxHeight:180, overflowY:'auto', zIndex:100, marginTop:4 }}>
                                    <div style={{ padding:'5px 10px', fontSize:9, fontWeight:700, color:'#9ca3af', letterSpacing:'0.08em', borderBottom:'1px solid #f3f4f6', background:'#f9fafb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                        <span>EXISTING CUSTOMERS</span>
                                        <button type="button" onClick={() => navigate('/dashboard/customers')} style={{ color:'#1D9E75', background:'transparent', border:'none', fontSize:9, fontWeight:700, cursor:'pointer' }}>+ ADD NEW</button>
                                    </div>
                                    {customers.filter(c=>!buyer.name||c.name.toLowerCase().includes(buyer.name.toLowerCase())).slice(0,8).map(customer=>(
                                        <button key={customer.id} onClick={()=>{
                                            const combinedAddr = [customer.addressLine1, customer.addressLine2, customer.city, customer.state, customer.pincode, customer.country].filter(Boolean).join(', ');
                                            setBuyer({name:customer.name,address:combinedAddr,email:customer.email||'',phone:customer.phone||'',taxId:customer.taxId||''});
                                            setIsBuyerFocused(false);
                                        }}
                                            style={{ width:'100%', textAlign:'left', padding:'8px 10px', border:'none', background:'transparent', cursor:'pointer', borderBottom:'1px solid #f9fafb' }}>
                                            <div style={{ fontSize:12, fontWeight:500 }}>{customer.name}</div>
                                            <div style={{ fontSize:10, color:'#9ca3af' }}>{customer.email||'No email'}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <Label optional>ADDRESS</Label>
                            <textarea rows={2} value={buyer.address||''} onChange={e=>setBuyer({...buyer,address:e.target.value})} style={{...underlineStyle,resize:'none'}} placeholder="Client Address" />
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                            <InputField label="EMAIL" optional value={buyer.email||''} onChange={e=>setBuyer({...buyer,email:e.target.value})} placeholder="Email" />
                            <InputField label="PHONE" optional value={buyer.phone||''} onChange={e=>setBuyer({...buyer,phone:e.target.value})} placeholder="Phone" />
                        </div>
                        <div>
                            <InputField label="CLIENT GSTIN" optional value={buyer.taxId||''} onChange={e=>{const raw=e.target.value.toUpperCase().replace(/\s/g,'');const updated={...buyer,taxId:raw};if(raw.length===15){const s=getStateFromGstin(raw);if(s)(updated as any).state=s;}setBuyer(updated);}} placeholder="27ABCDE1234F1Z5" />
                            {buyer.taxId && (
                                <span style={{ fontSize:10, color:buyer.taxId.length<15?'#9ca3af':validateGstin(buyer.taxId)?'#16a34a':'#d97706' }}>
                                    {buyer.taxId.length<15?`${buyer.taxId.length}/15`:validateGstin(buyer.taxId)?`Valid — ${getGstinStateDisplay(buyer.taxId)}`:'Invalid GSTIN format'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div>
                    <div style={{ display:'grid', gridTemplateColumns:GRID_COLS[businessType], gap:8, padding:'7px 10px', background:'#f9fafb', borderRadius:'8px 8px 0 0', border:'1px solid #f3f4f6' }}>
                        {['DESCRIPTION',...(businessType==='solopreneur'?[]:['UNIT']),'QTY','PRICE',...(businessType!=='solopreneur'?['DISC%']:[]),'AMOUNT',''].map((h,i)=>(
                            <span key={i} style={{ fontSize:9, fontWeight:700, color:'#9ca3af', textAlign:i===0?'left':'center', letterSpacing:'0.06em' }}>{h}</span>
                        ))}
                    </div>
                    {items.map((item,idx)=>{
                        const lineAmt=(item.quantity||0)*(item.price||0)*(1-(item.discount||0)/100);
                        return (
                            <div key={idx} style={{ display:'grid', gridTemplateColumns:GRID_COLS[businessType], gap:8, padding:'8px 10px', border:'1px solid #f3f4f6', borderTop:'none', alignItems:'center', background:'white' }}>
                                <div style={{ position:'relative' }}>
                                    <input value={item.description||''} placeholder={businessType==='solopreneur'?'Service description...':'Item name / search...'}
                                        onChange={e=>{const v=e.target.value;const sug=autoSuggestSac(v);if(sug&&!item.sac_code){updateItem(idx,{description:v,sac_code:sug.sacCode,tax_rate:sug.entry.gstRate,is_exempt:sug.entry.isExempt});}else{updateItem(idx,{description:v});}}}
                                        onFocus={()=>businessType==='ecommerce'&&setFocusedItemIndex(idx)} onBlur={()=>setTimeout(()=>setFocusedItemIndex(null),200)}
                                        style={{ width:'100%', border:'none', background:'transparent', fontSize:13, fontWeight:500, outline:'none' }} />
                                    {item.sac_code&&<span style={{ fontSize:9, color:'#9ca3af', fontFamily:'monospace', display:'block' }}>SAC {item.sac_code}</span>}
                                    {itemErrors?.[idx]&&<ErrMsg>{itemErrors[idx]}</ErrMsg>}
                                    {focusedItemIndex===idx&&(
                                        <div style={{ position:'absolute', top:'100%', left:0, zIndex:100, background:'white', borderRadius:10, boxShadow:'0 20px 40px rgba(0,0,0,0.12)', border:'1px solid #f3f4f6', minWidth:260, maxHeight:220, overflowY:'auto' }}>
                                            {products.filter(p=>!item.description||p.name.toLowerCase().includes(item.description.toLowerCase())).slice(0,12).map(product=>(
                                                <button key={product.id} onClick={()=>updateItem(idx,{description:product.name,price:product.price,unit:product.unit,productId:product.id,sku:product.sku,hsn_code:product.hsnCode||''})}
                                                    style={{ width:'100%', textAlign:'left', padding:'8px 12px', border:'none', background:'transparent', cursor:'pointer', borderBottom:'1px solid #f9fafb', display:'flex', justifyContent:'space-between' }}>
                                                    <div><div style={{ fontSize:12, fontWeight:600 }}>{product.name}</div>{product.sku&&<div style={{ fontSize:10, color:'#9ca3af', fontFamily:'monospace' }}>SKU: {product.sku}</div>}</div>
                                                    <div style={{ textAlign:'right' }}><div style={{ fontSize:12, fontWeight:700 }}>₹{product.price}</div><div style={{ fontSize:9, color:(product.stock||0)<5?'#f59e0b':'#9ca3af' }}>{product.stock} left</div></div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {businessType!=='solopreneur'&&<select value={item.unit||'Qty'} onChange={e=>updateItem(idx,{unit:e.target.value})} style={{ fontSize:11, border:'none', background:'transparent', textAlign:'center', outline:'none', cursor:'pointer' }}>{UNITS.map(u=><option key={u}>{u}</option>)}</select>}
                                <input type="number" value={item.quantity||1} onChange={e=>updateItem(idx,{quantity:Number(e.target.value)})} style={{ textAlign:'center', border:'1px solid #f3f4f6', borderRadius:6, padding:'3px', fontSize:12, fontWeight:700, background:'#f9fafb', outline:'none' }} />
                                <input type="number" value={item.price??''} onChange={e=>updateItem(idx,{price:e.target.value===''?undefined:Number(e.target.value)})} placeholder="0.00" style={{ textAlign:'center', border:'none', background:'transparent', fontSize:12, fontWeight:700, outline:'none' }} />
                                {businessType!=='solopreneur'&&<input type="number" value={item.discount??''} onChange={e=>updateItem(idx,{discount:e.target.value===''?undefined:Number(e.target.value)})} style={{ textAlign:'center', border:'1px solid #f3f4f6', borderRadius:6, padding:3, fontSize:12, background:'#f9fafb', outline:'none' }} />}
                                <span style={{ textAlign:'right', fontSize:12, fontWeight:700, color:'#1D9E75' }}>{currency.symbol}{lineAmt.toFixed(0)}</span>
                                <button onClick={()=>setItems(items.filter((_,i)=>i!==idx))} style={{ border:'none', background:'transparent', cursor:'pointer', color:'#d1d5db', fontSize:16, padding:2 }}>×</button>
                            </div>
                        );
                    })}
                    <button onClick={()=>setItems([...items,{description:'',quantity:1,unit:businessType==='solopreneur'?'Service':'Qty',price:undefined,discount:0,sac_code:'',tax_rate:18,is_exempt:false}])}
                        style={{ marginTop:8, fontSize:11, color:'#1D9E75', border:'1px solid #1D9E75', borderRadius:20, padding:'5px 14px', background:'transparent', cursor:'pointer', fontWeight:700 }}>
                        + Add line item
                    </button>
                </div>

                {/* Notes + extras */}
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    <div>
                        <Label optional>NOTES</Label>
                        <textarea rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Payment terms, bank details, thank you note..."
                            style={{ width:'100%', border:'1px solid #f3f4f6', borderRadius:10, padding:10, background:'#f9fafb', resize:'none', fontSize:13, outline:'none', boxSizing:'border-box' }} />
                    </div>
                    {businessType==='ecommerce' && (
                        <InputField label="COURIER & TRACKING" optional value={courierTracking} onChange={e=>setCourierTracking(e.target.value)} placeholder="Delhivery AWB: 1234567890" />
                    )}
                    {businessType==='services_firm' && (
                        <InputField label="AUTHORIZED SIGNATORY" optional value={authorizedSignatory} onChange={e=>setAuthorizedSignatory(e.target.value)} placeholder="Partner / Director name" />
                    )}
                </div>

            </div>{/* end LEFT */}

            {/* RIGHT — summary, scrollable if needed */}
            <div style={{ background:'#f9fafb', padding:'20px 18px', display:'flex', flexDirection:'column', gap:10, overflowY:'auto' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', letterSpacing:'0.08em', margin:0 }}>INVOICE SUMMARY</p>

                {resolvedGstType==='igst'&&<Pill color="blue">Inter-state — IGST applies</Pill>}
                {resolvedGstType==='not_applicable'&&<Pill color="amber">GST not applicable — below ₹20L</Pill>}
                {!!lutNumber&&<Pill color="green">LUT active — zero-rated export, GST = ₹0</Pill>}
                {reverseCharge&&<Pill color="purple">Reverse charge — buyer pays GST</Pill>}
                {items.some(i=>i.is_exempt)&&<Pill color="green">Contains NIL-rated items</Pill>}
                {tdsEnabled&&<Pill color="gray">TDS Sec 194J @ {tdsRate}% deducted by client</Pill>}

                <div style={{ background:'white', borderRadius:12, border:'1px solid #f3f4f6', padding:16, display:'flex', flexDirection:'column', gap:10 }}>
                    <TRow label="Subtotal" value={`${currency.symbol}${subtotal.toFixed(2)}`} />
                    {resolvedGstType==='cgst_sgst'&&<>
                        <TRow label={`CGST @ ${(taxRate/2).toFixed(1)}%`} value={`${currency.symbol}${(taxAmount/2).toFixed(2)}`} />
                        <TRow label={`SGST @ ${(taxRate/2).toFixed(1)}%`} value={`${currency.symbol}${(taxAmount/2).toFixed(2)}`} />
                    </>}
                    {resolvedGstType==='igst'&&<TRow label={`IGST @ ${taxRate}%`} value={`${currency.symbol}${taxAmount.toFixed(2)}`} />}
                    {resolvedGstType==='not_applicable'&&taxAmount>0&&<TRow label={taxLabel} value={`${currency.symbol}${taxAmount.toFixed(2)}`} />}

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13 }}>
                        <span style={{ color:'#9ca3af' }}>Discount</span>
                        <div style={{ position:'relative', width:86 }}>
                            <span style={{ position:'absolute', left:7, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'#9ca3af' }}>{currency.symbol}</span>
                            <input type="number" value={discountAmount??''} onChange={e=>setDiscountAmount(e.target.value===''?undefined:Number(e.target.value))}
                                style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px 4px 20px', fontSize:12, textAlign:'right', background:'#f9fafb', outline:'none', boxSizing:'border-box' }} />
                        </div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13 }}>
                        <span style={{ color:'#9ca3af' }}>Shipping</span>
                        <div style={{ position:'relative', width:86 }}>
                            <span style={{ position:'absolute', left:7, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'#9ca3af' }}>{currency.symbol}</span>
                            <input type="number" value={shipping??''} onChange={e=>setShipping(e.target.value===''?undefined:Number(e.target.value))}
                                style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 6px 4px 20px', fontSize:12, textAlign:'right', background:'#f9fafb', outline:'none', boxSizing:'border-box' }} />
                        </div>
                    </div>

                    <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                        <span style={{ fontSize:13, fontWeight:600, color:'#6b7280' }}>Grand Total</span>
                        <span style={{ fontSize:24, fontWeight:700, color:'#1D9E75' }}>
                            {currency.symbol}{Math.floor(total).toLocaleString()}<span style={{ fontSize:12 }}>.{total.toFixed(2).split('.')[1]}</span>
                        </span>
                    </div>
                </div>

                {currency.code==='INR'&&total>0&&(
                    <p style={{ fontSize:11, color:'#9ca3af', fontStyle:'italic', border:'1px dashed #e5e7eb', borderRadius:8, padding:'7px 10px', margin:0 }}>
                        {numberToIndianWords(total)}
                    </p>
                )}

                {tdsEnabled&&tdsAmount&&tdsAmount>0&&(
                    <div style={{ background:'#f0fdf4', border:'2px solid #bbf7d0', borderRadius:10, padding:12 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div>
                                <p style={{ fontSize:10, fontWeight:700, color:'#15803d', textTransform:'uppercase', margin:'0 0 2px' }}>You will receive</p>
                                <p style={{ fontSize:10, color:'#16a34a', margin:0 }}>After TDS {tdsRate}% deduction</p>
                            </div>
                            <p style={{ fontSize:22, fontWeight:800, color:'#15803d', margin:0 }}>₹{state.netReceivable?.toFixed(2)}</p>
                        </div>
                    </div>
                )}

                {/* Print button lives here now, email stays in top bar */}
                <div style={{ marginTop:'auto', paddingTop:10 }}>
                    <button onClick={actions.handlePrint} disabled={loading}
                        style={{ width:'100%', padding:9, background:'transparent', color:'#6b7280', border:'1px solid #e5e7eb', borderRadius:10, fontSize:12, cursor:'pointer', fontWeight:500, opacity:loading?0.6:1 }}>
                        {activeAction==='printing'?'...':'🖨 Print'}
                    </button>
                    <button onClick={actions.handleEmailClick} disabled={loading}
                        style={{ width:'100%', marginTop:6, padding:9, background:'transparent', color:'#6b7280', border:'1px solid #e5e7eb', borderRadius:10, fontSize:12, cursor:'pointer', fontWeight:500, opacity:loading?0.6:1 }}>
                        {activeAction==='emailing'?'...':'✉ Email to Client'}
                    </button>
                </div>
            </div>{/* end RIGHT */}

        </div>{/* end BODY grid */}
    </div>
);
}
