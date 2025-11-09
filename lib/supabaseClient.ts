console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

import { createClient } from "@supabase/supabase-js"

// ✅ Use environment variables for Supabase credentials
const SUPABASE_URL = "https://jumgxcucrwmhqkfngpjt.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1bWd4Y3VjcndtaHFrZm5ncGp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYxMjgwMywiZXhwIjoyMDc3MTg4ODAzfQ._AdXq7_8wljzMzGp-xpGErHytb-Rph_3ushhAgAg8f8"

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
