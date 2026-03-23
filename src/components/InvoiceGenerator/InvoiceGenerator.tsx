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

/* ─── Shared Styles ──────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid #e5e7eb', borderRadius: 8,
    padding: '10px 12px', fontSize: 14, fontWeight: 500, color: '#111827',
    outline: 'none', background: 'white', boxSizing: 'border-box',
};

const dateInputStyle: React.CSSProperties = {
    ...inputStyle, cursor: 'pointer',
};

const sectionCard: React.CSSProperties = {
    background: 'white', borderRadius: 12, border: '1px solid #e5e7eb',
    padding: '20px 24px', marginBottom: 16,
};

const sectionTitle: React.CSSProperties = {
    fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px',
};

const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, display: 'block',
};

const toggleRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 24px', background: 'white', borderRadius: 12,
    border: '1px solid #e5e7eb', marginBottom: 16,
};

/* ─── Small Components ────────────────────────────────────────────────── */

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button type="button" onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: value ? '#1D9E75' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: value ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s', display: 'block' }} />
    </button>
);

const ErrMsg = ({ children }: { children: React.ReactNode }) => (
    <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, display: 'block', marginTop: 4 }}>{children}</span>
);

/* ─── Props ───────────────────────────────────────────────────────────── */
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
    const [showNotes, setShowNotes] = React.useState(false);

    // ── Inline Add New Client (same drawer as Customers page) ──
    const [showNewClientModal, setShowNewClientModal] = React.useState(false);
    const [savingNewClient, setSavingNewClient] = React.useState(false);
    const [newClientForm, setNewClientForm] = React.useState({
        name: '', contactName: '', email: '', phone: '',
        addressLine1: '', city: '', state: '', pincode: '', country: 'IN',
        gstin: '', tags: '', currency: 'INR', paymentTerms: 0,
    });
    const [pincodeLoading, setPincodeLoading] = React.useState(false);
    const [drawerAnimating, setDrawerAnimating] = React.useState(false);

    const openDrawer = () => { setShowNewClientModal(true); requestAnimationFrame(() => setDrawerAnimating(true)); };
    const closeDrawer = () => { setDrawerAnimating(false); setTimeout(() => setShowNewClientModal(false), 300); };

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
        } catch { } finally { setPincodeLoading(false); }
    };

    const COUNTRY_OPTIONS = [
        { code: 'IN', label: 'India 🇮🇳' }, { code: 'US', label: 'United States 🇺🇸' },
        { code: 'GB', label: 'United Kingdom 🇬🇧' }, { code: 'AE', label: 'UAE 🇦🇪' },
        { code: 'SG', label: 'Singapore 🇸🇬' }, { code: 'AU', label: 'Australia 🇦🇺' },
        { code: 'CA', label: 'Canada 🇨🇦' }, { code: 'DE', label: 'Germany 🇩🇪' },
    ];
    const CURRENCY_OPTIONS = [
        { code: 'INR', label: 'INR — Indian Rupee (₹)' }, { code: 'USD', label: 'USD — US Dollar ($)' },
        { code: 'GBP', label: 'GBP — Pound (£)' }, { code: 'EUR', label: 'EUR — Euro (€)' },
        { code: 'AED', label: 'AED — Dirham' }, { code: 'SGD', label: 'SGD — Singapore Dollar' },
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

    const { handleLogoUpload } = actions;

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
        } catch (err: any) {
            setToast({ message: err.message || 'Failed to save client', type: 'error' });
        } finally {
            setSavingNewClient(false);
        }
    };

    // Drawer field styles
    const dLabel: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, marginLeft: 2 };
    const dInput: React.CSSProperties = { width: '100%', padding: '10px 14px', background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#1f2937', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };
    const dSelect: React.CSSProperties = { ...dInput, cursor: 'pointer', appearance: 'none' as const };

    return (
        <div style={{
            display: 'grid', gridTemplateRows: 'auto 1fr',
            height: '100%', overflow: 'hidden',
            background: '#f9fafb', borderRadius: 12,
        }}>

            {/* Email Modal */}
            {isEmailModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 20px', color: '#111827' }}>Send Invoice</h3>
                        <label style={labelStyle}>RECIPIENT EMAIL</label>
                        <input value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="client@example.com" style={{ ...inputStyle, marginBottom: 20 }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <button onClick={() => setIsEmailModalOpen(false)} style={{ padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#6b7280' }}>Cancel</button>
                            <button onClick={actions.handleSendEmail} disabled={loading} style={{ padding: 12, borderRadius: 10, border: 'none', background: '#1D9E75', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                                {activeAction === 'emailing' ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* ═══ ADD NEW CLIENT — Slide-in Drawer (same as Customers page) ═══ */}
            {showNewClientModal && (<>
                {/* Backdrop */}
                <div onClick={closeDrawer} style={{
                    position: 'fixed', inset: 0, zIndex: 110,
                    background: drawerAnimating ? 'rgba(15,23,42,0.1)' : 'transparent',
                    backdropFilter: drawerAnimating ? 'blur(2px)' : 'none',
                    transition: 'all 0.3s ease',
                }} />

                {/* Drawer panel */}
                <div style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 560,
                    background: 'white', zIndex: 120, display: 'flex', flexDirection: 'column',
                    borderLeft: '1px solid rgba(20,184,166,0.08)',
                    boxShadow: drawerAnimating ? '-20px 0 60px rgba(0,0,0,0.08)' : 'none',
                    transform: drawerAnimating ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid #f3f4f6', background: '#fafbfc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <button onClick={closeDrawer} style={{
                                width: 34, height: 34, borderRadius: '50%', border: '1px solid #e5e7eb', background: 'transparent',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 16,
                            }}>←</button>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Add New Client</h2>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', display: 'inline-block' }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Active</span>
                        </div>
                    </div>

                    {/* Body — scrollable */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Client Details Card */}
                        <div style={{ background: 'white', border: '1px solid #f0fdfa', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 16, color: '#1D9E75' }}>👤</span> Client Details
                                </h3>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#1D9E75', cursor: 'pointer' }}>Auto-Fill from GSTIN</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={dLabel}>Client Billing Name <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input value={newClientForm.name} onChange={e => setNewClientForm({ ...newClientForm, name: e.target.value })}
                                        placeholder="Legal Business Name" style={dInput} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div>
                                        <label style={dLabel}>Contact Name</label>
                                        <input value={newClientForm.contactName} onChange={e => setNewClientForm({ ...newClientForm, contactName: e.target.value })}
                                            placeholder="POC Name" style={dInput} />
                                    </div>
                                    <div>
                                        <label style={dLabel}>Email <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input type="email" value={newClientForm.email} onChange={e => setNewClientForm({ ...newClientForm, email: e.target.value })}
                                            placeholder="billing@email.com" style={dInput} />
                                    </div>
                                </div>
                                <div>
                                    <label style={dLabel}>Phone Number</label>
                                    <div style={{ display: 'flex' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 12px', background: '#f9fafb', border: '1px solid #f3f4f6', borderRight: 'none', borderRadius: '12px 0 0 12px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                                            <span>🇮🇳</span>
                                            <span style={{ fontSize: 10, color: '#9ca3af' }}>⇅</span>
                                        </div>
                                        <input type="tel" value={newClientForm.phone} onChange={e => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                                            style={{ ...dInput, borderRadius: '0 12px 12px 0', flex: 1 }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Billing Address Card */}
                        <div style={{ background: 'white', border: '1px solid #f0fdfa', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 16, color: '#1D9E75' }}>📍</span> Billing Address
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={dLabel}>Country</label>
                                    <select value={newClientForm.country}
                                        onChange={e => setNewClientForm({ ...newClientForm, country: e.target.value, state: '', currency: e.target.value === 'IN' ? 'INR' : 'USD' })}
                                        style={dSelect}>
                                        {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={dLabel}>Address <span style={{ color: '#ef4444' }}>*</span></label>
                                    <textarea rows={3} value={newClientForm.addressLine1}
                                        onChange={e => setNewClientForm({ ...newClientForm, addressLine1: e.target.value })}
                                        placeholder="Street, Building, Area..."
                                        style={{ ...dInput, resize: 'none' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={dLabel}>State</label>
                                        <input value={newClientForm.state} onChange={e => setNewClientForm({ ...newClientForm, state: e.target.value })}
                                            placeholder="State" style={dInput} />
                                    </div>
                                    <div>
                                        <label style={dLabel}>City</label>
                                        <input value={newClientForm.city} onChange={e => setNewClientForm({ ...newClientForm, city: e.target.value })}
                                            placeholder="City" style={dInput} />
                                    </div>
                                    <div>
                                        <label style={dLabel}>{newClientForm.country === 'IN' ? 'Pin' : 'Zip'}</label>
                                        <div style={{ position: 'relative' }}>
                                            <input value={newClientForm.pincode}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setNewClientForm({ ...newClientForm, pincode: val });
                                                    if (newClientForm.country === 'IN' && val.length === 6) fetchPincode(val);
                                                }}
                                                placeholder={newClientForm.country === 'IN' ? '6 digits' : 'ZIP'} style={dInput} />
                                            {pincodeLoading && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#1D9E75' }}>⟳</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Billing Options */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div style={{ background: 'white', border: '1px solid #f0fdfa', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                <label style={dLabel}>Currency</label>
                                <select value={newClientForm.currency}
                                    onChange={e => setNewClientForm({ ...newClientForm, currency: e.target.value })}
                                    style={dSelect}>
                                    {CURRENCY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                </select>
                            </div>
                            <div style={{ background: 'white', border: '1px solid #f0fdfa', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                <label style={dLabel}>Terms</label>
                                <select value={newClientForm.paymentTerms}
                                    onChange={e => setNewClientForm({ ...newClientForm, paymentTerms: Number(e.target.value) })}
                                    style={dSelect}>
                                    {TERMS_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* GSTIN */}
                        <div style={{ background: 'white', border: '1px solid #f0fdfa', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <label style={dLabel}>GSTIN</label>
                            <input value={newClientForm.gstin}
                                onChange={e => setNewClientForm({ ...newClientForm, gstin: e.target.value.toUpperCase().replace(/\s/g, '') })}
                                placeholder="27ABCDE1234F1Z5" style={dInput} />
                        </div>

                        {/* Tags */}
                        <div style={{ background: 'white', border: '1px solid #f0fdfa', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <label style={dLabel}>Tags</label>
                            <input value={newClientForm.tags}
                                onChange={e => setNewClientForm({ ...newClientForm, tags: e.target.value })}
                                placeholder="VIP, Regular..." style={dInput} />
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '16px 28px', borderTop: '1px solid #f3f4f6', background: 'white',
                        display: 'flex', justifyContent: 'flex-end', gap: 10,
                        boxShadow: '0 -4px 20px rgba(0,0,0,0.03)',
                    }}>
                        <button onClick={closeDrawer}
                            style={{ padding: '10px 22px', borderRadius: 12, border: '1px solid #e5e7eb', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>
                            Discard
                        </button>
                        <button onClick={handleSaveNewClient} disabled={savingNewClient}
                            style={{ padding: '10px 28px', borderRadius: 12, border: 'none', background: '#1D9E75', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: savingNewClient ? 0.6 : 1, boxShadow: '0 4px 14px rgba(29,158,117,0.2)' }}>
                            {savingNewClient ? 'Saving...' : 'Save Client'}
                        </button>
                    </div>
                </div>
            </>)}

            {/* ══════ TOP BAR ══════ */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 28px', background: 'white',
                borderBottom: '1px solid #e5e7eb', flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button onClick={handleClose} style={{
                        width: 36, height: 36, borderRadius: 8, border: '1px solid #e5e7eb',
                        background: 'transparent', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: 18,
                    }}>←</button>
                    <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>
                        {fetchedInvoice ? 'Edit Invoice' : 'Create New Invoice'}
                    </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={handleClose}
                        style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                        Discard Changes
                    </button>
                    <button onClick={actions.handleSaveOnly} disabled={loading}
                        style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151', opacity: loading ? 0.6 : 1 }}>
                        {activeAction === 'saving' ? '...' : 'Save as Draft'}
                    </button>
                    <button onClick={actions.handleSaveAndDownload} disabled={loading}
                        style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151', opacity: loading ? 0.6 : 1 }}>
                        {activeAction === 'downloading' ? '...' : 'Create as Proforma'}
                    </button>
                    <button onClick={actions.handleSaveOnly} disabled={loading}
                        style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#1D9E75', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: loading ? 0.6 : 1 }}>
                        {activeAction === 'saving' ? '...' : 'Create Invoice'}
                    </button>
                </div>
            </div>

            {/* ══════ BODY: Left Form + Right Preview ══════ */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 420px',
                overflow: 'hidden', minHeight: 0,
            }}>

                {/* ──── LEFT: Form ──── */}
                <div style={{ overflowY: 'auto', padding: '24px 28px' }}>

                    {/* Section: Client + Invoice ID */}
                    <div style={sectionCard}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div>
                                <label style={labelStyle}>Client</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <span style={{ color: '#9ca3af', fontSize: 16 }}>👤</span>
                                        <input
                                            value={buyer.name || ''}
                                            onChange={e => { setBuyer({ ...buyer, name: e.target.value }); clearErrors(); }}
                                            onFocus={() => setIsBuyerFocused(true)}
                                            onBlur={() => setTimeout(() => setIsBuyerFocused(false), 200)}
                                            placeholder="Select a client"
                                            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, fontWeight: 500, color: '#111827', background: 'transparent' }}
                                        />
                                        <span style={{ color: '#9ca3af' }}>▾</span>
                                    </div>
                                    {buyerErrors?.name && <ErrMsg>{buyerErrors.name}</ErrMsg>}

                                    {isBuyerFocused && customers.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb', maxHeight: 200, overflowY: 'auto', zIndex: 100, marginTop: 4 }}>
                                            <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', borderBottom: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>EXISTING CLIENTS</span>
                                                <button type="button" onClick={() => { setIsBuyerFocused(false); openDrawer(); }} style={{ color: '#1D9E75', background: 'transparent', border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>+ ADD NEW</button>
                                            </div>
                                            {customers.filter(c => !buyer.name || c.name.toLowerCase().includes(buyer.name.toLowerCase())).slice(0, 8).map(customer => (
                                                <button key={customer.id} onClick={() => {
                                                    const combinedAddr = [customer.addressLine1, customer.addressLine2, customer.city, customer.state, customer.pincode, customer.country].filter(Boolean).join(', ');
                                                    setBuyer({ name: customer.name, address: combinedAddr, email: customer.email || '', phone: customer.phone || '', taxId: customer.taxId || '' });
                                                    setIsBuyerFocused(false);
                                                }}
                                                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{customer.name}</div>
                                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{customer.email || 'No email'}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Invoice ID</label>
                                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input value={meta.number || ''} readOnly
                                        style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, fontWeight: 500, color: '#111827', background: 'transparent' }} />
                                    <span style={{ color: '#9ca3af', cursor: 'pointer', fontSize: 14 }}>✏️</span>
                                </div>
                            </div>
                        </div>

                        {/* Dates row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
                            <div>
                                <label style={labelStyle}>Invoice Date</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="date" value={meta.date || ''} onChange={e => setMeta({ ...meta, date: e.target.value })} style={dateInputStyle} />
                                    {headerErrors?.date && <ErrMsg>{headerErrors.date}</ErrMsg>}
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Due Date</label>
                                <input type="date" value={meta.dueDate || ''} onChange={e => setMeta({ ...meta, dueDate: e.target.value })} style={dateInputStyle} />
                            </div>
                        </div>

                        {/* Persona-specific fields */}
                        {(businessType === 'services_firm' || businessType === 'ecommerce' || businessType === 'subscription') && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
                                {businessType === 'services_firm' && (
                                    <div>
                                        <label style={labelStyle}>Project Name</label>
                                        <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Website Redesign" style={inputStyle} />
                                    </div>
                                )}
                                {(businessType === 'ecommerce' || businessType === 'subscription') && (
                                    <div>
                                        <label style={labelStyle}>Order / Ref #</label>
                                        <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="ORD-9981" style={inputStyle} />
                                    </div>
                                )}
                                {businessType === 'ecommerce' && (
                                    <div>
                                        <label style={labelStyle}>Dispatch Date</label>
                                        <input type="date" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} style={dateInputStyle} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Currency + Tax row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
                            <div>
                                <label style={labelStyle}>Currency</label>
                                <select value={currency.code} onChange={e => setCurrency(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0])} style={inputStyle}>
                                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Tax Type</label>
                                <select value={taxLabel} onChange={e => setTaxLabel(e.target.value)} style={inputStyle}>
                                    {TAX_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section: From / To Details */}
                    <div style={sectionCard}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            {/* FROM */}
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#1D9E75', letterSpacing: '0.05em', margin: '0 0 12px', textTransform: 'uppercase' }}>From (Your Details)</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div>
                                        <label style={labelStyle}>Business Name *</label>
                                        <input value={seller.name || ''} onChange={e => { setSeller({ ...seller, name: e.target.value }); clearErrors(); }}
                                            placeholder={businessType === 'solopreneur' ? 'Your Name / Studio' : 'Your Business Name'} style={inputStyle} />
                                        {sellerErrors?.name && <ErrMsg>{sellerErrors.name}</ErrMsg>}
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Address</label>
                                        <textarea rows={2} value={seller.address || ''} onChange={e => setSeller({ ...seller, address: e.target.value })}
                                            placeholder="Business Address" style={{ ...inputStyle, resize: 'none' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label style={labelStyle}>Email</label>
                                            <input value={seller.email || ''} onChange={e => setSeller({ ...seller, email: e.target.value })} placeholder="Email" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Phone</label>
                                            <input value={seller.phone || ''} onChange={e => setSeller({ ...seller, phone: e.target.value })} placeholder="Phone" style={inputStyle} />
                                        </div>
                                    </div>
                                    {businessType === 'solopreneur' && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', borderRadius: 8, padding: '8px 12px', border: '1px solid #e5e7eb' }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>GST Registered?</span>
                                            <Toggle value={isGstRegistered} onChange={v => { setIsGstRegistered(v); setTaxRate(v ? 18 : 0); }} />
                                        </div>
                                    )}
                                    {(businessType !== 'solopreneur' || isGstRegistered) && (
                                        <div>
                                            <label style={labelStyle}>GST ID</label>
                                            <input value={seller.taxId || ''} onChange={e => setSeller({ ...seller, taxId: e.target.value })} placeholder="GST123456" style={inputStyle} />
                                        </div>
                                    )}
                                    {(businessType === 'services_firm' || businessType === 'ca_firm') && (
                                        <div>
                                            <label style={labelStyle}>PAN</label>
                                            <input value={seller.panNumber || ''} onChange={e => setSeller({ ...seller, panNumber: e.target.value })} placeholder="ABCDE1234F" style={inputStyle} />
                                        </div>
                                    )}
                                    {businessType === 'ca_firm' && (
                                        <div>
                                            <label style={labelStyle}>FRN (ICAI)</label>
                                            <input value={seller.frnNumber || ''} onChange={e => setSeller({ ...seller, frnNumber: e.target.value })} placeholder="123456W" style={inputStyle} />
                                        </div>
                                    )}
                                    <div>
                                        <label style={labelStyle}>UPI ID</label>
                                        <input value={seller.upiId || ''} onChange={e => setSeller({ ...seller, upiId: e.target.value })} placeholder="yourname@upi" style={inputStyle} />
                                    </div>
                                    {businessType === 'solopreneur' && (
                                        <div>
                                            <label style={labelStyle}>Bank Details</label>
                                            <textarea rows={2} value={seller.bankDetails || ''} onChange={e => setSeller({ ...seller, bankDetails: e.target.value })}
                                                placeholder="A/C No, IFSC, Bank Name" style={{ ...inputStyle, resize: 'none' }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* TO */}
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#1D9E75', letterSpacing: '0.05em', margin: '0 0 12px', textTransform: 'uppercase' }}>To (Client Details)</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div>
                                        <label style={labelStyle}>Address</label>
                                        <textarea rows={2} value={buyer.address || ''} onChange={e => setBuyer({ ...buyer, address: e.target.value })}
                                            placeholder="Client Address" style={{ ...inputStyle, resize: 'none' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label style={labelStyle}>Email</label>
                                            <input value={buyer.email || ''} onChange={e => setBuyer({ ...buyer, email: e.target.value })} placeholder="Email" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Phone</label>
                                            <input value={buyer.phone || ''} onChange={e => setBuyer({ ...buyer, phone: e.target.value })} placeholder="Phone" style={inputStyle} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Client GSTIN</label>
                                        <input value={buyer.taxId || ''} onChange={e => {
                                            const raw = e.target.value.toUpperCase().replace(/\s/g, '');
                                            const updated = { ...buyer, taxId: raw };
                                            if (raw.length === 15) { const s = getStateFromGstin(raw); if (s) (updated as any).state = s; }
                                            setBuyer(updated);
                                        }} placeholder="27ABCDE1234F1Z5" style={inputStyle} />
                                        {buyer.taxId && (
                                            <span style={{ fontSize: 11, display: 'block', marginTop: 4, color: buyer.taxId.length < 15 ? '#9ca3af' : validateGstin(buyer.taxId) ? '#16a34a' : '#d97706' }}>
                                                {buyer.taxId.length < 15 ? `${buyer.taxId.length}/15` : validateGstin(buyer.taxId) ? `Valid — ${getGstinStateDisplay(buyer.taxId)}` : 'Invalid GSTIN format'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {businessType === 'ca_firm' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
                                <div>
                                    <label style={labelStyle}>Place of Supply *</label>
                                    <select value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)} style={inputStyle}>
                                        {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div style={toggleRow}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Reverse Charge</span>
                                    <Toggle value={reverseCharge} onChange={setReverseCharge} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section: Invoice Services (Line Items) */}
                    <div style={sectionCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <p style={sectionTitle}>Invoice Services</p>
                            <button onClick={() => setItems([...items, { description: '', quantity: 1, unit: businessType === 'solopreneur' ? 'Service' : 'Qty', price: undefined, discount: 0, sac_code: '', tax_rate: 18, is_exempt: false }])}
                                style={{ fontSize: 13, fontWeight: 700, color: '#1D9E75', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                + Add Service
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: 14 }}>
                                No Services added yet. Click "Add Service" to get started.
                            </div>
                        ) : (
                            <div>
                                {/* Table Header */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: businessType === 'solopreneur' ? '2fr 80px 100px 90px 30px' : '2fr 70px 70px 80px 70px 90px 30px',
                                    gap: 8, padding: '10px 12px', background: '#f9fafb', borderRadius: '8px 8px 0 0', border: '1px solid #e5e7eb',
                                }}>
                                    {['Description', ...(businessType === 'solopreneur' ? [] : ['Unit']), 'Qty', 'Price', ...(businessType !== 'solopreneur' ? ['Disc%'] : []), 'Amount', ''].map((h, i) => (
                                        <span key={i} style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textAlign: i === 0 ? 'left' : 'center' }}>{h}</span>
                                    ))}
                                </div>

                                {/* Table Rows */}
                                {items.map((item, idx) => {
                                    const lineAmt = (item.quantity || 0) * (item.price || 0) * (1 - (item.discount || 0) / 100);
                                    return (
                                        <div key={idx} style={{
                                            display: 'grid',
                                            gridTemplateColumns: businessType === 'solopreneur' ? '2fr 80px 100px 90px 30px' : '2fr 70px 70px 80px 70px 90px 30px',
                                            gap: 8, padding: '10px 12px', border: '1px solid #e5e7eb', borderTop: 'none', alignItems: 'center', background: 'white',
                                        }}>
                                            <div style={{ position: 'relative' }}>
                                                <input value={item.description || ''} placeholder={businessType === 'solopreneur' ? 'Service description...' : 'Item name...'}
                                                    onChange={e => {
                                                        const v = e.target.value; const sug = autoSuggestSac(v);
                                                        if (sug && !item.sac_code) { updateItem(idx, { description: v, sac_code: sug.sacCode, tax_rate: sug.entry.gstRate, is_exempt: sug.entry.isExempt }); }
                                                        else { updateItem(idx, { description: v }); }
                                                    }}
                                                    onFocus={() => businessType === 'ecommerce' && setFocusedItemIndex(idx)}
                                                    onBlur={() => setTimeout(() => setFocusedItemIndex(null), 200)}
                                                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 14, fontWeight: 500, color: '#111827', outline: 'none' }} />
                                                {item.sac_code && <span style={{ fontSize: 9, color: '#9ca3af', fontFamily: 'monospace', display: 'block' }}>SAC {item.sac_code}</span>}
                                                {itemErrors?.[idx] && <ErrMsg>{itemErrors[idx]}</ErrMsg>}

                                                {focusedItemIndex === idx && (
                                                    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: 'white', borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb', minWidth: 260, maxHeight: 220, overflowY: 'auto' }}>
                                                        {products.filter(p => !item.description || p.name.toLowerCase().includes(item.description.toLowerCase())).slice(0, 12).map(product => (
                                                            <button key={product.id} onClick={() => updateItem(idx, { description: product.name, price: product.price, unit: product.unit, productId: product.id, sku: product.sku, hsn_code: product.hsnCode || '' })}
                                                                style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
                                                                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{product.name}</div>{product.sku && <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>SKU: {product.sku}</div>}</div>
                                                                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 13, fontWeight: 700 }}>₹{product.price}</div><div style={{ fontSize: 9, color: (product.stock || 0) < 5 ? '#f59e0b' : '#9ca3af' }}>{product.stock} left</div></div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {businessType !== 'solopreneur' && (
                                                <select value={item.unit || 'Qty'} onChange={e => updateItem(idx, { unit: e.target.value })}
                                                    style={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px', background: 'white', textAlign: 'center', outline: 'none', cursor: 'pointer' }}>
                                                    {UNITS.map(u => <option key={u}>{u}</option>)}
                                                </select>
                                            )}
                                            <input type="number" value={item.quantity || 1} onChange={e => updateItem(idx, { quantity: Number(e.target.value) })}
                                                style={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px', fontSize: 13, fontWeight: 600, background: '#f9fafb', outline: 'none' }} />
                                            <input type="number" value={item.price ?? ''} onChange={e => updateItem(idx, { price: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                placeholder="0.00" style={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px', fontSize: 13, fontWeight: 600, outline: 'none', background: 'white' }} />
                                            {businessType !== 'solopreneur' && (
                                                <input type="number" value={item.discount ?? ''} onChange={e => updateItem(idx, { discount: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                    style={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px', fontSize: 12, background: '#f9fafb', outline: 'none' }} />
                                            )}
                                            <span style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#111827' }}>{currency.symbol}{lineAmt.toFixed(2)}</span>
                                            <button onClick={() => setItems(items.filter((_, i) => i !== idx))}
                                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#d1d5db', fontSize: 18, padding: 2 }}>×</button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Section: Add Terms / Notes */}
                    {!showNotes ? (
                        <button onClick={() => setShowNotes(true)}
                            style={{ ...sectionCard, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151', padding: '16px 24px' }}>
                            + Add Terms / Notes
                        </button>
                    ) : (
                        <div style={sectionCard}>
                            <p style={sectionTitle}>Terms / Notes</p>
                            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="Payment terms, bank details, thank you note..."
                                style={{ ...inputStyle, resize: 'vertical' }} />
                            {businessType === 'ecommerce' && (
                                <div style={{ marginTop: 12 }}>
                                    <label style={labelStyle}>Courier & Tracking</label>
                                    <input value={courierTracking} onChange={e => setCourierTracking(e.target.value)} placeholder="Delhivery AWB: 1234567890" style={inputStyle} />
                                </div>
                            )}
                            {businessType === 'services_firm' && (
                                <div style={{ marginTop: 12 }}>
                                    <label style={labelStyle}>Authorized Signatory</label>
                                    <input value={authorizedSignatory} onChange={e => setAuthorizedSignatory(e.target.value)} placeholder="Partner / Director name" style={inputStyle} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Section: Signature toggle */}
                    <div style={toggleRow}>
                        <div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Signature</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Include Signature on Invoice</span>
                            <Toggle value={false} onChange={() => { }} />
                        </div>
                    </div>

                    {/* Logo upload */}
                    <div style={sectionCard}>
                        <p style={sectionTitle}>Logo</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 80, height: 80, border: '2px dashed #d1d5db', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }} />
                                {logo ? <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
                                    : <><div style={{ fontSize: 20, color: '#d1d5db' }}>⊞</div><span style={{ fontSize: 10, color: '#9ca3af' }}>Logo</span></>}
                            </div>
                            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Upload your business logo. It will appear on the invoice preview.</p>
                        </div>
                    </div>

                </div>{/* end LEFT */}


                {/* ──── RIGHT: Live Invoice Preview ──── */}
                <div style={{ overflowY: 'auto', padding: '24px 20px', borderLeft: '1px solid #e5e7eb', background: '#f3f4f6' }}>

                    {/* Preview PDF button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 8 }}>
                        <button onClick={actions.handlePrint} disabled={loading}
                            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6, opacity: loading ? 0.6 : 1 }}>
                            👁 Preview PDF
                        </button>
                        <button onClick={actions.handleEmailClick} disabled={loading}
                            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', opacity: loading ? 0.6 : 1 }}>
                            ✉ Email
                        </button>
                    </div>

                    {/* Invoice Card */}
                    <div style={{
                        background: 'white', borderRadius: 12, border: '1px solid #e5e7eb',
                        padding: '32px 28px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}>
                        {/* Logo + INVOICE heading */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div style={{ width: 60 }}>
                                {logo && <img src={logo} alt="logo" style={{ width: 60, height: 60, objectFit: 'contain' }} />}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>INVOICE</h2>
                                <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0', fontWeight: 500 }}>{meta.number || 'INV-0001'}</p>
                            </div>
                        </div>

                        {/* Billed From / Billed To */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 800, color: '#111827', margin: '0 0 8px', letterSpacing: '0.05em' }}>BILLED FROM</p>
                                {seller.name && <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{seller.name}</p>}
                                {seller.address && <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 2px', lineHeight: 1.4 }}>{seller.address}</p>}
                                {seller.phone && <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 2px' }}>Phone: {seller.phone}</p>}
                                {seller.email && <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 2px' }}>Email: {seller.email}</p>}
                                {seller.panNumber && <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 2px' }}>PAN: {seller.panNumber}</p>}
                                {seller.taxId && <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: 0 }}>GSTIN: {seller.taxId}</p>}
                            </div>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 800, color: '#111827', margin: '0 0 8px', letterSpacing: '0.05em' }}>BILLED TO</p>
                                {buyer.name ? (
                                    <>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{buyer.name}</p>
                                        {buyer.address && <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 2px', lineHeight: 1.4 }}>{buyer.address}</p>}
                                        {buyer.email && <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 2px' }}>{buyer.email}</p>}
                                        {buyer.taxId && <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: 0 }}>GSTIN: {buyer.taxId}</p>}
                                    </>
                                ) : (
                                    <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>Select a client to view their billing and tax details.</p>
                                )}
                            </div>
                        </div>

                        {/* Invoice Date / Due Date */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0 }}>
                                INVOICE DATE: &nbsp;<span style={{ fontWeight: 500 }}>{formatDate(meta.date || '')}</span>
                            </p>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: 0 }}>
                                DUE DATE: &nbsp;<span style={{ fontWeight: 500 }}>{formatDate(meta.dueDate || '')}</span>
                            </p>
                        </div>

                        {/* Line items table */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', padding: '8px 0', borderBottom: '2px solid #111827' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Description</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'right' }}>Amount</span>
                            </div>
                            {items.length === 0 ? (
                                <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', padding: '16px 0', textAlign: 'center', margin: 0 }}>No items added</p>
                            ) : items.map((item, idx) => {
                                const lineAmt = (item.quantity || 0) * (item.price || 0) * (1 - (item.discount || 0) / 100);
                                return (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{item.description || 'Untitled'}</span>
                                            {item.quantity > 1 && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>× {item.quantity}</span>}
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'right' }}>{currency.symbol}{lineAmt.toFixed(2)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Totals */}
                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#6b7280' }}>Subtotal</span>
                                <span style={{ fontWeight: 600, color: '#111827' }}>{currency.symbol}{subtotal.toFixed(2)}</span>
                            </div>
                            {resolvedGstType === 'cgst_sgst' && <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#6b7280' }}>CGST @ {(taxRate / 2).toFixed(1)}%</span><span style={{ fontWeight: 600 }}>{currency.symbol}{(taxAmount / 2).toFixed(2)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#6b7280' }}>SGST @ {(taxRate / 2).toFixed(1)}%</span><span style={{ fontWeight: 600 }}>{currency.symbol}{(taxAmount / 2).toFixed(2)}</span></div>
                            </>}
                            {resolvedGstType === 'igst' && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#6b7280' }}>IGST @ {taxRate}%</span><span style={{ fontWeight: 600 }}>{currency.symbol}{taxAmount.toFixed(2)}</span></div>}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                                <span style={{ color: '#6b7280' }}>Discount</span>
                                <div style={{ position: 'relative', width: 86 }}>
                                    <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#9ca3af' }}>{currency.symbol}</span>
                                    <input type="number" value={discountAmount ?? ''} onChange={e => setDiscountAmount(e.target.value === '' ? undefined : Number(e.target.value))}
                                        style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 6px 4px 20px', fontSize: 12, textAlign: 'right', background: '#f9fafb', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                                <span style={{ color: '#6b7280' }}>Shipping</span>
                                <div style={{ position: 'relative', width: 86 }}>
                                    <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#9ca3af' }}>{currency.symbol}</span>
                                    <input type="number" value={shipping ?? ''} onChange={e => setShipping(e.target.value === '' ? undefined : Number(e.target.value))}
                                        style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 6px 4px 20px', fontSize: 12, textAlign: 'right', background: '#f9fafb', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid #e5e7eb', paddingTop: 10, marginTop: 4 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>Total</span>
                                <span style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{currency.symbol}{total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Total in words */}
                        {currency.code === 'INR' && total > 0 && (
                            <p style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', margin: '12px 0 0', textAlign: 'right' }}>
                                Total In Words: <span style={{ fontWeight: 600, fontStyle: 'italic' }}>{numberToIndianWords(total)}</span>
                            </p>
                        )}

                        {/* TDS info */}
                        {tdsEnabled && tdsAmount && tdsAmount > 0 && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, marginTop: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', margin: '0 0 2px' }}>You will receive</p>
                                        <p style={{ fontSize: 10, color: '#16a34a', margin: 0 }}>After TDS {tdsRate}% deduction</p>
                                    </div>
                                    <p style={{ fontSize: 20, fontWeight: 800, color: '#15803d', margin: 0 }}>₹{state.netReceivable?.toFixed(2)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>{/* end RIGHT */}

            </div>{/* end BODY grid */}
        </div>
    );
}
