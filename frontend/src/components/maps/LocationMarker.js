import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Enhanced marker icons with better visibility
const createLocationIcon = (type, color, isActive = false) => {
  const size = isActive ? 35 : 30;
  const iconSize = isActive ? 18 : 16;
  
  let emoji = '📍';
  let bgColor = color || '#3B82F6';
  
  switch (type) {
    case 'ambulance':
      emoji = '🚑';
      bgColor = color || '#EF4444';
      break;
    case 'patient':
      emoji = '👤';
      bgColor = color || '#3B82F6';
      break;
    case 'hospital':
      emoji = '🏥';
      bgColor = color || '#10B981';
      break;
    case 'pickup':
      emoji = '📍';
      bgColor = color || '#F59E0B';
      break;
    case 'destination':
      emoji = '🎯';
      bgColor = color || '#8B5CF6';
      break;
    default:
      emoji = '📍';
      bgColor = color || '#6B7280';
  }

  const iconHtml = `
    <div style="
      background-color: ${bgColor}; 
      width: ${size}px; 
      height: ${size}px; 
      border-radius: 50%; 
      border: 3px solid white; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      position: relative;
      ${isActive ? 'animation: pulse 2s infinite;' : ''}
    ">
      <span style="
        color: white; 
        font-size: ${iconSize}px; 
        font-weight: bold;
        filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5));
      ">${emoji}</span>
      ${isActive ? `
        <div style="
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          border: 2px solid ${bgColor};
          border-radius: 50%;
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          opacity: 0.75;
        "></div>
      ` : ''}
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      @keyframes ping {
        75%, 100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
    </style>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-location-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

const LocationMarker = ({
  position,
  type = 'default',
  color,
  title,
  subtitle,
  details = {},
  isActive = false,
  showPopup = true,
  onClick,
  children,
  ...props
}) => {
  if (!position || typeof position.lat !== 'number' || typeof position.lng !== 'number') {
    console.warn('Invalid position provided to LocationMarker:', position);
    return null;
  }

  const icon = createLocationIcon(type, color, isActive);

  const formatDetail = (key, value) => {
    if (!value) return null;
    
    switch (key) {
      case 'accuracy':
        return `Accuracy: ±${Math.round(value)}m`;
      case 'speed':
        return `Speed: ${Math.round(value * 3.6)} km/h`;
      case 'heading':
        return `Direction: ${Math.round(value)}°`;
      case 'altitude':
        return `Altitude: ${Math.round(value)}m`;
      case 'timestamp':
        return `Updated: ${new Date(value).toLocaleTimeString()}`;
      case 'phone':
        return `Phone: ${value}`;
      case 'vehicleNumber':
        return `Vehicle: ${value}`;
      case 'vehicleType':
        return `Type: ${value}`;
      default:
        return `${key}: ${value}`;
    }
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(e, { position, type, title, details });
    }
  };

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={icon}
      eventHandlers={{
        click: handleClick
      }}
      {...props}
    >
      {showPopup && (
        <Popup>
          <div className="location-marker-popup">
            {title && (
              <div className="font-semibold text-gray-900 mb-1">
                {title}
              </div>
            )}
            
            {subtitle && (
              <div className="text-sm text-gray-600 mb-2">
                {subtitle}
              </div>
            )}
            
            {Object.keys(details).length > 0 && (
              <div className="text-xs text-gray-500 space-y-1">
                {Object.entries(details).map(([key, value]) => {
                  const formatted = formatDetail(key, value);
                  return formatted ? (
                    <div key={key}>{formatted}</div>
                  ) : null;
                })}
              </div>
            )}
            
            {children}
          </div>
        </Popup>
      )}
    </Marker>
  );
};

// Predefined marker configurations
export const MARKER_CONFIGS = {
  AMBULANCE: {
    type: 'ambulance',
    color: '#EF4444',
    title: 'Ambulance'
  },
  PATIENT: {
    type: 'patient',
    color: '#3B82F6',
    title: 'Patient'
  },
  HOSPITAL: {
    type: 'hospital',
    color: '#10B981',
    title: 'Hospital'
  },
  PICKUP: {
    type: 'pickup',
    color: '#F59E0B',
    title: 'Pickup Location'
  },
  DESTINATION: {
    type: 'destination',
    color: '#8B5CF6',
    title: 'Destination'
  }
};

// Helper function to create quick markers
export const createQuickMarker = (position, config, overrides = {}) => {
  return {
    position,
    ...config,
    ...overrides,
    id: overrides.id || `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
};

export default LocationMarker;
