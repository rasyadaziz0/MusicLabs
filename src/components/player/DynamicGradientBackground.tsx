'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { useDominantColors, type DominantColors } from '@/hooks/useDominantColors';
import { WebGLFluidRenderer } from '@/lib/webgl/FluidRenderer';

interface DynamicGradientBackgroundProps {
  coverUrl: string | null | undefined;
  trackId: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
}

export function DynamicGradientBackground({
  coverUrl,
  trackId,
  className,
  style,
}: DynamicGradientBackgroundProps) {
  const { current } = useDominantColors(coverUrl, trackId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLFluidRenderer | null>(null);

  // Default colors if current is null
  const colors = useMemo(() => {
    if (current?.colors && current.colors.length >= 4) {
      return current.colors;
    }
    return ['#111111', '#222222', '#333333', '#444444'];
  }, [current]);

  const overlayOpacity = useMemo(() => {
    if (!current) return 0.4;
    return 0.28 + current.luminance * 0.35;
  }, [current]);

  // Init and Destroy renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Instantiate OOP Renderer
    rendererRef.current = new WebGLFluidRenderer(canvasRef.current);
    
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  // Update colors when they change
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateColors(colors);
    }
  }, [colors]);

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        background: '#0a0a14', // Base fallback
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          transition: 'opacity 1s ease',
          opacity: current ? 1 : 0
        }}
      />
      
      {/* Dim Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(0, 0, 0, ${overlayOpacity})`,
          transition: 'background 1s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export { useDominantColors };
export type { DominantColors };
