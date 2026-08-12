self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Bypass Service Worker untuk request lintas origin (seperti API Supabase, YouTube, dll)
  // Ini menghindari error CORS: "The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*'"
  if (url.origin !== self.location.origin || url.pathname.startsWith('/_vercel')) {
    return;
  }

  // Basic fetch handler untuk asset lokal
  event.respondWith(fetch(event.request));
});
