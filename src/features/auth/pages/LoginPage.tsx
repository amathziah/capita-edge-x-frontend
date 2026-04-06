import AuthComponent from '../components/Auth';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePersona } from '@/contexts/PersonaContext';
import { hasCompletedOnboarding } from '@/lib/authFlow';

export function LoginPage() {
    const { user, loading: authLoading } = useAuth();
    const { organizationId, businessType, loading: personaLoading } = usePersona();
    const isHydrating = authLoading || personaLoading;
    const isOnboarded = hasCompletedOnboarding(organizationId, businessType);

    if (isHydrating && user) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#040608]">
                <div className="relative">
                    <div className="w-12 h-12 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 bg-teal-500/10 blur-xl rounded-full" />
                </div>
            </div>
        );
    }

    if (!isHydrating && user) {
        return <Navigate to={isOnboarded ? '/dashboard' : '/setup'} replace />;
    }

    return <AuthComponent />;
}
