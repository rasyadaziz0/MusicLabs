'use client';

import React from 'react';
import { Laptop, Smartphone, Tablet, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeviceInfo } from '@/types/connect';

export interface DeviceRowProps {
  device: DeviceInfo;
  isActive: boolean;
  isMe: boolean;
  onSelect: () => void;
}

export function DeviceRow({ device, isActive, isMe, onSelect }: DeviceRowProps) {
  const getIcon = (type: string, active: boolean) => {
    const className = cn("w-5 h-5", active ? "text-[#1db954]" : "text-white/70");
    if (type === 'mobile') return <Smartphone className={className} />;
    if (type === 'tablet') return <Tablet className={className} />;
    return <Laptop className={className} />;
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer border mb-2",
        isActive
          ? "bg-[#1db954]/15 border-[#1db954]/40 shadow-[0_0_20px_rgba(29,185,84,0.15)]"
          : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/15"
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0",
          isActive ? "bg-[#1db954]/20" : "bg-white/5 group-hover:bg-white/10"
        )}>
          {getIcon(device.deviceType, isActive)}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-bold truncate", isActive ? "text-[#1db954]" : "text-white")}>
              {device.label}
            </span>
            {isMe && (
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-white/10 text-white/70 flex-shrink-0">
                Ini
              </span>
            )}
          </div>
          <span className="text-xs text-white/50 truncate">
            {isActive ? 'Memutar audio di sini' : 'Klik untuk memindahkan'}
          </span>
        </div>
      </div>

      {/* Active Indicator / Equalizer */}
      {isActive && (
        <div className="flex items-end gap-1 px-2 h-4 flex-shrink-0">
          <span className="w-1 bg-[#1db954] rounded-full animate-[bounce_0.8s_infinite_100ms] h-full" />
          <span className="w-1 bg-[#1db954] rounded-full animate-[bounce_0.8s_infinite_300ms] h-2/3" />
          <span className="w-1 bg-[#1db954] rounded-full animate-[bounce_0.8s_infinite_200ms] h-4/5" />
        </div>
      )}

      {!isActive && (
        <Volume2 className="w-4 h-4 text-white/30 group-hover:text-white transition-colors flex-shrink-0 mr-1" />
      )}
    </div>
  );
}
