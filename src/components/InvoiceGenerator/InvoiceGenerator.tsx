import React from "react";
import {
    Download, Printer, X, Settings, Mail, Loader2, Save, AlertCircle
} from "lucide-react";
import { Toast } from '../Toast';
import { Invoice, InvoiceItem } from '../../types';
import { usePersona } from "../../contexts/PersonaContext";

// ─── Local Modules ─────────────────────────────────────────────────────
import { CURRENCIES, TAX_LABELS, InvoiceMeta, Buyer } from './constants';
import InputField from './InputField';

// ─── Hooks ─────────────────────────────────────────────────────────────
import { useInvoiceState } from './hooks/useInvoiceState';
import { useInvoiceActions } from './hooks/useInvoiceActions';

// ─── Section Components ────────────────────────────────────────────────
import InvoiceHeader from './sections/InvoiceHeader';
import SellerSection from './sections/SellerSection';
import BuyerSection from './sections/BuyerSection';
import ItemsTable from './sections/ItemsTable';
import NotesAndExtrasSection from './sections/NotesAndExtrasSection';
import TotalsSection from './sections/TotalsSection';
import CompliancePanel from './sections/CompliancePanel';

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

    // ─── Hooks ─────────────────────────────────────────────────────────
    const state = useInvoiceState({ businessType, editingInvoice, initialData });
    const actions = useInvoiceActions(state, onClose);

    const {
        currency, setCurrency, taxLabel, setTaxLabel, logo,
        seller, setSeller, buyer, setBuyer, notes, setNotes, meta, setMeta,
        projectName, setProjectName, shippingAddress, setShippingAddress,
        orderNumber, setOrderNumber,
        isGstRegistered, setIsGstRegistered,
        isInterState, setIsInterState,
        authorizedSignatory, setAuthorizedSignatory,
        placeOfSupply, setPlaceOfSupply, reverseCharge, setReverseCharge,
        deliveryState, setDeliveryState, dispatchDate, setDispatchDate,
        courierTracking, setCourierTracking,
        items, setItems, taxRate, setTaxRate, shipping, setShipping,
        tdsEnabled, tdsRate,
        subtotal, taxAmount, total, tdsAmount, netReceivable, totalCgst, totalSgst, totalIgst, resolvedGstType,
        activeAction, loading,
        isEmailModalOpen, setIsEmailModalOpen, emailTo, setEmailTo,
        toast, setToast, showToast,
        sellerErrors, buyerErrors, headerErrors, itemErrors,
        clearErrors,
        products, focusedItemIndex, setFocusedItemIndex,
        customers, isBuyerFocused, setIsBuyerFocused,
        bottomRef,
    } = state;

    // TDS amount is now computed by the state hook's financial engine

    const {
        handleLogoUpload, handleSaveAndDownload, handleSaveOnly,
        handlePrint, handleEmailClick, handleSendEmail,
    } = actions;

    // ═══════════════════════════════════════════════════════════════════
    //  Render
    // ═══════════════════════════════════════════════════════════════════
    return (
        <div className="bg-gradient-to-br from-white via-gray-50/30 to-primary-light/10 w-full h-full p-0 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col border border-gray-100/50 relative overflow-hidden font-sans text-text-main backdrop-blur-xl">

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
                    taxRate={taxRate} itemErrors={itemErrors}
                />

                {/* ─── Notes, Courier, Signatory, UPI ─── */}
                <NotesAndExtrasSection
                    businessType={businessType} notes={notes} setNotes={setNotes}
                    courierTracking={courierTracking} setCourierTracking={setCourierTracking}
                    authorizedSignatory={authorizedSignatory} setAuthorizedSignatory={setAuthorizedSignatory}
                    seller={seller}
                />

                <CompliancePanel
                    resolvedGstType={state.resolvedGstType}
                    tdsEnabled={state.tdsEnabled}
                    tdsRate={state.tdsRate}
                    tdsSection="194J"
                    grandTotal={state.total}
                    tdsAmount={state.tdsAmount}
                    netReceivable={state.netReceivable}
                    is44ADA={
                        state.businessType === 'solopreneur' ||
                        state.businessType === 'services_firm' ||
                        (state.businessType as string) === 'ca_firm' ||
                        state.businessType === 'ca'
                    }
                    hasNilRatedItems={state.items.some(i => i.is_exempt === true)}
                    persona={state.businessType}
                    isLutActive={!!state.lutNumber}
                    isReverseCharge={state.reverseCharge}
                />

                {/* ─── Totals ─── */}
                <TotalsSection
                    businessType={businessType} currency={currency}
                    subtotal={subtotal} taxAmount={taxAmount} taxRate={taxRate} setTaxRate={setTaxRate}
                    taxLabel={taxLabel} shipping={shipping} setShipping={setShipping} total={total}
                    isGstRegistered={isGstRegistered}
                    tdsEnabled={tdsEnabled} tdsAmount={tdsAmount} tdsRate={tdsRate}
                    netReceivable={netReceivable}
                    totalCgst={totalCgst} totalSgst={totalSgst} totalIgst={totalIgst}
                    resolvedGstType={resolvedGstType}
                    reverseCharge={reverseCharge} placeOfSupply={placeOfSupply}
                />

                <div ref={bottomRef as React.RefObject<HTMLDivElement>} />
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
