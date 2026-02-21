import React, { useState, useRef, useEffect } from "react";
import {
    Download,
    Printer,
    Plus,
    Trash2,
    X,
    Settings,
    ImageIcon,
    Mail,
    Loader2,
    Save,
    AlertCircle
} from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import { Toast, ToastType } from '../Toast';
import InvoicePDF from '../PDF/InvoicePDF';
import { dataService } from '../../services/dataService';
import { Invoice, InvoiceItem, Product } from '../../types';

// Constants
const CURRENCIES = [
    { code: 'INR', symbol: 'Rs.', label: 'Indian Rupee' },
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
];

const TAX_LABELS = ['GST', 'VAT', 'Tax', 'Sales Tax'];

const UNITS = ['Qty', 'Hours', 'Days', 'Service', 'Flat'];

type Seller = { name: string; phone: string; email: string; address: string; taxId: string };
type Buyer = { name: string; phone: string; email: string; address: string };
type InvoiceMeta = { number: string; date: string; dueDate: string };

export interface InvoiceGeneratorProps {
    onClose?: () => void;
    editingInvoice?: Invoice;
    initialData?: {
        invoice?: Partial<InvoiceMeta>;
        buyer?: Partial<Buyer>;
        items?: InvoiceItem[];
        voiceDraft?: string;
    };
};

// 🔹 Reusable InputField with Premium Styling
const InputField = ({
    label,
    type = "text",
    value,
    onChange,
    onFocus,
    onBlur,
    placeholder,
    className = "",
    readOnly = false
}: {
    label?: string;
    type?: string;
    value: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder?: string;
    className?: string;
    readOnly?: boolean;
}) => (
    <div className={`flex flex-col space-y-2 ${className}`}>
        {label && <label className="text-xs font-semibold text-text-light uppercase tracking-wider">{label}</label>}
        <input
            type={type}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            readOnly={readOnly}
            placeholder={placeholder}
            className={`bg-gray-50/80 backdrop-blur-sm border-0 border-b-2 border-gray-200 rounded-t-xl px-4 py-3 text-sm font-medium outline-none transition-all duration-200 text-text-main placeholder-gray-400 shadow-sm ${readOnly
                ? 'cursor-not-allowed text-text-muted bg-gray-100/50'
                : 'focus:border-primary focus:bg-white hover:bg-gray-100/60'
                }`}
        />
    </div>
);

export default function InvoiceGenerator({ onClose, initialData, editingInvoice }: InvoiceGeneratorProps) {
    // Global Settings
    const [currency, setCurrency] = useState(CURRENCIES[0]);
    const [taxLabel, setTaxLabel] = useState('GST');
    const [logo, setLogo] = useState<string | null>(null);

    // Invoice Data
    const [seller, setSeller] = useState<Seller>({ name: "", phone: "", email: "", address: "", taxId: "" });
    const [buyer, setBuyer] = useState<Buyer>({ name: "", phone: "", email: "", address: "" });
    const [meta, setMeta] = useState<InvoiceMeta>({
        number: `INV-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
    });
    const [items, setItems] = useState<InvoiceItem[]>([
        { description: "", quantity: 1, unit: 'Qty', price: 0, discount: 0 },
    ]);
    const [taxRate, setTaxRate] = useState<number>(18);
    const [shipping, setShipping] = useState<number>(0);

    // UI State

    const [activeAction, setActiveAction] = useState<'saving' | 'downloading' | 'emailing' | 'printing' | 'uploading' | null>(null);
    const loading = activeAction !== null;
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailTo, setEmailTo] = useState("");
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Inventory State
    const [products, setProducts] = useState<Product[]>([]);
    const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);

    // Customer Selection State
    const [customers, setCustomers] = useState<any[]>([]);
    const [isBuyerFocused, setIsBuyerFocused] = useState(false);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    // Initialize invoice number from backend
    useEffect(() => {
        if (editingInvoice) {
            // Initialize from editing invoice
            setMeta({
                number: editingInvoice.invoiceNumber,
                date: editingInvoice.date || new Date().toISOString().split("T")[0],
                dueDate: editingInvoice.dueDate || new Date().toISOString().split("T")[0],
            });
            setSeller(editingInvoice.seller || { name: "", phone: "", email: "", address: "", taxId: "" });
            setBuyer(editingInvoice.buyer || { name: "", phone: "", email: "", address: "" });
            setItems(editingInvoice.items?.length ? (editingInvoice.items as InvoiceItem[]).map((i: InvoiceItem) => ({ ...i, unit: i.unit || 'Qty' })) : [{ description: "", quantity: 1, unit: 'Qty', price: 0, discount: 0 }]);
            setTaxRate(editingInvoice.taxRate || 18);
            setShipping(editingInvoice.shipping || 0);
            setTaxLabel(editingInvoice.taxType || 'GST');
        } else {
            dataService.generateInvoiceNumber().then(num => {
                setMeta(prev => ({ ...prev, number: num }));
            }).catch(err => console.error("Failed to fetch next invoice number", err));
        }

        dataService.getSettings().then(settings => {
            if (settings.logoFilename) {
                setLogo(dataService.getLogoUrl(settings.logoFilename));
            }
            // Sync business info if not editing
            if (!editingInvoice) {
                setSeller({
                    name: settings.businessName || "",
                    phone: settings.phone || "",
                    email: settings.email || "",
                    address: settings.address || "",
                    taxId: settings.companyTaxId || ""
                });
            }
        }).catch(e => console.error("Failed to load settings", e));

        // Fetch Inventory
        dataService.getProducts().then(setProducts).catch(err => console.error("Failed to fetch products", err));

        // Fetch Customers
        dataService.getCustomers().then(setCustomers).catch(err => console.error("Failed to fetch customers", err));
    }, [editingInvoice]);

    // Apply initial data
    useEffect(() => {
        if (initialData) {
            if (initialData.buyer) setBuyer(prev => ({ ...prev, ...initialData.buyer }));
            if (initialData.items && initialData.items.length > 0) {
                setItems(initialData.items.map(i => ({ ...i, unit: i.unit || 'Qty' })));
            }
        }
    }, [initialData]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setActiveAction('uploading');
            try {
                const result = await dataService.uploadLogo(file);
                setLogo(result.url);
            } catch (error) {
                console.error("Logo upload failed", error);
                const reader = new FileReader();
                reader.onloadend = () => setLogo(reader.result as string);
                reader.readAsDataURL(file);
            } finally {
                setActiveAction(null);
            }
        }
    };

    // Item Management
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const addItem = () => setItems([...items, { description: "", quantity: 1, unit: 'Qty', price: 0, discount: 0 }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
    const updateItem = <K extends keyof InvoiceItem>(index: number, field: K, value: InvoiceItem[K]) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };
    useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [items]);

    // Totals Calculation
    const subtotal = items.reduce((acc, i) => {
        const lineTotal = i.quantity * i.price;
        const discountAmt = (lineTotal * (i.discount || 0)) / 100;
        return acc + (lineTotal - discountAmt);
    }, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount + shipping;

    const buildInvoiceData = () => {
        return {
            id: editingInvoice?.id,
            invoiceNumber: meta.number,
            date: meta.date,
            dueDate: meta.dueDate,
            seller: seller,
            buyer: buyer,
            items: items,
            subtotal: subtotal,
            taxAmount: taxAmount,
            taxType: taxLabel,
            taxRate: taxRate,
            discount: 0,
            shipping: shipping,
            total: total,
            status: editingInvoice?.status || 'draft' as const,
            notes: editingInvoice?.notes || ''
        };
    };

    const handleSaveAndDownload = async () => {
        // Validate items
        const emptyItems = items.filter(item => !item.description.trim());
        if (emptyItems.length > 0) {
            showToast('Please fill in all item descriptions before saving.', 'error');
            return;
        }

        setActiveAction('downloading');
        try {
            // 1. Save JSON Data
            const invoiceData = buildInvoiceData();
            await dataService.saveInvoice(invoiceData as any);

            // 2. Generate PDF Client-Side
            // We need to fetch the latest settings to ensure we have the logo/address
            const latestSettings = await dataService.getSettings();

            const blob = await pdf(
                <InvoicePDF
                    invoice={invoiceData as any}
                    settings={latestSettings}
                    logoUrl={logo}
                />
            ).toBlob();

            // 3. Trigger Download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice_${meta.number}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast("Invoice saved & PDF downloaded!", 'success');

            // Close after brief delay to show toast
            setTimeout(() => {
                if (onClose) onClose();
            }, 1500);
        } catch (error) {
            console.error("Failed to save/download", error);
            showToast("Failed to generate PDF", 'error');
            setActiveAction(null);
        }
    };

    const handleSaveOnly = async () => {
        // Validate items
        const emptyItems = items.filter(item => !item.description.trim());
        if (emptyItems.length > 0) {
            showToast('Please fill in all item descriptions before saving.', 'error');
            return;
        }

        setActiveAction('saving');
        try {
            const invoiceData = buildInvoiceData();
            await dataService.saveInvoice(invoiceData as any);
            showToast("Invoice saved successfully!", 'success');
            // Close after brief delay to show toast
            setTimeout(() => {
                if (onClose) onClose();
            }, 1000);
        } catch (error) {
            console.error("Failed to save", error);
            showToast("Failed to save invoice", 'error');
            setActiveAction(null);
        }
    };

    const handlePrint = async () => {
        setActiveAction('printing');
        // Small delay to allow loader to show before print dialog blocks the thread
        setTimeout(() => {
            window.print();
            setActiveAction(null);
        }, 800);
    };

    const handleEmailClick = () => {
        setEmailTo(buyer.email || "");
        setIsEmailModalOpen(true);
    };

    const handleSendEmail = async () => {
        if (!emailTo) return;

        // Validate items
        const emptyItems = items.filter(item => !item.description.trim());
        if (emptyItems.length > 0) {
            showToast('Please fill in all item descriptions before sending.', 'error');
            return;
        }

        setActiveAction('emailing');
        try {
            // 1. Save Data
            const invoiceData = buildInvoiceData();
            const { id } = await dataService.saveInvoice(invoiceData as any);

            // 2. Generate PDF Client-Side
            const latestSettings = await dataService.getSettings();

            const blob = await pdf(
                <InvoicePDF
                    invoice={invoiceData as any}
                    settings={latestSettings}
                    logoUrl={logo}
                />
            ).toBlob();

            // 3. Send Email with Attachment
            if (!latestSettings.smtp_user || !latestSettings.smtp_pass) {
                showToast("Email service not configured. Please go to Settings to connect your Gmail.", 'error');
                setActiveAction(null);
                return;
            }

            await dataService.sendInvoiceEmail(id, emailTo, blob);

            showToast("Invoice sent successfully!", 'success');
            setIsEmailModalOpen(false);
            setEmailTo('');
        } catch (error) {
            console.error("Failed to send email", error);
            showToast("Failed to send email", 'error');
        } finally {
            setActiveAction(null);
        }
    };

    return (
        <div className="bg-gradient-to-br from-white via-gray-50/30 to-primary-light/10 w-full h-[85vh] p-0 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col border border-gray-100/50 relative overflow-hidden font-sans text-text-main backdrop-blur-xl">

            {/* --- Top Bar: Glassmorphic Header --- */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 p-5 flex flex-wrap gap-4 items-center justify-between shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-5 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-2 rounded-xl border border-primary/20 text-primary shadow-sm">
                            <Settings size={16} strokeWidth={2.5} />
                        </div>
                        <select
                            value={currency.code}
                            onChange={(e) => setCurrency(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0])}
                            className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-text-main shadow-sm transition-all hover:shadow-md hover:border-primary/40"
                        >
                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                        </select>
                    </div>
                    <div className="h-5 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Tax</span>
                        <select
                            value={taxLabel}
                            onChange={(e) => setTaxLabel(e.target.value)}
                            className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-text-main shadow-sm transition-all hover:shadow-md hover:border-primary/40"
                        >
                            {TAX_LABELS.map(label => <option key={label} value={label}>{label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3">
                    {onClose && (
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-text-muted hover:text-text-main transition-all duration-200 hover:shadow-sm">
                            <X size={20} strokeWidth={2} />
                        </button>
                    )}
                </div>
            </div>

            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-10 scrollbar-hide relative min-h-0">

                {/* Loader Overlay removed to favor per-button loading states */}

                {/* Email Modal with Premium Styling */}
                {isEmailModalOpen && (
                    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.25)] w-full max-w-md p-8 space-y-6 border border-gray-100 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary-light p-3 rounded-2xl">
                                    <Mail className="w-6 h-6 text-primary" strokeWidth={2.5} />
                                </div>
                                <h3 className="text-xl font-bold text-text-main">Send Invoice</h3>
                            </div>

                            {(!seller.email || !seller.name) && (
                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 text-left">
                                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <p className="text-xs text-amber-800">
                                        <strong>Seller info missing:</strong> Please ensure your business name and email are set in settings for professional emails.
                                    </p>
                                </div>
                            )}
                            <InputField
                                label="Recipient Email"
                                value={emailTo}
                                onChange={(e) => setEmailTo(e.target.value)}
                                placeholder="customer@example.com"
                            />
                            <div className="flex gap-3 justify-end pt-3">
                                <button onClick={() => setIsEmailModalOpen(false)} className="px-6 py-3 text-text-muted hover:bg-gray-50 rounded-xl text-sm font-semibold transition-all duration-200 hover:text-text-main">Cancel</button>
                                <button
                                    onClick={handleSendEmail}
                                    disabled={!emailTo || loading}
                                    className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:shadow-lg text-sm font-semibold flex items-center gap-2 shadow-soft transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {activeAction === 'emailing' ? <Loader2 size={16} className="animate-spin" strokeWidth={2.5} /> : <Mail size={16} strokeWidth={2.5} />} Send Email
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* Header: Logo & Meta */}
                <div className="flex flex-col md:flex-row justify-between gap-10">
                    <div className="w-full md:w-1/2 space-y-5">
                        {/* Logo Upload with Premium Style */}
                        <div className="relative group w-52 h-32 border-2 border-dashed border-gray-300 rounded-3xl flex items-center justify-center cursor-pointer hover:border-primary hover:bg-gradient-to-br hover:from-primary-light/20 hover:to-primary/5 transition-all duration-300 overflow-hidden bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md">
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            {logo ? (
                                <div className="relative w-full h-full p-3">
                                    <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary-dark/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 text-sm font-semibold backdrop-blur-sm rounded-3xl">
                                        {activeAction === 'uploading' ? <Loader2 className="animate-spin" /> : "Change Logo"}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-400 group-hover:text-primary transition-all duration-300">
                                    {activeAction === 'uploading' ? (
                                        <Loader2 size={32} className="mb-3 animate-spin text-primary" strokeWidth={2.5} />
                                    ) : (
                                        <ImageIcon size={32} className="mb-3 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" strokeWidth={2} />
                                    )}
                                    <span className="text-sm font-semibold">{activeAction === 'uploading' ? 'Uploading...' : 'Upload Logo'}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-1/3 space-y-4">
                        <InputField label="Invoice #" value={meta.number || ''} readOnly={true} />
                        <InputField label="Date" type="date" value={meta.date || ''} onChange={(e) => setMeta({ ...meta, date: e.target.value })} />
                        <InputField label="Due Date" type="date" value={meta.dueDate || ''} onChange={(e) => setMeta({ ...meta, dueDate: e.target.value })} />
                    </div>
                </div>

                <hr className="border-gray-200/60" />

                {/* Seller & Buyer Grid with Glassmorphic Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Seller */}
                    <div className="space-y-4 p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-gray-200/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
                            From
                        </h3>
                        <InputField placeholder="Your Business Name" value={seller.name || ''} onChange={(e) => setSeller({ ...seller, name: e.target.value })} />
                        <textarea
                            className="w-full bg-gray-50/80 backdrop-blur-sm border-0 border-b-2 border-gray-200 rounded-t-xl px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white outline-none resize-none transition-all duration-200 shadow-sm"
                            placeholder="Business Address"
                            rows={3}
                            value={seller.address || ''}
                            onChange={(e) => setSeller({ ...seller, address: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <InputField placeholder="Email" value={seller.email || ''} onChange={(e) => setSeller({ ...seller, email: e.target.value })} />
                            <InputField placeholder="Phone" value={seller.phone || ''} onChange={(e) => setSeller({ ...seller, phone: e.target.value })} />
                        </div>
                        <InputField label={`${taxLabel} ID`} placeholder={`e.g. ${taxLabel}123456`} value={seller.taxId || ''} onChange={(e) => setSeller({ ...seller, taxId: e.target.value })} />
                    </div>

                    {/* Buyer */}
                    <div className="space-y-4 p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-gray-200/50 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
                            To
                        </h3>
                        <div className="relative">
                            <InputField
                                placeholder="Client Business Name"
                                value={buyer.name || ''}
                                onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                                onFocus={() => setIsBuyerFocused(true)}
                                onBlur={() => setTimeout(() => setIsBuyerFocused(false), 200)}
                            />

                            {/* Customer Autocomplete Dropdown */}
                            {isBuyerFocused && (
                                <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 max-h-60 overflow-y-auto z-[100] animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl bg-white/95">
                                    <div className="sticky top-0 bg-gray-50/90 backdrop-blur-sm px-4 py-2 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400 z-10">
                                        Select Existing Customer
                                    </div>
                                    {customers
                                        .filter(c => !buyer.name || c.name.toLowerCase().includes(buyer.name.toLowerCase()))
                                        .slice(0, 10)
                                        .map(customer => (
                                            <button
                                                key={customer.id}
                                                className="w-full text-left px-4 py-3 hover:bg-primary-light/10 flex flex-col group transition-all duration-150 border-b border-gray-50 last:border-0"
                                                onClick={() => {
                                                    setBuyer({
                                                        name: customer.name,
                                                        address: customer.address || "",
                                                        email: customer.email || "",
                                                        phone: customer.phone || ""
                                                    });
                                                    setIsBuyerFocused(false);
                                                }}
                                            >
                                                <div className="font-semibold text-sm text-gray-800 group-hover:text-primary transition-colors">{customer.name}</div>
                                                <div className="text-[10px] text-gray-400 truncate">{customer.email || 'No email'} • {customer.phone || 'No phone'}</div>
                                            </button>
                                        ))}
                                    {buyer.name && customers.filter(c => c.name.toLowerCase().includes(buyer.name.toLowerCase())).length === 0 && (
                                        <div className="p-4 text-center">
                                            <p className="text-sm font-medium text-gray-500">No matching customers</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <textarea
                            className="w-full bg-gray-50/80 backdrop-blur-sm border-0 border-b-2 border-gray-200 rounded-t-xl px-4 py-3 text-sm font-medium focus:border-primary focus:bg-white outline-none resize-none transition-all duration-200 shadow-sm"
                            placeholder="Client Address"
                            rows={3}
                            value={buyer.address || ''}
                            onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <InputField placeholder="Email" value={buyer.email || ''} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
                            <InputField placeholder="Phone" value={buyer.phone || ''} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Items Table with Modern Styling */}
                <div className="space-y-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-md">
                        <div className="grid grid-cols-12 gap-4 p-5 text-xs font-bold text-text-muted border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-primary-light/10 uppercase tracking-widest">
                            <div className="col-span-10 sm:col-span-5">Description</div>
                            <div className="col-span-2 hidden sm:block text-center">Unit</div>
                            <div className="col-span-2 sm:col-span-1 text-center">Qty</div>
                            <div className="col-span-2 text-center">Price</div>
                            <div className="col-span-2 sm:col-span-1 text-center">Total</div>
                            <div className="col-span-1"></div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gradient-to-r hover:from-primary-light/10 hover:to-transparent transition-all duration-200 group">
                                    <div className="col-span-10 sm:col-span-5 relative">
                                        <input
                                            className="w-full bg-transparent border-0 focus:outline-none p-0 text-sm font-medium text-text-main placeholder-gray-400"
                                            placeholder="Item description or search product..."
                                            value={item.description}
                                            onChange={(e) => updateItem(idx, "description", e.target.value)}
                                            onFocus={() => setFocusedItemIndex(idx)}
                                            onBlur={() => setTimeout(() => setFocusedItemIndex(null), 200)}
                                        />
                                        {/* Product Autocomplete Dropdown - Enhanced with Stock Logic */}
                                        {focusedItemIndex === idx && (
                                            <div className="absolute left-0 top-full mt-2 w-[120%] min-w-[300px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 max-h-72 overflow-y-auto z-[100] animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl bg-white/95">
                                                <div className="sticky top-0 bg-gray-50/90 backdrop-blur-sm px-4 py-2 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400 z-10 flex justify-between">
                                                    <span>Available Products</span>
                                                    <span>Real-time Stock</span>
                                                </div>
                                                {products
                                                    .filter(p => !item.description || p.name.toLowerCase().includes(item.description.toLowerCase()) || p.sku?.toLowerCase().includes(item.description.toLowerCase()))
                                                    .slice(0, 50)
                                                    .map(product => {
                                                        // [STOCK LOGIC] Calculate real-time availability including items currently in the cart
                                                        const allocatedQty = items.reduce((acc, currItem, currIdx) => {
                                                            if (currIdx !== idx && (currItem.productId === product.id || currItem.description === product.name)) {
                                                                return acc + (currItem.quantity || 0);
                                                            }
                                                            return acc;
                                                        }, 0);

                                                        const availableStock = Math.max(0, product.stock - allocatedQty);
                                                        const isOutOfStock = availableStock === 0;

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
                                                                        quantity: newItems[idx].quantity || 1
                                                                    };
                                                                    setItems(newItems);
                                                                    if (availableStock < 5) showToast(`Note: Only ${availableStock} left of ${product.name}`, 'info');
                                                                }}
                                                            >
                                                                <div className="space-y-0.5">
                                                                    <div className="font-semibold text-sm text-gray-800 group-hover:text-primary transition-colors">{product.name}</div>
                                                                    <div className="flex items-center gap-2">
                                                                        {product.sku && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">SKU: {product.sku}</span>}
                                                                        <span className="text-[10px] text-gray-400">{product.unit}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right space-y-0.5">
                                                                    <div className="font-bold text-sm text-gray-900">{currency.symbol}{product.price.toLocaleString()}</div>
                                                                    <div>
                                                                        {availableStock > 10 ? (
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
                                    <div className="col-span-2 hidden sm:block">
                                        <select
                                            className="w-full bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-text-muted transition-all"
                                            value={item.unit}
                                            onChange={(e) => updateItem(idx, "unit", e.target.value)}
                                        >
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <input
                                            type="number"
                                            className="w-full text-center bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:bg-white focus:border-primary text-text-main transition-all"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-span-2 relative">
                                        <span className="absolute left-3 top-2.5 text-xs text-text-light font-medium">{currency.symbol}</span>
                                        <input
                                            type="number"
                                            className="w-full text-right bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl py-2 pl-6 pr-3 text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white outline-none transition-all"
                                            value={item.price}
                                            onChange={(e) => updateItem(idx, "price", Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 text-right text-sm font-bold text-primary">
                                        {currency.symbol}{(item.quantity * item.price).toFixed(0)}
                                    </div>
                                    <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-500 bg-red-50 p-2 rounded-xl hover:bg-red-100 transition-all duration-200 hover:scale-110">
                                            <Trash2 size={16} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={addItem}
                        className="flex items-center gap-2 text-primary text-sm font-semibold hover:text-primary-dark transition-all duration-200 px-4 py-2 rounded-xl hover:bg-primary-light/20 w-fit hover:scale-105"
                    >
                        <Plus size={18} strokeWidth={2.5} /> Add Line Item
                    </button>
                </div>

                {/* Totals Section with Premium Styling */}
                <div className="flex justify-end pt-8 border-t border-gray-200/60 mt-6">
                    <div className="w-full sm:w-1/2 md:w-1/3 space-y-5 bg-gradient-to-br from-white/80 to-primary-light/10 backdrop-blur-md p-7 rounded-3xl border border-gray-200/50 shadow-md">
                        <div className="flex justify-between text-sm text-text-muted font-medium">
                            <span>Subtotal</span>
                            <span className="font-semibold text-text-main">{currency.symbol}{subtotal.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm text-text-muted gap-4 font-medium">
                            <div className="flex items-center gap-2">
                                <span>{taxLabel}</span>
                                <div className="relative w-16">
                                    <input
                                        type="number"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(Number(e.target.value))}
                                        className="w-full border-b-2 border-primary/30 bg-transparent text-center focus:border-primary focus:outline-none text-xs font-semibold py-1 transition-all"
                                    />
                                    <span className="absolute right-0 top-1 text-xs font-medium">%</span>
                                </div>
                            </div>
                            <span className="font-semibold text-text-main">{currency.symbol}{taxAmount.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm text-text-muted gap-4 font-medium">
                            <span>Shipping</span>
                            <div className="relative w-28">
                                <span className="absolute left-3 top-2 text-xs text-text-light font-medium">{currency.symbol}</span>
                                <input
                                    type="number"
                                    value={shipping}
                                    onChange={(e) => setShipping(Number(e.target.value))}
                                    className="w-full bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 pl-7 text-right text-xs font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between text-xl font-bold text-text-main border-t-2 border-primary/20 pt-5 mt-3">
                            <span>Total</span>
                            <span className="text-primary bg-primary-light/30 px-4 py-1 rounded-xl">{currency.symbol}{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer Actions with Glassmorphism */}
            <div className="border-t border-gray-200/50 p-6 bg-white/80 backdrop-blur-xl flex justify-between items-center z-10 shadow-sm">
                <div className="flex gap-4">
                    {/* Placeholder for future features */}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSaveOnly}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm bg-white border-2 border-gray-200 text-text-muted hover:text-text-main hover:bg-gray-50 hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {activeAction === 'saving' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} strokeWidth={2} />}
                        Save Details
                    </button>
                    <button
                        onClick={handleSaveAndDownload}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-primary via-primary to-primary-dark text-white hover:shadow-xl shadow-soft disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                    >
                        {activeAction === 'downloading' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} strokeWidth={2} />}
                        Save & PDF
                    </button>

                    {/* Secondary Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleEmailClick}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm bg-white border-2 border-gray-200 text-text-muted hover:text-text-main hover:bg-gray-50 hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {activeAction === 'emailing' ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} strokeWidth={2} />}
                            Email
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm bg-white border-2 border-gray-200 text-text-muted hover:text-text-main hover:bg-gray-50 hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {activeAction === 'printing' ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} strokeWidth={2} />}
                            Print
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
