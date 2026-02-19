import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings2, Brain, Bell, Eye, Loader2, Check } from 'lucide-react';
import { dataService } from '../../services/dataService';

export interface InventorySettingsData {
    inv_dead_stock_threshold: string;
    inv_stockout_warning_days: string;
    inv_velocity_window: string;
    inv_overstocked_multiplier: string;
    inv_default_reorder_level: string;
    inv_low_stock_alerts: string;
    inv_dead_stock_alerts: string;
    inv_auto_reorder_suggestions: string;
    inv_show_velocity_badges: string;
    inv_show_cost_column: string;
    inv_valuation_method: string;
}

const DEFAULTS: InventorySettingsData = {
    inv_dead_stock_threshold: '60',
    inv_stockout_warning_days: '7',
    inv_velocity_window: '30',
    inv_overstocked_multiplier: '3',
    inv_default_reorder_level: '10',
    inv_low_stock_alerts: 'true',
    inv_dead_stock_alerts: 'true',
    inv_auto_reorder_suggestions: 'false',
    inv_show_velocity_badges: 'true',
    inv_show_cost_column: 'true',
    inv_valuation_method: 'weighted_avg'
};

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSettingsChange: (settings: InventorySettingsData) => void;
}

export function InventorySettings({ isOpen, onClose, onSettingsChange }: Props) {
    const [settings, setSettings] = useState<InventorySettingsData>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<'forecasting' | 'alerts' | 'display'>('forecasting');

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await dataService.getInventorySettings();
            setSettings({ ...DEFAULTS, ...data });
        } catch (err) {
            console.error('Failed to load inventory settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = useCallback(async (updatedSettings: InventorySettingsData) => {
        try {
            setSaving(true);
            setSaved(false);
            await dataService.saveInventorySettings(updatedSettings as unknown as Record<string, string>);
            onSettingsChange(updatedSettings);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save settings:', err);
        } finally {
            setSaving(false);
        }
    }, [onSettingsChange]);

    const updateField = (key: keyof InventorySettingsData, value: string) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
    };

    const toggleField = (key: keyof InventorySettingsData) => {
        const updated = { ...settings, [key]: settings[key] === 'true' ? 'false' : 'true' };
        setSettings(updated);
    };

    if (!isOpen) return null;

    const sections = [
        { id: 'forecasting' as const, label: 'Forecasting Engine', icon: Brain, desc: 'Thresholds & windows' },
        { id: 'alerts' as const, label: 'Alert Preferences', icon: Bell, desc: 'Notifications & triggers' },
        { id: 'display' as const, label: 'Display Options', icon: Eye, desc: 'UI & visualization' },
    ];

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex"
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

                    {/* Slide-out Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-light to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Settings2 className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Advanced Settings</h3>
                                    <p className="text-[11px] text-primary-dark font-medium uppercase tracking-wider">Inventory Intelligence</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Section Tabs */}
                        <div className="px-4 pt-4 pb-2">
                            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                                {sections.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setActiveSection(s.id)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeSection === s.id
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <s.icon className="w-3.5 h-3.5" />
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {loading ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                </div>
                            ) : (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeSection}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.15 }}
                                        className="space-y-5"
                                    >
                                        {activeSection === 'forecasting' && (
                                            <>
                                                <SectionHeader
                                                    title="Forecasting Engine"
                                                    desc="Configure how the analysis engine detects stock anomalies"
                                                />
                                                <NumberInput
                                                    label="Dead Stock Threshold"
                                                    desc="Days without a sale before flagging as dead stock"
                                                    suffix="days"
                                                    value={settings.inv_dead_stock_threshold}
                                                    onChange={(v) => updateField('inv_dead_stock_threshold', v)}
                                                    min={7} max={365}
                                                />
                                                <NumberInput
                                                    label="Stockout Warning Window"
                                                    desc="Trigger alert when stock will run out within N days"
                                                    suffix="days"
                                                    value={settings.inv_stockout_warning_days}
                                                    onChange={(v) => updateField('inv_stockout_warning_days', v)}
                                                    min={1} max={90}
                                                />
                                                <NumberInput
                                                    label="Velocity Calculation Window"
                                                    desc="Period for computing avg daily sales rate"
                                                    suffix="days"
                                                    value={settings.inv_velocity_window}
                                                    onChange={(v) => updateField('inv_velocity_window', v)}
                                                    min={7} max={180}
                                                />
                                                <NumberInput
                                                    label="Overstocked Multiplier"
                                                    desc="Flag product if stock exceeds reorder level × this multiplier"
                                                    suffix="×"
                                                    value={settings.inv_overstocked_multiplier}
                                                    onChange={(v) => updateField('inv_overstocked_multiplier', v)}
                                                    min={2} max={10}
                                                />
                                                <NumberInput
                                                    label="Default Reorder Level"
                                                    desc="Fallback min stock threshold for new products"
                                                    suffix="units"
                                                    value={settings.inv_default_reorder_level}
                                                    onChange={(v) => updateField('inv_default_reorder_level', v)}
                                                    min={1} max={1000}
                                                />
                                            </>
                                        )}

                                        {activeSection === 'alerts' && (
                                            <>
                                                <SectionHeader
                                                    title="Alert Preferences"
                                                    desc="Control which notifications the engine generates"
                                                />
                                                <ToggleSwitch
                                                    label="Low Stock Alerts"
                                                    desc="Get notified when products fall below their reorder level"
                                                    enabled={settings.inv_low_stock_alerts === 'true'}
                                                    onToggle={() => toggleField('inv_low_stock_alerts')}
                                                />
                                                <ToggleSwitch
                                                    label="Dead Stock Alerts"
                                                    desc="Get notified about products with no sales activity"
                                                    enabled={settings.inv_dead_stock_alerts === 'true'}
                                                    onToggle={() => toggleField('inv_dead_stock_alerts')}
                                                />
                                                <ToggleSwitch
                                                    label="Auto-Reorder Suggestions"
                                                    desc="AI suggests reorder quantities based on velocity trends"
                                                    enabled={settings.inv_auto_reorder_suggestions === 'true'}
                                                    onToggle={() => toggleField('inv_auto_reorder_suggestions')}
                                                    badge="Beta"
                                                />
                                            </>
                                        )}

                                        {activeSection === 'display' && (
                                            <>
                                                <SectionHeader
                                                    title="Display Options"
                                                    desc="Customize how inventory data appears in the table"
                                                />
                                                <ToggleSwitch
                                                    label="Show Velocity Badges"
                                                    desc="Display 🔥 Fast Mover / 💀 Dead Stock badges on product rows"
                                                    enabled={settings.inv_show_velocity_badges === 'true'}
                                                    onToggle={() => toggleField('inv_show_velocity_badges')}
                                                />
                                                <ToggleSwitch
                                                    label="Show Cost Column"
                                                    desc="Display COGS (Cost of Goods Sold) in the product table"
                                                    enabled={settings.inv_show_cost_column === 'true'}
                                                    onToggle={() => toggleField('inv_show_cost_column')}
                                                />
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-gray-800">Valuation Method</label>
                                                    <p className="text-[11px] text-text-muted">How inventory value is calculated for reports</p>
                                                    <select
                                                        value={settings.inv_valuation_method}
                                                        onChange={(e) => updateField('inv_valuation_method', e.target.value)}
                                                        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition appearance-none cursor-pointer"
                                                    >
                                                        <option value="weighted_avg">Weighted Average Cost</option>
                                                        <option value="fifo">FIFO (First In, First Out)</option>
                                                        <option value="cost_price">Last Cost Price</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <p className="text-[11px] text-text-muted">Changes are saved per organization</p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleSave(settings)}
                                    disabled={saving}
                                    className="px-5 py-2 text-sm bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-sm disabled:opacity-60 flex items-center gap-2"
                                >
                                    {saving ? (
                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                                    ) : saved ? (
                                        <><Check className="w-3.5 h-3.5" /> Saved</>
                                    ) : (
                                        'Save Settings'
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="pb-3 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">{title}</h4>
            <p className="text-[11px] text-text-muted mt-0.5">{desc}</p>
        </div>
    );
}

function NumberInput({ label, desc, suffix, value, onChange, min, max }: {
    label: string; desc: string; suffix: string;
    value: string; onChange: (val: string) => void;
    min: number; max: number;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex-1 min-w-0">
                <label className="text-sm font-medium text-gray-800">{label}</label>
                <p className="text-[11px] text-text-muted mt-0.5">{desc}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <input
                    type="number"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-20 px-3 py-2 text-sm text-right font-medium text-gray-800 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary focus:outline-none transition"
                />
                <span className="text-xs text-text-muted font-medium w-10">{suffix}</span>
            </div>
        </div>
    );
}

function ToggleSwitch({ label, desc, enabled, onToggle, badge }: {
    label: string; desc: string; enabled: boolean; onToggle: () => void; badge?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-800">{label}</label>
                    {badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-md">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">{desc}</p>
            </div>
            <button
                onClick={onToggle}
                className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${enabled ? 'bg-primary' : 'bg-gray-200'
                    }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}
