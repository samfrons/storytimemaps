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
  }, [supercluster, viewState, mapLoaded, markers])

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
    const isHovered = properties.id === hoveredMarkerId
    const color = colors[properties.state as keyof typeof colors] || colors.active
    const size = isActive || isHovered ? 36 : 28
    
    // Get enriched story data for enhanced tooltip
    const enrichedStory = enrichedStories.find(s => s.id === properties.id)
    const showEnhanced = isActive && enrichedStory

    return (
      <Marker
        key={properties.id}
        longitude={lng}
        latitude={lat}
        onClick={() => onMarkerClick(properties.id!)}
        anchor="bottom"
      >
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Enhanced Tooltip when active, regular tooltip otherwise */}
          <div 
            className={`text-xs font-mono shadow-lg backdrop-blur-sm border transition-all duration-300 tooltip-label ${
              properties.state === 'declining' ? 'tooltip-label-declining' : 
              properties.state === 'closed' ? 'tooltip-label-closed' : 
              'tooltip-label-active'
            } ${showEnhanced ? 'p-3 max-w-xs' : 'px-2 py-1 whitespace-nowrap'}`}
            style={{
              letterSpacing: '0.02em',
              transform: showEnhanced ? 'scale(1.05)' : 'scale(1)',
              marginBottom: '0px'
            }}
          >
            <div className="font-semibold">{properties.popup}</div>
            {showEnhanced && (
              <>
                <div className="text-xs text-muted mt-1">
                  {enrichedStory.startDate && enrichedStory.endDate && 
                    `${new Date(enrichedStory.startDate).getFullYear()} - ${new Date(enrichedStory.endDate).getFullYear()}`
                  }
                </div>
                {enrichedStory.description && (
                  <div className="text-xs mt-2 text-foreground line-clamp-3">
                    {enrichedStory.description}
                  </div>
                )}
                <div className="text-xs mt-2 text-[#97d8c0] font-semibold cursor-pointer hover:underline">
                  View in list →
                </div>
              </>
            )}
          </div>
          
          {/* Connected line and dot pointer */}
          <div style={{ position: 'relative' }}>
            {/* Angled line pointer */}
            <div 
              style={{
                width: '3px',
                height: '20px',
                backgroundColor: properties.state === 'declining' ? '#ffcb51' : 
                                properties.state === 'closed' ? '#ee5760' : '#97d8c0',
                transform: 'rotate(15deg)',
                transformOrigin: 'bottom',
                opacity: 0.95
              }}
            />
            
            {/* Precise location dot - positioned at the bottom of the line */}
            <div
              style={{
                backgroundColor: properties.state === 'declining' ? '#ffcb51' : 
                                properties.state === 'closed' ? '#ee5760' : '#97d8c0',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                cursor: 'pointer',
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
              onMouseEnter={() => setHoveredMarkerId(properties.id || null)}
              onMouseLeave={() => setHoveredMarkerId(null)}
              onClick={() => onMarkerClick(properties.id!)}
            />
          </div>
        </div>
      </Marker>
    )
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
        {clusters.map(cluster => renderMarker(cluster))}
        
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

export default MapboxMap