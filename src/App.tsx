import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './components/LanguageProvider';
import { DataProvider } from './contexts/DataContext';
import { Layout } from './components/Layout/Layout';
import { Invoices } from './pages/Invoices';
import InvoiceGenerator from './components/InvoiceGenerator/InvoiceGenerator';
import { Customers } from './pages/Customers';
import { Payments } from './pages/Payments';
import { Expenses } from './pages/Expenses';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { Compliance } from './pages/Compliance';
import { Profile } from './pages/Profile';
import { LiquidityCalendar } from './components/features/LiquidityCalendar';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { Settings } from './pages/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PersonaProvider } from './contexts/PersonaContext';

import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { UpdatePassword } from './pages/UpdatePassword';
import { SetupPage } from './pages/SetupPage';

import { Support } from './pages/Support';

import { ControlRoom } from './pages/ControlRoom';
import { Landing } from './pages/Landing';
import { Loader2 } from 'lucide-react';
import { usePersona } from './contexts/PersonaContext';

const HomeLoader = () => {
  const { user, loading: loadingAuth } = useAuth();
  const { organizationId, businessType, loading: loadingPersona } = usePersona();

  // 1. Check for established user session directly
  const hasToken = !!user;
  const isHydrating = loadingAuth || loadingPersona;

  // RULE 1: If we have ANY hint of a session (token), stay in NEUTRAL mode.
  // This removes the "Syncing Security Protocol" text and flashes for established users.
  if (isHydrating && hasToken) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#040608]">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-teal-500/10 blur-xl rounded-full" />
        </div>
      </div>
    );
  }

  // RULE 2: Only show onboarding-themed loading for users with NO token (fresh sign-ups)
  if (isHydrating) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0c0f1a] space-y-4">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
        <p className="text-gray-400 text-sm font-bold tracking-tight">Syncing Security Protocol...</p>
      </div>
    );
  }

  // RULE 3: Routing Decisions (Only after isHydrating is false)
  if (user) {
    if (organizationId && businessType) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/setup" replace />;
  }

  return <Landing />;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PersonaProvider>
            <NotificationProvider>
              <DataProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<HomeLoader />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/update-password" element={<UpdatePassword />} />
                    <Route path="/setup" element={<SetupPage />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/dashboard" element={<Layout />}>
                        <Route index element={<ControlRoom />} />
                        <Route path="invoices" element={<Invoices />} />
                        <Route path="invoices/new" element={<InvoiceGenerator />} />
                        <Route path="invoices/:id/edit" element={<InvoiceGenerator />} />
                        <Route path="customers" element={<Customers />} />
                        <Route path="payments" element={<Payments />} />
                        <Route path="expenses" element={<Expenses />} />
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="compliance" element={<Compliance />} />
                        <Route path="calendar" element={<LiquidityCalendar />} />
                        <Route path="ai" element={<AIAssistantPage />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="settings" element={<Settings />} />

                        <Route path="integrity" element={<Support />} />
                      </Route>
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </BrowserRouter>
              </DataProvider>
            </NotificationProvider>
        </PersonaProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;