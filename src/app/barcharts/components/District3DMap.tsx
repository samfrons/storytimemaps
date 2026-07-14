'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTranslation } from '../../../i18n/useTranslation';

// Get token from environment
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface Business {
  name: string;
  business_type: string;
  category: string;
  address: string;
  registration_date: string;
  liquidation_date: string;
  takeover_date: string;
  coordinates: [number, number];
}

interface District3DMapProps {
  theme?: string;
}

const District3DMap: React.FC<District3DMapProps> = ({ theme }) => {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    byDistrict: {} as Record<string, number>,
    byType: {} as Record<string, number>
  });
  const [viewMode, setViewMode] = useState<'hexbin' | 'towers' | 'particles'>('hexbin');
  const [mounted, setMounted] = useState(false);
  const animationFrame = useRef<number>();

  // Track mounted state to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get theme-appropriate colors
  const getVisualizationColors = () => {
    if (!mounted) return { low: '#97d8c0', medium: '#ffcb51', high: '#ee5760', veryHigh: '#ff0040' };
    
    // Get CSS variable values
    const getColor = (variable: string) => {
      if (typeof window !== 'undefined') {
        return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
      }
      return '';
    };

    return {
      low: getColor('--success') || '#97d8c0',
      medium: getColor('--warning') || '#ffcb51', 
      high: getColor('--danger') || '#ee5760',
      veryHigh: getColor('--secondary') || '#ff0040'
    };
  };

  // Load business data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/jewish_businesses.geojson');
        const geoData = await response.json();
        
        const businessData = geoData.features.map((feature: any) => ({
          ...feature.properties,
          coordinates: feature.geometry.coordinates
        }));
        
        setBusinesses(businessData);
        
        // Calculate statistics
        const districtCounts: Record<string, number> = {};
        const typeCounts: Record<string, number> = {};
        
        businessData.forEach((business: Business) => {
          // Simplified district assignment based on coordinates
          const district = getDistrictFromCoords(business.coordinates);
          districtCounts[district] = (districtCounts[district] || 0) + 1;
          
          const type = business.business_type || 'Unknown';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        setStats({
          total: businessData.length,
          byDistrict: districtCounts,
          byType: typeCounts
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading business data:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Initialize 3D map
  useEffect(() => {
    if (!mapContainer.current || businesses.length === 0 || !mounted || !theme) return;

    // Initialize map with 3D pitch
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'mapbox-streets': {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v8'
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': theme === 'moody' ? '#4a4a57' : 
                                  theme === 'cool' ? '#f0f4f8' :
                                  theme === 'warm' ? '#f5e6d3' :
                                  theme === 'hot' ? '#ff6b6b' :
                                  theme === 'cold' ? '#e3f2fd' :
                                  theme === 'bauhaus' ? '#ffffff' :
                                  theme === 'art-nouveau' ? '#f4e4c1' :
                                  theme === 'archival' ? '#3e4a5c' : '#4a4a57'
            }
          },
          {
            id: 'water',
            type: 'fill',
            source: 'mapbox-streets',
            'source-layer': 'water',
            paint: {
              'fill-color': '#1e3a52',
              'fill-opacity': 0.5
            }
          },
          {
            id: 'buildings-3d',
            type: 'fill-extrusion',
            source: 'mapbox-streets',
            'source-layer': 'building',
            paint: {
              'fill-extrusion-color': '#3a3a4a',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.3
            }
          }
        ]
      },
      center: [13.405, 52.520], // Berlin center
      zoom: 11,
      pitch: 60, // 3D angle
      bearing: -20, // Rotation angle
      accessToken: MAPBOX_TOKEN
    });

    map.current.on('load', () => {
      // Ensure style is fully loaded before adding layers
      const waitForStyle = () => {
        if (map.current && map.current.isStyleLoaded()) {
          // Add visualization layer based on current mode
          addVisualizationLayer();
          
          // Add animation
          startAnimation();
          
          // Add controls
          map.current.addControl(new mapboxgl.NavigationControl({
            visualizePitch: true
          }), 'top-right');
        } else {
          // Retry after a short delay
          setTimeout(waitForStyle, 100);
        }
      };
      
      waitForStyle();
    });

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      map.current?.remove();
    };
  }, [businesses, theme]);

  // Update visualization when view mode changes
  useEffect(() => {
    if (map.current && businesses.length > 0) {
      addVisualizationLayer();
    }
  }, [viewMode, businesses]);

  // Add different visualization layers based on view mode
  const addVisualizationLayer = () => {
    if (!map.current || businesses.length === 0) return;
    
    // Ensure map style is loaded
    if (!map.current.isStyleLoaded()) {
      setTimeout(() => addVisualizationLayer(), 100);
      return;
    }

    // Remove existing layers
    const layersToRemove = ['hexagon-layer', 'hexagon-glow', 'tower-layer', 'particle-layer'];
    layersToRemove.forEach(layerId => {
      if (map.current!.getLayer(layerId)) {
        map.current!.removeLayer(layerId);
      }
    });

    // Remove existing sources
    const sourcesToRemove = ['hexbins', 'towers', 'particles'];
    sourcesToRemove.forEach(sourceId => {
      if (map.current!.getSource(sourceId)) {
        map.current!.removeSource(sourceId);
      }
    });

    if (viewMode === 'hexbin') {
      addHexagonLayer();
    } else if (viewMode === 'towers') {
      addTowerLayer();
    } else if (viewMode === 'particles') {
      addParticleLayer();
    }
  };

  // Add hexagonal clustering with 3D extrusion
  const addHexagonLayer = () => {
    if (!map.current || businesses.length === 0) return;

    // Get theme colors
    const colors = getVisualizationColors();

    // Create hexbin aggregation
    const hexbinData = createHexbinData(businesses);

    // Add source
    map.current.addSource('hexbins', {
      type: 'geojson',
      data: hexbinData
    });

    // Add 3D hexagon layer
    map.current.addLayer({
      id: 'hexagon-layer',
      type: 'fill-extrusion',
      source: 'hexbins',
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['get', 'count'],
          0, colors.low,
          50, colors.medium,
          100, colors.high,
          200, colors.veryHigh
        ],
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['get', 'count'],
          0, 10,
          50, 100,
          100, 300,
          200, 500
        ],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8
      }
    });

    // Add glow effect layer
    map.current.addLayer({
      id: 'hexagon-glow',
      type: 'fill',
      source: 'hexbins',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'count'],
          0, colors.low,
          50, colors.medium,
          100, colors.high,
          200, colors.veryHigh
        ],
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 0.3,
          15, 0.1
        ]
      }
    }, 'hexagon-layer');

    addInteractions('hexagon-layer');
  };

  // Create hexbin data from businesses
  const createHexbinData = (businesses: Business[]) => {
    const hexSize = 0.005; // Size of hexagons in degrees
    const hexbins: Record<string, any> = {};

    businesses.forEach(business => {
      const hexKey = getHexKey(business.coordinates, hexSize);
      if (!hexbins[hexKey]) {
        hexbins[hexKey] = {
          center: getHexCenter(hexKey, hexSize),
          count: 0,
          businesses: []
        };
      }
      hexbins[hexKey].count++;
      hexbins[hexKey].businesses.push(business);
    });

    // Convert to GeoJSON
    const features = Object.values(hexbins).map(hex => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [getHexagonVertices(hex.center, hexSize)]
      },
      properties: {
        count: hex.count,
        businesses: hex.businesses.length
      }
    }));

    return {
      type: 'FeatureCollection' as const,
      features
    };
  };

  // Helper functions for hexagon generation
  const getHexKey = (coords: [number, number], size: number) => {
    const x = Math.floor(coords[0] / size);
    const y = Math.floor(coords[1] / size);
    return `${x},${y}`;
  };

  const getHexCenter = (key: string, size: number) => {
    const [x, y] = key.split(',').map(Number);
    return [(x + 0.5) * size, (y + 0.5) * size] as [number, number];
  };

  const getHexagonVertices = (center: [number, number], size: number): [number, number][] => {
    const vertices: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      vertices.push([
        center[0] + size * Math.cos(angle),
        center[1] + size * Math.sin(angle)
      ]);
    }
    vertices.push(vertices[0]); // Close the polygon
    return vertices;
  };

  // Simplified district detection
  const getDistrictFromCoords = (coords: [number, number]): string => {
    const [lng, lat] = coords;
    
    // Simplified district boundaries (approximate)
    if (lat > 52.54) return 'Pankow';
    if (lat < 52.48 && lng < 13.35) return 'Steglitz';
    if (lat < 52.48 && lng > 13.45) return 'Neukölln';
    if (lng < 13.3) return 'Charlottenburg';
    if (lng > 13.5) return 'Lichtenberg';
    if (lat > 52.52 && lng > 13.38 && lng < 13.42) return 'Mitte';
    if (lat < 52.5 && lng > 13.38 && lng < 13.45) return 'Kreuzberg';
    
    return 'Other';
  };

  // Create circular tower data
  const createTowerData = (businesses: Business[]) => {
    const towerSize = 0.008; // Size of towers
    const towers: Record<string, any> = {};

    businesses.forEach(business => {
      const towerKey = getTowerKey(business.coordinates, towerSize);
      if (!towers[towerKey]) {
        towers[towerKey] = {
          center: getTowerCenter(towerKey, towerSize),
          count: 0,
          businesses: []
        };
      }
      towers[towerKey].count++;
      towers[towerKey].businesses.push(business);
    });

    // Convert to GeoJSON with circular polygons
    const features = Object.values(towers).map(tower => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [getCircleVertices(tower.center, towerSize)]
      },
      properties: {
        count: tower.count,
        businesses: tower.businesses.length
      }
    }));

    return {
      type: 'FeatureCollection' as const,
      features
    };
  };

  // Helper functions for towers
  const getTowerKey = (coords: [number, number], size: number) => {
    const x = Math.floor(coords[0] / size);
    const y = Math.floor(coords[1] / size);
    return `${x},${y}`;
  };

  const getTowerCenter = (key: string, size: number) => {
    const [x, y] = key.split(',').map(Number);
    return [(x + 0.5) * size, (y + 0.5) * size] as [number, number];
  };

  const getCircleVertices = (center: [number, number], radius: number): [number, number][] => {
    const vertices: [number, number][] = [];
    const points = 16; // Number of points for circle approximation
    for (let i = 0; i < points; i++) {
      const angle = (2 * Math.PI * i) / points;
      vertices.push([
        center[0] + radius * Math.cos(angle),
        center[1] + radius * Math.sin(angle)
      ]);
    }
    vertices.push(vertices[0]); // Close the polygon
    return vertices;
  };

  // Add tower-style visualization
  const addTowerLayer = () => {
    if (!map.current || businesses.length === 0) return;

    // Get theme colors
    const colors = getVisualizationColors();

    // Create circular tower data
    const towerData = createTowerData(businesses);

    map.current.addSource('towers', {
      type: 'geojson',
      data: towerData
    });

    map.current.addLayer({
      id: 'tower-layer',
      type: 'fill-extrusion',
      source: 'towers',
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['get', 'count'],
          0, colors.low,
          30, colors.medium,
          60, colors.high,
          100, colors.veryHigh
        ],
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['get', 'count'],
          0, 20,
          30, 200,
          60, 400,
          100, 600
        ],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.9
      }
    });

    addInteractions('tower-layer');
  };

  // Add particle-style visualization
  const addParticleLayer = () => {
    if (!map.current || businesses.length === 0) return;

    // Get theme colors
    const colors = getVisualizationColors();

    // Sample businesses for particle effect (limit for performance)
    const sampledBusinesses = businesses.filter((_, index) => index % 10 === 0).slice(0, 200);
    
    const particleData = {
      type: 'FeatureCollection' as const,
      features: sampledBusinesses.map((business, index) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: business.coordinates
        },
        properties: {
          id: index,
          height: Math.random() * 300 + 50, // Random heights for floating effect
          businesses: 1
        }
      }))
    };

    map.current.addSource('particles', {
      type: 'geojson',
      data: particleData
    });

    // Add multiple layers for particle effect
    map.current.addLayer({
      id: 'particle-layer',
      type: 'circle',
      source: 'particles',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'height'],
          50, 3,
          350, 8
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'height'],
          50, colors.low,
          150, colors.medium,
          250, colors.high,
          350, colors.veryHigh
        ],
        'circle-opacity': 0.8,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff'
      }
    });

    addInteractions('particle-layer');
  };

  // Add interactions to visualization layers
  const addInteractions = (layerId: string) => {
    if (!map.current) return;

    map.current.on('click', layerId, (e) => {
      if (e.features && e.features[0]) {
        const properties = e.features[0].properties;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: monospace; padding: 8px;">
              <strong>Businesses: ${properties?.count || properties?.businesses || 1}</strong><br/>
              <span style="color: var(--foreground-muted);">Click for details</span>
            </div>
          `)
          .addTo(map.current!);
      }
    });

    map.current.on('mouseenter', layerId, () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    
    map.current.on('mouseleave', layerId, () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
  };

  // Animate map rotation
  const startAnimation = () => {
    const animate = () => {
      if (map.current) {
        map.current.setBearing(map.current.getBearing() + 0.1);
        animationFrame.current = requestAnimationFrame(animate);
      }
    };
    // Start slow rotation
    animate();
  };

  // Show loading state until theme and component are ready
  if (!mounted || !theme) {
    return (
      <div className="relative w-full h-[500px] flex items-center justify-center border" style={{ 
        borderColor: 'var(--border)', 
        backgroundColor: 'var(--card-bg)' 
      }}>
        <div className="text-white font-mono">{t('barcharts.3dMap.title')}...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px]">
      {/* 3D Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white font-mono">{t('barcharts.3dMap.title')}...</div>
        </div>
      )}

      {/* Stats Overlay - Glass Morphism Panel */}
      <div className="absolute top-4 left-4 p-4 rounded-lg backdrop-blur-md bg-black bg-opacity-30 border border-white border-opacity-20">
        <h3 className="text-white font-mono font-bold mb-2">{t('barcharts.3dMap.statistics')}</h3>
        <div className="text-white text-sm font-mono space-y-1">
          <div>{t('barcharts.3dMap.totalBusinesses')}: <span className="text-cyan-400">{stats.total}</span></div>
          <div>{t('barcharts.3dMap.districts')}: <span className="text-cyan-400">{Object.keys(stats.byDistrict).length}</span></div>
          <div>{t('barcharts.3dMap.topDistrict')}: <span className="text-cyan-400">
            {Object.entries(stats.byDistrict).sort((a, b) => b[1] - a[1])[0]?.[0]}
          </span></div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setViewMode('hexbin')}
          className={`px-3 py-2 rounded font-mono text-xs backdrop-blur-md border ${
            viewMode === 'hexbin' 
              ? 'bg-cyan-500 bg-opacity-50 text-white border-cyan-400' 
              : 'bg-black bg-opacity-30 text-white border-white border-opacity-20'
          }`}
        >
          {t('barcharts.3dMap.viewModes.hexagonal')}
        </button>
        <button
          onClick={() => setViewMode('towers')}
          className={`px-3 py-2 rounded font-mono text-xs backdrop-blur-md border ${
            viewMode === 'towers' 
              ? 'bg-cyan-500 bg-opacity-50 text-white border-cyan-400' 
              : 'bg-black bg-opacity-30 text-white border-white border-opacity-20'
          }`}
        >
          {t('barcharts.3dMap.viewModes.towers')}
        </button>
        <button
          onClick={() => setViewMode('particles')}
          className={`px-3 py-2 rounded font-mono text-xs backdrop-blur-md border ${
            viewMode === 'particles' 
              ? 'bg-cyan-500 bg-opacity-50 text-white border-cyan-400' 
              : 'bg-black bg-opacity-30 text-white border-white border-opacity-20'
          }`}
        >
          {t('barcharts.3dMap.viewModes.particles')}
        </button>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-4 left-4 right-4 p-3 rounded-lg backdrop-blur-md bg-black bg-opacity-30 border border-white border-opacity-20">
        <div className="text-white text-xs font-mono flex justify-between items-center">
          <span>{t('barcharts.3dMap.instructions')}</span>
          <span className="text-cyan-400">{t('barcharts.3dMap.visualization')}</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(District3DMap);