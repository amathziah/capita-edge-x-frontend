import { Suspense, lazy, Component, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#040608] text-center px-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-white font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-400 text-sm mb-6">Please refresh the page to continue.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { DataProvider } from '@/app/providers/DataContext';
import { LiquidityCalendar } from '@/features/calendar/components/LiquidityCalendar';
import { AuthProvider, useAuth } from '@/app/providers/AuthContext';
import { PersonaProvider } from '@/app/providers/PersonaContext';
import { NotificationProvider } from '@/app/providers/NotificationContext';
import { ToastProvider } from '@/app/providers/ToastContext';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
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
const Landing = lazy(() => import('@/features/public/pages/LandingPage').then(module => ({ default: module.Landing })));
const Privacy = lazy(() => import('@/features/public/pages/PrivacyPage').then(module => ({ default: module.PrivacyPage })));
const Terms = lazy(() => import('@/features/public/pages/TermsPage').then(module => ({ default: module.TermsPage })));
const ControlRoom = lazy(() => import('@/features/dashboard/pages/ControlRoomPage').then(module => ({ default: module.ControlRoom })));
const GoogleCallbackPage = lazy(() => import('@/features/settings/pages/GoogleCallbackPage'));

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
    <ErrorBoundary>
    <LanguageProvider>
      <AuthProvider>
        <PersonaProvider>
            <NotificationProvider>
              <ToastProvider>
              <ConfirmProvider>
              <DataProvider>
                <BrowserRouter>
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/" element={<HomeLoader />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/update-password" element={<UpdatePassword />} />
                      <Route path="/setup" element={<SetupPage />} />
                      <Route path="/invoice/share/:token" element={<SharedInvoicePage />} />
                      <Route path="/settings/integrations/google/callback" element={<GoogleCallbackPage />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />

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
                          <Route path="integrity" element={<Support />} />
                        </Route>
                      </Route>

                      {/* Fallback */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </DataProvider>
              </ConfirmProvider>
              </ToastProvider>
            </NotificationProvider>
        </PersonaProvider>
      </AuthProvider>
    </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
