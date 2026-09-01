import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { sanitizeSupabaseUrl } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const rawKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (rawUrl && rawKey) {
      const supabaseUrl = sanitizeSupabaseUrl(rawUrl)
      const supabaseKey = rawKey.trim()
      const response = NextResponse.redirect(new URL(next, request.url))

      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (items) => {
            items.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      })

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        return response
      }
    }
  }

  // Redirect to login with error if verification fails
  const errorUrl = new URL('/login', request.url)
  errorUrl.searchParams.set('error', 'Verifikasi autentikasi gagal atau tautan telah kedaluwarsa.')
  return NextResponse.redirect(errorUrl)
}
