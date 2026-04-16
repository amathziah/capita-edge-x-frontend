import { supabase } from '@/shared/lib/supabaseClient';

let _orgId: string | null = null;
export const setOrgId = (id: string | null) => { _orgId = id; };
export const getOrgId = () => _orgId;

let _resolveReady: () => void;
const _ready = new Promise<void>((resolve) => {
    _resolveReady = resolve;
});

export const markOrgReady = () => _resolveReady?.();

// Safety timeout: must be ≥ PersonaContext's own 10s timeout so we never
// unblock the API client before PersonaContext has set the org ID.
setTimeout(() => markOrgReady(), 10_000);

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

    private async buildHeaders(options: RequestInit, token: string | null): Promise<HeadersInit> {
        const organizationId = getOrgId();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        };
        if (organizationId) {
            (headers as any)['X-Organization-ID'] = organizationId;
        }
        if (options.body instanceof FormData) {
            delete (headers as any)['Content-Type'];
        }
        return headers;
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

        const doFetch = async (tkn: string | null) => {
            const headers = await this.buildHeaders(options, tkn);
            return fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
                body: options.body,
            });
        };

        let response = await doFetch(token);

        // On 401: attempt a silent token refresh and retry ONCE.
        // This covers the common case of an access token expiring mid-session
        // without requiring the user to manually sign out and back in.
        if (response.status === 401) {
            console.warn('[ApiClient] 401 on', endpoint, '— attempting token refresh');
            try {
                const { data: { session: refreshed }, error } = await supabase.auth.refreshSession();
                if (!error && refreshed?.access_token) {
                    token = refreshed.access_token;
                    response = await doFetch(token);
                } else {
                    // Refresh failed — redirect to login
                    console.error('[ApiClient] Token refresh failed, redirecting to login');
                    window.location.href = '/login';
                    throw new Error('Session expired. Please sign in again.');
                }
            } catch (refreshErr) {
                console.error('[ApiClient] Token refresh exception:', refreshErr);
                window.location.href = '/login';
                throw new Error('Session expired. Please sign in again.');
            }
        }

        if (response.status === 403) {
            console.error('[ApiClient] Forbidden request to', endpoint);
        }

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = errorBody;
            try {
                const parsed = JSON.parse(errorBody);
                errorMessage = parsed.error || parsed.message || errorBody;
            } catch (_e) {
                // Not JSON
            }
            throw new Error(errorMessage);
        }

        if (response.status === 204) return {} as T;

        try {
            return await response.json();
        } catch (_e) {
            return {} as T;
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
