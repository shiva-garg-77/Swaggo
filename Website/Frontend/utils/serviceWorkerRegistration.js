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
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
            .then((success) => {
              if (success) {
                console.log('[Service Worker] Unregistered successfully');
              } else {
                console.warn('[Service Worker] Unregistration failed');
              }
            })
            .catch((error) => {
              console.error('[Service Worker] Unregistration error:', error);
            });
        });
      })
      .catch((error) => {
        console.error('[Service Worker] Failed to get registrations:', error);
      });
  }
}

// ✅ FIX: REMOVED AUTO-EXECUTION - This was causing infinite recompilations!
// Service worker registration is now handled ONLY in ClientProviders.js
// This file now only exports the functions, doesn't auto-execute them
