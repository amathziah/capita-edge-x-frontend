import { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon, Upload, Save, Building, Image as ImageIcon,
    Loader2, CheckCircle2, CreditCard, ChevronRight, Mail, AlertCircle,
    Receipt, Settings2 as Settings2Icon, Eye, EyeOff
  } from 'lucide-react';
import { dataService } from '@/services/dataService';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'general' | 'branding' | 'payments' | 'email';

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  description: string;
  iconColor?: string;
  iconBg?: string;
}

const parseLegacyBankDetails = (bankDetails?: string) => {
  if (!bankDetails) return { bankName: '', bankAccountNumber: '', bankIfsc: '' };

  const lines = bankDetails.split('\n').map(line => line.trim());
  const findValue = (prefix: string) =>
    lines.find(line => line.toLowerCase().startsWith(prefix.toLowerCase()))?.split(':').slice(1).join(':').trim() || '';

  return {
    bankName: findValue('Bank'),
    bankAccountNumber: findValue('Account No'),
    bankIfsc: findValue('IFSC'),
  };
};

// ─── Shared primitives (Compact) ──────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg ' +
  'focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary ' +
  'outline-none transition-all placeholder:text-gray-400 text-sm';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-semibold text-text-main leading-tight">{label}</label>
      {children}
      {hint && <p className="text-[11px] leading-tight text-text-light">{hint}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description, iconColor = 'text-primary', iconBg = 'bg-primary/10' }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-1">
      <div className={`p-1.5 ${iconBg} rounded-md shrink-0`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-text-main leading-none">{title}</h3>
        <p className="text-[11px] text-text-muted mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4 ${className}`}>
      {children}
    </div>
  );
}

function SaveRow({ onClick, label = 'Save changes', saving }: { onClick: () => void; label?: string; saving: boolean }) {
  return (
    <div className="flex justify-end pt-3 mt-2 border-t border-gray-50">
      <button
        onClick={onClick}
        disabled={saving}
        className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? 'Saving…' : label}
      </button>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  );
}

function AlertBanner({
  type,
  title,
  message,
  actions,
}: {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  message?: string;
  actions?: React.ReactNode;
}) {
  const styles = {
    success: { wrap: 'bg-emerald-50 border-emerald-100 text-emerald-900', icon: 'bg-emerald-100 text-emerald-600', Icon: CheckCircle2 },
    error: { wrap: 'bg-red-50 border-red-100 text-red-900', icon: 'bg-red-100 text-red-600', Icon: AlertCircle },
    warning: { wrap: 'bg-amber-50 border-amber-100 text-amber-900', icon: 'bg-amber-100 text-amber-600', Icon: AlertCircle },
    info: { wrap: 'bg-blue-50 border-blue-100 text-blue-900', icon: 'bg-blue-100 text-blue-600', Icon: AlertCircle },
    loading: { wrap: 'bg-blue-50 border-blue-100 text-blue-900', icon: 'bg-blue-100 text-blue-600', Icon: Loader2 },
  }[type];

  return (
    <div className={`rounded-lg p-3 border flex items-start gap-2.5 ${styles.wrap}`}>
      <div className={`p-1 rounded-full shrink-0 ${styles.icon}`}>
        <styles.Icon className={`w-3.5 h-3.5 ${type === 'loading' ? 'animate-spin' : ''}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-tight">{title}</p>
        {message && <p className="text-[11px] mt-0.5 opacity-80 leading-snug">{message}</p>}
        {actions && <div className="mt-1.5 flex gap-3">{actions}</div>}
      </div>
    </div>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function GeneralTab({ settings, onChange, onSave, saving }: TabProps) {
  const freelanceCategories = [
    'Design & Creative', 'Software Development', 'Consulting & Strategy',
    'Writing & Content', 'Marketing & Growth', 'Video & Photography',
    'Finance & Accounting', 'Legal Services', 'Other'
  ];
  const savedCategory = settings.freelanceCategory || '';
  const isCustomCategory = Boolean(savedCategory) && !freelanceCategories.includes(savedCategory);
  const categoryOptions = isCustomCategory
    ? [...freelanceCategories.slice(0, -1), savedCategory, 'Other']
    : freelanceCategories;

  return (
    <div className="space-y-4">
      {/* Identity */}
      <Card>
        <SectionHeader icon={Building} title="Your business identity" description="How you appear on invoices and client-facing documents" />
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Your full name" hint="Shown as the invoice sender">
            <input className={inputCls} value={settings.owner_name || ''} onChange={e => onChange('owner_name', e.target.value)} placeholder="e.g. Priya Sharma" />
          </Field>
          <Field label="Business / brand name" hint="Leave blank to use your name">
            <input className={inputCls} value={settings.businessName || ''} onChange={e => onChange('businessName', e.target.value)} placeholder="e.g. Priya Design Studio" />
          </Field>
          <Field label="Freelance category" hint="Helps Capita give you relevant advice">
            <select className={inputCls} value={savedCategory} onChange={e => onChange('freelanceCategory', e.target.value)}>
              <option value="">Select your category</option>
              {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          {(savedCategory === 'Other' || isCustomCategory) && (
            <Field label="Custom category" hint="Saved exactly as entered and shown in this dropdown later">
              <input
                className={inputCls}
                value={isCustomCategory ? savedCategory : (settings.customFreelanceCategory || '')}
                onChange={e => {
                  const value = e.target.value;
                  onChange('customFreelanceCategory', value);
                  onChange('freelanceCategory', value);
                }}
                placeholder="e.g. Architecture & Interiors"
              />
            </Field>
          )}
          <Field label="Currency">
            <select className={inputCls} value={settings.currency || 'INR'} onChange={e => onChange('currency', e.target.value)}>
              <option value="INR">₹ Indian Rupee (INR)</option>
              <option value="USD">$ US Dollar (USD)</option>
              <option value="EUR">€ Euro (EUR)</option>
              <option value="GBP">£ British Pound (GBP)</option>
              <option value="AED">د.إ UAE Dirham (AED)</option>
              <option value="SGD">S$ Singapore Dollar (SGD)</option>
            </select>
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-4 pt-1">
          <Field label="Your standard daily rate" hint="Used by Capita to estimate project profitability">
            <input type="number" className={inputCls} value={settings.dailyRate || ''} onChange={e => onChange('dailyRate', e.target.value)} placeholder="e.g. 8000" />
          </Field>
          <Field label="Tax ID / GSTIN" hint="If registered for GST">
            <input className={`${inputCls} font-mono uppercase`} value={settings.companyTaxId || ''} onChange={e => onChange('companyTaxId', e.target.value)} placeholder="27ABCDE1234F1Z5" />
          </Field>
        </div>
        <SaveRow onClick={() => onSave(['owner_name', 'businessName', 'freelanceCategory', 'customFreelanceCategory', 'currency', 'dailyRate', 'companyTaxId'], 'Business identity')} saving={saving} />
      </Card>

      {/* Contact */}
      <Card>
        <SectionHeader icon={Mail} title="Contact details" description="How clients can reach you — shown on invoices" iconColor="text-blue-500" iconBg="bg-blue-50" />
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Email address">
            <input type="email" className={inputCls} value={settings.email || ''} onChange={e => onChange('email', e.target.value)} placeholder="you@email.com" />
          </Field>
          <Field label="Phone number">
            <input className={inputCls} value={settings.phone || ''} onChange={e => onChange('phone', e.target.value)} placeholder="+91 98765 43210" />
          </Field>
        </div>
        <Field label="Location / city" hint="Optional — shown on invoice footer">
          <input className={inputCls} value={settings.address || ''} onChange={e => onChange('address', e.target.value)} placeholder="e.g. Mumbai, Maharashtra" />
        </Field>
        <SaveRow onClick={() => onSave(['email', 'phone', 'address'], 'Contact details')} saving={saving} />
      </Card>
    </div>
  );
}

function BrandingTab({ onSave, saving, logoPreview, onLogoChange }: Omit<TabProps, 'onChange'> & { logoPreview: string | null; onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <Card>
      <SectionHeader icon={ImageIcon} title="Your logo" description="Appears on all invoices and client-facing emails" />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <label className="group relative cursor-pointer shrink-0">
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden transition-colors group-hover:border-primary/40 group-hover:bg-primary/5">
            {logoPreview
              ? <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
              : <div className="text-center"><ImageIcon className="w-6 h-6 text-gray-300 mx-auto mb-1" /><span className="text-[10px] text-gray-400">No logo</span></div>
            }
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-900 text-white text-[9px] font-bold rounded-full opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
            Change
          </span>
          <input type="file" className="hidden" accept="image/*" onChange={onLogoChange} />
        </label>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary/50 text-sm font-semibold rounded-lg cursor-pointer transition active:scale-95 shadow-sm">
            <Upload className="w-3.5 h-3.5 text-text-muted" />
            Upload logo
            <input type="file" className="hidden" accept="image/*" onChange={onLogoChange} />
          </label>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Recommended: 400×400px, PNG/JPG, max 2MB.<br />
            Auto-optimised for invoice headers.
          </p>
        </div>
      </div>

      <SaveRow onClick={() => onSave(['logoFilename'], 'Branding')} label="Update branding" saving={saving} />
    </Card>
  );
}

function PaymentsTab({ settings, onChange, onSave, saving }: TabProps) {
  const legacyBank = parseLegacyBankDetails(settings.bankDetails || '');
  const bankName = settings.bankName || legacyBank.bankName;
  const bankAccountNumber = settings.bankAccountNumber || legacyBank.bankAccountNumber;
  const bankIfsc = settings.bankIfsc || legacyBank.bankIfsc;

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader icon={Receipt} title="Invoice defaults" description="Pre-filled on every new invoice you create" />
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Default payment terms">
            <select className={inputCls} value={settings.paymentTerms || ''} onChange={e => onChange('paymentTerms', e.target.value)}>
              <option value="">Select terms</option>
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="Net 7">Net 7 (7 days)</option>
              <option value="Net 15">Net 15 (15 days)</option>
              <option value="Net 30">Net 30 (30 days)</option>
              <option value="Net 45">Net 45 (45 days)</option>
            </select>
          </Field>
          <Field label="Default GST rate (%)">
            <select className={inputCls} value={settings.defaultGstRate || '18'} onChange={e => onChange('defaultGstRate', e.target.value)}>
              <option value="0">0% (Exempt / Export)</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18% (Most services)</option>
              <option value="28">28%</option>
            </select>
          </Field>
        </div>
        <Field label="Default thank-you note">
          <textarea className={`${inputCls} resize-none`} rows={2} value={settings.invoiceNotes || ''} onChange={e => onChange('invoiceNotes', e.target.value)} placeholder="e.g. Thank you for the opportunity! Looking forward to working with you again." />
        </Field>
        <SaveRow onClick={() => onSave(['paymentTerms', 'defaultGstRate', 'invoiceNotes'], 'Invoice defaults')} saving={saving} />
      </Card>

      <Card>
        <SectionHeader icon={CreditCard} title="How clients pay you" description="Payment details printed on every invoice" iconColor="text-emerald-500" iconBg="bg-emerald-50" />
        <Field label="UPI ID" hint="Generates a scannable QR code on PDF invoices — the easiest way to get paid.">
          <input className={inputCls} value={settings.upiId || ''} onChange={e => onChange('upiId', e.target.value)} placeholder="yourname@upi" />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Bank name" hint="Shown for NEFT / RTGS transfers">
            <input
              className={inputCls}
              value={bankName}
              onChange={e => onChange('bankName', e.target.value)}
              placeholder="HDFC Bank"
            />
          </Field>
          <Field label="Account number">
            <input
              className={`${inputCls} font-mono`}
              value={bankAccountNumber}
              onChange={e => onChange('bankAccountNumber', e.target.value)}
              placeholder="1234567890"
            />
          </Field>
          <Field label="IFSC code">
            <input
              className={`${inputCls} font-mono uppercase`}
              value={bankIfsc}
              onChange={e => onChange('bankIfsc', e.target.value.toUpperCase())}
              placeholder="HDFC0001234"
            />
          </Field>
          <Field label="Payment note" hint="e.g. Reference or instructions">
            <textarea className={`${inputCls} resize-none`} rows={3} value={settings.paymentInstructions || ''} onChange={e => onChange('paymentInstructions', e.target.value)} placeholder="Please include invoice number in the payment reference." />
          </Field>
        </div>
        <SaveRow onClick={() => onSave(['upiId', 'bankName', 'bankAccountNumber', 'bankIfsc', 'paymentInstructions'], 'Payment details')} saving={saving} />
      </Card>
    </div>
  );
}

function EmailTab({ settings, onChange, isVerified, connectionChecked, testingConnection, testStatus, onVerify, onDisconnect }: {
  settings: Record<string, any>;
  onChange: (key: string, val: string) => void;
  isVerified: boolean;
  connectionChecked: boolean;
  testingConnection: boolean;
  testStatus: { type: 'success' | 'error' | null; message: string | null };
  onVerify: (user: string, pass: string) => void;
  onDisconnect: () => void;
}) {
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const handleConnect = async () => {
    if (!settings.smtp_user || !settings.smtp_pass) return;
    try {
      await dataService.saveSetting('smtp_user', settings.smtp_user);
      await dataService.saveSetting('smtp_pass', settings.smtp_pass);
    } catch { /* continue */ }
    onVerify(settings.smtp_user, settings.smtp_pass);
  };

  return (
    <Card>
      <SectionHeader icon={Mail} title="Connect your Gmail" description="Send invoices directly from your own Gmail account" />

      {isVerified && settings.smtp_user ? (
        <div className="space-y-3">
          <AlertBanner
            type={testingConnection ? 'loading' : 'success'}
            title={testingConnection ? 'Verifying connection…' : 'Gmail connected'}
            message={testingConnection ? 'Please wait while we verify your credentials.' : `Sending as ${settings.smtp_user}`}
            actions={!testingConnection ? (
              <>
                <button onClick={() => onVerify(settings.smtp_user, settings.smtp_pass)} className="text-[11px] font-semibold text-emerald-700 hover:underline">
                  Test connection
                </button>
                <button onClick={onDisconnect} className="text-[11px] font-semibold text-gray-500 hover:underline">
                  Disconnect
                </button>
              </>
            ) : undefined}
          />
          {testStatus.type && testStatus.message && (
            <AlertBanner type={testStatus.type} title={testStatus.type === 'success' ? 'Test passed' : 'Test failed'} message={testStatus.message} />
          )}
        </div>
      ) : (
        <div className="space-y-4 max-w-sm">
          {!connectionChecked && (
            <AlertBanner
              type="info"
              title="Set up Gmail before connecting"
              message="1. Turn on Google 2-Step Verification. 2. Generate a 16-digit App Password. 3. Paste your Gmail address and App Password here."
              actions={
                <>
                  <a
                    href="https://myaccount.google.com/security?utm_source=capitaedgex&utm_medium=settings&utm_campaign=gmail_setup#2sv"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-blue-700 hover:underline"
                  >
                    Turn on 2-Step Verification
                  </a>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-blue-700 hover:underline"
                  >
                    Generate App Password
                  </a>
                </>
              }
            />
          )}
          {connectionChecked && testStatus.type === 'error' && (
            <AlertBanner type="warning" title="Connection issue" message={testStatus.message || 'Check your App Password and try again.'} />
          )}

          <Field label="Gmail address">
            <input type="email" className={inputCls} value={settings.smtp_user || ''} onChange={e => onChange('smtp_user', e.target.value)} placeholder="you@gmail.com" />
          </Field>

          <Field label="App password" hint="Required because 2-Step Verification is enabled.">
            <div className="flex items-center justify-end mb-1">
              <div className="flex items-center gap-3">
                <a href="https://myaccount.google.com/security?utm_source=capitaedgex&utm_medium=settings&utm_campaign=gmail_setup#2sv" target="_blank" rel="noreferrer" className="text-[11px] text-primary font-medium hover:underline flex items-center">
                  Enable 2-Step Verification <ChevronRight className="w-3 h-3" />
                </a>
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-[11px] text-primary font-medium hover:underline flex items-center">
                  Generate App Password <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="relative">
              <input
                type={showSmtpPass ? "text" : "password"}
                className={`${inputCls} font-mono tracking-widest pr-10`}
                value={settings.smtp_pass || ''}
                onChange={e => onChange('smtp_pass', e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
              />
              <button
                type="button"
                onClick={() => setShowSmtpPass(!showSmtpPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                title={showSmtpPass ? "Hide password" : "Show password"}
              >
                {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>

          <button
            onClick={handleConnect}
            disabled={!settings.smtp_user || !settings.smtp_pass || testingConnection}
            className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold shadow-sm shadow-primary/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {testingConnection && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {testingConnection ? 'Connecting…' : 'Connect Gmail'}
          </button>
        </div>
      )}
    </Card>
  );
}

// ─── Shared tab prop type ─────────────────────────────────────────────────────
interface TabProps {
  settings: Record<string, any>;
  onChange: (key: string, value: string) => void;
  onSave: (keys: string[], label: string) => void;
  saving: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });
  const [testingConnection, setTestingConnection] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [connectionChecked, setConnectionChecked] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await dataService.getSettings();
      setSettings(data);
      if (data.logoFilename) setLogoPreview(dataService.getLogoUrl(data.logoFilename));
      if (data.smtp_user && data.smtp_pass) { setIsVerified(true); setConnectionChecked(true); }
    } catch (err) {
      console.error('Failed to load settings:', err);
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
        setTestStatus({ type: 'error', message: res.error || 'Connection failed.' });
      }
    } catch (err: any) {
      setConnectionChecked(true);
      setIsVerified(false);
      setTestStatus({ type: 'error', message: err.message || 'Connection test failed.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleChange = (key: string, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (keys: string[], sectionName: string) => {
    try {
      setSaving(true);
      setSuccessMessage(null);

      if (keys.includes('logoFilename') && logoFile) {
        const { filename } = await dataService.uploadLogo(logoFile);
        await dataService.saveSetting('logoFilename', filename);
        setSettings(prev => ({ ...prev, logoFilename: filename }));
        setLogoFile(null);
      }

      await Promise.all(
        keys
          .filter(k => k !== 'logoFilename' && settings[k] !== undefined)
          .map(k => dataService.saveSetting(k, settings[k]))
      );

      setSuccessMessage(`${sectionName} saved.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(`Save failed (${sectionName}):`, err);
      alert(`Failed to save ${sectionName}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'branding', label: 'Branding', icon: ImageIcon },
    { id: 'payments', label: 'Invoicing & payments', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
  ];

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const tabProps: TabProps = { settings, onChange: handleChange, onSave: handleSave, saving };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <SettingsIcon className="w-4 h-4 text-primary" />
          </div>
          Organisation settings
        </h2>
        <p className="text-[13px] text-text-muted mt-1 ml-8">Manage your business profile and invoice configuration.</p>
      </div>

      {/* Global success toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-2.5 rounded-lg flex items-center gap-2 text-[13px] font-medium shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-6 items-start">

        {/* Sidebar - Horizontal scroll on mobile, vertical stack on desktop */}
        <nav className="w-full md:w-56 shrink-0 flex overflow-x-auto md:flex-col gap-2 md:gap-1 pb-2 md:pb-0 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left transition-all duration-150 whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm border border-gray-100 font-semibold'
                  : 'text-text-muted hover:bg-white hover:text-text-main border border-transparent'
                }
              `}
            >
              <tab.icon className={`w-3.5 h-3.5 shrink-0 ${activeTab === tab.id ? 'text-primary' : 'text-text-light'}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'general' && <GeneralTab {...tabProps} />}
              {activeTab === 'branding' && <BrandingTab {...tabProps} logoPreview={logoPreview} onLogoChange={handleLogoChange} />}
              {activeTab === 'payments' && <PaymentsTab {...tabProps} />}
              {activeTab === 'email' && (
                <EmailTab
                  settings={settings}
                  onChange={handleChange}
                  isVerified={isVerified}
                  connectionChecked={connectionChecked}
                  testingConnection={testingConnection}
                  testStatus={testStatus}
                  onVerify={verifyConnection}
                  onDisconnect={() => {
                    setSettings(prev => ({ ...prev, smtp_user: '', smtp_pass: '' }));
                    setIsVerified(false);
                    setConnectionChecked(false);
                    setTestStatus({ type: null, message: null });
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
