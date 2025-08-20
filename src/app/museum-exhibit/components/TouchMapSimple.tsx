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

  // Remove old dark styling (replaced with brutalist style below)

  // Smooth zoom animation when activated and reapply styles
  useEffect(() => {
    if (isActive && mapRef.current) {
      const map = mapRef.current.getMap();
      
      // Fly to zoom
      mapRef.current.flyTo({
        zoom: 11,
        duration: 2000,
      });
      
      // Reapply custom styles after activation
      const reapplyStyles = () => {
        if (!map.isStyleLoaded()) return;
        
        const layers = map.getStyle().layers;
        
        // Hide labels
        layers.forEach(layer => {
          if (layer.type === 'symbol') {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
          }
        });
        
        // Reapply colors
        layers.forEach(layer => {
          if (layer.id === 'background') {
            map.setPaintProperty(layer.id, 'background-color', '#282833');
          }
          if (layer.id.includes('water') && layer.type === 'fill') {
            map.setPaintProperty(layer.id, 'fill-color', '#ffecc0');
          }
          if ((layer.id.includes('park') || layer.id.includes('landuse')) && layer.type === 'fill') {
            map.setPaintProperty(layer.id, 'fill-color', '#21212d');
          }
          if (layer.type === 'line' && layer.id.includes('road')) {
            if (layer.id.includes('motorway') || layer.id.includes('trunk') || layer.id.includes('primary')) {
              map.setPaintProperty(layer.id, 'line-color', '#ecc368');
            } else if (layer.id.includes('secondary')) {
              map.setPaintProperty(layer.id, 'line-color', '#cea74f');
            } else {
              map.setPaintProperty(layer.id, 'line-color', '#a1823a');
            }
          }
        });
      };
      
      // Apply immediately and after a delay
      setTimeout(reapplyStyles, 100);
      setTimeout(reapplyStyles, 2500);
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

  // Apply custom dark map styling with gold roads - no labels
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current.getMap();
    let styleApplied = false;
    
    const applyCustomStyle = () => {
      try {
        // Wait for style to be fully loaded
        if (!map.isStyleLoaded()) {
          return;
        }

        console.log('Applying custom map styles...');
        const layers = map.getStyle().layers;
        
        // Hide ALL labels first
        layers.forEach(layer => {
          if (layer.type === 'symbol') {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
          }
        });

        // Apply background color
        layers.forEach(layer => {
          if (layer.id === 'background') {
            map.setPaintProperty(layer.id, 'background-color', '#282833');
          }
        });

        // Style water layers - cream/beige for contrast
        layers.forEach(layer => {
          if (layer.id.includes('water')) {
            if (layer.type === 'fill') {
              map.setPaintProperty(layer.id, 'fill-color', '#ffecc0');
            } else if (layer.type === 'line') {
              map.setPaintProperty(layer.id, 'line-color', '#ffecc0');
            }
          }
        });

        // Style park/landuse layers - darker than land
        layers.forEach(layer => {
          if ((layer.id.includes('park') || layer.id.includes('landuse') || 
               layer.id.includes('landcover') || layer.id.includes('grass')) && 
              layer.type === 'fill') {
            map.setPaintProperty(layer.id, 'fill-color', '#21212d');
            map.setPaintProperty(layer.id, 'fill-opacity', 0.8);
          }
        });

        // Style buildings
        layers.forEach(layer => {
          if (layer.id.includes('building') && layer.type === 'fill') {
            map.setPaintProperty(layer.id, 'fill-color', '#323240');
            map.setPaintProperty(layer.id, 'fill-opacity', 0.5);
          }
        });

        // Style all road layers with golden colors
        layers.forEach(layer => {
          if (layer.type === 'line' && 
              (layer.id.includes('road') || layer.id.includes('street') || 
               layer.id.includes('highway') || layer.id.includes('path'))) {
            
            // Remove any casing
            if (layer.id.includes('case') || layer.id.includes('casing')) {
              map.setLayoutProperty(layer.id, 'visibility', 'none');
              return;
            }
            
            // Major roads - bright gold
            if (layer.id.includes('motorway') || layer.id.includes('trunk') || 
                layer.id.includes('primary')) {
              map.setPaintProperty(layer.id, 'line-color', '#ecc368');
              map.setPaintProperty(layer.id, 'line-width', [
                'interpolate', ['linear'], ['zoom'],
                10, 2,
                15, 6
              ]);
            }
            // Medium roads
            else if (layer.id.includes('secondary') || layer.id.includes('tertiary')) {
              map.setPaintProperty(layer.id, 'line-color', '#cea74f');
              map.setPaintProperty(layer.id, 'line-width', [
                'interpolate', ['linear'], ['zoom'],
                10, 1,
                15, 4
              ]);
            }
            // Small streets
            else if (layer.id.includes('street') || layer.id.includes('minor') || 
                     layer.id.includes('service') || layer.id.includes('link')) {
              map.setPaintProperty(layer.id, 'line-color', '#a1823a');
              map.setPaintProperty(layer.id, 'line-width', [
                'interpolate', ['linear'], ['zoom'],
                10, 0.5,
                15, 2
              ]);
            }
            // Paths
            else if (layer.id.includes('path') || layer.id.includes('pedestrian')) {
              map.setPaintProperty(layer.id, 'line-color', '#7a6230');
              map.setPaintProperty(layer.id, 'line-width', 1);
            }
            // Default for any other roads
            else {
              map.setPaintProperty(layer.id, 'line-color', '#8a7040');
              map.setPaintProperty(layer.id, 'line-width', 1.5);
            }
          }
        });

        // Style transit
        layers.forEach(layer => {
          if (layer.type === 'line' && layer.id.includes('transit')) {
            map.setPaintProperty(layer.id, 'line-color', '#deaf44');
            map.setPaintProperty(layer.id, 'line-opacity', 0.6);
          }
        });

        // Style admin boundaries
        layers.forEach(layer => {
          if (layer.type === 'line' && 
              (layer.id.includes('admin') || layer.id.includes('boundary'))) {
            map.setPaintProperty(layer.id, 'line-color', '#3a3a3a');
            map.setPaintProperty(layer.id, 'line-opacity', 0.3);
          }
        });

        styleApplied = true;
        console.log('Map styling applied successfully');

      } catch (error) {
        console.error('Error applying map styles:', error);
      }
    };

    // Apply styles whenever the map style changes or loads
    const onStyleData = () => {
      if (!styleApplied && map.isStyleLoaded()) {
        applyCustomStyle();
      }
    };

    // Listen for multiple events to catch style changes
    map.on('styledata', onStyleData);
    map.on('style.load', applyCustomStyle);
    map.on('load', applyCustomStyle);
    
    // Initial application
    if (map.loaded() && map.isStyleLoaded()) {
      applyCustomStyle();
    }

    // Also apply on idle to catch any missed events
    const onIdle = () => {
      if (!styleApplied && map.isStyleLoaded()) {
        applyCustomStyle();
      }
    };
    map.once('idle', onIdle);

    // Cleanup
    return () => {
      map.off('styledata', onStyleData);
      map.off('style.load', applyCustomStyle);
      map.off('load', applyCustomStyle);
      map.off('idle', onIdle);
    };
  }, []);

  // Apply brutalist abstract art styling
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current.getMap();
    
    const applyBrutalistStyle = () => {
      try {
        // Set white background
        if (map.getLayer('background')) {
          map.setPaintProperty('background', 'background-color', '#FFFFFF');
        }

        // Style water - bright teal/turquoise
        if (map.getLayer('water')) {
          map.setPaintProperty('water', 'fill-color', '#00D9D9');
        }
        if (map.getLayer('waterway')) {
          map.setPaintProperty('waterway', 'line-color', '#00D9D9');
          map.setPaintProperty('waterway', 'line-width', 4);
        }

        // Style parks/green spaces - bright purple/lavender
        ['park', 'landuse', 'landcover', 'national_park'].forEach(layer => {
          if (map.getLayer(layer)) {
            map.setPaintProperty(layer, 'fill-color', '#C589E8');
            map.setPaintProperty(layer, 'fill-opacity', 1);
          }
        });

        // Style buildings - bright yellow blocks
        if (map.getLayer('building')) {
          map.setPaintProperty('building', 'fill-color', '#FFD93D');
          map.setPaintProperty('building', 'fill-opacity', 1);
          map.setPaintProperty('building', 'fill-outline-color', '#000000');
        }

        // Style roads with bright orange
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
            // All roads - bright orange
            map.setPaintProperty(layer, 'line-color', '#FF6B35');
            map.setPaintProperty(layer, 'line-width', layer.includes('motorway') || layer.includes('trunk') ? 8 : 4);
          }
        });

        // HIDE ALL LABELS for abstract art effect
        const labelLayers = [
          'country-label', 'state-label', 'settlement-major-label', 'settlement-minor-label',
          'place-city-large-n', 'place-city-medium-n', 'place-city-small-n',
          'place-neighbourhood', 'place-other', 'poi-label', 'road-label',
          'waterway-label', 'natural-point-label', 'transit-label',
          'place-label', 'place-label-other', 'road-label-simple',
          'water-label', 'natural-label'
        ];
        
        labelLayers.forEach(layer => {
          if (map.getLayer(layer)) {
            map.setLayoutProperty(layer, 'visibility', 'none');
          }
        });

        // Remove road casings for cleaner look
        const roadCasingLayers = [
          'road-primary-case', 'road-secondary-tertiary-case',
          'road-minor-case', 'road-street-case',
          'road-trunk-case', 'road-motorway-case'
        ];

        roadCasingLayers.forEach(layer => {
          if (map.getLayer(layer)) {
            map.setLayoutProperty(layer, 'visibility', 'none');
          }
        });

      } catch (error) {
        console.log('Some map layers not found, continuing...', error);
      }
    };

    // Apply styling when map loads
    if (map.loaded()) {
      setTimeout(applyBrutalistStyle, 100);
    } else {
      map.once('load', () => setTimeout(applyBrutalistStyle, 100));
    }

    return () => {
      map.off('load', applyBrutalistStyle);
    };
  }, []);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'active': return '#00D9D9'; // Bright teal
      case 'pressure': return '#FFD93D'; // Bright yellow
      case 'declining': return '#FFD93D'; // Bright yellow
      case 'takenOver': return '#FF6B35'; // Bright orange
      case 'closing': return '#FF6B35'; // Bright orange
      case 'closed': return '#C589E8'; // Bright purple
      default: return '#000000';
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
                
                {/* Main marker square - brutalist style */}
                <div
                  className="relative transition-all duration-300"
                  style={{
                    width: isSelected ? '24px' : isHovered ? '20px' : '16px',
                    height: isSelected ? '24px' : isHovered ? '20px' : '16px',
                    backgroundColor: color,
                    border: '2px solid #000000',
                    boxShadow: `0 0 ${isSelected ? '20px' : '8px'} ${color}`,
                    opacity: business.status === 'closed' ? 0.7 : 1,
                    transform: `scale(${isHovered ? 1.2 : 1})`,
                  }}
                />
                
                {/* Hover tooltip */}
                {isHovered && (
                  <div
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 text-sm whitespace-nowrap pointer-events-none z-50"
                    style={{ 
                      minWidth: '180px',
                      backgroundColor: '#FFFFFF',
                      border: '4px solid #000000',
                      color: '#000000'
                    }}
                  >
                    <div className="font-black uppercase">{business.type}</div>
                    <div className="font-bold">{business.district}</div>
                    <div className="font-bold">Est. {business.establishedYear}</div>
                    {business.status === 'closed' && (
                      <div className="font-bold" style={{ color: '#C589E8' }}>Closed {business.closedYear}</div>
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
              className="brutalist-popup"
            >
              <div className="p-6" style={{ backgroundColor: '#FFFFFF', border: '4px solid #000000' }}>
                <h3 className="text-xl font-black uppercase mb-3" style={{ color: '#000000' }}>{business.type}</h3>
                <p className="text-lg font-bold mb-3" style={{ color: '#000000' }}>{business.district}, Berlin</p>
                <div className="text-sm space-y-2">
                  <div className="font-bold">Established: {business.establishedYear}</div>
                  {business.status === 'closed' && (
                    <div className="font-bold" style={{ color: '#C589E8' }}>Forced closure: {business.closedYear}</div>
                  )}
                  <div className="mt-3 pt-3" style={{ borderTop: '4px solid #000000' }}>
                    <div className="p-2" style={{ backgroundColor: getMarkerColor(business.status), border: '2px solid #000000' }}>
                      <span className="font-black uppercase" style={{ color: '#000000' }}>
                        Status: {business.status === 'active' ? 'Operating' :
                         business.status === 'pressure' ? 'Under Pressure' :
                         business.status === 'declining' ? 'Declining' :
                         business.status === 'takenOver' ? 'Taken Over' :
                         business.status === 'closing' ? 'Being Liquidated' :
                         'Closed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          );
        })()}
      </Map>

      {/* Marker count indicator */}
      <div className="absolute bottom-4 left-4 px-4 py-2 text-sm font-black uppercase" 
           style={{ 
             backgroundColor: 'rgba(26, 26, 26, 0.95)',
             border: '3px solid #ecc368',
             color: '#ecc368'
           }}>
        Showing {displayedBusinesses.length} of {visibleBusinesses.length} businesses
      </div>

    </div>
  );
};

export default React.memo(TouchMapSimple);