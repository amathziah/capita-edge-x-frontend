import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoiceState } from './hooks/useInvoiceState';
import { useInvoiceActions } from './hooks/useInvoiceActions';
import { usePersona } from '../../contexts/PersonaContext';
import { Invoice, InvoiceItem } from '../../types';
import { dataService } from '../../services/dataService';
import { CURRENCIES, TAX_LABELS, UNITS } from './constants';
import { numberToIndianWords } from './utils';
import { autoSuggestSac } from '../../lib/sacDatabase';
import { Toast } from '../Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, X, ChevronDown, User, Calendar, MapPin, 
    CreditCard, FileText, Mail, Search, Trash2, 
    Smartphone, Banknote
} from 'lucide-react';

/* ─── Interfaces ───────────────────────────────────────────────────────── */

interface InvoiceGeneratorProps {
    onClose?: () => void;
    editingInvoice?: Invoice;
    initialData?: Partial<Invoice>;
}

interface InputWrapperProps {
    label: string;
    children: React.ReactNode;
    error?: string;
    icon?: React.ElementType;
    required?: boolean;
}

interface SectionCardProps {
    title: string;
    children: React.ReactNode;
    icon?: React.ElementType;
    action?: React.ReactNode;
    className?: string;
}

/* ─── Shared Components ────────────────────────────────────────────────── */

const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) => (
    <div className="flex items-center gap-3">
        {label && <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>}
        <button
            type="button"
            onClick={() => onChange(!value)}
            className={`w-10 h-5 rounded-full relative transition-colors duration-200 focus:outline-none ${value ? 'bg-teal-500' : 'bg-gray-200'}`}
        >
            <motion.span
                animate={{ x: value ? 22 : 2 }}
                className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
            />
        </button>
    </div>
);

const ErrMsg = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] text-red-500 font-bold mt-1 block tracking-tight">{children}</span>
);

const InputWrapper = ({ label, children, error, icon: Icon, required }: InputWrapperProps) => (
    <div className="flex flex-col gap-1.5 w-full">
        <div className="flex justify-between items-center px-0.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 text-left">
                {Icon && <Icon size={12} className="text-teal-500/60" />}
                {label} {required && <span className="text-red-400">*</span>}
            </label>
        </div>
        <div className="relative group text-left">
            {children}
        </div>
        {error && <ErrMsg>{error}</ErrMsg>}
    </div>
);

const SectionCard = ({ title, children, icon: Icon, action, className = '' }: SectionCardProps) => (
    <div className={`bg-white/70 backdrop-blur-xl rounded-3xl border border-teal-100/60 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full ${className}`}>
        <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                    {Icon && <Icon size={14} />}
                </div>
                {title}
            </h3>
            {action}
        </div>
        <div className="space-y-5 flex-1">
            {children}
        </div>
    </div>
);

/* ─── Main Component ───────────────────────────────────────────────────── */

export default function InvoiceGenerator({ onClose, initialData, editingInvoice }: InvoiceGeneratorProps) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { businessType: _bt } = usePersona();
    const businessType = _bt ?? 'solopreneur';

    const [fetchedInvoice, setFetchedInvoice] = React.useState<Invoice | undefined>(editingInvoice);
    const [showNotes, setShowNotes] = React.useState(false);

    // ── Inline Add New Client Drawer ──
    const [showNewClientModal, setShowNewClientModal] = React.useState(false);
    const [savingNewClient, setSavingNewClient] = React.useState(false);
    const [newClientForm, setNewClientForm] = React.useState({
        name: '', contactName: '', email: '', phone: '',
        addressLine1: '', city: '', state: '', pincode: '', country: 'IN',
        gstin: '', tags: '', currency: 'INR', paymentTerms: 0,
    });
    const [pincodeLoading, setPincodeLoading] = React.useState(false);

    const openDrawer = () => setShowNewClientModal(true);
    const closeDrawer = () => setShowNewClientModal(false);

    const fetchPincode = async (pin: string) => {
        if (!/^\d{6}$/.test(pin)) return;
        setPincodeLoading(true);
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
            const data = await res.json();
            if (data?.[0]?.Status === 'Success') {
                const po = data[0].PostOffice[0];
                setNewClientForm(prev => ({ ...prev, city: po.District, state: po.State }));
            }
        } catch (error) {
            console.error("Pincode lookup failed", error);
        } finally { setPincodeLoading(false); }
    };

    const COUNTRY_OPTIONS = [
        { code: 'IN', label: 'India 🇮🇳' }, { code: 'US', label: 'United States 🇺🇸' },
        { code: 'GB', label: 'United Kingdom 🇬🇧' }, { code: 'AE', label: 'UAE 🇦🇪' },
        { code: 'SG', label: 'Singapore 🇸🇬' }, { code: 'AU', label: 'Australia 🇦🇺' },
        { code: 'CA', label: 'Canada 🇨🇦' }, { code: 'DE', label: 'Germany 🇩🇪' },
    ];
    const CURRENCY_OPTIONS = [
        { code: 'INR', label: 'INR (₹)' }, { code: 'USD', label: 'USD ($)' },
        { code: 'GBP', label: 'GBP (£)' }, { code: 'EUR', label: 'EUR (€)' },
        { code: 'AED', label: 'AED' }, { code: 'SGD', label: 'SGD' },
    ];
    const TERMS_OPTIONS = [
        { value: 0, label: 'Due on Receipt' }, { value: 7, label: 'Net 7 Days' },
        { value: 14, label: 'Net 14 Days' }, { value: 30, label: 'Net 30 Days' },
        { value: 45, label: 'Net 45 Days' }, { value: 60, label: 'Net 60 Days' },
    ];

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
        dispatchDate, setDispatchDate,
        items, setItems, taxRate, setTaxRate,
        subtotal, taxAmount, total,
        activeAction, loading,
        isEmailModalOpen, setIsEmailModalOpen, emailTo, setEmailTo,
        toast, setToast,
        sellerErrors, buyerErrors, headerErrors, itemErrors,
        clearErrors,
        isBuyerFocused, setIsBuyerFocused,
        customers,
    } = state;

    const updateItem = (idx: number, updates: Partial<InvoiceItem>) => {
        const next = [...items];
        next[idx] = { ...next[idx], ...updates };
        setItems(next);
    };

    const formatDate = (d: string) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    const handleSaveNewClient = async () => {
        if (!newClientForm.name || !newClientForm.email) {
            setToast({ message: 'Name and email are required', type: 'error' });
            return;
        }
        setSavingNewClient(true);
        try {
            const tagsArray = newClientForm.tags ? newClientForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
            const payload = {
                id: '',
                name: newClientForm.name,
                email: newClientForm.email,
                phone: newClientForm.phone,
                addressLine1: newClientForm.addressLine1,
                addressLine2: '',
                city: newClientForm.city,
                state: newClientForm.state,
                pincode: newClientForm.pincode,
                country: newClientForm.country,
                status: 'Active' as const,
                currency: newClientForm.currency,
                paymentTerms: newClientForm.paymentTerms,
                taxId: newClientForm.gstin,
                tags: tagsArray,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await dataService.saveCustomer(payload as any);
            const countryLabel = COUNTRY_OPTIONS.find(c => c.code === newClientForm.country)?.label?.split(' ')[0] || newClientForm.country;
            const combinedAddr = [newClientForm.addressLine1, newClientForm.city, newClientForm.state, newClientForm.pincode, countryLabel].filter(Boolean).join(', ');
            setBuyer({ name: newClientForm.name, address: combinedAddr, email: newClientForm.email, phone: newClientForm.phone, taxId: newClientForm.gstin });
            const savedName = newClientForm.name;
            closeDrawer();
            setNewClientForm({ name: '', contactName: '', email: '', phone: '', addressLine1: '', city: '', state: '', pincode: '', country: 'IN', gstin: '', tags: '', currency: 'INR', paymentTerms: 0 });
            setToast({ message: `Client "${savedName}" created & selected`, type: 'success' });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to save client';
            setToast({ message, type: 'error' });
        } finally {
            setSavingNewClient(false);
        }
    };

    const commonInputClass = "w-full bg-white/50 border border-teal-100/60 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/40 transition-all placeholder:text-gray-400 placeholder:font-normal";
    const selectClass = "w-full bg-white/50 border border-teal-100/60 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/40 transition-all appearance-none cursor-pointer";

    return (
        <div className="h-screen bg-gradient-to-br from-teal-50/50 via-white to-cyan-50/30 flex flex-col overflow-hidden text-left" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <AnimatePresence>
                {/* Email Modal */}
                {isEmailModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEmailModalOpen(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white rounded-3xl p-8 w-full max-sm shadow-2xl border border-teal-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Mail className="text-teal-500" size={20} />
                                Send Invoice
                            </h3>
                            <InputWrapper label="Recipient Email">
                                <input value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="client@example.com" className={commonInputClass} />
                            </InputWrapper>
                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <button onClick={() => setIsEmailModalOpen(false)} className="py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition">Cancel</button>
                                <button onClick={actions.handleSendEmail} disabled={loading} className="py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition disabled:opacity-50">
                                    {activeAction === 'emailing' ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Add New Client Drawer */}
                {showNewClientModal && (
                    <div className="fixed inset-0 z-[150] overflow-hidden flex justify-end">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-white shadow-2xl border-l border-teal-100 flex flex-col">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400 opacity-[0.04] blur-[100px] pointer-events-none rounded-full" />
                            
                            {/* Drawer Header */}
                            <div className="px-6 py-5 border-b border-teal-100/60 bg-white/40 flex justify-between items-center relative z-10">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <User size={18} className="text-teal-500" />
                                        Add New Client
                                    </h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Contact Registry</p>
                                </div>
                                <button onClick={closeDrawer} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 relative z-10 custom-scrollbar text-left">
                                <div className="p-5 bg-teal-50/30 rounded-2xl border border-teal-100/50 space-y-4">
                                    <InputWrapper label="Business Name" required>
                                        <input value={newClientForm.name} onChange={e => setNewClientForm({ ...newClientForm, name: e.target.value })} placeholder="Legal Entity Name" className={commonInputClass} />
                                    </InputWrapper>
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputWrapper label="Contact Name">
                                            <input value={newClientForm.contactName} onChange={e => setNewClientForm({ ...newClientForm, contactName: e.target.value })} placeholder="POC Name" className={commonInputClass} />
                                        </InputWrapper>
                                        <InputWrapper label="Email" required>
                                            <input type="email" value={newClientForm.email} onChange={e => setNewClientForm({ ...newClientForm, email: e.target.value })} placeholder="billing@email.com" className={commonInputClass} />
                                        </InputWrapper>
                                    </div>
                                    <InputWrapper label="Phone Number">
                                        <div className="flex bg-white/50 border border-teal-100/60 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500/40 transition-all">
                                            <div className="px-3 flex items-center bg-teal-50/50 border-r border-teal-100/60 text-sm font-bold text-gray-500">🇮🇳</div>
                                            <input type="tel" value={newClientForm.phone} onChange={e => setNewClientForm({ ...newClientForm, phone: e.target.value })} className="w-full bg-transparent px-4 py-2.5 text-sm font-semibold outline-none" placeholder="Mobile Number" />
                                        </div>
                                    </InputWrapper>
                                </div>

                                <div className="space-y-4">
                                    <InputWrapper label="Country" icon={MapPin}>
                                        <select value={newClientForm.country} onChange={e => setNewClientForm({ ...newClientForm, country: e.target.value, state: '', currency: e.target.value === 'IN' ? 'INR' : 'USD' })} className={selectClass}>
                                            {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                        </select>
                                    </InputWrapper>
                                    <InputWrapper label="Address">
                                        <textarea rows={3} value={newClientForm.addressLine1} onChange={e => setNewClientForm({ ...newClientForm, addressLine1: e.target.value })} placeholder="Street, Building, Area..." className={`${commonInputClass} resize-none`} />
                                    </InputWrapper>
                                    <div className="grid grid-cols-3 gap-3">
                                        <InputWrapper label="State"><input value={newClientForm.state} onChange={e => setNewClientForm({ ...newClientForm, state: e.target.value })} placeholder="State" className={commonInputClass} /></InputWrapper>
                                        <InputWrapper label="City"><input value={newClientForm.city} onChange={e => setNewClientForm({ ...newClientForm, city: e.target.value })} placeholder="City" className={commonInputClass} /></InputWrapper>
                                        <InputWrapper label={newClientForm.country === 'IN' ? 'Pin' : 'Zip'}>
                                            <div className="relative">
                                                <input value={newClientForm.pincode} onChange={e => { const val = e.target.value; setNewClientForm({ ...newClientForm, pincode: val }); if (newClientForm.country === 'IN' && val.length === 6) fetchPincode(val); }} placeholder="Code" className={commonInputClass} />
                                                {pincodeLoading && <div className="absolute right-3 top-2.5 animate-spin text-teal-500"><Smartphone size={14} /></div>}
                                            </div>
                                        </InputWrapper>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <InputWrapper label="Currency"><select value={newClientForm.currency} onChange={e => setNewClientForm({ ...newClientForm, currency: e.target.value })} className={selectClass}>{CURRENCY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select></InputWrapper>
                                    <InputWrapper label="Terms"><select value={newClientForm.paymentTerms} onChange={e => setNewClientForm({ ...newClientForm, paymentTerms: Number(e.target.value) })} className={selectClass}>{TERMS_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></InputWrapper>
                                </div>

                                <InputWrapper label="Tax ID (GSTIN)"><input value={newClientForm.gstin} onChange={e => setNewClientForm({ ...newClientForm, gstin: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="27ABCDE1234F1Z5" className={commonInputClass} /></InputWrapper>
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-6 border-t border-teal-100/60 bg-white/40 flex gap-3 relative z-10">
                                <button onClick={closeDrawer} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition">Discard</button>
                                <button onClick={handleSaveNewClient} disabled={savingNewClient} className="flex-2 px-8 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition disabled:opacity-50">
                                    {savingNewClient ? 'Saving...' : 'Save Client'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════ TOP HEADER ══════ */}
            <div className="relative h-20 bg-white/70 backdrop-blur-2xl border-b border-teal-100/60 flex items-center justify-between px-8 flex-shrink-0 z-50 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400 opacity-[0.05] blur-[100px] pointer-events-none rounded-full" />
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
                
                <div className="flex items-center gap-5 relative z-10">
                    <button onClick={handleClose} className="w-10 h-10 rounded-xl border border-teal-100 bg-white/80 flex items-center justify-center text-teal-600 hover:bg-teal-50 hover:border-teal-200 transition-all shadow-sm group">
                        <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                            {fetchedInvoice ? 'Edit Proforma' : 'Create New Invoice'}
                        </h1>
                        <p className="text-[10px] font-bold text-teal-600/70 uppercase tracking-widest mt-0.5">Financial Operations Control</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button onClick={handleClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">Discard</button>
                    <button onClick={actions.handleSaveOnly} disabled={loading} className="px-6 py-2.5 rounded-xl border border-teal-100 bg-white/80 text-sm font-bold text-teal-700 shadow-sm hover:bg-teal-50 transition-all">
                        {activeAction === 'saving' ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button onClick={actions.handleSaveAndDownload} disabled={loading} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-black shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        {activeAction === 'downloading' ? 'Generating...' : fetchedInvoice ? 'Update & Download' : 'Generate Proforma'}
                    </button>
                </div>
            </div>

            {/* ══════ MAIN BODY ══════ */}
            <div className="flex-1 flex overflow-hidden lg:grid lg:grid-cols-[1fr_420px]">
                
                {/* ──── LEFT: FORM SECTION ──── */}
                <div className="flex-1 overflow-y-auto p-6 xl:p-10 space-y-8 custom-scrollbar bg-white/30 backdrop-blur-sm text-left">
                    
                    {/* Header Controls: Currency & Tax */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <InputWrapper label="Currency">
                                    <select value={currency.code} onChange={e => setCurrency(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0])} className={selectClass}>
                                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                                    </select>
                                </InputWrapper>
                            </div>
                            <div className="flex-1">
                                <InputWrapper label="Taxation Type">
                                    <select value={taxLabel} onChange={e => setTaxLabel(e.target.value)} className={selectClass}>
                                        {TAX_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </InputWrapper>
                            </div>
                        </div>
                        <div className="flex justify-end items-end gap-3 pb-1">
                            <Toggle label="Notes" value={showNotes} onChange={setShowNotes} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Section: Client Details */}
                        <SectionCard title="Client Information" icon={User} className="relative z-[60]"
                                     action={<button type="button" onClick={openDrawer} className="text-[10px] font-black text-teal-600 hover:tracking-wider transition-all uppercase">+ New Client</button>}>
                            <InputWrapper label="Select Client" error={buyerErrors?.name} required>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors">
                                        <Search size={14} />
                                    </div>
                                    <input
                                        value={buyer.name || ''}
                                        onChange={e => { setBuyer({ ...buyer, name: e.target.value }); clearErrors(); }}
                                        onFocus={() => setIsBuyerFocused(true)}
                                        onBlur={() => setTimeout(() => setIsBuyerFocused(false), 200)}
                                        placeholder="Search or select client..."
                                        className={`${commonInputClass} pl-10`}
                                    />
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    
                                    <AnimatePresence>
                                        {isBuyerFocused && customers.length > 0 && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-teal-100/60 overflow-hidden z-[100] max-h-60 overflow-y-auto custom-scrollbar">
                                                <div className="px-4 py-2.5 bg-teal-50/50 border-b border-teal-100/60 flex justify-between items-center text-[10px] font-black text-teal-600 uppercase tracking-widest">
                                                    <span>Active Accounts</span>
                                                </div>
                                                {customers.filter(c => !buyer.name || c.name.toLowerCase().includes(buyer.name.toLowerCase())).slice(0, 8).map(customer => (
                                                    <button key={customer.id} onClick={() => {
                                                        const combinedAddr = [customer.addressLine1, customer.addressLine2, customer.city, customer.state, customer.pincode, customer.country].filter(Boolean).join(', ');
                                                        setBuyer({ name: customer.name, address: combinedAddr, email: customer.email || '', phone: customer.phone || '', taxId: customer.taxId || '' });
                                                        setIsBuyerFocused(false);
                                                    }} className="w-full px-5 py-3.5 text-left border-b border-gray-50 last:border-0 hover:bg-teal-50 transition-colors flex items-center justify-between group">
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 group-hover:text-teal-700 transition-colors">{customer.name}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5">{customer.email || 'No contact email'}</p>
                                                        </div>
                                                        <Plus size={14} className="text-gray-300 group-hover:text-teal-400" />
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </InputWrapper>
                            <div className="grid grid-cols-2 gap-4">
                                <InputWrapper label="Invoice ID">
                                    <input value={meta.number || ''} disabled className={`${commonInputClass} opacity-60 bg-gray-50/50 cursor-not-allowed`} />
                                </InputWrapper>
                                <InputWrapper label="GST Identification (Client)">
                                    <input value={buyer.taxId || ''} onChange={e => setBuyer({ ...buyer, taxId: e.target.value.toUpperCase() })} placeholder="GSTIN" className={commonInputClass} />
                                </InputWrapper>
                            </div>
                        </SectionCard>

                        {/* Section: Schedule */}
                        <SectionCard title="Invoice Schedule" icon={Calendar}>
                            <div className="grid grid-cols-2 gap-4">
                                <InputWrapper label="Issue Date" icon={Calendar} error={headerErrors?.date} required>
                                    <input type="date" value={meta.date || ''} onChange={e => setMeta({ ...meta, date: e.target.value })} className={commonInputClass} />
                                </InputWrapper>
                                <InputWrapper label="Due Date" icon={Calendar}>
                                    <input type="date" value={meta.dueDate || ''} onChange={e => setMeta({ ...meta, dueDate: e.target.value })} className={commonInputClass} />
                                </InputWrapper>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {(businessType === 'services_firm' || businessType === 'solopreneur') && (
                                    <InputWrapper label="Project Reference (Optional)">
                                        <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Project Alpha Release" className={commonInputClass} />
                                    </InputWrapper>
                                )}
                                {(businessType === 'ecommerce' || businessType === 'subscription') && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputWrapper label="Order / Ref #">
                                            <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="ORD-9981" className={commonInputClass} />
                                        </InputWrapper>
                                        <InputWrapper label="Dispatch Date">
                                            <input type="date" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} className={commonInputClass} />
                                        </InputWrapper>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>

                    {/* Section: Service Items */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-teal-100/60 overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-teal-100/60 bg-teal-50/20 flex justify-between items-center">
                            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                                    <Plus size={16} strokeWidth={3} />
                                </div>
                                Line Items & Services
                            </h3>
                            <button onClick={() => setItems([...items, { description: '', quantity: 1, unit: businessType === 'solopreneur' ? 'Service' : 'Qty', price: undefined, discount: 0, sac_code: '', tax_rate: 18, is_exempt: false }])} className="px-4 py-2 rounded-xl border border-teal-200 bg-white text-xs font-black text-teal-600 hover:bg-teal-50 transition-all shadow-sm">
                                Add Row
                            </button>
                        </div>
                        
                        <div className="p-1 overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead className="bg-gray-50/30 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-teal-100/60">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Description</th>
                                        {businessType !== 'solopreneur' && <th className="px-6 py-3 text-center w-24">Unit</th>}
                                        <th className="px-6 py-3 text-center w-24">Qty</th>
                                        <th className="px-6 py-3 text-right w-32">Price</th>
                                        {businessType !== 'solopreneur' && <th className="px-6 py-3 text-center w-20">Disc%</th>}
                                        <th className="px-6 py-3 text-right w-32">Amount</th>
                                        <th className="px-6 py-3 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-teal-50/50">
                                    {items.map((item, idx) => {
                                        const lineAmt = (item.quantity || 0) * (item.price || 0) * (1 - (item.discount || 0) / 100);
                                        return (
                                            <tr key={idx} className="group hover:bg-teal-50/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <input
                                                            value={item.description || ''}
                                                            onChange={e => {
                                                                const v = e.target.value; const sug = autoSuggestSac(v);
                                                                if (sug && !item.sac_code) { updateItem(idx, { description: v, sac_code: sug.sacCode, tax_rate: sug.entry.gstRate, is_exempt: sug.entry.isExempt }); }
                                                                else { updateItem(idx, { description: v }); }
                                                            }}
                                                            placeholder="Consulting Fee..."
                                                            className="w-full bg-transparent border-none outline-none font-bold text-sm text-gray-900 placeholder:font-normal placeholder:text-gray-300"
                                                        />
                                                        {item.sac_code && <span className="text-[9px] font-black text-teal-600 block bg-teal-50/50 px-1.5 py-0.5 rounded border border-teal-100 w-fit mt-1">SAC {item.sac_code}</span>}
                                                        {itemErrors?.[idx] && <ErrMsg>{itemErrors[idx]}</ErrMsg>}
                                                    </div>
                                                </td>
                                                {businessType !== 'solopreneur' && (
                                                    <td className="px-4 py-4">
                                                        <select value={item.unit || 'Qty'} onChange={e => updateItem(idx, { unit: e.target.value })} className="w-full bg-transparent text-center text-xs font-bold text-gray-500 outline-none">
                                                            {UNITS.map(u => <option key={u}>{u}</option>)}
                                                        </select>
                                                    </td>
                                                )}
                                                <td className="px-4 py-4">
                                                    <input type="number" value={item.quantity || 1} onChange={e => updateItem(idx, { quantity: Number(e.target.value) })} className="w-full bg-transparent text-center font-bold text-sm text-gray-700 outline-none" />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input type="number" value={item.price ?? ''} onChange={e => updateItem(idx, { price: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="0.00" className="w-full bg-transparent text-right font-black text-sm text-gray-900 outline-none" />
                                                </td>
                                                {businessType !== 'solopreneur' && (
                                                    <td className="px-4 py-4">
                                                        <input type="number" value={item.discount ?? ''} onChange={e => updateItem(idx, { discount: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full bg-transparent text-center text-xs font-bold text-gray-400 outline-none" />
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-black text-sm text-gray-900">{currency.symbol}{lineAmt.toLocaleString()}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-400 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Section: Your Business */}
                        <SectionCard title="Billing From" icon={Banknote}>
                            <div className="grid grid-cols-1 gap-4">
                                <InputWrapper label="Legal Entity Name" required error={sellerErrors?.name}>
                                    <input value={seller.name || ''} onChange={e => setSeller({ ...seller, name: e.target.value })} className={commonInputClass} />
                                </InputWrapper>
                                <InputWrapper label="Address & Registration">
                                    <textarea rows={2} value={seller.address || ''} onChange={e => setSeller({ ...seller, address: e.target.value })} className={`${commonInputClass} resize-none`} />
                                </InputWrapper>
                            </div>
                        </SectionCard>

                        {/* Section: Additional Details */}
                        <SectionCard title="Additional Context" icon={FileText}>
                             <div className="space-y-4">
                                {showNotes && (
                                    <InputWrapper label="Internal Notes & Footers">
                                        <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Bank details, terms, etc." className={`${commonInputClass} resize-none`} />
                                    </InputWrapper>
                                )}
                                <div className="flex items-center justify-between p-4 bg-teal-50/20 rounded-2xl border border-teal-100/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg border border-teal-100/60 shadow-sm">
                                            <CreditCard size={14} className="text-teal-600" />
                                        </div>
                                        <span className="text-[11px] font-black text-gray-600 uppercase tracking-wider">GST Registered</span>
                                    </div>
                                    <Toggle value={isGstRegistered} onChange={v => { setIsGstRegistered(v); setTaxRate(v ? 18 : 0); }} />
                                </div>
                             </div>
                        </SectionCard>
                    </div>

                </div>

                {/* ──── RIGHT: LIVE PREVIEW ──── */}
                <div className="hidden lg:flex flex-col bg-teal-50/20 border-l border-teal-100/60 relative overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400 opacity-[0.04] blur-[120px] pointer-events-none rounded-full" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-400 opacity-[0.04] blur-[120px] pointer-events-none rounded-full" />
                    
                    <div className="px-8 py-5 border-b border-teal-100/60 flex justify-between items-center bg-white/40 backdrop-blur-md relative z-10">
                        <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center gap-2">
                            <Smartphone size={12} />
                            Real-time Rendering
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10 flex justify-center items-start overflow-x-hidden">
                        {/* THE DOCUMENT */}
                        <div className="w-full max-w-[400px] bg-white rounded-[2rem] border border-teal-100/60 shadow-[0_20px_50px_rgba(20,184,166,0.1)] overflow-hidden scale-[0.85] origin-top">
                            {/* Branding Info */}
                            <div className="p-8 bg-gradient-to-br from-teal-500 to-teal-700 text-white flex justify-between items-start">
                                <div className="text-left">
                                    <h2 className="text-2xl font-black tracking-tighter">PROFORMA</h2>
                                    <p className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-[0.2em]">{meta.number || 'P-0001'}</p>
                                </div>
                                {logo ? (
                                    <img src={logo} alt="logo" className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md p-1 object-contain" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-xl italic text-white/40">
                                        M
                                    </div>
                                )}
                            </div>

                            <div className="p-8 space-y-8 text-left">
                                {/* Bill To/From */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="text-left">
                                        <h4 className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-2">Billed To</h4>
                                        <p className="text-xs font-black text-gray-900 leading-tight">{buyer.name || 'Untitled Client'}</p>
                                        <p className="text-[10px] text-gray-400 font-medium mt-1 leading-relaxed line-clamp-3">{buyer.address || 'Address pending'}</p>
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-2">Issue Date</h4>
                                        <p className="text-xs font-black text-gray-900">{formatDate(meta.date || '')}</p>
                                        <h4 className="text-[9px] font-black text-teal-600 uppercase tracking-widest mt-4 mb-2">Due Date</h4>
                                        <p className="text-xs font-black text-gray-900">{formatDate(meta.dueDate || '')}</p>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b-2 border-gray-900 pb-2 text-[10px] font-black uppercase tracking-widest">
                                        <span>Description</span>
                                        <span>Amount</span>
                                    </div>
                                    <div className="space-y-3">
                                        {items.length === 0 ? (
                                            <div className="py-4 border-b border-gray-50 flex justify-between items-center opacity-30">
                                                <span className="text-[11px] italic">Sample Line Item #1</span>
                                                <span className="font-bold text-xs">{currency.symbol}0.00</span>
                                            </div>
                                        ) : items.map((item, idx) => {
                                            const amt = (item.quantity || 0) * (item.price || 0) * (1 - (item.discount || 0) / 100);
                                            return (
                                                <div key={idx} className="flex justify-between items-start pt-1">
                                                    <div className="max-w-[180px] text-left">
                                                        <p className="text-[11px] font-bold text-gray-900">{item.description || 'Untitled Service'}</p>
                                                        {item.quantity > 1 && <p className="text-[9px] text-teal-600 font-bold mt-0.5">{item.quantity} units</p>}
                                                    </div>
                                                    <span className="font-black text-xs text-gray-900">{currency.symbol}{amt.toLocaleString()}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="border-t-2 border-gray-900/5 pt-6 space-y-2 text-left">
                                    <div className="flex justify-between text-[11px] font-bold text-gray-400">
                                        <span>Subtotal</span>
                                        <span>{currency.symbol}{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-black text-teal-600">
                                        <span>Taxation ({taxRate}%)</span>
                                        <span>{currency.symbol}{taxAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-4 pb-2">
                                        <span className="text-xs font-black text-gray-900 uppercase">Grand Total</span>
                                        <span className="text-2xl font-black text-gray-900 tracking-tighter">{currency.symbol}{total.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Words */}
                                {currency.code === 'INR' && total > 0 && (
                                    <div className="pt-2 text-left">
                                        <p className="text-[8px] font-black text-teal-600/50 uppercase tracking-[0.2em] mb-1">Total in words</p>
                                        <p className="text-[10px] font-bold italic text-gray-400 leading-tight">
                                            {numberToIndianWords(total)} Only
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer Art */}
                            <div className="mt-8 relative overflow-hidden h-24 flex items-center justify-center">
                                <div className="absolute inset-0 bg-teal-50 group-hover:bg-teal-100/50 transition-colors" />
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal-200 to-transparent" />
                                <p className="text-[10px] font-black text-teal-900/20 uppercase tracking-[0.5em] relative z-10">Edge Flow Financial</p>
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-teal-400 opacity-20 blur-3xl rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
