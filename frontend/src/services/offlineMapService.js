/**
 * Offline Map Service for caching map tiles and handling offline scenarios
 * Provides fallback functionality when network is unavailable
 */
class OfflineMapService {
  constructor() {
    this.dbName = 'EmergencyMapCache';
    this.dbVersion = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.locationQueue = [];
    this.eventListeners = new Map();
    
    this.initializeDB();
    this.setupNetworkListeners();
  }

  /**
   * Initialize IndexedDB for offline storage
   */
  async initializeDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('Offline map cache initialized');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores for different types of cached data
        if (!db.objectStoreNames.contains('mapTiles')) {
          const tileStore = db.createObjectStore('mapTiles', { keyPath: 'url' });
          tileStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('locationHistory')) {
          const locationStore = db.createObjectStore('locationHistory', { keyPath: 'id', autoIncrement: true });
          locationStore.createIndex('timestamp', 'timestamp', { unique: false });
          locationStore.createIndex('requestId', 'requestId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('routeCache')) {
          const routeStore = db.createObjectStore('routeCache', { keyPath: 'routeKey' });
          routeStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('emergencyData')) {
          const emergencyStore = db.createObjectStore('emergencyData', { keyPath: 'id' });
          emergencyStore.createIndex('requestId', 'requestId', { unique: false });
        }
      };
    });
  }

  /**
   * Setup network connectivity listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      this.isOnline = true;
      this.syncQueuedData();
      this.emit('online');
    });
    
    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      this.isOnline = false;
      this.emit('offline');
    });
  }

  /**
   * Cache map tile for offline use
   * @param {string} tileUrl 
   * @param {Blob} tileData 
   */
  async cacheMapTile(tileUrl, tileData) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['mapTiles'], 'readwrite');
      const store = transaction.objectStore('mapTiles');
      
      await store.put({
        url: tileUrl,
        data: tileData,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to cache map tile:', error);
    }
  }

  /**
   * Get cached map tile
   * @param {string} tileUrl 
   * @returns {Promise<Blob|null>}
   */
  async getCachedTile(tileUrl) {
    if (!this.db) return null;
    
    try {
      const transaction = this.db.transaction(['mapTiles'], 'readonly');
      const store = transaction.objectStore('mapTiles');
      const result = await store.get(tileUrl);
      
      return result ? result.data : null;
    } catch (error) {
      console.error('Failed to get cached tile:', error);
      return null;
    }
  }

  /**
   * Cache location update for later sync
   * @param {string} requestId 
   * @param {object} locationData 
   * @param {string} userType 
   */
  async cacheLocationUpdate(requestId, locationData, userType) {
    const locationEntry = {
      requestId,
      userType,
      location: locationData,
      timestamp: Date.now(),
      synced: this.isOnline
    };

    // Add to queue if offline
    if (!this.isOnline) {
      this.locationQueue.push(locationEntry);
    }

    // Store in IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(['locationHistory'], 'readwrite');
        const store = transaction.objectStore('locationHistory');
        await store.add(locationEntry);
      } catch (error) {
        console.error('Failed to cache location update:', error);
      }
    }

    return locationEntry;
  }

  /**
   * Cache emergency request data
   * @param {object} requestData 
   */
  async cacheEmergencyData(requestData) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['emergencyData'], 'readwrite');
      const store = transaction.objectStore('emergencyData');
      
      await store.put({
        ...requestData,
        id: requestData.id || requestData.requestId,
        cachedAt: Date.now()
      });
    } catch (error) {
      console.error('Failed to cache emergency data:', error);
    }
  }

  /**
   * Get cached emergency data
   * @param {string} requestId 
   * @returns {Promise<object|null>}
   */
  async getCachedEmergencyData(requestId) {
    if (!this.db) return null;
    
    try {
      const transaction = this.db.transaction(['emergencyData'], 'readonly');
      const store = transaction.objectStore('emergencyData');
      const result = await store.get(requestId);
      
      return result || null;
    } catch (error) {
      console.error('Failed to get cached emergency data:', error);
      return null;
    }
  }

  /**
   * Cache route data
   * @param {string} routeKey 
   * @param {object} routeData 
   */
  async cacheRoute(routeKey, routeData) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['routeCache'], 'readwrite');
      const store = transaction.objectStore('routeCache');
      
      await store.put({
        routeKey,
        route: routeData,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to cache route:', error);
    }
  }

  /**
   * Get cached route
   * @param {string} routeKey 
   * @returns {Promise<object|null>}
   */
  async getCachedRoute(routeKey) {
    if (!this.db) return null;
    
    try {
      const transaction = this.db.transaction(['routeCache'], 'readonly');
      const store = transaction.objectStore('routeCache');
      const result = await store.get(routeKey);
      
      // Check if cache is still valid (1 hour)
      if (result && Date.now() - result.timestamp < 60 * 60 * 1000) {
        return result.route;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached route:', error);
      return null;
    }
  }

  /**
   * Sync queued data when connection is restored
   */
  async syncQueuedData() {
    if (!this.isOnline || this.locationQueue.length === 0) return;
    
    console.log(`Syncing ${this.locationQueue.length} queued location updates`);
    
    // Import WebSocket service dynamically to avoid circular dependencies
    const { websocketService } = await import('./emergencyWebsocket');
    
    const queue = [...this.locationQueue];
    this.locationQueue = [];
    
    for (const locationEntry of queue) {
      try {
        websocketService.send('location:update', {
          requestId: locationEntry.requestId,
          ...locationEntry.location
        });
        
        // Mark as synced in database
        await this.markLocationSynced(locationEntry.timestamp);
      } catch (error) {
        console.error('Failed to sync location update:', error);
        // Re-add to queue if sync fails
        this.locationQueue.push(locationEntry);
      }
    }
    
    this.emit('syncComplete', { syncedCount: queue.length - this.locationQueue.length });
  }

  /**
   * Mark location update as synced
   * @param {number} timestamp 
   */
  async markLocationSynced(timestamp) {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['locationHistory'], 'readwrite');
      const store = transaction.objectStore('locationHistory');
      const index = store.index('timestamp');
      const result = await index.get(timestamp);
      
      if (result) {
        result.synced = true;
        await store.put(result);
      }
    } catch (error) {
      console.error('Failed to mark location as synced:', error);
    }
  }

  /**
   * Get offline status information
   * @returns {object}
   */
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      queuedUpdates: this.locationQueue.length,
      hasCache: !!this.db,
      lastSync: this.locationQueue.length > 0 ? 
        Math.min(...this.locationQueue.map(item => item.timestamp)) : 
        Date.now()
    };
  }

  /**
   * Clear old cached data
   * @param {number} maxAge - Maximum age in milliseconds
   */
  async clearOldCache(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    if (!this.db) return;
    
    const cutoffTime = Date.now() - maxAge;
    
    try {
      // Clear old map tiles
      const tileTransaction = this.db.transaction(['mapTiles'], 'readwrite');
      const tileStore = tileTransaction.objectStore('mapTiles');
      const tileIndex = tileStore.index('timestamp');
      const tileCursor = await tileIndex.openCursor(IDBKeyRange.upperBound(cutoffTime));
      
      while (tileCursor) {
        await tileCursor.delete();
        tileCursor = await tileCursor.continue();
      }
      
      // Clear old location history
      const locationTransaction = this.db.transaction(['locationHistory'], 'readwrite');
      const locationStore = locationTransaction.objectStore('locationHistory');
      const locationIndex = locationStore.index('timestamp');
      const locationCursor = await locationIndex.openCursor(IDBKeyRange.upperBound(cutoffTime));
      
      while (locationCursor) {
        if (locationCursor.value.synced) {
          await locationCursor.delete();
        }
        locationCursor = await locationCursor.continue();
      }
      
      console.log('Old cache data cleared');
    } catch (error) {
      console.error('Failed to clear old cache:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<object>}
   */
  async getCacheStats() {
    if (!this.db) return { tiles: 0, locations: 0, routes: 0, emergency: 0 };
    
    try {
      const stats = {};
      
      // Count map tiles
      const tileTransaction = this.db.transaction(['mapTiles'], 'readonly');
      const tileStore = tileTransaction.objectStore('mapTiles');
      stats.tiles = await tileStore.count();
      
      // Count location history
      const locationTransaction = this.db.transaction(['locationHistory'], 'readonly');
      const locationStore = locationTransaction.objectStore('locationHistory');
      stats.locations = await locationStore.count();
      
      // Count cached routes
      const routeTransaction = this.db.transaction(['routeCache'], 'readonly');
      const routeStore = routeTransaction.objectStore('routeCache');
      stats.routes = await routeStore.count();
      
      // Count emergency data
      const emergencyTransaction = this.db.transaction(['emergencyData'], 'readonly');
      const emergencyStore = emergencyTransaction.objectStore('emergencyData');
      stats.emergency = await emergencyStore.count();
      
      return stats;
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { tiles: 0, locations: 0, routes: 0, emergency: 0 };
    }
  }

  /**
   * Event system for offline/online status changes
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }

  /**
   * Clear all cached data
   */
  async clearAllCache() {
    if (!this.db) return;
    
    try {
      const storeNames = ['mapTiles', 'locationHistory', 'routeCache', 'emergencyData'];
      
      for (const storeName of storeNames) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await store.clear();
      }
      
      this.locationQueue = [];
      console.log('All cache data cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

// Create singleton instance
const offlineMapService = new OfflineMapService();

export default offlineMapService;
