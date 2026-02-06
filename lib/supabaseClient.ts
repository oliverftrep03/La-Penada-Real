import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://placeholder.supabase.co");

// Export typed client or null. 
// We use 'any' to avoid strict null checks breaking consumers immediately, 
// but we expect consumers to handle the 'Setup Required' state if this is used.
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : null; // Consumers must handle null if config is missing
