import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = () => {
    const { user, loading, orgId, checkingOrg } = useAuth();
    const isSetupPage = window.location.pathname === '/setup';

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Wait for organization check before redirecting
    if (checkingOrg && !orgId) {
        return <div className="flex h-screen items-center justify-center">Verifying Organization...</div>;
    }

    // Redirect to setup if user exists but no organization is linked yet
    if (!orgId && !isSetupPage) {
        return <Navigate to="/setup" replace />;
    }

    // Prevent access to /setup if already has an organization
    if (orgId && isSetupPage) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
