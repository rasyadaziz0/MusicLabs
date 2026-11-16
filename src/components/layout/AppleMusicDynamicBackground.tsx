'use client';

import React from 'react';
import { usePlaylistTheme } from '@/context/PlaylistThemeContext';

export function AppleMusicDynamicBackground() {
  const { state } = usePlaylistTheme();
  const { theme, isActive } = state;

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Base Tinted Solid Layer with ultra-smooth 700ms color transition */}
      <div
        className="absolute inset-0 transition-colors duration-700 ease-out"
        style={{
          backgroundColor: isActive && theme ? theme.baseBg : '#111115',
        }}
      />

      {/* Atmospheric Ambient Glows Layer radiating down across header and background */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-out pointer-events-none"
        style={{
          opacity: isActive && theme ? 1 : 0,
          backgroundImage: theme
            ? `
              radial-gradient(ellipse 95% 70% at 20% 0%, ${theme.glowPrimary} 0%, transparent 75%),
              radial-gradient(ellipse 80% 55% at 85% 5%, ${theme.glowSecondary} 0%, transparent 70%),
              radial-gradient(ellipse 60% 45% at 50% 20%, ${theme.glowSecondary} 0%, transparent 60%)
            `
            : 'none',
        }}
      />

      {/* Subtle organic texture to prevent color banding */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `radial-gradient(rgba(255,255,255,0.4) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}
