import { NavLink } from 'react-router-dom';
import { ShieldCheck, Bot } from 'lucide-react';
import { Logo } from '../common/Logo';

interface HeaderProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export function Header(_props: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 relative">

        {/* Left: Logo (Mobile only) */}
        <div className="lg:hidden flex items-center gap-2">
          <Logo size={28} />
          <span className="text-lg font-semibold text-text-main">Capita</span>
        </div>

        {/* Left: Spacer (Desktop) */}
        <div className="hidden lg:block w-[100px]"></div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3 lg:space-x-4">
          <NavLink 
            to="/dashboard/ai"
            className={({ isActive }) => 
              `relative flex items-center justify-center gap-2 px-5 py-2 rounded-full transition-all duration-300 font-bold overflow-hidden group ${
                isActive 
                  ? 'bg-[#0c0f1a] text-teal-400 shadow-lg shadow-[#0c0f1a]/20 scale-105' 
                  : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5'
              }`
            }
          >
            <Bot className="w-[16px] h-[16px] flex-shrink-0 relative z-10" />
            <span className="text-[11px] tracking-widest uppercase relative z-10 whitespace-nowrap">Capita AI</span>
            
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>

          <NavLink 
            to="/dashboard/integrity"
            className={({ isActive }) => 
              `flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border ${
                isActive 
                  ? 'bg-primary/10 text-primary border-[#0c0f1a] shadow-sm' 
                  : 'text-gray-400 hover:text-primary hover:bg-primary/5 bg-gray-50/50 border-[#0c0f1a]/10 hover:border-[#0c0f1a] shadow-sm'
              }`
            }
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Integrity</span>
            <span className="h-1 w-1 rounded-full bg-primary animate-pulse ml-0.5"></span>
          </NavLink>
        </div>
      </div>
    </header>
  );
}
