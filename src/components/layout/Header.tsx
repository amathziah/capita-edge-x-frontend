import { NavLink, useLocation } from 'react-router-dom';
import { ShieldCheck, Bot, Menu } from 'lucide-react';
import { Logo } from '../common/Logo';

interface HeaderProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export function Header(props: HeaderProps) {
  const location = useLocation();
  const isAIActive = location.pathname === '/dashboard/ai';

  return (
    <header className={`sticky top-0 z-40 h-16 transition-all duration-500 ${
      isAIActive
        ? 'bg-white/95 backdrop-blur-xl border-b border-teal-500/30 shadow-[0_4px_20px_-4px_rgba(20,184,184,0.15)]'
        : 'bg-white/80 backdrop-blur-md border-b border-gray-100'
    }`}>
      {isAIActive && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-[shimmer-slow_3s_infinite]" />
        </div>
      )}

      <div className="flex items-center justify-between h-full px-3 sm:px-4 lg:px-6 relative">

        {/* Left: Logo + Menu Button */}
        <div className="flex items-center gap-2">
          {props.setSidebarOpen && (
            <button
              onClick={() => props.setSidebarOpen?.(!props.sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-text-main" />
            </button>
          )}
          <Logo size={28} />
          <span className="text-lg font-semibold text-text-main">Capita</span>
        </div>

        {/* Right: Actions - Responsive */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          {/* Capita AI Button */}
          <NavLink
            to={isAIActive ? "/dashboard" : "/dashboard/ai"}
            className={({ isActive }) =>
              `relative hidden lg:flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 font-bold overflow-hidden group ${
                isActive
                  ? 'bg-[#0c0f1a] text-teal-400 shadow-xl shadow-teal-500/20 scale-105'
                  : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5'
              }`
            }
          >
            <Bot className={`w-4 h-4 flex-shrink-0 relative z-10 ${isAIActive ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] sm:text-[11px] tracking-widest uppercase relative z-10 whitespace-nowrap hidden xs:inline">Capita AI</span>
            <span className="text-[10px] tracking-widest uppercase relative z-10 whitespace-nowrap xs:hidden">AI</span>
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {isAIActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            )}
          </NavLink>

          {/* Integrity Button */}
          <NavLink
            to="/dashboard/integrity"
            className={({ isActive }) =>
              `flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full transition-all duration-300 border ${
                isActive
                  ? 'bg-primary/10 text-primary border-[#0c0f1a] shadow-sm'
                  : 'text-gray-400 hover:text-primary hover:bg-primary/5 bg-gray-50/50 border-[#0c0f1a]/10 hover:border-[#0c0f1a] shadow-sm'
              }`
            }
          >
            <ShieldCheck className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] hidden sm:inline">Integrity</span>
            <span className="h-1.5 w-1.5 sm:h-1 sm:w-1 rounded-full bg-primary animate-pulse ml-0.5"></span>
          </NavLink>
        </div>
      </div>
    </header>
  );
}
