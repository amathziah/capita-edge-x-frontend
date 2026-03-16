import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Upload, Save, Building, Image as ImageIcon, Loader2, CheckCircle2, CreditCard, ChevronRight, Mail, AlertCircle, Phone, MapPin, Fingerprint, Receipt, Settings2 as Settings2Icon } from 'lucide-react';
import { dataService } from '../services/dataService';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'general' | 'branding' | 'payments' | 'compliance' | 'email';

export function Settings() {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error' | null, message: string | null }>({ type: null, message: null });
    const [testingConnection, setTestingConnection] = useState(false);

    const [isVerified, setIsVerified] = useState(false);
    const [connectionChecked, setConnectionChecked] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await dataService.getSettings();
            setSettings(data);
            if (data.logoFilename) {
                setLogoPreview(dataService.getLogoUrl(data.logoFilename));
            }
            // If credentials exist in the DB, trust them as connected
            if (data.smtp_user && data.smtp_pass) {
                setIsVerified(true);
                setConnectionChecked(true);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const verifyConnection = async (user: string, pass: string) => {
        setTestingConnection(true);
        setTestStatus({ type: null, message: null });
        try {
            const res = await dataService.testEmailConnection(user, pass) as any;
            setConnectionChecked(true);
            if (res.success) {
                setIsVerified(true);
                setTestStatus({ type: 'success', message: 'Connection verified successfully!' });
            } else {
                setIsVerified(false);
                setTestStatus({ type: 'error', message: res.error || 'Connection failed. Please check your App Password.' });
            }
        } catch (error: any) {
            setConnectionChecked(true);
            console.error('Verification failed:', error);
            setIsVerified(false);
            setTestStatus({ type: 'error', message: error.message || 'Connection test failed.' });
        } finally {
            setTestingConnection(false);
        }
    };

    const handleSettingChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            const objectUrl = URL.createObjectURL(file);
            setLogoPreview(objectUrl);
        }
    };

    const saveSection = async (keys: string[], sectionName: string) => {
        try {
            setSaving(true);
            setSuccessMessage(null);

            // Handle Branding specifically if logoFile is present
            if (keys.includes('logoFilename') && logoFile) {
                const { filename } = await dataService.uploadLogo(logoFile);
                await dataService.saveSetting('logoFilename', filename);
                setSettings(prev => ({ ...prev, logoFilename: filename }));
                setLogoFile(null);
            }

            // Filter out keys that might have been handled or are undefined
            const actualKeys = keys.filter(k => k !== 'logoFilename');

            await Promise.all(
                actualKeys.map(key => {
                    if (settings[key] !== undefined) {
                        return dataService.saveSetting(key, settings[key]);
                    }
                    return Promise.resolve();
                })
            );

            setSuccessMessage(`${sectionName} saved successfully!`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error(`Failed to save ${sectionName}:`, error);
            alert(`Failed to save ${sectionName}. Please try again.`);
        } finally {
            setSaving(false);
        }
    };

    const SaveButton = ({ onClick, label = "Save Changes" }: { onClick: () => void, label?: string }) => (
        <div className="flex justify-end pt-4 mt-6 border-t border-gray-50">
            <button
                onClick={onClick}
                disabled={saving}
                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2 shadow-sm"
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : label}
            </button>
        </div>
    );

    const tabs = [
        { id: 'general', label: 'General Info', icon: Building, description: 'Company name, contact, and address' },
        { id: 'branding', label: 'Branding', icon: ImageIcon, description: 'Logo and visual identity' },
        { id: 'payments', label: 'Invoicing & Payments', icon: CreditCard, description: 'Payment terms, footer, and bank details' },
        { id: 'compliance', label: 'GST & Compliance', icon: Receipt, description: 'GSTIN, PAN, FRN, bank details' },
        { id: 'email', label: 'Email Integration', icon: Mail, description: 'Connect Gmail' },
    ];

    if (loading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-gray-50/50">
                <div className="relative mb-8">
                    {/* Outer rotating dotted ring */}
                    <div className="w-20 h-20 border-4 border-emerald-400 border-dotted rounded-full animate-spin [animation-duration:3s]"></div>

                    {/* Inner pulsing glow */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full opacity-10 animate-ping [animation-duration:1.5s]"></div>
                    </div>

                    {/* Solid center dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-emerald-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                    </div>
                </div>

                <div className="space-y-2 text-center">
                    <h3 className="text-sm font-semibold tracking-widest text-emerald-800 uppercase">Optimizing Profile</h3>
                    <div className="flex justify-center gap-1">
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <SettingsIcon className="w-6 h-6 text-primary" />
                        </div>
                        Organization Settings
                    </h2>
                    <p className="text-text-muted mt-1 ml-11">Manage your business profile and invoice configuration.</p>
                </div>
            </div>

            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Sidebar Tabs */}
                <div className="lg:col-span-1 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-left group relative overflow-hidden
                ${activeTab === tab.id
                                    ? 'bg-white text-primary shadow-soft ring-1 ring-primary/10 font-bold'
                                    : 'text-text-muted hover:bg-white hover:text-text-main'
                                }`}
                        >
                            {activeTab === tab.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transform origin-left" />
                            )}
                            <tab.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-text-light group-hover:text-text-main'}`} />
                            <div>
                                <span className="block">{tab.label}</span>
                                <span className="text-[10px] font-medium text-text-light">{tab.description}</span>
                            </div>
                            {activeTab === tab.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'general' && (
                                <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-3 custom-scrollbar">
                                    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-8">
                                        <div className="border-b border-gray-100 pb-4">
                                            <h3 className="text-lg font-bold text-text-main">Company Details</h3>
                                            <p className="text-sm text-text-muted">Basic information about your business.</p>
                                        </div>

                                        <div className="space-y-10">
                                            {/* Company Profile Section */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <Building className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-text-main leading-tight">Company Profile</h4>
                                                        <p className="text-xs text-text-muted">General identity of your organization</p>
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                                                            <Building className="w-3.5 h-3.5 text-text-light" />
                                                            Business Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={settings.businessName || ''}
                                                            onChange={(e) => handleSettingChange('businessName', e.target.value)}
                                                            className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                            placeholder="e.g. Acme Corp"
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                                                            <Fingerprint className="w-3.5 h-3.5 text-text-light" />
                                                            Tax ID / GSTIN
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={settings.companyTaxId || ''}
                                                            onChange={(e) => handleSettingChange('companyTaxId', e.target.value)}
                                                            className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                            placeholder="e.g. 27ABCDE1234F1Z5"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Communication Section */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                                                    <div className="p-2 bg-blue-50 rounded-lg">
                                                        <Mail className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-text-main leading-tight">Contact Information</h4>
                                                        <p className="text-xs text-text-muted">How customers can reach you</p>
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                                                            <Mail className="w-3.5 h-3.5 text-text-light" />
                                                            Email Address
                                                        </label>
                                                        <input
                                                            type="email"
                                                            value={settings.email || ''}
                                                            onChange={(e) => handleSettingChange('email', e.target.value)}
                                                            className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                            placeholder="primary@company.com"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                                                            <Phone className="w-3.5 h-3.5 text-text-light" />
                                                            Phone Number
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={settings.phone || ''}
                                                            onChange={(e) => handleSettingChange('phone', e.target.value)}
                                                            className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                            placeholder="+1 (555) 000-0000"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Physical Presence Section */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                                                    <div className="p-2 bg-orange-50 rounded-lg">
                                                        <MapPin className="w-5 h-5 text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-text-main leading-tight">Registered Address</h4>
                                                        <p className="text-xs text-text-muted">Your official business location</p>
                                                    </div>
                                                </div>

                                                <div className="grid gap-2">
                                                    <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                                                        <MapPin className="w-3.5 h-3.5 text-text-light" />
                                                        Business Address
                                                    </label>
                                                    <textarea
                                                        value={settings.address || ''}
                                                        onChange={(e) => handleSettingChange('address', e.target.value)}
                                                        rows={3}
                                                        className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder:text-gray-400"
                                                        placeholder="Full street address..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <SaveButton
                                            onClick={() => saveSection(['businessName', 'email', 'phone', 'address', 'companyTaxId'], 'General details')}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'branding' && (
                                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-8">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h3 className="text-lg font-bold text-text-main">Visual Identity</h3>
                                        <p className="text-sm text-text-muted">Manage your organization's logo.</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start gap-8">
                                        <div className="relative group">
                                            <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden transition-colors group-hover:border-primary/50 group-hover:bg-primary/5">
                                                {logoPreview ? (
                                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-4" />
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                        <span className="text-xs text-gray-400">No logo</span>
                                                    </div>
                                                )}
                                            </div>
                                            <label className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-text-main text-white text-xs font-bold rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:scale-105 active:scale-95">
                                                Change
                                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                            </label>
                                        </div>

                                        <div className="flex-1 space-y-4 pt-2">
                                            <div className="space-y-2">
                                                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-primary/50 text-text-main text-sm font-semibold rounded-xl transition cursor-pointer shadow-sm active:scale-95">
                                                    <Upload className="w-4 h-4" />
                                                    Upload New Logo
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                                </label>
                                                <p className="text-sm text-text-muted leading-relaxed">
                                                    This logo will appear on all your generated invoices, reports, and emails.
                                                    <br />
                                                    <span className="text-xs text-text-light">Recommended size: 400x400px (PNG or JPG). Max size: 2MB.</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <SaveButton
                                        onClick={() => saveSection(['logoFilename'], 'Branding')}
                                        label="Update Branding"
                                    />
                                </div>
                            )}

                            {activeTab === 'payments' && (
                                <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-3 custom-scrollbar space-y-6">
                                    {/* Invoice Defaults */}
                                    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-8">
                                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Receipt className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-text-main leading-tight">Invoice Configuration</h3>
                                                <p className="text-sm text-text-muted">Default terms and notes for new invoices.</p>
                                            </div>
                                        </div>

                                        <div className="grid gap-6">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-semibold text-text-main">Default Payment Terms</label>
                                                    <input
                                                        type="text"
                                                        value={settings.paymentTerms || ''}
                                                        onChange={(e) => handleSettingChange('paymentTerms', e.target.value)}
                                                        className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                        placeholder="e.g. Due on Receipt, Net 30"
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <label className="text-sm font-semibold text-text-main">Footer Text</label>
                                                    <input
                                                        type="text"
                                                        value={settings.footerText || ''}
                                                        onChange={(e) => handleSettingChange('footerText', e.target.value)}
                                                        className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                        placeholder="e.g. Registered Office: 123 Main St..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-text-main">Default Customer Notes</label>
                                                <textarea
                                                    value={settings.invoiceNotes || ''}
                                                    onChange={(e) => handleSettingChange('invoiceNotes', e.target.value)}
                                                    rows={2}
                                                    className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder:text-gray-400"
                                                    placeholder="e.g. Thank you for your business!"
                                                />
                                            </div>
                                        </div>

                                        <SaveButton
                                            onClick={() => saveSection(['paymentTerms', 'invoiceNotes', 'footerText'], 'Invoice configuration')}
                                        />
                                    </div>

                                    {/* Payment Methods */}
                                    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-8">
                                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <CreditCard className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-text-main leading-tight">Payment Instructions</h3>
                                                <p className="text-sm text-text-muted">How customers should pay you (Bank, UPI, etc.).</p>
                                            </div>
                                        </div>

                                        <div className="grid gap-6">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-text-main">UPI ID (for QR Code)</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={settings.upiId || ''}
                                                        onChange={(e) => handleSettingChange('upiId', e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                        placeholder="username@bank"
                                                    />
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 bg-white rounded border border-gray-200">
                                                        <div className="w-4 h-4 bg-primary/20 rounded-sm" />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-text-light pl-1">This will automatically generate a scannable QR code on your PDF invoices.</p>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-semibold text-text-main">Bank Account Details</label>
                                                    <textarea
                                                        value={settings.bankDetails || ''}
                                                        onChange={(e) => handleSettingChange('bankDetails', e.target.value)}
                                                        rows={3}
                                                        className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder:text-gray-400 font-mono text-sm"
                                                        placeholder={`Bank Name: HDFC Bank\nAccount: 1234567890\nIFSC: HDFC0001234`}
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <label className="text-sm font-semibold text-text-main">Other Payment Instructions</label>
                                                    <textarea
                                                        value={settings.paymentInstructions || ''}
                                                        onChange={(e) => handleSettingChange('paymentInstructions', e.target.value)}
                                                        rows={3}
                                                        className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder:text-gray-400 text-sm"
                                                        placeholder="e.g. Please include invoice number in remarks."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <SaveButton
                                            onClick={() => saveSection(['upiId', 'bankDetails', 'paymentInstructions'], 'Payment instructions')}
                                        />
                                    </div>
                                </div>
                            )}


                            {activeTab === 'compliance' && (
                                <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-3 custom-scrollbar space-y-6">

                                    {/* GST & Tax Identity */}
                                    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-6">
                                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Receipt className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-text-main leading-tight">GST & Tax Identity</h3>
                                                <p className="text-sm text-text-muted">Required for GST-compliant invoices</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-text-main">GSTIN</label>
                                                <input
                                                    type="text"
                                                    value={settings.gstin || ''}
                                                    onChange={(e) => handleSettingChange('gstin', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400 font-mono uppercase"
                                                    placeholder="27ABCDE1234F1Z5"
                                                    maxLength={15}
                                                />
                                                <p className="text-xs text-text-light">15-digit GST Identification Number</p>
                                            </div>

                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-text-main">PAN Number</label>
                                                <input
                                                    type="text"
                                                    value={settings.pan || ''}
                                                    onChange={(e) => handleSettingChange('pan', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400 font-mono uppercase"
                                                    placeholder="ABCDE1234F"
                                                    maxLength={10}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-text-main">
                                                    FRN — Firm Registration Number
                                                    <span className="text-xs font-normal text-text-light ml-2">CA firms only</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settings.frn || ''}
                                                    onChange={(e) => handleSettingChange('frn', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400 font-mono"
                                                    placeholder="000000N"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-text-main">
                                                    LUT Number
                                                    <span className="text-xs font-normal text-text-light ml-2">for zero-rated exports</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settings.lutNumber || ''}
                                                    onChange={(e) => handleSettingChange('lutNumber', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                    placeholder="AD220421006927E"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-text-main">
                                                    MSME Registration Number
                                                    <span className="text-xs font-normal text-text-light ml-2">optional</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settings.msmeNumber || ''}
                                                    onChange={(e) => handleSettingChange('msmeNumber', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                    placeholder="UDYAM-MH-00-0000000"
                                                />
                                            </div>
                                        </div>

                                        <SaveButton onClick={() => saveSection(['gstin', 'pan', 'frn', 'lutNumber', 'msmeNumber'], 'GST & Tax details')} />
                                    </div>

                                    {/* Bank Details */}
                                    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-6">
                                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                            <div className="p-2 bg-blue-50 rounded-lg">
                                                <CreditCard className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-text-main leading-tight">Bank Account Details</h3>
                                                <p className="text-sm text-text-muted">Shown on invoices for bank transfers</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-text-main">Bank Name</label>
                                                <input
                                                    type="text"
                                                    value={settings.bankName || ''}
                                                    onChange={(e) => handleSettingChange('bankName', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                    placeholder="HDFC Bank"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-text-main">Account Number</label>
                                                <input
                                                    type="text"
                                                    value={settings.bankAccountNumber || ''}
                                                    onChange={(e) => handleSettingChange('bankAccountNumber', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400 font-mono"
                                                    placeholder="1234567890"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-text-main">IFSC Code</label>
                                                <input
                                                    type="text"
                                                    value={settings.bankIfsc || ''}
                                                    onChange={(e) => handleSettingChange('bankIfsc', e.target.value.toUpperCase())}
                                                    className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400 font-mono uppercase"
                                                    placeholder="HDFC0001234"
                                                    maxLength={11}
                                                />
                                            </div>
                                        </div>

                                        <SaveButton onClick={() => saveSection(['bankName', 'bankAccountNumber', 'bankIfsc'], 'Bank details')} />
                                    </div>

                                    {/* Capita Automation Settings */}
                                    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-6">
                                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                            <div className="p-2 bg-purple-50 rounded-lg">
                                                <Settings2Icon className="w-5 h-5 text-purple-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-text-main leading-tight">Capita Automation</h3>
                                                <p className="text-sm text-text-muted">Configure when Capita acts automatically</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {[
                                                { key: 'autoFollowUp', label: 'Auto follow-up emails', desc: 'Capita sends payment reminders automatically on day 7, 14, and 30' },
                                                { key: 'reorderAlertsEnabled', label: 'Stock reorder alerts', desc: 'Get notified when products fall below minimum stock level' },
                                                { key: 'mrrAlertsEnabled', label: 'MRR drop alerts', desc: 'Alert when monthly recurring revenue drops below last month' },
                                                { key: 'weeklySummaryEnabled', label: 'Weekly cash summary', desc: 'Capita sends a Monday morning financial summary' },
                                            ].map(item => (
                                                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div>
                                                        <p className="text-sm font-semibold text-text-main">{item.label}</p>
                                                        <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSettingChange(item.key, settings[item.key] === 'true' || settings[item.key] === true ? 'false' : 'true')}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings[item.key] === 'true' || settings[item.key] === true ? 'bg-primary' : 'bg-gray-200'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[item.key] === 'true' || settings[item.key] === true ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-text-main">Follow-up day 1</label>
                                                <input
                                                    type="number"
                                                    value={settings.followUpDay1 || 7}
                                                    onChange={(e) => handleSettingChange('followUpDay1', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    min={1} max={30}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-text-main">Follow-up day 2</label>
                                                <input
                                                    type="number"
                                                    value={settings.followUpDay2 || 14}
                                                    onChange={(e) => handleSettingChange('followUpDay2', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    min={1} max={60}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-semibold text-text-main">Follow-up day 3</label>
                                                <input
                                                    type="number"
                                                    value={settings.followUpDay3 || 30}
                                                    onChange={(e) => handleSettingChange('followUpDay3', e.target.value)}
                                                    className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    min={1} max={90}
                                                />
                                            </div>
                                        </div>

                                        <SaveButton onClick={() => saveSection(['autoFollowUp', 'reorderAlertsEnabled', 'mrrAlertsEnabled', 'weeklySummaryEnabled', 'followUpDay1', 'followUpDay2', 'followUpDay3'], 'Automation settings')} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'email' && (
                                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-8">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h3 className="text-lg font-bold text-text-main">Connect Your Gmail</h3>
                                        <p className="text-sm text-text-muted">Send invoices directly from your own Gmail account.</p>
                                    </div>

                                    {/* ── Connected State ───────────────────────────────── */}
                                    {isVerified && settings.smtp_user && settings.smtp_pass ? (
                                        <div className="space-y-6">
                                            {/* Status Banner */}
                                            <div className={`rounded-xl p-4 border flex items-start gap-4 ${testingConnection
                                                ? 'bg-blue-50 border-blue-100 text-blue-900'
                                                : 'bg-emerald-50 border-emerald-100 text-emerald-900'
                                                }`}>
                                                <div className={`p-2 rounded-full ${testingConnection
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-emerald-100 text-emerald-600'
                                                    }`}>
                                                    {testingConnection ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-sm mb-1">
                                                        {testingConnection ? 'Verifying Connection...' : 'Gmail Connected'}
                                                    </h4>
                                                    <p className="text-xs opacity-90 mb-3">
                                                        {testingConnection
                                                            ? 'Please wait while we verify your credentials.'
                                                            : `Successfully connected as ${settings.smtp_user}`}
                                                    </p>
                                                    <div className="flex gap-3">
                                                        {!testingConnection && (
                                                            <button
                                                                onClick={() => verifyConnection(settings.smtp_user, settings.smtp_pass)}
                                                                className="text-xs font-bold text-emerald-700 hover:underline"
                                                            >
                                                                Test Connection
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setSettings(prev => ({ ...prev, smtp_user: '', smtp_pass: '' }));
                                                                setIsVerified(false);
                                                                setConnectionChecked(false);
                                                                setTestStatus({ type: null, message: null });
                                                            }}
                                                            className="text-xs font-bold opacity-70 hover:opacity-100 hover:underline"
                                                        >
                                                            Disconnect Account
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Test result feedback */}
                                            {testStatus.type && testStatus.message && (
                                                <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${testStatus.type === 'success'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                    : 'bg-red-50 text-red-700 border border-red-100'
                                                    }`}>
                                                    {testStatus.type === 'success' ? (
                                                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                    ) : (
                                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                    )}
                                                    <span>{testStatus.message}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* ── Disconnected State ─────────────────────────── */
                                        <div className="space-y-6">
                                            {/* Info banner */}
                                            {!connectionChecked && (
                                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-2">
                                                    <p className="font-semibold flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                        Why connect Gmail?
                                                    </p>
                                                    <ul className="list-disc list-inside space-y-1 ml-2 opacity-90">
                                                        <li>Emails come from <strong>your address</strong> (not no-reply).</li>
                                                        <li>Replies go directly to your inbox.</li>
                                                        <li>Higher delivery rates for your customers.</li>
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Connection failed banner */}
                                            {connectionChecked && !isVerified && testStatus.type === 'error' && (
                                                <div className="rounded-xl p-4 border flex items-start gap-4 bg-amber-50 border-amber-100 text-amber-900">
                                                    <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                                                        <AlertCircle className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-sm mb-1">Connection Issue</h4>
                                                        <p className="text-xs opacity-90">
                                                            {testStatus.message || 'We couldn\'t verify your credentials. Please check your App Password.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Connection form */}
                                            <div className="grid gap-6 max-w-xl animate-in slide-in-from-bottom-4 fade-in duration-500">
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-semibold text-text-main">Gmail Address</label>
                                                    <input
                                                        type="email"
                                                        value={settings.smtp_user || ''}
                                                        onChange={(e) => handleSettingChange('smtp_user', e.target.value)}
                                                        className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                        placeholder="youremail@gmail.com"
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-sm font-semibold text-text-main">App Password</label>
                                                        <a
                                                            href="https://support.google.com/accounts/answer/185833"
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                                                        >
                                                            How to generate? <ChevronRight className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                    <input
                                                        type="password"
                                                        value={settings.smtp_pass || ''}
                                                        onChange={(e) => handleSettingChange('smtp_pass', e.target.value)}
                                                        className="w-full px-4 py-3 bg-gray-50 border-gray-100 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400 font-mono"
                                                        placeholder="x x x x  x x x x  x x x x  x x x x"
                                                    />
                                                    <p className="text-xs text-text-light">
                                                        Required because 2-Step Verification is enabled on your account.
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={async () => {
                                                        if (!settings.smtp_user || !settings.smtp_pass) {
                                                            setTestStatus({ type: 'error', message: 'Please enter both email and app password.' });
                                                            setConnectionChecked(true);
                                                            return;
                                                        }
                                                        // Save first, then verify
                                                        try {
                                                            await dataService.saveSetting('smtp_user', settings.smtp_user);
                                                            await dataService.saveSetting('smtp_pass', settings.smtp_pass);
                                                        } catch {
                                                            // continue to at least display the result
                                                        }
                                                        verifyConnection(settings.smtp_user, settings.smtp_pass);
                                                    }}
                                                    disabled={loading || saving || testingConnection}
                                                    className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {testingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect Gmail Account'}
                                                </button>

                                                {testStatus.type && testStatus.message && !isVerified && testStatus.type === 'error' && connectionChecked && (
                                                    <div className="flex items-start gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-100">
                                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                        <span>{testStatus.message}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
