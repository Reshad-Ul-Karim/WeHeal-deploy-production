/**
 * Route Service for getting directions and optimizing routes
 * Uses OpenRouteService API (free tier) for route calculations
 */
class RouteService {
  constructor() {
    // You can sign up for a free API key at https://openrouteservice.org/
    this.apiKey = process.env.REACT_APP_OPENROUTE_API_KEY || null;
    this.baseUrl = 'https://api.openrouteservice.org';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if API key is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Get route between two points
   * @param {object} start - {lat, lng}
   * @param {object} end - {lat, lng}
   * @param {object} options - Route options
   * @returns {Promise<object>}
   */
  async getRoute(start, end, options = {}) {
    if (!this.isConfigured()) {
      console.warn('OpenRouteService API key not configured, using fallback calculation');
      return this.getFallbackRoute(start, end);
    }

    const cacheKey = `${start.lat},${start.lng}-${end.lat},${end.lng}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const profile = options.profile || 'driving-car'; // driving-car, cycling-regular, foot-walking
      const format = 'geojson';
      
      const coordinates = [
        [start.lng, start.lat],
        [end.lng, end.lat]
      ];

      const url = `${this.baseUrl}/v2/directions/${profile}/${format}`;
      
      const requestBody = {
        coordinates,
        instructions: true,
        geometry: true,
        elevation: false
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Route request failed: ${response.status}`);
      }

      const data = await response.json();
      const route = this.processRouteData(data);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: route,
        timestamp: Date.now()
      });

      return route;
    } catch (error) {
      console.error('Route service error:', error);
      return this.getFallbackRoute(start, end);
    }
  }

  /**
   * Get multiple route options
   * @param {object} start 
   * @param {object} end 
   * @returns {Promise<array>}
   */
  async getRouteAlternatives(start, end) {
    if (!this.isConfigured()) {
      return [this.getFallbackRoute(start, end)];
    }

    try {
      const profiles = ['driving-car']; // Can add more: 'driving-hgv' for heavy vehicles
      const routes = await Promise.all(
        profiles.map(profile => this.getRoute(start, end, { profile }))
      );
      
      return routes.filter(route => route.success);
    } catch (error) {
      console.error('Route alternatives error:', error);
      return [this.getFallbackRoute(start, end)];
    }
  }

  /**
   * Process route data from OpenRouteService
   * @param {object} data 
   * @returns {object}
   */
  processRouteData(data) {
    if (!data.features || data.features.length === 0) {
      throw new Error('No route found');
    }

    const route = data.features[0];
    const properties = route.properties;
    const segments = properties.segments || [];
    
    return {
      success: true,
      distance: (properties.summary?.distance || 0) / 1000, // Convert to km
      duration: (properties.summary?.duration || 0) / 60, // Convert to minutes
      geometry: route.geometry,
      instructions: this.processInstructions(segments),
      waypoints: route.geometry.coordinates.map(coord => ({
        lat: coord[1],
        lng: coord[0]
      })),
      summary: {
        totalDistance: properties.summary?.distance || 0,
        totalTime: properties.summary?.duration || 0
      }
    };
  }

  /**
   * Process route instructions
   * @param {array} segments 
   * @returns {array}
   */
  processInstructions(segments) {
    const instructions = [];
    
    segments.forEach(segment => {
      if (segment.steps) {
        segment.steps.forEach(step => {
          instructions.push({
            text: step.instruction || '',
            distance: step.distance || 0,
            duration: step.duration || 0,
            type: step.type || 0
          });
        });
      }
    });

    return instructions;
  }

  /**
   * Fallback route calculation when API is not available
   * @param {object} start 
   * @param {object} end 
   * @returns {object}
   */
  getFallbackRoute(start, end) {
    const distance = this.calculateDistance(start.lat, start.lng, end.lat, end.lng);
    const estimatedDuration = (distance / 40) * 60; // Assume 40 km/h average speed
    
    return {
      success: true,
      distance,
      duration: estimatedDuration,
      geometry: {
        type: 'LineString',
        coordinates: [
          [start.lng, start.lat],
          [end.lng, end.lat]
        ]
      },
      waypoints: [
        { lat: start.lat, lng: start.lng },
        { lat: end.lat, lng: end.lng }
      ],
      instructions: [
        {
          text: `Head towards destination (${distance.toFixed(1)} km)`,
          distance: distance * 1000,
          duration: estimatedDuration * 60
        }
      ],
      summary: {
        totalDistance: distance * 1000,
        totalTime: estimatedDuration * 60
      },
      fallback: true
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 
   * @param {number} lon1 
   * @param {number} lat2 
   * @param {number} lon2 
   * @returns {number} Distance in kilometers
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
   * Get estimated arrival time
   * @param {object} start 
   * @param {object} end 
   * @param {number} currentSpeed - Current speed in km/h
   * @returns {Promise<object>}
   */
  async getEstimatedArrival(start, end, currentSpeed = 40) {
    try {
      const route = await this.getRoute(start, end);
      
      if (route.success) {
        // Use route duration if available, otherwise calculate based on distance
        const estimatedMinutes = route.duration || (route.distance / currentSpeed) * 60;
        const arrivalTime = new Date(Date.now() + estimatedMinutes * 60 * 1000);
        
        return {
          success: true,
          estimatedMinutes: Math.round(estimatedMinutes),
          arrivalTime,
          distance: route.distance,
          route
        };
      }
    } catch (error) {
      console.error('ETA calculation error:', error);
    }

    // Fallback calculation
    const distance = this.calculateDistance(start.lat, start.lng, end.lat, end.lng);
    const estimatedMinutes = (distance / currentSpeed) * 60;
    const arrivalTime = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    return {
      success: true,
      estimatedMinutes: Math.round(estimatedMinutes),
      arrivalTime,
      distance,
      fallback: true
    };
  }

  /**
   * Clear route cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get route as Leaflet polyline
   * @param {object} route 
   * @returns {array}
   */
  getLeafletPolyline(route) {
    if (!route.geometry || !route.geometry.coordinates) {
      return [];
    }

    return route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
  }
}

// Create singleton instance
const routeService = new RouteService();

export default routeService;
