import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// クライアントコンポーネント用
export const supabaseClient = createClientComponentClient()

// サーバーコンポーネント用
export async function createServerClient() {
  await cookies() // cookieStoreは使用していないが、Next.jsのサーバーコンポーネントで必要
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
}

// 認証状態を取得
export async function getSession() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ユーザー情報を取得
export async function getUser() {
  const session = await getSession()
  return session?.user || null
}