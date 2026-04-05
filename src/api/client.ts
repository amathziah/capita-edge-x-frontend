import { supabase } from '../supabaseClient';

let _orgId: string | null = null;
export const setOrgId = (id: string | null) => { _orgId = id; };
export const getOrgId = () => _orgId;

let _resolveReady: () => void;
const _ready = new Promise<void>((resolve) => {
    _resolveReady = resolve;
});

export const markOrgReady = () => _resolveReady?.();

// Safety timeout: ensure API is never blocked indefinitely if PersonaContext fails
setTimeout(() => markOrgReady(), 5000);

export const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    // Ensure it doesn't end with a trailing slash for consistency
    url = url.replace(/\/$/, '');
    // Ensure it ends with /api if it doesn't already
    if (!url.endsWith('/api')) {
        url += '/api';
    }
    return url;
};

export const API_URL = getBaseUrl();

class ApiClient {
    public wait() {
        return _ready;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        await _ready;
        let token: string | null = null;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            token = session?.access_token ?? null;
        } catch (e) {
            console.warn('[ApiClient] Failed to fetch session token:', e);
        }
        
        const organizationId = getOrgId();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        };

        if (organizationId) {
            (headers as any)['X-Organization-ID'] = organizationId;
        }

        // Prepare Body (handle FormData vs JSON)
        let body = options.body;
        if (body instanceof FormData) {
            delete (headers as any)['Content-Type']; // Let browser set boundary
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            body
        });

        // Global Error Handling
        if (response.status === 401) {
            console.warn('Unauthorized request to', endpoint);
            // Optional: Event bus emit 'logout'
        }

        if (response.status === 403) {
            console.error('Forbidden request');
        }

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = errorBody;
            try {
                const parsed = JSON.parse(errorBody);
                errorMessage = parsed.error || parsed.message || errorBody;
            } catch (e) {
                // Not JSON
            }
            throw new Error(errorMessage);
        }

        // Return void for 204 or empty bodies? 
        // Usually we expect JSON unless specified.
        if (response.status === 204) return {} as T;

        try {
            return await response.json();
        } catch (e) {
            return {} as T; // Fallback for empty responses that aren't 204
        }
    }

    get<T>(endpoint: string, options?: RequestInit) {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    post<T>(endpoint: string, body?: any, options?: RequestInit) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    }

    put<T>(endpoint: string, body?: any, options?: RequestInit) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    delete<T>(endpoint: string, options?: RequestInit) {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }

    patch<T>(endpoint: string, body?: any, options?: RequestInit) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    }

    async getBlob(endpoint: string, options?: RequestInit): Promise<Blob> {
        await _ready;
        let token: string | null = null;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            token = session?.access_token ?? null;
        } catch (e) {
            console.warn('[ApiClient] Failed to fetch session token for download:', e);
        }
        
        const organizationId = getOrgId();

        const headers: HeadersInit = {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options?.headers,
        };

        if (organizationId) {
            (headers as any)['X-Organization-ID'] = organizationId;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            throw new Error(`Download failed: ${response.statusText}`);
        }

        return await response.blob();
    }
}

export const api = new ApiClient();
