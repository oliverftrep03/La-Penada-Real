import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()

    try {
        // 1. Initialize Supabase Client to refresh session cookies
        // This keeps the user logged in.
        const supabase = createMiddlewareClient({ req, res })
        await supabase.auth.getSession()

        // 2. NO SERVER-SIDE REDIRECTS to avoid loops.
        // We rely entirely on the Client Side (app/page.tsx) to handle routing.

    } catch (e) {
        console.error("Middleware refresh error:", e)
    }

    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
