import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabaseClient';

const AUTH_STORAGE_KEYS = ['sb-access-token', 'sb-refresh-token', 'sb-auth-token', 'supabase.auth.token', 'sb-org-id'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          // If the token is invalid/not found, we should proactively clean up
          if (error.message?.includes('Refresh Token Not Found') || error.message?.includes('Invalid Refresh Token')) {
             console.warn('[AuthContext] Stale session detected, performing deep cleanup');
              await supabase.auth.signOut({ scope: 'global' });
              
              // Targeted cleanup instead of localStorage.clear()
              AUTH_STORAGE_KEYS.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
              });

              if (mounted) {
               setSession(null);
               setUser(null);
             }
             return;
          }
          throw error;
        }
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('[AuthContext] getSession failed:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 10s safety valve — must be ≥ PersonaContext's own 10s timeout so that
    // we never flip loading→false before Supabase/PersonaContext finishes.
    // On Render free-tier cold starts, getSession() can take 5-8 seconds.
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 10_000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    
    // Perform targeted cleanup to prevent state bleeding
    AUTH_STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
