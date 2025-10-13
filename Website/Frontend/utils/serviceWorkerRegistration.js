/**
 * Service Worker Registration Utility
 * 
 * Handles registration and updates of the service worker
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Check if the browser supports service workers
    window.addEventListener('load', () => {
      // Register the service worker
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('[Service Worker] Registered with scope:', registration.scope);
          
          // Handle updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New update available
                    console.log('[Service Worker] New content is available; please refresh.');
                  } else {
                    // Content is cached for offline use
                    console.log('[Service Worker] Content is cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.error('[Service Worker] Registration failed:', error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[Service Worker] Unregistration failed:', error);
      });
  }
}

// Check if service worker is supported and register it
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Only register in production environment
  if (process.env.NODE_ENV === 'production') {
    registerServiceWorker();
  }
}