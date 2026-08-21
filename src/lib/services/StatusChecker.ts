import { HealthProbe } from './status/HealthProbe';
import { ApiProbe } from './status/probes/ApiProbe';
import { SupabaseProbe } from './status/probes/SupabaseProbe';
import { RedisProbe } from './status/probes/RedisProbe';
import { YtMusicProbe } from './status/probes/YtMusicProbe';
import { PlaybackEngineProbe } from './status/probes/PlaybackEngineProbe';
import { StorageProbe } from './status/probes/StorageProbe';
import { AudDProbe } from './status/probes/AudDProbe';
import { SpotifyProbe } from './status/probes/SpotifyProbe';
import { GeminiProbe } from './status/probes/GeminiProbe';
import { StatusReport, ComponentResult, ComponentStatus } from './status/types';

export type { ComponentStatus, ComponentResult, StatusReport };

let cachedReport: StatusReport | null = null;
let cacheExpiry: number = 0;
let inflightRun: Promise<StatusReport> | null = null;

export class StatusChecker {
  private probes: HealthProbe[];

  constructor() {
    this.probes = [
      new ApiProbe(),
      new SupabaseProbe(),
      new RedisProbe(),
      new YtMusicProbe(),
      new PlaybackEngineProbe(),
      new StorageProbe(),
      new AudDProbe(),
      new SpotifyProbe(),
      new GeminiProbe(),
    ];
  }

  async run(): Promise<StatusReport> {
    if (cachedReport && Date.now() < cacheExpiry) {
      return cachedReport;
    }

    if (inflightRun) {
      return inflightRun;
    }

    inflightRun = (async () => {
      try {
        const components = await Promise.all(
          this.probes.map(probe => probe.check()),
        );

        const overall = this.deriveOverall(components);

        cachedReport = {
          overall,
          timestamp: new Date().toISOString(),
          components,
        };
        // Cache for 60 seconds per instance
        cacheExpiry = Date.now() + 60_000;
        return cachedReport;
      } finally {
        inflightRun = null;
      }
    })();

    return inflightRun;
  }

  /** Worst-wins, but strictly isolated by criticality */
  private deriveOverall(results: ComponentResult[]): ComponentStatus {
    const outages = results.filter(r => r.status === 'outage');
    
    // If any critical component is an outage, it's a systemic outage
    if (outages.some(r => r.critical)) return 'outage';
    
    // Otherwise, if there are ANY non-critical outages or degraded states, the system is degraded
    if (outages.length > 0 || results.some(r => r.status === 'degraded')) return 'degraded';
    
    return 'operational';
  }
}
