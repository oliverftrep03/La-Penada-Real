import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // If user is not signed in and the current path is NOT / (login), redirect the user to /
    if (!session && req.nextUrl.pathname !== '/' && !req.nextUrl.pathname.startsWith('/auth/')) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    // If user is signed in and trying to access / (login page), redirect to /home or /setup
    if (session && req.nextUrl.pathname === '/') {
        // We can't check profile here easily without DB call, so we send to home
        // and let the home page header/logic handle the setup check if needed
        return NextResponse.redirect(new URL('/home', req.url));
    }

    return res;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
