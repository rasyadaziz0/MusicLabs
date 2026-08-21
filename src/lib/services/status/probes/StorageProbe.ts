import { HealthProbe } from '../HealthProbe';

export class StorageProbe extends HealthProbe {
  readonly name = 'Cloud Storage ';

  protected async ping() {
    const url = process.env.NEXT_PUBLIC_R2_DEV_URL;
    if (!url) return { ok: false, message: 'R2 URL not configured' };

    // Just testing DNS and reachability of the Cloudflare worker/bucket
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    }).catch(() => null);

    if (!res) {
      return { ok: false, message: 'Unreachable' };
    }

    const isUp = res.status < 500;

    return {
      ok: isUp,
      message: isUp ? 'Connected' : `HTTP ${res.status}`
    };
  }
}
