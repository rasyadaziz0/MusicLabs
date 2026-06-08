'use client';

import { useEffect, useRef, useCallback } from 'react';

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

export function registerTimeGetter(fn: () => number) {
  getTimeFn = fn;
}
export function subscribeToTime(callback: TimeSubscriber): () => void {
  subscribers.add(callback);
  startLoop();
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) stopLoop();
  };
}

export function useHighPrecisionTime(callback: TimeSubscriber) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const wrappedSub: TimeSubscriber = (t) => callbackRef.current(t);
    return subscribeToTime(wrappedSub);
  }, []);
}
