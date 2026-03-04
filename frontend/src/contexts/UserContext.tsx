'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

interface User {
    id: string;
    email: string;
    full_name: string | null;
    credit_balance: number;
}

interface UserContextValue {
    user: User | null;
    loading: boolean;
    refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
    user: null,
    loading: true,
    refresh: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        // Seed email from Supabase session immediately so name is never blank
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUser((prev) => prev ?? {
                id: session.user.id,
                email: session.user.email ?? '',
                full_name: null,
                credit_balance: 0,
            });
        }

        try {
            const data = await api.get<User>('/users/me');
            setUser(data);
        } catch {
            // Keep the Supabase-seeded value if backend is unreachable
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    return (
        <UserContext.Provider value={{ user, loading, refresh }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);
