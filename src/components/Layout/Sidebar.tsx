import { useState, useEffect, useRef, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  Receipt,
  Package,
  BarChart3,
  ShieldCheck,
  CalendarClock,
  Zap,
  Settings,
  User,
  LogOut,
  ChevronUp,
  Globe
} from "lucide-react";
import { useLanguage } from "../LanguageProvider";
import { useAuth } from "../../contexts/AuthContext";
import { usePersona } from "../../contexts/PersonaContext";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { Logo } from "../common/Logo";




// ── Icon & Path Mappings ────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  'control-room': LayoutDashboard,
  'calendar': CalendarClock,
  'invoices': FileText,
  'payments': CreditCard,
  'customers': Users,
  'projects': LayoutDashboard,
  'expenses': Receipt,
  'inventory': Package,
  'marketplace': Globe,
  'compliance': ShieldCheck,
  'reports': BarChart3,
  'team': Users,
  'sku-pl': BarChart3,
  'subscribers': Users,
  'mrr': Zap,
  'clients': Users,
  'integrity': ShieldCheck,
};

const PATH_MAP: Record<string, string> = {
  'control-room': '/dashboard',
  'calendar': '/dashboard/calendar',
  'invoices': '/dashboard/invoices',
  'payments': '/dashboard/payments',
  'customers': '/dashboard/customers',
  'projects': '/dashboard/projects',
  'expenses': '/dashboard/expenses',
  'inventory': '/dashboard/inventory',
  'marketplace': '/dashboard/marketplace',
  'compliance': '/dashboard/compliance',
  'reports': '/dashboard/reports',
  'team': '/dashboard/team',
  'sku-pl': '/dashboard/sku-pl',
  'subscribers': '/dashboard/subscribers',
  'mrr': '/dashboard/mrr',
  'clients': '/dashboard/clients',
  'integrity': '/dashboard/integrity',
};

// ── Component ────────────────────────────────────────────────────────────
export function Sidebar() {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { nav, config, planTier } = usePersona();
  const { planStatus } = useSubscription();

  const SECTION_LABELS: Record<string, string> = {
    'headquarters': 'Headquarters',
    'revenue-ops': 'Revenue Ops',
    'spend-assets': 'Spend & Assets',
    'analytics': 'Analytics',
  };

  const SECTIONS = ['headquarters', 'revenue-ops', 'spend-assets', 'analytics'] as const;

  const groupedNav = useMemo(() => {
    return SECTIONS.reduce((acc, section) => {
      acc[section] = (nav ?? []).filter(item => item.section === section);
      return acc;
    }, {} as Record<string, typeof nav>);
  }, [nav]);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const getUserInitials = () => {
    if (!user?.email) return "U";
    const namePart = user.email.split("@")[0];
    const parts = namePart.split(/[._-]/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return namePart.substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (!user?.email) return "User";
    return user.email
      .split("@")[0]
      .split(/[._-]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };


  return (
    <aside
      className={`hidden lg:flex flex-col h-screen bg-[#0c0f1a] text-gray-300 select-none transition-all duration-300 ease-in-out overflow-visible ${collapsed ? "w-[68px]" : "w-[220px]"
        }`}
    >

      {/* ── Brand (click to toggle) ───────────────────────────── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className={`flex items-center gap-3 h-[72px] border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors duration-200 cursor-pointer ${collapsed ? "px-0 justify-center" : "px-6"
          }`}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Logo size={36} className="flex-shrink-0" />
        {!collapsed && (
          <div className="text-left overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-bold text-white tracking-tight block">Capita</span>
              {planStatus?.plan_tier !== 'starter' ? (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-tighter animate-pulse">{planStatus?.plan_tier}</span>
              ) : (
                <span className="px-1 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-[8px] font-black text-teal-400/80 uppercase tracking-tighter">v2.5</span>
              )}
            </div>
            <span className="block text-[10px] text-gray-500 font-medium tracking-wide">
              {config?.label ?? ''}
            </span>
          </div>
        )}
      </button>

      {/* ── Navigation Groups ─────────────────────────────────── */}
      <nav className={`flex-1 overflow-y-auto pt-5 pb-4 space-y-6 scrollbar-hide ${collapsed ? "px-1.5" : "px-3"}`}>
        {SECTIONS.map((section) => {
          const sectionItems = groupedNav[section];
          if (!sectionItems?.length) return null;

          return (
            <div key={section}>
              {/* Group Header */}
              {!collapsed ? (
                <div className="flex items-center gap-2 px-3 mb-2">
                  <span className="text-[10px] font-bold tracking-[0.12em] text-gray-400 uppercase whitespace-nowrap">
                    {SECTION_LABELS[section]}
                  </span>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>
              ) : (
                <div className="flex justify-center mb-2">
                  <div className="w-5 h-px bg-white/[0.08]" />
                </div>
              )}

              {/* Group Items */}
              <div className="space-y-0.5">
                {sectionItems.map((item) => {
                  const Icon = ICON_MAP[item.id] || LayoutDashboard;
                  const href = PATH_MAP[item.id] || '/dashboard';

                  return (
                    <NavLink
                      key={item.id}
                      to={href}
                      end={href === "/" || href === "/dashboard"}
                      title={collapsed ? (t(item.id) || item.label) : undefined}
                      className={({ isActive }) =>
                        `group relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-200 ${collapsed
                          ? `justify-center px-0 py-2.5 ${isActive
                            ? "bg-gradient-to-r from-teal-500/15 to-cyan-500/10 text-white"
                            : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                          }`
                          : `gap-2.5 px-3 py-2.5 ${isActive
                            ? "bg-gradient-to-r from-teal-500/15 to-cyan-500/10 text-white"
                            : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                          }`
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-teal-400 to-cyan-400" />
                          )}

                          <div className="relative flex-shrink-0">
                            <Icon
                              className={`w-[18px] h-[18px] transition-colors duration-200 ${isActive ? "text-teal-400" : "text-gray-500 group-hover:text-gray-400"
                                }`}
                              strokeWidth={isActive ? 2.2 : 1.8}
                            />
                            {collapsed && item.badge && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white px-0.5 shadow-sm">
                                {item.badge}
                              </span>
                            )}
                          </div>

                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">
                                {t(item.id) || item.label}
                              </span>
                              {item.badge && (
                                <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-rose-500/90 text-[10px] font-bold text-white px-1.5 shadow-sm shadow-rose-500/30">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── Plan Usage / Upgrade Section ──────────────────────── */}
        {!collapsed && (
          <div className="mt-8 px-3">
            <div className="relative overflow-hidden group bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 transition-all hover:bg-white/[0.04] hover:border-white/[0.1]">
              {/* Background Glow */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-teal-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-teal-500/20 transition-all duration-700" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Protocol Usage</span>
                  <div className="flex items-center gap-1.5">
                    {planStatus?.plan_tier !== 'starter' && <Zap className="w-3 h-3 text-amber-400 fill-amber-400/20" />}
                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${planStatus?.plan_tier !== 'starter'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                      : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                      }`}>
                      {planTier === 'pro' ? 'PRO'
                        : planTier === 'enterprise' ? 'ENTERPRISE'
                        : planTier === 'ca_firm' ? 'CA'
                        : 'FREE'}
                    </span>
                  </div>
                </div>

                {/* Invoices Usage - Instrument Style */}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-tight">Data Packets</span>
                      <span className="block text-[13px] font-mono text-gray-200">
                        {(planStatus?.usage?.invoices?.current ?? 0).toString().padStart(2, '0')}
                        <span className="text-gray-500 mx-1">/</span>
                        {planStatus?.usage?.invoices?.limit === Infinity ? '∞' : (planStatus?.usage?.invoices?.limit ?? 5).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-teal-500/80">
                      {Math.round(Math.min(100, ((planStatus?.usage?.invoices?.current ?? 0) / (planStatus?.usage?.invoices?.limit || 5)) * 100))}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 shadow-[0_0_8px_rgba(20,184,166,0.4)] transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, ((planStatus?.usage?.invoices?.current ?? 0) / (planStatus?.usage?.invoices?.limit || 5)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Upgrade CTA (Starter only) */}
                {(planStatus?.plan_tier === 'starter' || !planStatus) && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <ShieldCheck className="w-3 h-3 text-teal-500/70" />
                        <span>Gemini Pro AI Insights</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <Zap className="w-3 h-3 text-teal-500/70" />
                        <span>Unlimited Invoices</span>
                      </div>
                    </div>

                    <NavLink
                      to="/pricing"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-teal-500/10 border border-white/10 transition-all active:scale-[0.98] group/btn"
                    >
                      <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
                      <span>INITIALIZE UPGRADE</span>
                    </NavLink>
                  </div>
                )}

                {planStatus?.plan_tier !== 'starter' && (
                  <div className="pt-2 border-t border-white/[0.05] flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-medium text-gray-500">System Priority Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Footer: User Menu Dropdown ───────────────────────────── */}
      <div ref={userMenuRef} className={`relative z-20 border-t border-white/[0.06] py-3 ${collapsed ? "px-1.5" : "px-3"}`}>
        {/* Dropdown Popover (opens upward) */}
        {userMenuOpen && (
          <div
            className={`absolute bottom-full mb-2 z-[100] rounded-xl bg-[#161a2b] border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 ${collapsed ? "left-0 w-52 origin-bottom-left" : "left-3 right-3"
              }`}
          >
            <div className="py-1.5">
              <NavLink
                to="/dashboard/profile"
                onClick={() => setUserMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-all duration-150 ${isActive
                    ? "bg-teal-500/10 text-teal-400"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <User className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-teal-400" : "text-gray-500"}`} strokeWidth={1.8} />
                    <span>Profile</span>
                  </>
                )}
              </NavLink>

              <NavLink
                to="/dashboard/settings"
                onClick={() => setUserMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-all duration-150 ${isActive
                    ? "bg-teal-500/10 text-teal-400"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Settings className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-teal-400" : "text-gray-500"}`} strokeWidth={1.8} />
                    <span>Organization Settings</span>
                  </>
                )}
              </NavLink>

              <div className="mx-3 my-1 border-t border-white/[0.06]" />

              <button
                onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* User Card (click to toggle menu) */}
        <button
          onClick={() => setUserMenuOpen(prev => !prev)}
          className={`w-full flex items-center rounded-xl bg-white/[0.03] border transition-all duration-200 cursor-pointer ${userMenuOpen
            ? "border-teal-500/20 bg-white/[0.06]"
            : "border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.08]"
            } ${collapsed ? "justify-center p-2" : "gap-3 p-3"}`}
          title={collapsed ? "User menu" : undefined}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center text-xs font-bold text-teal-400 flex-shrink-0">
            {getUserInitials()}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-semibold text-gray-200 truncate">{getDisplayName()}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.email || "No email"}</p>
              </div>
              <ChevronUp
                className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${userMenuOpen ? "rotate-0" : "rotate-180"}`}
              />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
