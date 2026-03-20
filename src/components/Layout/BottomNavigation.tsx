import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    FileText,
    Users,
    CreditCard,
    Bot,
} from "lucide-react";
import { useLanguage } from "../LanguageProvider";
import { Logo } from "../common/Logo";

const mobileNavigation = [
    { name: "dashboard", href: "/", icon: LayoutDashboard },
    { name: "invoices", href: "/invoices", icon: FileText },
    { name: "customers", href: "/customers", icon: Users },
    { name: "payments", href: "/payments", icon: CreditCard },
    { name: "ai", href: "/ai", icon: () => <Logo size={24} className="rounded-lg shadow-none border-0" /> },
];

export function BottomNavigation() {
    const { t } = useLanguage();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe lg:hidden">
            <nav className="flex justify-around items-center h-16 px-2">
                {mobileNavigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-primary" : "text-text-muted hover:text-text-main"
                            }`
                        }
                    >
                        <item.icon className="w-6 h-6" strokeWidth={2} />
                        <span className="text-[10px] font-medium capitalize truncate max-w-[64px]">
                            {t(item.name) || item.name}
                        </span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
