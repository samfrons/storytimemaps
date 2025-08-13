'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
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
  }>
  onMarkerClick: (id: string) => void
  activeMarkerId?: string | null
  currentDate?: Date
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  center,
  zoom,
  markers = [],
  onMarkerClick,
  activeMarkerId,
  currentDate
}) => {
  const mapRef = useRef<React.ComponentRef<typeof Map> | null>(null)
  const [viewState, setViewState] = useState({
    longitude: center[1],
    latitude: center[0],
    zoom: zoom
  })
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const colors = {
    active: '#4a5f7a',
    declining: '#c4a574',
    closed: '#9b6b6b',
    future: '#8a8d91'
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
  }, [markers, currentDate])

  // Get clusters for current viewport
  const clusters = useMemo(() => {
    // For initial load, show all markers if map isn't ready yet
    if (!mapLoaded || !mapRef.current) {
      // Return first 40 markers as individual points for immediate display
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
    }
    
    const bounds = mapRef.current.getBounds()
    if (!bounds) {
      // If bounds aren't available yet, return initial markers
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
      // Fallback to showing raw markers
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
    }
  }, [supercluster, viewState, mapLoaded, markers, currentDate])

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
              background: 'linear-gradient(135deg, #4a5f7a 0%, #6b82a0 100%)',
              color: 'white',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '15px',
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
    const isHovered = properties.id === hoveredMarkerId
    const color = colors[properties.state as keyof typeof colors] || colors.active
    const size = isActive || isHovered ? 36 : 28

    return (
      <Marker
        key={properties.id}
        longitude={lng}
        latitude={lat}
        onClick={() => onMarkerClick(properties.id!)}
        anchor="bottom"
      >
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Tooltip - always visible */}
          <div 
            className={`px-2 py-1 text-xs font-mono shadow-lg backdrop-blur-sm border whitespace-nowrap mb-1 ${
              properties.state === 'declining' ? 'tooltip-label-declining' : 
              properties.state === 'closed' ? 'tooltip-label-closed' : 
              'tooltip-label-active'
            }`}
            style={{
              letterSpacing: '0.02em',
              zIndex: isHovered || isActive ? 1000 : 999
            }}
          >
            <div className="font-medium">{properties.popup}</div>
          </div>
          
          {/* Marker */}
          <div
            className="mapbox-marker"
            style={{
              backgroundColor: color,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transform: isHovered ? 'scale(1.1)' : 'scale(1)'
            }}
            onMouseEnter={() => setHoveredMarkerId(properties.id || null)}
            onMouseLeave={() => setHoveredMarkerId(null)}
          >
            <div
              style={{
                backgroundColor: 'white',
                width: `${size * 0.3}px`,
                height: `${size * 0.3}px`,
                borderRadius: '50%'
              }}
            />
          </div>
        </div>
      </Marker>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden border-l border-border">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={() => setMapLoaded(true)}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        maxZoom={20}
        minZoom={3}
      >
        {/* Render all markers and clusters */}
        {clusters.map(cluster => renderMarker(cluster))}
        
        {/* Navigation controls hidden - using custom controls */}
        <NavigationControl 
          position="top-right" 
          showCompass={false}
          visualizePitch={false}
          style={{ display: 'none' }}
        />
      </Map>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 z-[1] pointer-events-none" />
      
      {/* Custom Zoom Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => {
            mapRef.current?.zoomIn()
          }}
          className="bg-white dark:bg-slate-800 p-2.5 shadow-sm hover:shadow-md transition-all duration-200 border border-border"
          aria-label="Zoom in"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            mapRef.current?.zoomOut()
          }}
          className="bg-white dark:bg-slate-800 p-2.5 shadow-sm hover:shadow-md transition-all duration-200 border border-border"
          aria-label="Zoom out"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default MapboxMap