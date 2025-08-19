'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoic2FtZnJvbnMiLCJhIjoiY21lOTU4cnlxMG5wbjJtcTVtcGc4aWhhaiJ9.V-JWJlxk2hksMuxe0wsolQ';

interface TouchMapProps {
  currentDate: Date;
  onBusinessSelect: (id: string | null) => void;
  selectedBusiness: string | null;
  isActive: boolean;
}

// Generate demo markers
const generateMarkers = (date: Date) => {
  const year = date.getFullYear();
  const baseCount = 2847;
  const reduction = Math.min(1, Math.max(0, (year - 1920) / 25));
  const activeCount = Math.floor(baseCount * (1 - reduction * 0.8));
  
  const markers = [];
  const berlinCenter = { lat: 52.5200, lng: 13.4050 };
  
  for (let i = 0; i < Math.min(activeCount, 100); i++) {
    const angle = (i / 100) * Math.PI * 2;
    const radius = Math.random() * 0.1 + 0.02;
    
    const status = year < 1933 ? 'active' : 
                   year < 1938 ? (Math.random() > 0.5 ? 'active' : 'declining') :
                   Math.random() > 0.7 ? 'closed' : 'declining';
    
    markers.push({
      id: `business-${i}`,
      lat: berlinCenter.lat + Math.sin(angle) * radius + (Math.random() - 0.5) * 0.02,
      lng: berlinCenter.lng + Math.cos(angle) * radius + (Math.random() - 0.5) * 0.02,
      name: `Business ${i + 1}`,
      status,
      year: 1920 + Math.floor(Math.random() * 10),
    });
  }
  
  return markers;
};

const TouchMap: React.FC<TouchMapProps> = ({ 
  currentDate, 
  onBusinessSelect, 
  selectedBusiness,
  isActive 
}) => {
  const mapRef = useRef<any>(null);
  const [markers] = useState(() => generateMarkers(currentDate));
  const [viewState, setViewState] = useState({
    longitude: 13.4050,
    latitude: 52.5200,
    zoom: isActive ? 12 : 11,
    pitch: 0,
    bearing: 0,
  });
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  // Smooth zoom animation when activated
  useEffect(() => {
    if (isActive && mapRef.current) {
      const map = mapRef.current.getMap();
      map.flyTo({
        zoom: 12,
        duration: 2000,
        essential: true,
      });
    }
  }, [isActive]);

  // Auto-pan animation when inactive
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setViewState(prev => ({
        ...prev,
        bearing: (prev.bearing + 0.1) % 360,
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [isActive]);

  // Get marker color based on status
  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'; // green
      case 'declining': return '#f59e0b'; // yellow
      case 'closed': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const handleMarkerClick = useCallback((markerId: string) => {
    onBusinessSelect(markerId);
    
    // Find marker and center on it
    const marker = markers.find(m => m.id === markerId);
    if (marker && mapRef.current) {
      const map = mapRef.current.getMap();
      map.flyTo({
        center: [marker.lng, marker.lat],
        zoom: 14,
        duration: 1500,
        essential: true,
      });
    }
  }, [markers, onBusinessSelect]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={[]}
        touchZoomRotate={true}
        touchPitch={false}
        dragRotate={false}
        keyboard={false}
        doubleClickZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Render markers */}
        {markers.map((marker) => {
          const isSelected = selectedBusiness === marker.id;
          const isHovered = hoveredMarker === marker.id;
          const color = getMarkerColor(marker.status);
          
          return (
            <Marker
              key={marker.id}
              longitude={marker.lng}
              latitude={marker.lat}
              anchor="center"
            >
              <button
                className="relative"
                onClick={() => handleMarkerClick(marker.id)}
                onMouseEnter={() => setHoveredMarker(marker.id)}
                onMouseLeave={() => setHoveredMarker(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '20px',
                }}
              >
                {/* Outer ring for selection */}
                {(isSelected || isHovered) && (
                  <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      backgroundColor: color,
                      opacity: 0.3,
                      transform: 'scale(2)',
                    }}
                  />
                )}
                
                {/* Main marker */}
                <div
                  className="relative rounded-full transition-all duration-300"
                  style={{
                    width: isSelected ? '24px' : '16px',
                    height: isSelected ? '24px' : '16px',
                    backgroundColor: color,
                    boxShadow: `0 0 20px ${color}`,
                    transform: isHovered ? 'scale(1.5)' : 'scale(1)',
                  }}
                >
                  {/* Inner pulse animation */}
                  {marker.status === 'active' && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{
                        backgroundColor: color,
                        opacity: 0.5,
                      }}
                    />
                  )}
                </div>
                
                {/* Tooltip on hover */}
                {isHovered && (
                  <div
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black bg-opacity-90 text-white text-sm whitespace-nowrap pointer-events-none"
                    style={{ minWidth: '150px' }}
                  >
                    <div className="font-semibold">{marker.name}</div>
                    <div className="text-xs text-gray-400">Est. {marker.year}</div>
                    <div className="text-xs" style={{ color }}>
                      {marker.status.charAt(0).toUpperCase() + marker.status.slice(1)}
                    </div>
                  </div>
                )}
              </button>
            </Marker>
          );
        })}
      </Map>

      {/* Selected business detail panel */}
      {selectedBusiness && (
        <div className="absolute top-1/2 left-8 transform -translate-y-1/2 bg-black bg-opacity-90 backdrop-blur-lg p-8 max-w-md border border-gray-800 animate-slide-in">
          <button
            onClick={() => onBusinessSelect(null)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h3 className="text-2xl font-light text-white mb-4">
            {markers.find(m => m.id === selectedBusiness)?.name}
          </h3>
          
          <div className="space-y-4 text-gray-300">
            <p>
              This business was established in {markers.find(m => m.id === selectedBusiness)?.year} 
              and operated in the heart of Berlin's commercial district.
            </p>
            <p className="text-sm text-gray-400">
              Touch the map to explore more businesses or use the timeline below to travel through history.
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px) translateY(-50%);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(-50%);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default React.memo(TouchMap);