import { HealthProbe } from '../HealthProbe';

export class SupabaseProbe extends HealthProbe {
  readonly name = 'Database & Auth';
  readonly critical = true;

  protected async ping() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) return { ok: false, message: 'Supabase not configured' };

    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    });

    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
    return { ok: true, message: 'Connected' };
  }
}
