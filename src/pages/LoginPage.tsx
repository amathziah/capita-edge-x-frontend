import AuthComponent from '../components/Auth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePersona } from '../contexts/PersonaContext';

export function LoginPage() {
    const { user } = useAuth();
    const { organizationId: organizationId, loading: personaLoading, refreshPersona } = usePersona();
    const navigate = useNavigate();

    // Redirect if already authenticated (context-driven)
    useEffect(() => {
        if (user) {
            navigate(organizationId ? '/dashboard' : '/setup', { replace: true });
        }
    }, [user, organizationId, navigate]);

    return <AuthComponent />;
}
