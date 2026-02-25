import React, { useState, useRef, useEffect } from "react";
import {
    Download, Printer, X, Settings, Mail, Loader2, Save, AlertCircle
} from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import { Toast, ToastType } from '../Toast';
import InvoicePDF from '../PDF/InvoicePDF';
import { dataService } from '../../services/dataService';
import { Invoice, InvoiceItem, Product } from '../../types';
import { usePersona } from "../../contexts/PersonaContext";
import { SellerErrors } from './sections/SellerSection';
import { BuyerErrors } from './sections/BuyerSection';
import { HeaderErrors } from './sections/InvoiceHeader';

// ─── Local Modules ─────────────────────────────────────────────────────
import { CURRENCIES, TAX_LABELS, Seller, Buyer, InvoiceMeta } from './constants';
import InputField from './InputField';

// ─── Section Components ────────────────────────────────────────────────
import InvoiceHeader from './sections/InvoiceHeader';
import SellerSection from './sections/SellerSection';
import BuyerSection from './sections/BuyerSection';
import ItemsTable from './sections/ItemsTable';
import NotesAndExtrasSection from './sections/NotesAndExtrasSection';
import TotalsSection from './sections/TotalsSection';

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
};

// ═══════════════════════════════════════════════════════════════════════
//  Main Orchestrator
// ═══════════════════════════════════════════════════════════════════════
export default function InvoiceGenerator({ onClose, initialData, editingInvoice }: InvoiceGeneratorProps) {
    const { businessType: _bt } = usePersona();
    const businessType = _bt ?? 'solopreneur';

    // ─── Global Settings ───────────────────────────────────────────────
    const [currency, setCurrency] = useState(CURRENCIES[0]);
    const [taxLabel, setTaxLabel] = useState('GST');
    const [logo, setLogo] = useState<string | null>(null);

    // ─── Invoice Data ──────────────────────────────────────────────────
    const [seller, setSeller] = useState<Seller>({ name: "", phone: "", email: "", address: "", taxId: "", upiId: "" });
    const [buyer, setBuyer] = useState<Buyer>({ name: "", phone: "", email: "", address: "", taxId: "" });
    const [notes, setNotes] = useState<string>("");
    const [meta, setMeta] = useState<InvoiceMeta>({
        number: `INV-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
    });

    // ─── Persona-Specific State ────────────────────────────────────────
    const [projectName, setProjectName] = useState("");
    const [shippingAddress, setShippingAddress] = useState("");
    const [orderNumber, setOrderNumber] = useState("");

    // Solopreneur
    const [isGstRegistered, setIsGstRegistered] = useState(false);

    // Agency
    const [isInterState, setIsInterState] = useState(false);
    const [authorizedSignatory, setAuthorizedSignatory] = useState("");

    // CA
    const [placeOfSupply, setPlaceOfSupply] = useState('27 - Maharashtra');
    const [reverseCharge, setReverseCharge] = useState(false);
    const caIsInterState = businessType === 'ca' && placeOfSupply && seller.taxId
        ? placeOfSupply.substring(0, 2) !== (seller.taxId.substring(0, 2) || '')
        : false;

    // Ecommerce
    const [deliveryState, setDeliveryState] = useState('');
    const [dispatchDate, setDispatchDate] = useState('');
    const [courierTracking, setCourierTracking] = useState('');
    const ecomIsInterState = businessType === 'ecommerce' && deliveryState && seller.taxId
        ? deliveryState.substring(0, 2) !== (seller.taxId.substring(0, 2) || '')
        : false;

    // ─── Items & Totals ────────────────────────────────────────────────
    const [items, setItems] = useState<InvoiceItem[]>([
        { description: "", quantity: 1, unit: (businessType === 'agency' || businessType === 'solopreneur') ? 'Hours' : 'Qty', price: 0, discount: 0 },
    ]);
    const [taxRate, setTaxRate] = useState<number>(businessType === 'solopreneur' ? 0 : 18);
    const [shipping, setShipping] = useState<number>(0);

    const subtotal = items.reduce((acc, i) => {
        const lineTotal = i.quantity * i.price;
        const discountAmt = (lineTotal * (i.discount || 0)) / 100;
        return acc + (lineTotal - discountAmt);
    }, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount + shipping;

    // ─── UI State ──────────────────────────────────────────────────────
    const [activeAction, setActiveAction] = useState<'saving' | 'downloading' | 'emailing' | 'printing' | 'uploading' | null>(null);
    const loading = activeAction !== null;
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailTo, setEmailTo] = useState("");
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // ─── Validation Errors ─────────────────────────────────────────────
    const [sellerErrors, setSellerErrors] = useState<SellerErrors>({});
    const [buyerErrors, setBuyerErrors] = useState<BuyerErrors>({});
    const [headerErrors, setHeaderErrors] = useState<HeaderErrors>({});
    const [itemErrors, setItemErrors] = useState<Record<number, string>>({});

    // Inventory + Customer
    const [products, setProducts] = useState<Product[]>([]);
    const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [isBuyerFocused, setIsBuyerFocused] = useState(false);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    // ─── Effects ───────────────────────────────────────────────────────
    useEffect(() => {
        if (editingInvoice) {
            setMeta({
                number: editingInvoice.invoiceNumber,
                date: editingInvoice.date || new Date().toISOString().split("T")[0],
                dueDate: editingInvoice.dueDate || new Date().toISOString().split("T")[0],
            });
            setSeller(editingInvoice.seller || { name: "", phone: "", email: "", address: "", taxId: "", upiId: "" });
            setBuyer(editingInvoice.buyer || { name: "", phone: "", email: "", address: "", taxId: "" });
            if (editingInvoice.notes) setNotes(editingInvoice.notes);
            setItems(editingInvoice.items?.length ? (editingInvoice.items as InvoiceItem[]).map((i: InvoiceItem) => ({ ...i, unit: i.unit || 'Qty' })) : [{ description: "", quantity: 1, unit: businessType === 'agency' ? 'Hours' : 'Qty', price: 0, discount: 0 }]);
            setTaxRate(editingInvoice.taxRate || 18);
            setShipping(editingInvoice.shipping || 0);
            setTaxLabel(editingInvoice.taxType || 'GST');
            if (editingInvoice.projectName) setProjectName(editingInvoice.projectName);
            if (editingInvoice.shippingAddress) setShippingAddress(editingInvoice.shippingAddress);
            if (editingInvoice.orderNumber) setOrderNumber(editingInvoice.orderNumber);
        } else {
            dataService.generateInvoiceNumber().then(num => {
                setMeta(prev => ({ ...prev, number: num }));
            }).catch(err => console.error("Failed to fetch next invoice number", err));
        }

        dataService.getSettings().then(settings => {
            if (settings.logoFilename) setLogo(dataService.getLogoUrl(settings.logoFilename));
            if (!editingInvoice) {
                setSeller({
                    name: settings.businessName || "",
                    phone: settings.phone || "",
                    email: settings.email || "",
                    address: settings.address || "",
                    taxId: settings.companyTaxId || "",
                    upiId: settings.upiId || ""
                });
            }
        }).catch(e => console.error("Failed to load settings", e));

        dataService.getProducts().then(setProducts).catch(err => console.error("Failed to fetch products", err));
        dataService.getCustomers().then(setCustomers).catch(err => console.error("Failed to fetch customers", err));
    }, [editingInvoice]);

    useEffect(() => {
        if (initialData) {
            if (initialData.buyer) setBuyer(prev => ({ ...prev, ...initialData.buyer }));
            if (initialData.items && initialData.items.length > 0) {
                setItems(initialData.items.map(i => ({ ...i, unit: i.unit || 'Qty' })));
            }
        }
    }, [initialData]);

    useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [items]);

    // ─── Handlers ──────────────────────────────────────────────────────
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

    const buildInvoiceData = () => ({
        id: editingInvoice?.id,
        invoiceNumber: meta.number,
        date: meta.date,
        dueDate: meta.dueDate,
        seller, buyer, items,
        subtotal, taxAmount,
        taxType: taxLabel,
        taxRate, discount: 0, shipping, total,
        status: editingInvoice?.status || 'draft' as const,
        notes: notes || editingInvoice?.notes || '',
        projectName, shippingAddress, orderNumber
    });

    /** Validate all required fields. Returns true if valid. */
    const validateForm = (): boolean => {
        const sErr: SellerErrors = {};
        const bErr: BuyerErrors = {};
        const hErr: HeaderErrors = {};
        const iErr: Record<number, string> = {};
        let errorCount = 0;

        // Seller
        if (!seller.name.trim()) { sErr.name = 'Business name is required'; errorCount++; }
        if ((businessType === 'ca' || businessType === 'agency') && !seller.taxId.trim()) {
            sErr.taxId = `${taxLabel} ID is required for ${businessType === 'ca' ? 'CA' : 'Agency'} invoices`;
            errorCount++;
        }

        // Buyer
        if (!buyer.name.trim()) { bErr.name = 'Client name is required'; errorCount++; }

        // Meta
        if (!meta.date) { hErr.date = 'Invoice date is required'; errorCount++; }

        // Items
        items.forEach((item, idx) => {
            if (!item.description.trim()) { iErr[idx] = 'Description is required'; errorCount++; }
            else if (item.price <= 0) { iErr[idx] = 'Price must be greater than 0'; errorCount++; }
            else if (item.quantity <= 0) { iErr[idx] = 'Quantity must be at least 1'; errorCount++; }
        });

        setSellerErrors(sErr);
        setBuyerErrors(bErr);
        setHeaderErrors(hErr);
        setItemErrors(iErr);

        if (errorCount > 0) {
            showToast(`Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} before submitting.`, 'error');
            return false;
        }
        return true;
    };

    /** Clear all errors (called when user starts editing after a failed validation) */
    const clearErrors = () => {
        if (Object.keys(sellerErrors).length || Object.keys(buyerErrors).length || Object.keys(headerErrors).length || Object.keys(itemErrors).length) {
            setSellerErrors({});
            setBuyerErrors({});
            setHeaderErrors({});
            setItemErrors({});
        }
    };

    const handleSaveAndDownload = async () => {
        if (!validateForm()) return;
        setActiveAction('downloading');
        try {
            const invoiceData = buildInvoiceData();
            await dataService.saveInvoice(invoiceData as any);
            const latestSettings = await dataService.getSettings();
            const blob = await pdf(<InvoicePDF invoice={invoiceData as any} settings={latestSettings} logoUrl={logo} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice_${meta.number}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Invoice saved & PDF downloaded!", 'success');
            setTimeout(() => { if (onClose) onClose(); }, 1500);
        } catch (error) {
            console.error("Failed to save/download", error);
            showToast("Failed to generate PDF", 'error');
            setActiveAction(null);
        }
    };

    const handleSaveOnly = async () => {
        if (!validateForm()) return;
        setActiveAction('saving');
        try {
            await dataService.saveInvoice(buildInvoiceData() as any);
            showToast("Invoice saved successfully!", 'success');
            setTimeout(() => { if (onClose) onClose(); }, 1000);
        } catch (error) {
            console.error("Failed to save", error);
            showToast("Failed to save invoice", 'error');
            setActiveAction(null);
        }
    };

    const handlePrint = async () => {
        setActiveAction('printing');
        setTimeout(() => { window.print(); setActiveAction(null); }, 800);
    };

    const handleEmailClick = () => {
        setEmailTo(buyer.email || "");
        setIsEmailModalOpen(true);
    };

    const handleSendEmail = async () => {
        if (!emailTo) return;
        if (!validateForm()) return;
        setActiveAction('emailing');
        try {
            const invoiceData = buildInvoiceData();
            const { id } = await dataService.saveInvoice(invoiceData as any);
            const latestSettings = await dataService.getSettings();
            const blob = await pdf(<InvoicePDF invoice={invoiceData as any} settings={latestSettings} logoUrl={logo} />).toBlob();
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

    // ═══════════════════════════════════════════════════════════════════
    //  Render
    // ═══════════════════════════════════════════════════════════════════
    return (
        <div className="bg-gradient-to-br from-white via-gray-50/30 to-primary-light/10 w-full h-[85vh] p-0 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col border border-gray-100/50 relative overflow-hidden font-sans text-text-main backdrop-blur-xl">

            {/* ─── Top Bar ─── */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 p-5 flex flex-wrap gap-4 items-center justify-between shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-5 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-2 rounded-xl border border-primary/20 text-primary shadow-sm">
                            <Settings size={16} strokeWidth={2.5} />
                        </div>
                        <select value={currency.code} onChange={(e) => setCurrency(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0])}
                            className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-text-main shadow-sm transition-all hover:shadow-md hover:border-primary/40">
                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                        </select>
                    </div>
                    <div className="h-5 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Tax</span>
                        <select value={taxLabel} onChange={(e) => setTaxLabel(e.target.value)}
                            className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-text-main shadow-sm transition-all hover:shadow-md hover:border-primary/40">
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

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ─── Scrollable Content ─── */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-10 scrollbar-hide relative min-h-0">

                {/* Email Modal */}
                {isEmailModalOpen && (
                    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.25)] w-full max-w-md p-8 space-y-6 border border-gray-100 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary-light p-3 rounded-2xl"><Mail className="w-6 h-6 text-primary" strokeWidth={2.5} /></div>
                                <h3 className="text-xl font-bold text-text-main">Send Invoice</h3>
                            </div>
                            {(!seller.email || !seller.name) && (
                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 text-left">
                                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <p className="text-xs text-amber-800"><strong>Seller info missing:</strong> Please ensure your business name and email are set in settings for professional emails.</p>
                                </div>
                            )}
                            <InputField label="Recipient Email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="client@example.com" />
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setIsEmailModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-text-muted hover:bg-gray-200 transition-all">Cancel</button>
                                <button onClick={handleSendEmail} disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-primary-dark text-white shadow-soft hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                                    {activeAction === 'emailing' ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />} Send
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Header: Logo + Meta + Persona Inputs ─── */}
                <InvoiceHeader
                    businessType={businessType} logo={logo} activeAction={activeAction}
                    handleLogoUpload={handleLogoUpload} meta={meta} setMeta={(m) => { setMeta(m); clearErrors(); }}
                    placeOfSupply={placeOfSupply} setPlaceOfSupply={setPlaceOfSupply}
                    reverseCharge={reverseCharge} setReverseCharge={setReverseCharge}
                    projectName={projectName} setProjectName={setProjectName}
                    shippingAddress={shippingAddress} setShippingAddress={setShippingAddress}
                    orderNumber={orderNumber} setOrderNumber={setOrderNumber}
                    dispatchDate={dispatchDate} setDispatchDate={setDispatchDate}
                    errors={headerErrors}
                />

                <hr className="border-gray-200/60" />

                {/* ─── Seller & Buyer ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SellerSection
                        businessType={businessType} seller={seller} setSeller={(s) => { setSeller(s); clearErrors(); }}
                        taxLabel={taxLabel} isGstRegistered={isGstRegistered}
                        setIsGstRegistered={setIsGstRegistered} setTaxRate={setTaxRate}
                        errors={sellerErrors}
                    />
                    <BuyerSection
                        businessType={businessType} buyer={buyer} setBuyer={(b) => { setBuyer(b); clearErrors(); }}
                        seller={seller} customers={customers}
                        isBuyerFocused={isBuyerFocused} setIsBuyerFocused={setIsBuyerFocused}
                        errors={buyerErrors}
                    />
                </div>

                {/* ─── Items Table ─── */}
                <ItemsTable
                    businessType={businessType} items={items} setItems={(newItems) => { setItems(newItems); clearErrors(); }}
                    currency={currency} products={products}
                    focusedItemIndex={focusedItemIndex} setFocusedItemIndex={setFocusedItemIndex}
                    showToast={showToast} taxRate={taxRate} itemErrors={itemErrors}
                />

                {/* ─── Notes, Courier, Signatory, UPI ─── */}
                <NotesAndExtrasSection
                    businessType={businessType} notes={notes} setNotes={setNotes}
                    courierTracking={courierTracking} setCourierTracking={setCourierTracking}
                    authorizedSignatory={authorizedSignatory} setAuthorizedSignatory={setAuthorizedSignatory}
                    seller={seller}
                />

                {/* ─── Totals ─── */}
                <TotalsSection
                    businessType={businessType} currency={currency}
                    subtotal={subtotal} taxAmount={taxAmount} taxRate={taxRate} setTaxRate={setTaxRate}
                    taxLabel={taxLabel} shipping={shipping} setShipping={setShipping} total={total}
                    isGstRegistered={isGstRegistered}
                    reverseCharge={reverseCharge} placeOfSupply={placeOfSupply} caIsInterState={caIsInterState}
                    isInterState={isInterState} setIsInterState={setIsInterState}
                    deliveryState={deliveryState} setDeliveryState={setDeliveryState} ecomIsInterState={ecomIsInterState}
                />

                <div ref={bottomRef} />
            </div>

            {/* ─── Footer Actions ─── */}
            <div className="border-t border-gray-200/50 p-6 bg-white/80 backdrop-blur-xl flex justify-between items-center z-10 shadow-sm">
                <div className="flex gap-4"></div>
                <div className="flex gap-3">
                    <button onClick={handleSaveOnly} disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm bg-white border-2 border-gray-200 text-text-muted hover:text-text-main hover:bg-gray-50 hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed">
                        {activeAction === 'saving' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} strokeWidth={2} />} Save Details
                    </button>
                    <button onClick={handleSaveAndDownload} disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-primary via-primary to-primary-dark text-white hover:shadow-xl shadow-soft disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105">
                        {activeAction === 'downloading' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} strokeWidth={2} />} Save & PDF
                    </button>
                    <div className="flex gap-3">
                        <button onClick={handleEmailClick} disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm bg-white border-2 border-gray-200 text-text-muted hover:text-text-main hover:bg-gray-50 hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed">
                            {activeAction === 'emailing' ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} strokeWidth={2} />} Email
                        </button>
                        <button onClick={handlePrint} disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm bg-white border-2 border-gray-200 text-text-muted hover:text-text-main hover:bg-gray-50 hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed">
                            {activeAction === 'printing' ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} strokeWidth={2} />} Print
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
