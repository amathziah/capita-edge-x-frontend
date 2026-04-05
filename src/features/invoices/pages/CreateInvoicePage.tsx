import React, { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { dataService } from '@/services/dataService';
import { API_URL } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { Invoice } from '@/types';
import { invoiceService } from '@/services/invoiceService';
import { usePersona } from '@/contexts/PersonaContext';
import {
    ArrowLeft, Plus, Sparkles, Loader2, AlertCircle,
    Trash2, Eye, FileText, PenLine, RefreshCcw, CreditCard,
    X, Check, ChevronLeft, ChevronRight, Building2, User,
    Calendar, Hash, Percent, StickyNote, Shield, Banknote,
    Landmark, Globe, Coins, Search, ChevronDown,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { InvoiceCalculator } from '@/lib/financialMath';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface InvoiceForm extends Invoice {
    customerName: string;
    customerEmail: string;
    customerAddress: string;
    customerGstin: string;
    fromName: string;
    fromAddress: string;
    fromGstin: string;
    isGstRegistered: boolean;
    notes: string;
    terms: string;
    discount: number;
    shipping: number;
    payments: string[];
    includeSignature: boolean;
    isRecurring: boolean;
    recurringFrequency: string;
    currencyCode: string;
    taxLabel: string;
    projectReference: string;
    signatureName: string;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const STEPS = [
    { id: 'client',  label: 'Client & Dates' },
    { id: 'items',   label: 'Items & Services' },
    { id: 'gst',     label: 'Context & Notes' },
    { id: 'payment', label: 'Payment & Review' },
];

const CURRENCIES = [
    { code: 'INR', symbol: '₹' },
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
];

const TAX_LABELS = ['GST', 'VAT', 'None'];

const PAYMENT_METHODS = [
    { id: 'upi',      label: 'UPI',           icon: Coins },
    { id: 'bank',     label: 'Bank transfer',  icon: Landmark },
    { id: 'paypal',   label: 'PayPal',         icon: Banknote },
    { id: 'razorpay', label: 'Razorpay',       icon: CreditCard },
    { id: 'stripe',   label: 'Stripe',         icon: Globe },
    { id: 'cash',     label: 'Cash',           icon: Coins },
];

const FREQUENCIES = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
function fmtDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

function numberToWords(num: number): string {
    num = Math.floor(num);
    if (num === 0) return 'Indian Rupee Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
        'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
        'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const cvt = (n: number): string => {
        if (n < 20)       return ones[n];
        if (n < 100)      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000)     return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + cvt(n % 100) : '');
        if (n < 100000)   return cvt(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + cvt(n % 1000) : '');
        if (n < 10000000) return cvt(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + cvt(n % 100000) : '');
        return cvt(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + cvt(n % 10000000) : '');
    };
    return 'Indian Rupee ' + cvt(num);
}

/* ─────────────────────────────────────────────────────────────
   SHARED UI PRIMITIVES
───────────────────────────────────────────────────────────── */
const INP = [
    'w-full px-3 py-2 rounded-lg border bg-[#212225] text-[#F0F1F3]',
    'border-[#3A3C42] text-sm font-medium placeholder-[#6B6E76]',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
    'transition-colors',
].join(' ');
const INP_ERR = ' !border-red-500 !ring-1 !ring-red-500';
const LBL = 'block text-[10px] font-bold text-[#6B6E76] uppercase tracking-wider mb-1.5';

function Field({
    label, required, error, children,
}: {
    label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
    return (
        <div>
            <label className={LBL}>
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
        </div>
    );
}

function SectionCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-[#26282C] border border-[#3A3C42] rounded-xl p-4 space-y-3">
            {children}
        </div>
    );
}

function SectionHead({ icon: Icon, label }: { icon: React.FC<any>; label: string }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <Icon size={11} className="text-[#6B6E76]" />
            <span className="text-[10px] font-bold text-[#6B6E76] uppercase tracking-widest">{label}</span>
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-[#26282C] ${
                checked ? 'bg-emerald-600' : 'bg-[#3A3C42]'
            }`}
        >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                checked ? 'translate-x-4' : 'translate-x-0'
            }`} />
        </button>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEPPER HEADER
───────────────────────────────────────────────────────────── */
function StepperHeader({ current }: { current: number }) {
    return (
        <div className="flex items-center justify-between px-3 xl:px-6 py-3 bg-[#26282C] border-b border-[#3A3C42] flex-shrink-0">
            {STEPS.map((s, i) => {
                const done   = i < current;
                const active = i === current;
                return (
                    <React.Fragment key={s.id}>
                        <div className="flex items-center gap-1.5 xl:gap-2 min-w-0">
                            <div className={`w-5 h-5 xl:w-6 xl:h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                done
                                    ? 'bg-emerald-600 text-white'
                                    : active
                                        ? 'bg-[#F0F1F3] text-[#1A1B1E]'
                                        : 'bg-[#3A3C42] text-[#6B6E76]'
                            }`}>
                                {done ? <Check size={11} /> : i + 1}
                            </div>
                            <span className={`text-[9px] xl:text-xs font-semibold leading-tight break-words text-center ${
                                active
                                    ? 'text-[#F0F1F3]'
                                    : done
                                        ? 'text-emerald-400'
                                        : 'text-[#6B6E76]'
                            }`}>
                                {s.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 min-w-[4px] xl:min-w-[1rem] h-px mx-1 xl:mx-3 transition-colors ${
                                done ? 'bg-emerald-700' : 'bg-[#3A3C42]'
                            }`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 1 — Client & Dates
───────────────────────────────────────────────────────────── */
function StepClient({ register, errors, watch, setValue }: { register: any; errors: any; watch: any; setValue: any }) {
    const { customers } = useData();
    const [isFocused, setIsFocused] = useState(false);
    const customerName = watch('customerName') || '';

    const handleSelect = (customer: any) => {
        setValue('customerName', customer.name, { shouldValidate: true });
        setValue('customerEmail', customer.email || '', { shouldValidate: true });
        setValue('customerGstin', customer.taxId || '');
        const addr = [customer.addressLine1, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ');
        setValue('customerAddress', addr);
        setIsFocused(false);
    };

    const openDrawer = () => {
        window.dispatchEvent(new CustomEvent('open-customer-modal', { detail: {} }));
    };

    const filtered = customers?.filter((c: any) => c.name.toLowerCase().includes(customerName.toLowerCase())) || [];
    const customerReg = register('customerName', { required: 'Required' });

    return (
        <div className="space-y-4">
            <SectionCard>
                <SectionHead icon={Building2} label="Billing from" />
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <Field label="Your name / business" required error={errors.fromName?.message}>
                            <input
                                {...register('fromName', { required: 'Required' })}
                                placeholder="Your Name or Business"
                                className={INP + (errors.fromName ? INP_ERR : '')}
                            />
                        </Field>
                    </div>
                    <Field label="GSTIN (if any)">
                        <input {...register('fromGstin')} placeholder="27ABCDE1234F1Z5" className={INP} />
                    </Field>
                    <div className="col-span-2">
                        <Field label="Address">
                            <input {...register('fromAddress')} placeholder="City, State, PIN..." className={INP} />
                        </Field>
                    </div>
                </div>
            </SectionCard>

            <SectionCard>
                <SectionHead icon={Globe} label="Global Settings" />
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Currency">
                        <select {...register('currencyCode')} className={INP}>
                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                        </select>
                    </Field>
                    <Field label="Taxation Type">
                        <select {...register('taxLabel')} className={INP}>
                            {TAX_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </Field>
                </div>
            </SectionCard>

            <SectionCard>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <User size={11} className="text-[#6B6E76]" />
                        <span className="text-[10px] font-bold text-[#6B6E76] uppercase tracking-widest">Billed to (client)</span>
                    </div>
                    <button type="button" onClick={openDrawer} className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition">
                        <Plus size={11} /> Add New Client
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-1 relative z-10">
                        <Field label="Client name" required error={errors.customerName?.message}>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6E76] group-focus-within:text-emerald-500 transition-colors">
                                    <Search size={14} />
                                </div>
                                <input
                                    name={customerReg.name}
                                    ref={customerReg.ref}
                                    onChange={customerReg.onChange}
                                    onBlur={(e) => {
                                        customerReg.onBlur(e);
                                        setTimeout(() => setIsFocused(false), 200);
                                    }}
                                    onFocus={() => setIsFocused(true)}
                                    placeholder="Search or type name"
                                    autoComplete="off"
                                    className={`${INP} pl-9 ${errors.customerName ? INP_ERR : ''}`}
                                />
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6E76]" />
                            </div>
                        </Field>

                        {isFocused && filtered.length > 0 && (
                            <div className="absolute left-0 right-0 top-[60px] mt-1 bg-[#26282C] border border-[#3A3C42] rounded-lg shadow-xl overflow-hidden z-[100] max-h-48 overflow-y-auto">
                                {filtered.slice(0, 5).map((c: any) => (
                                    <button 
                                        type="button" 
                                        key={c.id} 
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSelect(c);
                                        }} 
                                        className="w-full text-left px-4 py-2 border-b border-[#3A3C42] last:border-0 hover:bg-[#2E3035] transition group"
                                    >
                                        <p className="text-sm font-semibold text-[#F0F1F3] group-hover:text-emerald-400 transition-colors">{c.name}</p>
                                        {c.email && <p className="text-[10px] text-[#6B6E76]">{c.email}</p>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <Field label="Invoice ID">
                        <div className="relative">
                            <input {...register('invoiceNumber')} className={INP + ' pr-8'} />
                            <Hash size={12} className="absolute right-3 top-2.5 text-[#6B6E76] pointer-events-none" />
                        </div>
                    </Field>
                    <Field label="Client email">
                        <input {...register('customerEmail')} type="email" placeholder="client@example.com" className={INP} />
                    </Field>
                    <Field label="Client GSTIN">
                        <input {...register('customerGstin')} placeholder="27ABCDE1234F1Z5" className={INP} />
                    </Field>
                    <div className="col-span-2">
                        <Field label="Project Reference (Optional)">
                            <input {...register('projectReference')} placeholder="Project Alpha Release" className={INP} />
                        </Field>
                    </div>
                    <div className="col-span-2">
                        <Field label="Client address">
                            <input {...register('customerAddress')} placeholder="Client city, state..." className={INP} />
                        </Field>
                    </div>
                </div>
            </SectionCard>

            <SectionCard>
                <SectionHead icon={Calendar} label="Dates" />
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Invoice date">
                        <input type="date" {...register('date')} className={INP} />
                    </Field>
                    <Field label="Due date">
                        <input type="date" {...register('dueDate')} className={INP} />
                    </Field>
                </div>
            </SectionCard>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 2 — Line Items
───────────────────────────────────────────────────────────── */
function StepItems({ register, control, watch }: { register: any; control: any; watch: any }) {
    const { fields, append, remove } = useFieldArray({ control, name: 'items' });
    const w               = watch();
    const watchedItems    = w.items || [];
    const watchedDiscount = w.discount || 0;
    const watchedShipping = w.shipping || 0;

    const calcResult = InvoiceCalculator.calculate({
        line_items: watchedItems.map((item: any) => ({
            quantity:      item.quantity || 0,
            unit_price:    item.price    || 0,
            tax_rate:      w.isGstRegistered ? 18 : 0,
            is_interstate: false,
        })),
        shipping_charges: 0,
    });

    const subtotal    = parseFloat(calcResult.subtotal);
    const discountAmt = (subtotal * watchedDiscount) / 100;

    return (
        <div className="space-y-4">
            <div>
                <div className="flex items-center justify-between mb-3">
                    <SectionHead icon={FileText} label="Services / items" />
                    <button
                        type="button"
                        onClick={() => append({ description: '', quantity: 1, price: 0 })}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-[#0F2419] border border-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-900/30 transition shadow-sm"
                    >
                        <Plus size={11} /> Add row
                    </button>
                </div>

                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-[#2E3035] rounded-t-lg border border-b-0 border-[#3A3C42]">
                    <div className="col-span-6 text-[10px] font-bold text-[#6B6E76] uppercase tracking-wider">Description</div>
                    <div className="col-span-2 text-[10px] font-bold text-[#6B6E76] uppercase tracking-wider text-center">Qty</div>
                    <div className="col-span-3 text-[10px] font-bold text-[#6B6E76] uppercase tracking-wider text-right">Rate ₹</div>
                    <div className="col-span-1" />
                </div>

                {/* Table rows */}
                <div className="border border-[#3A3C42] rounded-b-lg overflow-hidden">
                    {fields.length === 0 ? (
                        <div className="py-8 text-center bg-[#212225]">
                            <p className="text-xs text-[#6B6E76] italic">No items yet — click "Add item" above</p>
                        </div>
                    ) : fields.map((field, i) => {
                        const amt = (watchedItems[i]?.quantity || 0) * (watchedItems[i]?.price || 0);
                        return (
                            <div key={field.id} className="border-b border-[#3A3C42] last:border-0 hover:bg-[#26282C] group bg-[#212225]">
                                <div className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center">
                                    <div className="col-span-6">
                                        <input
                                            {...register(`items.${i}.description` as const)}
                                            placeholder="Item description"
                                            className="w-full text-sm font-medium text-[#F0F1F3] bg-transparent focus:outline-none placeholder-[#6B6E76]"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            {...register(`items.${i}.quantity` as const, { valueAsNumber: true })}
                                            className="w-full text-sm font-medium text-[#A8AAAF] text-center bg-transparent focus:outline-none"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            {...register(`items.${i}.price` as const, { valueAsNumber: true })}
                                            className="w-full text-sm font-medium text-[#A8AAAF] text-right bg-transparent focus:outline-none"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => remove(i)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-[#6B6E76] hover:text-red-400 rounded transition"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                                {amt > 0 && (
                                    <div className="px-3 pb-1.5 text-right">
                                        <span className="text-[10px] text-[#6B6E76]">= ₹{amt.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <SectionCard>
                <SectionHead icon={Percent} label="Adjustments" />
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Discount %">
                        <input
                            type="number"
                            {...register('discount', { valueAsNumber: true, min: 0, max: 100 })}
                            placeholder="0"
                            className={INP}
                        />
                    </Field>
                    <Field label="Shipping ₹">
                        <input
                            type="number"
                            {...register('shipping', { valueAsNumber: true, min: 0 })}
                            placeholder="0"
                            className={INP}
                        />
                    </Field>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#3A3C42]">
                    <span className="text-xs text-[#6B6E76]">Subtotal after discount</span>
                    <span className="text-sm font-semibold text-[#F0F1F3]">
                        ₹{(subtotal - discountAmt + watchedShipping).toFixed(2)}
                    </span>
                </div>
            </SectionCard>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 3 — GST, Notes & Terms
───────────────────────────────────────────────────────────── */
function StepGst({ register, watch, setValue }: { register: any; watch: any; setValue: any }) {
    const isGst = watch('isGstRegistered');
    return (
        <div className="space-y-4">
            <SectionCard>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-[#F0F1F3]">GST registered</p>
                        <p className="text-xs text-[#6B6E76] mt-0.5">Apply 18% GST on all line items</p>
                    </div>
                    <Toggle
                        checked={!!isGst}
                        onChange={v => setValue('isGstRegistered', v, { shouldDirty: true })}
                    />
                </div>
                {isGst && (
                    <div className="mt-3 pt-3 border-t border-[#3A3C42] flex items-center gap-2">
                        <Shield size={12} className="text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-semibold">
                            18% GST will be calculated on all items
                        </span>
                    </div>
                )}
            </SectionCard>

            <SectionCard>
                <SectionHead icon={StickyNote} label="Notes & terms" />
                <Field label="Notes (shown on invoice)">
                    <textarea
                        {...register('notes')}
                        rows={3}
                        placeholder="Payment terms, thank-you message…"
                        className={INP + ' resize-none'}
                        style={{ fontSize: 13 }}
                    />
                </Field>
                <Field label="Terms & conditions">
                    <textarea
                        {...register('terms')}
                        rows={3}
                        placeholder="e.g. Payment due within 15 days of invoice date."
                        className={INP + ' resize-none'}
                        style={{ fontSize: 13 }}
                    />
                </Field>
            </SectionCard>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 4 — Payment, Signature & Recurring
───────────────────────────────────────────────────────────── */
function StepPayment({
    register, watch, setValue,
    subtotal, taxAmount, discountAmt, total, watchedShipping,
}: {
    register: any; watch: any; setValue: any;
    subtotal: number; taxAmount: number; discountAmt: number;
    total: number; watchedShipping: number;
}) {
    const payments    = watch('payments') || [];
    const isRecurring = watch('isRecurring');
    const isSig       = watch('includeSignature');
    const w           = watch();

    const togglePayment = (id: string) => {
        const next = payments.includes(id)
            ? payments.filter((p: string) => p !== id)
            : [...payments, id];
        setValue('payments', next, { shouldDirty: true });
    };

    return (
        <div className="space-y-4">
            {/* Payment methods */}
            <SectionCard>
                <SectionHead icon={CreditCard} label="Payment methods" />
                <div className="flex flex-wrap gap-2">
                    {PAYMENT_METHODS.map(({ id, label }) => {
                        const selected = payments.includes(id);
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => togglePayment(id)}
                                className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                                    selected
                                        ? 'bg-emerald-900/30 border-emerald-600 text-emerald-400'
                                        : 'bg-[#2E3035] border-[#454850] text-[#A8AAAF] hover:border-[#6B6E76]'
                                }`}
                            >
                                {selected && <Check size={10} className="inline mr-1" />}
                                {label}
                            </button>
                        );
                    })}
                </div>
            </SectionCard>

            {/* Options */}
            <SectionCard>
                <SectionHead icon={Shield} label="Options" />

                <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2.5">
                        <PenLine size={14} className="text-[#6B6E76]" />
                        <div>
                            <p className="text-sm font-semibold text-[#F0F1F3]">Include signature</p>
                            <p className="text-xs text-[#6B6E76]">Add a digital signature block</p>
                        </div>
                    </div>
                    <Toggle
                        checked={!!isSig}
                        onChange={v => setValue('includeSignature', v, { shouldDirty: true })}
                    />
                </div>

                <div className="h-px bg-[#3A3C42]" />

                {isSig && (
                    <Field label="Signature name">
                        <input
                            {...register('signatureName')}
                            placeholder="e.g. Malika Rao"
                            className={INP}
                        />
                    </Field>
                )}

                <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2.5">
                        <RefreshCcw size={14} className="text-[#6B6E76]" />
                        <div>
                            <p className="text-sm font-semibold text-[#F0F1F3]">Recurring invoice</p>
                            <p className="text-xs text-[#6B6E76]">Auto-send on a set schedule</p>
                        </div>
                    </div>
                    <Toggle
                        checked={!!isRecurring}
                        onChange={v => setValue('isRecurring', v, { shouldDirty: true })}
                    />
                </div>

                {isRecurring && (
                    <Field label="Frequency">
                        <select {...register('recurringFrequency')} className={INP}>
                            {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                        </select>
                    </Field>
                )}
            </SectionCard>

            {/* Summary */}
            <div className="bg-[#212225] border border-[#3A3C42] rounded-xl p-4">
                <p className="text-[10px] font-bold text-[#6B6E76] uppercase tracking-widest mb-3">Summary</p>
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-[#A8AAAF]">Subtotal</span>
                        <span className="font-semibold text-[#F0F1F3]">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#A8AAAF]">GST ({w.isGstRegistered ? '18%' : '0%'})</span>
                        <span className="font-semibold text-[#F0F1F3]">₹{taxAmount.toFixed(2)}</span>
                    </div>
                    {discountAmt > 0 && (
                        <div className="flex justify-between">
                            <span className="text-red-400">Discount ({w.discount}%)</span>
                            <span className="font-semibold text-red-400">−₹{discountAmt.toFixed(2)}</span>
                        </div>
                    )}
                    {watchedShipping > 0 && (
                        <div className="flex justify-between">
                            <span className="text-[#A8AAAF]">Shipping</span>
                            <span className="font-semibold text-[#F0F1F3]">₹{watchedShipping.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between pt-2.5 border-t-2 border-[#F0F1F3] mt-1">
                        <span className="font-bold text-[#F0F1F3] text-base">Total</span>
                        <span className="font-black text-emerald-400 text-xl">₹{total.toFixed(2)}</span>
                    </div>
                    <p className="text-right text-[11px] text-[#6B6E76] italic leading-tight">
                        {numberToWords(total)}
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   LIVE PREVIEW — right panel (white invoice doc on dark bg)
───────────────────────────────────────────────────────────── */
function InvoicePreview({
    w, subtotal, taxAmount, discountAmt, total, watchedShipping,
}: {
    w: InvoiceForm;
    subtotal: number; taxAmount: number; discountAmt: number;
    total: number; watchedShipping: number;
}) {
    const watchedItems    = (w.items || []) as any[];
    const watchedDiscount = w.discount || 0;
    const hasItems        = watchedItems.some(i => i.description);

    return (
        <div className="h-full bg-white flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        {w.fromName
                            ? <p className="text-base font-bold text-gray-900">{w.fromName}</p>
                            : <p className="text-sm text-gray-300 italic">Your name</p>
                        }
                        {w.fromAddress && <p className="text-xs text-gray-500 mt-0.5">{w.fromAddress}</p>}
                        {w.fromGstin   && <p className="text-xs text-gray-500 mt-0.5">GSTIN: {w.fromGstin}</p>}
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black tracking-tighter text-gray-900 leading-none">PROFORMA</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{w.invoiceNumber}</p>
                    </div>
                </div>

                {/* Billed from / to */}
                <div className="grid grid-cols-2 gap-6 mb-5">
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Billed From</p>
                        {w.fromName
                            ? <p className="text-sm font-semibold text-gray-800">{w.fromName}</p>
                            : <p className="text-xs text-gray-300 italic">—</p>
                        }
                        {w.fromAddress && <p className="text-xs text-gray-500 mt-0.5">{w.fromAddress}</p>}
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</p>
                        {w.customerName ? (
                            <>
                                <p className="text-sm font-semibold text-gray-800">{w.customerName}</p>
                                {w.customerEmail   && <p className="text-xs text-gray-500 mt-0.5">{w.customerEmail}</p>}
                                {w.customerAddress && <p className="text-xs text-gray-500 mt-0.5">{w.customerAddress}</p>}
                                {w.customerGstin   && <p className="text-xs text-gray-500 mt-0.5">GSTIN: {w.customerGstin}</p>}
                            </>
                        ) : (
                            <p className="text-xs text-gray-300 italic">Select a client…</p>
                        )}
                    </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-6 mb-5 pb-4 border-b border-gray-100">
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Invoice Date</p>
                        <p className="text-sm font-bold text-gray-800">{fmtDate(w.date)}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
                        <p className="text-sm font-bold text-gray-800">{fmtDate(w.dueDate)}</p>
                    </div>
                </div>

                {/* Items table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
                    <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <div className="col-span-6 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Description</div>
                        <div className="col-span-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center">Qty</div>
                        <div className="col-span-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-right">Rate</div>
                        <div className="col-span-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</div>
                    </div>
                    {!hasItems ? (
                        <div className="py-6 text-center">
                            <p className="text-xs text-gray-300 italic">No items added yet</p>
                        </div>
                    ) : watchedItems.map((item: any, i: number) => item.description ? (
                        <div key={i} className="grid grid-cols-12 px-4 py-2.5 border-b border-gray-100 last:border-0">
                            <div className="col-span-6 text-xs font-medium text-gray-800">{item.description}</div>
                            <div className="col-span-2 text-xs text-gray-500 text-center">{item.quantity}</div>
                            <div className="col-span-2 text-xs text-gray-500 text-right">₹{(item.price || 0).toFixed(2)}</div>
                            <div className="col-span-2 text-xs font-semibold text-gray-800 text-right">
                                ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                            </div>
                        </div>
                    ) : null)}
                </div>

                {/* Totals */}
                <div className="ml-auto w-52 space-y-1.5 mb-1">
                    <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Subtotal</span>
                        <span className="text-xs font-medium text-gray-700">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-xs text-gray-400">GST ({w.isGstRegistered ? '18%' : '0%'})</span>
                        <span className="text-xs font-medium text-gray-700">₹{taxAmount.toFixed(2)}</span>
                    </div>
                    {discountAmt > 0 && (
                        <div className="flex justify-between">
                            <span className="text-xs text-red-400">Discount ({watchedDiscount}%)</span>
                            <span className="text-xs font-medium text-red-400">−₹{discountAmt.toFixed(2)}</span>
                        </div>
                    )}
                    {watchedShipping > 0 && (
                        <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Shipping</span>
                            <span className="text-xs font-medium text-gray-700">₹{watchedShipping.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="border-t-2 border-gray-900 pt-2 flex justify-between items-baseline">
                        <span className="text-sm font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-black text-emerald-600">₹{total.toFixed(2)}</span>
                    </div>
                    <p className="text-right text-[10px] text-gray-400 italic leading-tight">
                        {numberToWords(Math.floor(total))}
                    </p>
                </div>

                {/* Notes */}
                {w.notes && (
                    <div className="mt-5 pt-4 border-t border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Notes</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{w.notes}</p>
                    </div>
                )}

                {/* Terms */}
                {w.terms && (
                    <div className="mt-3">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Terms & Conditions</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{w.terms}</p>
                    </div>
                )}

                {/* Signature */}
                {w.includeSignature && (
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                        <div className="w-40 text-center">
                            <p className="text-lg text-gray-700 italic" style={{ fontFamily: '"Times New Roman", serif' }}>
                                {w.signatureName || w.fromName || 'Signature'}
                            </p>
                            <div className="border-t border-gray-400 pt-1 mt-2">
                                <p className="text-[9px] text-gray-400 font-medium">Authorised Signature</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   AI AUDIT PANEL
───────────────────────────────────────────────────────────── */
function AuditPanel({
    analyzing, auditResult, onClose,
}: {
    analyzing: boolean;
    auditResult: { riskScore: number; suggestions: string[] } | null;
    onClose: () => void;
}) {
    return (
        <div className="absolute inset-y-0 right-0 w-80 bg-[#1A1B1E] border-l border-[#3A3C42] shadow-2xl flex flex-col z-20">
            <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-[#3A3C42]">
                <div className="flex items-center gap-2.5">
                    <Sparkles size={16} className="text-violet-400" />
                    <span className="text-base font-bold text-violet-300">AI Audit Report</span>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#26282C] transition">
                    <X size={16} className="text-[#6B6E76]" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
                {analyzing ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Loader2 size={28} className="animate-spin text-violet-400" />
                        <p className="text-sm font-semibold text-[#A8AAAF]">Auditing invoice…</p>
                    </div>
                ) : auditResult ? (
                    <>
                        <div className="mb-5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-[#F0F1F3]">Risk Score</span>
                                <span className={`text-lg font-black ${auditResult.riskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {auditResult.riskScore}
                                    <span className="text-sm font-semibold text-[#6B6E76]">/100</span>
                                </span>
                            </div>
                            <div className="w-full h-2 bg-[#26282C] rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${auditResult.riskScore > 50 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${auditResult.riskScore}%` }}
                                />
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            {auditResult.suggestions.map((s, i) => (
                                <div key={i} className="flex gap-2.5 bg-[#1E1A2E] border border-[#4A3A8A] p-3 rounded-lg">
                                    <AlertCircle size={15} className="text-violet-400 mt-0.5 shrink-0" />
                                    <span className="text-sm font-medium text-[#A8AAAF] leading-snug">{s}</span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export function CreateInvoice() {
    const navigate = useNavigate();
    const { id: invoiceId } = useParams();
    const { businessType } = usePersona();
    const [step, setStep]               = useState(0);
    const [saving, setSaving]           = useState(false);
    const [savedDraft, setSavedDraft]   = useState(false);
    const [analyzing, setAnalyzing]     = useState(false);
    const [auditResult, setAuditResult] = useState<{ riskScore: number; suggestions: string[] } | null>(null);
    const [showAudit, setShowAudit]     = useState(false);
    const [loadingDefaults, setLoadingDefaults] = useState(true);

    const {
        register, control, handleSubmit, watch, setValue, trigger, reset,
        formState: { errors },
    } = useForm<InvoiceForm>({
        defaultValues: {
            invoiceNumber:      `INV-2627-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            date:               new Date().toISOString().split('T')[0],
            dueDate:            new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status:             'draft',
            items:              [{ description: '', quantity: 1, price: 0 }],
            customerName:       '',
            customerEmail:      '',
            customerAddress:    '',
            customerGstin:      '',
            fromName:           '',
            fromAddress:        '',
            fromGstin:          '',
            isGstRegistered:    false,
            notes:              '',
            terms:              '',
            currencyCode:       'INR',
            taxLabel:           'GST',
            projectReference:   '',
            signatureName:      '',
            recurringFrequency: 'Monthly',
        },
    });

    const w = watch();

    useEffect(() => {
        let cancelled = false;

        const loadInvoice = async () => {
            if (!invoiceId) {
                return false;
            }

            const invoice = await dataService.getInvoice(invoiceId);
            if (cancelled || !invoice) {
                return true;
            }

            reset({
                invoiceNumber: invoice.invoiceNumber,
                date: (invoice.date || new Date().toISOString()).split('T')[0],
                dueDate: (invoice.dueDate || new Date().toISOString()).split('T')[0],
                status: invoice.status || 'draft',
                items: (invoice.items || []).map((item: any) => ({
                    description: item.description || '',
                    quantity: Number(item.quantity) || 1,
                    price: Number(item.price) || 0,
                    unit: item.unit || 'Qty',
                    productId: item.productId || item.product_id || undefined,
                    sku: item.sku || '',
                    sac_code: item.sac_code || '',
                    hsn_code: item.hsn_code || '',
                })),
                customerName: invoice.buyer?.name || invoice.customers?.name || '',
                customerEmail: invoice.buyer?.email || invoice.customers?.email || '',
                customerAddress: invoice.buyer?.address || invoice.customers?.address || '',
                customerGstin: invoice.buyer?.gstin || invoice.customers?.gstin || '',
                fromName: invoice.seller?.name || '',
                fromAddress: invoice.seller?.address || '',
                fromGstin: invoice.seller?.gstin || '',
                signatureName: invoice.seller?.signatureName || '',
                isGstRegistered: invoice.isGstRegistered ?? invoice.is_gst_registered ?? false,
                notes: invoice.notes || '',
                terms: '',
                discount: invoice.discount || 0,
                shipping: invoice.shipping || 0,
                currencyCode: (invoice as any).currencyCode || 'INR',
                taxLabel: invoice.taxType || 'GST',
                projectReference: invoice.projectName || invoice.project_name || '',
                recurringFrequency: 'Monthly',
                payments: [],
                includeSignature: Boolean(invoice.seller?.includeSignature),
                isRecurring: Boolean(invoice.is_recurring),
            } as InvoiceForm);

            return true;
        };

        const loadDefaults = async () => {
            const handledEdit = await loadInvoice();
            if (handledEdit) {
                setLoadingDefaults(false);
                return;
            }

            try {
                const { nextNumber, defaults } = await invoiceService.getDraftDefaults();
                if (cancelled) return;

                const dueDate = new Date(Date.now() + defaults.dueDays * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0];

                setValue('invoiceNumber', nextNumber);
                setValue('fromName', defaults.fromName);
                setValue('fromAddress', defaults.fromAddress);
                setValue('fromGstin', defaults.fromGstin);
                setValue('notes', defaults.notes);
                setValue('terms', defaults.terms);
                setValue('currencyCode', defaults.currencyCode);
                setValue('taxLabel', defaults.taxLabel);
                setValue('dueDate', dueDate);
                setValue('isGstRegistered', defaults.isGstRegistered);
            } catch (error) {
                console.error('Failed to load invoice defaults:', error);
            } finally {
                if (!cancelled) {
                    setLoadingDefaults(false);
                }
            }
        };

        loadDefaults();

        return () => {
            cancelled = true;
        };
    }, [invoiceId, reset, setValue]);

    /* ── Derived totals ── */
    const watchedItems    = (w.items || []) as any[];
    const watchedDiscount = w.discount || 0;
    const watchedShipping = w.shipping || 0;

    const calcResult = InvoiceCalculator.calculate({
        line_items: watchedItems.map((item: any) => ({
            quantity:      item.quantity || 0,
            unit_price:    item.price    || 0,
            tax_rate:      w.isGstRegistered ? 18 : 0,
            is_interstate: false,
        })),
        shipping_charges: 0,
    });

    const subtotal    = parseFloat(calcResult.subtotal);
    const taxAmount   = parseFloat(calcResult.total_tax);
    const discountAmt = (subtotal * watchedDiscount) / 100;
    const total       = parseFloat(calcResult.grand_total) - discountAmt + watchedShipping;

    /* ── Step navigation ── */
    const goNext = useCallback(async () => {
        const valid = await trigger(
            step === 0 ? (['fromName', 'customerName'] as const) : undefined
        );
        if (valid) setStep(s => Math.min(s + 1, STEPS.length - 1));
    }, [step, trigger]);

    const goPrev     = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);
    const isLastStep = step === STEPS.length - 1;

    /* ── Save ── */
    const onSave = async (data: InvoiceForm) => {
        setSaving(true);
        try {
            if (!data.customerName) { alert('Please enter a Client Name'); return; }
            await dataService.saveInvoice({
                ...data,
                id: invoiceId || data.id,
                persona: businessType || data.persona || 'solopreneur',
                buyer: {
                    name: data.customerName,
                    email: data.customerEmail || null,
                    address: data.customerAddress || null,
                    gstin: data.customerGstin || null,
                },
                seller: {
                    name: data.fromName || null,
                    address: data.fromAddress || null,
                    gstin: data.fromGstin || null,
                    includeSignature: Boolean(data.includeSignature),
                    signatureName: data.signatureName || data.fromName || null,
                },
                projectName: data.projectReference || null,
                subtotal,
                taxAmount,
                total,
            });
            navigate('/invoices');
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Failed to save invoice.';
            alert(message);
        } finally {
            setSaving(false);
        }
    };

    const onDraft = () => {
        setSavedDraft(true);
        setTimeout(() => setSavedDraft(false), 2000);
    };

    /* ── AI Audit ── */
    const onAudit = async () => {
        setAnalyzing(true);
        setAuditResult(null);
        setShowAudit(true);
        try {
            const token = localStorage.getItem('sb-access-token');
            const res = await fetch(`${API_URL}${ENDPOINTS.AI_AUDIT_INVOICE}`, {
                method:  'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(w),
            });
            if (!res.ok) throw new Error(await res.text());
            setAuditResult(await res.json());
        } catch (err: any) {
            setAuditResult({ riskScore: 0, suggestions: [`Error: ${err.message}`] });
        } finally {
            setAnalyzing(false);
        }
    };

    /* ─────────────────────────────────────────────────────────────
       RENDER
    ───────────────────────────────────────────────────────────── */
    return (
        <div
            className="h-full w-full overflow-hidden flex flex-col relative rounded-2xl border border-[#3A3C42] shadow-2xl"
            style={{
                fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
                background: '#1A1B1E',
            }}
        >
            {loadingDefaults && (
                <div className="absolute inset-0 z-20 bg-[#1A1B1E]/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-3 text-[#F0F1F3] text-sm font-semibold">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Loading organisation invoice defaults…</span>
                    </div>
                </div>
            )}
            {/* ══ TOP BAR ══ */}
            <header className="shrink-0 flex items-center justify-between px-5 py-2.5 bg-[#212225] border-b border-[#3A3C42] z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 rounded-md text-[#6B6E76] hover:bg-[#26282C] hover:text-[#F0F1F3] transition"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#F0F1F3] tracking-tight">Create Invoice</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <p className="text-[10px] font-bold text-[#6B6E76] uppercase tracking-[0.1em]">Financial Operations Control</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#A8AAAF] border border-[#3A3C42] rounded-lg hover:bg-[#26282C] transition"
                    >
                        Discard
                    </button>

                    <button
                        type="button"
                        onClick={onDraft}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#A8AAAF] border border-[#3A3C42] rounded-lg hover:bg-[#26282C] transition"
                    >
                        {savedDraft
                            ? <><Check size={11} className="text-emerald-400" /> Saved!</>
                            : 'Save draft'
                        }
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit(onSave)}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-white bg-emerald-700/80 backdrop-blur-sm border border-emerald-500/50 rounded-lg hover:bg-emerald-600 disabled:opacity-60 shadow-lg shadow-emerald-900/20 transition"
                    >
                        {saving && <Loader2 size={12} className="animate-spin" />}
                        Generate Proforma
                    </button>
                </div>
            </header>

            {/* ══ BODY ══ */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* ── LEFT: Wizard ── */}
                <div className="w-[60%] flex flex-col border-r border-[#3A3C42] bg-[#212225] min-h-0">

                    <StepperHeader current={step} />

                    {/* Form content */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-0">
                        {step === 0 && (
                            <StepClient register={register} errors={errors} watch={watch} setValue={setValue} />
                        )}
                        {step === 1 && (
                            <StepItems register={register} control={control} watch={watch} />
                        )}
                        {step === 2 && (
                            <StepGst register={register} watch={watch} setValue={setValue} />
                        )}
                        {step === 3 && (
                            <StepPayment
                                register={register}
                                watch={watch}
                                setValue={setValue}
                                subtotal={subtotal}
                                taxAmount={taxAmount}
                                discountAmt={discountAmt}
                                total={total}
                                watchedShipping={watchedShipping}
                            />
                        )}
                    </div>

                    {/* Step nav — pinned bottom */}
                    <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-t border-[#3A3C42] bg-[#212225]">
                        <button
                            type="button"
                            onClick={goPrev}
                            disabled={step === 0}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#A8AAAF] border border-[#3A3C42] rounded-lg hover:bg-[#26282C] disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft size={13} /> Previous
                        </button>

                        <span className="text-[11px] text-[#6B6E76] font-medium">
                            Step {step + 1} of {STEPS.length}
                        </span>

                        {isLastStep ? (
                            <button
                                type="button"
                                onClick={handleSubmit(onSave)}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-600 disabled:opacity-60 transition"
                            >
                                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Create invoice
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={goNext}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#1A1B1E] bg-[#F0F1F3] rounded-lg hover:bg-white transition"
                            >
                                Next <ChevronRight size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Live Preview ── */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ background: '#ECEEF1' }}>
                    <div className="shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Preview</span>
                        <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 transition shadow-sm">
                            <Eye size={12} /> Export PDF
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 p-5 overflow-hidden">
                        <div className="h-full rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <InvoicePreview
                                w={w as InvoiceForm}
                                subtotal={subtotal}
                                taxAmount={taxAmount}
                                discountAmt={discountAmt}
                                total={total}
                                watchedShipping={watchedShipping}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ AI AUDIT OVERLAY ══ */}
            {showAudit && (
                <AuditPanel
                    analyzing={analyzing}
                    auditResult={auditResult}
                    onClose={() => setShowAudit(false)}
                />
            )}
        </div>
    );
}
