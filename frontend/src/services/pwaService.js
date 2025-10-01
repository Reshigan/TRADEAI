/**
 * Progressive Web App Service
 * Provides offline capabilities, push notifications, mobile optimization, and app-like experience
 */

class PWAService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.serviceWorker = null;
    this.pushSubscription = null;
    this.installPrompt = null;
    this.offlineQueue = [];
    this.syncTasks = new Map();
    this.cacheStrategies = new Map();
    this.notificationPermission = 'default';
    
    this.initializeService();
  }

  async initializeService() {
    try {
      console.log('Initializing PWA Service...');
      
      // Register service worker
      await this.registerServiceWorker();
      
      // Setup offline/online detection
      this.setupNetworkDetection();
      
      // Initialize push notifications
      await this.initializePushNotifications();
      
      // Setup install prompt handling
      this.setupInstallPrompt();
      
      // Initialize background sync
      this.initializeBackgroundSync();
      
      // Setup cache strategies
      this.setupCacheStrategies();
      
      // Initialize app shortcuts
      this.initializeAppShortcuts();
      
      console.log('PWA Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PWA Service:', error);
    }
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        this.serviceWorker = registration;

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              this.showUpdateAvailableNotification();
            }
          });
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event);
        });

        console.log('Service Worker registered successfully');
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    } else {
      throw new Error('Service Worker not supported');
    }
  }

  /**
   * Setup network detection
   */
  setupNetworkDetection() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOnlineStatusChange(false);
    });

    // Periodic connectivity check
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Handle online status change
   */
  handleOnlineStatusChange(isOnline) {
    console.log(`Network status changed: ${isOnline ? 'online' : 'offline'}`);
    
    if (isOnline) {
      // Process offline queue when back online
      this.processOfflineQueue();
      
      // Sync pending data
      this.syncPendingData();
      
      // Show online notification
      this.showNotification('Connection Restored', {
        body: 'You are back online. Syncing data...',
        icon: '/icons/online.png',
        tag: 'network-status'
      });
    } else {
      // Show offline notification
      this.showNotification('Offline Mode', {
        body: 'You are offline. Changes will be synced when connection is restored.',
        icon: '/icons/offline.png',
        tag: 'network-status'
      });
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('networkStatusChange', {
      detail: { isOnline }
    }));
  }

  /**
   * Check connectivity
   */
  async checkConnectivity() {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const wasOnline = this.isOnline;
      this.isOnline = response.ok;
      
      if (wasOnline !== this.isOnline) {
        this.handleOnlineStatusChange(this.isOnline);
      }
    } catch (error) {
      const wasOnline = this.isOnline;
      this.isOnline = false;
      
      if (wasOnline !== this.isOnline) {
        this.handleOnlineStatusChange(this.isOnline);
      }
    }
  }

  /**
   * Initialize push notifications
   */
  async initializePushNotifications() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('Push notifications not supported');
      return;
    }

    // Check current permission
    this.notificationPermission = Notification.permission;

    if (this.notificationPermission === 'granted') {
      await this.setupPushSubscription();
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    this.notificationPermission = permission;

    if (permission === 'granted') {
      await this.setupPushSubscription();
      return true;
    }

    return false;
  }

  /**
   * Setup push subscription
   */
  async setupPushSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = await this.getVAPIDPublicKey();
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      this.pushSubscription = subscription;
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      console.log('Push subscription setup complete');
    } catch (error) {
      console.error('Failed to setup push subscription:', error);
    }
  }

  /**
   * Get VAPID public key from server
   */
  async getVAPIDPublicKey() {
    try {
      const response = await fetch('/api/push/vapid-public-key');
      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error('Failed to get VAPID public key:', error);
      // Return a default key for demo purposes
      return 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f8HnKJuOmLsOBJXHk4Z2Ot6SRyIkdkFBFoEoeMSWI6BR_uuRAkU';
    }
  }

  /**
   * Send subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        })
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  /**
   * Show notification
   */
  async showNotification(title, options = {}) {
    if (this.notificationPermission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss.png'
        }
      ]
    };

    const notificationOptions = { ...defaultOptions, ...options };

    if ('serviceWorker' in navigator && this.serviceWorker) {
      // Show notification through service worker
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, notificationOptions);
    } else {
      // Fallback to regular notification
      new Notification(title, notificationOptions);
    }
  }

  /**
   * Setup install prompt handling
   */
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent the mini-infobar from appearing
      event.preventDefault();
      
      // Store the event for later use
      this.installPrompt = event;
      
      // Show custom install button
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.installPrompt = null;
      this.hideInstallButton();
      
      // Track installation
      this.trackEvent('pwa_installed');
    });
  }

  /**
   * Show install button
   */
  showInstallButton() {
    // Create install button if it doesn't exist
    let installButton = document.getElementById('pwa-install-button');
    
    if (!installButton) {
      installButton = document.createElement('button');
      installButton.id = 'pwa-install-button';
      installButton.className = 'pwa-install-button';
      installButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
        Install App
      `;
      installButton.onclick = () => this.promptInstall();
      
      // Add to page
      document.body.appendChild(installButton);
    }
    
    installButton.style.display = 'flex';
  }

  /**
   * Hide install button
   */
  hideInstallButton() {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  /**
   * Prompt install
   */
  async promptInstall() {
    if (!this.installPrompt) {
      console.warn('Install prompt not available');
      return;
    }

    // Show the install prompt
    this.installPrompt.prompt();
    
    // Wait for the user to respond
    const { outcome } = await this.installPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    // Track user choice
    this.trackEvent('pwa_install_prompt', { outcome });
    
    // Clear the prompt
    this.installPrompt = null;
    this.hideInstallButton();
  }

  /**
   * Initialize background sync
   */
  initializeBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('Background Sync supported');
      
      // Register sync events
      this.registerSyncEvents();
    } else {
      console.warn('Background Sync not supported');
    }
  }

  /**
   * Register sync events
   */
  async registerSyncEvents() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Register different sync tags
      await registration.sync.register('background-sync');
      await registration.sync.register('data-sync');
      await registration.sync.register('offline-actions');
      
      console.log('Background sync events registered');
    } catch (error) {
      console.error('Failed to register sync events:', error);
    }
  }

  /**
   * Add to offline queue
   */
  addToOfflineQueue(request) {
    const queueItem = {
      id: this.generateId(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.body,
      timestamp: Date.now()
    };

    this.offlineQueue.push(queueItem);
    
    // Store in localStorage for persistence
    localStorage.setItem('pwa-offline-queue', JSON.stringify(this.offlineQueue));
    
    // Schedule background sync
    this.scheduleBackgroundSync('offline-actions');
    
    console.log('Added request to offline queue:', queueItem);
  }

  /**
   * Process offline queue
   */
  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.offlineQueue.length} offline requests`);
    
    const processedItems = [];
    
    for (const item of this.offlineQueue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        });

        if (response.ok) {
          processedItems.push(item);
          console.log('Successfully processed offline request:', item.url);
        }
      } catch (error) {
        console.error('Failed to process offline request:', error);
      }
    }

    // Remove processed items from queue
    this.offlineQueue = this.offlineQueue.filter(item => 
      !processedItems.includes(item)
    );
    
    // Update localStorage
    localStorage.setItem('pwa-offline-queue', JSON.stringify(this.offlineQueue));
    
    if (processedItems.length > 0) {
      this.showNotification('Sync Complete', {
        body: `${processedItems.length} offline actions synced successfully`,
        tag: 'sync-complete'
      });
    }
  }

  /**
   * Schedule background sync
   */
  async scheduleBackgroundSync(tag) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log(`Background sync scheduled: ${tag}`);
    } catch (error) {
      console.error('Failed to schedule background sync:', error);
    }
  }

  /**
   * Setup cache strategies
   */
  setupCacheStrategies() {
    const strategies = [
      {
        name: 'cache-first',
        pattern: /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2)$/,
        description: 'Cache first for static assets'
      },
      {
        name: 'network-first',
        pattern: /\/api\//,
        description: 'Network first for API calls'
      },
      {
        name: 'stale-while-revalidate',
        pattern: /\/(dashboard|profile|settings)/,
        description: 'Stale while revalidate for dynamic pages'
      }
    ];

    strategies.forEach(strategy => {
      this.cacheStrategies.set(strategy.name, strategy);
    });

    console.log('Cache strategies configured:', strategies.length);
  }

  /**
   * Initialize app shortcuts
   */
  initializeAppShortcuts() {
    // App shortcuts are defined in the web app manifest
    // This method handles shortcut-related functionality
    
    const shortcuts = [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View your dashboard',
        url: '/dashboard',
        icons: [{ src: '/icons/dashboard.png', sizes: '192x192' }]
      },
      {
        name: 'Analytics',
        short_name: 'Analytics',
        description: 'View analytics',
        url: '/analytics',
        icons: [{ src: '/icons/analytics.png', sizes: '192x192' }]
      },
      {
        name: 'Settings',
        short_name: 'Settings',
        description: 'App settings',
        url: '/settings',
        icons: [{ src: '/icons/settings.png', sizes: '192x192' }]
      }
    ];

    this.appShortcuts = shortcuts;
    console.log('App shortcuts initialized:', shortcuts.length);
  }

  /**
   * Handle service worker message
   */
  handleServiceWorkerMessage(event) {
    const { type, payload } = event.data;

    switch (type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', payload);
        break;
        
      case 'BACKGROUND_SYNC':
        console.log('Background sync completed:', payload);
        this.handleBackgroundSyncComplete(payload);
        break;
        
      case 'PUSH_RECEIVED':
        console.log('Push notification received:', payload);
        break;
        
      case 'OFFLINE_FALLBACK':
        console.log('Offline fallback served:', payload);
        break;
        
      default:
        console.log('Unknown service worker message:', event.data);
    }
  }

  /**
   * Handle background sync complete
   */
  handleBackgroundSyncComplete(payload) {
    if (payload.tag === 'offline-actions') {
      // Refresh offline queue from service worker
      this.loadOfflineQueueFromStorage();
    }
  }

  /**
   * Load offline queue from storage
   */
  loadOfflineQueueFromStorage() {
    try {
      const stored = localStorage.getItem('pwa-offline-queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue from storage:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Show update available notification
   */
  showUpdateAvailableNotification() {
    this.showNotification('Update Available', {
      body: 'A new version of the app is available. Refresh to update.',
      tag: 'app-update',
      requireInteraction: true,
      actions: [
        {
          action: 'update',
          title: 'Update Now'
        },
        {
          action: 'later',
          title: 'Later'
        }
      ]
    });

    // Also show in-app update banner
    this.showUpdateBanner();
  }

  /**
   * Show update banner
   */
  showUpdateBanner() {
    // Remove existing banner
    const existingBanner = document.getElementById('pwa-update-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    // Create update banner
    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.className = 'pwa-update-banner';
    banner.innerHTML = `
      <div class="pwa-update-content">
        <span>A new version is available!</span>
        <button onclick="window.pwaService.updateApp()" class="pwa-update-button">
          Update Now
        </button>
        <button onclick="this.parentElement.parentElement.remove()" class="pwa-dismiss-button">
          ×
        </button>
      </div>
    `;

    // Add to page
    document.body.appendChild(banner);
  }

  /**
   * Update app
   */
  async updateApp() {
    if (this.serviceWorker && this.serviceWorker.waiting) {
      // Tell the waiting service worker to skip waiting
      this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page
      window.location.reload();
    }
  }

  /**
   * Sync pending data
   */
  async syncPendingData() {
    // Get pending sync tasks
    const pendingTasks = Array.from(this.syncTasks.values());
    
    for (const task of pendingTasks) {
      try {
        await this.executeSyncTask(task);
        this.syncTasks.delete(task.id);
      } catch (error) {
        console.error('Failed to sync task:', error);
      }
    }
  }

  /**
   * Execute sync task
   */
  async executeSyncTask(task) {
    switch (task.type) {
      case 'data-upload':
        await this.syncDataUpload(task);
        break;
        
      case 'settings-sync':
        await this.syncSettings(task);
        break;
        
      case 'analytics-sync':
        await this.syncAnalytics(task);
        break;
        
      default:
        console.warn('Unknown sync task type:', task.type);
    }
  }

  /**
   * Add sync task
   */
  addSyncTask(type, data) {
    const task = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    this.syncTasks.set(task.id, task);
    
    // Schedule background sync
    this.scheduleBackgroundSync('data-sync');
    
    return task.id;
  }

  /**
   * Get app info
   */
  getAppInfo() {
    return {
      isOnline: this.isOnline,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      notificationPermission: this.notificationPermission,
      hasServiceWorker: !!this.serviceWorker,
      hasPushSubscription: !!this.pushSubscription,
      offlineQueueSize: this.offlineQueue.length,
      pendingSyncTasks: this.syncTasks.size,
      cacheStrategies: Array.from(this.cacheStrategies.keys())
    };
  }

  /**
   * Clear app data
   */
  async clearAppData() {
    try {
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear IndexedDB (if used)
      if ('indexedDB' in window) {
        // Implementation depends on your IndexedDB usage
      }

      console.log('App data cleared successfully');
      
      this.showNotification('Data Cleared', {
        body: 'All app data has been cleared',
        tag: 'data-cleared'
      });
      
    } catch (error) {
      console.error('Failed to clear app data:', error);
      throw error;
    }
  }

  /**
   * Track event
   */
  trackEvent(eventName, data = {}) {
    // Send analytics event
    if (window.gtag) {
      window.gtag('event', eventName, data);
    }

    // Send to custom analytics
    if (window.analytics) {
      window.analytics.track(eventName, data);
    }

    console.log('PWA Event tracked:', eventName, data);
  }

  /**
   * Utility methods
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  async enableNotifications() {
    return await this.requestNotificationPermission();
  }

  async disableNotifications() {
    if (this.pushSubscription) {
      await this.pushSubscription.unsubscribe();
      this.pushSubscription = null;
    }
    return true;
  }

  isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  canInstall() {
    return !!this.installPrompt;
  }

  async install() {
    return await this.promptInstall();
  }

  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      effectiveType: navigator.connection?.effectiveType,
      downlink: navigator.connection?.downlink,
      rtt: navigator.connection?.rtt
    };
  }

  getOfflineQueue() {
    return [...this.offlineQueue];
  }

  clearOfflineQueue() {
    this.offlineQueue = [];
    localStorage.removeItem('pwa-offline-queue');
  }

  getSyncTasks() {
    return Array.from(this.syncTasks.values());
  }

  async forceSync() {
    await this.processOfflineQueue();
    await this.syncPendingData();
  }
}

// Create and export singleton instance
const pwaService = new PWAService();

// Make available globally
window.pwaService = pwaService;

export default pwaService;