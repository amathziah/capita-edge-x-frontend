import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Box, TrendingUp, AlertCircle, X, Bot, Edit2, Settings2, Filter, Search, Trash2, AlertTriangle, Package, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { dataService } from '../services/dataService';
import { Product } from '../types';
import { InventoryInsights, VelocityBadge } from '../components/Inventory/InventoryInsights';
import { InventorySettings, InventorySettingsData } from '../components/Inventory/InventorySettings';

interface InventoryItem extends Product {
  sales: number;
}

export function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [invSettings, setInvSettings] = useState<InventorySettingsData>({
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
  });

  // Advanced Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');

  // Data Fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      const [products, performance] = await Promise.all([
        dataService.getProducts(),
        dataService.getProductPerformance().catch(() => [])
      ]);

      const merged = products.map(p => {
        const perf = performance.find((x: any) => x.id === p.id || x.name === p.name);
        return {
          ...p,
          sales: perf ? perf.total_quantity_sold || perf.sales || 0 : 0
        };
      });

      setInventory(merged);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    loadInventorySettings();
  }, []);

  const loadInventorySettings = async () => {
    try {
      const data = await dataService.getInventorySettings();
      setInvSettings(prev => ({ ...prev, ...data } as InventorySettingsData));
    } catch (err) {
      console.error('Failed to load inventory settings:', err);
    }
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      if (editingProduct) {
        await dataService.updateProduct(editingProduct.id, productData);
      } else {
        await dataService.saveProduct(productData);
      }
      await fetchData(); // Refresh list
      setCreateModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("Failed to save product. Please try again.");
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setCreateModalOpen(true);
  };

  const handeCreateClick = () => {
    setEditingProduct(null);
    setCreateModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await dataService.deleteProduct(deleteTarget.id);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product. Please try again.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const defaultReorder = Number(invSettings.inv_default_reorder_level) || 10;
  const overstockMultiplier = Number(invSettings.inv_overstocked_multiplier) || 3;

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock === 0) return { label: 'Out of Stock', color: 'bg-red-500', ring: 'ring-red-200', text: 'text-red-700' };

    // Dead Stock logic
    const daysSinceCreation = (new Date().getTime() - new Date(item.createdAt).getTime()) / (1000 * 3600 * 24);
    if (item.sales === 0 && daysSinceCreation > Number(invSettings.inv_dead_stock_threshold)) {
      return { label: 'Dead Stock', color: 'bg-gray-900', ring: 'ring-gray-200', text: 'text-gray-900' };
    }

    if (item.stock < (item.minStock || defaultReorder)) return { label: 'Reorder Soon', color: 'bg-yellow-500', ring: 'ring-yellow-200', text: 'text-yellow-700' };

    if (item.stock > (item.minStock || defaultReorder) * overstockMultiplier) return { label: 'Overstocked', color: 'bg-orange-500', ring: 'ring-orange-200', text: 'text-orange-700' };

    return { label: 'Healthy', color: 'bg-emerald-500', ring: 'ring-emerald-200', text: 'text-emerald-700' };
  };

  // Derived State for Filters
  const categories = ['All', ...Array.from(new Set(inventory.map(i => i.category || 'Uncategorized').filter(Boolean)))];
  const vendors = ['All', ...Array.from(new Set(inventory.map(i => i.vendor || 'Unknown').filter(Boolean)))];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.vendor && item.vendor.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const matchesCategory = categoryFilter === 'All' || (item.category || 'Uncategorized') === categoryFilter;
    const matchesVendor = vendorFilter === 'All' || (item.vendor || 'Unknown') === vendorFilter;

    let matchesStock = true;
    if (stockFilter !== 'All') {
      const status = getStockStatus(item);
      matchesStock = status.label === stockFilter;
    }

    return matchesSearch && matchesCategory && matchesVendor && matchesStock;
  });

  const totalValue = filteredInventory.reduce((sum, item) => sum + (item.stock * (item.costPrice || 0)), 0);
  const lowStockCount = inventory.filter((i) => i.stock > 0 && i.stock < (i.minStock || defaultReorder)).length;
  const outOfStockCount = inventory.filter((i) => i.stock === 0).length;

  if (loading) {
    return (
      <div className="p-6 space-y-8 bg-gray-50 min-h-screen animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-7 w-64 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-96 bg-gray-100 rounded-lg"></div>
        </div>

        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 h-24 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
              <div className="h-3 w-16 bg-gray-100 rounded"></div>
              <div className="h-5 w-12 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Search Bar Skeleton */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="h-10 w-full md:w-1/3 bg-white border border-gray-200 rounded-lg"></div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-24 bg-gray-100 rounded-lg"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="h-12 bg-gray-50 border-b border-gray-100"></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-8 gap-4 px-6 py-4 border-b border-gray-50 items-center">
              <div className="col-span-1 space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-3 w-16 bg-gray-100 rounded"></div>
              </div>
              <div className="col-span-1 space-y-2">
                <div className="h-4 w-20 bg-gray-100 rounded"></div>
                <div className="h-3 w-12 bg-gray-50 rounded"></div>
              </div>
              <div className="h-4 w-12 bg-gray-100 rounded justify-self-center"></div>
              <div className="h-4 w-12 bg-gray-200 rounded justify-self-center"></div>
              <div className="h-4 w-8 bg-gray-100 rounded justify-self-center"></div>
              <div className="h-4 w-16 bg-gray-200 rounded justify-self-center"></div>
              <div className="h-6 w-20 bg-emerald-50 rounded-full justify-self-center"></div>
              <div className="h-8 w-8 bg-gray-100 rounded-full justify-self-center"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-6 space-y-8 min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#e8f5e9_0%,_#f1f8f6_45%,_#f6fbf7_100%)]" />
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl -z-10" />
      <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-teal-200/30 blur-[110px] -z-10" />

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 mb-2">
            Intelligence Engine
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Inventory Intelligence
          </h2>
          <p className="text-gray-600 mt-1.5">Financial inventory tracking & proactive stock health monitoring.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/80 backdrop-blur rounded-xl border border-emerald-200/60 shadow-sm px-4 py-2 text-center">
            <div className="text-[10px] text-emerald-500 font-bold uppercase">Products</div>
            <div className="text-lg font-black text-gray-900">{inventory.length}</div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl border border-emerald-200/60 shadow-sm px-4 py-2 text-center">
            <div className="text-[10px] text-emerald-500 font-bold uppercase">Value</div>
            <div className="text-lg font-black text-gray-900">₹{(totalValue / 1000).toFixed(0)}k</div>
          </div>
        </div>
      </motion.div>

      {/* Insights Widget */}
      <InventoryInsights />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Products', value: inventory.length, icon: Package, gradient: 'from-teal-500 to-cyan-500', glow: 'shadow-teal-500/25', accent: 'text-teal-600', bg: 'from-teal-50/60 via-white to-cyan-50/40', border: 'border-teal-200/60', ring: 'bg-teal-500', delay: 0 },
          { label: 'Inventory Value', value: `₹${(totalValue / 1000).toFixed(1)}k`, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-500', glow: 'shadow-emerald-500/25', accent: 'text-emerald-600', bg: 'from-emerald-50/60 via-white to-teal-50/40', border: 'border-emerald-200/60', ring: 'bg-emerald-500', delay: 0.04 },
          { label: 'Reorder Soon', value: lowStockCount, icon: AlertCircle, gradient: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/25', accent: 'text-amber-600', bg: 'from-amber-50/60 via-white to-orange-50/40', border: 'border-amber-200/60', ring: 'bg-amber-500', delay: 0.08, pulse: lowStockCount > 0 },
          { label: 'Out of Stock', value: outOfStockCount, icon: AlertTriangle, gradient: 'from-red-500 to-rose-500', glow: 'shadow-red-500/25', accent: 'text-red-600', bg: 'from-red-50/60 via-white to-rose-50/40', border: 'border-red-200/60', ring: 'bg-red-500', delay: 0.12, pulse: outOfStockCount > 0 },
          { label: 'AI Agents', value: 'Active', icon: Bot, gradient: 'from-violet-500 to-purple-500', glow: 'shadow-violet-500/25', accent: 'text-violet-600', bg: 'from-violet-50/60 via-white to-purple-50/40', border: 'border-violet-200/60', ring: 'bg-violet-500', delay: 0.16, clickable: true },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.05 + card.delay, ease: [0.23, 1, 0.32, 1] }}
            onClick={card.clickable ? () => setInsightsOpen(true) : undefined}
            className={`relative bg-gradient-to-br ${card.bg} backdrop-blur-xl p-4 rounded-2xl border ${card.border} shadow-sm hover:shadow-lg ${card.glow} hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group overflow-hidden ${card.clickable ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-[0.07] rounded-full blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500`} />
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />

            <div className="relative flex flex-col items-center text-center">
              <div className={`p-2 bg-gradient-to-br ${card.gradient} text-white rounded-xl shadow-lg ${card.glow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-2`}>
                <card.icon size={16} strokeWidth={2.2} />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-0.5">{card.label}</p>
              <h3 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none flex items-center gap-1.5">
                {card.value}
                {card.pulse && (
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${card.ring} opacity-50`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${card.ring}`} />
                  </span>
                )}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col gap-4">
        {/* Top Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Filter Bar */}
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-transparent text-sm text-gray-600 border-l border-gray-100 focus:outline-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2 bg-transparent text-sm text-gray-600 border-l border-gray-100 focus:outline-none cursor-pointer"
            >
              <option value="All">All Stock Status</option>
              <option value="Healthy">Healthy</option>
              <option value="Reorder Soon">Reorder Soon</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Overstocked">Overstocked</option>
              <option value="Dead Stock">Dead Stock</option>
            </select>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="px-3 py-2 bg-transparent text-sm text-gray-600 border-l border-gray-100 focus:outline-none cursor-pointer"
            >
              {vendors.map(v => (
                <option key={v} value={v}>{v === 'All' ? 'All Vendors' : v}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 shrink-0">
            {(searchTerm || categoryFilter !== 'All' || stockFilter !== 'All' || vendorFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('All');
                  setStockFilter('All');
                  setVendorFilter('All');
                }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition mr-2"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={handeCreateClick}
              className="px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary-dark transition text-sm font-medium"
            >
              + Add Product
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg shadow hover:bg-gray-200 transition text-sm font-medium">
              Export
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-3 py-2 bg-white text-gray-600 rounded-lg shadow border border-gray-200 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition group"
              title="Advanced Settings"
            >
              <Settings2 className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm overflow-hidden border border-emerald-100/60 flex flex-col h-[calc(100vh-340px)] min-h-[320px]"
      >
        <div className="flex-1 overflow-auto scroll-smooth">
          <table className="min-w-full text-sm text-left relative">
            <thead className="bg-gradient-to-r from-emerald-50/80 to-teal-50/50 backdrop-blur text-gray-500 uppercase text-[10px] font-bold tracking-widest sticky top-0 z-10 border-b border-emerald-100/60">
              <tr>
                <th className="px-6 py-3.5 whitespace-nowrap">Product / SKU</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Category / Vendor</th>
                {invSettings.inv_show_cost_column === 'true' && <th className="px-6 py-3.5 text-center whitespace-nowrap">Cost (COGS)</th>}
                <th className="px-6 py-3.5 text-center whitespace-nowrap">Price</th>
                <th className="px-6 py-3.5 text-center whitespace-nowrap">Stock</th>
                <th className="px-6 py-3.5 text-center whitespace-nowrap">Value</th>
                <th className="px-6 py-3.5 text-center whitespace-nowrap">Health</th>
                <th className="px-6 py-3.5 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/60 text-gray-800">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-4 bg-gray-50 rounded-full mb-3">
                        <Filter className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-900">No products found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredInventory.map((item, idx) => {
                const status = getStockStatus(item);
                const value = item.stock * (item.costPrice || 0);
                const margin = item.price > 0 && item.costPrice ? Math.round(((item.price - item.costPrice) / item.price) * 100) : null;
                const stockPct = item.minStock ? Math.round((item.stock / (item.minStock * overstockMultiplier)) * 100) : null;
                return (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{item.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.category || 'Uncategorized'}</div>
                      <div className="text-[11px] text-gray-400">{item.vendor || '—'}</div>
                    </td>
                    {invSettings.inv_show_cost_column === 'true' && (
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-gray-500">₹{item.costPrice || 0}</div>
                        {margin !== null && (
                          <div className={`text-[10px] font-bold mt-0.5 ${margin >= 30 ? 'text-emerald-600' : margin >= 15 ? 'text-amber-600' : 'text-red-600'}`}>
                            {margin}% margin
                          </div>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-gray-900">₹{item.price}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-bold text-sm">{item.stock}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{item.unit}</div>
                      {stockPct !== null && (
                        <div className="w-12 mx-auto mt-1.5">
                          <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${stockPct > 80 ? 'bg-orange-500' : stockPct > 30 ? 'bg-emerald-500' : stockPct > 10 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                              style={{ width: `${Math.min(stockPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-gray-700">₹{value.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-1.5 items-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${status.color.replace('bg-', 'bg-opacity-10 bg-')} ${status.text} ring-1 ring-inset ${status.ring}`}>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className={`${status.label !== 'Healthy' ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full ${status.color} opacity-50`} />
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.color}`} />
                          </span>
                          {status.label}
                        </span>
                        {invSettings.inv_show_velocity_badges === 'true' && (
                          <VelocityBadge
                            velocity={item.sales > 0 ? item.sales / Number(invSettings.inv_velocity_window || 30) : 0}
                            daysRemaining={item.sales > 0 ? item.stock / (item.sales / Number(invSettings.inv_velocity_window || 30)) : Infinity}
                            lastSoldDate={null}
                            hasSalesData={item.sales > 0}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        initialData={editingProduct}
      />

      {/* Advanced Settings Panel */}
      <InventorySettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettingsChange={(newSettings) => setInvSettings(newSettings)}
      />

      {/* Insights Modal */}
      {createPortal(
        <AnimatePresence>
          {insightsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            >
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setInsightsOpen(false)}
              />
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative z-10 max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 overflow-hidden"
              >
                {/* Premium Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Inventory Intelligence</h4>
                      <p className="text-xs text-primary font-medium tracking-wide uppercase">AI-Powered Analysis</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setInsightsOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-200/60 shadow-inner">
                    <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Strategic Overview
                    </h5>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Based on your current stock levels of <span className="font-semibold text-gray-900">{inventory.length} items</span> with a valuation of <span className="font-semibold text-gray-900">₹{totalValue.toLocaleString()}</span>:
                    </p>
                    <div className="mt-4 p-4 bg-white rounded-lg border border-primary/10 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                      <p className="text-sm font-medium text-gray-800 relative z-10">Use AI Recommendation:</p>
                      <p className="text-sm text-gray-600 mt-1 relative z-10">
                        {lowStockCount > 3
                          ? "Alert: Multiple key items are below safety stock levels. We recommend a consolidated reorder to optimize shipping costs and prevent revenue loss."
                          : "Status Healthy: Inventory levels are optimized. Capitalize on high-margin items and consider running promotions on slower-moving stock."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setInsightsOpen(false)}
                    className="px-5 py-2 bg-white border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Close Analysis
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Delete Confirmation Dialog */}
      {createPortal(
        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            >
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => !deleting && setDeleteTarget(null)}
              />
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative z-10 max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
              >
                {/* Red accent bar */}
                <div className="h-1 bg-gradient-to-r from-rose-500 to-red-500" />

                <div className="p-6">
                  {/* Icon + Title */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="p-3 bg-rose-50 rounded-xl flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Delete Product</h4>
                      <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
                    </div>
                  </div>

                  {/* Product Details Card */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">{deleteTarget.name}</span>
                      <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{deleteTarget.sku || 'No SKU'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Stock</p>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">{deleteTarget.stock} {deleteTarget.unit}</p>
                      </div>
                      <div className="text-center border-x border-gray-200">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Price</p>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">₹{deleteTarget.price}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Value</p>
                        <p className="text-sm font-semibold text-rose-600 mt-0.5">₹{(deleteTarget.stock * (deleteTarget.costPrice || 0)).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteTarget(null)}
                      disabled={deleting}
                      className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteProduct}
                      disabled={deleting}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white font-medium rounded-xl hover:from-rose-600 hover:to-red-600 transition-all text-sm shadow-lg shadow-rose-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {deleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete Product
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

function CreateProductModal({ isOpen, onClose, onSave, initialData }: { isOpen: boolean; onClose: () => void; onSave: (data: any) => void; initialData?: Product | null }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    unit: 'pcs',
    minStock: 10,
    sku: '',
    category: '',
    vendor: '',
    costPrice: 0,
    taxRate: 0,
    reorderLevel: 10
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price || 0,
        stock: initialData.stock || 0,
        unit: initialData.unit || 'pcs',
        minStock: initialData.minStock || 10,
        sku: initialData.sku || '',
        category: initialData.category || '',
        vendor: initialData.vendor || '',
        costPrice: initialData.costPrice || 0,
        taxRate: initialData.taxRate || 0,
        reorderLevel: initialData.reorderLevel || 10
      });
    } else {
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        unit: 'pcs',
        minStock: 10,
        sku: '',
        category: '',
        vendor: '',
        costPrice: 0,
        taxRate: 0,
        reorderLevel: 10
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 text-left">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{initialData ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                rows={2}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Row 1: SKU & Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">SKU (Stock Keeping Unit)</label>
              <input
                type="text"
                placeholder="e.g. BLU-TSHIRT-M"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                list="categories"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
              <datalist id="categories">
                <option value="Electronics" />
                <option value="Clothing" />
                <option value="Groceries" />
                <option value="Services" />
              </datalist>
            </div>

            {/* Row 2: Pricing */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price (₹)</label>
              <input
                required
                type="number"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cost Price (COGS) (₹)</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                value={formData.costPrice}
                onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
              />
            </div>

            {/* Row 3: Tax & Vendor */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                value={formData.taxRate}
                onChange={e => setFormData({ ...formData, taxRate: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vendor / Supplier</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                value={formData.vendor}
                onChange={e => setFormData({ ...formData, vendor: e.target.value })}
              />
            </div>

            {/* Row 4: Stock */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input
                required
                type="number"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kg</option>
                <option value="ltr">Litre</option>
                <option value="box">Box</option>
                <option value="service">Service</option>
              </select>
            </div>

            {/* Row 5: Alerts */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reorder Level (Min Stock)</label>
              <input
                required
                type="number"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                value={formData.minStock} // Keeping minStock for backward compat, backend maps reorderLevel
                onChange={e => setFormData({ ...formData, minStock: Number(e.target.value), reorderLevel: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition"
            >
              {initialData ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}
