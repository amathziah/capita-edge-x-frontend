import { useState, useEffect } from "react";
import { X, User, MapPin, Loader2, Tag, CreditCard, Sparkles, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RegionDropdown } from "react-country-region-selector";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Customer } from "@/types";
import { dataService } from "@/shared/services/dataService";
import { useToast } from "@/app/providers/ToastContext";

interface AddClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing?: boolean;
  initialData?: Customer | null;
  onSaveSuccess: (customer: Customer) => void;
}

const countryOptions = [
  { value: 'IN', label: 'India (🇮🇳)' },
  { value: 'US', label: 'United States (🇺🇸)' },
  { value: 'GB', label: 'United Kingdom (🇬🇧)' },
  { value: 'AE', label: 'United Arab Emirates (🇦🇪)' },
  { value: 'SG', label: 'Singapore (🇸🇬)' },
  { value: 'AU', label: 'Australia (🇦🇺)' },
  { value: 'CA', label: 'Canada (🇨🇦)' },
  { value: 'DE', label: 'Germany (🇩🇪)' },
  { value: 'FR', label: 'France (🇫🇷)' },
];

const currencyOptions = [
  { value: 'INR', label: 'INR - Indian Rupee (₹)' },
  { value: 'USD', label: 'USD - US Dollar ($)' },
  { value: 'GBP', label: 'GBP - British Pound (£)' },
  { value: 'EUR', label: 'EUR - Euro (€)' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
];

const paymentTermsOptions = [
  { value: 0, label: 'Due on Receipt' },
  { value: 7, label: 'Net 7 Days' },
  { value: 14, label: 'Net 14 Days' },
  { value: 30, label: 'Net 30 Days' },
  { value: 45, label: 'Net 45 Days' },
  { value: 60, label: 'Net 60 Days' },
  { value: -1, label: 'Custom Days...' },
];

const defaultForm = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  addressLine1: '',
  city: '',
  state: '',
  pincode: '',
  country: 'IN',
  gstin: '',
  tags: '',
  status: 'Active' as 'Active' | 'Inactive',
  currency: 'INR',
  paymentTerms: 0
};

/* ── Premium Label ──────────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5" style={{ fontFamily: 'Sora, sans-serif' }}>
      {children}
    </label>
  );
}

/* ── Premium Input Style ────────────────────────────────── */
const inputCls =
  "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-teal-500/10 outline-none transition-shadow duration-200";

/* ── Section Card — Premium Glass Style ─────────────────── */
function Section({ icon: Icon, title, children, action }: {
  icon: React.ElementType; title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div
      className="relative bg-white rounded-2xl p-5 border border-gray-200 shadow-sm"
    >
      {/* Subtle gradient accent on top */}
      <div className="absolute top-0 left-6 right-6 h-[1.5px] rounded-b-full bg-teal-600/20" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-gray-800 flex items-center gap-2 uppercase tracking-widest" style={{ fontFamily: 'Sora, sans-serif' }}>
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm">
            <Icon size={12} className="text-white" />
          </span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function AddClientDrawer({ isOpen, onClose, isEditing, initialData, onSaveSuccess }: AddClientDrawerProps) {
  const { showToast } = useToast();
  const [customerForm, setCustomerForm] = useState(defaultForm);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCustomerForm({
          ...defaultForm, ...initialData,
          tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : initialData.tags || ''
        });
      } else {
        setCustomerForm(defaultForm);
      }
    }
  }, [isOpen, initialData]);

  const handleCountryChange = (country: string) => {
    setCustomerForm(prev => ({ ...prev, country, state: '', currency: country === 'IN' ? 'INR' : 'USD' }));
  };

  const fetchLocationByPincode = async (pincode: string) => {
    if (!/^\d{6}$/.test(pincode)) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data?.[0]?.Status === "Success") {
        const po = data[0].PostOffice[0];
        setCustomerForm(prev => ({ ...prev, city: po.District, state: po.State }));
      }
    } catch (err) {
      console.error("Pincode lookup error:", err);
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name || !customerForm.email) {
      showToast("Name and email are required", 'error');
      return;
    }
    setSavingCustomer(true);
    try {
      const tagsArray = typeof customerForm.tags === 'string'
        ? customerForm.tags.split(',').map(t => t.trim()).filter(Boolean)
        : customerForm.tags;
      const payload = { ...customerForm, tags: tagsArray };
      let savedCustomer: any;

      if (isEditing && initialData) {
        savedCustomer = await dataService.saveCustomer({ ...initialData, ...payload } as any);
      } else {
        savedCustomer = await dataService.saveCustomer({
          ...payload, id: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        } as any);
      }
      onSaveSuccess(savedCustomer);
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      showToast("Failed to save client: " + (err as Error).message, 'error');
    } finally {
      setSavingCustomer(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-gray-900/40 backdrop-blur-[1px]"
          />

          {/* ── Premium Slide-in Panel from Right ────────────── */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-[120] flex items-stretch"
            style={{ width: 'min(1060px, 100vw)' }}
          >
            <div
              className="relative w-full rounded-l-3xl border-l border-y border-gray-200 shadow-2xl flex flex-col"
              style={{
                background: '#f8fafc', // Dim solid background
              }}
            >
              {/* ── Decorative Background Glows ───────────────── */}
              <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-teal-300/20 blur-3xl pointer-events-none" />
              <div className="absolute bottom-10 -left-16 h-48 w-48 rounded-full bg-teal-200/15 blur-[80px] pointer-events-none" />

              {/* ── Header ────────────────────────────────────── */}
              <div className="relative flex items-center justify-between gap-3 px-4 sm:px-7 py-4 sm:py-5 border-b border-gray-200 rounded-tl-3xl bg-gray-50/80"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/25 shrink-0">
                    <Building2 size={18} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight tracking-tight truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {isEditing ? 'Edit Client' : 'Add New Client'}
                    </h1>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-medium hidden sm:flex items-center gap-1.5">
                      <Sparkles size={10} className="text-teal-500" />
                      {isEditing ? 'Update the existing customer record' : 'Create a new customer record'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Status toggle */}
                  <button
                    onClick={() => setCustomerForm(p => ({ ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' }))}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all duration-200 ${
                      customerForm.status === 'Active'
                        ? 'bg-teal-50 border-gray-200 text-teal-800'
                        : 'bg-gray-100 border-gray-200 text-gray-500'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full transition-colors shrink-0 ${customerForm.status === 'Active' ? 'bg-teal-500' : 'bg-gray-400'}`} />
                    <span className="hidden sm:inline">{customerForm.status}</span>
                  </button>

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* ── Body ──────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-7 py-4 sm:py-6 grid grid-cols-1 xl:grid-cols-2 gap-5 content-start">

                {/* ═══════ LEFT COLUMN ═══════ */}
                <div className="flex flex-col gap-5">

                  {/* Client Details */}
                  <Section icon={User} title="Client Details"
                    action={
                      <button className="text-[10px] font-bold text-teal-600 hover:text-teal-700 uppercase tracking-wider transition px-2 py-1 rounded-lg hover:bg-teal-50">
                        Auto-Fill GSTIN
                      </button>
                    }
                  >
                    <div className="space-y-3.5">
                      <div>
                        <Label>Billing Name <span className="text-red-400">*</span></Label>
                        <input type="text" value={customerForm.name}
                          onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                          placeholder="Legal Business Name" className={inputCls} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>Contact Name</Label>
                          <input type="text" value={customerForm.contactName}
                            onChange={e => setCustomerForm({ ...customerForm, contactName: e.target.value })}
                            placeholder="POC Name" className={inputCls} />
                        </div>
                        <div>
                          <Label>Email <span className="text-red-400">*</span></Label>
                          <input type="email" value={customerForm.email}
                            onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                            placeholder="billing@email.com" className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <div className="flex">
                          <div className="flex items-center gap-1 px-3 border border-gray-200 rounded-l-xl bg-gray-50 text-xs font-bold text-gray-500">
                            🇮🇳
                          </div>
                          <input type="tel" value={customerForm.phone}
                            onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                            placeholder="+91 98765 43210"
                          className="flex-1 px-4 py-2.5 border border-gray-200 border-l-0 rounded-r-xl bg-white text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-teal-500/10 outline-none transition-shadow" />
                        </div>
                      </div>
                    </div>
                  </Section>

                  {/* Tax Info + Tags row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Section icon={CreditCard} title="Tax Info">
                      <div>
                        <Label>GSTIN</Label>
                        <input type="text" value={customerForm.gstin || ''}
                          onChange={e => setCustomerForm({ ...customerForm, gstin: e.target.value.toUpperCase().replace(/\s/g, '') })}
                          placeholder="27ABCDE1234F1Z5" className={inputCls} />
                      </div>
                    </Section>

                    <Section icon={Tag} title="Tags">
                      <div>
                        <Label>Labels</Label>
                        <input type="text" value={customerForm.tags}
                          onChange={e => setCustomerForm({ ...customerForm, tags: e.target.value })}
                          placeholder="VIP, Regular, Wholesale..." className={inputCls} />
                        <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Comma-separated tags</p>
                      </div>
                    </Section>
                  </div>
                </div>

                {/* ═══════ RIGHT COLUMN ═══════ */}
                <div className="flex flex-col gap-5">

                  {/* Billing Address — Speed-optimized */}
                  <Section icon={MapPin} title="Billing Address"
                    action={
                      customerForm.city && customerForm.state ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-lg border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          Auto-filled
                        </span>
                      ) : null
                    }
                  >
                    <div className="space-y-3.5">
                      {/* Row 1: Country + Pincode/ZIP — the magic row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>Country</Label>
                          <SearchableSelect
                            options={countryOptions}
                            value={customerForm.country}
                            onChange={handleCountryChange}
                            placeholder="Search country..."
                          />
                        </div>
                        <div>
                          <Label>
                            {customerForm.country === 'IN' ? 'Pincode' : 'ZIP / Postal Code'}
                            {customerForm.country === 'IN' && (
                              <span className="ml-1.5 normal-case tracking-normal text-teal-500 font-medium">
                                — auto-fills city & state
                              </span>
                            )}
                          </Label>
                          <div className="relative">
                            <input
                              type="text"
                              value={customerForm.pincode}
                              onChange={e => {
                                const val = e.target.value;
                                setCustomerForm({ ...customerForm, pincode: val });
                                if (customerForm.country === 'IN' && val.length === 6) fetchLocationByPincode(val);
                              }}
                              placeholder={customerForm.country === 'IN' ? 'e.g. 560001' : 'e.g. 10001'}
                              maxLength={customerForm.country === 'IN' ? 6 : 10}
                              className={inputCls + " pr-9 font-semibold tracking-wider"}
                              autoComplete="postal-code"
                            />
                            {pincodeLoading ? (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                              </div>
                            ) : customerForm.pincode && customerForm.city ? (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <span className="text-teal-500 text-sm">✓</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Street Address — single wide field */}
                      <div>
                        <Label>
                          {customerForm.country === 'IN'
                            ? 'Flat / Building / Street / Area'
                            : 'Street Address'}
                        </Label>
                        <input
                          type="text"
                          value={customerForm.addressLine1}
                          onChange={e => setCustomerForm({ ...customerForm, addressLine1: e.target.value })}
                          placeholder={customerForm.country === 'IN'
                            ? 'e.g. 42, MG Road, Indiranagar'
                            : 'e.g. 123 Main St, Apt 4B'}
                          className={inputCls}
                          autoComplete="street-address"
                        />
                      </div>

                      {/* Row 3: City + State — auto-filled for India, manual for others */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>City / District</Label>
                          <input
                            type="text"
                            value={customerForm.city}
                            onChange={e => setCustomerForm({ ...customerForm, city: e.target.value })}
                            placeholder={customerForm.country === 'IN' ? 'Auto-fills from pincode' : 'City'}
                            className={`${inputCls} ${customerForm.city && customerForm.country === 'IN' ? 'bg-teal-50/40 border-gray-200' : ''}`}
                            autoComplete="address-level2"
                          />
                        </div>
                        <div>
                          <Label>State / Province</Label>
                          {customerForm.country === 'IN' ? (
                            <div className="relative">
                              <RegionDropdown
                                country={customerForm.country}
                                value={customerForm.state}
                                onChange={val => setCustomerForm({ ...customerForm, state: val })}
                                countryValueType="short"
                                showDefaultOption defaultOptionLabel={customerForm.state || 'Auto-fills from pincode'}
                                disableWhenEmpty
                                className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 appearance-none pr-7 focus:ring-2 focus:ring-teal-500/10 outline-none transition-shadow ${customerForm.state ? 'bg-teal-50/40' : 'bg-white'}`}
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▾</span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={customerForm.state}
                              onChange={e => setCustomerForm({ ...customerForm, state: e.target.value })}
                              placeholder="State / Province"
                              className={inputCls}
                              autoComplete="address-level1"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </Section>

                  {/* Billing Options */}
                  <Section icon={CreditCard} title="Billing Options">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Currency</Label>
                        <SearchableSelect
                          options={currencyOptions}
                          value={customerForm.currency}
                          onChange={val => setCustomerForm({ ...customerForm, currency: val })}
                          placeholder="Currency..."
                        />
                      </div>
                      <div>
                        <Label>Payment Terms</Label>
                        <SearchableSelect
                          options={paymentTermsOptions}
                          value={paymentTermsOptions.some(o => o.value === customerForm.paymentTerms && o.value !== -1) ? customerForm.paymentTerms : -1}
                          onChange={val => {
                            setCustomerForm({ ...customerForm, paymentTerms: val === -1 ? 30 : val });
                          }}
                          placeholder="Terms..."
                        />
                      </div>
                    </div>
                    {!paymentTermsOptions.some(o => o.value === customerForm.paymentTerms && o.value !== -1) && customerForm.paymentTerms !== 0 && (
                      <div className="flex items-center gap-3 mt-3">
                        <input type="number" value={customerForm.paymentTerms}
                          onChange={e => setCustomerForm({ ...customerForm, paymentTerms: parseInt(e.target.value) || 0 })}
                          className="flex-1 px-4 py-2.5 bg-teal-50/40 border border-gray-200 rounded-xl text-xs font-bold text-teal-800 outline-none focus:ring-2 focus:ring-teal-500/10 transition-shadow"
                          placeholder="Days" />
                        <span className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">Days</span>
                      </div>
                    )}
                  </Section>
                </div>
              </div>

              {/* ── Footer ────────────────────────────────────── */}
              <div className="border-t border-gray-200 px-4 sm:px-7 py-4 flex flex-wrap items-center justify-between gap-3 rounded-bl-3xl bg-gray-50/90"
              >
                <p className="text-[11px] text-gray-400 font-medium">
                  <span className="text-red-400">*</span> Required fields
                </p>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button onClick={onClose}
                    className="px-4 sm:px-6 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                    Discard
                  </button>
                  <button onClick={handleSaveCustomer} disabled={savingCustomer}
                    className="px-5 sm:px-7 py-2.5 rounded-xl bg-teal-600 border border-gray-200 text-white text-xs font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {savingCustomer && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isEditing ? 'Update Client' : 'Save Client'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}