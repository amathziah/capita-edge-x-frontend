import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';
import { RefreshingIndicator } from '../ui/RefreshingIndicator';
import InvoiceGenerator from '../InvoiceGenerator/InvoiceGenerator';
import { AddClientDrawer } from '../shared/AddClientDrawer';
import { useData } from '../../contexts/DataContext';

export function Layout() {
  const location = useLocation();
  const { refreshData } = useData();
  const isAIActive = location.pathname === '/dashboard/ai';

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

  return (
    <div className="flex h-screen bg-background">
      <RefreshingIndicator />
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Header sidebarOpen={false} setSidebarOpen={() => { }} />

        <main className={`flex-1 overflow-x-hidden ${isAIActive ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
          <div className={`mx-auto w-full ${isAIActive ? 'h-full p-0' : 'p-4 lg:p-8 max-w-7xl'}`}>
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNavigation />

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