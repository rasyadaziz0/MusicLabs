import { HealthProbe } from '../HealthProbe';

export class YtMusicProbe extends HealthProbe {
  readonly name = 'Music Metadata API';

  protected async ping() {
    const res = await fetch('https://music.youtube.com', {
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    });
    if (!res.ok && res.status !== 400 && res.status !== 403) return { ok: false, message: `HTTP ${res.status}` };
    return { ok: true, message: 'Connected' };
  }
}
