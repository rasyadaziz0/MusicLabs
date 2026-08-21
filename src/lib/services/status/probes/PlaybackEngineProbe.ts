import { HealthProbe } from '../HealthProbe';

export class PlaybackEngineProbe extends HealthProbe {
  readonly name = 'Playback Engine';
  readonly critical = true;

  protected async ping() {
    const res = await fetch('https://youtube.com', {
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    });
    // YouTube stream resolver relies on generic google video / youtube connectivity
    if (!res.ok && res.status !== 400 && res.status !== 403) return { ok: false, message: `HTTP ${res.status}` };
    return { ok: true, message: 'Connected' };
  }
}
