'use client';

import React from 'react';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { Headphones, Smartphone, Laptop, Tablet, Check, AudioLines } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileAirPlayPopupProps {
  onClose: () => void;
}

export function MobileAirPlayPopup({ onClose }: MobileAirPlayPopupProps) {
  const {
    currentTrack,
    activeTabId,
    connectedDevices,
    isElecting,
    transferPlayback,
  } = (usePlayer() as any);

  const coverUrl = currentTrack?.image?.find((i: any) => i.quality === '150x150')?.url || currentTrack?.image?.[0]?.url;
  const artistNames = currentTrack?.artists?.primary?.map((a: any) => a.name).join(', ') || '';

  const getDeviceIcon = (type: string, label: string, isActive: boolean) => {
    const l = (label || '').toLowerCase();
    const cls = `w-5 h-5 flex-shrink-0 ${isActive ? 'text-black' : 'text-white/80'}`;
    if (l.includes('airpod') || l.includes('headphone') || l.includes('ear') || l.includes('buds')) {
      return <Headphones className={cls} />;
    }
    if (type === 'desktop' || l.includes('macbook') || l.includes('pc') || l.includes('laptop')) {
      return <Laptop className={cls} />;
    }
    if (type === 'tablet' || l.includes('ipad') || l.includes('tab')) {
      return <Tablet className={cls} />;
    }
    return <Smartphone className={cls} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 14 }}
      transition={{ type: 'spring', damping: 26, stiffness: 360 }}
      className="w-full rounded-[36px] p-5 bg-[#18261e]/95 text-white overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Track Info Header (Exact Apple Music iOS AirPlay) */}
      <div className="flex items-center justify-between mb-5 px-1 pt-1">
        <div className="flex items-center gap-3.5 min-w-0 pr-2">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 shadow-md">
            {coverUrl && (
              <Image src={coverUrl} alt={currentTrack?.name || 'Art'} fill sizes="100px" className="object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[16px] truncate text-white tracking-tight leading-snug">
              {currentTrack?.name || 'Now Playing'}
            </div>
            <div className="text-[14px] text-white/70 truncate mt-0.5 font-medium tracking-tight">
              {artistNames || 'Artist'}
            </div>
          </div>
        </div>

        {/* Animated Grey Waveform Icon */}
        <div className="flex items-center justify-center pr-2 text-white/50 flex-shrink-0">
          <AudioLines className="w-5 h-5 animate-pulse" />
        </div>
      </div>

      {/* Devices List */}
      <div className="flex flex-col gap-3">
        {(!connectedDevices || connectedDevices.length === 0) ? (
          <div className="p-4 text-center text-white/50 text-sm font-medium">
            Mencari perangkat audio...
          </div>
        ) : (
          connectedDevices.map((device: any) => {
            const isActive = device.tabInstanceId === activeTabId;
            return (
              <button
                key={device.tabInstanceId}
                onClick={() => transferPlayback(device.tabInstanceId)}
                disabled={isElecting}
                className="w-full text-left transition-transform active:scale-[0.98] outline-none"
              >
                {isActive ? (
                  /* Active Split Pill Apple Music Style */
                  <div className="w-full h-14 rounded-full flex items-stretch overflow-hidden shadow-lg border border-white/10">
                    <div className="flex-1 bg-white text-black flex items-center gap-3 px-5 font-semibold min-w-0">
                      {getDeviceIcon(device.deviceType, device.label, true)}
                      <span className="truncate text-[15px] tracking-tight">{device.label}</span>
                    </div>
                    <div className="w-24 bg-[#8ea496] flex items-center justify-center text-black flex-shrink-0">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                  </div>
                ) : (
                  /* Inactive Pill Apple Music Style */
                  <div className="w-full h-14 rounded-full bg-white/15 flex items-center gap-3.5 px-5 text-white/90 hover:bg-white/20 transition-colors border border-transparent">
                    <div className="text-white/80">
                      {getDeviceIcon(device.deviceType, device.label, false)}
                    </div>
                    <span className="truncate text-[15px] font-medium tracking-tight flex-1">{device.label}</span>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
