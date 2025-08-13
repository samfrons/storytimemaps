'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox'
import Supercluster from 'supercluster'

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FtZnJvbnMiLCJhIjoiY21lOTU4cnlxMG5wbjJtcTVtcGc4aWhhaiJ9.V-JWJlxk2hksMuxe0wsolQ'

interface MapboxMapProps {
  center: [number, number]
  zoom: number
  markers?: Array<{
    id: string
    position: [number, number]
    popup: string
    state?: string
    description?: string
    startDate?: string
    endDate?: string
  }>
  onMarkerClick: (id: string) => void
  activeMarkerId?: string | null
  currentDate?: Date
  enrichedStories?: Array<{ id: string; startDate?: string | null; endDate?: string | null; description?: string | null }>
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  center,
  zoom,
  markers = [],
  onMarkerClick,
  activeMarkerId,
  currentDate, // eslint-disable-line @typescript-eslint/no-unused-vars
  enrichedStories = []
}) => {
  const mapRef = useRef<React.ComponentRef<typeof Map> | null>(null)
  const [viewState, setViewState] = useState({
    longitude: center[1],
    latitude: center[0],
    zoom: zoom
  })
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number
    latitude: number
    properties: any
  } | null>(null)

  const colors = {
    active: '#97d8c0',     // Mint green (parks)
    declining: '#ffcb51',  // Golden yellow (arterial roads)
    closed: '#ee5760',     // Coral red (highways)
    future: '#f5cdb4'      // Light peach (local roads)
  }

  // Initialize Supercluster for clustering
  const supercluster = useMemo(() => {
    const index = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minPoints: 2
    })

    if (markers.length > 0) {
      const points: GeoJSON.Feature<GeoJSON.Point, { id: string; popup: string; state: string }>[] = markers.map(marker => ({
        type: 'Feature',
        properties: {
          id: marker.id,
          popup: marker.popup,
          state: marker.state || 'active'
        },
        geometry: {
          type: 'Point',
          coordinates: [marker.position[1], marker.position[0]]
        }
      }))
      index.load(points as Supercluster.PointFeature<Supercluster.AnyProps>[])
    }

    return index
  }, [markers])

  // Pre-compute initial markers for fallback
  const initialMarkers = useMemo(() => {
    return markers.slice(0, 40).map(marker => ({
      type: 'Feature' as const,
      properties: {
        id: marker.id,
        popup: marker.popup,
        state: marker.state || 'active'
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [marker.position[1], marker.position[0]]
      }
    }))
  }, [markers])

  // Get clusters for current viewport with optimized recalculation
  const clusters = useMemo(() => {
    // For initial load, show pre-computed markers if map isn't ready yet
    if (!mapLoaded || !mapRef.current) {
      return initialMarkers
    }
    
    const bounds = mapRef.current.getBounds()
    if (!bounds) {
      return initialMarkers
    }
    
    try {
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ]
      
      return supercluster.getClusters(bbox, Math.floor(viewState.zoom))
    } catch (error) {
      console.warn('Error getting clusters:', error)
      return initialMarkers
    }
  }, [supercluster, viewState.zoom, mapLoaded, initialMarkers])

  // Focus on active marker
  useEffect(() => {
    if (!activeMarkerId || !mapRef.current) return

    const activeMarker = markers.find(m => m.id === activeMarkerId)
    if (activeMarker) {
      mapRef.current.flyTo({
        center: [activeMarker.position[1], activeMarker.position[0]],
        zoom: 14,
        duration: 800
      })
    }
  }, [activeMarkerId, markers])


  const handleClusterClick = useCallback((cluster: { properties: { cluster_id: number } }, lng: number, lat: number) => {
    const expansionZoom = supercluster.getClusterExpansionZoom(cluster.properties.cluster_id)
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: expansionZoom,
      duration: 300
    })
  }, [supercluster])

  const renderMarker = (feature: GeoJSON.Feature<GeoJSON.Point, { cluster?: boolean; cluster_id?: number; point_count?: number; id?: string; popup?: string; state?: string }>) => {
    const [lng, lat] = feature.geometry.coordinates
    const properties = feature.properties

    if (properties.cluster) {
      // Render cluster marker
      return (
        <Marker
          key={`cluster-${properties.cluster_id}`}
          longitude={lng}
          latitude={lat}
          onClick={() => handleClusterClick({ properties: { cluster_id: properties.cluster_id! } }, lng, lat)}
        >
          <div
            className="mapbox-cluster-marker"
            style={{
              backgroundColor: '#eca27d',  // Orange (transit) for clusters
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              fontSize: '12px',
              border: '2px solid white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {properties.point_count}
          </div>
        </Marker>
      )
    }

    // Render individual marker
    const isActive = properties.id === activeMarkerId
    const color = colors[properties.state as keyof typeof colors] || colors.active

    const enrichedStory = enrichedStories.find(s => s.id === properties.id)
    
    return [
      // Always visible label as a Popup
      <Popup
        key={`label-${properties.id}`}
        longitude={lng}
        latitude={lat}
        closeButton={false}
        anchor="bottom"
        offset={[0, -5]}
        className="mapbox-label-popup"
      >
        <div 
          className={`px-2 py-1 text-xs font-mono font-bold whitespace-nowrap cursor-pointer`}
          style={{
            background: properties.state === 'declining' ? 'rgba(255, 203, 81, 0.98)' :
                       properties.state === 'closed' ? 'rgba(238, 87, 96, 0.98)' :
                       'rgba(151, 216, 192, 0.98)',
            color: properties.state === 'closed' ? '#ffffff' : '#2a2a2a',
            border: `1px solid ${
              properties.state === 'declining' ? '#ffcb51' :
              properties.state === 'closed' ? '#ee5760' :
              '#97d8c0'
            }`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}
          onClick={() => {
            onMarkerClick(properties.id!)
            setPopupInfo({
              longitude: lng,
              latitude: lat,
              properties
            })
          }}
        >
          {properties.popup}
        </div>
      </Popup>,
      
      // Marker dot
      <Marker
        key={`marker-${properties.id}`}
        longitude={lng}
        latitude={lat}
        onClick={() => {
          onMarkerClick(properties.id!)
          setPopupInfo({
            longitude: lng,
            latitude: lat,
            properties
          })
        }}
        anchor="center"
      >
        <div
          style={{
            backgroundColor: color,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            transform: isActive ? 'scale(1.5)' : 'scale(1)'
          }}
        />
      </Marker>
    ]
  }

  return (
    <div className="relative h-full w-full overflow-hidden border-l border-[#6b6275]">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={() => {
          setMapLoaded(true)
          // Apply custom style to match color scheme
          const map = mapRef.current?.getMap()
          if (map) {
            try {
              // Get all layers safely
              const style = map.getStyle()
              if (!style || !style.layers) return
              
              const layers = style.layers
              
              // Apply custom colors to layers
              layers.forEach(layer => {
                try {
                  // Water layers
                  if (layer.id.includes('water') && layer.type === 'fill') {
                    map.setPaintProperty(layer.id, 'fill-color', '#5a5766')
                  }
                  
                  // Park/landuse layers
                  if ((layer.id.includes('park') || layer.id.includes('landuse')) && layer.type === 'fill') {
                    map.setPaintProperty(layer.id, 'fill-color', '#97d8c0')
                    map.setPaintProperty(layer.id, 'fill-opacity', 0.2)
                  }
                  
                  // Road layers
                  if (layer.id.includes('road') && layer.type === 'line') {
                    if (layer.id.includes('motorway') || layer.id.includes('trunk')) {
                      map.setPaintProperty(layer.id, 'line-color', '#ee5760')
                    } else if (layer.id.includes('primary') || layer.id.includes('secondary')) {
                      map.setPaintProperty(layer.id, 'line-color', '#ffcb51')
                    } else {
                      map.setPaintProperty(layer.id, 'line-color', '#f5cdb4')
                      map.setPaintProperty(layer.id, 'line-opacity', 0.6)
                    }
                  }
                  
                  // Building layers
                  if (layer.id.includes('building') && layer.type === 'fill') {
                    map.setPaintProperty(layer.id, 'fill-color', '#564b5a')
                    map.setPaintProperty(layer.id, 'fill-opacity', 0.6)
                  }
                  
                  // Text labels
                  if (layer.type === 'symbol') {
                    if (layer.paint) {
                      map.setPaintProperty(layer.id, 'text-color', '#f5cdb4')
                      map.setPaintProperty(layer.id, 'text-halo-color', '#3b3340')
                      map.setPaintProperty(layer.id, 'text-halo-width', 1)
                    }
                  }
                } catch (err) {
                  // Silently skip layers that can't be modified
                  console.debug('Could not modify layer:', layer.id)
                }
              })
            } catch (err) {
              console.warn('Could not apply custom map styles:', err)
            }
          }
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        maxZoom={20}
        minZoom={3}
      >
        {/* Render all markers and clusters */}
        {clusters.flatMap(cluster => renderMarker(cluster))}
        
        {/* Detailed popup on click */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            anchor="top"
            offset={15}
            className="mapbox-detail-popup"
          >
            <div 
              style={{
                minWidth: '200px',
                maxWidth: '300px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.98)',
                color: '#2a2a2a',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <h3 className="font-bold text-sm mb-2" style={{ color: '#2a2a2a' }}>
                {popupInfo.properties.popup}
              </h3>
              {enrichedStories.find(s => s.id === popupInfo.properties.id) && (
                <>
                  <div className="text-xs text-gray-600 mb-2">
                    {enrichedStories.find(s => s.id === popupInfo.properties.id)?.startDate && 
                     enrichedStories.find(s => s.id === popupInfo.properties.id)?.endDate && 
                      `${new Date(enrichedStories.find(s => s.id === popupInfo.properties.id)!.startDate!).getFullYear()} - 
                       ${new Date(enrichedStories.find(s => s.id === popupInfo.properties.id)!.endDate!).getFullYear()}`
                    }
                  </div>
                  {enrichedStories.find(s => s.id === popupInfo.properties.id)?.description && (
                    <p className="text-xs text-gray-700 line-clamp-3">
                      {enrichedStories.find(s => s.id === popupInfo.properties.id)?.description}
                    </p>
                  )}
                  <button 
                    className="text-xs mt-3 text-blue-600 hover:underline cursor-pointer"
                    onClick={() => onMarkerClick(popupInfo.properties.id!)}
                  >
                    View in list →
                  </button>
                </>
              )}
            </div>
          </Popup>
        )}
        
        {/* Navigation controls hidden - using custom controls */}
        <NavigationControl 
          position="top-right" 
          showCompass={false}
          visualizePitch={false}
          style={{ display: 'none' }}
        />
      </Map>
      
      
      {/* Custom Zoom Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => {
            mapRef.current?.zoomIn()
          }}
          className="bg-[#6b6275]/80 p-2.5 shadow-sm hover:shadow-md transition-all duration-200 border border-[#6b6275]"
          aria-label="Zoom in"
        >
          <svg className="w-5 h-5 text-[#f5cdb4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            mapRef.current?.zoomOut()
          }}
          className="bg-[#6b6275]/80 p-2.5 shadow-sm hover:shadow-md transition-all duration-200 border border-[#6b6275]"
          aria-label="Zoom out"
        >
          <svg className="w-5 h-5 text-[#f5cdb4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default React.memo(MapboxMap, (prevProps, nextProps) => {
  return (
    prevProps.center[0] === nextProps.center[0] &&
    prevProps.center[1] === nextProps.center[1] &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.activeMarkerId === nextProps.activeMarkerId &&
    prevProps.currentDate?.getTime() === nextProps.currentDate?.getTime() &&
    JSON.stringify(prevProps.markers) === JSON.stringify(nextProps.markers) &&
    JSON.stringify(prevProps.enrichedStories) === JSON.stringify(nextProps.enrichedStories)
  )
})