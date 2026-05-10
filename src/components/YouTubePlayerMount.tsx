'use client';

import { useEffect } from 'react';

/**
 * Mounts the YouTube IFrame API container div directly into document.body
 * via useEffect, completely outside React's reconciler tree.
 *
 * WHY: YouTube IFrame API replaces `div#youtube-player-container` with an
 * `<iframe>` element it injects itself. If this div is rendered as JSX,
 * React tracks it in its virtual DOM. When React reconciles during page
 * navigation, it finds an `<iframe>` where it expected a `<div>` and
 * throws "Failed to execute 'insertBefore'/'removeChild' on 'Node'" errors.
 *
 * By creating and appending the div imperatively (not via JSX), React never
 * owns this node and won't try to reconcile or remove it — YouTube can mutate
 * it freely without causing DOM errors.
 */
export default function YouTubePlayerMount() {
  useEffect(() => {
    if (document.getElementById('youtube-player-container')) return;

    const container = document.createElement('div');
    container.id = 'youtube-player-container';
    container.style.cssText =
      'position:absolute;top:-9999px;left:-9999px;width:200px;height:200px;opacity:0.01;pointer-events:none;z-index:-50;';
    document.body.appendChild(container);
  }, []);

  return null;
}
