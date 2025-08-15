'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox'
import Supercluster from 'supercluster'
import { useTheme } from 'next-themes'

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FtZnJvbnMiLCJhIjoiY21lOTU4cnlxMG5wbjJtcTVtcGc4aWhhaiJ9.V-JWJlxk2hksMuxe0wsolQ'

// Get custom map style for each theme
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getThemeMapStyle = (theme: string | undefined): any => {
  switch(theme) {
    case 'bauhaus':
      return {
        version: 8,
        sources: {
          'mapbox': {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v8'
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#f5f5f0'
            }
          },
          {
            id: 'water',
            type: 'fill',
            source: 'mapbox',
            'source-layer': 'water',
            paint: {
              'fill-color': '#0066ff',
              'fill-opacity': 0.4
            }
          },
          {
            id: 'parks',
            type: 'fill',
            source: 'mapbox',
            'source-layer': 'landuse',
            filter: ['==', 'class', 'park'],
            paint: {
              'fill-color': '#ffcc00',
              'fill-opacity': 0.3
            }
          },
          {
            id: 'buildings',
            type: 'fill',
            source: 'mapbox',
            'source-layer': 'building',
            paint: {
              'fill-color': '#000000',
              'fill-opacity': 0.2
            }
          },
          {
            id: 'roads',
            type: 'line',
            source: 'mapbox',
            'source-layer': 'road',
            paint: {
              'line-color': '#000000',
              'line-width': 2
            }
          }
        ]
      }
    
    case 'cold':
      return 'mapbox://styles/mapbox/light-v11' // We'll customize this after load
    
    case 'cool':
      return 'mapbox://styles/mapbox/light-v11' // We'll customize this after load
    
    case 'warm':
      return 'mapbox://styles/mapbox/outdoors-v12' // We'll customize this after load
    
    case 'hot':
      return 'mapbox://styles/mapbox/light-v11' // We'll customize this after load for Bloody Water style
    
    case 'art-nouveau':
      return 'mapbox://styles/mapbox/outdoors-v12' // We'll customize this after load
    
    default: // moody
      return 'mapbox://styles/mapbox/dark-v11' // We'll customize this after load
  }
}

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
          active: '#e4525e',
          declining: '#ff8c00', // Orange to match the UI
          closed: '#cc0000',
          future: '#cccccc'
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
    
    // For hot theme, ensure styles are applied after map is ready
    if (theme === 'hot') {
      const applyHotTheme = () => {
        const style = map.getStyle()
        if (style && style.layers) {
          // Force re-application of hot theme
          setTimeout(() => {
            map.resize()
          }, 100)
        }
      }
      
      // Listen for style load events
      map.on('style.load', applyHotTheme)
      
      // Also apply immediately if style is already loaded
      if (map.isStyleLoaded()) {
        applyHotTheme()
      }
      
      // Cleanup
      return () => {
        map.off('style.load', applyHotTheme)
      }
    }
    
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
              water: '#3d3d4e', // Dark gray/blue for water
              park: '#6b1f2a', // Very dark red for parks
              road: '#c85464', // Pink/coral roads
              background: '#8b2635' // Dark red background
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
          // Water layers - Special handling for Bloody Water theme
          if (layer.id.includes('water') && layer.type === 'fill') {
            map.setPaintProperty(layer.id, 'fill-color', mapColors.water)
            map.setPaintProperty(layer.id, 'fill-opacity', theme === 'hot' ? 1 : theme === 'bauhaus' ? 0.4 : theme === 'cold' ? 0.5 : 0.8)
          }
          
          // Park/landuse layers - Light gray for hot theme
          if ((layer.id.includes('park') || layer.id.includes('landuse')) && layer.type === 'fill') {
            map.setPaintProperty(layer.id, 'fill-color', mapColors.park)
            map.setPaintProperty(layer.id, 'fill-opacity', theme === 'hot' ? 0.95 : theme === 'bauhaus' ? 0.3 : theme === 'cold' ? 0.15 : 0.2)
          }
          
          // Special handling for hot theme - Dark red with dark water
          if (theme === 'hot') {
            // Set background and land layers to dark red
            if (layer.id === 'background' && layer.type === 'background') {
              map.setPaintProperty(layer.id, 'background-color', '#8b2635')
            }
            if (layer.id.includes('land') && layer.type === 'fill') {
              map.setPaintProperty(layer.id, 'fill-color', '#923640')
              map.setPaintProperty(layer.id, 'fill-opacity', 1)
            }
            
            // Grass and nature areas in darker red
            if ((layer.id.includes('grass') || layer.id.includes('wood') || layer.id.includes('forest')) && layer.type === 'fill') {
              map.setPaintProperty(layer.id, 'fill-color', '#6b1f2a')
              map.setPaintProperty(layer.id, 'fill-opacity', 1)
            }
            
            // Waterways in dark gray/blue
            if (layer.id.includes('waterway') && layer.type === 'line') {
              map.setPaintProperty(layer.id, 'line-color', '#3d3d4e')
              map.setPaintProperty(layer.id, 'line-width', 3)
              map.setPaintProperty(layer.id, 'line-opacity', 1)
            }
            
            // Administrative boundaries in pink
            if (layer.id.includes('admin') && layer.type === 'line') {
              map.setPaintProperty(layer.id, 'line-color', '#c85464')
              map.setPaintProperty(layer.id, 'line-opacity', 0.4)
              map.setPaintProperty(layer.id, 'line-width', 1)
            }
            
            // Railway lines in coral
            if ((layer.id.includes('rail') || layer.id.includes('transit')) && layer.type === 'line') {
              map.setPaintProperty(layer.id, 'line-color', '#c85464')
              map.setPaintProperty(layer.id, 'line-opacity', 0.6)
            }
            
            // Tunnels and bridges in coral
            if ((layer.id.includes('tunnel') || layer.id.includes('bridge')) && layer.type === 'line') {
              map.setPaintProperty(layer.id, 'line-color', '#c85464')
              map.setPaintProperty(layer.id, 'line-opacity', 0.5)
            }
            
            // Hide ALL text labels including street names
            if (layer.type === 'symbol') {
              map.setLayoutProperty(layer.id, 'visibility', 'none')
            }
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
            } else if (theme === 'hot') {
              // Dark theme - coral/pink roads for contrast
              map.setPaintProperty(layer.id, 'line-color', '#c85464')
              map.setPaintProperty(layer.id, 'line-opacity', 0.7)
              if (layer.id.includes('motorway') || layer.id.includes('trunk')) {
                map.setPaintProperty(layer.id, 'line-width', 2)
                map.setPaintProperty(layer.id, 'line-color', '#d67383')
              } else if (layer.id.includes('primary') || layer.id.includes('secondary')) {
                map.setPaintProperty(layer.id, 'line-width', 1.5)
                map.setPaintProperty(layer.id, 'line-color', '#c85464')
              } else {
                map.setPaintProperty(layer.id, 'line-width', 1)
                map.setPaintProperty(layer.id, 'line-color', '#b94455')
              }
            } else if (theme === 'bauhaus') {
              // Bauhaus uses bold black lines
              map.setPaintProperty(layer.id, 'line-color', '#000000')
              map.setPaintProperty(layer.id, 'line-width', 2)
            } else if (theme === 'cold') {
              // Cold theme uses subtle gray lines
              map.setPaintProperty(layer.id, 'line-color', '#b0bec5')
              map.setPaintProperty(layer.id, 'line-opacity', 0.7)
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
            if (theme === 'hot') {
              // Dark theme - very dark red buildings
              map.setPaintProperty(layer.id, 'fill-color', '#6b1f2a')
              map.setPaintProperty(layer.id, 'fill-opacity', 0.95)
              // Building outlines in red
              if (layer.id.includes('outline')) {
                map.setPaintProperty(layer.id, 'line-color', '#ff9999')
                map.setPaintProperty(layer.id, 'line-opacity', 0.8)
              }
            } else if (theme === 'bauhaus') {
              map.setPaintProperty(layer.id, 'fill-color', '#000000')
              map.setPaintProperty(layer.id, 'fill-opacity', 0.2)
            } else if (theme === 'cold') {
              map.setPaintProperty(layer.id, 'fill-color', '#cfd8dc')
              map.setPaintProperty(layer.id, 'fill-opacity', 0.3)
            } else {
              map.setPaintProperty(layer.id, 'fill-color', '#564b5a')
              map.setPaintProperty(layer.id, 'fill-opacity', 0.6)
            }
          }
          
          // Text labels
          if (layer.type === 'symbol') {
            if (theme === 'hot') {
              // Hide ALL labels for hot theme
              map.setLayoutProperty(layer.id, 'visibility', 'none')
            } else if (layer.paint) {
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
      
      // Get theme-appropriate color for popup arrow
      const colors = getThemeColors()
      let color = colors.active || '#97d8c0' // Use theme's active color
      if (state === 'declining') color = colors.declining || 'rgba(255, 203, 81, 0.98)'
      if (state === 'closed') color = colors.closed || 'rgba(238, 87, 96, 0.98)'
      
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

  // Get cluster style based on theme
  const getClusterStyle = () => {
    switch(theme) {
      case 'moody':
        return {
          backgroundColor: '#f5cdb4',
          border: '3px solid #6b6275',
          color: '#2a2a2a'
        }
      case 'cool':
        return {
          backgroundColor: '#4a90e2',
          border: '3px solid white',
          color: 'white'
        }
      case 'warm':
        return {
          backgroundColor: '#d67b5a',
          border: '3px solid white',
          color: 'white'
        }
      case 'hot':
        return {
          backgroundColor: '#e4525e',
          border: '3px solid white',
          color: 'white'
        }
      case 'cold':
        return {
          backgroundColor: '#64b5f6',
          border: '3px solid white',
          color: 'white'
        }
      case 'bauhaus':
        return {
          backgroundColor: '#ffcc00',
          border: '3px solid #000000',
          color: '#000000'
        }
      case 'art-nouveau':
        return {
          backgroundColor: '#8b7355',
          border: '3px solid white',
          color: 'white'
        }
      default: // moody
        return {
          backgroundColor: '#f5cdb4',
          border: '3px solid #6b6275',
          color: '#2a2a2a'
        }
    }
  }

  const renderMarker = (feature: GeoJSON.Feature<GeoJSON.Point, { cluster?: boolean; cluster_id?: number; point_count?: number; id?: string; popup?: string; state?: string }>) => {
    if (!feature || !feature.geometry || !feature.geometry.coordinates) {
      return null
    }
    const [lng, lat] = feature.geometry.coordinates
    const properties = feature.properties || {}

    if (properties.cluster) {
      const size = 30 + (properties.point_count! / markers.length) * 30
      const clusterStyle = getClusterStyle()
      
      // Special shapes for Bauhaus clusters
      if (theme === 'bauhaus') {
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
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: clusterStyle.backgroundColor,
                color: clusterStyle.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                border: clusterStyle.border,
                boxShadow: '4px 4px 0px #000000',
                transform: 'rotate(45deg)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(45deg) scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(45deg) scale(1)'}
            >
              <span style={{ transform: 'rotate(-45deg)' }}>{properties.point_count}</span>
            </div>
          </Marker>
        )
      }
      
      // Render cluster marker for other themes
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
              backgroundColor: clusterStyle.backgroundColor,
              color: clusterStyle.color,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              fontSize: '14px',
              border: clusterStyle.border,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
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
          className={`px-2 py-1 text-xs font-mono ${theme === 'bauhaus' ? 'font-black uppercase' : theme === 'cool' || theme === 'cold' ? 'font-semibold' : 'font-bold'} whitespace-nowrap cursor-pointer transition-opacity duration-200`}
          style={{
            background: theme === 'cool' || theme === 'cold' ? 'rgba(255, 255, 255, 0.95)' : 
                       theme === 'bauhaus' ? '#ffffff' : (
              properties.state === 'declining' ? `${colors.declining}e8` :
              properties.state === 'closed' ? `${colors.closed}e8` :
              `${colors.active}e8`
            ),
            color: theme === 'cool' || theme === 'cold' ? color :
                   theme === 'bauhaus' ? color : 
                   (properties.state === 'closed' ? '#ffffff' : '#2a2a2a'),
            border: theme === 'bauhaus' ? `3px solid ${color}` : 
                    theme === 'cool' || theme === 'cold' ? `2px solid ${color}` :
                    `1px solid ${color}`,
            boxShadow: theme === 'bauhaus' ? '3px 3px 0px #000000' : 
                       theme === 'cool' || theme === 'cold' ? '0 2px 6px rgba(0,0,0,0.1)' :
                       '0 2px 6px rgba(0,0,0,0.2)',
            letterSpacing: theme === 'bauhaus' ? '0.1em' : 'normal',
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
            width: theme === 'bauhaus' && isActive ? '20px' : theme === 'bauhaus' ? '14px' : '8px',
            height: theme === 'bauhaus' && isActive ? '20px' : theme === 'bauhaus' ? '14px' : '8px',
            clipPath: theme === 'bauhaus' ? (
              properties.state === 'closed' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : // Triangle
              properties.state === 'declining' ? 'none' : // Square
              'circle(50%)' // Circle
            ) : undefined,
            borderRadius: theme === 'bauhaus' ? '0' : '50%',
            border: theme === 'bauhaus' ? '2px solid #000000' : '2px solid white',
            boxShadow: theme === 'bauhaus' ? '2px 2px 0px #000000' : '0 2px 4px rgba(0,0,0,0.3)',
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
          // Don't apply custom styles if using Bauhaus (it has its own complete style)
          if (theme === 'bauhaus') return
          
          // Apply custom style to match color scheme for other themes
          const map = mapRef.current?.getMap()
          
          // Force theme update after a small delay to ensure map is fully loaded
          if (map && theme === 'hot') {
            setTimeout(() => {
              // Trigger a fake resize event to force redraw
              map.resize()
            }, 100)
          }
          
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
                      water: '#3d3d4e',
                      park: '#6b1f2a',
                      road: '#c85464',
                      background: '#8b2635'
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
                    map.setPaintProperty(layer.id, 'fill-opacity', theme === 'bauhaus' ? 0.4 : theme === 'cold' ? 0.5 : 0.8)
                  }
                  
                  // Park/landuse layers
                  if ((layer.id.includes('park') || layer.id.includes('landuse')) && layer.type === 'fill') {
                    map.setPaintProperty(layer.id, 'fill-color', mapColors.park)
                    map.setPaintProperty(layer.id, 'fill-opacity', theme === 'bauhaus' ? 0.3 : theme === 'cold' ? 0.15 : 0.2)
                  }
                  
                  // Road layers
                  if (layer.id.includes('road') && layer.type === 'line') {
                    if (theme === 'bauhaus') {
                      // Bauhaus uses bold black lines
                      map.setPaintProperty(layer.id, 'line-color', '#000000')
                      map.setPaintProperty(layer.id, 'line-width', 2)
                    } else if (theme === 'cold') {
                      // Cold theme uses subtle gray lines
                      map.setPaintProperty(layer.id, 'line-color', '#b0bec5')
                      map.setPaintProperty(layer.id, 'line-opacity', 0.7)
                    } else {
                      // Default moody theme colors
                      if (layer.id.includes('motorway') || layer.id.includes('trunk')) {
                        map.setPaintProperty(layer.id, 'line-color', '#ee5760')
                      } else if (layer.id.includes('primary') || layer.id.includes('secondary')) {
                        map.setPaintProperty(layer.id, 'line-color', '#ffcb51')
                      } else {
                        map.setPaintProperty(layer.id, 'line-color', '#f5cdb4')
                        map.setPaintProperty(layer.id, 'line-opacity', 0.6)
                      }
                    }
                  }
                  
                  // Building layers
                  if (layer.id.includes('building') && layer.type === 'fill') {
                    if (theme === 'bauhaus') {
                      map.setPaintProperty(layer.id, 'fill-color', '#000000')
                      map.setPaintProperty(layer.id, 'fill-opacity', 0.2)
                    } else if (theme === 'cold') {
                      map.setPaintProperty(layer.id, 'fill-color', '#cfd8dc')
                      map.setPaintProperty(layer.id, 'fill-opacity', 0.3)
                    } else {
                      map.setPaintProperty(layer.id, 'fill-color', '#564b5a')
                      map.setPaintProperty(layer.id, 'fill-opacity', 0.6)
                    }
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
        mapStyle={getThemeMapStyle(theme)}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        maxZoom={20}
        minZoom={3}
      >
        {/* Render all markers and clusters */}
        {mapLoaded && clusters && clusters.length > 0 && clusters.flatMap(cluster => renderMarker(cluster))}
        
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
          className="p-2.5 shadow-sm hover:shadow-md transition-all duration-200 border zoom-button"
          style={{
            backgroundColor: 'rgba(var(--muted-rgb), 0.8)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)'
          }}
          aria-label="Zoom in"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            mapRef.current?.zoomOut()
          }}
          className="p-2.5 shadow-sm hover:shadow-md transition-all duration-200 border zoom-button"
          style={{
            backgroundColor: 'rgba(var(--muted-rgb), 0.8)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)'
          }}
          aria-label="Zoom out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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