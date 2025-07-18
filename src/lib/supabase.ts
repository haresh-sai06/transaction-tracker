import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types
export interface Transaction {
  id: string
  user_id: string
  amount: number
  currency: string
  date: string
  source: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  preferred_currency: string
  created_at: string
  updated_at: string
}

export interface PaymentAccount {
  id: string
  user_id: string
  provider: string
  account_name: string
  is_active: boolean
  last_sync: string
  created_at: string
  updated_at: string
}