
// Removed uuid import to avoid dependency issues
const genId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'mock_' + Math.random().toString(36).substr(2, 9);

const isBrowser = typeof window !== 'undefined';

const getLocal = (key: string) => {
    if (!isBrowser) return null;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.warn("Mock Supabase: LocalStorage read invalid", e);
        return null;
    }
};

const setLocal = (key: string, value: any) => {
    if (!isBrowser) return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn("Mock Supabase: LocalStorage write failed", e);
    }
};

export const createMockClient = () => {
    try {
        console.log("Creating Mock Supabase Client...");


        const auth = {
            getSession: async () => {
                const session = getLocal('mock_session');
                return { data: { session }, error: null };
            },
            onAuthStateChange: (callback: any) => {
                // Emit initial state if needed
                const session = getLocal('mock_session');
                if (session) callback('SIGNED_IN', session);
                return { data: { subscription: { unsubscribe: () => { } } } };
            },
            signInAnonymously: async () => {
                const user = { id: 'anon_' + Date.now(), role: 'anon', aud: 'authenticated' };
                const session = { user, access_token: 'mock_token', refresh_token: 'mock_refresh' };
                setLocal('mock_session', session);
                return { data: { session }, error: null };
            },
            signInWithOAuth: async ({ provider }: any) => {
                // Simulate redirect or just login
                // Since we can't really redirect on mock, we'll just set session and reload?
                // But provider expects redirect.
                // We'll just fake it by setting session and alerting user to reload or handling it?
                // Better: Just behave like it succeeded immediately? 
                // No, signInWithOAuth usually redirects.
                // For mock, we can't easily simulate the callback flow without changing pages.
                // But we can manually set session.
                console.log("Mock OAuth", provider);
                const user = { id: 'mock_google_' + Date.now(), email: 'mock@example.com', role: 'authenticated', aud: 'authenticated' };
                const session = { user, access_token: 'mock_token', refresh_token: 'mock_refresh' };
                setLocal('mock_session', session);
                // We can't auto-redirect back to callback easily.
                // Maybe just trigger a window location change if in browser?
                if (isBrowser) {
                    window.location.href = '/home'; // Direct bypass
                }
                return { data: {}, error: null };
            },
            signOut: async () => {
                if (isBrowser) localStorage.removeItem('mock_session');
                return { error: null };
            },
            getUser: async () => {
                const session = getLocal('mock_session');
                return { data: { user: session?.user || null }, error: null };
            }
        };



        // Refined 'from' to handle basic query building
        const fromRefined = (table: string) => {
            const storageKey = `mock_db_${table}`;
            let filters: any[] = [];
            let operation = 'select';
            let pendingData: any = null;

            const execute = () => {
                let rows = getLocal(storageKey) || [];

                if (operation === 'insert') {
                    const newRows = Array.isArray(pendingData) ? pendingData : [pendingData];
                    newRows.forEach((r: any) => {
                        if (!r.id) r.id = genId();
                        r.created_at = new Date().toISOString();
                    });
                    rows = [...rows, ...newRows];
                    setLocal(storageKey, rows);
                    return { data: newRows, error: null };
                }

                // Apply filters
                for (const f of filters) {
                    if (f.type === 'eq') {
                        rows = rows.filter((r: any) => r[f.col] == f.val);
                    }
                }

                // Sorting (Mock: by created_at desc default?)
                // rows.sort(...)

                let data = rows;
                if (operation === 'single') {
                    data = rows.length > 0 ? rows[0] : null;
                }

                return { data, error: null };
            };

            const builder: any = {
                select: (cols?: string) => {
                    operation = 'select';
                    return builder;
                },
                insert: (data: any) => {
                    operation = 'insert';
                    pendingData = data;
                    return builder; // usually needs select() after to return data
                },
                update: (data: any) => {
                    // Not implemented fully, just fake it
                    return builder;
                },
                eq: (col: string, val: any) => {
                    filters.push({ type: 'eq', col, val });
                    return builder;
                },
                single: () => {
                    // .single() is usually terminal in chain but in supabase it returns a modifier.
                    // Actually users check: const { data } = await ...single()
                    // So executing now:
                    const res = execute();
                    return Promise.resolve({ data: (Array.isArray(res.data) ? res.data[0] : res.data) || null, error: null });
                },
                order: () => builder,
                limit: () => builder,
                // Make it awaitable
                then: (resolve: any, reject: any) => {
                    const res = execute();
                    return Promise.resolve(res).then(resolve, reject);
                }
            };

            return builder;
        };

        return {
            auth,
            from: fromRefined,
            storage: {
                from: () => ({
                    getPublicUrl: (path: string) => ({ data: { publicUrl: `https://via.placeholder.com/300?text=${path}` } }),
                    upload: async () => ({ data: { path: "mock_path" }, error: null })
                })
            },
            channel: () => ({
                on: () => ({ subscribe: () => { } }),
                subscribe: () => { }
            }),
            removeChannel: () => { },
            removeAllChannels: () => { },
            getChannels: () => []
        };
    } catch (e) {
        console.error("CRITICAL: Mock Client Init Failed", e);
        // Return a bare minimum object to prevent null pointer exceptions
        return {
            auth: {
                getSession: async () => ({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            } as any,
            from: () => ({ select: () => ({ data: [], error: null }) } as any),
            channel: () => ({ on: () => ({ subscribe: () => { } }), subscribe: () => { } } as any),
            removeChannel: () => { },
            removeAllChannels: () => { },
            getChannels: () => []
        } as any;
    }
};
