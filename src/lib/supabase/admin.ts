import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client using the **service role key**.
 *
 * ⚠️  This client bypasses RLS entirely — it must ONLY be used in
 *     server-side code (API routes, Server Components, cron jobs) and
 *     NEVER imported or bundled for the browser.
 *
 * The env var `SUPABASE_SERVICE_ROLE_KEY` is intentionally *not*
 * prefixed with `NEXT_PUBLIC_` so Next.js will never leak it to
 * the client bundle.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — ' +
        'cannot create admin Supabase client.'
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
