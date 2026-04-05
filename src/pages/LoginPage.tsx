import AuthComponent from '../components/Auth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePersona } from '../contexts/PersonaContext';
import { hasCompletedOnboarding } from '../lib/authFlow';

export function LoginPage() {
    const { user, loading: authLoading } = useAuth();
    const { organizationId, businessType, loading: personaLoading } = usePersona();
    const navigate = useNavigate();
    const isHydrating = authLoading || personaLoading;
    const isOnboarded = hasCompletedOnboarding(organizationId, businessType);

    useEffect(() => {
        if (isHydrating || !user) {
            return;
        }

        navigate(isOnboarded ? '/dashboard' : '/setup', { replace: true });
    }, [isHydrating, isOnboarded, navigate, user]);

    return <AuthComponent />;
}
