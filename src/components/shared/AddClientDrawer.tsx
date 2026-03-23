import { useState, useEffect } from "react";
import { ArrowLeft, User, MapPin, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RegionDropdown } from "react-country-region-selector";
import { SearchableSelect } from "./SearchableSelect";
import { Customer } from "../../types";
import { dataService } from "../../services/dataService";

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
  addressLine2: '',
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

export function AddClientDrawer({ isOpen, onClose, isEditing, initialData, onSaveSuccess }: AddClientDrawerProps) {
  const [customerForm, setCustomerForm] = useState(defaultForm);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCustomerForm({ ...defaultForm, ...initialData, tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : initialData.tags || '' });
      } else {
        setCustomerForm(defaultForm);
      }
    }
  }, [isOpen, initialData]);

  const handleCountryChange = (country: string) => {
    setCustomerForm(prev => ({
      ...prev,
      country,
      state: '',
      currency: country === 'IN' ? 'INR' : 'USD'
    }));
  };

  const fetchLocationByPincode = async (pincode: string) => {
    if (!/^\d{6}$/.test(pincode)) return;
    setPincodeLoading(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      if (data && data[0] && data[0].Status === "Success") {
        const postOffice = data[0].PostOffice[0];
        setCustomerForm(prev => ({
          ...prev,
          city: postOffice.District,
          state: postOffice.State
        }));
      }
    } catch (err) {
      console.error("Pincode lookup error:", err);
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name || !customerForm.email) {
      alert("Name and email are required");
      return;
    }
    setSavingCustomer(true);
    try {
      let savedCustomer: any;
      const tagsArray = typeof customerForm.tags === 'string' ? customerForm.tags.split(',').map(t => t.trim()).filter(Boolean) : customerForm.tags;
      
      const payload = { ...customerForm, tags: tagsArray };

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
      alert("Failed to save client: " + (err as Error).message);
    } finally {
      setSavingCustomer(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-slate-900/10 backdrop-blur-[2px]"
          />
          {/* Drawer Content */}
          <motion.div
            initial={{ x: '100%', opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[120] flex flex-col border-l border-teal-100/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-white hover:text-teal-600 transition shadow-sm"
                >
                  <ArrowLeft size={16} />
                </button>
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {isEditing ? 'Edit Client' : 'Add New Client'}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${customerForm.status === 'Active' ? 'bg-teal-500 shadow-teal-500/20' : 'bg-gray-300'}`} />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">{customerForm.status}</span>
              </div>
            </div>

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar space-y-8">
              {/* Client Details */}
              <div className="bg-white border border-teal-50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <User size={18} className="text-teal-500" /> Client Details
                  </h2>
                  <button type="button" className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition">
                    Auto-Fill from GSTIN
                  </button>
                </div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                      Client Billing Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerForm.name}
                      onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                      placeholder="Legal Business Name"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-teal-400 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Contact Name</label>
                      <input 
                        type="text" 
                        value={customerForm.contactName}
                        onChange={e => setCustomerForm({ ...customerForm, contactName: e.target.value })}
                        placeholder="POC Name" 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:border-teal-400 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                        placeholder="billing@email.com"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:border-teal-400 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="flex">
                      <div className="flex items-center gap-1.5 px-3.5 border border-r-0 border-gray-100 rounded-l-xl bg-gray-50 text-sm font-bold text-gray-600 cursor-pointer">
                        <span>🇮🇳</span>
                        <span className="text-gray-400 text-[10px]">⇅</span>
                      </div>
                      <input
                        type="tel"
                        value={customerForm.phone}
                        onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        className="flex-1 px-4 py-3 border border-gray-100 rounded-r-xl bg-gray-50 text-sm font-semibold text-gray-800 focus:bg-white focus:border-teal-400 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-white border border-teal-50 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin size={18} className="text-teal-500" /> Billing Address
                </h2>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <SearchableSelect
                      label="Country"
                      options={countryOptions}
                      value={customerForm.country}
                      onChange={handleCountryChange}
                      placeholder="Search country..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Address <span className="text-red-500">*</span></label>
                    <textarea
                      value={customerForm.addressLine1}
                      onChange={e => setCustomerForm({ ...customerForm, addressLine1: e.target.value })}
                      placeholder="Street, Building, Area..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:border-teal-400 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">State</label>
                      {customerForm.country === 'IN' ? (
                        <div className="relative">
                          <RegionDropdown
                            country={customerForm.country}
                            value={customerForm.state}
                            onChange={val => setCustomerForm({ ...customerForm, state: val })}
                            countryValueType="short"
                            showDefaultOption={true}
                            defaultOptionLabel="Select"
                            disableWhenEmpty={true}
                            className="w-full px-2.5 py-2.5 border border-gray-100 rounded-xl text-[13px] font-bold text-gray-800 bg-gray-50 focus:bg-white appearance-none pr-6"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">⌄</span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={customerForm.state}
                          onChange={e => setCustomerForm({ ...customerForm, state: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-100 bg-gray-50 rounded-xl text-[13px] font-semibold focus:bg-white outline-none"
                        />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">City</label>
                      <input
                        type="text"
                        value={customerForm.city}
                        onChange={e => setCustomerForm({ ...customerForm, city: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-100 bg-gray-50 rounded-xl text-[13px] font-semibold focus:bg-white outline-none"
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{customerForm.country === 'IN' ? 'Pin' : 'Zip'}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customerForm.pincode}
                          onChange={e => {
                            const val = e.target.value;
                            setCustomerForm({ ...customerForm, pincode: val });
                            if (customerForm.country === 'IN' && val.length === 6) {
                              fetchLocationByPincode(val);
                            }
                          }}
                          placeholder={customerForm.country === 'IN' ? '6 digits' : 'ZIP'}
                          className="w-full px-3 py-2.5 border border-gray-100 bg-gray-50 rounded-xl text-[13px] font-semibold focus:bg-white focus:border-teal-400 outline-none pr-8"
                        />
                        {pincodeLoading && (
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-3.5 h-3.5 text-teal-500 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-teal-50 rounded-2xl p-5 shadow-sm space-y-4">
                  <SearchableSelect
                    label="Currency"
                    options={currencyOptions}
                    value={customerForm.currency}
                    onChange={val => setCustomerForm({ ...customerForm, currency: val })}
                    placeholder="Search currency..."
                  />
                </div>
                <div className="bg-white border border-teal-50 rounded-2xl p-5 shadow-sm space-y-3">
                  <SearchableSelect
                    label="Terms"
                    options={paymentTermsOptions}
                    value={paymentTermsOptions.some(o => o.value === customerForm.paymentTerms && o.value !== -1) ? customerForm.paymentTerms : -1}
                    onChange={val => {
                      if (val === -1) {
                        setCustomerForm({ ...customerForm, paymentTerms: 30 }); // Default for custom
                      } else {
                        setCustomerForm({ ...customerForm, paymentTerms: val });
                      }
                    }}
                    placeholder="Search terms..."
                  />
                  {(customerForm.paymentTerms !== 0 && !paymentTermsOptions.some(o => o.value === customerForm.paymentTerms && o.value !== -1)) || (customerForm.paymentTerms !== 0 && paymentTermsOptions.some(o => o.value === -1 && customerForm.paymentTerms !== 0)) ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                      <input
                        type="number"
                        value={customerForm.paymentTerms}
                        onChange={e => setCustomerForm({ ...customerForm, paymentTerms: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-teal-50/50 border border-teal-100 rounded-lg text-xs font-bold text-teal-700 outline-none focus:border-teal-300"
                        placeholder="Days"
                      />
                      <span className="text-[10px] font-bold text-teal-600 uppercase">Days</span>
                    </div>
                  ) : null}
                </div>
              </div>
              
              {/* GSTIN */}
              <div className="bg-white border border-teal-50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">GSTIN</h3>
                <input
                  type="text"
                  value={customerForm.gstin || ''}
                  onChange={e => setCustomerForm({ ...customerForm, gstin: e.target.value.toUpperCase().replace(/\s/g, '') })}
                  placeholder="27ABCDE1234F1Z5"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:border-teal-400 outline-none transition-all"
                />
              </div>

              {/* Tags */}
              <div className="bg-white border border-teal-50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Tags</h3>
                <input
                  type="text"
                  value={customerForm.tags}
                  onChange={e => setCustomerForm({ ...customerForm, tags: e.target.value })}
                  placeholder="VIP, Regular..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:border-teal-400 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-5 flex items-center justify-end gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveCustomer}
                disabled={savingCustomer}
                className="px-8 py-3 rounded-xl bg-teal-600 text-white text-sm font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-50 transition flex items-center gap-2"
              >
                {savingCustomer && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? 'Update Client' : 'Save Client'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
