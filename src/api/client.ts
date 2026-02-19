const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = localStorage.getItem('sb-access-token');
        const organizationId = localStorage.getItem('sb-org-id');

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            (headers as any)['Authorization'] = `Bearer ${token}`;
        }

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
}

export const api = new ApiClient();
