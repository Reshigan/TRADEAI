/**
 * Service Worker for TRADEAI PWA
 * Handles caching, offline functionality, background sync, and push notifications
 */

const CACHE_NAME = 'tradeai-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/static/css/main.css',
  '/static/js/main.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints that should be cached
const API_CACHE_URLS = [
  '/api/user/profile',
  '/api/dashboard/summary',
  '/api/settings'
];

// Runtime caching strategies
const CACHE_STRATEGIES = {
  'cache-first': /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ico)$/,
  'network-first': /\/api\//,
  'stale-while-revalidate': /\/(dashboard|profile|settings|analytics)/
};

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    (async () => {
      try {
        // Open cache
        const cache = await caches.open(CACHE_NAME);
        
        // Cache static assets
        await cache.addAll(STATIC_CACHE_URLS);
        
        // Cache API endpoints
        for (const url of API_CACHE_URLS) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (error) {
            console.warn(`Failed to cache ${url}:`, error);
          }
        }
        
        console.log('Service Worker installed and assets cached');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('Service Worker installation failed:', error);
      }
    })()
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('tradeai-') && name !== CACHE_NAME
        );
        
        await Promise.all(
          oldCaches.map(cacheName => caches.delete(cacheName))
        );
        
        // Claim all clients
        await self.clients.claim();
        
        console.log('Service Worker activated and old caches cleaned');
        
        // Notify clients about activation
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            payload: { cacheName: CACHE_NAME }
          });
        });
      } catch (error) {
        console.error('Service Worker activation failed:', error);
      }
    })()
  );
});

/**
 * Fetch Event Handler
 */
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(handleFetch(event.request));
});

/**
 * Handle fetch requests with appropriate caching strategy
 */
async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Determine caching strategy
    const strategy = getCachingStrategy(request);
    
    switch (strategy) {
      case 'cache-first':
        return await cacheFirst(request);
      case 'network-first':
        return await networkFirst(request);
      case 'stale-while-revalidate':
        return await staleWhileRevalidate(request);
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('Fetch failed:', error);
    return await handleFetchError(request, error);
  }
}

/**
 * Determine caching strategy for request
 */
function getCachingStrategy(request) {
  const url = request.url;
  
  for (const [strategy, pattern] of Object.entries(CACHE_STRATEGIES)) {
    if (pattern.test(url)) {
      return strategy;
    }
  }
  
  return 'network-first';
}

/**
 * Cache First Strategy
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline fallback if available
    return await getOfflineFallback(request);
  }
}

/**
 * Network First Strategy
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    return await getOfflineFallback(request);
  }
}

/**
 * Stale While Revalidate Strategy
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const networkResponsePromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      
      // Notify clients about cache update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'CACHE_UPDATED',
          payload: { url: request.url }
        });
      });
    }
    return networkResponse;
  }).catch(error => {
    console.warn('Background fetch failed:', error);
    return null;
  });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Wait for network response if no cache
  try {
    const networkResponse = await networkResponsePromise;
    if (networkResponse && networkResponse.ok) {
      return networkResponse;
    }
  } catch (error) {
    console.error('Network response failed:', error);
  }
  
  // Return offline fallback
  return await getOfflineFallback(request);
}

/**
 * Handle fetch errors
 */
async function handleFetchError(request, error) {
  console.error('Fetch error for', request.url, ':', error);
  
  // Try to get from cache
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return offline fallback
  return await getOfflineFallback(request);
}

/**
 * Get offline fallback response
 */
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For navigation requests, return offline page
  if (request.mode === 'navigate') {
    const cache = await caches.open(CACHE_NAME);
    const offlineResponse = await cache.match(OFFLINE_URL);
    
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - TRADEAI</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              text-align: center; 
              padding: 50px; 
              background: #f5f5f5;
            }
            .offline-container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .offline-icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 { color: #333; margin-bottom: 10px; }
            p { color: #666; line-height: 1.5; }
            .retry-button {
              background: #007bff;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 4px;
              cursor: pointer;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1>You're Offline</h1>
            <p>It looks like you're not connected to the internet. Check your connection and try again.</p>
            <button class="retry-button" onclick="window.location.reload()">
              Try Again
            </button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // For API requests, return JSON error
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This request requires an internet connection'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // For other requests, return generic error
  return new Response('Offline', { status: 503 });
}

/**
 * Background Sync Handler
 */
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'background-sync':
      event.waitUntil(handleBackgroundSync());
      break;
    case 'data-sync':
      event.waitUntil(handleDataSync());
      break;
    case 'offline-actions':
      event.waitUntil(handleOfflineActions());
      break;
    default:
      console.warn('Unknown sync tag:', event.tag);
  }
});

/**
 * Handle background sync
 */
async function handleBackgroundSync() {
  try {
    console.log('Performing background sync...');
    
    // Sync critical data
    await syncCriticalData();
    
    // Update cache
    await updateCache();
    
    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        payload: { tag: 'background-sync', success: true }
      });
    });
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

/**
 * Handle data sync
 */
async function handleDataSync() {
  try {
    console.log('Performing data sync...');
    
    // Sync user data
    await syncUserData();
    
    // Sync settings
    await syncSettings();
    
    console.log('Data sync completed');
  } catch (error) {
    console.error('Data sync failed:', error);
  }
}

/**
 * Handle offline actions
 */
async function handleOfflineActions() {
  try {
    console.log('Processing offline actions...');
    
    // Get offline queue from IndexedDB or localStorage
    const offlineQueue = await getOfflineQueue();
    
    for (const action of offlineQueue) {
      try {
        await processOfflineAction(action);
      } catch (error) {
        console.error('Failed to process offline action:', error);
      }
    }
    
    // Clear processed actions
    await clearOfflineQueue();
    
    console.log('Offline actions processed');
  } catch (error) {
    console.error('Failed to process offline actions:', error);
  }
}

/**
 * Sync critical data
 */
async function syncCriticalData() {
  const criticalEndpoints = [
    '/api/user/profile',
    '/api/dashboard/summary',
    '/api/notifications/unread'
  ];
  
  const cache = await caches.open(CACHE_NAME);
  
  for (const endpoint of criticalEndpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        await cache.put(endpoint, response.clone());
      }
    } catch (error) {
      console.warn(`Failed to sync ${endpoint}:`, error);
    }
  }
}

/**
 * Update cache
 */
async function updateCache() {
  const cache = await caches.open(CACHE_NAME);
  
  // Update static assets
  for (const url of STATIC_CACHE_URLS) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn(`Failed to update cache for ${url}:`, error);
    }
  }
}

/**
 * Sync user data
 */
async function syncUserData() {
  // Implementation depends on your data sync requirements
  console.log('Syncing user data...');
}

/**
 * Sync settings
 */
async function syncSettings() {
  // Implementation depends on your settings sync requirements
  console.log('Syncing settings...');
}

/**
 * Get offline queue
 */
async function getOfflineQueue() {
  // This would typically read from IndexedDB
  // For now, return empty array
  return [];
}

/**
 * Process offline action
 */
async function processOfflineAction(action) {
  const response = await fetch(action.url, {
    method: action.method,
    headers: action.headers,
    body: action.body
  });
  
  if (!response.ok) {
    throw new Error(`Failed to process action: ${response.status}`);
  }
  
  return response;
}

/**
 * Clear offline queue
 */
async function clearOfflineQueue() {
  // This would typically clear IndexedDB
  console.log('Offline queue cleared');
}

/**
 * Push Event Handler
 */
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  let notificationData = {
    title: 'TRADEAI',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'default',
    data: {}
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (error) {
      console.error('Failed to parse push payload:', error);
      notificationData.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction || false,
      actions: notificationData.actions || [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    })
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data || {};
  
  if (action === 'dismiss') {
    return;
  }
  
  // Handle notification click
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });
      
      // Determine URL to open
      let urlToOpen = '/';
      
      if (notificationData.url) {
        urlToOpen = notificationData.url;
      } else if (action === 'view' && notificationData.viewUrl) {
        urlToOpen = notificationData.viewUrl;
      }
      
      // Check if app is already open
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          // Focus existing window and navigate
          await client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            payload: { action, data: notificationData, url: urlToOpen }
          });
          return;
        }
      }
      
      // Open new window
      await self.clients.openWindow(urlToOpen);
    })()
  );
});

/**
 * Message Handler
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches());
      break;
      
    case 'UPDATE_CACHE':
      event.waitUntil(updateSpecificCache(payload.urls));
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

/**
 * Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('All caches cleared');
}

/**
 * Update specific cache URLs
 */
async function updateSpecificCache(urls) {
  const cache = await caches.open(CACHE_NAME);
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn(`Failed to update cache for ${url}:`, error);
    }
  }
  
  console.log('Specific cache URLs updated');
}

/**
 * Error Handler
 */
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

/**
 * Unhandled Rejection Handler
 */
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker script loaded');