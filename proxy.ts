import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes accessible without authentication
const PUBLIC_ROUTES = ['/login', '/register', '/signup', '/forgot-password', '/update-password']

// Routes that are always public (client gallery, API routes)
function isAlwaysPublic(pathname: string): boolean {
  return (
    pathname.startsWith('/select/') ||
    pathname.startsWith('/api/gallery/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  )
}

import { sanitizeSupabaseUrl } from '@/lib/supabase/client'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!rawUrl || !rawKey) {
    return response
  }

  const supabaseUrl = sanitizeSupabaseUrl(rawUrl)
  const supabaseKey = rawKey.trim()

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) =>
        items.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        }),
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Always-public routes — skip auth entirely
  if (isAlwaysPublic(pathname)) {
    return response
  }

  // Auth pages: redirect authenticated users to dashboard
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // Protected routes: redirect unauthenticated users to login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
