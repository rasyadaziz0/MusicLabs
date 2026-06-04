'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * High-precision time source for karaoke rendering.
 *
 * Instead of relying on React state (50ms poll → setState → re-render),
 * this hook runs a requestAnimationFrame loop that reads `currentTime`
 * directly from the audio engine and calls subscribers at ~60fps.
 *
 * Subscribers update the DOM directly (no React re-render needed).
 */

type TimeSubscriber = (time: number) => void;

let subscribers: Set<TimeSubscriber> = new Set();
let rafId: number | null = null;
let getTimeFn: (() => number) | null = null;

function tick() {
  if (subscribers.size === 0) {
    rafId = null;
    return;
  }
  const t = getTimeFn ? getTimeFn() : 0;
  for (const sub of subscribers) {
    sub(t);
  }
  rafId = requestAnimationFrame(tick);
}

function startLoop() {
  if (rafId === null && subscribers.size > 0) {
    rafId = requestAnimationFrame(tick);
  }
}

function stopLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/**
 * Register a global time getter. Called once by the PlayerProvider.
 * The getter should return the current playback time in seconds
 * (reading directly from HTMLAudioElement.currentTime or YT player).
 */
export function registerTimeGetter(fn: () => number) {
  getTimeFn = fn;
}

/**
 * Subscribe to high-precision time updates (~60fps).
 * The callback receives the current time and should do direct DOM updates.
 * Returns an unsubscribe function.
 */
export function subscribeToTime(callback: TimeSubscriber): () => void {
  subscribers.add(callback);
  startLoop();
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) stopLoop();
  };
}

/**
 * React hook to subscribe a callback to the high-precision time loop.
 * The callback is called at ~60fps with the current playback time.
 * Use this for direct DOM manipulation (not React state).
 */
export function useHighPrecisionTime(callback: TimeSubscriber) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const wrappedSub: TimeSubscriber = (t) => callbackRef.current(t);
    return subscribeToTime(wrappedSub);
  }, []);
}
