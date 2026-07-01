'use client';

import React from 'react';
import { MonitorSpeaker, X } from 'lucide-react';

export interface DeviceSidebarHeaderProps {
  onClose: () => void;
}

export function DeviceSidebarHeader({ onClose }: DeviceSidebarHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 18px 14px',
      borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <MonitorSpeaker className="w-5 h-5 text-[#1db954]" />
        <span style={{
          fontSize: '17px',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '-0.3px',
        }}>
          Perangkat Terhubung
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          style={{ background: 'none', border: 'none', padding: '4px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          title="Tutup sidebar"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
