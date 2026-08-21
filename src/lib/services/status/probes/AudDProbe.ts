import { HealthProbe } from '../HealthProbe';

export class AudDProbe extends HealthProbe {
  readonly name = 'Audio Recognition API';

  protected async ping() {
    const res = await fetch('https://api.audd.io', {
      method: 'GET',
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    });
    // Even without token, API responds with a JSON error (status 200 or 4xx), indicating it's online
    if (res.status >= 500) return { ok: false, message: `HTTP ${res.status}` };
    return { ok: true, message: 'Connected' };
  }
}
