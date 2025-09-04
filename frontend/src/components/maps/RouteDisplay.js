import React, { useEffect, useState } from 'react';
import { Polyline, Popup } from 'react-leaflet';
import routeService from '../../services/routeService';

const RouteDisplay = ({ 
  start, 
  end, 
  options = {},
  onRouteCalculated,
  showInstructions = false,
  color = '#3B82F6',
  weight = 5,
  opacity = 0.7,
  className = ''
}) => {
  const [route, setRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate route when start/end points change
  useEffect(() => {
    if (!start || !end || 
        typeof start.lat !== 'number' || typeof start.lng !== 'number' ||
        typeof end.lat !== 'number' || typeof end.lng !== 'number') {
      setRoute(null);
      return;
    }

    const calculateRoute = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const routeData = await routeService.getRoute(start, end, options);
        setRoute(routeData);
        
        if (onRouteCalculated) {
          onRouteCalculated(routeData);
        }
      } catch (err) {
        console.error('Route calculation error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    calculateRoute();
  }, [start, end, options, onRouteCalculated]);

  if (isLoading || !route || !route.success) {
    return null;
  }

  const polylinePositions = routeService.getLeafletPolyline(route);

  if (polylinePositions.length === 0) {
    return null;
  }

  return (
    <>
      <Polyline
        positions={polylinePositions}
        pathOptions={{
          color,
          weight,
          opacity,
          className
        }}
      >
        {showInstructions && route.instructions && (
          <Popup>
            <div className="route-popup">
              <div className="font-semibold text-gray-900 mb-2">
                Route Information
              </div>
              
              <div className="text-sm space-y-1 mb-3">
                <div>
                  <strong>Distance:</strong> {route.distance.toFixed(1)} km
                </div>
                <div>
                  <strong>Duration:</strong> {Math.round(route.duration)} min
                </div>
                {route.fallback && (
                  <div className="text-amber-600 text-xs">
                    ⚠️ Estimated route (detailed routing unavailable)
                  </div>
                )}
              </div>

              {route.instructions && route.instructions.length > 0 && (
                <div className="max-h-40 overflow-y-auto">
                  <div className="font-medium text-gray-700 mb-1">Directions:</div>
                  <ol className="text-xs space-y-1">
                    {route.instructions.slice(0, 5).map((instruction, index) => (
                      <li key={index} className="flex">
                        <span className="mr-2 text-gray-500">{index + 1}.</span>
                        <span>{instruction.text}</span>
                      </li>
                    ))}
                    {route.instructions.length > 5 && (
                      <li className="text-gray-500 italic">
                        ...and {route.instructions.length - 5} more steps
                      </li>
                    )}
                  </ol>
                </div>
              )}
            </div>
          </Popup>
        )}
      </Polyline>
    </>
  );
};

// Component for displaying multiple route alternatives
export const RouteAlternatives = ({ 
  start, 
  end, 
  onRouteSelected,
  colors = ['#3B82F6', '#10B981', '#F59E0B'],
  selectedRoute = 0
}) => {
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!start || !end) {
      setRoutes([]);
      return;
    }

    const calculateRoutes = async () => {
      setIsLoading(true);
      
      try {
        const routeAlternatives = await routeService.getRouteAlternatives(start, end);
        setRoutes(routeAlternatives);
        
        if (onRouteSelected && routeAlternatives.length > 0) {
          onRouteSelected(routeAlternatives[0], 0);
        }
      } catch (err) {
        console.error('Route alternatives error:', err);
        setRoutes([]);
      } finally {
        setIsLoading(false);
      }
    };

    calculateRoutes();
  }, [start, end, onRouteSelected]);

  if (isLoading || routes.length === 0) {
    return null;
  }

  return (
    <>
      {routes.map((route, index) => {
        const isSelected = index === selectedRoute;
        const polylinePositions = routeService.getLeafletPolyline(route);
        
        if (polylinePositions.length === 0) {
          return null;
        }

        return (
          <Polyline
            key={index}
            positions={polylinePositions}
            pathOptions={{
              color: colors[index % colors.length],
              weight: isSelected ? 6 : 4,
              opacity: isSelected ? 0.8 : 0.5
            }}
            eventHandlers={{
              click: () => {
                if (onRouteSelected) {
                  onRouteSelected(route, index);
                }
              }
            }}
          >
            <Popup>
              <div className="route-alternative-popup">
                <div className="font-semibold text-gray-900 mb-1">
                  Route {index + 1} {isSelected ? '(Selected)' : ''}
                </div>
                <div className="text-sm">
                  <div><strong>Distance:</strong> {route.distance.toFixed(1)} km</div>
                  <div><strong>Duration:</strong> {Math.round(route.duration)} min</div>
                </div>
                {!isSelected && (
                  <button
                    onClick={() => onRouteSelected && onRouteSelected(route, index)}
                    className="mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Select This Route
                  </button>
                )}
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </>
  );
};

// Animated route drawing component
export const AnimatedRoute = ({ 
  start, 
  end, 
  animationSpeed = 50, // pixels per second
  onAnimationComplete,
  ...props 
}) => {
  const [visiblePositions, setVisiblePositions] = useState([]);
  const [fullRoute, setFullRoute] = useState([]);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (!start || !end) return;

    const calculateAndAnimate = async () => {
      try {
        const route = await routeService.getRoute(start, end);
        const positions = routeService.getLeafletPolyline(route);
        setFullRoute(positions);
        setAnimationProgress(0);
        setVisiblePositions([]);
        
        // Animate the route drawing
        let currentIndex = 0;
        const interval = setInterval(() => {
          currentIndex += Math.max(1, Math.floor(animationSpeed / 10));
          
          if (currentIndex >= positions.length) {
            setVisiblePositions(positions);
            setAnimationProgress(100);
            clearInterval(interval);
            
            if (onAnimationComplete) {
              onAnimationComplete(route);
            }
          } else {
            setVisiblePositions(positions.slice(0, currentIndex));
            setAnimationProgress((currentIndex / positions.length) * 100);
          }
        }, 100);

        return () => clearInterval(interval);
      } catch (error) {
        console.error('Animated route error:', error);
      }
    };

    calculateAndAnimate();
  }, [start, end, animationSpeed, onAnimationComplete]);

  if (visiblePositions.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={visiblePositions}
      pathOptions={{
        ...props.pathOptions,
        className: `animated-route ${props.pathOptions?.className || ''}`
      }}
      {...props}
    />
  );
};

export default RouteDisplay;
