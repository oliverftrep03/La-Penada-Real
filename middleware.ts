import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    try {
        // Safety check for critical env vars
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn("Middleware skipped: Supabase keys missing.");
            return res; // Allow request to proceed (client-side will handle auth or fail gracefully)
        }

        const supabase = createMiddlewareClient({ req, res });

        // Refresh session if expired - this is the main purpose of middleware
        const { data: { session } } = await supabase.auth.getSession();

        // Route Protection Logic
        const path = req.nextUrl.pathname;

        // 1. If NOT logged in, block access to protected routes
        // (Everything except login '/', auth callback, and public assets)
        if (!session && path !== '/' && !path.startsWith('/auth') && !path.startsWith('/api')) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // 2. If logged in, prevent access to login page
        if (session && path === '/') {
            // Ideally we check DB for profile here, but let the client handle that redirect to avoid DB calls in middleware
            return NextResponse.redirect(new URL('/home', req.url));
        }

    } catch (e) {
        // CRITICAL: If middleware fails, DO NOT CRASH APP (500 Error).
        // Just authorize the request and let the client handle errors.
        console.error("Middleware Error:", e);
        return res;
    }

    return res;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
