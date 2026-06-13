'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useRef, useState, useCallback } from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

// ── Geometry ────────────────────────────────────────────────────
const TRACK_W = 51;
const TRACK_H = 31;
const PAD = 2;

// Resting thumb (inside the track)
const THUMB = TRACK_H - PAD * 2; // 27
const X_OFF = PAD; // 2
const X_ON = TRACK_W - THUMB - PAD; // 22

// Expanded "glass lens" thumb (overflows the track — like the reference)
const LENS_W = 44;
const LENS_H = 38;
const LENS_TOP = (TRACK_H - LENS_H) / 2; // -3.5 → overflows top & bottom
const OVERHANG = 3; // how far the lens hangs past the track edge
const LX_OFF = -OVERHANG; // -3
const LX_ON = TRACK_W - LENS_W + OVERHANG; // 10

const DRAG_THRESHOLD = 4;
const SPRING = { type: 'spring' as const, stiffness: 420, damping: 30, mass: 0.9 };

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
}: ToggleSwitchProps) {
  const prefersReducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);
  const pointerStart = useRef<{ x: number; checked: boolean } | null>(null);
  const isDragging = useRef(false);
  const expanded = (pressed || dragX !== null) && !prefersReducedMotion;
  const w = expanded ? LENS_W : THUMB;
  const h = expanded ? LENS_H : THUMB;
  const top = expanded ? LENS_TOP : PAD;

  let x: number;
  if (dragX !== null) {
    x = Math.max(LX_OFF, Math.min(dragX, LX_ON)); // follow finger, clamped
  } else if (expanded) {
    x = checked ? LX_ON : LX_OFF; // anchored to current side while held
  } else {
    x = checked ? X_ON : X_OFF;
  }

  // Track color blends with thumb position during drag
  const dragProgress =
    dragX !== null ? (x - LX_OFF) / (LX_ON - LX_OFF) : checked ? 1 : 0;
  const isOnVisual = dragProgress > 0.5;

  // ── Pointer handlers ───────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      pointerStart.current = { x: e.clientX, checked };
      isDragging.current = false;
      setPressed(true);
    },
    [disabled, checked]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerStart.current || disabled) return;
      const dx = e.clientX - pointerStart.current.x;
      if (!isDragging.current && Math.abs(dx) < DRAG_THRESHOLD) return;
      isDragging.current = true;
      const base = pointerStart.current.checked ? LX_ON : LX_OFF;
      setDragX(base + dx);
    },
    [disabled]
  );

  const handlePointerUp = useCallback(() => {
    if (!pointerStart.current || disabled) return;
    if (isDragging.current && dragX !== null) {
      const mid = (LX_OFF + LX_ON) / 2;
      const clamped = Math.max(LX_OFF, Math.min(dragX, LX_ON));
      const next = clamped > mid;
      if (next !== checked) onChange(next);
    } else {
      onChange(!checked);
    }
    pointerStart.current = null;
    isDragging.current = false;
    setPressed(false);
    setDragX(null);
  }, [disabled, dragX, checked, onChange]);

  const handlePointerCancel = useCallback(() => {
    pointerStart.current = null;
    isDragging.current = false;
    setPressed(false);
    setDragX(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────
  const switchEl = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className="group relative shrink-0 touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ width: TRACK_W, height: TRACK_H }}
    >
      {/* ── Track ── */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          backdropFilter: 'blur(12px) saturate(150%)',
          WebkitBackdropFilter: 'blur(12px) saturate(150%)',
          border: '1.5px solid',
          borderColor: isOnVisual
            ? 'rgba(199, 52, 52, 0.5)'
            : 'rgba(120, 120, 128, 0.25)',
          boxShadow: isOnVisual
            ? 'inset 0 0 0 0.5px rgba(199,52,52,0.15)'
            : 'inset 0 0 0 0.5px rgba(0,0,0,0.06)',
        }}
      >
        {/* OFF state — iOS gray */}
        <div
          className="absolute inset-0 rounded-full transition-opacity duration-300"
          style={{
            background: 'rgba(120, 120, 128, 0.32)',
            opacity: isOnVisual ? 0 : 1,
          }}
        />
        {/* ON state — accent red */}
        <div
          className="absolute inset-0 rounded-full transition-opacity duration-300"
          style={{
            background: 'linear-gradient(135deg, #c73434ff 0%, #d13030ff 100%)',
            opacity: isOnVisual ? 1 : 0,
          }}
        />
        {/* Glass specular on top of track */}
        <div
          className="absolute top-0 left-0 right-0 h-[45%] rounded-t-full pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* ── Thumb — expands into a glass lens during transition ── */}
      <motion.div
        className="absolute rounded-full pointer-events-none overflow-hidden"
        animate={{
          x,
          width: w,
          height: h,
          top,
          // Lens lifts off the surface: deeper shadow + frostier glass
          boxShadow: expanded
            ? [
              '0 10px 24px rgba(0,0,0,0.28)',
              '0 4px 8px rgba(0,0,0,0.16)',
              'inset 0 0 0 1.5px rgba(255,255,255,0.7)',
              'inset 0 0 14px rgba(255,255,255,0.35)',
            ].join(', ')
            : [
              '0 4px 10px rgba(0,0,0,0.2)',
              '0 2px 4px rgba(0,0,0,0.1)',
              'inset 0 0 0 1.5px rgba(255,255,255,0.65)',
              'inset 0 0 8px rgba(255,255,255,0.3)',
            ].join(', '),
          background: expanded
            ? 'rgba(255, 255, 255, 0.28)'
            : '#FFFFFF',
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : dragX !== null
              ? {
                x: { type: 'spring', stiffness: 1200, damping: 60 }, // tight follow
                default: SPRING,
              }
              : SPRING
        }
        style={{
          backdropFilter: 'blur(10px) saturate(160%) brightness(1.08)',
          WebkitBackdropFilter: 'blur(10px) saturate(160%) brightness(1.08)',
        }}
      >
        {/* Top highlight streak */}
        <motion.div
          className="absolute left-[12%] right-[12%] rounded-full"
          animate={{
            top: expanded ? 4 : 2,
            height: expanded ? 7 : 5,
            opacity: expanded ? 1 : 0.85,
          }}
          transition={prefersReducedMotion ? { duration: 0 } : SPRING}
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 100%)',
          }}
        />
        {/* Bottom highlight streak */}
        <motion.div
          className="absolute left-[12%] right-[12%] rounded-full"
          animate={{
            bottom: expanded ? 4 : 2,
            height: expanded ? 7 : 5,
            opacity: expanded ? 1 : 0.85,
          }}
          transition={prefersReducedMotion ? { duration: 0 } : SPRING}
          style={{
            background:
              'linear-gradient(0deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 100%)',
          }}
        />
      </motion.div>
    </button>
  );

  // ── Optional settings-row wrapper ──────────────────────────────
  if (!label) return switchEl;

  return (
    <div className="flex items-center justify-between gap-4 w-full">
      <div className="min-w-0">
        <p className="text-[15px] text-white/90 leading-snug">{label}</p>
        {description && (
          <p className="text-[12px] text-white/40 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      {switchEl}
    </div>
  );
}