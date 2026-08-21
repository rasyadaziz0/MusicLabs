import { HealthProbe } from '../HealthProbe';

export class SpotifyProbe extends HealthProbe {
  readonly name = 'Spotify Integrations';

  protected async ping() {
    const res = await fetch('https://api.spotify.com/v1', {
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    });
    // Unauthenticated request to Spotify returns 401, which proves the API is up
    if (res.status === 401) return { ok: true, message: 'Connected' };
    if (res.status >= 500) return { ok: false, message: `HTTP ${res.status}` };
    return { ok: true, message: 'Connected' };
  }
}
