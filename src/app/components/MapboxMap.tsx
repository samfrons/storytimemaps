'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox'
import Supercluster from 'supercluster'
import { useTheme } from 'next-themes'

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
  const { theme } = useTheme()
  const [viewState, setViewState] = useState({
    longitude: center[1],
    latitude: center[0],
    zoom: zoom
  })
  const [mapLoaded, setMapLoaded] = useState(false)
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number
    latitude: number
    properties: {
      id?: string
      popup?: string
      state?: string
      description?: string | null
      startDate?: string | null
      endDate?: string | null
      [key: string]: unknown
    }
  } | null>(null)
  const [labelOpacity, setLabelOpacity] = useState(1)

  // Theme-specific colors
  const getThemeColors = () => {
    switch(theme) {
      case 'cool':
        return {
          active: '#4a90e2',
          declining: '#f5a623',
          closed: '#d0021b',
          future: '#95a5a6'
        }
      case 'warm':
        return {
          active: '#d67b5a',
          declining: '#ff8c00',
          closed: '#cd5c5c',
          future: '#bcaaa4'
        }
      case 'hot':
        return {
          active: '#ff4444',
          declining: '#ff6600',
          closed: '#cc0000',
          future: '#ffc1cc'
        }
      case 'cold':
        return {
          active: '#64b5f6',
          declining: '#90a4ae',
          closed: '#607d8b',
          future: '#b0bec5'
        }
      case 'bauhaus':
        return {
          active: '#0066ff',
          declining: '#ffcc00',
          closed: '#ff0000',
          future: '#666666'
        }
      case 'art-nouveau':
        return {
          active: '#8b7355',
          declining: '#daa520',
          closed: '#704214',
          future: '#a1887f'
        }
      default: // moody
        return {
          active: '#97d8c0',
          declining: '#ffcb51',
          closed: '#ee5760',
          future: '#f5cdb4'
        }
    }
  }

  const colors = getThemeColors()

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
    // Always return initial markers if map is not ready
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
      
      const clusteredMarkers = supercluster.getClusters(bbox, Math.floor(viewState.zoom))
      // Ensure we always have markers to render
      return clusteredMarkers.length > 0 ? clusteredMarkers : initialMarkers
    } catch (error) {
      console.warn('Error getting clusters:', error)
      return initialMarkers
    }
  }, [supercluster, viewState.zoom, mapLoaded, initialMarkers])

  // Focus on active marker and open popup when list item is clicked
  useEffect(() => {
    if (!activeMarkerId || !mapRef.current) return

    const activeMarker = markers.find(m => m.id === activeMarkerId)
    if (activeMarker) {
      // Fly to the marker
      mapRef.current.flyTo({
        center: [activeMarker.position[1], activeMarker.position[0]],
        zoom: 14,
        duration: 800
      })
      
      // Open the popup for this marker
      const enrichedStory = enrichedStories.find(s => s.id === activeMarkerId)
      setPopupInfo({
        longitude: activeMarker.position[1],
        latitude: activeMarker.position[0],
        properties: {
          id: activeMarker.id,
          popup: activeMarker.popup,
          state: activeMarker.state,
          ...enrichedStory
        }
      })
    }
  }, [activeMarkerId, markers, enrichedStories])

  // Fade labels when popup is open - removed to prevent labels disappearing
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    
    const map = mapRef.current.getMap()
    if (!map) return
    
    // Set label opacity based on popup state
    setLabelOpacity(popupInfo ? 0.6 : 1)
  }, [popupInfo, mapLoaded])

  // Re-apply theme colors when theme changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    
    const map = mapRef.current.getMap()
    if (!map) return
    
    try {
      const style = map.getStyle()
      if (!style || !style.layers) return
      
      const layers = style.layers
      
      // Get theme-specific map colors
      const getMapColors = () => {
        switch(theme) {
          case 'cool':
            return {
              water: '#4a90e2',
              park: '#7ed321',
              road: '#2c3e50',
              background: '#f0f4f8'
            }
          case 'warm':
            return {
              water: '#8b4513',
              park: '#9acd32',
              road: '#5d4037',
              background: '#f4f1e8'
            }
          case 'hot':
            return {
              water: '#ff4444',
              park: '#ff9500',
              road: '#8b0000',
              background: '#fff5f5'
            }
          case 'cold':
            return {
              water: '#64b5f6',
              park: '#81c784',
              road: '#263238',
              background: '#e8f4f8'
            }
          case 'bauhaus':
            return {
              water: '#0066ff',
              park: '#ffcc00',
              road: '#000000',
              background: '#f5f5f0'
            }
          case 'art-nouveau':
            return {
              water: '#556b2f',
              park: '#6b8e23',
              road: '#3e2723',
              background: '#f8f6f0'
            }
          default: // moody
            return {
              water: '#5a5766',
              park: '#97d8c0',
              road: '#4a4a57',
              background: '#4a4a57'
            }
        }
      }
      
      const mapColors = getMapColors()
      
      // Apply custom colors to layers
      layers.forEach(layer => {
        try {
          // Water layers
          if (layer.id.includes('water') && layer.type === 'fill') {
            map.setPaintProperty(layer.id, 'fill-color', mapColors.water)
            map.setPaintProperty(layer.id, 'fill-opacity', theme === 'bauhaus' ? 0.4 : 0.8)
          }
          
          // Park/landuse layers
          if ((layer.id.includes('park') || layer.id.includes('landuse')) && layer.type === 'fill') {
            map.setPaintProperty(layer.id, 'fill-color', mapColors.park)
            map.setPaintProperty(layer.id, 'fill-opacity', theme === 'bauhaus' ? 0.3 : 0.2)
          }
          
          // Road layers  
          if (layer.id.includes('road') && layer.type === 'line') {
            if (theme === 'moody') {
              // Use original colors for moody theme
              if (layer.id.includes('motorway') || layer.id.includes('trunk')) {
                map.setPaintProperty(layer.id, 'line-color', '#ee5760')
              } else if (layer.id.includes('primary') || layer.id.includes('secondary')) {
                map.setPaintProperty(layer.id, 'line-color', '#ffcb51')
              } else {
                map.setPaintProperty(layer.id, 'line-color', '#f5cdb4')
                map.setPaintProperty(layer.id, 'line-opacity', 0.6)
              }
            } else {
              // Use theme colors for other themes
              if (layer.id.includes('motorway') || layer.id.includes('trunk')) {
                map.setPaintProperty(layer.id, 'line-color', colors.closed)
              } else if (layer.id.includes('primary') || layer.id.includes('secondary')) {
                map.setPaintProperty(layer.id, 'line-color', colors.declining)
              } else {
                map.setPaintProperty(layer.id, 'line-color', mapColors.road)
                map.setPaintProperty(layer.id, 'line-opacity', 0.6)
              }
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
        } catch (e) {
          // Silently ignore layer errors
        }
      })
    } catch (e) {
      console.warn('Error updating map theme:', e)
    }
  }, [theme, mapLoaded, colors])

  // Fix popup arrow color after popup renders
  useEffect(() => {
    if (!popupInfo) return

    const timer = setTimeout(() => {
      const popupTips = document.querySelectorAll('.mapboxgl-popup-tip')
      const state = popupInfo.properties.state || 'active'
      
      let color = 'rgba(151, 216, 192, 0.98)' // default green
      if (state === 'declining') color = 'rgba(255, 203, 81, 0.98)'
      if (state === 'closed') color = 'rgba(238, 87, 96, 0.98)'
      
      popupTips.forEach(tip => {
        const tipElement = tip as HTMLElement
        tipElement.style.borderTopColor = color
        tipElement.style.borderBottomColor = color  
        tipElement.style.borderLeftColor = color
        tipElement.style.borderRightColor = color
      })
    }, 50) // Small delay to ensure DOM is ready

    return () => clearTimeout(timer)
  }, [popupInfo])


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

    return [
      // Always visible label as a Marker
      <Marker
        key={`label-${properties.id}`}
        longitude={lng}
        latitude={lat}
        anchor="bottom"
        offset={[0, -10]}
      >
        <div 
          className={`px-2 py-1 text-xs font-mono font-bold whitespace-nowrap cursor-pointer transition-opacity duration-200`}
          style={{
            background: properties.state === 'declining' ? `${colors.declining}e8` :
                       properties.state === 'closed' ? `${colors.closed}e8` :
                       `${colors.active}e8`,
            color: properties.state === 'closed' ? '#ffffff' : '#2a2a2a',
            border: `1px solid ${
              properties.state === 'declining' ? colors.declining :
              properties.state === 'closed' ? colors.closed :
              colors.active
            }`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            opacity: labelOpacity,
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            e.stopPropagation()
            onMarkerClick(properties.id!)
            const enrichedStory = enrichedStories.find(s => s.id === properties.id) || {}
            setPopupInfo({
              longitude: lng,
              latitude: lat,
              properties: {
                ...properties,
                ...enrichedStory
              }
            })
          }}
        >
          {properties.popup}
        </div>
      </Marker>,
      
      // Marker dot
      <Marker
        key={`marker-${properties.id}`}
        longitude={lng}
        latitude={lat}
        onClick={() => {
          onMarkerClick(properties.id!)
          const enrichedStory = enrichedStories.find(s => s.id === properties.id)
          setPopupInfo({
            longitude: lng,
            latitude: lat,
            properties: {
              ...properties,
              ...enrichedStory
            }
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
        onClick={(evt) => {
          // Only close popup if clicking on empty map area (not on markers)
          if (!evt.features || evt.features.length === 0) {
            // Don't do anything that would cause re-render and lose labels
            // Just optionally close the popup
            if (popupInfo) {
              setPopupInfo(null)
            }
          }
        }}
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
              
              // Get theme-specific map colors
              const getMapColors = () => {
                switch(theme) {
                  case 'cool':
                    return {
                      water: '#4a90e2',
                      park: '#7ed321',
                      road: '#2c3e50',
                      background: '#f0f4f8'
                    }
                  case 'warm':
                    return {
                      water: '#8b4513',
                      park: '#9acd32',
                      road: '#5d4037',
                      background: '#f4f1e8'
                    }
                  case 'hot':
                    return {
                      water: '#ff4444',
                      park: '#ff9500',
                      road: '#8b0000',
                      background: '#fff5f5'
                    }
                  case 'cold':
                    return {
                      water: '#64b5f6',
                      park: '#81c784',
                      road: '#263238',
                      background: '#e8f4f8'
                    }
                  case 'bauhaus':
                    return {
                      water: '#0066ff',
                      park: '#ffcc00',
                      road: '#000000',
                      background: '#f5f5f0'
                    }
                  case 'art-nouveau':
                    return {
                      water: '#556b2f',
                      park: '#6b8e23',
                      road: '#3e2723',
                      background: '#f8f6f0'
                    }
                  default: // moody
                    return {
                      water: '#5a5766',
                      park: '#97d8c0',
                      road: '#4a4a57',
                      background: '#4a4a57'
                    }
                }
              }
              
              const mapColors = getMapColors()
              
              // Apply custom colors to layers
              layers.forEach(layer => {
                try {
                  // Water layers
                  if (layer.id.includes('water') && layer.type === 'fill') {
                    map.setPaintProperty(layer.id, 'fill-color', mapColors.water)
                    map.setPaintProperty(layer.id, 'fill-opacity', theme === 'bauhaus' ? 0.4 : 0.8)
                  }
                  
                  // Park/landuse layers
                  if ((layer.id.includes('park') || layer.id.includes('landuse')) && layer.type === 'fill') {
                    map.setPaintProperty(layer.id, 'fill-color', mapColors.park)
                    map.setPaintProperty(layer.id, 'fill-opacity', theme === 'bauhaus' ? 0.3 : 0.2)
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
            className={`mapbox-detail-popup popup-state-${popupInfo.properties.state || 'active'}`}
          >
            <div 
              style={{
                minWidth: '200px',
                maxWidth: '300px',
                padding: '14px',
                background: popupInfo.properties.state === 'declining' ? `${colors.declining}fa` :
                           popupInfo.properties.state === 'closed' ? `${colors.closed}fa` :
                           `${colors.active}fa`,
                color: popupInfo.properties.state === 'closed' ? '#ffffff' : '#2a2a2a',
                fontFamily: 'Space Mono, monospace',
                border: `2px solid ${
                  popupInfo.properties.state === 'declining' ? colors.declining :
                  popupInfo.properties.state === 'closed' ? colors.closed :
                  colors.active
                }`
              }}
            >
              <h3 className="font-bold text-base mb-2" style={{ 
                color: popupInfo.properties.state === 'closed' ? '#ffffff' : '#2a2a2a',
                fontFamily: 'Space Mono, monospace'
              }}>
                {popupInfo.properties.popup}
              </h3>
              {popupInfo.properties && (
                <>
                  <div className="text-xs mb-2" style={{ 
                    opacity: 0.8,
                    color: popupInfo.properties.state === 'closed' ? '#ffffff' : '#2a2a2a'
                  }}>
                    {popupInfo.properties.startDate && 
                     popupInfo.properties.endDate && 
                      `${new Date(popupInfo.properties.startDate).getFullYear()} - 
                       ${new Date(popupInfo.properties.endDate).getFullYear()}`
                    }
                  </div>
                  {popupInfo.properties.description && (
                    <p className="text-xs line-clamp-3" style={{ 
                      color: popupInfo.properties.state === 'closed' ? '#ffffff' : '#2a2a2a',
                      opacity: 0.9
                    }}>
                      {popupInfo.properties.description}
                    </p>
                  )}
                  <div 
                    className="text-xs mt-3 font-bold cursor-pointer"
                    style={{
                      color: popupInfo.properties.state === 'closed' ? '#ffffff' : '#2a2a2a',
                      textDecoration: 'underline',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      padding: 0
                    }}
                    onClick={() => {
                      // Find the story in the list and trigger view details
                      const storyElement = document.querySelector(`[data-story-id="${popupInfo.properties.id}"]`);
                      if (storyElement) {
                        const viewDetailsButton = storyElement.querySelector('.view-details-button') as HTMLElement;
                        if (viewDetailsButton) {
                          viewDetailsButton.click();
                        }
                      }
                      setPopupInfo(null);
                    }}
                  >
                    View more →
                  </div>
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