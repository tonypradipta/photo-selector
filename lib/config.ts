/**
 * Runtime configuration shared by browser and Next.js server code.
 *
 * NEXT_PUBLIC_API_URL may override the default Laravel API origin.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim()

  // The production API is public configuration, not a secret.
  // Keep the environment variable override for other deployments.
  const baseUrl =
    raw ||
    (process.env.NODE_ENV === 'production'
      ? 'https://api.photoselector.online'
      : 'http://localhost:8000')

  return baseUrl.replace(/\/+$/, '')
}
