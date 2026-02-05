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
        // We allow '/setup' and '/home' to pass through so Client-Side Auth can handle the session check
        // This fixes the "Login Loop" if server cookies are delayed
        const isPublic = path === '/' || path.startsWith('/auth') || path.startsWith('/api') || path === '/setup' || path === '/home';

        if (!session && !isPublic) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // 2. If logged in, prevent access to login page
        if (session && path === '/') {
            return NextResponse.redirect(new URL('/home', req.url));
        }
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
