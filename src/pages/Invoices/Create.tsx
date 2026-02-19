import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { dataService } from '../../services/dataService';
import { Invoice } from '../../types';
import { ArrowLeft, Plus, Save, Sparkles, Loader2, AlertCircle } from 'lucide-react';

export function CreateInvoice() {
    const navigate = useNavigate();
    const [analyzing, setAnalyzing] = useState(false);
    const [auditResult, setAuditResult] = useState<{ riskScore: number, suggestions: string[] } | null>(null);

    // Extend Invoice type for local form to include customer details
    interface InvoiceForm extends Invoice {
        customerName: string;
        customerEmail: string;
    }

    const { register, control, handleSubmit, watch, formState: { errors } } = useForm<InvoiceForm>({
        defaultValues: {
            invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'draft',
            items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
            customerName: '',
            customerEmail: ''
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    // Calculations for display
    const items = watch('items');
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxRate = 0.18; // Default 18% for now
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const onSave = async (data: InvoiceForm) => {
        try {
            // 1. Create Customer First (No mocks!)
            // We need a real customer ID for the invoice foreign key
            if (!data.customerName) {
                alert("Please enter a Client Name");
                return;
            }

            const newCustomer = {
                name: data.customerName,
                email: data.customerEmail || `client-${Date.now()}@example.com`,
                // Defaults for required fields
                id: '', // Backend generates
                phone: '',
                address: '',
                tags: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Cast to any because we are sending partial data to an endpoint that might be lenient 
            // or we satisfy the TS interface with dummy values that backend ignores
            const customerRes = await dataService.saveCustomer(newCustomer as any);
            const customerId = customerRes.id;

            if (!customerId) throw new Error("Failed to create customer, no ID returned");

            const invoiceToSave: Invoice = {
                ...data, // This includes customerName/Email but generic Invoice type might ignore them, which is fine
                customerId: customerId,
                // buyer object for denormalized display
                buyer: {
                    name: data.customerName,
                    email: data.customerEmail
                },
                subtotal,
                taxAmount,
                total,
            };

            await dataService.saveInvoice(invoiceToSave);
            navigate('/invoices');
        } catch (error) {
            console.error("Failed to save invoice:", error);
            alert("Failed to save invoice. Please check console.");
        }
    };

    const onAudit = async () => {
        setAnalyzing(true);
        setAuditResult(null);
        const formData = watch(); // Get current form data

        try {
            // Use dataService for audit to ensure consistent headers/auth
            // Assuming dataService needs an audit method or we fetch directly using its helper if exposed, 
            // but for now we can add a method to dataService or use raw fetch appropriately IF we want to strictly use service.
            // Let's stick to the existing pattern or better, add to dataService.
            // But since I can't edit dataService in the same step easily without context switching, 
            // I will use raw fetch but with correct error handling WITHOUT mock fallback.

            const token = localStorage.getItem('sb-access-token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

            const response = await fetch(`${API_URL}/ai/audit-invoice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Audit failed: ${errText}`);
            }

            const result = await response.json();
            setAuditResult(result);
        } catch (err: any) {
            console.error("Audit failed", err);
            // NO MOCK FALLBACK
            setAuditResult({
                riskScore: 0,
                suggestions: [`Error: ${err.message}. Ensure backend is running.`]
            });
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 transition">
                        <ArrowLeft size={20} className="mr-1" /> Back
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onAudit}
                            disabled={analyzing}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-lg font-medium hover:bg-violet-200 transition disabled:opacity-50"
                        >
                            {analyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            {analyzing ? 'Auditing...' : 'AI Audit'}
                        </button>
                        <button
                            onClick={handleSubmit(onSave)}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-md transition hover:shadow-lg"
                        >
                            <Save size={18} />
                            Save Draft (Local)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Basic Info */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Invoice Details</h2>
                            {/* Customer Section */}
                            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Client Name <span className="text-red-500">*</span></label>
                                    <input {...register("customerName", { required: true })} placeholder="e.g. Acme Corp" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" />
                                    {errors.customerName && <span className="text-xs text-red-500">Required</span>}
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Client Email</label>
                                    <input {...register("customerEmail")} placeholder="client@example.com" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Invoice Number</label>
                                    <input {...register("invoiceNumber")} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                                    <select {...register("status")} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none">
                                        <option value="draft">Draft</option>
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Issue Date</label>
                                    <input type="date" {...register("date")} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Due Date</label>
                                    <input type="date" {...register("dueDate")} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Items</h2>
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-4 items-start">
                                        <div className="flex-1">
                                            <input {...register(`items.${index}.description` as const)} placeholder="Item description" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" />
                                        </div>
                                        <div className="w-20">
                                            <input type="number" {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} placeholder="Qty" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" />
                                        </div>
                                        <div className="w-24">
                                            <input type="number" {...register(`items.${index}.rate` as const, { valueAsNumber: true })} placeholder="Rate" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none" />
                                        </div>
                                        <button type="button" onClick={() => remove(index)} className="p-2 text-red-400 hover:text-red-600">
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => append({ description: '', quantity: 1, rate: 0, amount: 0 })} className="flex items-center text-sm font-medium text-violet-600 hover:text-violet-700">
                                    <Plus size={16} className="mr-1" /> Add Item
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Summary / Audit Result */}
                    <div className="space-y-6">

                        {/* Summary Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Summary</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax (18%)</span>
                                    <span>₹{taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg text-gray-900">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Audit Result */}
                        {auditResult && (
                            <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="text-violet-600 fill-violet-100" size={20} />
                                    <h3 className="font-bold text-violet-900">AI Audit Report</h3>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-violet-700">Risk Score</span>
                                        <span className={`font-bold ${auditResult.riskScore > 50 ? 'text-red-600' : 'text-emerald-600'}`}>{auditResult.riskScore}/100</span>
                                    </div>
                                    <div className="w-full bg-white h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${auditResult.riskScore > 50 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${auditResult.riskScore}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {auditResult.suggestions.map((suggestion, idx) => (
                                        <div key={idx} className="flex gap-2 text-sm text-violet-800 bg-white/50 p-2 rounded-lg">
                                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                            <span>{suggestion}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}
