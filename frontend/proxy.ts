import { type NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/config'

const API_BASE = getApiBaseUrl()

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

async function getAuthUser(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get('auth_token')?.value
    const cookieHeader = request.headers.get('cookie') || ''
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Cookie: cookieHeader,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}/api/auth/user`, {
      headers,
    })
    return response.ok
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always-public routes - skip auth entirely
  if (isAlwaysPublic(pathname)) {
    return NextResponse.next({ request })
  }

  const isAuthenticated = await getAuthUser(request)

  // Auth pages: redirect authenticated users to dashboard
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next({ request })
  }

  // Protected routes: redirect unauthenticated users to login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
