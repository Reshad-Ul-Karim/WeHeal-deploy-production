import React, { useState, useEffect, useCallback } from 'react';
import { MapPinIcon, ArrowTopRightOnSquareIcon, ClockIcon, ExclamationTriangleIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import BaseMap, { MARKER_COLORS, MARKER_TYPES } from './BaseMap';
import geolocationService from '../../services/geolocationService';
import { websocketService } from '../../services/emergencyWebsocket';

const DriverTrackingMap = ({ 
  requestId, 
  patientLocation, 
  onLocationUpdate,
  className = '',
  height = '400px',
  showControls = true,
  autoCenter = true
}) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [locationPermission, setLocationPermission] = useState('unknown');
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [shouldRecenter, setShouldRecenter] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState(null);

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
        setDriverLocation(formattedPosition);
        
        // Send location permission grant to server
        websocketService.send('location:grant-permission', { requestId });
        
        return true;
      } else if (permission === 'prompt') {
        // Try to request permission
        const position = await geolocationService.requestPermission();
        setDriverLocation(position);
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
          setDriverLocation(position);
          
          // Send location update to server
          websocketService.send('location:update', {
            requestId,
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
            heading: position.heading,
            speed: position.speed
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
      console.log('Started location sharing for driver');
      
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
    
    console.log('Stopped location sharing for driver');
  }, [locationSubscription, requestId]);

  // Open navigation in external app
  const openNavigation = useCallback(() => {
    if (patientLocation && patientLocation.latitude && patientLocation.longitude) {
      try {
        geolocationService.openInMaps(
          patientLocation.latitude, 
          patientLocation.longitude,
          'Patient Location'
        );
      } catch (error) {
        console.error('Failed to open navigation:', error);
        setError('Failed to open navigation app');
      }
    }
  }, [patientLocation]);

  // Request distance info
  const requestDistanceInfo = useCallback(() => {
    if (requestId) {
      websocketService.send('location:get-distance', { requestId });
    }
  }, [requestId]);

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

  // Recenter map to show both driver and patient locations
  const recenterMap = useCallback(() => {
    if (driverLocation && patientLocation) {
      // Show both locations by triggering auto-zoom
      setShouldRecenter(true);
      setMapCenter(null); // Clear manual center to allow auto-zoom
      setTimeout(() => setShouldRecenter(false), 100);
    } else if (driverLocation) {
      // Only driver location available, center on driver
      setMapCenter([driverLocation.latitude, driverLocation.longitude]);
      setShouldRecenter(true);
      setTimeout(() => setShouldRecenter(false), 100);
    }
  }, [driverLocation, patientLocation]);

  // Auto-start location sharing when component mounts with a request
  useEffect(() => {
    console.log('Driver auto-start check:', { 
      requestId, 
      isLocationSharing, 
      locationPermission,
      patientLocation: !!patientLocation 
    });
    
    if (requestId && !isLocationSharing && locationPermission !== 'denied') {
      // Auto-start location sharing for emergency requests
      console.log('Auto-starting location sharing for driver in 3 seconds...');
      
      const timeoutId = setTimeout(() => {
        console.log('Executing auto-start location sharing for driver');
        startLocationSharing();
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [requestId, isLocationSharing, locationPermission, startLocationSharing]);

  // Setup WebSocket event listeners
  useEffect(() => {
    if (!requestId) return;

    const locationReceivedHandler = (data) => {
      console.log('Driver received location event:', data);
      if (data.requestId === requestId && data.userType === 'patient') {
        console.log('Processing patient location update for driver:', data.location);
        // Patient location update received - this should update the patientLocation via parent component
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        geolocationService.stopWatching(locationSubscription);
      }
    };
  }, [locationSubscription]);

  // Debug logging for patient location
  useEffect(() => {
    console.log('DriverTrackingMap - patientLocation prop updated:', patientLocation);
  }, [patientLocation]);

  useEffect(() => {
    console.log('DriverTrackingMap - driverLocation updated:', driverLocation);
  }, [driverLocation]);

  // Auto-recenter when both patient and driver locations are available
  useEffect(() => {
    if (driverLocation && patientLocation && !mapCenter) {
      console.log('Both locations available, triggering auto-recenter');
      setTimeout(() => {
        setShouldRecenter(true);
        setTimeout(() => setShouldRecenter(false), 100);
      }, 500);
    }
  }, [driverLocation, patientLocation, mapCenter]);

  // Prepare markers for map
  const markers = [];
  
  console.log('Preparing markers - driverLocation:', !!driverLocation, 'patientLocation:', !!patientLocation);
  
  if (driverLocation && driverLocation.latitude && driverLocation.longitude) {
    console.log('Adding driver marker:', driverLocation);
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
          <strong>Your Location (Driver)</strong>
          <br />
          <small>
            Accuracy: ±{Math.round(driverLocation.accuracy || 0)}m
            {driverLocation.speed && (
              <><br />Speed: {Math.round(driverLocation.speed * 3.6)} km/h</>
            )}
          </small>
        </div>
      )
    });
  }

  if (patientLocation && patientLocation.latitude && patientLocation.longitude) {
    console.log('Adding patient marker:', patientLocation);
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
          <strong>Patient Location</strong>
          <br />
          <small>
            {patientLocation.address && (
              <>{patientLocation.address}<br /></>
            )}
            Accuracy: ±{Math.round(patientLocation.accuracy || 0)}m
          </small>
        </div>
      )
    });
  }

  console.log('Total markers:', markers.length, markers.map(m => m.id));

  // Determine map center - prioritize manual center, then auto-center logic
  const currentMapCenter = mapCenter || (autoCenter && markers.length > 0
    ? (markers.length === 1 
        ? [markers[0].position.lat, markers[0].position.lng]
        : null) // Let autoZoom handle multiple markers
    : [40.7128, -74.0060]); // Default to NYC

  return (
    <div className={`driver-tracking-map ${className}`}>
      {/* Control Panel */}
      {showControls && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Location Tracking</h3>
          </div>

          {/* Prominent Distance Display */}
          {distanceInfo && patientLocation && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold">{distanceInfo.distance} km</div>
                  <div className="text-sm text-blue-100">Distance to Patient</div>
                </div>
                <div className="w-px h-12 bg-blue-300 mx-4"></div>
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold">{distanceInfo.eta} min</div>
                  <div className="text-sm text-blue-100">Estimated Time</div>
                </div>
                {estimatedArrival && (
                  <>
                    <div className="w-px h-12 bg-blue-300 mx-4"></div>
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold">
                        {estimatedArrival.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="text-sm text-blue-100">ETA</div>
                    </div>
                  </>
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

            {driverLocation && (
              <button
                onClick={recenterMap}
                className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 text-sm recenter-button"
                title={patientLocation ? "Show both driver and patient locations" : "Center map on your location"}
              >
                <ArrowsPointingOutIcon className="h-3 w-3 recenter-button-icon" />
              </button>
            )}

            {patientLocation && patientLocation.latitude && (
              <button
                onClick={openNavigation}
                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm"
                title="Open in Maps app"
              >
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </button>
            )}
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
        </div>
      )}

      {/* Map */}
      <BaseMap
        center={currentMapCenter}
        zoom={15}
        markers={markers}
        height={height}
        autoZoom={markers.length > 1 || shouldRecenter}
        className="rounded-lg shadow-sm border"
        key={shouldRecenter ? Date.now() : 'map'}
      />

      {/* Map Info */}
      {markers.length === 0 && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          No location data available. Start sharing your location to see the map.
        </div>
      )}
    </div>
  );
};

export default DriverTrackingMap;
