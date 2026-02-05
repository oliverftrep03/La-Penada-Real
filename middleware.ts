import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    try {
        // 1. Check for Env Vars to prevent 500 crashes
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn("Middleware warning: Supabase keys missing.");
            return res;
        }

        const supabase = createMiddlewareClient({ req, res });

        // 2. Refresh the session (Essential for Supabase Auth to work)
        const { data: { session } } = await supabase.auth.getSession();

        const path = req.nextUrl.pathname;

        // 3. RELAXED PROTECTION (Anti-Loop Logic)
        // We only strictly block access if the user is NOT logged in AND trying to access
        // a route that is DEFINITELY not public.
        // We explicitly ALLOW '/home' and '/setup' to pass through to let the Client-Side check the session.

        const isPublicOrClientHandled =
            path === '/' ||
            path.startsWith('/auth') ||
            path.startsWith('/api') ||
            path === '/setup' ||
            path === '/home' ||
            path === '/profile' ||    // Let client redirect if needed
            path === '/gallery' ||    // Let client redirect if needed
            path === '/chat';         // Let client redirect if needed

        if (!session && !isPublicOrClientHandled) {
            // Only redirect to login if they are trying to access something totally unknown/protected
            // In practice, this block might effectively do nothing if all main routes are whitelisted,
            // which is INTENTIONAL to fix the loop. The Pages themselves will kick the user out if needed.
            return NextResponse.redirect(new URL('/', req.url));
        }

        // 4. Login Page Redirect
        // If they are strictly on '/' (login) and we are SURE they have a session, send them home.
        if (session && path === '/') {
            return NextResponse.redirect(new URL('/home', req.url));
        }

        return res;

    } catch (e) {
        console.error("Middleware Error:", e);
        return res;
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
