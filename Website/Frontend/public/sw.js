// Placeholder service worker for development
// This file prevents 404 errors when the browser tries to fetch /sw.js
// The actual service worker is only registered in production

self.addEventListener('install', (event) => {
  console.log('[SW] Development placeholder installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Development placeholder activated');
  event.waitUntil(clients.claim());
});

// Fetch handler with CSP error handling
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch((error) => {
        // If fetch fails due to CSP or network error
        console.warn('[SW] Fetch failed, returning fallback:', event.request.url);
        
        // For image requests, return a transparent 1x1 pixel
        if (event.request.destination === 'image') {
          return new Response(
            // 1x1 transparent PNG
            new Uint8Array([
              0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
              0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
              0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
              0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
              0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
              0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
              0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
              0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae
            ]),
            { 
              status: 200,
              statusText: 'OK',
              headers: { 'Content-Type': 'image/png' }
            }
          );
        }
        
        // For other requests, return network error
        return new Response('Network error', {
          status: 408,
          statusText: 'Request Timeout'
        });
      })
  );
});
