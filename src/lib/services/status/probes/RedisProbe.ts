import { HealthProbe } from '../HealthProbe';

export class RedisProbe extends HealthProbe {
  readonly name = 'Rate Limiter ';

  protected async ping() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) return { ok: false, message: 'Redis not configured' };

    const base = url.endsWith('/') ? url.slice(0, -1) : url;
    const res = await fetch(`${base}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    });

    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };

    const body = await res.json();
    const pong = body?.result === 'PONG';
    return { ok: pong, message: pong ? 'PONG' : 'Unexpected response' };
  }
}
