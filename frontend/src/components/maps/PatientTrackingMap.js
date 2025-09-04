import React, { useState, useEffect, useCallback } from 'react';
import { MapPinIcon, PhoneIcon, ClockIcon, ExclamationTriangleIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import BaseMap, { MARKER_COLORS, MARKER_TYPES } from './BaseMap';
import geolocationService from '../../services/geolocationService';
import { websocketService } from '../../services/emergencyWebsocket';

const PatientTrackingMap = ({ 
  requestId, 
  driverLocation,
  driverInfo,
  onLocationUpdate,
  className = '',
  height = '400px',
  showControls = true,
  autoCenter = true
}) => {
  const [patientLocation, setPatientLocation] = useState(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [locationPermission, setLocationPermission] = useState('unknown');
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [shouldRecenter, setShouldRecenter] = useState(false);

  // Request location permission
  const requestLocationPermission = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const permission = await geolocationService.checkPermission();
      setLocationPermission(permission);
      
      if (permission === 'granted') {
        const position = await geolocationService.getCurrentPosition();
        const formattedPosition = geolocationService.formatPosition(position);
        setPatientLocation(formattedPosition);
        
        // Send location permission grant to server
        websocketService.send('location:grant-permission', { requestId });
        
        return true;
      } else if (permission === 'prompt') {
        // Try to request permission
        const position = await geolocationService.requestPermission();
        setPatientLocation(position);
        setLocationPermission('granted');
        
        // Send location permission grant to server
        websocketService.send('location:grant-permission', { requestId });
        
        return true;
      } else {
        throw new Error('Location permission denied');
      }
    } catch (error) {
      console.error('Failed to get location permission:', error);
      setError(error.userMessage || error.message);
      setLocationPermission('denied');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  // Start location sharing
  const startLocationSharing = useCallback(async () => {
    if (!requestId) {
      setError('No request ID provided');
      return;
    }

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      // Start watching location changes
      const subscriptionId = geolocationService.startWatching(
        (position) => {
          setPatientLocation(position);
          
          // Send location update to server
          websocketService.send('location:update', {
            requestId,
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy
          });

          // Notify parent component
          if (onLocationUpdate) {
            onLocationUpdate(position);
          }
        },
        (error) => {
          console.error('Location watching error:', error);
          // Use user-friendly message if available, otherwise use technical message
          setError(error.userMessage || error.message);
        }
      );

      setLocationSubscription(subscriptionId);
      setIsLocationSharing(true);
      console.log('Started location sharing for patient');
      
    } catch (error) {
      console.error('Failed to start location sharing:', error);
      setError(error.userMessage || error.message);
    }
  }, [requestId, onLocationUpdate, requestLocationPermission]);

  // Stop location sharing
  const stopLocationSharing = useCallback(() => {
    if (locationSubscription) {
      geolocationService.stopWatching(locationSubscription);
      setLocationSubscription(null);
    }
    
    setIsLocationSharing(false);
    
    // Notify server
    if (requestId) {
      websocketService.send('location:stop-sharing', { requestId });
    }
    
    console.log('Stopped location sharing for patient');
  }, [locationSubscription, requestId]);

  // Calculate estimated arrival time
  const calculateEstimatedArrival = useCallback(() => {
    if (distanceInfo && distanceInfo.eta) {
      const now = new Date();
      const arrivalTime = new Date(now.getTime() + (distanceInfo.eta * 60 * 1000));
      setEstimatedArrival(arrivalTime);
    } else {
      setEstimatedArrival(null);
    }
  }, [distanceInfo]);

  // Request distance info
  const requestDistanceInfo = useCallback(() => {
    if (requestId) {
      websocketService.send('location:get-distance', { requestId });
    }
  }, [requestId]);

  // Recenter map to show both patient and driver locations
  const recenterMap = useCallback(() => {
    if (patientLocation && driverLocation) {
      // Show both locations by triggering auto-zoom
      setShouldRecenter(true);
      setMapCenter(null); // Clear manual center to allow auto-zoom
      setTimeout(() => setShouldRecenter(false), 100);
    } else if (patientLocation) {
      // Only patient location available, center on patient
      setMapCenter([patientLocation.latitude, patientLocation.longitude]);
      setShouldRecenter(true);
      setTimeout(() => setShouldRecenter(false), 100);
    }
  }, [patientLocation, driverLocation]);

  // Contact driver
  const contactDriver = useCallback(() => {
    if (driverInfo && driverInfo.phone) {
      window.location.href = `tel:${driverInfo.phone}`;
    }
  }, [driverInfo]);

  // Auto-start location sharing when component mounts with a request
  useEffect(() => {
    console.log('Patient auto-start check:', { 
      requestId, 
      isLocationSharing, 
      locationPermission,
      driverLocation: !!driverLocation 
    });
    
    if (requestId && !isLocationSharing && locationPermission !== 'denied') {
      // Auto-start location sharing for emergency requests
      console.log('Auto-starting location sharing for patient in 3 seconds...');
      
      const timeoutId = setTimeout(() => {
        console.log('Executing auto-start location sharing for patient');
        startLocationSharing();
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [requestId, isLocationSharing, locationPermission, startLocationSharing]);

  // Setup WebSocket event listeners
  useEffect(() => {
    if (!requestId) return;

    const locationReceivedHandler = (data) => {
      console.log('Patient received location event:', data);
      if (data.requestId === requestId && data.userType === 'driver') {
        console.log('Processing driver location update for patient:', data.location);
        // Driver location update received - this should update the driverLocation via parent component
        setDistanceInfo(data.distanceInfo);
      }
    };

    const locationUpdateSuccessHandler = (data) => {
      if (data.requestId === requestId) {
        setDistanceInfo(data.distanceInfo);
      }
    };

    const distanceInfoHandler = (data) => {
      if (data.requestId === requestId) {
        setDistanceInfo(data);
      }
    };

    const trackingActiveHandler = (data) => {
      if (data.requestId === requestId) {
        console.log('Location tracking is now active');
        requestDistanceInfo();
      }
    };

    // Subscribe to events
    websocketService.subscribe('location:received', locationReceivedHandler);
    websocketService.subscribe('location:update-success', locationUpdateSuccessHandler);
    websocketService.subscribe('location:distance-info', distanceInfoHandler);
    websocketService.subscribe('location:tracking-active', trackingActiveHandler);

    return () => {
      websocketService.unsubscribe('location:received', locationReceivedHandler);
      websocketService.unsubscribe('location:update-success', locationUpdateSuccessHandler);
      websocketService.unsubscribe('location:distance-info', distanceInfoHandler);
      websocketService.unsubscribe('location:tracking-active', trackingActiveHandler);
    };
  }, [requestId, requestDistanceInfo]);

  // Update estimated arrival when distance info changes
  useEffect(() => {
    calculateEstimatedArrival();
  }, [calculateEstimatedArrival]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        geolocationService.stopWatching(locationSubscription);
      }
    };
  }, [locationSubscription]);

  // Prepare markers for map
  const markers = [];
  
  if (patientLocation) {
    markers.push({
      id: 'patient',
      position: {
        lat: patientLocation.latitude,
        lng: patientLocation.longitude
      },
      type: MARKER_TYPES.PATIENT,
      color: MARKER_COLORS.PATIENT,
      popup: (
        <div>
          <strong>Your Location</strong>
          <br />
          <small>
            Accuracy: ±{Math.round(patientLocation.accuracy)}m
          </small>
        </div>
      )
    });
  }

  if (driverLocation && driverLocation.latitude && driverLocation.longitude) {
    console.log('PatientTrackingMap - Adding driver marker:', driverLocation);
    markers.push({
      id: 'driver',
      position: {
        lat: driverLocation.latitude,
        lng: driverLocation.longitude
      },
      type: MARKER_TYPES.AMBULANCE,
      color: MARKER_COLORS.AMBULANCE,
      popup: (
        <div>
          <strong>Ambulance Location</strong>
          <br />
          <small>
            Driver: {driverInfo?.name || 'Unknown'}
            <br />
            Vehicle: {driverInfo?.vehicleNumber || 'N/A'}
            {driverLocation.speed && (
              <><br />Speed: {Math.round(driverLocation.speed * 3.6)} km/h</>
            )}
          </small>
        </div>
      )
    });
  } else {
    console.log('PatientTrackingMap - No driver location available:', driverLocation);
  }

  const currentMapCenter = mapCenter || (autoCenter && patientLocation 
    ? [patientLocation.latitude, patientLocation.longitude]
    : [40.7128, -74.0060]);

  return (
    <div className={`patient-tracking-map ${className}`}>
      {/* Control Panel */}
      {showControls && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Ambulance Tracking</h3>
            {driverInfo && (
              <button
                onClick={contactDriver}
                className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
              >
                <PhoneIcon className="h-4 w-4 inline mr-1" />
                Call Driver
              </button>
            )}
          </div>

          {/* Driver Info */}
          {driverInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-blue-900">{driverInfo.name}</p>
                  <p className="text-sm text-blue-700">
                    <strong>Mobile:</strong> {driverInfo.phone || 'N/A'}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Car Registration:</strong> {driverInfo.carRegistration || 'N/A'}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Ambulance Type:</strong> {driverInfo.ambulanceType || driverInfo.vehicleType || 'N/A'}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Chassis Number:</strong> {driverInfo.chassisNumber || 'N/A'}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Vehicle:</strong> {driverInfo.vehicleType} • {driverInfo.vehicleNumber}
                  </p>
                </div>
                {distanceInfo && (
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-900">
                      {distanceInfo.eta} min
                    </div>
                    <div className="text-sm text-blue-700">
                      {distanceInfo.distance} km away
                    </div>
                    {estimatedArrival && (
                      <div className="text-xs text-blue-600 mt-1">
                        ETA: {estimatedArrival.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className={`border rounded-md p-3 mb-3 ${
              error.includes('timeout') || error.includes('longer than expected') 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex">
                <ExclamationTriangleIcon className={`h-5 w-5 mr-2 ${
                  error.includes('timeout') || error.includes('longer than expected')
                    ? 'text-yellow-400' 
                    : 'text-red-400'
                }`} />
                <p className={`text-sm ${
                  error.includes('timeout') || error.includes('longer than expected')
                    ? 'text-yellow-700' 
                    : 'text-red-700'
                }`}>{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {!isLocationSharing ? (
              <button
                onClick={startLocationSharing}
                disabled={isLoading}
                className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Requesting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <MapPinIcon className="h-3 w-3 mr-1" />
                    Share Location
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={stopLocationSharing}
                className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm"
              >
                <span className="flex items-center">
                  <MapPinIcon className="h-3 w-3 mr-1" />
                  Stop Sharing
                </span>
              </button>
            )}

            {patientLocation && (
              <button
                onClick={recenterMap}
                className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 text-sm recenter-button"
                title={driverLocation ? "Show both patient and ambulance locations" : "Center map on your location"}
              >
                <ArrowsPointingOutIcon className="h-3 w-3 recenter-button-icon" />
              </button>
            )}

            <button
              onClick={requestDistanceInfo}
              className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
              title="Refresh distance info"
            >
              <ClockIcon className="h-3 w-3" />
            </button>
          </div>

          {/* Status */}
          <div className="mt-3 text-sm text-gray-600">
            Status: {isLocationSharing ? (
              <span className="text-green-600 font-medium">Sharing location</span>
            ) : (
              <span className="text-gray-500">Not sharing</span>
            )}
            {locationPermission === 'denied' && (
              <span className="text-red-600 ml-2">• Permission denied</span>
            )}
          </div>

          {/* Instructions */}
          {!isLocationSharing && (
            <div className="mt-3 text-xs text-gray-500">
              Share your location to help the driver find you quickly
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <BaseMap
        center={currentMapCenter}
        zoom={15}
        markers={markers}
        height={height}
        autoZoom={markers.length > 1 && !shouldRecenter}
        className="rounded-lg shadow-sm border"
        key={shouldRecenter ? Date.now() : 'map'}
      />

      {/* Map Info */}
      {markers.length === 0 && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          Waiting for location data. Share your location to see the map.
        </div>
      )}
    </div>
  );
};

export default PatientTrackingMap;
