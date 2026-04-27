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
    // Check if already mounted (strict mode / hot reload guard)
    if (document.getElementById('youtube-player-container')) return;

    const container = document.createElement('div');
    container.id = 'youtube-player-container';
    container.style.cssText =
      'position:fixed;bottom:0;right:0;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-50;';
    document.body.appendChild(container);

    // No cleanup — we intentionally leave this node alive for the lifetime
    // of the app so the YouTube player persists across navigations.
  }, []);

  // Renders nothing into the React tree
  return null;
}
