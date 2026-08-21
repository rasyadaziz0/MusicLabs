import { HealthProbe } from '../HealthProbe';

export class GeminiProbe extends HealthProbe {
  readonly name = 'AI Engine (Gemini)';

  protected async ping() {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    });
    // Unauthenticated request returns 403, which proves the API is up
    if (res.status === 403 || res.status === 400) return { ok: true, message: 'Connected' };
    if (res.status >= 500) return { ok: false, message: `HTTP ${res.status}` };
    return { ok: true, message: 'Connected' };
  }
}
