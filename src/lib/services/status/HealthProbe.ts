import { ComponentResult } from './types';

export abstract class HealthProbe {
  abstract readonly name: string;
  readonly critical: boolean = false;

  /** Subclasses implement the actual ping logic here. */
  protected abstract ping(): Promise<{ ok: boolean; message: string }>;

  async check(): Promise<ComponentResult> {
    const start = performance.now();
    try {
      const { ok, message } = await this.ping();
      const latencyMs = Math.round(performance.now() - start);

      return {
        name: this.name,
        status: ok ? 'operational' : 'degraded',
        latencyMs,
        message,
        critical: this.critical,
      };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      const msg = err instanceof Error ? err.message : 'Unknown error';

      return {
        name: this.name,
        status: 'outage',
        latencyMs,
        message: msg,
        critical: this.critical,
      };
    }
  }
}
