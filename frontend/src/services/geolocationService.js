/**
 * Geolocation Service for real-time location tracking
 * Handles browser geolocation API with permission management
 */
class GeolocationService {
  constructor() {
    this.watchId = null;
    this.lastKnownPosition = null;
    this.isWatching = false;
    this.subscribers = new Map();
    this.permissionStatus = 'unknown'; // 'granted', 'denied', 'prompt', 'unknown'
    this.options = {
      enableHighAccuracy: true,
      timeout: 8000, // Reduced to 8s for faster fallback
      maximumAge: 5000 // Reduced cache time for more frequent updates
    };
    this.fallbackOptions = {
      enableHighAccuracy: false, // Use network-based location as fallback
      timeout: 12000, // Reduced timeout for fallback
      maximumAge: 10000
    };
    this.lastResortOptions = {
      enableHighAccuracy: false,
      timeout: 5000, // Very short timeout for last resort
      maximumAge: 30000 // Allow older cached position if available
    };
  }

  /**
   * Check if geolocation is supported
   * @returns {boolean}
   */
  isSupported() {
    return 'geolocation' in navigator;
  }

  /**
   * Check current permission status
   * @returns {Promise<string>}
   */
  async checkPermission() {
    if (!this.isSupported()) {
      this.permissionStatus = 'denied';
      return 'denied';
    }

    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        this.permissionStatus = permission.state;
        return permission.state;
      } catch (error) {
        console.warn('Could not check geolocation permission:', error);
      }
    }

    // Fallback - try to get position once to check permission
    try {
      await this.getCurrentPosition();
      this.permissionStatus = 'granted';
      return 'granted';
    } catch (error) {
      if (error.code === 1) {
        this.permissionStatus = 'denied';
        return 'denied';
      }
      this.permissionStatus = 'unknown';
      return 'unknown';
    }
  }

  /**
   * Request location permission and get current position
   * @returns {Promise<{latitude: number, longitude: number, accuracy: number, timestamp: number}>}
   */
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    try {
      const position = await this.getCurrentPosition();
      this.permissionStatus = 'granted';
      return this.formatPosition(position);
    } catch (error) {
      this.permissionStatus = 'denied';
      throw this.formatError(error);
    }
  }

  /**
   * Get current position with three-tier fallback approach
   * @returns {Promise<GeolocationPosition>}
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      // Try high accuracy first
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.lastKnownPosition = position;
          resolve(position);
        },
        (error) => {
          console.warn('High accuracy location failed, trying fallback...', error.message);
          
          // Second attempt with fallback options
          navigator.geolocation.getCurrentPosition(
            (position) => {
              this.lastKnownPosition = position;
              resolve(position);
            },
            (error2) => {
              console.warn('Fallback location failed, trying last resort...', error2.message);
              
              // Third attempt with last resort options
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  this.lastKnownPosition = position;
                  resolve(position);
                },
                (error3) => {
                  // If we have a cached position, use it
                  if (this.lastKnownPosition) {
                    console.warn('Using cached position due to all attempts failing');
                    resolve(this.lastKnownPosition);
                  } else {
                    // All attempts failed
                    reject(error3);
                  }
                },
                this.lastResortOptions
              );
            },
            this.fallbackOptions
          );
        },
        this.options
      );
    });
  }

  /**
   * Start watching location changes
   * @param {Function} callback - Called when location changes
   * @param {Function} errorCallback - Called when error occurs
   * @returns {string} Subscription ID
   */
  startWatching(callback, errorCallback) {
    if (!this.isSupported()) {
      const error = new Error('Geolocation not supported');
      if (errorCallback) errorCallback(error);
      return null;
    }

    const subscriptionId = Math.random().toString(36).substr(2, 9);
    
    this.subscribers.set(subscriptionId, { callback, errorCallback });

    // Start watching if not already started
    if (!this.isWatching) {
      this.startLocationWatch();
    }

    return subscriptionId;
  }

  /**
   * Internal method to start location watching with progressive fallback
   */
  startLocationWatch() {
    let currentOptionsLevel = 0; // 0: high accuracy, 1: fallback, 2: last resort
    const optionsLevels = [this.options, this.fallbackOptions, this.lastResortOptions];
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    const startWatch = (optionsIndex = 0) => {
      const options = optionsLevels[optionsIndex];
      console.log(`Starting location watch with options level ${optionsIndex}:`, options);
      
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.lastKnownPosition = position;
          const formattedPosition = this.formatPosition(position);
          consecutiveErrors = 0; // Reset error count on success
          currentOptionsLevel = optionsIndex; // Remember successful level
          
          // Notify all subscribers
          this.subscribers.forEach(({ callback }) => {
            try {
              callback(formattedPosition);
            } catch (error) {
              console.error('Error in location callback:', error);
            }
          });
        },
        (error) => {
          console.warn(`Location error at level ${optionsIndex}:`, error.message);
          consecutiveErrors++;
          
          // If timeout or position unavailable, try next level
          if ((error.code === 3 || error.code === 2) && optionsIndex < optionsLevels.length - 1) {
            console.warn(`Trying next options level ${optionsIndex + 1}...`);
            
            // Stop current watch and try next level
            if (this.watchId) {
              navigator.geolocation.clearWatch(this.watchId);
            }
            
            setTimeout(() => {
              startWatch(optionsIndex + 1);
            }, 1000);
            return;
          } else if (consecutiveErrors >= maxConsecutiveErrors && this.lastKnownPosition) {
            // If too many consecutive errors but we have a cached position, use it
            console.warn('Too many consecutive errors, using cached position');
            const formattedPosition = this.formatPosition(this.lastKnownPosition);
            
            this.subscribers.forEach(({ callback }) => {
              try {
                callback(formattedPosition);
              } catch (cbError) {
                console.error('Error in location callback with cached position:', cbError);
              }
            });
            consecutiveErrors = 0; // Reset after using cached position
          } else {
            // Notify all subscribers of error
            const formattedError = this.formatError(error);
            this.subscribers.forEach(({ errorCallback }) => {
              if (errorCallback) {
                try {
                  errorCallback(formattedError);
                } catch (cbError) {
                  console.error('Error in location error callback:', cbError);
                }
              }
            });
          }
        },
        options
      );
    };

    // Start with the previously successful level or high accuracy
    this.isWatching = true;
    startWatch(currentOptionsLevel);
    console.log('Started watching location');
  }

  /**
   * Stop watching location for a specific subscription
   * @param {string} subscriptionId 
   */
  stopWatching(subscriptionId) {
    if (subscriptionId && this.subscribers.has(subscriptionId)) {
      this.subscribers.delete(subscriptionId);
      console.log('Stopped location subscription:', subscriptionId);
    }

    // If no more subscribers, stop watching entirely
    if (this.subscribers.size === 0 && this.isWatching) {
      this.stopAllWatching();
    }
  }

  /**
   * Stop all location watching
   */
  stopAllWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
      console.log('Stopped all location watching');
    }
    this.subscribers.clear();
  }

  /**
   * Get last known position
   * @returns {object|null}
   */
  getLastKnownPosition() {
    return this.lastKnownPosition ? this.formatPosition(this.lastKnownPosition) : null;
  }

  /**
   * Format position object for consistent API
   * @param {GeolocationPosition} position 
   * @returns {object}
   */
  formatPosition(position) {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp
    };
  }

  /**
   * Format error for consistent API
   * @param {GeolocationPositionError} error 
   * @returns {Error}
   */
  formatError(error) {
    let message = 'Unknown geolocation error';
    let userMessage = 'Unable to get your location';
    let code = 'UNKNOWN';
    
    if (error.code) {
      switch (error.code) {
        case 1:
          message = 'Location access denied by user';
          userMessage = 'Location access denied. Please enable location permissions in your browser settings.';
          code = 'PERMISSION_DENIED';
          break;
        case 2:
          message = 'Location unavailable';
          userMessage = 'Location is currently unavailable. Please check your device settings or try again.';
          code = 'POSITION_UNAVAILABLE';
          break;
        case 3:
          message = 'Location request timeout - trying fallback location';
          userMessage = 'Getting your precise location is taking longer than expected. We\'ll use network-based location instead.';
          code = 'TIMEOUT';
          break;
        default:
          message = error.message || 'Unknown geolocation error';
          userMessage = 'Unable to get your location. Please try again.';
      }
    }

    const formattedError = new Error(message);
    formattedError.code = code;
    formattedError.userMessage = userMessage;
    formattedError.originalError = error;
    return formattedError;
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   * @param {number} lat1 
   * @param {number} lon1 
   * @param {number} lat2 
   * @param {number} lon2 
   * @returns {number}
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees 
   * @returns {number}
   */
  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  /**
   * Check if coordinates are valid
   * @param {number} latitude 
   * @param {number} longitude 
   * @returns {boolean}
   */
  isValidCoordinate(latitude, longitude) {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  /**
   * Open device's native maps app with directions
   * @param {number} latitude 
   * @param {number} longitude 
   * @param {string} label 
   */
  openInMaps(latitude, longitude, label = 'Destination') {
    if (!this.isValidCoordinate(latitude, longitude)) {
      throw new Error('Invalid coordinates');
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(label)}`;
    
    // Try to open in native app, fallback to web
    if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
      window.location.href = `maps://maps.google.com/maps?daddr=${latitude},${longitude}&amp;ll=`;
      setTimeout(() => {
        window.open(url, '_blank');
      }, 1000);
    } else if (navigator.userAgent.match(/Android/)) {
      window.location.href = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(label)})`;
      setTimeout(() => {
        window.open(url, '_blank');
      }, 1000);
    } else {
      window.open(url, '_blank');
    }
  }

  /**
   * Get human-readable permission status
   * @returns {string}
   */
  getPermissionStatusMessage() {
    switch (this.permissionStatus) {
      case 'granted':
        return 'Location access granted';
      case 'denied':
        return 'Location access denied. Please enable location in your browser settings.';
      case 'prompt':
        return 'Location permission required. Please allow access when prompted.';
      default:
        return 'Location permission status unknown';
    }
  }
}

// Create singleton instance
const geolocationService = new GeolocationService();

export default geolocationService;
