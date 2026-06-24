'use client';

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.debug('ServiceWorker registration successful with scope: ', registration.scope);
          },
          (err) => {
            console.warn('ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, []);

  return null;
}
