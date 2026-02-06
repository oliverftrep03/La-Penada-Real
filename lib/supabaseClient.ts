import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

// Robust check: Ensure URL is valid and not placeholder
const isValidUrl = (url: string | undefined) => {
    if (!url) return false;
    try {
        new URL(url);
        return url !== "https://placeholder.supabase.co";
    } catch {
        return false;
    }
};

export const isSupabaseConfigured = isValidUrl(supabaseUrl) && !!supabaseAnonKey;

// Safe client creation
let client = null;
try {
    if (isSupabaseConfigured) {
        client = createClient(supabaseUrl!, supabaseAnonKey!);
    }
} catch (e) {
    console.error("Supabase Client Init Error:", e);
}

export const supabase = client;
