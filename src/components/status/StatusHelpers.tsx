import { ComponentResult, ComponentStatus } from '@/lib/services/StatusChecker';

// ── Helpers ──────────────────────────────────────────────────────

export function statusLabel(s: ComponentStatus): string {
  return { operational: 'Operational', degraded: 'Degraded', outage: 'Outage' }[s];
}

export function overallLabel(s: ComponentStatus): string {
  return {
    operational: 'All Systems Operational',
    degraded: 'Partial System Degradation',
    outage: 'System Outage Detected',
  }[s];
}

export function statusDotColor(s: ComponentStatus): string {
  return {
    operational: 'bg-emerald-400',
    degraded: 'bg-amber-400',
    outage: 'bg-red-500',
  }[s];
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Components ───────────────────────────────────────────────────

export function StatusDot({ status }: { status: ComponentStatus }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {status === 'operational' && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping" />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusDotColor(status)}`} />
    </span>
  );
}

export function ComponentRow({ component }: { component: ComponentResult }) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-white/10">
      <div className="flex items-center gap-4">
        <StatusDot status={component.status} />
        <span className="text-[17px] text-white font-medium">{component.name}</span>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-[14px] text-white/40 tabular-nums">
          {component.latencyMs}ms
        </span>
        <span className={`text-[15px] font-medium ${
          component.status === 'operational' ? 'text-emerald-400' :
          component.status === 'degraded' ? 'text-amber-400' :
          'text-red-400'
        }`}>
          {statusLabel(component.status)}
        </span>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-5 border-b border-white/10">
      <div className="flex items-center gap-4">
        <span className="h-3 w-3 rounded-full bg-white/10" />
        <span className="h-5 w-32 rounded bg-white/10 animate-pulse" />
      </div>
      <div className="flex items-center gap-5">
        <span className="h-4 w-12 rounded bg-white/10 animate-pulse" />
        <span className="h-5 w-24 rounded bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}
