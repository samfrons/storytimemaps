'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoic2FtZnJvbnMiLCJhIjoiY21lOTU4cnlxMG5wbjJtcTVtcGc4aWhhaiJ9.V-JWJlxk2hksMuxe0wsolQ';

interface TouchMapProps {
  currentDate: Date;
  onBusinessSelect: (id: string | null) => void;
  selectedBusiness: string | null;
  isActive: boolean;
  onStatsUpdate?: (stats: any) => void;
}

// Generate realistic business distribution across Berlin districts
const generateBusinesses = (totalCount: number = 10021) => {
  const districts = [
    { name: 'Mitte', lat: 52.5200, lng: 13.4050, density: 0.25 },
    { name: 'Charlottenburg', lat: 52.5165, lng: 13.3042, density: 0.20 },
    { name: 'Prenzlauer Berg', lat: 52.5384, lng: 13.4247, density: 0.15 },
    { name: 'Schöneberg', lat: 52.4839, lng: 13.3547, density: 0.10 },
    { name: 'Kreuzberg', lat: 52.4990, lng: 13.4041, density: 0.10 },
    { name: 'Friedrichshain', lat: 52.5158, lng: 13.4546, density: 0.08 },
    { name: 'Wilmersdorf', lat: 52.4870, lng: 13.3150, density: 0.07 },
    { name: 'Neukölln', lat: 52.4813, lng: 13.4352, density: 0.05 },
  ];

  const businesses = [];
  let id = 0;

  for (const district of districts) {
    const districtCount = Math.floor(totalCount * district.density);
    
    for (let i = 0; i < districtCount; i++) {
      // Create realistic scatter around district center
      const angle = (Math.PI * 2 * i) / districtCount;
      const radius = Math.random() * 0.03 + Math.random() * 0.02;
      
      businesses.push({
        id: `business-${id++}`,
        name: `${district.name} Business ${i + 1}`,
        district: district.name,
        lat: district.lat + Math.sin(angle) * radius + (Math.random() - 0.5) * 0.01,
        lng: district.lng + Math.cos(angle) * radius + (Math.random() - 0.5) * 0.01,
        establishedYear: 1900 + Math.floor(Math.random() * 33),
        closedYear: 1933 + Math.floor(Math.random() * 12),
        type: ['Retail', 'Manufacturing', 'Services', 'Banking', 'Textiles'][Math.floor(Math.random() * 5)],
      });
    }
  }

  return businesses;
};

const TouchMapSimple: React.FC<TouchMapProps> = ({ 
  currentDate, 
  onBusinessSelect, 
  selectedBusiness,
  isActive,
  onStatsUpdate 
}) => {
  const mapRef = useRef<any>(null);
  const [businesses] = useState(() => generateBusinesses());
  const [hoveredBusiness, setHoveredBusiness] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 13.4050,
    latitude: 52.5200,
    zoom: isActive ? 11 : 10.5,
    pitch: 0,
    bearing: 0,
  });

  // Calculate visible businesses and their states based on current date
  const visibleBusinesses = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return businesses.map(business => {
      let status = 'future';
      let visible = false;
      
      if (year >= business.establishedYear) {
        visible = true;
        
        if (year > business.closedYear) {
          status = 'closed';
        } else if (year === business.closedYear) {
          status = 'closing';
        } else if (year >= 1938) {
          status = 'takenOver';
        } else if (year >= 1935) {
          status = 'declining';
        } else if (year >= 1933 && month >= 3) {
          status = 'pressure';
        } else {
          status = 'active';
        }
      }
      
      return { ...business, status, visible };
    }).filter(b => b.visible);
  }, [currentDate, businesses]);

  // Update statistics
  useEffect(() => {
    const stats = {
      total: 10021,
      active: visibleBusinesses.filter(b => b.status === 'active').length,
      declining: visibleBusinesses.filter(b => b.status === 'declining' || b.status === 'pressure').length,
      takenOver: visibleBusinesses.filter(b => b.status === 'takenOver').length,
      liquidated: visibleBusinesses.filter(b => b.status === 'closed' || b.status === 'closing').length,
    };
    onStatsUpdate?.(stats);
  }, [visibleBusinesses, onStatsUpdate]);

  // Smooth zoom animation when activated
  useEffect(() => {
    if (isActive && mapRef.current) {
      mapRef.current.flyTo({
        zoom: 11,
        duration: 2000,
      });
    }
  }, [isActive]);

  // Auto-rotate when active
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setViewState(prev => ({
        ...prev,
        bearing: (prev.bearing + 0.1) % 360,
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'pressure': return '#84cc16';
      case 'declining': return '#eab308';
      case 'takenOver': return '#f97316';
      case 'closing': return '#ef4444';
      case 'closed': return '#991b1b';
      default: return '#6b7280';
    }
  };

  const handleMarkerClick = useCallback((businessId: string) => {
    onBusinessSelect(businessId);
    const business = businesses.find(b => b.id === businessId);
    if (business && mapRef.current) {
      mapRef.current.flyTo({
        center: [business.lng, business.lat],
        zoom: 13,
        duration: 1000,
      });
    }
  }, [businesses, onBusinessSelect]);

  // Sample markers for performance (show max 500 at a time)
  const displayedBusinesses = useMemo(() => {
    if (viewState.zoom < 11) {
      // Show fewer markers at lower zoom
      const step = Math.ceil(visibleBusinesses.length / 200);
      return visibleBusinesses.filter((_, index) => index % step === 0);
    } else if (viewState.zoom < 12) {
      const step = Math.ceil(visibleBusinesses.length / 400);
      return visibleBusinesses.filter((_, index) => index % step === 0);
    } else {
      // Show more at higher zoom
      const step = Math.ceil(visibleBusinesses.length / 600);
      return visibleBusinesses.filter((_, index) => index % step === 0);
    }
  }, [visibleBusinesses, viewState.zoom]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        touchZoomRotate={true}
        touchPitch={false}
        dragRotate={false}
        keyboard={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Render markers */}
        {displayedBusinesses.map((business) => {
          const color = getMarkerColor(business.status);
          const isSelected = selectedBusiness === business.id;
          const isHovered = hoveredBusiness === business.id;
          
          return (
            <Marker
              key={business.id}
              longitude={business.lng}
              latitude={business.lat}
              anchor="center"
            >
              <button
                className="relative group"
                onClick={() => handleMarkerClick(business.id)}
                onMouseEnter={() => setHoveredBusiness(business.id)}
                onMouseLeave={() => setHoveredBusiness(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '10px',
                }}
              >
                {/* Pulse effect for active businesses */}
                {business.status === 'active' && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{
                      backgroundColor: color,
                      opacity: 0.3,
                    }}
                  />
                )}
                
                {/* Main marker dot */}
                <div
                  className="relative rounded-full transition-all duration-300"
                  style={{
                    width: isSelected ? '20px' : isHovered ? '16px' : '12px',
                    height: isSelected ? '20px' : isHovered ? '16px' : '12px',
                    backgroundColor: color,
                    boxShadow: `0 0 ${isSelected ? '30px' : '10px'} ${color}`,
                    opacity: business.status === 'closed' ? 0.5 : 1,
                    transform: `scale(${isHovered ? 1.2 : 1})`,
                  }}
                />
                
                {/* Hover tooltip */}
                {isHovered && (
                  <div
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black bg-opacity-90 text-white text-xs whitespace-nowrap pointer-events-none z-50"
                    style={{ minWidth: '150px' }}
                  >
                    <div className="font-semibold">{business.type} Business</div>
                    <div className="text-gray-400">{business.district}</div>
                    <div className="text-gray-400">Est. {business.establishedYear}</div>
                    {business.status === 'closed' && (
                      <div className="text-red-400">Closed {business.closedYear}</div>
                    )}
                  </div>
                )}
              </button>
            </Marker>
          );
        })}

        {/* Selected business popup */}
        {selectedBusiness && (() => {
          const business = visibleBusinesses.find(b => b.id === selectedBusiness);
          if (!business) return null;
          
          return (
            <Popup
              longitude={business.lng}
              latitude={business.lat}
              anchor="bottom"
              onClose={() => onBusinessSelect(null)}
              closeButton={true}
              closeOnClick={false}
              className="museum-popup"
            >
              <div className="p-4 max-w-xs">
                <h3 className="text-lg font-semibold mb-2">{business.type} Business</h3>
                <p className="text-sm text-gray-600 mb-2">{business.district}, Berlin</p>
                <div className="text-xs space-y-1">
                  <div>Established: {business.establishedYear}</div>
                  {business.status === 'closed' && (
                    <div className="text-red-600">Forced closure: {business.closedYear}</div>
                  )}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    Status: <span style={{ color: getMarkerColor(business.status) }}>
                      {business.status === 'active' ? 'Operating' :
                       business.status === 'pressure' ? 'Under Pressure' :
                       business.status === 'declining' ? 'Declining' :
                       business.status === 'takenOver' ? 'Taken Over' :
                       business.status === 'closing' ? 'Being Liquidated' :
                       'Closed'}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          );
        })()}
      </Map>

      {/* Marker count indicator */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 text-sm">
        Showing {displayedBusinesses.length} of {visibleBusinesses.length} businesses
      </div>

      <style jsx global>{`
        .museum-popup .mapboxgl-popup-content {
          background: rgba(0, 0, 0, 0.9);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .museum-popup .mapboxgl-popup-close-button {
          color: white;
          font-size: 20px;
          padding: 5px 10px;
        }
        
        .museum-popup .mapboxgl-popup-close-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default React.memo(TouchMapSimple);