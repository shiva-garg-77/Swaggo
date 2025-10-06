// SwagGo Chat Service Worker - Enhanced Version with Error Fixes
// Handles push notifications, offline messaging, background sync, and advanced caching

const CACHE_NAME = 'swaggo-chat-v1';
const OFFLINE_QUEUE_NAME = 'swaggo-offline-messages';
const API_BASE_URL = 'http://localhost:45799';

// Cache important resources
const CACHE_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/default-avatar.png',
  '/favicon.ico',
  '/logo_light.png',
  '/Logo_dark1.png',
  '/icons/message-badge.png',
  '/icons/call-badge.png',
  '/icons/notification-icon-192.png',
  '/icons/reply.png',
  '/icons/check.png',
  '/icons/phone-answer.png',
  '/icons/phone-decline.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing');
  
  // Skip waiting and immediately activate
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker caching files');
        // Don't fail if some resources are not available
        return cache.addAll(CACHE_RESOURCES.filter(url => url)).catch(error => {
          console.warn('Some resources failed to cache:', error);
          return Promise.resolve();
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
  
  console.log('Service Worker activated and ready');
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle favicon requests specially
  if (url.pathname === '/favicon.ico') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If favicon request succeeds, return it
          if (response.ok) {
            return response;
          }
          // If favicon fails, return a 404 response
          return new Response('Not Found', {
            status: 404,
            statusText: 'Not Found'
          });
        })
        .catch(() => {
          // Return 404 response for favicon if offline
          return new Response('Not Found', {
            status: 404,
            statusText: 'Not Found'
          });
        })
    );
    return;
  }
  
  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(fetchResponse => {
            // Don't cache non-GET requests or responses that aren't ok
            if (event.request.method !== 'GET' || !fetchResponse.ok) {
              return fetchResponse;
            }
            
            // Cache the response for next time
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            
            return fetchResponse;
          });
      })
      .catch(() => {
        // If both cache and network fail, show offline page for documents
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
        // For other resources, return a generic error response
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
  console.log('Push event received:', event);
  
  let data = {};
  let title = 'SwagGo Chat';
  
  if (event.data) {
    try {
      data = event.data.json();
      title = data.title || title;
    } catch (error) {
      console.warn('Failed to parse push data, using defaults:', error);
      data = {
        body: event.data.text() || 'New notification'
      };
    }
  } else {
    data = {
      body: 'You have a new notification'
    };
  }
  
  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/default-avatar.svg',
    badge: '/icons/badge.png',
    tag: data.tag || 'swaggo-notification',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [200, 100, 200],
    timestamp: Date.now(),
    renotify: true,
    silent: false
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('Notification shown successfully');
      })
      .catch(error => {
        console.error('Failed to show notification:', error);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data;
  const action = event.action;
  
  // Handle notification actions
  if (action === 'reply') {
    // Open chat in reply mode
    event.waitUntil(
      clients.openWindow(`/message?chatId=${data.chatId}&reply=${data.messageId}`)
    );
  } else if (action === 'mark_read') {
    // Mark message as read (send to backend)
    event.waitUntil(
      fetch(`${API_BASE_URL}/api/mark-message-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: data.messageId,
          chatId: data.chatId
        })
      }).catch(error => console.error('Failed to mark as read:', error))
    );
  } else if (action === 'answer') {
    // Answer call
    event.waitUntil(
      clients.openWindow(`/message?chatId=${data.chatId}&call=answer&callId=${data.callId}`)
    );
  } else if (action === 'decline') {
    // Decline call (send to backend)
    event.waitUntil(
      fetch(`${API_BASE_URL}/api/decline-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId: data.callId,
          chatId: data.chatId
        })
      }).catch(error => console.error('Failed to decline call:', error))
    );
  } else if (action === 'call_back') {
    // Call back
    event.waitUntil(
      clients.openWindow(`/message?chatId=${data.chatId}&call=initiate&type=${data.callType}&target=${data.callerId}`)
    );
  } else {
    // Default action - open the relevant page
    const url = data.url || `/message?chatId=${data.chatId || ''}`;
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes('/message') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Background sync for offline messages
self.addEventListener('sync', event => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'offline-messages') {
    event.waitUntil(
      sendOfflineMessages()
    );
  }
});

// Enhanced offline message handling with IndexedDB
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SwagGoChatDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('offlineMessages')) {
        const store = db.createObjectStore('offlineMessages', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function sendOfflineMessages() {
  try {
    const offlineMessages = await getOfflineMessages();
    
    if (offlineMessages.length === 0) {
      return;
    }
    
    console.log(`Sending ${offlineMessages.length} offline messages`);
    
    for (const message of offlineMessages) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/send-offline-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          await removeOfflineMessage(message.id);
          console.log('Offline message sent successfully');
        } else {
          console.error('Failed to send offline message:', response.statusText);
        }
      } catch (error) {
        console.error('Error sending offline message:', error);
      }
    }
  } catch (error) {
    console.error('Error in sendOfflineMessages:', error);
  }
}

async function getOfflineMessages() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['offlineMessages'], 'readonly');
    const store = transaction.objectStore('offlineMessages');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get offline messages:', error);
    return [];
  }
}

async function removeOfflineMessage(messageId) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['offlineMessages'], 'readwrite');
    const store = transaction.objectStore('offlineMessages');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(messageId);
      request.onsuccess = () => {
        console.log('Removing offline message:', messageId);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to remove offline message:', error);
  }
}

async function queueOfflineMessage(message) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['offlineMessages'], 'readwrite');
    const store = transaction.objectStore('offlineMessages');
    
    const messageWithId = {
      ...message,
      id: message.id || Date.now().toString(),
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(messageWithId);
      request.onsuccess = () => {
        console.log('Queueing offline message:', messageWithId);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to queue offline message:', error);
  }
}

// Message event for communication with main thread
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'GET_VERSION':
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ version: CACHE_NAME });
        }
        break;
        
      case 'QUEUE_OFFLINE_MESSAGE':
        if (event.data.message) {
          queueOfflineMessage(event.data.message).then(() => {
            // Register for background sync
            if ('sync' in self.registration) {
              self.registration.sync.register('offline-messages')
                .then(() => console.log('Background sync registered'))
                .catch(error => console.error('Background sync registration failed:', error));
            }
          });
        }
        break;
        
      case 'CLEAR_CACHE':
        caches.delete(CACHE_NAME).then(() => {
          console.log('Cache cleared');
        });
        break;
        
      default:
        console.log('Unknown message type:', event.data.type);
    }
  }
});

// Periodic cleanup of old offline messages
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cleanup-offline-messages') {
    event.waitUntil(cleanupOldOfflineMessages());
  }
});

async function cleanupOldOfflineMessages() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['offlineMessages'], 'readwrite');
    const store = transaction.objectStore('offlineMessages');
    const index = store.index('timestamp');
    
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    const range = IDBKeyRange.upperBound(cutoffTime);
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log('Old offline messages cleaned up');
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to cleanup old offline messages:', error);
  }
}

// Enhanced error handling
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Enhanced Service Worker loaded successfully');