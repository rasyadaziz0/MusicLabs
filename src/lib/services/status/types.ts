export type ComponentStatus = 'operational' | 'degraded' | 'outage';

export interface ComponentResult {
  name: string;
  status: ComponentStatus;
  latencyMs: number;
  message: string;
  critical: boolean;
}

export interface StatusReport {
  overall: ComponentStatus;
  timestamp: string;
  components: ComponentResult[];
}
