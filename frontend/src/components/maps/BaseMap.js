import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different marker types
const createCustomIcon = (color, type) => {
  const iconHtml = type === 'ambulance' 
    ? `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
         <span style="color: white; font-size: 14px; font-weight: bold;">🚑</span>
       </div>`
    : `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
         <span style="color: white; font-size: 12px; font-weight: bold;">👤</span>
       </div>`;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Component to handle map bounds when markers change
const MapBounds = ({ markers, autoZoom = true }) => {
  const map = useMap();
  
  useEffect(() => {
    if (autoZoom && markers && markers.length > 0) {
      const validMarkers = markers.filter(marker => 
        marker.position && 
        typeof marker.position.lat === 'number' && 
        typeof marker.position.lng === 'number'
      );
      
      if (validMarkers.length === 1) {
        // If only one marker, center on it
        map.setView([validMarkers[0].position.lat, validMarkers[0].position.lng], 15);
      } else if (validMarkers.length > 1) {
        // If multiple markers, fit bounds to show all
        const bounds = L.latLngBounds(validMarkers.map(marker => [
          marker.position.lat, 
          marker.position.lng
        ]));
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [map, markers, autoZoom]);
  
  return null;
};

// Main BaseMap component
const BaseMap = ({
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  markers = [],
  autoZoom = true,
  height = '400px',
  className = '',
  onMapClick,
  showAttribution = true,
  zoomControl = true,
  scrollWheelZoom = true
}) => {
  const mapRef = useRef();

  const defaultCenter = Array.isArray(center) && center.length === 2 
    ? center 
    : [40.7128, -74.0060];

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <MapContainer
        ref={mapRef}
        center={defaultCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={zoomControl}
        scrollWheelZoom={scrollWheelZoom}
        onClick={onMapClick}
      >
        {/* OpenStreetMap tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution={showAttribution ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' : ''}
          maxZoom={19}
        />
        
        {/* Auto-adjust bounds */}
        <MapBounds markers={markers} autoZoom={autoZoom} />
        
        {/* Render markers */}
        {markers.map((marker, index) => {
          if (!marker.position || 
              typeof marker.position.lat !== 'number' || 
              typeof marker.position.lng !== 'number') {
            return null;
          }
          
          const icon = marker.icon || createCustomIcon(
            marker.color || '#3B82F6', 
            marker.type || 'default'
          );
          
          return (
            <Marker
              key={marker.id || index}
              position={[marker.position.lat, marker.position.lng]}
              icon={icon}
            >
              {marker.popup && (
                <Popup>
                  <div className="p-2">
                    {typeof marker.popup === 'string' ? (
                      <p>{marker.popup}</p>
                    ) : (
                      marker.popup
                    )}
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Loading overlay */}
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Predefined icon colors
export const MARKER_COLORS = {
  AMBULANCE: '#EF4444', // Red
  PATIENT: '#3B82F6',   // Blue
  HOSPITAL: '#10B981',  // Green
  PICKUP: '#F59E0B',    // Amber
  DESTINATION: '#8B5CF6' // Purple
};

// Predefined marker types
export const MARKER_TYPES = {
  AMBULANCE: 'ambulance',
  PATIENT: 'patient',
  LOCATION: 'location'
};

export default BaseMap;
