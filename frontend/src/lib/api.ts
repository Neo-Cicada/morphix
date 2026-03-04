import { createClient } from '@/utils/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getAccessToken(): Promise<string | null> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

async function refreshSessionIfNeeded(): Promise<string | null> {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error || !session) return null;
    return session.access_token;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
    body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    let token = await getAccessToken();

    if (!token) {
        throw new Error('Not authenticated');
    }

    const { body, ...rest } = options;

    const doFetch = async (accessToken: string) =>
        fetch(`${API_BASE_URL}${path}`, {
            ...rest,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                ...rest.headers,
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

    let res = await doFetch(token);

    // If 401, try refreshing the session once and retry
    if (res.status === 401) {
        const refreshed = await refreshSessionIfNeeded();
        if (!refreshed) throw new Error('Session expired. Please log in again.');
        token = refreshed;
        res = await doFetch(token);
    }

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorBody.message ?? `Request failed: ${res.status}`);
    }

    return res.json() as Promise<T>;
}

export const api = {
    get: <T>(path: string, options?: RequestOptions) =>
        request<T>(path, { ...options, method: 'GET' }),

    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>(path, { ...options, method: 'POST', body }),

    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>(path, { ...options, method: 'PUT', body }),

    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
        request<T>(path, { ...options, method: 'PATCH', body }),

    delete: <T>(path: string, options?: RequestOptions) =>
        request<T>(path, { ...options, method: 'DELETE' }),
};
