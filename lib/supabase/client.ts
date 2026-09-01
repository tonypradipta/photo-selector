import { createBrowserClient } from '@supabase/ssr'

export function sanitizeSupabaseUrl(url?: string): string {
  if (!url) return ''
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
}

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
  const url = sanitizeSupabaseUrl(rawUrl)
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key').trim()
  return createBrowserClient(url, key)
}

