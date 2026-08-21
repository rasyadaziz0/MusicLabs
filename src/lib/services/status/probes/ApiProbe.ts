import { HealthProbe } from '../HealthProbe';

export class ApiProbe extends HealthProbe {
  readonly name = 'Core Backend API';
  readonly critical = true;

  protected async ping() {
    const base = process.env.NEXT_PUBLIC_MUSIC_API_URL
      || process.env.NEXT_PUBLIC_EXPRESS_API_URL;

    if (!base) return { ok: false, message: 'API URL not configured' };

    const res = await fetch(`${base}/health`, {
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    });

    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };

    const body = await res.json();
    return { ok: body.status === 'ok', message: body.status ?? 'unknown' };
  }
}
