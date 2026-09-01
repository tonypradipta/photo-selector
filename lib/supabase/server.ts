import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { sanitizeSupabaseUrl } from './client'

export async function createClient() {
  const cookieStore = await cookies()
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
  const url = sanitizeSupabaseUrl(rawUrl)
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key').trim()

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    },
  )
}
