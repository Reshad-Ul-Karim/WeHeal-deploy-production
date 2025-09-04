import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPinIcon, 
  ArrowTopRightOnSquareIcon, 
  SignalIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  WifiIcon
} from '@heroicons/react/24/outline';
import BaseMap, { MARKER_COLORS, MARKER_TYPES } from './BaseMap';
import RouteDisplay from './RouteDisplay';
import LocationMarker, { MARKER_CONFIGS } from './LocationMarker';
import geolocationService from '../../services/geolocationService';
import routeService from '../../services/routeService';
import offlineMapService from '../../services/offlineMapService';

/**
 * Enhanced Emergency Map with route display, offline support, and advanced features
 */
const EmergencyMap = ({
  requestId,
  userType = 'patient', // 'patient' or 'driver'
  currentLocation,
  targetLocation,
  locationSharing = false,
  onLocationUpdate,
  onRouteCalculated,
  showRoute = true,
  showNavigation = true,
  height = '500px',
  className = '',
  autoCenter = true,
  emergencyData = null
}) => {
  const [route, setRoute] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState(offlineMapService.getOfflineStatus());
  const [userPosition, setUserPosition] = useState(currentLocation);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [locationError, setLocationError] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState(null);
  const locationSubscription = useRef(null);

  // Update offline status
  useEffect(() => {
    const handleOnline = () => setOfflineStatus(offlineMapService.getOfflineStatus());
    const handleOffline = () => setOfflineStatus(offlineMapService.getOfflineStatus());
    
    offlineMapService.on('online', handleOnline);
    offlineMapService.on('offline', handleOffline);
    
    return () => {
      offlineMapService.off('online', handleOnline);
      offlineMapService.off('offline', handleOffline);
    };
  }, []);

  // Update user position when currentLocation changes
  useEffect(() => {
    if (currentLocation) {
      setUserPosition(currentLocation);
    }
  }, [currentLocation]);

  // Start/stop location tracking based on locationSharing prop
  useEffect(() => {
    if (locationSharing && !locationSubscription.current) {
      startLocationTracking();
    } else if (!locationSharing && locationSubscription.current) {
      stopLocationTracking();
    }
    
    return () => {
      if (locationSubscription.current) {
        stopLocationTracking();
      }
    };
  }, [locationSharing]);

  // Calculate route when positions change
  useEffect(() => {
    if (showRoute && userPosition && targetLocation) {
      calculateRoute();
    } else {
      setRoute(null);
    }
  }, [userPosition, targetLocation, showRoute]);

  // Cache emergency data for offline use
  useEffect(() => {
    if (emergencyData && requestId) {
      offlineMapService.cacheEmergencyData({
        ...emergencyData,
        requestId,
        userType
      });
    }
  }, [emergencyData, requestId, userType]);

  const startLocationTracking = async () => {
    try {
      const permission = await geolocationService.checkPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        locationSubscription.current = geolocationService.startWatching(
          (position) => {
            setUserPosition(position);
            setLocationError(null);
            
            // Cache location update for offline sync
            if (requestId) {
              offlineMapService.cacheLocationUpdate(requestId, position, userType);
            }
            
            if (onLocationUpdate) {
              onLocationUpdate(position);
            }
          },
          (error) => {
            console.error('Location tracking error:', error);
            setLocationError(error.message);
          }
        );
      } else if (permission === 'prompt') {
        const position = await geolocationService.requestPermission();
        setUserPosition(position);
        setPermissionStatus('granted');
        startLocationTracking(); // Retry after permission granted
      }
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      setLocationError(error.message);
      setPermissionStatus('denied');
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      geolocationService.stopWatching(locationSubscription.current);
      locationSubscription.current = null;
    }
  };

  const calculateRoute = async () => {
    if (!userPosition || !targetLocation) return;
    
    setIsCalculatingRoute(true);
    
    try {
      // Check cache first if offline
      if (!offlineStatus.isOnline) {
        const routeKey = `${userPosition.latitude},${userPosition.longitude}-${targetLocation.latitude},${targetLocation.longitude}`;
        const cachedRoute = await offlineMapService.getCachedRoute(routeKey);
        
        if (cachedRoute) {
          setRoute(cachedRoute);
          if (onRouteCalculated) onRouteCalculated(cachedRoute);
          return;
        }
      }
      
      const routeData = await routeService.getRoute(
        { lat: userPosition.latitude, lng: userPosition.longitude },
        { lat: targetLocation.latitude, lng: targetLocation.longitude }
      );
      
      setRoute(routeData);
      
      // Cache route for offline use
      const routeKey = `${userPosition.latitude},${userPosition.longitude}-${targetLocation.latitude},${targetLocation.longitude}`;
      await offlineMapService.cacheRoute(routeKey, routeData);
      
      // Calculate distance info
      if (routeData.success) {
        setDistanceInfo({
          distance: routeData.distance,
          duration: routeData.duration,
          eta: new Date(Date.now() + routeData.duration * 60 * 1000)
        });
      }
      
      if (onRouteCalculated) {
        onRouteCalculated(routeData);
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
      
      // Fallback to simple distance calculation
      if (userPosition && targetLocation) {
        const distance = geolocationService.calculateDistance(
          userPosition.latitude,
          userPosition.longitude,
          targetLocation.latitude,
          targetLocation.longitude
        );
        
        setDistanceInfo({
          distance,
          duration: (distance / 40) * 60, // Assume 40 km/h
          eta: new Date(Date.now() + ((distance / 40) * 60 * 60 * 1000)),
          fallback: true
        });
      }
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const openNavigation = () => {
    if (targetLocation) {
      geolocationService.openInMaps(
        targetLocation.latitude,
        targetLocation.longitude,
        userType === 'driver' ? 'Patient Location' : 'Ambulance Location'
      );
    }
  };

  // Prepare markers
  const markers = [];
  
  if (userPosition) {
    const userConfig = userType === 'driver' ? MARKER_CONFIGS.AMBULANCE : MARKER_CONFIGS.PATIENT;
    markers.push({
      id: 'user',
      position: { lat: userPosition.latitude, lng: userPosition.longitude },
      ...userConfig,
      title: userType === 'driver' ? 'Your Ambulance' : 'Your Location',
      details: {
        accuracy: userPosition.accuracy,
        speed: userPosition.speed,
        timestamp: userPosition.timestamp
      },
      isActive: true
    });
  }
  
  if (targetLocation) {
    const targetConfig = userType === 'driver' ? MARKER_CONFIGS.PATIENT : MARKER_CONFIGS.AMBULANCE;
    markers.push({
      id: 'target',
      position: { lat: targetLocation.latitude, lng: targetLocation.longitude },
      ...targetConfig,
      title: userType === 'driver' ? 'Patient Location' : 'Ambulance Location',
      details: {
        accuracy: targetLocation.accuracy,
        timestamp: targetLocation.timestamp
      }
    });
  }

  const mapCenter = autoCenter && userPosition
    ? [userPosition.latitude, userPosition.longitude]
    : [40.7128, -74.0060];

  return (
    <div className={`emergency-map ${className}`}>
      {/* Status Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-1">
            {offlineStatus.isOnline ? (
              <WifiIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
            )}
            <span className={offlineStatus.isOnline ? 'text-green-600' : 'text-red-600'}>
              {offlineStatus.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {/* Location Status */}
          <div className="flex items-center space-x-1">
            <MapPinIcon className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              {permissionStatus === 'granted' ? 'Location Active' :
               permissionStatus === 'denied' ? 'Location Denied' :
               'Location Pending'}
            </span>
          </div>
          
          {/* Route Status */}
          {isCalculatingRoute && (
            <div className="flex items-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600" />
              <span className="text-blue-600">Calculating route...</span>
            </div>
          )}
        </div>
        
        {/* Distance Info */}
        {distanceInfo && (
          <div className="flex items-center space-x-4 text-gray-600">
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>{Math.round(distanceInfo.duration)} min</span>
            </div>
            <div>{distanceInfo.distance.toFixed(1)} km</div>
            {distanceInfo.fallback && (
              <span className="text-amber-600 text-xs">Est.</span>
            )}
          </div>
        )}
        
        {/* Navigation Button */}
        {showNavigation && targetLocation && (
          <button
            onClick={openNavigation}
            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center space-x-1"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            <span>Navigate</span>
          </button>
        )}
      </div>
      
      {/* Error Display */}
      {locationError && (
        <div className="bg-red-50 border border-red-200 p-3 mx-4 mt-2 rounded-md">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{locationError}</p>
          </div>
        </div>
      )}
      
      {/* Offline Warning */}
      {!offlineStatus.isOnline && (
        <div className="bg-amber-50 border border-amber-200 p-3 mx-4 mt-2 rounded-md">
          <div className="flex items-center">
            <SignalIcon className="h-5 w-5 text-amber-500 mr-2" />
            <div className="text-sm text-amber-700">
              <p>You are currently offline. Using cached data.</p>
              {offlineStatus.queuedUpdates > 0 && (
                <p className="text-xs mt-1">
                  {offlineStatus.queuedUpdates} location updates will sync when online.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Map */}
      <BaseMap
        center={mapCenter}
        zoom={15}
        markers={markers}
        height={height}
        autoZoom={markers.length > 1}
        className="emergency-map-container"
      >
        {/* Route Display */}
        {showRoute && route && userPosition && targetLocation && (
          <RouteDisplay
            start={{ lat: userPosition.latitude, lng: userPosition.longitude }}
            end={{ lat: targetLocation.latitude, lng: targetLocation.longitude }}
            onRouteCalculated={setRoute}
            color={userType === 'driver' ? MARKER_COLORS.AMBULANCE : MARKER_COLORS.PATIENT}
            showInstructions={true}
          />
        )}
      </BaseMap>
      
      {/* Map Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
        {route && route.fallback && (
          <span className="text-amber-600">
            ⚠️ Showing estimated route. Detailed routing unavailable.
          </span>
        )}
        {offlineStatus.isOnline && (
          <span>Real-time location tracking active</span>
        )}
      </div>
    </div>
  );
};

export default EmergencyMap;
