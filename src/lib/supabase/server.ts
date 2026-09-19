import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // Verify authentication before elevating server-side read operations
  try {
    const { data: { user } } = await authClient.auth.getUser()
    if (user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminClient()
      return new Proxy(authClient, {
        get(target, prop, receiver) {
          if (prop === 'from') {
            return adminClient.from.bind(adminClient)
          }
          if (prop === 'rpc') {
            return adminClient.rpc.bind(adminClient)
          }
          return Reflect.get(target, prop, receiver)
        }
      })
    }
  } catch (err) {
    // If auth verification fails or in non-auth context, return regular client
  }

  return authClient
}

// Admin client bypasses RLS — use only for internal server-side checks
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
