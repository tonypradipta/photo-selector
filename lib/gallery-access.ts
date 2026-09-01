// Server-only utility for managing HttpOnly gallery access cookies
// Never import this in Client Components

import { NextRequest } from 'next/server'
import { createHmac } from 'crypto'

export const GALLERY_COOKIE_MAX_AGE = 60 * 60 * 8 // 8 hours

export function GALLERY_COOKIE_NAME(token: string): string {
  return `gallery_access_${token}`
}

function getSecret(): string {
  const secret = process.env.GALLERY_ACCESS_SECRET
  if (!secret) throw new Error('GALLERY_ACCESS_SECRET is not set')
  return secret
}

/**
 * Sign a gallery token value for the cookie.
 * Produces: base64(token):base64(hmac)
 */
export async function signGalleryToken(token: string): Promise<string> {
  const secret = getSecret()
  const hmac = createHmac('sha256', secret).update(token).digest('base64url')
  return `${Buffer.from(token).toString('base64url')}:${hmac}`
}

/**
 * Verify the gallery access cookie for a given token.
 * Returns true only if the cookie value was signed with our secret
 * and matches exactly this gallery token (not any other token).
 */
export async function verifyGalleryAccess(
  request: NextRequest,
  token: string
): Promise<boolean> {
  try {
    const cookieName = GALLERY_COOKIE_NAME(token)
    const cookieValue = request.cookies.get(cookieName)?.value
    if (!cookieValue) return false

    const parts = cookieValue.split(':')
    if (parts.length !== 2) return false

    const [encodedToken, providedHmac] = parts
    const decodedToken = Buffer.from(encodedToken, 'base64url').toString('utf8')

    // Must match this specific token
    if (decodedToken !== token) return false

    // Verify HMAC
    const secret = getSecret()
    const expectedHmac = createHmac('sha256', secret).update(token).digest('base64url')

    // Constant-time comparison
    if (providedHmac.length !== expectedHmac.length) return false
    let diff = 0
    for (let i = 0; i < providedHmac.length; i++) {
      diff |= providedHmac.charCodeAt(i) ^ expectedHmac.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}
