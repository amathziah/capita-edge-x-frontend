import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';


interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    orgId: string | null;
    checkingOrg: boolean;
    signOut: () => Promise<void>;
    refreshOrgContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    orgId: null,
    checkingOrg: true,
    signOut: async () => { },
    refreshOrgContext: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(() => {
        // Optimistic: If we have a token hint, we assume we might be logged in
        return !localStorage.getItem('sb-access-token');
    });
    const [orgId, setOrgId] = useState<string | null>(localStorage.getItem('sb-org-id'));
    const [checkingOrg, setCheckingOrg] = useState(() => {
        // If we have an orgId hint, we don't block the UI with a "Verifying Organization" screen
        return !localStorage.getItem('sb-org-id');
    });

    useEffect(() => {
        let mounted = true;

        // Initialize Auth
        const initializeAuth = async () => {
            try {
                // 1. Get initial session
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                if (!mounted) return;

                setSession(initialSession);
                setUser(initialSession?.user ?? null);

                // CRITICAL: Stop loading immediately so UI renders
                setLoading(false);

                if (initialSession) {
                    localStorage.setItem('sb-access-token', initialSession.access_token);
                    // Background fetch - don't await here to block UI
                    fetchAndSetOrgContext(initialSession.user.id).catch(err =>
                        console.error("Background org fetch failed:", err)
                    );
                } else {
                    setCheckingOrg(false);
                }
            } catch (error) {
                console.error("Auth initialization failed:", error);
                if (mounted) {
                    setLoading(false);
                    setCheckingOrg(false);
                }
            }
        };

        initializeAuth();

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false); // Immediate UI update

            if (session) {
                localStorage.setItem('sb-access-token', session.access_token);
                fetchAndSetOrgContext(session.user.id).catch(console.error);
            } else {
                localStorage.removeItem('sb-access-token');
                localStorage.removeItem('sb-org-id');
                setOrgId(null);
                setCheckingOrg(false);
            }
        });

        // Failsafe timeout in case initialization hangs
        const timeout = setTimeout(() => {
            if (mounted) setLoading((l) => {
                if (l) console.warn("Auth initialization took too long. Forcing render.");
                return false;
            });
        }, 3000);

        // Cleanup
        return () => {
            mounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const fetchAndSetOrgContext = async (userId: string) => {
        setCheckingOrg(true);
        try {
            // Query via Supabase (Client Side RLS allows reading own org_users)
            const { data } = await supabase
                .from('organization_users')
                .select('organization_id')
                .eq('user_id', userId)
                .limit(1)
                .maybeSingle();

            if (data?.organization_id) {
                localStorage.setItem('sb-org-id', data.organization_id);
                setOrgId(data.organization_id);
            } else {
                console.warn('No Organization found for user. Backend might assign default.');
                setOrgId(null);
                localStorage.removeItem('sb-org-id');
            }
        } catch (err) {
            console.error('Error fetching org context:', err);
        } finally {
            setCheckingOrg(false);
        }
    };

    const refreshOrgContext = async () => {
        if (user) await fetchAndSetOrgContext(user.id);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-org-id');
        localStorage.removeItem('malika-persona');
        setOrgId(null);
    };

    const hasToken = !!localStorage.getItem('sb-access-token');

    return (
        <AuthContext.Provider value={{ session, user, loading, orgId, checkingOrg, signOut, refreshOrgContext }}>
            {loading ? (
                <div className={`flex items-center justify-center h-screen ${hasToken ? 'bg-[#040608]' : 'bg-gray-50'}`}>
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${hasToken ? 'border-teal-500' : 'border-violet-600'}`}></div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
