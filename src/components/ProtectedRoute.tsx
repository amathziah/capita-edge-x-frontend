import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePersona } from '../contexts/PersonaContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
    const { user, loading, orgId, checkingOrg } = useAuth();
    const { businessType, loading: loadingPersona } = usePersona();
    const isSetupPage = window.location.pathname === '/setup';

    // OPTIMISTIC RENDERING: If we have a cached persona and org, don't block with loading screen
    const hasCachedState = !!(orgId && businessType);

    if ((loading || loadingPersona) && !hasCachedState) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-[#0c0f1a] space-y-4">
                <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
                <p className="text-gray-400 text-sm font-bold tracking-tight">Syncing Security Protocol...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Only block if we truly have no identity and no cached organization
    if (checkingOrg && !orgId && !hasCachedState) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-[#0c0f1a] space-y-4">
                <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
                <p className="text-gray-400 text-sm font-bold tracking-tight">Authenticating Workspace...</p>
            </div>
        );
    }

    // Redirect to setup if EVERTHING is loaded and we STILL have no organization OR no persona
    const isFullyLoaded = !loading && !checkingOrg && !loadingPersona;
    if (user && isFullyLoaded && (!orgId || !businessType) && !isSetupPage) {
        return <Navigate to="/setup" replace />;
    }

    // Prevent access to /setup if already has BOTH organization and persona
    if (orgId && businessType && isSetupPage) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
