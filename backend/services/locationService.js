import EmergencyRequest from '../models/emergency/emergencyRequest.model.js';

/**
 * Location Service for handling real-time location tracking
 * in emergency ambulance system
 */
class LocationService {
  
  /**
   * Validate location coordinates
   * @param {number} latitude 
   * @param {number} longitude 
   * @returns {boolean}
   */
  static isValidLocation(latitude, longitude) {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 
   * @param {number} lon1 
   * @param {number} lat2 
   * @param {number} lon2 
   * @returns {number} Distance in kilometers
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    if (!this.isValidLocation(lat1, lon1) || !this.isValidLocation(lat2, lon2)) {
      throw new Error('Invalid coordinates provided');
    }

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
  static toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  /**
   * Estimate arrival time based on distance and average speed
   * @param {number} distanceKm 
   * @param {number} averageSpeedKmh 
   * @returns {number} Estimated time in minutes
   */
  static estimateArrivalTime(distanceKm, averageSpeedKmh = 40) {
    if (distanceKm <= 0) return 0;
    return Math.round((distanceKm / averageSpeedKmh) * 60);
  }

  /**
   * Update patient location in emergency request
   * @param {string} requestId 
   * @param {object} locationData 
   * @returns {Promise<object>}
   */
  static async updatePatientLocation(requestId, locationData) {
    const { latitude, longitude, accuracy, address } = locationData;
    
    if (!this.isValidLocation(latitude, longitude)) {
      throw new Error('Invalid location coordinates');
    }

    const updateData = {
      'patientLocation.latitude': latitude,
      'patientLocation.longitude': longitude,
      'patientLocation.accuracy': accuracy || 0,
      'patientLocation.timestamp': new Date(),
      'patientLocation.address': address || ''
    };

    // Add to location history
    const historyEntry = {
      userId: 'patient',
      userType: 'patient',
      location: { latitude, longitude, accuracy: accuracy || 0 },
      timestamp: new Date()
    };

    const request = await EmergencyRequest.findOneAndUpdate(
      { requestId },
      {
        ...updateData,
        $push: { locationHistory: historyEntry }
      },
      { new: true }
    );

    return request;
  }

  /**
   * Update driver location in emergency request
   * @param {string} requestId 
   * @param {string} driverId 
   * @param {object} locationData 
   * @returns {Promise<object>}
   */
  static async updateDriverLocation(requestId, driverId, locationData) {
    const { latitude, longitude, accuracy, heading, speed } = locationData;
    
    if (!this.isValidLocation(latitude, longitude)) {
      throw new Error('Invalid location coordinates');
    }

    const updateData = {
      'driverLocation.latitude': latitude,
      'driverLocation.longitude': longitude,
      'driverLocation.accuracy': accuracy || 0,
      'driverLocation.timestamp': new Date(),
      'driverLocation.heading': heading || 0,
      'driverLocation.speed': speed || 0
    };

    // Add to location history
    const historyEntry = {
      userId: driverId,
      userType: 'driver',
      location: { latitude, longitude, accuracy: accuracy || 0 },
      timestamp: new Date()
    };

    const request = await EmergencyRequest.findOneAndUpdate(
      { requestId },
      {
        ...updateData,
        $push: { locationHistory: historyEntry }
      },
      { new: true }
    );

    return request;
  }

  /**
   * Grant location sharing permission
   * @param {string} requestId 
   * @param {string} userType - 'patient' or 'driver'
   * @returns {Promise<object>}
   */
  static async grantLocationPermission(requestId, userType) {
    if (!['patient', 'driver'].includes(userType)) {
      throw new Error('Invalid user type');
    }

    const updateField = userType === 'patient' ? 'patientSharing' : 'driverSharing';
    
    const request = await EmergencyRequest.findOneAndUpdate(
      { requestId },
      {
        [`locationPermissions.${updateField}`]: true,
        'locationPermissions.grantedAt': new Date()
      },
      { new: true }
    );

    return request;
  }

  /**
   * Revoke location sharing permission
   * @param {string} requestId 
   * @param {string} userType - 'patient' or 'driver'
   * @returns {Promise<object>}
   */
  static async revokeLocationPermission(requestId, userType) {
    if (!['patient', 'driver'].includes(userType)) {
      throw new Error('Invalid user type');
    }

    const updateField = userType === 'patient' ? 'patientSharing' : 'driverSharing';
    
    const request = await EmergencyRequest.findOneAndUpdate(
      { requestId },
      {
        [`locationPermissions.${updateField}`]: false
      },
      { new: true }
    );

    return request;
  }

  /**
   * Get distance and ETA between driver and patient
   * @param {string} requestId 
   * @returns {Promise<object>}
   */
  static async getDistanceAndETA(requestId) {
    const request = await EmergencyRequest.findOne({ requestId });
    
    if (!request) {
      throw new Error('Emergency request not found');
    }

    const { patientLocation, driverLocation } = request;
    
    if (!patientLocation?.latitude || !driverLocation?.latitude) {
      return {
        distance: null,
        eta: null,
        message: 'Location data not available'
      };
    }

    const distance = this.calculateDistance(
      patientLocation.latitude,
      patientLocation.longitude,
      driverLocation.latitude,
      driverLocation.longitude
    );

    const eta = this.estimateArrivalTime(distance, driverLocation.speed || 40);

    return {
      distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      eta,
      distanceUnit: 'km',
      etaUnit: 'minutes'
    };
  }

  /**
   * Clean up old location history (older than 24 hours)
   * @param {string} requestId 
   * @returns {Promise<object>}
   */
  static async cleanupLocationHistory(requestId) {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const request = await EmergencyRequest.findOneAndUpdate(
      { requestId },
      {
        $pull: {
          locationHistory: {
            timestamp: { $lt: cutoffTime }
          }
        }
      },
      { new: true }
    );

    return request;
  }

  /**
   * Check if location sharing is enabled for both parties
   * @param {string} requestId 
   * @returns {Promise<object>}
   */
  static async getLocationSharingStatus(requestId) {
    const request = await EmergencyRequest.findOne({ requestId }, 'locationPermissions');
    
    if (!request) {
      throw new Error('Emergency request not found');
    }

    return {
      patientSharing: request.locationPermissions?.patientSharing || false,
      driverSharing: request.locationPermissions?.driverSharing || false,
      bothSharing: (request.locationPermissions?.patientSharing && request.locationPermissions?.driverSharing) || false
    };
  }
}

export default LocationService;
