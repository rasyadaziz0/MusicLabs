import React from 'react';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { LiquidGlassCard } from '@/components/ui/LiquidGlass';

export function SettingsCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-8 ${className}`}>
      <LiquidGlassCard borderRadius="24px" blurIntensity="lg" shadowIntensity="sm" glowIntensity="none">
        <div className="z-30 relative">
          {children}
        </div>
      </LiquidGlassCard>
    </div>
  );
}

export function SettingsRow({
  label,
  icon,
  children,
  hasBorder = false,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  hasBorder?: boolean;
}) {
  return (
    <div className={`px-4 py-3.5 ${hasBorder ? 'border-t border-white/[0.04]' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[13px] font-semibold text-white/60">{label}</span>
      </div>
      {children}
    </div>
  );
}

export function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-[13px] font-semibold text-white/40 uppercase tracking-wider px-1 mb-2.5">{title}</h2>
  );
}

export function ToggleRow({
  label,
  description,
  icon,
  checked,
  onChange,
  hasBorder = false,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  hasBorder?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-4 py-3.5 ${hasBorder ? 'border-t border-white/[0.04]' : ''}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon}
        <div className="min-w-0">
          <span className="text-[14px] text-white/90 font-medium">{label}</span>
          {description && (
            <p className="text-[12px] text-white/40 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className="ml-4 shrink-0">
        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}
