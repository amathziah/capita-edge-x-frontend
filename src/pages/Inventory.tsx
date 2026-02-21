import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Box, TrendingUp, AlertCircle, X, Bot, Edit2, Settings2, Filter, Search, Trash2, AlertTriangle, Package, Zap, Tag, Activity, Scale, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { dataService } from '../services/dataService';
import { Product } from '../types';
import { InventoryInsights, VelocityBadge } from '../components/Inventory/InventoryInsights';
import { InventorySettings, InventorySettingsData } from '../components/Inventory/InventorySettings';
import { CustomSelect } from '../components/ui/CustomSelect';

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
      ]) as [Product[], any[]];

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
    if (item.stock === 0) return { label: 'Out of Stock', color: 'bg-gray-900', ring: 'ring-gray-200', text: 'text-gray-900' };

    // Dead Stock logic
    const daysSinceCreation = (new Date().getTime() - new Date(item.createdAt).getTime()) / (1000 * 3600 * 24);
    if (item.sales === 0 && daysSinceCreation > Number(invSettings.inv_dead_stock_threshold)) {
      return { label: 'Static Node', color: 'bg-primary/10', ring: 'ring-primary/20', text: 'text-primary-dark' };
    }

    if (item.stock < (item.minStock || defaultReorder)) return { label: 'Replenish', color: 'bg-primary', ring: 'ring-primary/20', text: 'text-white' };

    if (item.stock > (item.minStock || defaultReorder) * overstockMultiplier) return { label: 'Overstocked', color: 'bg-primary/5', ring: 'ring-primary/10', text: 'text-primary' };

    return { label: 'Healthy', color: 'bg-primary-dark', ring: 'ring-primary/20', text: 'text-white' };
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
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#f0fafa_0%,_#f7fbfd_45%,_#ffffff_100%)]" />
      <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl -z-10" />
      <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-primary/5 blur-[110px] -z-10" />

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary mb-2">
            Intelligence Engine
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </div>
          <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Inventory Intelligence
          </h2>
          <p className="text-gray-600 mt-1.5">Financial inventory tracking & proactive stock health monitoring.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/80 backdrop-blur rounded-xl border border-primary/20 shadow-sm px-4 py-2 text-center">
            <div className="text-[10px] text-primary font-bold uppercase">Products</div>
            <div className="text-lg font-black text-gray-900">{inventory.length}</div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl border border-primary/20 shadow-sm px-4 py-2 text-center">
            <div className="text-[10px] text-primary font-bold uppercase">Value</div>
            <div className="text-lg font-black text-gray-900">₹{(totalValue / 1000).toFixed(0)}k</div>
          </div>
        </div>
      </motion.div>

      {/* Insights Widget */}
      <InventoryInsights />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { label: 'Total Products', value: inventory.length, icon: Package, gradient: 'from-primary to-primary-dark', glow: 'shadow-primary/20', accent: 'text-primary', bg: 'bg-white/90', border: 'border-primary/10', ring: 'bg-primary', delay: 0 },
          { label: 'Inventory Value', value: `₹${(totalValue / 1000).toFixed(1)}k`, icon: TrendingUp, gradient: 'from-primary/90 to-primary-dark', glow: 'shadow-primary/20', accent: 'text-primary', bg: 'bg-white/90', border: 'border-primary/10', ring: 'bg-primary', delay: 0.04 },
          { label: 'Reorder Alerts', value: lowStockCount, icon: AlertCircle, gradient: 'from-primary to-primary-dark', glow: 'shadow-primary/20', accent: 'text-primary', bg: 'bg-white/90', border: 'border-primary/10', ring: 'bg-primary', delay: 0.08, pulse: lowStockCount > 0 },
          { label: 'Out of Stock', value: outOfStockCount, icon: AlertTriangle, gradient: 'from-gray-800 to-gray-900', glow: 'shadow-gray-500/10', accent: 'text-gray-900', bg: 'bg-white/90', border: 'border-gray-200/80', ring: 'bg-gray-900', delay: 0.12, pulse: outOfStockCount > 0 },
          { label: 'AI Strategy', value: 'Active', icon: Bot, gradient: 'from-primary-dark to-slate-900', glow: 'shadow-primary/20', accent: 'text-primary', bg: 'bg-white/90', border: 'border-primary/10', ring: 'bg-primary', delay: 0.16, clickable: true },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            whileHover={{ y: -5, scale: 1.02, rotate: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.05 + card.delay, ease: [0.23, 1, 0.32, 1] }}
            onClick={card.clickable ? () => setInsightsOpen(true) : undefined}
            className={`relative ${card.bg} backdrop-blur-2xl p-5 rounded-3xl border ${card.border} shadow-sm group overflow-hidden ${card.clickable ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:opacity-[0.08] transition-opacity duration-700`} />

            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-xl ${card.glow} group-hover:scale-110 transition-transform duration-500`}>
                <card.icon size={20} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{card.label}</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight truncate">{card.value}</h3>
                  {card.pulse && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${card.ring} opacity-60`} />
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${card.ring}`} />
                    </span>
                  )}
                </div>
              </div>
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
                className="px-4 py-2 text-[10px] font-black text-primary hover:bg-primary/5 rounded-xl transition-all border border-transparent hover:border-primary/20 uppercase tracking-widest"
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={handeCreateClick}
              className="group relative px-6 py-2.5 bg-gray-900 text-white rounded-2xl shadow-xl shadow-gray-200 hover:shadow-primary/30 transition-all duration-400 active:scale-95 flex items-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center gap-2 text-sm font-black tracking-wide">
                <Package className="w-4 h-4" />
                Add Product
              </div>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-3 bg-white text-gray-400 rounded-2xl shadow-sm border border-gray-100 hover:text-primary hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm overflow-hidden border border-primary/10 flex flex-col h-[calc(100vh-340px)] min-h-[320px]"
      >
        <div className="flex-1 overflow-auto scroll-smooth">
          <table className="min-w-full text-sm text-left relative">
            <thead className="bg-white/50 backdrop-blur sticky top-0 z-10">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Product Line</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Cataloging</th>
                {invSettings.inv_show_cost_column === 'true' && <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">COGS</th>}
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Unit Price</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Inventory</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Market Value</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-center">Health Score</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Actions</th>
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
              ) : filteredInventory.map((item) => {
                const status = getStockStatus(item);
                const value = item.stock * (item.costPrice || 0);
                const margin = item.price > 0 && item.costPrice ? Math.round(((item.price - item.costPrice) / item.price) * 100) : null;
                const stockPct = item.minStock ? Math.round((item.stock / (item.minStock * overstockMultiplier)) * 100) : null;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-all duration-300 group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-500">
                          <Package size={18} className="text-gray-400 group-hover:text-primary transition-colors" strokeWidth={1.5} />
                        </div>
                        <div>
                          <div className="font-extrabold text-gray-900 text-sm tracking-tight">{item.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{item.sku || 'No SKU'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100/50 text-gray-600 text-[10px] font-black uppercase tracking-widest border border-gray-200/50">
                        {item.category || 'Standard'}
                      </span>
                      <div className="text-[11px] text-gray-400 mt-1 font-medium">{item.vendor || 'In-house'}</div>
                    </td>
                    {invSettings.inv_show_cost_column === 'true' && (
                      <td className="px-6 py-5 text-center">
                        <div className="text-sm font-bold text-gray-500">₹{item.costPrice || 0}</div>
                        {margin !== null && (
                          <div className={`text-[10px] font-black mt-0.5 px-1.5 py-0.5 rounded-full inline-block ${margin >= 15 ? 'bg-primary/10 text-primary-dark' : 'bg-gray-50 text-gray-500'}`}>
                            {margin}% GPM
                          </div>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-black text-gray-900">₹{item.price}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <div className="font-black text-sm text-gray-900 leading-none">{item.stock}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{item.unit}</div>
                        {stockPct !== null && (
                          <div className="w-10 mt-2">
                            <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${stockPct > 80 ? 'bg-blue-500' : stockPct > 30 ? 'bg-emerald-500' : stockPct > 10 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                style={{ width: `${Math.min(stockPct, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-black text-gray-700">₹{value.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col gap-2 items-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-[10px] font-black uppercase tracking-widest ${status.color.replace('bg-', 'bg-opacity-10 bg-')} ${status.text} border border-current opacity-80 shadow-sm transition-all group-hover:opacity-100`}>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className={`${status.label !== 'Healthy' ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full ${status.color} opacity-50`} />
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.color}`} />
                          </span>
                          {status.label}
                        </span>
                        {invSettings.inv_show_velocity_badges === 'true' && (
                          <div className="scale-90 origin-top">
                            <VelocityBadge
                              velocity={item.sales > 0 ? item.sales / Number(invSettings.inv_velocity_window || 30) : 0}
                              daysRemaining={item.sales > 0 ? item.stock / (item.sales / Number(invSettings.inv_velocity_window || 30)) : Infinity}
                              lastSoldDate={null}
                              hasSalesData={item.sales > 0}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-300 hover:shadow-inner"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-300 hover:shadow-inner"
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
  const localFormRef = useRef<HTMLFormElement>(null);
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
    reorderLevel: 10,
    status: 'Active' as 'Active' | 'Inactive' | 'Archived'
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
        reorderLevel: initialData.reorderLevel || 10,
        status: initialData.status || 'Active'
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
        reorderLevel: 10,
        status: 'Active'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 text-left">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg bg-white border border-gray-100 shadow-2xl overflow-hidden p-0 rounded-3xl"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -z-10 -ml-24 -mb-24" />

        {/* Premium Header */}
        <div className="px-6 py-5 border-b border-gray-50 bg-white/50 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Package className="w-5 h-5 text-primary" strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  {initialData ? 'Update Product' : 'Add New Product'}
                </h3>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">
                  Intelligence Engine
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form
          ref={localFormRef}
          onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
          }}
        >
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar relative">
            {/* Main Information */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">Product Designation</label>
                <div className="relative mt-1.5 group">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    type="text"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200/60 rounded-xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all outline-none font-bold shadow-sm"
                    placeholder="e.g. Quantum Bridge"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">SKU ID</label>
                  <input
                    type="text"
                    placeholder="QWB-V1"
                    className="w-full px-4 py-3 mt-1.5 bg-gray-50/50 border border-gray-200/60 rounded-xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all outline-none font-mono font-bold shadow-sm"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                <CustomSelect
                  label="Category"
                  value={formData.category}
                  onChange={(val) => setFormData({ ...formData, category: val })}
                  options={[
                    { value: 'Electronics', label: 'Electronics', icon: Zap },
                    { value: 'Clothing', label: 'Clothing', icon: Tag },
                    { value: 'Groceries', label: 'Groceries', icon: Package },
                    { value: 'Services', label: 'Services', icon: Bot },
                  ]}
                  placeholder="Select"
                />
              </div>
            </motion.div>

            {/* Financials & Stock */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-4 border-t border-gray-50 pt-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">Unit List Price (₹)</label>
                  <div className="relative mt-1.5 group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">₹</span>
                    <input
                      required
                      type="number"
                      className="w-full pl-9 pr-4 py-3 bg-gray-50/50 border border-gray-200/60 rounded-xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all outline-none font-black shadow-sm"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">Current Stock</label>
                  <div className="relative mt-1.5 group">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                      required
                      type="number"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200/60 rounded-xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all outline-none font-black shadow-sm"
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CustomSelect
                  label="Unit"
                  value={formData.unit}
                  onChange={(val) => setFormData({ ...formData, unit: val })}
                  options={[
                    { value: 'pcs', label: 'Pieces', icon: Box },
                    { value: 'kg', label: 'Kilograms', icon: Scale },
                  ]}
                  placeholder="Select"
                />
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">Reorder Level</label>
                  <div className="relative mt-1.5 group">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary group-focus-within:text-primary transition-colors" />
                    <input
                      required
                      type="number"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200/60 rounded-xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all outline-none text-primary font-black shadow-sm"
                      value={formData.minStock}
                      onChange={e => setFormData({ ...formData, minStock: Number(e.target.value), reorderLevel: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-400 ml-1">Operational State</label>
                <CustomSelect
                  label=""
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val as 'Active' | 'Inactive' | 'Archived' })}
                  options={[
                    { value: 'Active', label: 'Active', icon: CheckCircle },
                    { value: 'Inactive', label: 'Inactive', icon: X },
                  ]}
                  placeholder="Select Status"
                />
              </div>
            </motion.div>
          </div>
        </form>

        {/* Premium Footer Actions */}
        <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-black text-gray-400 hover:text-gray-900 transition-all active:scale-95"
          >
            Discard
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (localFormRef.current) {
                  localFormRef.current.requestSubmit();
                }
              }}
              className="px-8 py-3 bg-primary text-white font-black text-xs rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:translate-y-0"
            >
              {initialData ? 'Update Intelligence' : 'Deploy Product'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
