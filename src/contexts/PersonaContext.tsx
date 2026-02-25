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
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Profile not found, this is expected for brand new users
                    setBusinessType(null);
                } else {
                    throw error;
                }
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

        const maxRetries = 3;
        let attempt = 0;

        const performUpdate = async (): Promise<boolean> => {
            const { data, error } = await supabase
                .from('profiles')
                .update({ business_type: newType })
                .eq('id', user.id)
                .select();

            if (error) {
                console.error(`Attempt ${attempt + 1} failed:`, error);
                return false;
            }

            // If data is empty, the profile doesn't exist yet (race condition with DB trigger)
            return !!(data && data.length > 0);
        };

        try {
            setLoading(true);
            let success = false;

            while (attempt < maxRetries && !success) {
                success = await performUpdate();
                if (!success) {
                    attempt++;
                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
                    }
                }
            }

            if (!success) throw new Error('Failed to update persona after multiple attempts. Profile might not be initialized.');

            setBusinessType(newType);
            localStorage.setItem('malika-persona', newType);
        } catch (err) {
            console.error('Error updating persona:', err);
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
