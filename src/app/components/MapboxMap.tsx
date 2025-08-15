'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox'
import Supercluster from 'supercluster'
import { useTheme } from 'next-themes'
import mapboxgl from 'mapbox-gl'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

if (!MAPBOX_TOKEN) {
  console.error('Mapbox token is not configured. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local file')
}

// Snazzy Maps "Red Colored" style conversion for hot theme
const getSnazzyRedColoredStyle = () => {
  return {
    version: 8 as const,
    name: 'Red Colored - Snazzy Maps',
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
          'background-color': '#96000e' // Main red from Snazzy Maps
        }
      },
      {
        id: 'water',
        type: 'fill',
        source: 'mapbox',
        'source-layer': 'water',
        paint: {
          'fill-color': '#2a0b0d', // Dark red-brown water
          'fill-opacity': 1
        }
      },
      {
        id: 'landuse-park',
        type: 'fill',
        source: 'mapbox',
        'source-layer': 'landuse',
        filter: ['==', 'class', 'park'],
        paint: {
          'fill-color': '#5f0006', // Dark red parks
          'fill-opacity': 1
        }
      },
      {
        id: 'building',
        type: 'fill',
        source: 'mapbox',
        'source-layer': 'building',
        paint: {
          'fill-color': '#7a0a11', // Slightly lighter red buildings
          'fill-opacity': 0.9,
          'fill-outline-color': '#5f0006'
        }
      },
      {
        id: 'road-highway',
        type: 'line',
        source: 'mapbox',
        'source-layer': 'road',
        filter: ['in', 'class', 'motorway', 'trunk'],
        paint: {
          'line-color': '#b93f3f', // Bright red highways
          'line-width': {
            base: 1.5,
            stops: [[8, 0.5], [10, 1], [12, 3], [16, 8], [20, 18]]
          },
          'line-opacity': 1
        }
      },
      {
        id: 'road-local',
        type: 'line',
        source: 'mapbox',
        'source-layer': 'road',
        filter: ['in', 'class', 'street', 'street_limited', 'primary', 'secondary'],
        paint: {
          'line-color': '#8e895e', // Brownish roads
          'line-width': {
            base: 1.5,
            stops: [[12, 0.5], [14, 1], [16, 3], [20, 8]]
          },
          'line-opacity': 1
        }
      }
    ]
  }
}

// Get custom map style for each theme
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getThemeMapStyle = (theme: string | undefined): any => {
  switch(theme) {
    case 'bauhaus':
      return {
        version: 8 as const,
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
              'background-color': '#ffffff' // white background for Bauhaus
            }
          },
          {
            id: 'water',
            type: 'fill',
            source: 'mapbox',
            'source-layer': 'water',
            paint: {
              'fill-color': '#0066cc', // primary blue
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
              'fill-color': '#ffcc00', // yellow
              'fill-opacity': 0.3
            }
          },
          {
            id: 'buildings',
            type: 'fill',
            source: 'mapbox',
            'source-layer': 'building',
            paint: {
              'fill-color': '#000000', // black
              'fill-opacity': 0.2
            }
          },
          {
            id: 'roads',
            type: 'line',
            source: 'mapbox',
            'source-layer': 'road',
            paint: {
              'line-color': '#cc0000', // red
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
      return getSnazzyRedColoredStyle() // Use complete Snazzy Maps "Red Colored" style
    
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
  const [, setWebglReady] = useState(false) // Track WebGL readiness for context loss handling
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

  // Get colors from CSS variables - client-side only
  const [colors, setColors] = useState({
    active: '#97d8c0',
    declining: '#ffcb51',
    closed: '#ee5760',
    future: '#f5cdb4'
  })

  // Extract theme colors on client-side to prevent SSR mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const style = getComputedStyle(document.documentElement);
      setColors({
        active: style.getPropertyValue('--success').trim() || '#97d8c0',
        declining: style.getPropertyValue('--warning').trim() || '#ffcb51', 
        closed: style.getPropertyValue('--danger').trim() || '#ee5760',
        future: style.getPropertyValue('--foreground-muted').trim() || '#f5cdb4'
      })
    }
  }, [theme])

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


  // Enhanced WebGL-synchronized theme application
  const applyThemeStyles = useCallback((map: mapboxgl.Map, forceRender = false) => {
    // Hot theme and Bauhaus use complete custom styles, no additional styling needed
    if (theme === 'hot' || theme === 'bauhaus') {
      if (forceRender) {
        // Force WebGL render cycle for custom themes
        map.triggerRepaint()
      }
      return
    }
    
    try {
      const style = map.getStyle()
      if (!style || !style.layers) return
      
      const layers = style.layers
      
      // Get theme-specific map colors from CSS variables - client-side only
      const getMapColors = () => {
        if (typeof window === 'undefined') {
          // Return fallback colors for SSR
          return {
            water: '#5a5766',
            park: '#97d8c0',
            road: '#4a4a57',
            background: '#4a4a57'
          }
        }
        
        const style = getComputedStyle(document.documentElement);
        // For moody theme, use a darker purple for water
        const waterColor = theme === 'moody' 
          ? '#5a5766' // Dark purple-gray for moody theme water
          : style.getPropertyValue('--accent-purple').trim() || '#5a5766';
        
        return {
          water: waterColor,
          park: style.getPropertyValue('--success').trim() || '#97d8c0', 
          road: style.getPropertyValue('--foreground').trim() || '#4a4a57',
          background: style.getPropertyValue('--background').trim() || '#4a4a57'
        }
      }
      
      const mapColors = getMapColors()
      let styleChangesApplied = false
      
      // Apply custom colors to layers with batch operations
      layers.forEach(layer => {
        try {
          let layerModified = false
          
          // Water layers
          if (layer.id.includes('water') && layer.type === 'fill') {
            map.setPaintProperty(layer.id, 'fill-color', mapColors.water)
            map.setPaintProperty(layer.id, 'fill-opacity', theme === 'cold' ? 0.5 : 0.8)
            layerModified = true
          }
          
          // Park/landuse layers
          if ((layer.id.includes('park') || layer.id.includes('landuse')) && layer.type === 'fill') {
            map.setPaintProperty(layer.id, 'fill-color', mapColors.park)
            map.setPaintProperty(layer.id, 'fill-opacity', theme === 'cold' ? 0.15 : 0.2)
            layerModified = true
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
            } else if (theme === 'cold') {
              // Cold theme uses subtle gray lines
              map.setPaintProperty(layer.id, 'line-color', mapColors.road)
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
            layerModified = true
          }
          
          // Building layers
          if (layer.id.includes('building') && layer.type === 'fill') {
            if (theme === 'cold') {
              map.setPaintProperty(layer.id, 'fill-color', mapColors.background)
              map.setPaintProperty(layer.id, 'fill-opacity', 0.3)
            } else {
              map.setPaintProperty(layer.id, 'fill-color', mapColors.background)
              map.setPaintProperty(layer.id, 'fill-opacity', 0.6)
            }
            layerModified = true
          }
          
          // Text labels - need special handling for immediate rendering
          if (layer.type === 'symbol') {
            let textColor = '#f5cdb4'
            let haloColor = '#3b3340'
            
            if (typeof window !== 'undefined') {
              const style = getComputedStyle(document.documentElement);
              textColor = style.getPropertyValue('--foreground').trim() || '#f5cdb4'
              haloColor = style.getPropertyValue('--accent-navy').trim() || '#3b3340'
            }
            
            // Apply text styling to all symbol layers
            try {
              map.setPaintProperty(layer.id, 'text-color', textColor)
              map.setPaintProperty(layer.id, 'text-halo-color', haloColor)
              map.setPaintProperty(layer.id, 'text-halo-width', 1)
              
              // Also handle icon colors for symbol layers with icons
              if (layer.layout && layer.layout['icon-image']) {
                map.setPaintProperty(layer.id, 'icon-color', textColor)
                map.setPaintProperty(layer.id, 'icon-halo-color', haloColor)
                map.setPaintProperty(layer.id, 'icon-halo-width', 1)
              }
              
              layerModified = true
            } catch (e) {
              // Some properties might not exist for all symbol layers
            }
          }
          
          if (layerModified) {
            styleChangesApplied = true
          }
        } catch (e) {
          // Silently ignore layer errors
        }
      })
      
      // Force WebGL render cycle after style changes
      if (styleChangesApplied || forceRender) {
        // Multiple render triggers to ensure WebGL synchronization
        map.triggerRepaint()
        
        // Force symbol layer update multiple times to ensure labels render
        const updateSymbolLayers = () => {
          const style = map.getStyle()
          if (style && style.layers) {
            let textColor = '#f5cdb4'
            let haloColor = '#3b3340'
            
            if (typeof window !== 'undefined') {
              const computedStyle = getComputedStyle(document.documentElement)
              textColor = computedStyle.getPropertyValue('--foreground').trim() || '#f5cdb4'
              haloColor = computedStyle.getPropertyValue('--accent-navy').trim() || '#3b3340'
            }
            
            style.layers.forEach(layer => {
              if (layer.type === 'symbol') {
                try {
                  map.setPaintProperty(layer.id, 'text-color', textColor)
                  map.setPaintProperty(layer.id, 'text-halo-color', haloColor)
                  map.setPaintProperty(layer.id, 'text-halo-width', 1)
                } catch (e) {
                  // Ignore errors for layers that don't support these properties
                }
              }
            })
            map.triggerRepaint()
          }
        }
        
        // Apply symbol updates immediately
        updateSymbolLayers()
        
        // Then again after idle for safety
        map.once('idle', () => {
          updateSymbolLayers()
        })
        
        // And once more after a delay to catch any late-loading labels
        setTimeout(() => {
          updateSymbolLayers()
        }, 200)
        
        // Additional render force using requestAnimationFrame for better timing
        requestAnimationFrame(() => {
          map.triggerRepaint()
          
          // Final render after a slight delay to ensure all WebGL operations complete
          setTimeout(() => {
            map.triggerRepaint()
          }, 16) // ~1 frame at 60fps
        })
      }
    } catch (e) {
      console.warn('Error updating map theme:', e)
    }
  }, [theme, colors])

  // Re-apply theme colors when theme changes with WebGL synchronization
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    
    const map = mapRef.current.getMap()
    if (!map) return
    
    // Handle style changes that require full reloads (like switching between custom and standard styles)
    const handleStyleLoad = () => {
      try {
        // Wait for style to be completely loaded
        if (!map.isStyleLoaded()) {
          setTimeout(handleStyleLoad, 50)
          return
        }
        
        // Apply theme styles with force render
        applyThemeStyles(map, true)
        
        // Force multiple repaints to ensure labels update
        const forceLabelsUpdate = () => {
          map.triggerRepaint()
          
          // Update labels specifically
          const style = map.getStyle()
          if (style && style.layers) {
            let textColor = '#f5cdb4'
            let haloColor = '#3b3340'
            
            if (typeof window !== 'undefined') {
              const computedStyle = getComputedStyle(document.documentElement)
              textColor = computedStyle.getPropertyValue('--foreground').trim() || '#f5cdb4'
              haloColor = computedStyle.getPropertyValue('--accent-navy').trim() || '#3b3340'
            }
            
            style.layers.forEach(layer => {
              if (layer.type === 'symbol') {
                try {
                  map.setPaintProperty(layer.id, 'text-color', textColor)
                  map.setPaintProperty(layer.id, 'text-halo-color', haloColor)
                  map.setPaintProperty(layer.id, 'text-halo-width', 1)
                } catch (e) {
                  // Ignore
                }
              }
            })
          }
          
          map.triggerRepaint()
        }
        
        // Immediate update
        forceLabelsUpdate()
        
        // Update after a frame
        requestAnimationFrame(forceLabelsUpdate)
        
        // Update after map is idle
        map.once('idle', forceLabelsUpdate)
        
        // Final update after delay
        setTimeout(forceLabelsUpdate, 100)
        setTimeout(forceLabelsUpdate, 300)
        
      } catch (err) {
        console.warn('Error during theme style change:', err)
        // Fallback: try to trigger repaint anyway
        try {
          map.triggerRepaint()
        } catch (fallbackErr) {
          console.warn('Fallback repaint also failed:', fallbackErr)
        }
      }
    }
    
    // Remove any existing style event listeners to prevent duplicates
    map.off('style.load', handleStyleLoad)
    
    // Listen for style load events (happens when switching between themes)
    map.on('style.load', handleStyleLoad)
    
    // Also trigger immediately in case style is already loaded
    handleStyleLoad()
    
    // Cleanup
    return () => {
      map.off('style.load', handleStyleLoad)
    }
  }, [theme, mapLoaded, applyThemeStyles])
  
  // Handle WebGL context loss/restore
  useEffect(() => {
    if (!mapRef.current) return
    
    const map = mapRef.current.getMap()
    if (!map) return
    
    const handleContextLost = () => {
      console.warn('WebGL context lost, will restore styles when context is restored')
      setWebglReady(false)
    }
    
    const handleContextRestored = () => {
      // WebGL context restored, reapplying styles
      setWebglReady(true)
      // Reapply styles after context restoration
      setTimeout(() => {
        applyThemeStyles(map, true)
      }, 100)
    }
    
    const canvas = map.getCanvas()
    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)
    
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
    }
  }, [mapLoaded, applyThemeStyles])

  // Fix popup arrow color after popup renders
  useEffect(() => {
    if (!popupInfo) return

    const timer = setTimeout(() => {
      const popupTips = document.querySelectorAll('.mapboxgl-popup-tip')
      const state = popupInfo.properties.state || 'active'
      
      // Get theme-appropriate color for popup arrow (use current colors state)
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
  }, [popupInfo, colors.active, colors.declining, colors.closed])


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
          className={`px-2 py-1 text-xs font-mono ${theme === 'bauhaus' ? 'font-black uppercase' : theme === 'cool' || theme === 'cold' ? 'font-semibold' : 'font-bold'} whitespace-nowrap cursor-pointer`}
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
            opacity: popupInfo && popupInfo.properties.id !== properties.id ? 0.8 : 1,
            transition: 'opacity 300ms ease-in-out',
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


  // Show error state if no Mapbox token
  if (!MAPBOX_TOKEN) {
    return (
      <div className="relative h-full w-full overflow-hidden border-l border-[#6b6275] flex items-center justify-center">
        <div className="text-center p-8" style={{ color: 'var(--foreground)' }}>
          <h3 className="text-lg font-bold mb-2">Map Configuration Error</h3>
          <p className="text-sm opacity-80">
            Mapbox token is missing. Please configure NEXT_PUBLIC_MAPBOX_TOKEN in the deployment environment.
          </p>
        </div>
      </div>
    )
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
          const map = mapRef.current?.getMap()
          if (!map) return
          
          // Set map as loaded first
          setMapLoaded(true)
          
          // Ensure WebGL context is ready for rendering
          const checkWebGLReady = () => {
            try {
              const canvas = map.getCanvas()
              const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
              if (gl && gl instanceof WebGLRenderingContext && !gl.isContextLost()) {
                setWebglReady(true)
                return true
              }
              return false
            } catch (err) {
              console.warn('WebGL context check failed:', err)
              return false
            }
          }
          
          // Wait for WebGL context to be fully ready before applying styles
          const applyInitialStyles = () => {
            try {
              // Ensure map style is fully loaded
              if (!map.isStyleLoaded()) {
                // If style isn't loaded yet, wait for it
                map.once('styledata', applyInitialStyles)
                return
              }
              
              // Check if WebGL is ready
              if (!checkWebGLReady()) {
                // Retry WebGL check after a brief delay
                setTimeout(applyInitialStyles, 16)
                return
              }
              
              // Apply theme styles with forced render for immediate display
              applyThemeStyles(map, true)
              
              // Additional safety: ensure styles are visible immediately
              // This addresses the WebGL synchronization issue
              requestAnimationFrame(() => {
                map.triggerRepaint()
                
                // Final render trigger to ensure all WebGL operations complete
                setTimeout(() => {
                  map.triggerRepaint()
                }, 50) // Slightly longer delay for initial load
              })
            } catch (err) {
              console.warn('Could not apply initial map styles:', err)
            }
          }
          
          // Start the style application process
          applyInitialStyles()
          
          // Handle WebGL context loss and restoration for label rendering
          const canvas = map.getCanvas()
          canvas.addEventListener('webglcontextlost', () => {
            console.warn('WebGL context lost')
            setWebglReady(false)
          })
          
          canvas.addEventListener('webglcontextrestored', () => {
            // WebGL context restored
            setWebglReady(true)
            // Reapply styles after context restoration
            setTimeout(() => applyThemeStyles(map, true), 100)
          })
          
          // Listen for style changes to reapply symbol layer styles
          map.on('styledata', () => {
            // When style data changes, ensure labels are updated
            setTimeout(() => {
              const style = map.getStyle()
              if (style && style.layers) {
                let textColor = '#f5cdb4'
                let haloColor = '#3b3340'
                
                if (typeof window !== 'undefined') {
                  const computedStyle = getComputedStyle(document.documentElement)
                  textColor = computedStyle.getPropertyValue('--foreground').trim() || '#f5cdb4'
                  haloColor = computedStyle.getPropertyValue('--accent-navy').trim() || '#3b3340'
                }
                
                style.layers.forEach(layer => {
                  if (layer.type === 'symbol') {
                    try {
                      map.setPaintProperty(layer.id, 'text-color', textColor)
                      map.setPaintProperty(layer.id, 'text-halo-color', haloColor)
                      map.setPaintProperty(layer.id, 'text-halo-width', 1)
                    } catch (e) {
                      // Ignore
                    }
                  }
                })
                map.triggerRepaint()
              }
            }, 100)
          })
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
                color: popupInfo.properties.state === 'closed' ? 'var(--closed-text)' : 
                       popupInfo.properties.state === 'declining' ? 'var(--declining-text)' :
                       theme === 'bauhaus' ? 'var(--active-text)' : 
                       theme === 'moody' || !theme ? 'var(--active-text)' : '#2a2a2a',
                fontFamily: 'Space Mono, monospace',
                border: `2px solid ${
                  popupInfo.properties.state === 'declining' ? colors.declining :
                  popupInfo.properties.state === 'closed' ? colors.closed :
                  colors.active
                }`
              }}
            >
              <h3 className="font-bold text-base mb-2" style={{ 
                color: 'inherit',
                fontFamily: 'Space Mono, monospace'
              }}>
                {popupInfo.properties.popup}
              </h3>
              {popupInfo.properties && (
                <>
                  <div className="text-xs mb-2" style={{ 
                    opacity: 0.8,
                    color: 'inherit'
                  }}>
                    {popupInfo.properties.startDate && 
                     popupInfo.properties.endDate && 
                      `${new Date(popupInfo.properties.startDate).getFullYear()} - 
                       ${new Date(popupInfo.properties.endDate).getFullYear()}`
                    }
                  </div>
                  {popupInfo.properties.description && (
                    <p className="text-xs line-clamp-3" style={{ 
                      color: 'inherit',
                      opacity: 0.9
                    }}>
                      {popupInfo.properties.description}
                    </p>
                  )}
                  <div 
                    className="text-xs mt-3 font-bold cursor-pointer"
                    style={{
                      color: 'inherit',
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