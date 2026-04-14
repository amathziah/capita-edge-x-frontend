import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { usePersona } from '@/app/providers/PersonaContext';
import { hasCompletedOnboarding, needsOnboarding } from '@/shared/lib/authFlow';

export const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const { organizationId, businessType, loading: loadingPersona } = usePersona();
    const location = useLocation();
    const isOnboarded = hasCompletedOnboarding(organizationId, businessType);
    const requiresOnboarding = needsOnboarding(organizationId, businessType);

    if (loading || loadingPersona) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#040608]">
                <div className="w-12 h-12 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
            </div>
        );
    }

    // Only redirect to login AFTER hydration is fully proven invalid
    if (!loading && !user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect to setup ONLY after hydration confirms missing identity
    const isFullyLoaded = !loading && !loadingPersona;
    if (user && isFullyLoaded && requiresOnboarding) {
        return <Navigate to="/setup" replace state={{ from: location }} />;
    }

    return <Outlet />;
};
