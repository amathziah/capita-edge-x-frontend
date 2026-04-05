import { useState, useEffect, useRef, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  ShieldCheck,
  CalendarClock,
  Zap,
  Settings,
  User,
  LogOut,
  ChevronUp,
  Globe,
  Sparkles,
  ArrowUpRight,
  Crown,
} from "lucide-react";
import { useLanguage } from "../LanguageProvider";
import { useAuth } from "../../contexts/AuthContext";
import { usePersona } from "../../contexts/PersonaContext";

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
  const [transitioning, setTransitioning] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const toggleSidebar = () => {
    setTransitioning(true);
    setCollapsed(c => !c);
    setTimeout(() => {
      setTransitioning(false);
    }, 150); // Matches transition duration + small buffer
  };
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
      className={`hidden lg:flex flex-col h-screen bg-[#0c0f1a] text-gray-300 select-none transition-all duration-75 overflow-visible ${collapsed ? "w-[68px]" : "w-[220px]"
        }`}
    >

      {/* ── Brand (click to toggle) ───────────────────────────── */}
      <button
        onClick={toggleSidebar}
        className={`flex items-center gap-3 h-[72px] border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors duration-200 cursor-pointer ${collapsed ? "px-0 justify-center" : "px-6"
          }`}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Logo size={36} className="flex-shrink-0" />
        {!collapsed && (
          <div className="text-left overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-bold text-white tracking-tight block">Capita</span>
              {planTier ? (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-tighter">{planTier}</span>
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

                  // ── Coming Soon (disabled) item ──
                  if (item.comingSoon) {
                    return (
                      <div
                        key={item.id}
                        title={collapsed ? 'Coming Soon' : undefined}
                        className={`group relative flex items-center rounded-xl text-[13px] font-medium cursor-not-allowed opacity-40 select-none ${
                          collapsed
                            ? 'justify-center px-0 py-2.5'
                            : 'gap-2.5 px-3 py-2.5'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <Icon
                            className="w-[18px] h-[18px] text-gray-600"
                            strokeWidth={1.8}
                          />
                        </div>

                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate text-gray-600">
                              {t(item.id) || item.label}
                            </span>
                            {!transitioning && (
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-600 border border-gray-700 rounded-md px-1.5 py-0.5 whitespace-nowrap">
                                Soon
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }

                  // ── Active nav item ──
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
                          </div>

                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">
                                {t(item.id) || item.label}
                              </span>
                              {!transitioning && item.badge && (
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

        {/* ── AI Plan + Upgrade ───────────────────────────────────── */}
        {!collapsed && (() => {
          const tierMap: Record<string, { name: string; color: string; isUpgradable: boolean; subtitle: string }> = {
            starter: { name: 'Free', color: 'teal', isUpgradable: true, subtitle: 'Capita AI enabled' },
            solo: { name: 'Solo', color: 'teal', isUpgradable: true, subtitle: 'Capita AI enabled' },
            solo_pro: { name: 'Solo Pro', color: 'violet', isUpgradable: false, subtitle: 'Priority AI access' },
            enterprise: { name: 'Enterprise', color: 'violet', isUpgradable: false, subtitle: 'Premium AI access' },
          };
          const tier = tierMap[planTier ?? 'starter'] ?? tierMap.starter;

          return (
            <div className="mt-6 px-3">
              <div
                className="relative overflow-hidden rounded-2xl p-3.5"
                style={{
                  background: tier.color === 'violet'
                    ? 'linear-gradient(145deg, rgba(139,92,246,0.12) 0%, rgba(109,40,217,0.06) 100%)'
                    : 'linear-gradient(145deg, rgba(45,212,191,0.1) 0%, rgba(6,182,212,0.05) 100%)',
                  border: tier.color === 'violet'
                    ? '1px solid rgba(139,92,246,0.2)'
                    : '1px solid rgba(45,212,191,0.15)',
                }}
              >
                {/* Glow blob */}
                <div style={{
                  position: 'absolute', top: -20, right: -20,
                  width: 60, height: 60, borderRadius: '50%',
                  background: tier.color === 'violet' ? 'rgba(139,92,246,0.15)' : 'rgba(45,212,191,0.12)',
                  filter: 'blur(20px)',
                  pointerEvents: 'none',
                }} />

                <div className="relative z-10">
                  {/* Plan badge */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      {tier.color === 'violet'
                        ? <Crown className="w-3 h-3 text-violet-400" />
                        : <Sparkles className="w-3 h-3 text-teal-400" />
                      }
                      <span className="text-[10px] font-black uppercase tracking-widest"
                        style={{ color: tier.color === 'violet' ? '#a78bfa' : '#2dd4bf' }}>
                        {tier.name}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-500 font-medium">{tier.subtitle}</span>
                  </div>

                  {/* Upgrade CTA */}
                  {tier.isUpgradable && (
                    <NavLink
                      to="/dashboard/pricing"
                      className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, rgba(45,212,191,0.2), rgba(6,182,212,0.12))',
                        border: '1px solid rgba(45,212,191,0.25)',
                        color: '#2dd4bf',
                      }}
                    >
                      <span>Upgrade plan</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </NavLink>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
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

              <NavLink
                to="/dashboard/pricing"
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
                    <BillingIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-teal-400" : "text-gray-500"}`} strokeWidth={1.8} />
                    <span>Plans & Billing</span>
                    <span className="ml-auto px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-[9px] font-black">NEW</span>
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
