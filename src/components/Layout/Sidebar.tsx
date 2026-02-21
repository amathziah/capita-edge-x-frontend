import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { useLanguage } from "../LanguageProvider";
import { useAuth } from "../../contexts/AuthContext";

// ── Types ────────────────────────────────────────────────────────────────
type NavItem = {
  name: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  highlight?: string;
  statusDot?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

// ── Navigation Groups ────────────────────────────────────────────────────
const groups: NavGroup[] = [
  {
    title: "HEADQUARTERS",
    items: [
      { name: "control_room", label: "Control Room", href: "/", icon: LayoutDashboard },
      { name: "calendar", label: "Calendar", href: "/calendar", icon: CalendarClock, highlight: "Liquidity" },
    ],
  },
  {
    title: "REVENUE OPS",
    items: [
      { name: "invoices", label: "Invoices", href: "/invoices", icon: FileText },
      { name: "payments", label: "Payments", href: "/payments", icon: CreditCard },
      { name: "customers", label: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    title: "SPEND & ASSETS",
    items: [
      { name: "expenses", label: "Expenses", href: "/expenses", icon: Receipt },
      { name: "inventory", label: "Inventory", href: "/inventory", icon: Package },
      { name: "compliance", label: "Compliance", href: "/compliance", icon: ShieldCheck, statusDot: "bg-emerald-500" },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { name: "reports", label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
];

// ── Component ────────────────────────────────────────────────────────────
export function Sidebar() {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
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

  // Inject dynamic badges into navigation groups
  const navGroups = groups;

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen bg-[#0c0f1a] text-gray-300 select-none transition-all duration-300 ease-in-out ${collapsed ? "w-[68px]" : "w-[220px]"
        }`}
    >

      {/* ── Brand (click to toggle) ───────────────────────────── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className={`flex items-center gap-3 h-[72px] border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors duration-200 cursor-pointer ${collapsed ? "px-0 justify-center" : "px-6"
          }`}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20 flex-shrink-0">
          <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="text-left overflow-hidden">
            <span className="text-[15px] font-bold text-white tracking-tight block">Malika</span>
            <span className="block text-[10px] text-gray-500 font-medium tracking-wide">Financial OS</span>
          </div>
        )}
      </button>

      {/* ── Navigation Groups ─────────────────────────────────── */}
      <nav className={`flex-1 overflow-y-auto pt-5 pb-4 space-y-6 scrollbar-hide ${collapsed ? "px-1.5" : "px-3"}`}>
        {navGroups.map((group) => (
          <div key={group.title}>
            {/* Group Header */}
            {!collapsed ? (
              <div className="flex items-center gap-2 px-3 mb-2">
                <span className="text-[10px] font-bold tracking-[0.12em] text-gray-500 uppercase whitespace-nowrap">
                  {group.title}
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
              {group.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === "/"}
                  title={collapsed ? (t(item.name) || item.label) : undefined}
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
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-teal-400 to-cyan-400" />
                      )}

                      <div className="relative flex-shrink-0">
                        <item.icon
                          className={`w-[18px] h-[18px] transition-colors duration-200 ${isActive ? "text-teal-400" : "text-gray-500 group-hover:text-gray-400"
                            }`}
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />

                        {/* Badge on icon when collapsed */}
                        {collapsed && item.badge && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white px-0.5 shadow-sm">
                            {item.badge}
                          </span>
                        )}

                        {/* Status dot on icon when collapsed */}
                        {collapsed && item.statusDot && (
                          <span className={`absolute -top-0.5 -right-0.5 w-[7px] h-[7px] rounded-full ${item.statusDot} ring-2 ring-[#0c0f1a]`} />
                        )}
                      </div>

                      {/* Expanded: show labels and indicators */}
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">
                            {t(item.name) || item.label}
                          </span>

                          {item.badge && (
                            <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-rose-500/90 text-[10px] font-bold text-white px-1.5 shadow-sm shadow-rose-500/30">
                              {item.badge}
                            </span>
                          )}

                          {item.highlight && (
                            <span className="text-[8px] font-bold tracking-wider uppercase text-teal-400/90 bg-teal-500/10 px-1.5 py-0.5 rounded-md flex-shrink-0">
                              {item.highlight}
                            </span>
                          )}

                          {item.statusDot && (
                            <span className="relative flex items-center justify-center w-4 h-4">
                              <span className={`absolute w-2 h-2 rounded-full ${item.statusDot} animate-pulse opacity-40`} />
                              <span className={`w-[7px] h-[7px] rounded-full ${item.statusDot}`} />
                            </span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer: User Menu Dropdown ───────────────────────────── */}
      <div ref={userMenuRef} className={`relative border-t border-white/[0.06] py-3 ${collapsed ? "px-1.5" : "px-3"}`}>
        {/* Dropdown Popover (opens upward) */}
        {userMenuOpen && (
          <div
            className={`absolute bottom-full mb-2 rounded-xl bg-[#161a2b] border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 ${collapsed ? "left-1/2 -translate-x-1/2 w-48" : "left-3 right-3"
              }`}
          >
            <div className="py-1.5">
              <NavLink
                to="/profile"
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
                to="/settings"
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
                    <span>Settings</span>
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
