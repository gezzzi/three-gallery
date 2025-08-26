import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// ブラウザ用のSupabaseクライアント
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}