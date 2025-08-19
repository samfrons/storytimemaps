'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoic2FtZnJvbnMiLCJhIjoiY21lOTU4cnlxMG5wbjJtcTVtcGc4aWhhaiJ9.V-JWJlxk2hksMuxe0wsolQ';

interface BusinessStatistics {
  total: number;
  active: number;
  declining: number;
  takenOver: number;
  liquidated: number;
}

interface TouchMapProps {
  currentDate: Date;
  onBusinessSelect: (id: string | null) => void;
  selectedBusiness: string | null;
  isActive: boolean;
  onStatsUpdate?: (stats: BusinessStatistics) => void;
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
  const mapRef = useRef<MapRef>(null);
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

  // Apply custom map styling for elegant dark aesthetic
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const applyCustomStyling = () => {
      try {
        // Background - very dark
        map.setPaintProperty('background', 'background-color', '#1a1a1a');

        // Water - very dark blue/black
        if (map.getLayer('water')) {
          map.setPaintProperty('water', 'fill-color', '#0a0a0f');
        }

        // Streets and roads - gold/amber colors
        const roadLayers = [
          'road-primary',
          'road-secondary-tertiary', 
          'road-minor',
          'road-street',
          'road-trunk',
          'road-motorway',
          'road-rail',
          'road-construction'
        ];

        roadLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            // Different shades of gold/amber for different road types
            const roadColors = {
              'road-motorway': '#d4af37',
              'road-trunk': '#d4af37', 
              'road-primary': '#c9a961',
              'road-secondary-tertiary': '#c9a961',
              'road-street': '#b8975a',
              'road-minor': '#a68650',
              'road-rail': '#8a7247',
              'road-construction': '#7a6640'
            };
            map.setPaintProperty(layerId, 'line-color', roadColors[layerId] || '#c9a961');
            map.setPaintProperty(layerId, 'line-opacity', 0.8);
          }
        });

        // Road borders/casings - slightly darker
        const roadCasingLayers = [
          'road-primary-case',
          'road-secondary-tertiary-case',
          'road-minor-case',
          'road-street-case',
          'road-trunk-case',
          'road-motorway-case'
        ];

        roadCasingLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'line-color', '#2d2d2d');
            map.setPaintProperty(layerId, 'line-opacity', 0.4);
          }
        });

        // Parks and green spaces - very dark green/muted teal
        const greenSpaceLayers = [
          'landuse',
          'national-park',
          'park',
          'pitch',
          'golf-course-rough',
          'golf-course-fairway'
        ];

        greenSpaceLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'fill-color', '#1a2e2a');
            map.setPaintProperty(layerId, 'fill-opacity', 0.6);
          }
        });

        // Building footprints - subtle dark gray
        if (map.getLayer('building')) {
          map.setPaintProperty('building', 'fill-color', '#2d2d2d');
          map.setPaintProperty('building', 'fill-opacity', 0.4);
        }

        // Building extrusions
        if (map.getLayer('building-extrusion')) {
          map.setPaintProperty('building-extrusion', 'fill-extrusion-color', '#2d2d2d');
          map.setPaintProperty('building-extrusion', 'fill-extrusion-opacity', 0.3);
        }

        // Labels - light cream/gold text
        const labelLayers = [
          'country-label',
          'state-label',
          'settlement-major-label',
          'settlement-minor-label',
          'place-city-large-n',
          'place-city-medium-n', 
          'place-city-small-n',
          'place-neighbourhood',
          'place-other',
          'poi-label',
          'road-label',
          'waterway-label',
          'natural-point-label',
          'transit-label'
        ];

        labelLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'text-color', '#f5e6d3');
            map.setPaintProperty(layerId, 'text-halo-color', '#1a1a1a');
            map.setPaintProperty(layerId, 'text-halo-width', 1);
            map.setPaintProperty(layerId, 'text-opacity', 0.8);
          }
        });

        // Transportation lines
        if (map.getLayer('transit-line')) {
          map.setPaintProperty('transit-line', 'line-color', '#8a7247');
          map.setPaintProperty('transit-line', 'line-opacity', 0.6);
        }

        // Airport areas and other special zones
        if (map.getLayer('airport')) {
          map.setPaintProperty('airport', 'fill-color', '#2a2a2a');
        }

        // Reduce overall saturation for a more muted look
        const terrainLayers = ['hillshade', 'terrain', 'landcover'];
        terrainLayers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'fill-opacity', 0.3);
          }
        });

      } catch (error) {
        console.warn('Error applying custom map styling:', error);
      }
    };

    // Apply styling after map loads
    if (map.loaded()) {
      applyCustomStyling();
    } else {
      map.on('load', applyCustomStyling);
    }

    // Cleanup
    return () => {
      if (map.loaded()) {
        map.off('load', applyCustomStyling);
      }
    };
  }, []);

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

  // Apply custom map styling after load for elegant bright palette
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current.getMap();
    
    const applyCustomStyle = () => {
      try {
        // Set light cream background
        if (map.getLayer('background')) {
          map.setPaintProperty('background', 'background-color', '#FAF8F5');
        }

        // Style water - soft teal
        if (map.getLayer('water')) {
          map.setPaintProperty('water', 'fill-color', '#B8E6E6');
        }
        if (map.getLayer('waterway')) {
          map.setPaintProperty('waterway', 'line-color', '#B8E6E6');
        }

        // Style parks/green spaces - soft mint
        ['park', 'landuse', 'landcover', 'national_park'].forEach(layer => {
          if (map.getLayer(layer)) {
            map.setPaintProperty(layer, 'fill-color', '#D4EDDA');
            map.setPaintProperty(layer, 'fill-opacity', 0.4);
          }
        });

        // Style buildings - light warm gray
        if (map.getLayer('building')) {
          map.setPaintProperty('building', 'fill-color', '#E8E4DE');
          map.setPaintProperty('building', 'fill-opacity', 0.6);
        }

        // Style roads with warm golden/orange tones
        const roadLayers = [
          'road-motorway', 'road-motorway-trunk',
          'road-trunk', 'road-primary',
          'road-secondary', 'road-tertiary',
          'road-street', 'road-street_limited',
          'road-minor', 'road-service-link',
          'road-pedestrian', 'road-track'
        ];

        roadLayers.forEach(layer => {
          if (map.getLayer(layer)) {
            // Main roads - bright orange/gold
            if (layer.includes('motorway') || layer.includes('trunk')) {
              map.setPaintProperty(layer, 'line-color', '#FDB863');
              map.setPaintProperty(layer, 'line-width', 2.5);
            }
            // Secondary roads - softer orange
            else if (layer.includes('primary') || layer.includes('secondary')) {
              map.setPaintProperty(layer, 'line-color', '#FDAE61');
              map.setPaintProperty(layer, 'line-width', 1.8);
            }
            // Minor roads - pale gold
            else {
              map.setPaintProperty(layer, 'line-color', '#FEE08B');
              map.setPaintProperty(layer, 'line-width', 1);
            }
          }
        });

        // Style labels - dark blue-gray for contrast
        const labelLayers = [
          'place-label', 'place-label-other',
          'road-label', 'road-label-simple',
          'poi-label', 'water-label',
          'waterway-label', 'natural-label'
        ];
        
        labelLayers.forEach(layer => {
          if (map.getLayer(layer)) {
            map.setPaintProperty(layer, 'text-color', '#2C3E50');
            map.setPaintProperty(layer, 'text-halo-color', '#FFFFFF');
            map.setPaintProperty(layer, 'text-halo-width', 2);
          }
        });

      } catch (error) {
        console.log('Some map layers not found, continuing...', error);
      }
    };

    // Apply styling when map loads
    if (map.loaded()) {
      setTimeout(applyCustomStyle, 100);
    } else {
      map.once('load', () => setTimeout(applyCustomStyle, 100));
    }

    return () => {
      map.off('load', applyCustomStyle);
    };
  }, []);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'active': return '#00d9bf'; // Teal
      case 'pressure': return '#00a89d'; // Darker teal
      case 'declining': return '#ffb700'; // Amber/orange
      case 'takenOver': return '#ff8c00'; // Dark orange
      case 'closing': return '#ff6b00'; // Burnt orange
      case 'closed': return '#2d3748'; // Dark navy/gray
      default: return '#4a5568';
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
        mapStyle="mapbox://styles/mapbox/light-v11"
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
      <div className="absolute bottom-4 left-4 px-4 py-2 text-sm font-bold uppercase" 
           style={{ 
             backgroundColor: 'rgba(212, 175, 55, 0.15)',
             border: '2px solid #d4af37',
             color: '#f5e6d3'
           }}>
        Showing {displayedBusinesses.length} of {visibleBusinesses.length} businesses
      </div>

      <style jsx global>{`
        .museum-popup .mapboxgl-popup-content {
          background: #1a1a1a;
          color: #f5e6d3;
          border: 3px solid #d4af37;
          font-family: 'Space Mono', monospace;
        }
        
        .museum-popup .mapboxgl-popup-close-button {
          color: #d4af37;
          font-size: 20px;
          padding: 5px 10px;
        }
        
        .museum-popup .mapboxgl-popup-close-button:hover {
          background: rgba(212, 175, 55, 0.1);
        }
      `}</style>
    </div>
  );
};

export default React.memo(TouchMapSimple);