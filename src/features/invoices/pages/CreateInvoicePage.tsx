import React, { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { dataService } from '@/shared/services/dataService';
import { API_URL } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { Invoice } from '@/types';
import { invoiceService } from '@/shared/services/invoiceService';
import { usePersona } from '@/app/providers/PersonaContext';
import {
    ArrowLeft, Plus, Sparkles, Loader2, AlertCircle,
    Trash2, Eye, FileText, PenLine, RefreshCcw, CreditCard,
    X, Check, ChevronLeft, ChevronRight, Building2, User,
    Calendar, Hash, Percent, StickyNote, Shield,
    Landmark, Globe, Coins, Search, ChevronDown,
} from 'lucide-react';
import { useData } from '@/app/providers/DataContext';
import { InvoiceCalculator } from '@/shared/lib/financialMath';
import { InvoiceDocumentPreview } from '@/features/invoices/components/InvoiceDocumentPreview';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface InvoiceForm extends Invoice {
    customerName: string;
    customerEmail: string;
    customerAddress: string;
    customerGstin: string;
    fromName: string;
    fromTitle: string;
    fromAddress: string;
    fromGstin: string;
    isGstRegistered: boolean;
    tdsRate: number;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
    paymentQrUrl?: string;
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
    taxRate: number;
    projectReference: string;
    signatureName: string;
    isInterstate: boolean;
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

const PAYMENT_METHODS: { id: string; label: string; icon: any }[] = [];

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

function parseNonNegativeNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function formatInrAmount(value: unknown) {
    const amount = Number(value || 0);
    return amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function getLineAmount(item: any) {
    const quantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const discountPercent = Number(item.discount_percent ?? item.discountPercent ?? item.discount ?? 0);
    const gross = quantity * price;
    return Math.max(gross - (gross * discountPercent) / 100, 0);
}

function getDocumentTitle(isGstRegistered: boolean, explicitType?: string) {
    const normalized = String(explicitType || '').toLowerCase();
    if (normalized === 'bill_of_supply') return 'BILL OF SUPPLY';
    if (normalized === 'credit_note') return 'CREDIT NOTE';
    if (normalized === 'debit_note') return 'DEBIT NOTE';
    return isGstRegistered ? 'INVOICE' : 'BILL OF SUPPLY';
}

/* ─────────────────────────────────────────────────────────────
   SHARED UI PRIMITIVES
───────────────────────────────────────────────────────────── */
const INP = [
    "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-teal-500/10 outline-none transition-shadow duration-200",
].join(' ');
const SEL = `${INP} appearance-none cursor-pointer`;
const INP_ERR = ' !border-red-400 !ring-red-500/10';
const LBL = 'block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5';

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

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative bg-white rounded-2xl p-5 border border-gray-200 shadow-sm ${className}`}>
             <div className="absolute top-0 left-6 right-6 h-[1.5px] rounded-b-full bg-teal-600/20" />
            {children}
        </div>
    );
}

function SectionHead({ icon: Icon, label }: { icon: React.FC<any>; label: string }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm">
                <Icon size={12} className="text-white" />
            </div>
            <span className="text-xs font-bold text-gray-800 uppercase tracking-widest" style={{ fontFamily: 'Sora, sans-serif' }}>
                {label}
            </span>
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
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-white ${
                checked ? 'bg-emerald-600' : 'bg-gray-300'
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
        <div className="flex items-center justify-between px-3 xl:px-6 py-4 bg-gray-50/50 border-b border-gray-200 flex-shrink-0">
            {STEPS.map((s, i) => {
                const done   = i < current;
                const active = i === current;
                return (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col xl:flex-row items-center gap-1.5 xl:gap-2.5 min-w-0">
                            <div className={`w-6 h-6 xl:w-7 xl:h-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shadow-sm ${
                                done
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                    : active
                                        ? 'bg-white border border-teal-500 text-teal-600 ring-4 ring-teal-500/10'
                                        : 'bg-white border border-gray-200 text-gray-400'
                            }`}>
                                {done ? <Check size={12} /> : i + 1}
                            </div>
                            <span className={`text-[10px] xl:text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                active
                                    ? 'text-gray-900'
                                    : done
                                        ? 'text-emerald-600'
                                        : 'text-gray-400'
                            }`} style={{ fontFamily: 'Sora, sans-serif' }}>
                                {s.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 min-w-[4px] xl:min-w-[1.5rem] h-[1.5px] mx-1 xl:mx-4 rounded-full transition-colors ${
                                done ? 'bg-emerald-500/30' : 'bg-gray-200'
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
    const invoiceDate = watch('date') || '';

    const getCustomerAddress = (customer: any) =>
        [
            customer.addressLine1,
            customer.addressLine2,
            customer.city,
            customer.state,
            customer.pincode,
            customer.country,
        ]
            .filter(Boolean)
            .join(', ');

    const applyCustomerToForm = (customer: any) => {
        setValue('customerName', customer.name || '', { shouldValidate: true, shouldDirty: true });
        setValue('customerEmail', customer.email || '', { shouldValidate: true, shouldDirty: true });
        setValue('customerGstin', customer.gstin || customer.taxId || '', { shouldDirty: true });
        setValue('customerAddress', getCustomerAddress(customer), { shouldDirty: true });

        if (customer.paymentTerms && invoiceDate) {
            const dueDate = new Date(invoiceDate);
            dueDate.setDate(dueDate.getDate() + Number(customer.paymentTerms));
            if (!Number.isNaN(dueDate.getTime())) {
                setValue('dueDate', dueDate.toISOString().split('T')[0], { shouldDirty: true });
            }
        }
    };

    const handleSelect = (customer: any) => {
        applyCustomerToForm(customer);
        setIsFocused(false);
    };

    const openDrawer = () => {
        window.dispatchEvent(new CustomEvent('open-customer-modal', { detail: {} }));
    };

    const filtered = customers?.filter((c: any) => c.name.toLowerCase().includes(customerName.toLowerCase())) || [];
    const customerReg = register('customerName', { required: 'Required' });

    useEffect(() => {
        const normalized = customerName.trim().toLowerCase();
        if (!normalized) return;

        const exactMatch = customers?.find((customer: any) => customer.name?.trim().toLowerCase() === normalized);
        if (exactMatch) {
            applyCustomerToForm(exactMatch);
        }
    }, [customerName, customers, invoiceDate]);

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
                    <div className="col-span-2">
                        <Field label="Professional Title / Designation">
                            <input {...register('fromTitle')} placeholder="e.g. Full Stack Developer" className={INP} />
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
                        <div className="relative">
                            <select {...register('currencyCode')} className={SEL + ' pr-9'}>
                                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                            </select>
                            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </Field>
                    <Field label="Taxation Type">
                        <div className="relative">
                            <select {...register('taxLabel')} className={SEL + ' pr-9'}>
                                {TAX_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </Field>
                </div>
            </SectionCard>

            <SectionCard>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <User size={11} className="text-gray-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Billed to (client)</span>
                    </div>
                    <button type="button" onClick={openDrawer} className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition">
                        <Plus size={11} /> Add New Client
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-1 relative z-10">
                        <Field label="Client name" required error={errors.customerName?.message}>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
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
                                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </Field>

                        {isFocused && filtered.length > 0 && (
                            <div className="absolute left-0 right-0 top-[60px] mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-[100] max-h-48 overflow-y-auto">
                                {filtered.slice(0, 5).map((c: any) => (
                                    <button
                                        type="button"
                                        key={c.id}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSelect(c);
                                        }}
                                        className="w-full text-left px-4 py-2.5 border-b border-gray-100 last:border-0 hover:bg-teal-50 transition group"
                                    >
                                        <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">{c.name}</p>
                                        {c.email && <p className="text-[10px] text-gray-500">{c.email}</p>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <Field label="Invoice Number">
                        <div className="relative">
                            <input {...register('invoiceNumber')} placeholder="Auto-generated if left empty" className={INP + ' pr-8'} />
                            <Hash size={12} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
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
function StepItems({ register, control, watch, calcResult }: { register: any; control: any; watch: any; calcResult: any }) {
    const { fields, append, remove } = useFieldArray({ control, name: 'items' });
    const watchedItems = watch('items') || [];


    return (
        <div className="space-y-4">
            <div>
                <div className="flex items-center justify-between mb-3">
                    <SectionHead icon={FileText} label="Services / items" />
                    <button
                        type="button"
                        onClick={() => append({ description: '', quantity: 1, price: 0 })}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition shadow-sm"
                    >
                        <Plus size={11} /> Add row
                    </button>
                </div>

                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-gray-50/50 rounded-t-2xl border border-gray-200">
                    <div className="col-span-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.12em]">Description</div>
                    <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] text-center">Qty</div>
                    <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] text-right">Rate ₹</div>
                    <div className="col-span-1" />
                </div>

                {/* Table rows */}
                <div className="border border-gray-200 border-t-0 rounded-b-2xl overflow-hidden bg-white">
                    {fields.length === 0 ? (
                        <div className="py-8 text-center bg-gray-50">
                            <p className="text-xs text-gray-400 italic">No items yet — click "Add item" above</p>
                        </div>
                    ) : fields.map((field, i) => {
                        const amt = (watchedItems[i]?.quantity || 0) * (watchedItems[i]?.price || 0);
                        return (
                            <div key={field.id} className="border-b border-gray-100 last:border-0 hover:bg-teal-50/30 group bg-white transition-colors">
                                <div className="grid grid-cols-12 gap-2 px-6 py-4 items-center">
                                    <div className="col-span-6">
                                        <input
                                            {...register(`items.${i}.description` as const)}
                                            placeholder="Item description"
                                            className="w-full text-[13px] font-semibold text-gray-900 bg-transparent focus:outline-none placeholder-gray-300"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            {...register(`items.${i}.quantity` as const, { valueAsNumber: true })}
                                            className="w-full text-[13px] font-semibold text-gray-600 text-center bg-transparent focus:outline-none"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            {...register(`items.${i}.price` as const, { valueAsNumber: true })}
                                            className="w-full text-[13px] font-bold text-gray-900 text-right bg-transparent focus:outline-none"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => remove(i)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 rounded-xl transition-all hover:bg-red-50"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                {amt > 0 && (
                                    <div className="px-3 pb-1.5 text-right">
                                        <span className="text-[10px] text-gray-400 tabular-nums">= ₹{formatInrAmount(amt)}</span>
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
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Subtotal after adjustments</span>
                    <span className="text-sm font-black text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>
                        ₹{formatInrAmount(parseFloat(calcResult.subtotal))}
                    </span>
                </div>
            </SectionCard>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 3 — GST, Notes & Terms
───────────────────────────────────────────────────────────── */
function StepGst({ register, watch, setValue, calcResult }: { register: any; watch: any; setValue: any; calcResult: any }) {
    const isGst = watch('isGstRegistered');
    const taxRate = parseNonNegativeNumber(watch('taxRate'), 0);
    return (
        <div className="space-y-4">
            <SectionCard>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[13px] font-bold text-gray-900">GST registered</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Apply your organisation GST rate on all line items</p>
                    </div>
                    <Toggle
                        checked={!!isGst}
                        onChange={v => {
                            setValue('isGstRegistered', v, { shouldDirty: true });
                            if (!v) {
                                setValue('taxRate', 0, { shouldDirty: true });
                            }
                        }}
                    />
                </div>
                {isGst && (
                    <>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <Field label="GST Rate (%)">
                                <div className="relative">
                                    <input
                                        type="number"
                                        {...register('taxRate', { valueAsNumber: true, min: 0, max: 100 })}
                                        placeholder="18"
                                        className={INP + ' pr-8'}
                                    />
                                    <Percent size={12} className="absolute right-3 top-2.5 text-gray-400" />
                                </div>
                            </Field>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-[12px] font-bold text-gray-700">Inter-state Transaction?</p>
                                <p className="text-[10px] text-gray-400">Bills as IGST instead of CGST/SGST</p>
                            </div>
                            <Toggle
                                checked={!!watch('isInterstate')}
                                onChange={v => setValue('isInterstate', v, { shouldDirty: true })}
                            />
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                            <Shield size={12} className="text-teal-600" />
                            <span className="text-[11px] text-teal-600 font-bold uppercase tracking-wider">
                                {taxRate}% {watch('isInterstate') ? 'IGST' : 'CGST + SGST'} will be calculated
                            </span>
                        </div>
                    </>
                )}
            </SectionCard>

            <SectionCard>
                <SectionHead icon={Landmark} label="Direct Tax (TDS)" />
                <div className="grid grid-cols-2 gap-3 items-end">
                    <Field label="TDS Rate (%)">
                        <div className="relative">
                            <input
                                type="number"
                                {...register('tdsRate', { valueAsNumber: true, min: 0, max: 100 })}
                                placeholder="0"
                                className={INP + ' pr-8'}
                            />
                            <Percent size={12} className="absolute right-3 top-2.5 text-gray-400" />
                        </div>
                    </Field>
                    <div className="pb-2.5">
                       <p className="text-[10px] text-gray-400 font-medium">Estimated deduction: <span className="font-bold text-red-500 tabular-nums">₹{formatInrAmount(parseFloat(calcResult.tds_amount))}</span></p>
                    </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                    Solopreneurs under Section 44ADA often have 1% or 10% TDS deducted. This estimation will be reflected in your final payable amount.
                </p>
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
    register, watch, setValue, calcResult
}: {
    register: any; watch: any; setValue: any; calcResult: any;
}) {
    const subtotal = parseFloat(calcResult.subtotal);
    const taxAmount = parseFloat(calcResult.total_tax);
    const discountAmt = parseFloat(calcResult.total_discount);
    const total = parseFloat(calcResult.grand_total);
    const tdsAmount = parseFloat(calcResult.tds_amount);
    const netReceivable = parseFloat(calcResult.payable_amount);
    const watchedShipping = parseFloat(calcResult.shipping_charges);

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

            {/* Options */}
            <SectionCard>
                <SectionHead icon={Shield} label="Options" />

                <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2.5">
                        <PenLine size={14} className="text-gray-500" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Include signature</p>
                            <p className="text-xs text-gray-500">Add a digital signature block</p>
                        </div>
                    </div>
                    <Toggle
                        checked={!!isSig}
                        onChange={v => setValue('includeSignature', v, { shouldDirty: true })}
                    />
                </div>

                <div className="h-px bg-gray-100" />

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
                        <RefreshCcw size={14} className="text-gray-500" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Recurring invoice</p>
                            <p className="text-xs text-gray-500">Auto-send on a set schedule</p>
                        </div>
                    </div>
                    <Toggle
                        checked={!!isRecurring}
                        onChange={v => setValue('isRecurring', v, { shouldDirty: true })}
                    />
                </div>

                {isRecurring && (
                    <Field label="Frequency">
                        <div className="relative">
                            <select {...register('recurringFrequency')} className={SEL + ' pr-9'}>
                                {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                            </select>
                            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </Field>
                )}
            </SectionCard>

            {/* Bank Details */}
            <SectionCard>
                <SectionHead icon={Landmark} label="Bank & UPI Details" />
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <Field label="Bank Name">
                            <input {...register('bankName')} placeholder="e.g. HDFC Bank" className={INP} />
                        </Field>
                    </div>
                    <Field label="Account Number">
                        <input {...register('accountNumber')} placeholder="0000 1234 5678" className={INP} />
                    </Field>
                    <Field label="IFSC Code">
                        <input {...register('ifscCode')} placeholder="HDFC0001234" className={INP} />
                    </Field>
                    <div className="col-span-2">
                        <Field label="UPI ID (for easy payment)">
                            <div className="relative">
                                <input {...register('upiId')} placeholder="yourname@upi" className={INP + ' pr-8'} />
                                <Coins size={12} className="absolute right-3 top-2.5 text-gray-400" />
                            </div>
                        </Field>
                    </div>
                </div>
            </SectionCard>

            {/* Summary */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4">Summary</p>
                <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-[13px] font-medium text-gray-500">Subtotal</span>
                        <span className="font-bold text-gray-900 tabular-nums break-all text-right max-w-[11rem]">₹{formatInrAmount(subtotal)}</span>
                    </div>
                    
                    {/* GST Breakdown */}
                {w.isGstRegistered && (
                    <>
                        {w.isInterstate ? (
                            <div className="flex justify-between">
                                <span className="text-[13px] font-medium text-gray-500">IGST ({parseNonNegativeNumber(w.taxRate, 0)}%)</span>
                                <span className="font-bold text-gray-900 tabular-nums break-all text-right max-w-[11rem]">₹{formatInrAmount(taxAmount)}</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-[13px] font-medium text-gray-500">CGST ({(parseNonNegativeNumber(w.taxRate, 0) / 2).toFixed(2)}%)</span>
                                    <span className="font-bold text-gray-900 tabular-nums break-all text-right max-w-[11rem]">₹{formatInrAmount(taxAmount / 2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[13px] font-medium text-gray-500">SGST ({(parseNonNegativeNumber(w.taxRate, 0) / 2).toFixed(2)}%)</span>
                                    <span className="font-bold text-gray-900 tabular-nums break-all text-right max-w-[11rem]">₹{formatInrAmount(taxAmount / 2)}</span>
                                </div>
                            </>
                            )}
                        </>
                    )}

                    {discountAmt > 0 && (
                        <div className="flex justify-between">
                            <span className="text-[13px] font-bold text-red-500">Discount ({w.discount}%)</span>
                            <span className="font-bold text-red-500 tabular-nums break-all text-right max-w-[11rem]">−₹{formatInrAmount(discountAmt)}</span>
                        </div>
                    )}
                    {watchedShipping > 0 && (
                        <div className="flex justify-between">
                            <span className="text-[13px] font-medium text-gray-500">Shipping</span>
                            <span className="font-bold text-gray-900 tabular-nums break-all text-right max-w-[11rem]">₹{formatInrAmount(watchedShipping)}</span>
                        </div>
                    )}
                    {tdsAmount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-[13px] font-bold text-amber-600">TDS Deduction ({w.tdsRate}%)</span>
                            <span className="font-bold text-amber-600 tabular-nums break-all text-right max-w-[11rem]">−₹{formatInrAmount(tdsAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between pt-4 border-t-2 border-gray-900 mt-2">
                        <span className="font-black text-gray-900 text-base uppercase tracking-tight">Total Amount</span>
                        <span className="font-black text-teal-600 text-xl leading-tight tracking-tight tabular-nums break-all text-right max-w-[12rem]">₹{formatInrAmount(total)}</span>
                    </div>
                    {tdsAmount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-[13px] font-bold text-amber-600">You Receive</span>
                            <span className="font-bold text-amber-600 tabular-nums break-all text-right max-w-[11rem]">₹{formatInrAmount(netReceivable)}</span>
                        </div>
                    )}
                    <p className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">
                        {numberToWords(Math.floor(netReceivable))}
                    </p>
                </div>
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
        <div className="absolute inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-2xl flex flex-col z-20">
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2.5">
                    <Sparkles size={16} className="text-violet-400" />
                    <span className="text-base font-bold text-violet-600">AI Audit Report</span>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
                {analyzing ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Loader2 size={28} className="animate-spin text-violet-400" />
                        <p className="text-sm font-semibold text-gray-500">Auditing invoice…</p>
                    </div>
                ) : auditResult ? (
                    <>
                        <div className="mb-5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Risk Score</span>
                                <span className={`text-lg font-black ${auditResult.riskScore > 50 ? 'text-red-500' : 'text-teal-600'}`}>
                                    {auditResult.riskScore}
                                    <span className="text-sm font-bold text-gray-400">/100</span>
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${auditResult.riskScore > 50 ? 'bg-red-500' : 'bg-teal-500'}`}
                                    style={{ width: `${auditResult.riskScore}%` }}
                                />
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            {auditResult.suggestions.map((s, i) => (
                                <div key={i} className="flex gap-2.5 bg-violet-50/50 border border-violet-100 p-3.5 rounded-xl">
                                    <AlertCircle size={15} className="text-violet-500 mt-0.5 shrink-0" />
                                    <span className="text-[13px] font-medium text-violet-900 leading-snug">{s}</span>
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
    const { refreshData } = useData();
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
            invoiceNumber:      '',
            date:               new Date().toISOString().split('T')[0],
            dueDate:            new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status:             'draft',
            items:              [{ description: '', quantity: 1, price: 0 }],
            customerName:       '',
            customerEmail:      '',
            customerAddress:    '',
            customerGstin:      '',
            fromName:           '',
            fromTitle:          '',
            fromAddress:        '',
            fromGstin:          '',
            isGstRegistered:    false,
            tdsRate:            0,
            bankName:           '',
            accountNumber:      '',
            ifscCode:           '',
            upiId:              '',
            paymentQrUrl:       '',
            notes:              '',
            terms:              '',
            discount:           0,
            shipping:           0,
            currencyCode:       'INR',
            taxLabel:           'GST',
            taxRate:            0,
            projectReference:   '',
            signatureName:      '',
            recurringFrequency: 'Monthly',
            isInterstate:       false,
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
                ...invoice,
                invoiceNumber: invoice.invoiceNumber,
                date: (invoice.date || new Date().toISOString()).split('T')[0],
                dueDate: (invoice.dueDate || new Date().toISOString()).split('T')[0],
                status: invoice.status || 'draft',
                items: (invoice.items || []).map((item: any) => ({
                    description: item.description || '',
                    quantity: Number(item.quantity) || 1,
                    price: Number(item.price) || 0,
                    unit: item.unit || 'Qty',
                    productId: item.productId || undefined,
                    sku: item.sku || '',
                    sac_code: item.sac_code || '',
                    hsn_code: item.hsn_code || '',
                })),
                customerName: invoice.buyer?.name || '',
                customerEmail: invoice.buyer?.email || '',
                customerAddress: invoice.buyer?.address || '',
                customerGstin: invoice.buyer?.gstin || '',
                fromName: invoice.seller?.name || '',
                fromTitle: (invoice as any).seller?.title || '',
                fromAddress: invoice.seller?.address || '',
                fromGstin: invoice.seller?.gstin || '',
                signatureName: invoice.seller?.signatureName || '',
                isGstRegistered: invoice.isGstRegistered || false,
                notes: invoice.notes || '',
                terms: (invoice as any).seller?.terms || '',
                discount: invoice.discount || 0,
                shipping: invoice.shipping || 0,
                currencyCode: (invoice as any).currencyCode || 'INR',
                taxLabel: invoice.taxType || 'GST',
                taxRate: Number((invoice as any).taxRate ?? invoice.items?.[0]?.tax_rate ?? 0),
                projectReference: invoice.projectName || '',
                recurringFrequency: 'Monthly',
                payments: [],
                includeSignature: Boolean(invoice.seller?.includeSignature),
                isRecurring: Boolean(invoice.is_recurring),
                tdsRate: (invoice as any).tdsRate || 0,
                bankName: (invoice as any).seller?.bankName || '',
                accountNumber: (invoice as any).seller?.accountNumber || '',
                ifscCode: (invoice as any).seller?.ifscCode || '',
                upiId: (invoice as any).seller?.upiId || '',
                paymentQrUrl: (invoice as any).seller?.paymentQrUrl || '',
                isInterstate: (invoice as any).isInterstate || false,
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
                const [{ nextNumber, defaults }, settings] = await Promise.all([
                    invoiceService.getDraftDefaults(),
                    dataService.getSettings(),
                ]);
                if (cancelled) return;

                const dueDate = new Date(Date.now() + defaults.dueDays * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0];

                setValue('invoiceNumber', nextNumber);
                setValue('fromName', settings.owner_name || defaults.fromName);
                setValue('fromTitle', settings.freelanceCategory || '');
                setValue('fromAddress', settings.address || defaults.fromAddress);
                setValue('fromGstin', settings.companyTaxId || defaults.fromGstin);
                setValue('notes', settings.invoiceNotes || defaults.notes);
                setValue('terms', defaults.terms);
                setValue('currencyCode', defaults.currencyCode);
                setValue('taxLabel', defaults.taxLabel);
                setValue('taxRate', parseNonNegativeNumber(settings.defaultGstRate, defaults.isGstRegistered ? 18 : 0));
                setValue('dueDate', dueDate);
                setValue('isGstRegistered', defaults.isGstRegistered);
                setValue('bankName', settings.bankName || '');
                setValue('accountNumber', settings.bankAccountNumber || '');
                setValue('ifscCode', settings.bankIfsc || '');
                setValue('upiId', settings.upiId || '');
                setValue('paymentQrUrl', settings.paymentQrFilename ? dataService.getPaymentQrUrl(settings.paymentQrFilename) : '');
                setValue('signatureName', settings.owner_name || settings.businessName || defaults.fromName);
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
    const watchedTdsRate  = w.tdsRate || 0;
    const watchedTaxRate  = parseNonNegativeNumber(w.taxRate, 0);

    const calcResult = InvoiceCalculator.calculate({
        line_items: watchedItems.map((item: any) => ({
            quantity:      item.quantity || 0,
            unit_price:    item.price    || 0,
            tax_rate:      w.isGstRegistered ? watchedTaxRate : 0,
            is_interstate: w.isInterstate || false,
        })),
        document_discount: { type: 'percentage', value: watchedDiscount },
        shipping_charges: watchedShipping,
        tds_rate: watchedTdsRate,
    });

    const subtotal    = parseFloat(calcResult.subtotal);
    const taxAmount   = parseFloat(calcResult.total_tax);
    const total       = parseFloat(calcResult.grand_total);
    const tdsAmount   = parseFloat(calcResult.tds_amount);
    const netReceivable = parseFloat(calcResult.payable_amount);

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
        if (!data.customerName) { alert('Please enter a Client Name'); return; }
        setSaving(true);
        try {
            await dataService.saveInvoice({
                ...data,
                id: invoiceId || data.id,
                persona: businessType || data.persona || 'solopreneur',
                items: (data.items || []).map((item: any) => ({
                    ...item,
                    tax_rate: data.isGstRegistered ? parseNonNegativeNumber(data.taxRate, 0) : 0,
                })),
                buyer: {
                    name: data.customerName,
                    email: data.customerEmail || null,
                    address: data.customerAddress || null,
                    gstin: data.customerGstin || null,
                },
                seller: {
                    name: data.fromName || null,
                    title: data.fromTitle || null,
                    address: data.fromAddress || null,
                    gstin: data.fromGstin || null,
                    includeSignature: Boolean(data.includeSignature),
                    signatureName: data.signatureName || data.fromName || null,
                    terms: data.terms || null,
                    bankName: data.bankName || null,
                    accountNumber: data.accountNumber || null,
                    ifscCode: data.ifscCode || null,
                    upiId: data.upiId || null,
                },
                projectName: data.projectReference || null,
                subtotal,
                taxRate: data.isGstRegistered ? parseNonNegativeNumber(data.taxRate, 0) : 0,
                taxAmount,
                total,
                tdsApplicable: Number(data.tdsRate || 0) > 0,
                tdsEnabled: Number(data.tdsRate || 0) > 0,
                tdsRate: data.tdsRate || 0,
                tdsAmount,
                netReceivable,
            } as any);
            await refreshData(['invoices', 'stats'], true);
            navigate('/dashboard/invoices');
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
            className="h-full w-full overflow-hidden flex flex-col relative rounded-2xl border border-gray-200 shadow-2xl"
            style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                background: '#f8fafc',
            }}
        >
            {loadingDefaults && (
                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-3 text-gray-700 text-sm font-semibold">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Loading organisation invoice defaults…</span>
                    </div>
                </div>
            )}
            {/* ══ TOP BAR ══ */}
            <header className="shrink-0 flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 border border-gray-200 hover:bg-gray-50 transition"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[17px] font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>Create Invoice</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Financial Operations Control</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                    >
                        Discard
                    </button>

                    <button
                        type="button"
                        onClick={onDraft}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                    >
                        {savedDraft
                            ? <><Check size={11} className="text-emerald-600" /> Saved!</>
                            : 'Save draft'
                        }
                    </button>
                </div>
            </header>

            {/* ══ BODY ══ */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* ── LEFT: Wizard ── */}
                <div className="w-[60%] flex flex-col border-r border-gray-200 bg-white min-h-0">

                    <StepperHeader current={step} />

                    {/* Form content */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-0">
                        {step === 0 && (
                            <StepClient register={register} errors={errors} watch={watch} setValue={setValue} />
                        )}
                        {step === 1 && (
                            <StepItems register={register} control={control} watch={watch} calcResult={calcResult} />
                        )}
                        {step === 2 && (
                            <StepGst register={register} watch={watch} setValue={setValue} calcResult={calcResult} />
                        )}
                        {step === 3 && (
                            <StepPayment
                                register={register}
                                watch={watch}
                                setValue={setValue}
                                calcResult={calcResult}
                            />
                        )}
                    </div>

                    {/* Step nav — pinned bottom */}
                    <div className="shrink-0 flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50/50">
                        <button
                            type="button"
                            onClick={goPrev}
                            disabled={step === 0}
                            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={14} /> Previous
                        </button>
 
                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                            Step {step + 1} of {STEPS.length}
                        </span>
 
                        {isLastStep ? (
                            <button
                                type="button"
                                onClick={handleSubmit(onSave)}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 disabled:opacity-50 transition-all shadow-lg shadow-teal-500/20"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                Create invoice
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={goNext}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10"
                            >
                                Next Step <ChevronRight size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Live Preview ── */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ background: '#f1f5f9' }}>
                    <div className="shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Preview</span>
                        <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 transition shadow-sm">
                            <Eye size={12} /> Export PDF
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 p-5 overflow-hidden">
                        <div className="h-full rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <InvoiceDocumentPreview
                                invoice={w as InvoiceForm}
                                calcResult={calcResult}
                                discountLabel={w.discount ? `Discount (${w.discount}%)` : undefined}
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
