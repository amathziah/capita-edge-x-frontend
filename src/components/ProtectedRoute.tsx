import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePersona } from '../contexts/PersonaContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const { organizationId, businessType, loading: loadingPersona } = usePersona();
    const personaLoading = loadingPersona;
    const isSetupPage = window.location.pathname === '/setup';

    // OPTIMISTIC RENDERING: If we have a cached persona and org, don't block with onboarding UI
    const hasCachedState = !!(organizationId && businessType);
    const hasToken = !!user;

    // RULE 1: If we have ANY session markers, stay in neutral entry mode while hydrating
    // This prevents seeing "Syncing..." or "Build your space" flashes
    if ((loading || loadingPersona || personaLoading) && (hasToken || hasCachedState)) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#040608]">
                <div className="w-12 h-12 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
            </div>
        );
    }

    // Standard Onboarding Loader (only if no session hint at all)
    if ((loading || loadingPersona) && !hasCachedState) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-[#0c0f1a] space-y-4">
                <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
                <p className="text-gray-400 text-sm font-bold tracking-tight">Syncing Security Protocol...</p>
            </div>
        );
    }

    // Only redirect to login AFTER hydration is fully proven invalid
    if (!loading && !user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect to setup ONLY after hydration confirms missing identity
    const isFullyLoaded = !loading && !loadingPersona;
    if (user && isFullyLoaded && !organizationId && !isSetupPage) {
        return <Navigate to="/setup" replace />;
    }

    // Prevent access to /setup if already has BOTH organization and persona
    if (organizationId && businessType && isSetupPage) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
