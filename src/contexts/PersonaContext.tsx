import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

export type BusinessType = 'solopreneur' | 'agency' | 'saas' | 'ecommerce' | 'ca';

interface PersonaContextType {
    businessType: BusinessType | null;
    loading: boolean;
    refreshPersona: () => Promise<void>;
    updatePersona: (newType: BusinessType) => Promise<void>;
}

const PersonaContext = createContext<PersonaContextType>({
    businessType: null,
    loading: true,
    refreshPersona: async () => { },
    updatePersona: async () => { },
});

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [businessType, setBusinessType] = useState<BusinessType | null>(() => {
        return localStorage.getItem('malika-persona') as BusinessType | null;
    });
    const [loading, setLoading] = useState(() => {
        // If we have a cached persona, we can start with loading: false for optimistic rendering
        return !localStorage.getItem('malika-persona');
    });

    const fetchPersona = async (userId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('business_type')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                throw error;
            } else if (data && data.business_type) {
                const type = data.business_type as BusinessType;
                setBusinessType(type);
                localStorage.setItem('malika-persona', type);
            } else {
                setBusinessType(null);
                localStorage.removeItem('malika-persona');
            }
        } catch (err) {
            console.error('Error fetching persona:', err);
            setBusinessType(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPersona(user.id);
        } else {
            setLoading(false);
        }
    }, [user]);

    const refreshPersona = async () => {
        if (user) await fetchPersona(user.id);
    };

    const updatePersona = async (newType: BusinessType) => {
        if (!user) return;

        try {
            setLoading(true);
            console.log('[PersonaContext] Updating to:', newType, 'for user:', user.id);

            // First try a normal update
            const { data: updateData, error: updateError } = await supabase
                .from('profiles')
                .update({ business_type: newType })
                .eq('id', user.id)
                .select();

            if (updateError) {
                console.warn('[PersonaContext] Update warning:', updateError);
            }

            const updated = !!(updateData && updateData.length > 0);

            // If update returned nothing, profile row doesn't exist yet — upsert it
            if (!updated) {
                console.log('[PersonaContext] Profile not found, upserting...');
                const { error: upsertError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        business_type: newType,
                    }, { onConflict: 'id' });

                if (upsertError) {
                    console.error('[PersonaContext] Upsert error:', upsertError);
                    throw new Error(`Profile initialization failed: ${upsertError.message}`);
                }
            }

            console.log('[PersonaContext] Success.');
            setBusinessType(newType);
            localStorage.setItem('malika-persona', newType);
        } catch (err: any) {
            console.error('[PersonaContext] Final Error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <PersonaContext.Provider value={{ businessType, loading, refreshPersona, updatePersona }}>
            {children}
        </PersonaContext.Provider>
    );
};

export const usePersona = () => {
    const context = useContext(PersonaContext);
    if (context === undefined) {
        throw new Error('usePersona must be used within a PersonaProvider');
    }
    return context;
};
