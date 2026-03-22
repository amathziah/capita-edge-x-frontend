import AuthComponent from '../components/Auth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePersona } from '../contexts/PersonaContext';
import { supabase } from '../supabaseClient';

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

    // Fallback: listen for auth state change directly (catches OAuth + email login immediately)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                // Write token to localStorage immediately
                localStorage.setItem('sb-access-token', session.access_token);
                // Redirect to root so HomeLoader can decide (Dashboard vs Setup)
                navigate('/', { replace: true });
            }
        });
        return () => subscription.unsubscribe();
    }, [navigate]);

    return <AuthComponent />;
}
