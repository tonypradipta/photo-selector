import { NextRequest } from 'next/server'
import { getApiBaseUrl } from '@/lib/config'

export function laravelBaseUrl(): string {
  return getApiBaseUrl()
}

export function laravelAuthHeaders(request: NextRequest, extra: Record<string, string> = {}): Record<string, string> {
  const cookieHeader = request.headers.get('cookie') || ''
  const incomingAuth = request.headers.get('authorization')
  const tokenFromCookie = request.cookies.get('auth_token')?.value

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Cookie: cookieHeader,
    ...extra,
  }

  if (incomingAuth) {
    headers.Authorization = incomingAuth
  } else if (tokenFromCookie) {
    headers.Authorization = `Bearer ${tokenFromCookie}`
  }

  return headers
}
