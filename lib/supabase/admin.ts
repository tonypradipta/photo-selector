import { createClient } from '@supabase/supabase-js'

// This client uses the service role key and BYPASSES Row Level Security.
// ONLY import this file in server-side code (Server Components, API routes, Server Actions).
// NEVER import this in Client Components or expose the key to the browser.

import { sanitizeSupabaseUrl } from './client'

function createAdminClient() {
  const url = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export { createAdminClient }
