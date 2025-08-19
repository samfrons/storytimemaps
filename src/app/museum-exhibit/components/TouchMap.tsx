'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Map, { Source, Layer } from 'react-map-gl/mapbox';
import type { MapMouseEvent } from 'react-map-gl/mapbox';
import { processBusinessesForDate, toGeoJSON, getBusinessStatistics } from '../services/dataLoader';
import { rafThrottle, FPSMonitor } from '../utils/performance';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoic2FtZnJvbnMiLCJhIjoiY21lOTU4cnlxMG5wbjJtcTVtcGc4aWhhaiJ9.V-JWJlxk2hksMuxe0wsolQ';

interface TouchMapProps {
  currentDate: Date;
  onBusinessSelect: (id: string | null) => void;
  selectedBusiness: string | null;
  isActive: boolean;
  onStatsUpdate?: (stats: any) => void;
}

const TouchMap: React.FC<TouchMapProps> = ({ 
  currentDate, 
  onBusinessSelect, 
  selectedBusiness,
  isActive,
  onStatsUpdate 
}) => {
  const mapRef = useRef<any>(null);
  const [businessData, setBusinessData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCluster, setHoveredCluster] = useState<Record<string, any> | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 13.4050,
    latitude: 52.5200,
    zoom: isActive ? 11.5 : 11,
    pitch: 0,
    bearing: 0,
  });
  const fpsMonitor = useRef(new FPSMonitor());

  // Load and process business data
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const businesses = await processBusinessesForDate(currentDate);
        const geojson = toGeoJSON(businesses);
        
        if (mounted) {
          setBusinessData(geojson);
          
          // Update statistics
          const stats = await getBusinessStatistics(currentDate);
          onStatsUpdate?.(stats);
        }
      } catch (error) {
        console.error('Failed to load business data:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, [currentDate, onStatsUpdate]);

  // Smooth zoom animation when activated
  useEffect(() => {
    if (isActive && mapRef.current) {
      const map = mapRef.current.getMap();
      map.flyTo({
        zoom: 11.5,
        duration: 2000,
        essential: true,
      });
    }
  }, [isActive]);

  // Auto-pan animation when inactive
  useEffect(() => {
    if (!isActive) return;
    
    const updateBearing = rafThrottle(() => {
      setViewState(prev => ({
        ...prev,
        bearing: (prev.bearing + 0.05) % 360,
      }));
    });
    
    const interval = setInterval(updateBearing, 50);

    return () => clearInterval(interval);
  }, [isActive]);

  // Layer styles for clusters and points
  const clusterLayer = {
    id: 'clusters',
    type: 'circle' as const,
    source: 'businesses',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#22c55e', // green for small clusters
        50,
        '#eab308', // yellow for medium
        100,
        '#f97316', // orange for large
        500,
        '#dc2626'  // red for very large
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20, // small cluster
        50,
        30, // medium cluster
        100,
        40, // large cluster
        500,
        50  // very large cluster
      ],
      'circle-opacity': 0.8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-opacity': 0.5
    }
  };

  const clusterCountLayer = {
    id: 'cluster-count',
    type: 'symbol' as const,
    source: 'businesses',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 16
    },
    paint: {
      'text-color': '#ffffff'
    }
  };

  const unclusteredPointLayer = {
    id: 'unclustered-point',
    type: 'circle' as const,
    source: 'businesses',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'match',
        ['get', 'status'],
        'active', '#22c55e',
        'declining', '#eab308',
        'takenOver', '#f97316',
        'liquidated', '#dc2626',
        '#6b7280'
      ],
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 2,
        12, 4,
        14, 8,
        16, 12
      ],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-opacity': 0.8,
      'circle-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 0.6,
        14, 0.9
      ]
    }
  };

  // Handle click on clusters or points
  const handleMapClick = useCallback((event: MapMouseEvent) => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    
    const features = map.queryRenderedFeatures(event.point, {
      layers: ['clusters', 'unclustered-point']
    });
    
    if (features.length === 0) {
      onBusinessSelect(null);
      return;
    }
    
    const feature = features[0];
    
    if (feature.properties.cluster) {
      // Clicked on a cluster - zoom in
      const clusterId = feature.properties.cluster_id;
      const source = map.getSource('businesses');
      
      source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
        if (err) return;
        
        map.flyTo({
          center: feature.geometry.coordinates,
          zoom: zoom + 1,
          duration: 1000
        });
      });
    } else {
      // Clicked on a point
      onBusinessSelect(feature.properties.id);
      
      map.flyTo({
        center: feature.geometry.coordinates,
        zoom: 14,
        duration: 1000
      });
    }
  }, [onBusinessSelect]);

  // Handle hover effects
  const handleMouseMove = useCallback((event: MapMouseEvent) => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    
    const features = map.queryRenderedFeatures(event.point, {
      layers: ['clusters', 'unclustered-point']
    });
    
    map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
    
    if (features.length > 0) {
      const feature = features[0];
      setHoveredCluster(feature.properties);
    } else {
      setHoveredCluster(null);
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-white text-2xl animate-pulse">Loading 10,021 businesses...</div>
        </div>
      )}
      
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={['clusters', 'unclustered-point']}
        touchZoomRotate={true}
        touchPitch={false}
        dragRotate={false}
        keyboard={false}
        doubleClickZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Add clustered data source and layers */}
        {businessData && (
          <Source
            id="businesses"
            type="geojson"
            data={businessData}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
            clusterProperties={{
              // Calculate dominant status in cluster
              activeCount: ['+', ['case', ['==', ['get', 'status'], 'active'], 1, 0]],
              decliningCount: ['+', ['case', ['==', ['get', 'status'], 'declining'], 1, 0]],
              takenOverCount: ['+', ['case', ['==', ['get', 'status'], 'takenOver'], 1, 0]],
              liquidatedCount: ['+', ['case', ['==', ['get', 'status'], 'liquidated'], 1, 0]]
            }}
          >
            <Layer {...clusterLayer as any} />
            <Layer {...clusterCountLayer as any} />
            <Layer {...unclusteredPointLayer as any} />
          </Source>
        )}
          
      </Map>

      {/* Hover tooltip */}
      {hoveredCluster && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 backdrop-blur-lg px-6 py-3 pointer-events-none z-40">
          {hoveredCluster.cluster ? (
            <div className="text-white text-center">
              <div className="text-2xl font-bold">{hoveredCluster.point_count}</div>
              <div className="text-sm text-gray-400">businesses in this area</div>
              <div className="text-xs text-gray-500 mt-1">Click to zoom in</div>
            </div>
          ) : (
            <div className="text-white">
              <div className="font-semibold">{hoveredCluster.title}</div>
              <div className="text-sm text-gray-400">{hoveredCluster.address}</div>
              <div className="text-xs mt-1" style={{ color: hoveredCluster.color }}>
                {hoveredCluster.status === 'active' ? 'Active Business' :
                 hoveredCluster.status === 'declining' ? 'Under Pressure' :
                 hoveredCluster.status === 'takenOver' ? 'Taken Over' :
                 'Liquidated'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FPS Counter (development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-green-400 px-3 py-1 font-mono text-sm">
          FPS: {fpsMonitor.current.getFPS()}
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