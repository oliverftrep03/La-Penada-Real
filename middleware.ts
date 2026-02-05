import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    try {
        // Safety check for critical env vars to prevent crashes
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return res;
        }

        const supabase = createMiddlewareClient({ req, res });

        // Refresh session
        const { data: { session } } = await supabase.auth.getSession();

        const path = req.nextUrl.pathname;

        // Anti-Loop Strategy: Allow critical pages to load even if server-session is missing.
        // The client-side page (useEffect) will handle the final redirect if needed.
        const isPublic =
            path === '/' ||
            path.startsWith('/auth') ||
            path.startsWith('/api') ||
            path === '/setup' ||
            path === '/home';

        // Block everything else only if NOT public
        if (!session && !isPublic) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // Redirect from Login to Home if we are SURE we have a session
        if (session && path === '/') {
            return NextResponse.redirect(new URL('/home', req.url));
        }

    } catch (e) {
        // Prevent 500 Errors
        console.error("Middleware Error:", e);
        return res;
    }

    return res;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
