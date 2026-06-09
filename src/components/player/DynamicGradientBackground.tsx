'use client';

import React, { useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDominantColors, type DominantColors } from '@/hooks/useDominantColors';

// ── Static noise PNG (base64 data-URI) — 128×128 repeating tile ────────────
// Generated once, tiny footprint, no feTurbulence overhead
const NOISE_URI = (() => {
  if (typeof document === 'undefined') return '';
  try {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const imageData = ctx.createImageData(size, size);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const val = Math.random() * 255;
      imageData.data[i] = val;
      imageData.data[i + 1] = val;
      imageData.data[i + 2] = val;
      imageData.data[i + 3] = 12; // ~4.7% opacity in the texture itself
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
})();

// ── Blob positions for morphing animation ──────────────────────────────────
// Each blob has a start & end position, the CSS animation oscillates between them.
// Using transform: translate for compositor-friendly animation (GPU).

const BLOB_CONFIGS = [
  { // Top-left blob
    width: '120%', height: '120%',
    left: '-10%', top: '-10%',
    startPos: { x: '0%', y: '0%' },
    endPos: { x: '30%', y: '20%' },
    duration: 12,
  },
  { // Top-right blob
    width: '100%', height: '100%',
    left: '20%', top: '-20%',
    startPos: { x: '0%', y: '0%' },
    endPos: { x: '-30%', y: '30%' },
    duration: 16,
  },
  { // Bottom-left blob
    width: '130%', height: '130%',
    left: '-20%', top: '20%',
    startPos: { x: '0%', y: '0%' },
    endPos: { x: '40%', y: '-30%' },
    duration: 19,
  },
  { // Bottom-right / center blob
    width: '110%', height: '110%',
    left: '10%', top: '10%',
    startPos: { x: '0%', y: '0%' },
    endPos: { x: '-30%', y: '-20%' },
    duration: 14,
  },
];

// ── CSS Keyframes (generated once) ─────────────────────────────────────────

const blobKeyframes = BLOB_CONFIGS.map((cfg, i) => `
  @keyframes gradient-blob-morph-${i} {
    0%, 100% {
      transform: translate(${cfg.startPos.x}, ${cfg.startPos.y}) scale(1);
    }
    33% {
      transform: translate(${cfg.endPos.x}, ${cfg.startPos.y}) scale(1.15);
    }
    66% {
      transform: translate(${cfg.endPos.x}, ${cfg.endPos.y}) scale(0.85);
    }
  }
`).join('\n');

const reducedMotionOverride = `
  @media (prefers-reduced-motion: reduce) {
    .gradient-blob { animation: none !important; }
  }
`;

const gradientCSS = `
  ${blobKeyframes}
  ${reducedMotionOverride}
`;

// ── Gradient Layer (single set of 4 blobs) ─────────────────────────────────

interface GradientLayerProps {
  colors: DominantColors;
  layoutKey: string;
}

function GradientLayer({ colors, layoutKey }: GradientLayerProps) {
  return (
    <motion.div
      key={layoutKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        inset: '-20%', // Overflow to avoid edges showing during animation
        filter: 'blur(80px) saturate(1.6)',
        willChange: 'opacity',
      }}
    >
      {BLOB_CONFIGS.map((cfg, i) => (
        <div
          key={i}
          className="gradient-blob"
          style={{
            position: 'absolute',
            width: cfg.width,
            height: cfg.height,
            left: cfg.left,
            top: cfg.top,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.colors[i]} 0%, transparent 60%)`,
            animation: `gradient-blob-morph-${i} ${cfg.duration}s ease-in-out infinite`,
            willChange: 'transform',
          }}
        />
      ))}
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface DynamicGradientBackgroundProps {
  coverUrl: string | null | undefined;
  trackId: string | null | undefined;
  /** Extra className for the container */
  className?: string;
  /** Override CSS for the container */
  style?: React.CSSProperties;
}

export function DynamicGradientBackground({
  coverUrl,
  trackId,
  className,
  style,
}: DynamicGradientBackgroundProps) {
  const { current, previous } = useDominantColors(coverUrl, trackId);

  // Adaptive overlay: brighter artwork → darker overlay so white text stays readable
  const overlayOpacity = useMemo(() => {
    if (!current) return 0.4;
    // Luminance 0-1 → overlay 0.28 (dark art) to 0.55 (bright art)
    return 0.28 + current.luminance * 0.35;
  }, [current]);

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      <style>{gradientCSS}</style>

      {/* ── Base fill: solid opaque background to prevent transparency ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: current
            ? `linear-gradient(135deg, ${current.colors[3]} 0%, #0a0a14 100%)`
            : '#0a0a14',
          transition: 'background 1.2s ease',
        }}
      />

      {/* ── Gradient blob layers with cross-fade ── */}
      <AnimatePresence mode="popLayout">
        {current && (
          <GradientLayer
            colors={current}
            layoutKey={trackId ?? 'default'}
          />
        )}
      </AnimatePresence>

      {/* ── Black dim overlay (adaptive) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(0, 0, 0, ${overlayOpacity})`,
          transition: 'background 1s ease',
        }}
      />

      {/* ── Vignette gradient for depth ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* ── Static grain overlay ── */}
      {NOISE_URI && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${NOISE_URI})`,
            backgroundRepeat: 'repeat',
            opacity: 0.04, // ~4% — Apple-subtle
            pointerEvents: 'none',
            mixBlendMode: 'overlay',
          }}
        />
      )}
    </div>
  );
}

// ── Re-export hook results for consumers ───────────────────────────────────
export { useDominantColors };
export type { DominantColors };
