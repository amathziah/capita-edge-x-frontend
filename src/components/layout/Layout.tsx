import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar, SidebarContent } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';
import { RefreshingIndicator } from '../ui/RefreshingIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Logo } from '../common/Logo';
import InvoiceGenerator from '@/features/invoices/components/generator/InvoiceGenerator';
import { AddClientDrawer } from '@/features/customers/components/AddClientDrawer';
import { useData } from '@/app/providers/DataContext';
import { usePersona } from '@/app/providers/PersonaContext';

export function Layout() {
  const { loading: personaLoading, organizationId } = usePersona();
  const location = useLocation();
  const { refreshData } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAIActive = location.pathname === '/dashboard/ai';
  const isCreateInvoice = /^\/dashboard\/invoices\/([^\/]+\/edit|new)$/.test(location.pathname);
  const isCompliancePage = location.pathname === '/dashboard/compliance';
  const isReportsPage = location.pathname === '/dashboard/reports';
  const isNoScrollPage = isAIActive || isCreateInvoice || isCompliancePage || isReportsPage;

  // 0. Persona Gate: Prevent sub-component mount/fetch until context is ready
  if (personaLoading || !organizationId) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#040608]">
        <div className="w-10 h-10 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Modal States
  const [invoiceModal, setInvoiceModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [customerModal, setCustomerModal] = useState<{ open: boolean; data?: any }>({ open: false });

  useEffect(() => {
    const handleOpenInvoice = (e: any) => {
      setInvoiceModal({ open: true, data: e.detail });
    };

    const handleOpenCustomer = (e: any) => {
      setCustomerModal({ open: true, data: e.detail });
    };

    window.addEventListener('open-invoice-modal', handleOpenInvoice);
    window.addEventListener('open-customer-modal', handleOpenCustomer);

    return () => {
      window.removeEventListener('open-invoice-modal', handleOpenInvoice);
      window.removeEventListener('open-customer-modal', handleOpenCustomer);
    };
  }, []);

  if (isAIActive) {
    return (
      <div className="h-screen w-screen bg-background overflow-hidden">
        <RefreshingIndicator />
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <RefreshingIndicator />
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0 shadow-[inset_4px_0_24px_rgba(0,0,0,0.06)]">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className={`flex-1 flex flex-col overflow-x-hidden ${isNoScrollPage ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
          <div className={`mx-auto w-full flex-1 ${isNoScrollPage ? `flex flex-col h-full ${isCreateInvoice ? 'p-4 lg:p-6 max-w-[1400px]' : 'p-0'}` : 'p-4 lg:p-8 max-w-7xl'}`}>
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNavigation />

      {/* Mobile Sidebar Slider */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[70] w-[280px] bg-[#0c0f1a] shadow-2xl lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between h-[72px] px-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <Logo size={36} />
                  <span className="text-[17px] font-bold text-white tracking-tight">Capita</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors"
                >
                  <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                    <X size={20} />
                  </motion.div>
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global Modals triggered by AI or other events */}
      {invoiceModal.open && (
        <InvoiceGenerator
          onClose={() => setInvoiceModal({ open: false })}
          initialData={invoiceModal.data}
        />
      )}

      <AddClientDrawer
        isOpen={customerModal.open}
        onClose={() => setCustomerModal({ open: false })}
        initialData={customerModal.data}
        onSaveSuccess={() => {
          refreshData(['customers']);
          setCustomerModal({ open: false });
        }}
      />
    </div>
  );
}
