import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { DataProvider } from '@/app/providers/DataContext';
import { LiquidityCalendar } from '@/features/calendar/components/LiquidityCalendar';
import { AuthProvider, useAuth } from '@/app/providers/AuthContext';
import { PersonaProvider } from '@/app/providers/PersonaContext';
import { NotificationProvider } from '@/app/providers/NotificationContext';
import { usePersona } from '@/app/providers/PersonaContext';
import { hasCompletedOnboarding } from '@/shared/lib/authFlow';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

const Layout = lazy(() => import('@/components/layout/Layout').then(module => ({ default: module.Layout })));
const Customers = lazy(() => import('@/features/customers/pages/CustomersPage').then(module => ({ default: module.Customers })));
const Payments = lazy(() => import('@/features/payments/pages/PaymentsPage').then(module => ({ default: module.Payments })));
const Expenses = lazy(() => import('@/features/expenses/pages/ExpensesPage').then(module => ({ default: module.Expenses })));
const Reports = lazy(() => import('@/features/reports/pages/ReportsPage').then(module => ({ default: module.Reports })));
const Compliance = lazy(() => import('@/features/compliance/pages/CompliancePage').then(module => ({ default: module.Compliance })));
const Profile = lazy(() => import('@/features/settings/pages/ProfilePage').then(module => ({ default: module.Profile })));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(module => ({ default: module.LoginPage })));
const UpdatePassword = lazy(() => import('@/features/auth/pages/UpdatePassword').then(module => ({ default: module.UpdatePassword })));
const SetupPage = lazy(() => import('@/features/onboarding/pages/SetupPage').then(module => ({ default: module.SetupPage })));
const Invoices = lazy(() => import('@/features/invoices/pages/InvoicesPage').then(module => ({ default: module.Invoices })));
const CreateInvoice = lazy(() => import('@/features/invoices/pages/CreateInvoicePage').then(module => ({ default: module.CreateInvoice })));
const SharedInvoicePage = lazy(() => import('@/features/invoices/pages/SharedInvoicePage').then(module => ({ default: module.SharedInvoicePage })));
const AIAssistantPage = lazy(() => import('@/features/ai/pages/AIAssistantPage').then(module => ({ default: module.AIAssistantPage })));
const Settings = lazy(() => import('@/features/settings/pages/SettingsPage').then(module => ({ default: module.Settings })));
const Support = lazy(() => import('@/features/public/pages/SupportPage').then(module => ({ default: module.Support })));
const Pricing = lazy(() => import('@/features/public/pages/PricingPage').then(module => ({ default: module.Pricing })));
const Landing = lazy(() => import('@/features/public/pages/LandingPage').then(module => ({ default: module.Landing })));
const ControlRoom = lazy(() => import('@/features/dashboard/pages/ControlRoomPage').then(module => ({ default: module.ControlRoom })));

const RouteFallback = () => (
  <div className="flex items-center justify-center h-screen bg-[#040608]">
    <div className="relative">
      <div className="w-12 h-12 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
      <div className="absolute inset-0 bg-teal-500/10 blur-xl rounded-full" />
    </div>
  </div>
);

const HomeLoader = () => {
  const { user, loading: loadingAuth } = useAuth();
  const { organizationId, businessType, loading: loadingPersona } = usePersona();
  const isOnboarded = hasCompletedOnboarding(organizationId, businessType);
  const isHydrating = loadingAuth || loadingPersona;

  if (isHydrating) {
    return <RouteFallback />;
  }

  if (user) {
    if (isOnboarded) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/setup" replace />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Landing />
    </Suspense>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PersonaProvider>
            <NotificationProvider>
              <DataProvider>
                <BrowserRouter>
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/" element={<HomeLoader />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/update-password" element={<UpdatePassword />} />
                      <Route path="/setup" element={<SetupPage />} />
                      <Route path="/invoice/share/:token" element={<SharedInvoicePage />} />

                      {/* Protected Routes */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Layout />}>
                          <Route index element={<ControlRoom />} />
                          <Route path="invoices" element={<Invoices />} />
                          <Route path="invoices/new" element={<CreateInvoice />} />
                          <Route path="invoices/:id/edit" element={<CreateInvoice />} />
                          <Route path="customers" element={<Customers />} />
                          <Route path="payments" element={<Payments />} />
                          <Route path="expenses" element={<Expenses />} />

                          <Route path="reports" element={<Reports />} />
                          <Route path="compliance" element={<Compliance />} />
                          <Route path="calendar" element={<LiquidityCalendar />} />
                          <Route path="ai" element={<AIAssistantPage />} />
                          <Route path="profile" element={<Profile />} />
                          <Route path="settings" element={<Settings />} />
                          <Route path="pricing" element={<Pricing />} />

                          <Route path="integrity" element={<Support />} />
                        </Route>
                      </Route>

                      {/* Fallback */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </DataProvider>
            </NotificationProvider>
        </PersonaProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
