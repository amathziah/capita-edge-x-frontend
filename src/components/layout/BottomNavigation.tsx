import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    FileText,
    Users,
    CreditCard,
    Bot,
} from "lucide-react";
import { useLanguage } from "@/app/providers/LanguageProvider";
import { Logo } from "../common/Logo";

const mobileNavigation = [
    { name: "dashboard", href: "/dashboard", icon: LayoutDashboard, end: true },
    { name: "invoices", href: "/dashboard/invoices", icon: FileText },
    { name: "customers", href: "/dashboard/customers", icon: Users },
    { name: "payments", href: "/dashboard/payments", icon: CreditCard },
    { name: "ai", href: "/dashboard/ai", icon: () => <Logo size={24} className="rounded-lg shadow-none border-0" /> },
];

export function BottomNavigation() {
    const { t } = useLanguage();

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
            <nav className="mx-auto flex h-[72px] max-w-screen-sm items-center justify-around gap-1 px-2">
                {mobileNavigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 transition-all ${
                                isActive
                                    ? "bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.12)]"
                                    : "text-text-muted hover:bg-gray-50 hover:text-text-main"
                            }`
                        }
                    >
                        <item.icon className="h-[22px] w-[22px]" strokeWidth={2} />
                        <span className="max-w-full truncate text-[10px] font-semibold capitalize leading-none">
                            {t(item.name) || item.name}
                        </span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
