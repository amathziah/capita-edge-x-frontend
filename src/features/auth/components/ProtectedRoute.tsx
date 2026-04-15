import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { usePersona } from '@/app/providers/PersonaContext';
import { hasCompletedOnboarding, needsOnboarding } from '@/shared/lib/authFlow';
import { useEffect, useRef, useState } from 'react';

export const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const { organizationId, businessType, loading: loadingPersona } = usePersona();
    const location = useLocation();
    const isOnboarded = hasCompletedOnboarding(organizationId, businessType);
    const requiresOnboarding = needsOnboarding(organizationId, businessType);

    // Safety valve: if hydration never resolves after 8 seconds, stop waiting.
    // PersonaContext already has its own 10s query timeout + always calls markOrgReady()
    // in finally, so this is a last-resort guard for unexpected stuck states.
    const [hydrationTimedOut, setHydrationTimedOut] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (loading || loadingPersona) {
            timerRef.current = setTimeout(() => setHydrationTimedOut(true), 8_000);
        } else {
            if (timerRef.current) clearTimeout(timerRef.current);
            setHydrationTimedOut(false);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [loading, loadingPersona]);

    const isHydrating = (loading || loadingPersona) && !hydrationTimedOut;

    if (isHydrating) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#040608]">
                <div className="w-12 h-12 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiresOnboarding) {
        return <Navigate to="/setup" replace state={{ from: location }} />;
    }

    return <Outlet />;
};
