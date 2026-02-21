import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './components/LanguageProvider';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Invoices } from './pages/Invoices';
import { InvoiceNew } from './pages/InvoiceNew';
import InvoiceGenerator from './components/InvoiceGenerator/InvoiceGenerator';
import { Customers } from './pages/Customers';
import { Payments } from './pages/Payments';
import { Expenses } from './pages/Expenses';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { Compliance } from './pages/Compliance';
import { Profile } from './pages/Profile';
import { LiquidityCalendar } from './components/features/LiquidityCalendar';
import { Settings } from './pages/Settings';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { UpdatePassword } from './pages/UpdatePassword';
import PricingPage from './components/Pricing/PricingPage';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/update-password" element={<UpdatePassword />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="invoices" element={<Invoices />} />
                  <Route path="invoices/create" element={<InvoiceGenerator />} />
                  <Route path="invoices/new" element={<InvoiceNew />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="compliance" element={<Compliance />} />
                  <Route path="calendar" element={<LiquidityCalendar />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="pricing" element={<PricingPage />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;