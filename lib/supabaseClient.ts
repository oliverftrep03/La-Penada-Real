import { createClient } from '@supabase/supabase-js'
import { createMockClient } from './mockSupabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

// Robust check: Ensure URL is valid and not placeholder
const isValidUrl = (url: string | undefined) => {
    if (!url) return false;
    try {
        new URL(url);
        return url !== "https://placeholder.supabase.co" && !url.includes("placeholder");
    } catch {
        return false;
    }
};

const isRealSupabaseConfigured = isValidUrl(supabaseUrl) && !!supabaseAnonKey;

// Log status for debugging
if (typeof window !== 'undefined') {
    console.log("[Supabase Init] Configured:", isRealSupabaseConfigured);
    console.log("[Supabase Init] URL:", supabaseUrl);
}

// 1. Create a safe fallback client immediately
let client: any = createMockClient();

// 2. Try to upgrade to Real Client if configured
if (isRealSupabaseConfigured) {
    try {
        console.log("[Supabase Init] Attempting to create real client...");
        const realClient = createClient(supabaseUrl!, supabaseAnonKey!);
        // Verify it looks like a client
        if (realClient && typeof realClient.from === 'function') {
            client = realClient;
            console.log("[Supabase Init] Real client created successfully.");
        }
    } catch (e) {
        console.error("[Supabase Init] Failed to create real client, using mock:", e);
        // client remains the mock one
    }
} else {
    console.warn("[Supabase Init] Configuration missing or invalid. Using Mock Client.");
}

// Ensure the app thinks it's configured so it doesn't block the user.
export const isSupabaseConfigured = true;
export const usingMock = !isRealSupabaseConfigured;

export const supabase = client;
