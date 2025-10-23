console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

import { createClient } from "@supabase/supabase-js"

// ✅ Use environment variables for Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log("✅ Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log("✅ Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Loaded" : "Missing")

// ✅ Create client with session persistence disabled
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,     // prevents auto sign-in from localStorage
    autoRefreshToken: false,   // disables background refresh calls
    detectSessionInUrl: false, // avoids parsing tokens from URL fragments
  },
})
