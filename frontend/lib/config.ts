/**
 * Runtime configuration shared by browser and Next.js server code.
 *
 * NEXT_PUBLIC_API_URL must point to the Laravel API origin, for example:
 * https://api.example.com
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim()

  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'NEXT_PUBLIC_API_URL is required in production. Set it to your Laravel API origin.'
      )
    }

    return 'http://localhost:8000'
  }

  return raw.replace(/\/+$/, '')
}
