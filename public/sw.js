self.addEventListener('install', () => {
  // Let new service worker enter waiting state rather than forcibly evicting active worker
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Bypass Service Worker untuk request lintas origin (seperti API Supabase, YouTube, dll)
  // serta route internal Vercel, API, dan range requests (audio streaming)
  if (
    url.origin !== self.location.origin || 
    url.pathname.startsWith('/_vercel') ||
    url.pathname.startsWith('/api/') ||
    event.request.headers.has('range')
  ) {
    return;
  }

  // Response validation & network error handling
  event.respondWith(
    fetch(event.request).catch((err) => {
      console.warn('[SW] Network fetch failed:', err);
      return new Response('Network error occurred', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' },
      });
    })
  );
});
