import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    try {
        // 1. Initialize Supabase Client
        // This is CRITICAL. It refreshes the Auth Cookie so the user stays logged in.
        // Even if we don't redirect here, we MUST run this.
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const supabase = createMiddlewareClient({ req, res });
            await supabase.auth.getSession();
        }

        // 2. NO REDIRECTS HERE.
        // We are removing all server-side blocking to prevent the "Login Loop".
        // The individual pages (Client Components) will check if the user is logged in
        // and redirect them if needed. This is safer for Vercel/Supabase timing.

    } catch (e) {
        console.error("Middleware Error:", e);
    }

    return res;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
