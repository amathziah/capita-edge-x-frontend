import { Globe, ChevronDown, Plus, BarChart2, FilePlus, CreditCard } from 'lucide-react';
import { useLanguage } from '../LanguageProvider';
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NotificationButton } from './NotificationButton';

type LanguageCode = 'en' | 'hi' | 'mr';

export function Header() {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  const quickActionsRef = useRef<HTMLDivElement>(null);

  const languages: { code: LanguageCode; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'mr', name: 'मराठी' },
  ];

  const quickActions = [
    { id: 1, text: 'Add Invoice', icon: <FilePlus className="w-4 h-4" />, path: '/invoices/create' },
    { id: 2, text: 'Add Product', icon: <Plus className="w-4 h-4" />, path: '/inventory' },
    { id: 3, text: 'Generate Report', icon: <BarChart2 className="w-4 h-4" />, path: '/reports' },
    { id: 4, text: 'Reconcile Payments', icon: <CreditCard className="w-4 h-4" />, path: '/payments' },
  ];

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setQuickActionsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">

        {/* Left: Logo (Mobile only) */}
        <div className="lg:hidden flex items-center">
          <span className="text-lg font-semibold text-text-main">Malika</span>
        </div>

        {/* Left: Spacer (Desktop) */}
        <div className="hidden lg:block"></div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 lg:space-x-4">

          {/* Quick Actions */}
          <div className="relative hidden sm:block" ref={quickActionsRef}>
            <button
              onClick={() => setQuickActionsOpen(!quickActionsOpen)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-xl transition shadow-soft hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Actions</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
            </button>

            <AnimatePresence>
              {quickActionsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-1"
                >
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm text-text-main hover:bg-gray-50 rounded-xl transition font-medium"
                      onClick={() => {
                        navigate(action.path);
                        setQuickActionsOpen(false);
                      }}
                    >
                      <span className="p-1.5 bg-primary-light text-primary rounded-lg">{action.icon}</span>
                      {action.text}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reports Shortcut */}
          <button
            onClick={() => navigate('/reports')}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-muted hover:text-primary hover:bg-primary-light rounded-xl transition"
          >
            <BarChart2 className="w-4 h-4" />
            <span>Reports</span>
          </button>

          {/* Language selector */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-muted hover:bg-gray-50 rounded-xl transition">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{languages.find((l) => l.code === language)?.name}</span>
            </button>

            <div className="absolute right-0 z-50 w-40 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`block w-full px-3 py-2 text-sm text-left rounded-xl transition-colors ${language === lang.code
                    ? 'bg-primary-light text-primary font-medium'
                    : 'text-text-muted hover:bg-gray-50'
                    }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <NotificationButton />

        </div>
      </div>
    </header>
  );
}
