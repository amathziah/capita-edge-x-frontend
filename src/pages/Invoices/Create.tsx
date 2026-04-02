import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { API_URL } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { Invoice } from '../../types';
import {
    ArrowLeft, Plus, Sparkles, Loader2, AlertCircle,
    Trash2, Eye, FileText, PenLine, RefreshCcw, CreditCard, X
} from 'lucide-react';
import { InvoiceCalculator } from '../../lib/financialMath';

/* ─────────────────────────────────────────────────────────────
   TYPOGRAPHY SYSTEM
   ─────────────────────────────────────────────────────────────
   Label:      12px  font-semibold  text-gray-500   (was 10px gray-400)
   Input:      14px  font-medium    text-gray-900   (was 13px gray-800)
   Body:       13px  font-normal    text-gray-700   (was 11-12px gray-500)
   Heading:    15px  font-bold      text-gray-900
   Caption:    12px  font-normal    text-gray-500   (was 10px gray-300)
   Placeholder: 14px               text-gray-400   (was gray-300)
   ───────────────────────────────────────────────────────────── */

export function CreateInvoice() {
    const navigate = useNavigate();
    const [analyzing, setAnalyzing] = useState(false);
    const [auditResult, setAuditResult] = useState<{ riskScore: number; suggestions: string[] } | null>(null);
    const [showAudit, setShowAudit] = useState(false);

    interface InvoiceForm extends Invoice {
        customerName: string;
        customerEmail: string;
        customerAddress: string;
        customerGstin: string;
        fromName: string;
        fromAddress: string;
        isGstRegistered: boolean;
        notes: string;
        discount: number;
        shipping: number;
        includeSignature: boolean;
        isRecurring: boolean;
    }

    const { register, control, handleSubmit, watch, formState: { errors } } = useForm<InvoiceForm>({
        defaultValues: {
            invoiceNumber: `INV-2526-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'draft',
            items: [{ description: '', quantity: 1, price: 0 }],
            customerName: '', customerEmail: '', customerAddress: '', customerGstin: '',
            fromName: '', fromAddress: '', isGstRegistered: false,
            notes: '', discount: 0, shipping: 0,
            includeSignature: false, isRecurring: false,
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'items' });

    const w = watch();
    const watchedItems    = w.items || [];
    const watchedDiscount = w.discount || 0;
    const watchedShipping = w.shipping || 0;

    const calcResult = InvoiceCalculator.calculate({
        line_items: watchedItems.map(item => ({
            quantity: item.quantity || 0,
            unit_price: item.price || 0,
            tax_rate: w.isGstRegistered ? 18 : 0,
            is_interstate: false,
        })),
        shipping_charges: 0,
    });

    const subtotal    = parseFloat(calcResult.subtotal);
    const taxAmount   = parseFloat(calcResult.total_tax);
    const discountAmt = (subtotal * watchedDiscount) / 100;
    const total       = parseFloat(calcResult.grand_total) - discountAmt + watchedShipping;

    const fmtDate = (d: string) =>
        d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const numberToWords = (num: number): string => {
        if (num === 0) return 'Indian Rupee Zero';
        const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
            'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
        const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
        const cvt = (n: number): string => {
            if (n < 20) return ones[n];
            if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
            if (n < 1000) return ones[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+cvt(n%100) : '');
            if (n < 100000) return cvt(Math.floor(n/1000))+' Thousand'+(n%1000 ? ' '+cvt(n%1000) : '');
            if (n < 10000000) return cvt(Math.floor(n/100000))+' Lakh'+(n%100000 ? ' '+cvt(n%100000) : '');
            return cvt(Math.floor(n/10000000))+' Crore'+(n%10000000 ? ' '+cvt(n%10000000) : '');
        };
        return 'Indian Rupee ' + cvt(Math.floor(num));
    };

    const onSave = async (data: InvoiceForm) => {
        try {
            if (!data.customerName) { alert('Please enter a Client Name'); return; }
            const customerRes = await dataService.saveCustomer({
                name: data.customerName,
                email: data.customerEmail || `client-${Date.now()}@example.com`,
                id: '', phone: '', addressLine1: '', tags: [],
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
            } as any);
            const customerId = customerRes.id;
            if (!customerId) throw new Error('Failed to create customer');
            await dataService.saveInvoice({
                ...data, customerId,
                buyer: { name: data.customerName, email: data.customerEmail },
                subtotal, taxAmount, total,
            });
            navigate('/invoices');
        } catch (err) {
            console.error(err);
            alert('Failed to save invoice. Check console.');
        }
    };

    const onAudit = async () => {
        setAnalyzing(true);
        setAuditResult(null);
        setShowAudit(true);
        try {
            const token = localStorage.getItem('sb-access-token');
            const res = await fetch(`${API_URL}${ENDPOINTS.AI_AUDIT_INVOICE}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

    /* ── STYLE TOKENS (stronger, more readable) ─────────────── */
    // Input: 14px, medium weight, near-black text, visible placeholder
    const inp = [
        'w-full px-3 py-2 rounded-md border border-gray-300 bg-white',
        'text-sm font-medium text-gray-900 placeholder-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
        'transition-colors',
    ].join(' ');

    // Label: 12px semibold, medium gray — clearly readable
    const lbl = 'block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide';

    return (
        <div
            className="h-screen overflow-hidden flex flex-col"
            style={{
                fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
                background: '#F8F9FA',
            }}
        >

            {/* ══ TOP BAR ══════════════════════════════════════════════ */}
            <header className="h-13 shrink-0 flex items-center justify-between px-5 py-2.5 bg-white border-b border-gray-200 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition"
                    >
                        <ArrowLeft size={17} />
                    </button>
                    <span className="text-base font-bold text-gray-900 tracking-tight">Create New Invoice</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button" onClick={onAudit} disabled={analyzing}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-300 rounded-lg hover:bg-violet-100 disabled:opacity-50 transition"
                    >
                        {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        AI Audit
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-3.5 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSubmit(() => {})}
                        className="px-3.5 py-2 text-sm font-semibold text-gray-700 border border-gray-400 rounded-lg hover:bg-gray-100 transition"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={handleSubmit(onSave)}
                        className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow transition"
                    >
                        Create Invoice
                    </button>
                </div>
            </header>

            {/* ══ BODY ════════════════════════════════════════════════ */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* ────────────────────────────────────────
                    LEFT — Form Panel
                    ──────────────────────────────────────── */}
                <div className="w-[50%] flex flex-col border-r border-gray-200 bg-white min-h-0">

                    {/* A: Meta fields */}
                    <div className="shrink-0 px-6 pt-5 pb-4 border-b border-gray-150 space-y-3.5 overflow-y-auto max-h-[50vh]" style={{ borderColor: '#E8EAED' }}>

                        {/* Billing From */}
                        <div className="mb-5 space-y-3 pb-5 border-b border-gray-150" style={{ borderColor: '#E8EAED' }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Billing From</span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input type="checkbox" {...register('isGstRegistered')} className="w-3.5 h-3.5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border transition-colors ${w.isGstRegistered ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>GST Registered</span>
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={lbl}>Legal Entity Name <span className="text-red-500">*</span></label>
                                    <input {...register('fromName', { required: true })} placeholder="Your Name or Business" className={inp + (errors.fromName ? ' border-red-400 ring-1 ring-red-400' : '')} />
                                </div>
                                <div className="col-span-2">
                                    <label className={lbl}>Address & Registration</label>
                                    <input {...register('fromAddress')} placeholder="City, State, PIN..." className={inp} />
                                </div>
                            </div>
                        </div>

                        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2 pt-1">Billed To (Client)</span>

                        {/* Client + Invoice ID */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={lbl}>
                                    Client <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('customerName', { required: true })}
                                    placeholder="Client business name"
                                    className={inp + (errors.customerName ? ' border-red-400 ring-1 ring-red-400' : '')}
                                />
                                {errors.customerName && (
                                    <p className="text-xs font-medium text-red-500 mt-1">Required field</p>
                                )}
                            </div>
                            <div>
                                <label className={lbl}>Invoice ID</label>
                                <div className="relative">
                                    <input {...register('invoiceNumber')} className={inp + ' pr-8'} />
                                    <PenLine size={13} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Email + GSTIN */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={lbl}>Client Email</label>
                                <input {...register('customerEmail')} placeholder="client@example.com" className={inp} />
                            </div>
                            <div>
                                <label className={lbl}>Client GSTIN</label>
                                <input {...register('customerGstin')} placeholder="27ABCDE1234F1Z5" className={inp} />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={lbl}>Invoice Date</label>
                                <input type="date" {...register('date')} className={inp} />
                            </div>
                            <div>
                                <label className={lbl}>Due Date</label>
                                <input type="date" {...register('dueDate')} className={inp} />
                            </div>
                        </div>
                    </div>

                    {/* B: Items list — scrolls internally */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-800">Services / Items</span>
                            <button
                                type="button"
                                onClick={() => append({ description: '', quantity: 1, price: 0 })}
                                className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                            >
                                <Plus size={13} /> Add Item
                            </button>
                        </div>

                        {/* Table header */}
                        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 rounded-t-lg border border-b-0 border-gray-200">
                            <div className="col-span-6 text-xs font-bold text-gray-600 uppercase tracking-wider">Description</div>
                            <div className="col-span-2 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Qty</div>
                            <div className="col-span-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right">Rate ₹</div>
                            <div className="col-span-1" />
                        </div>

                        {/* Table rows */}
                        <div className="border border-gray-200 rounded-b-lg overflow-hidden">
                            {fields.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-sm font-medium text-gray-400">No items yet — click "Add Item" to start</p>
                                </div>
                            ) : fields.map((field, i) => (
                                <div key={field.id} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 group items-center">
                                    <div className="col-span-6">
                                        <input
                                            {...register(`items.${i}.description` as const)}
                                            placeholder="Item description"
                                            className="w-full text-sm font-medium text-gray-900 bg-transparent focus:outline-none placeholder-gray-400"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            {...register(`items.${i}.quantity` as const, { valueAsNumber: true })}
                                            className="w-full text-sm font-medium text-gray-800 text-center bg-transparent focus:outline-none"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            {...register(`items.${i}.price` as const, { valueAsNumber: true })}
                                            className="w-full text-sm font-medium text-gray-800 text-right bg-transparent focus:outline-none"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <button
                                            type="button" onClick={() => remove(i)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded transition"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* C: Footer — pinned */}
                    <div className="shrink-0 border-t border-gray-200 px-6 py-4 bg-white space-y-3.5">

                        {/* Discount + Shipping */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={lbl}>Discount %</label>
                                <input type="number" {...register('discount', { valueAsNumber: true })} placeholder="0" className={inp} />
                            </div>
                            <div>
                                <label className={lbl}>Shipping ₹</label>
                                <input type="number" {...register('shipping', { valueAsNumber: true })} placeholder="0" className={inp} />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className={lbl}>Notes</label>
                            <input
                                {...register('notes')}
                                placeholder="Payment terms, thank-you message…"
                                className={inp}
                            />
                        </div>

                        {/* Toggle row */}
                        <div className="flex items-center gap-2.5">
                            {/* Signature */}
                            <label className="flex items-center justify-between gap-2 cursor-pointer flex-1 px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition select-none">
                                <div className="flex items-center gap-2">
                                    <PenLine size={14} className="text-gray-500" />
                                    <span className="text-sm font-semibold text-gray-700">Signature</span>
                                </div>
                                <input type="checkbox" {...register('includeSignature')} className="sr-only peer" />
                                <div className="w-8 h-4 bg-gray-300 rounded-full relative transition-colors peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
                            </label>

                            {/* Recurring */}
                            <label className="flex items-center justify-between gap-2 cursor-pointer flex-1 px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition select-none">
                                <div className="flex items-center gap-2">
                                    <RefreshCcw size={14} className="text-gray-500" />
                                    <span className="text-sm font-semibold text-gray-700">Recurring</span>
                                </div>
                                <input type="checkbox" {...register('isRecurring')} className="sr-only peer" />
                                <div className="w-8 h-4 bg-gray-300 rounded-full relative transition-colors peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
                            </label>

                            {/* Payment method */}
                            <button type="button" className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition whitespace-nowrap">
                                <CreditCard size={14} className="text-gray-500" />
                                Payment
                            </button>
                        </div>
                    </div>
                </div>

                {/* ────────────────────────────────────────
                    RIGHT — Live Preview Panel
                    ──────────────────────────────────────── */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ background: '#ECEEF1' }}>

                    {/* Preview toolbar */}
                    <div className="shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-gray-200 bg-white/70 backdrop-blur-sm">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Preview</span>
                        <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 transition shadow-sm">
                            <Eye size={13} /> Preview PDF
                        </button>
                    </div>

                    {/* Invoice card */}
                    <div className="flex-1 min-h-0 p-5 overflow-hidden">
                        <div className="h-full bg-white rounded-xl shadow border border-gray-200 flex flex-col overflow-hidden">

                            {/* Scrollable invoice body */}
                            <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">

                                {/* INVOICE title row */}
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        {w.fromName
                                            ? <p className="text-base font-bold text-gray-900">{w.fromName}</p>
                                            : <p className="text-sm font-medium text-gray-400 italic">Your Business Name</p>
                                        }
                                        {w.fromAddress && <p className="text-sm text-gray-500 mt-0.5">{w.fromAddress}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black tracking-tight text-gray-900">INVOICE</p>
                                        <p className="text-sm font-semibold text-gray-500 mt-0.5">{w.invoiceNumber}</p>
                                    </div>
                                </div>

                                {/* Billed From / To */}
                                <div className="grid grid-cols-2 gap-6 mb-5">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Billed From</p>
                                        {w.fromName
                                            ? <p className="text-sm font-semibold text-gray-800">{w.fromName}</p>
                                            : <p className="text-sm font-medium text-gray-400 italic">—</p>
                                        }
                                        {w.fromAddress && <p className="text-sm text-gray-600 mt-0.5">{w.fromAddress}</p>}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</p>
                                        {w.customerName ? (
                                            <>
                                                <p className="text-sm font-semibold text-gray-800">{w.customerName}</p>
                                                {w.customerEmail && <p className="text-sm text-gray-600 mt-0.5">{w.customerEmail}</p>}
                                                {w.customerGstin && <p className="text-sm text-gray-500 mt-0.5">GSTIN: {w.customerGstin}</p>}
                                            </>
                                        ) : (
                                            <p className="text-sm font-medium text-gray-400 italic">Select a client…</p>
                                        )}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="flex gap-8 mb-5 pb-4 border-b border-gray-100">
                                    <div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice Date </span>
                                        <span className="text-sm font-semibold text-gray-800">{fmtDate(w.date)}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Due Date </span>
                                        <span className="text-sm font-semibold text-gray-800">{fmtDate(w.dueDate)}</span>
                                    </div>
                                </div>

                                {/* Items table */}
                                <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
                                    <div className="grid grid-cols-12 bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                                        <div className="col-span-7 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</div>
                                        <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Qty</div>
                                        <div className="col-span-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Amount</div>
                                    </div>
                                    {watchedItems.filter(it => it.description).length === 0 ? (
                                        <div className="py-6 text-center">
                                            <p className="text-sm font-medium text-gray-400">No items added yet</p>
                                        </div>
                                    ) : watchedItems.map((item, i) => item.description ? (
                                        <div key={i} className="grid grid-cols-12 px-4 py-2.5 border-b border-gray-100 last:border-0">
                                            <div className="col-span-7 text-sm font-medium text-gray-800">{item.description}</div>
                                            <div className="col-span-2 text-sm font-medium text-gray-600 text-center">{item.quantity}</div>
                                            <div className="col-span-3 text-sm font-semibold text-gray-800 text-right">
                                                ₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                                            </div>
                                        </div>
                                    ) : null)}
                                </div>

                                {/* Totals block */}
                                <div className="ml-auto w-52">
                                    <div className="space-y-1.5 mb-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-500">Subtotal</span>
                                            <span className="text-sm font-semibold text-gray-700">₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-500">GST ({w.isGstRegistered ? '18%' : '0%'})</span>
                                            <span className="text-sm font-semibold text-gray-700">₹{taxAmount.toFixed(2)}</span>
                                        </div>
                                        {watchedDiscount > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-red-500">Discount ({watchedDiscount}%)</span>
                                                <span className="text-sm font-semibold text-red-500">−₹{discountAmt.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {watchedShipping > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500">Shipping</span>
                                                <span className="text-sm font-semibold text-gray-700">₹{watchedShipping.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t-2 border-gray-900 pt-2.5 flex justify-between items-baseline">
                                        <span className="text-sm font-bold text-gray-900">Total</span>
                                        <span className="text-xl font-black text-emerald-600">₹{total.toFixed(2)}</span>
                                    </div>
                                    <p className="text-right text-xs font-medium text-gray-400 mt-1 leading-tight italic">
                                        {numberToWords(Math.floor(total))}
                                    </p>
                                </div>

                                {/* Notes */}
                                {w.notes && (
                                    <div className="mt-5 pt-4 border-t border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Notes</p>
                                        <p className="text-sm font-medium text-gray-600">{w.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Invoice footer */}
                            <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-8 py-3 flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-400">Thank you for your business.</p>
                                <FileText size={14} className="text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ AI AUDIT OVERLAY ════════════════════════════════════ */}
            {showAudit && (
                <div className="absolute inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-2xl flex flex-col z-20">
                    <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
                        <div className="flex items-center gap-2.5">
                            <Sparkles size={16} className="text-violet-600" />
                            <span className="text-base font-bold text-violet-900">AI Audit Report</span>
                        </div>
                        <button onClick={() => setShowAudit(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                            <X size={16} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                        {analyzing ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                <Loader2 size={28} className="animate-spin text-violet-500" />
                                <p className="text-sm font-semibold text-gray-500">Auditing invoice…</p>
                            </div>
                        ) : auditResult ? (
                            <>
                                <div className="mb-5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-gray-700">Risk Score</span>
                                        <span className={`text-lg font-black ${auditResult.riskScore > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {auditResult.riskScore}<span className="text-sm font-semibold text-gray-400">/100</span>
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${auditResult.riskScore > 50 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${auditResult.riskScore}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    {auditResult.suggestions.map((s, i) => (
                                        <div key={i} className="flex gap-2.5 bg-violet-50 border border-violet-200 p-3 rounded-lg">
                                            <AlertCircle size={15} className="text-violet-500 mt-0.5 shrink-0" />
                                            <span className="text-sm font-medium text-gray-700 leading-snug">{s}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}