import { createClient } from '@supabase/supabase-js'
import { createAuthStorage } from './rememberMe'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY - copy web/.env.example to web/.env.local and fill in the project values.',
  )
}

// The session goes to localStorage or sessionStorage by the login screen's
// "Zapamatuj si mě" box (see rememberMe.ts).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: createAuthStorage() },
})
