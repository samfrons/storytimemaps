'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox'
import Supercluster from 'supercluster'
import { useTheme } from 'next-themes'
import mapboxgl from 'mapbox-gl'
import { useMobileOptimizations } from '../../hooks/useMobileOptimizations'
import { useTranslation } from '../../i18n/useTranslation'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

if (!MAPBOX_TOKEN) {
  console.error('Mapbox token is not configured. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local file')
}

// Complete custom style for moody theme
const MOODY_STYLE = {
    version: 8 as const,
    name: 'Moody Theme',
    sources: {
      'mapbox': {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8'
      }
    },
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#4a4a57' // Dark purple-gray background
        }
      },
      {
        id: 'water',
        type: 'fill',
        source: 'mapbox',
        'source-layer': 'water',
        paint: {
          'fill-color': '#5a5766', // Darker purple-gray water
          'fill-opacity': 0.8
        }
      },
      {
        id: 'landuse-park',
        type: 'fill',
        source: 'mapbox',
        'source-layer': 'landuse',
        filter: ['==', 'class', 'park'],
        paint: {
          'fill-color': '#97d8c0', // Mint green parks
          'fill-opacity': 0.2
        }
      },
      {
        id: 'landuse-other',
        type: 'fill',
        source: 'mapbox',
        'source-layer': 'landuse',
        filter: ['!=', 'class', 'park'],
        paint: {
          'fill-color': '#4a4a57',
          'fill-opacity': 0.1
        }
      },
      {
        id: 'building',
        type: 'fill',
        source: 'mapbox',
        'source-layer': 'building',
        paint: {
          'fill-color': '#4a4a57',
          'fill-opacity': 0.6,
          'fill-outline-color': '#3b3340'
        }
      },
      {
        id: 'road-highway',
        type: 'line',
        source: 'mapbox',
        'source-layer': 'road',
        filter: ['in', 'class', 'motorway', 'trunk'],
        paint: {
          'line-color': '#ee5760', // Coral red for highways
          'line-width': {
            base: 1.5,
            stops: [[8, 0.5], [10, 1], [12, 3], [16, 8], [20, 18]]
          },
          'line-opacity': 1
        }
      },
      {
        id: 'road-primary',
        type: 'line',
        source: 'mapbox',
        'source-layer': 'road',
        filter: ['in', 'class', 'primary', 'secondary'],
        paint: {
          'line-color': '#ffcb51', // Golden yellow for primary roads
          'line-width': {
            base: 1.5,
            stops: [[12, 0.5], [14, 1], [16, 3], [20, 8]]
          },
          'line-opacity': 1
        }
      },
      {
        id: 'road-local',
        type: 'line',
        source: 'mapbox',
        'source-layer': 'road',
        filter: ['in', 'class', 'street', 'street_limited', 'service', 'track', 'pedestrian'],
        paint: {
          'line-color': '#f5cdb4', // Light peach for local streets
          'line-width': {
            base: 1.5,
            stops: [[12, 0.5], [14, 0.8], [16, 2], [20, 6]]
          },
          'line-opacity': 0.6
        }
      },
      // Labels
      {
        id: 'place-label',
        type: 'symbol',
        source: 'mapbox',
        'source-layer': 'place_label',
        layout: {
          'text-field': '{name}',
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': {
            stops: [[6, 10], [12, 16]]
          }
        },
        paint: {
          'text-color': '#f5cdb4', // Peach text
          'text-halo-color': '#3b3340', // Dark navy halo
          'text-halo-width': 1
        }
      },
      {
        id: 'road-label',
        type: 'symbol',
        source: 'mapbox',
        'source-layer': 'road',
        layout: {
          'text-field': '{name}',
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 12,
          'symbol-placement': 'line',
          'text-rotation-alignment': 'map'
        },
        paint: {
          'text-color': '#f5cdb4',
          'text-halo-color': '#3b3340',
          'text-halo-width': 1
        }
      }
    ]
};

// Snazzy Maps "Red Colored" style conversion for hot theme
const SNAZZY_RED_STYLE = {
    version: 8 as const,
    name: 'Red Colored - Snazzy Maps',
    sources: {
      'mapbox': {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8'
      }
    },
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
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
};

// Get complete Bauhaus style
const BAUHAUS_STYLE = {
    version: 8 as const,
    name: 'Bauhaus Theme',
    sources: {
      'mapbox': {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8'
      }
    },
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
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
      // No text labels for clean Bauhaus aesthetic
    ]
};

// Get minimal dark archival map style
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ARCHIVAL_STYLE: any = {
    version: 8,
    sources: {
      mapbox: {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8'
      }
    },
    sprite: 'mapbox://sprites/mapbox/dark-v10',
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    layers: [
      // Background - slate blue-grey
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#3e4a5c'
        }
      },
      // Water - darker blue
      {
        id: 'water',
        type: 'fill',
        source: 'mapbox',
        'source-layer': 'water',
        paint: {
          'fill-color': '#1e3a52'
        }
      },
      // Land/landscape - off-white blue
      {
        id: 'landuse',
        type: 'fill',
        source: 'mapbox',
        'source-layer': 'landuse',
        paint: {
          'fill-color': '#e8eef5',
          'fill-opacity': 0.4
        }
      },
      // Buildings - not shown
      // Roads - minimal dark blue
      {
        id: 'road-local',
        type: 'line',
        source: 'mapbox',
        'source-layer': 'road',
        filter: ['all', ['!=', 'class', 'motorway'], ['!=', 'class', 'trunk']],
        paint: {
          'line-color': '#1a2e5a',
          'line-width': 1,
          'line-opacity': 0.8
        }
      },
      {
        id: 'road-highway',
        type: 'line',
        source: 'mapbox',
        'source-layer': 'road',
        filter: ['in', 'class', 'motorway', 'trunk'],
        paint: {
          'line-color': '#2c4166',
          'line-width': 2,
          'line-opacity': 0.9
        }
      }
      // No labels for minimal design
    ]
};

// Get custom map style for each theme
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getThemeMapStyle = (theme: string | undefined): any => {
  switch(theme) {
    case 'moody':
      return MOODY_STYLE // Use complete moody style
    
    case 'bauhaus':
      return BAUHAUS_STYLE // Use complete bauhaus style
    
    case 'hot':
      return SNAZZY_RED_STYLE // Use complete Snazzy Maps "Red Colored" style
    
    case 'archival':
      return ARCHIVAL_STYLE // Use minimal dark style for archival theme
    
    case 'cold':
      return 'mapbox://styles/mapbox/light-v11' // We'll customize this after load
    
    case 'cool':
      return 'mapbox://styles/mapbox/light-v11' // We'll customize this after load
    
    case 'warm':
      return 'mapbox://styles/mapbox/outdoors-v12' // We'll customize this after load
    
    case 'art-nouveau':
      return 'mapbox://styles/mapbox/outdoors-v12' // We'll customize this after load
    
    default:
      return MOODY_STYLE // Use moody as default
  }
}

interface MapboxMapProps {
  center?: [number, number] | { lat: number; lng: number }
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
  onMarkerClick?: (id: string) => void
  activeMarkerId?: string | null
  currentDate?: Date
  enrichedStories?: Array<{ id: string; startDate?: string | null; endDate?: string | null; description?: string | null }>
  isTestMode?: boolean
  city?: 'berlin' | 'frankfurt'
  data?: any
  selectedDate?: Date
  onBusinessSelect?: (business: any) => void
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  center,
  zoom,
  markers = [],
  onMarkerClick,
  activeMarkerId,
  currentDate, // eslint-disable-line @typescript-eslint/no-unused-vars
  enrichedStories = [],
  isTestMode = false,
  city = 'berlin',
  data,
  selectedDate,
  onBusinessSelect
}) => {
  const mapRef = useRef<React.ComponentRef<typeof Map> | null>(null)
  const { theme } = useTheme()
  const { t } = useTranslation()
  
  // Handle both center formats
  const centerCoords = center 
    ? Array.isArray(center) 
      ? { longitude: center[1], latitude: center[0] }
      : { longitude: center.lng, latitude: center.lat }
    : { longitude: 13.404954, latitude: 52.520008 } // Default to Berlin
  
  const [viewState, setViewState] = useState({
    ...centerCoords,
    zoom: zoom
  })
  const [mapLoaded, setMapLoaded] = useState(false)
  const [, setWebglReady] = useState(false) // Track WebGL readiness for context loss handling
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const [labelPriorities, setLabelPriorities] = useState<Set<string>>(new Set())
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

  // Use theme colors directly - only for themes that need color state
  useEffect(() => {
    // Only update colors for themes that use the modification approach
    if (theme === 'cold' || theme === 'cool' || theme === 'warm' || theme === 'art-nouveau') {
      const themeColors = {
        active: '#97d8c0',   // Default active color for modification themes
        declining: '#ffcb51', // Default declining color
        closed: '#ee5760',    // Default closed color  
        future: '#f5cdb4'     // Default future color
      };
      setColors(themeColors);
    } else {
      // For complete custom style themes, use their specific colors for markers only
      const themeColors = theme === 'bauhaus' ? {
        active: '#0066ff',
        declining: '#ffcc00', 
        closed: '#ff0000',
        future: '#333333'
      } : theme === 'hot' ? {
        active: '#00ff00',    // Bright green for hot theme
        declining: '#ffaa00', // Orange
        closed: '#ff0000',    // Red
        future: '#666666'     // Gray
      } : theme === 'archival' ? {
        active: 'rgba(44, 74, 124, 0.85)',    // Navy-slate rich blue for active
        declining: 'rgba(90, 115, 151, 0.85)', // Medium shade blue for declining
        closed: 'rgba(139, 156, 174, 0.85)',    // Light shade blue for closed
        future: 'rgba(44, 74, 124, 0.85)'     // Navy-slate blue for future
      } : { // moody (default)
        active: '#97d8c0',
        declining: '#ffcb51',
        closed: '#ee5760', 
        future: '#f5cdb4'
      };
      setColors(themeColors);
    }
  }, [theme])

  // Function to determine max labels based on zoom
  const getMaxLabels = (zoom: number) => {
    if (zoom < 12) return 5
    if (zoom < 14) return 10
    if (zoom < 15) return 20
    if (zoom < 16) return 30
    if (zoom < 17) return 50
    if (zoom < 18) return 80
    return 150
  }
  
  // Get mobile optimizations
  const { isMobile } = useMobileOptimizations();
  
  // Spatial sampling function for even marker distribution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spatialSample = (markers: any[], maxCount: number, bbox: [number, number, number, number]) => {
    if (markers.length <= maxCount) return markers
    
    // Create a spatial grid
    const gridSize = Math.ceil(Math.sqrt(maxCount))
    const [west, south, east, north] = bbox
    const cellWidth = (east - west) / gridSize
    const cellHeight = (north - south) / gridSize
    
    // Group markers by grid cell
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grid: { [key: string]: any[] } = {}
    
    markers.forEach(marker => {
      const [lng, lat] = marker.geometry.coordinates
      const col = Math.floor((lng - west) / cellWidth)
      const row = Math.floor((lat - south) / cellHeight)
      const key = `${col},${row}`
      
      if (!grid[key]) {
        grid[key] = []
      }
      grid[key].push(marker)
    })
    
    // Sample from each cell
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sampled: any[] = []
    const gridKeys = Object.keys(grid)
    const markersPerCell = Math.max(1, Math.floor(maxCount / gridKeys.length))
    
    gridKeys.forEach(key => {
      const cellMarkers = grid[key]
      // Prioritize active businesses
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sorted = cellMarkers.sort((a: any, b: any) => {
        const aState = a.properties?.state || 'active'
        const bState = b.properties?.state || 'active'
        if (aState === 'active' && bState !== 'active') return -1
        if (bState === 'active' && aState !== 'active') return 1
        return 0
      })
      
      sampled.push(...sorted.slice(0, markersPerCell))
    })
    
    return sampled.slice(0, maxCount)
  }
  
  // Process GeoJSON data for Frankfurt
  const processedMarkers = useMemo(() => {
    if (data && data.features) {
      // Convert GeoJSON features to markers format
      return data.features.map((feature: any, index: number) => ({
        id: feature.properties.id?.toString() || `marker-${index}`,
        position: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]] as [number, number],
        popup: feature.properties.name || '',
        state: 'active', // Default state, can be derived from date comparison
        description: feature.properties.address || '',
        startDate: feature.properties.founded_date,
        endDate: feature.properties.closing_date
      }))
    }
    return markers
  }, [data, markers])
  
  // Initialize Supercluster for clustering with optimized settings for large datasets
  const supercluster = useMemo(() => {
    // Adjust clustering based on test mode and zoom level
    let radius = isMobile ? 40 : 20
    let maxZoom = isMobile ? 16 : 18
    let minPoints = isMobile ? 4 : 2
    
    if (isTestMode) {
      // More aggressive clustering for 10,000+ markers
      const currentZoom = viewState.zoom
      if (currentZoom < 10) {
        radius = 100
        minPoints = 3
      } else if (currentZoom < 12) {
        radius = 60
        minPoints = 2
      } else if (currentZoom < 14) {
        radius = 40
        minPoints = 2
      } else if (currentZoom < 16) {
        radius = 25
        minPoints = 2
      } else {
        radius = 15
        minPoints = 2
      }
      maxZoom = 18
    }
    
    const index = new Supercluster({
      radius,
      maxZoom,
      minPoints,
      extent: 512,  // Standard tile extent
      nodeSize: 64  // Standard node size
    })

    const markersToUse = processedMarkers
    if (markersToUse.length > 0) {
      const points: GeoJSON.Feature<GeoJSON.Point, { id: string; popup: string; state: string }>[] = markersToUse.map((marker: any) => ({
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
  }, [processedMarkers, isMobile, isTestMode, viewState.zoom])

  // Pre-compute initial markers for fallback with spatial distribution
  const initialMarkers = useMemo(() => {
    const markersToUse = processedMarkers
    if (!markersToUse.length) return []
    
    // Take every 10th marker for better spatial distribution than just first 40
    const step = Math.max(1, Math.floor(markersToUse.length / 30))
    const selectedMarkers = []
    
    for (let i = 0; i < markersToUse.length && selectedMarkers.length < 30; i += step) {
      selectedMarkers.push(markersToUse[i])
    }
    
    return selectedMarkers.map(marker => ({
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
  }, [processedMarkers])

  // Throttled viewport bounds for better performance
  const [throttledViewport, setThrottledViewport] = useState({ zoom: viewState.zoom, bounds: null as mapboxgl.LngLatBounds | null })
  
  useEffect(() => {
    const throttleTimer = setTimeout(() => {
      if (mapRef.current && mapLoaded) {
        const bounds = mapRef.current.getBounds()
        setThrottledViewport({ zoom: Math.floor(viewState.zoom), bounds })
      }
    }, 150) // Throttle viewport updates to 150ms
    
    return () => clearTimeout(throttleTimer)
  }, [viewState.zoom, mapLoaded])

  // Get clusters for current viewport with optimized recalculation and viewport culling
  const clusters = useMemo(() => {
    // Always return initial markers if map is not ready
    if (!mapLoaded || !throttledViewport.bounds) {
      return initialMarkers
    }
    
    try {
      // Add buffer to viewport for smooth panning
      const buffer = 0.1  // 10% buffer around viewport
      const bounds = throttledViewport.bounds
      const width = bounds.getEast() - bounds.getWest()
      const height = bounds.getNorth() - bounds.getSouth()
      
      const bbox: [number, number, number, number] = [
        bounds.getWest() - (width * buffer),
        bounds.getSouth() - (height * buffer),
        bounds.getEast() + (width * buffer),
        bounds.getNorth() + (height * buffer)
      ]
      
      const clusteredMarkers = supercluster.getClusters(bbox, throttledViewport.zoom)
      
      // Smart limiting: show ALL clusters, limit only individual markers
      const processedMarkers = clusteredMarkers.map(marker => {
        // Always show clusters
        if (marker.properties?.cluster) {
          return marker
        }
        // For individual markers, apply spatial sampling at high zoom
        return marker
      })
      
      // At very high zoom levels, limit individual markers spatially
      if (throttledViewport.zoom > 15) {
        const maxIndividualMarkers = isTestMode 
          ? (isMobile ? 200 : 800)  // Much higher limits for test mode
          : (isMobile ? 50 : 150)
        const clusters = processedMarkers.filter(m => m.properties?.cluster)
        const individuals = processedMarkers.filter(m => !m.properties?.cluster)
        
        // Spatial sampling: spread markers evenly across viewport
        const sampledIndividuals = spatialSample(individuals, maxIndividualMarkers, bbox)
        
        return [...clusters, ...sampledIndividuals]
      }
      
      return processedMarkers
    } catch (error) {
      console.warn('Error getting clusters:', error)
      return initialMarkers.slice(0, 20)
    }
  }, [supercluster, throttledViewport, mapLoaded, initialMarkers, isMobile, isTestMode])
  
  // Update label priorities when viewport changes - throttled for performance
  useEffect(() => {
    if (!mapLoaded || !clusters) return
    
    const updatePriorities = () => {
      const maxLabels = getMaxLabels(throttledViewport.zoom)
      const nonClusteredMarkers = clusters.filter(c => !('cluster' in (c.properties || {})))
      
      // Prioritize markers: active first, then spatially distributed
      const priorities = new Set<string>()
      
      // Always show active and hovered markers
      if (activeMarkerId) {
        priorities.add(activeMarkerId)
      }
      if (hoveredMarkerId) {
        priorities.add(hoveredMarkerId)
      }
      
      // Add spatially distributed markers up to limit - simplified calculation
      const step = Math.max(2, Math.floor(nonClusteredMarkers.length / (maxLabels - priorities.size)))
      for (let i = 0; i < nonClusteredMarkers.length && priorities.size < maxLabels; i += step) {
        const marker = nonClusteredMarkers[i]
        if (marker?.properties?.id) {
          priorities.add(marker.properties.id)
        }
      }
      
      setLabelPriorities(priorities)
    }
    
    // Debounce priority updates
    const debounceTimer = setTimeout(updatePriorities, 200)
    return () => clearTimeout(debounceTimer)
  }, [throttledViewport.zoom, clusters, activeMarkerId, hoveredMarkerId, mapLoaded])

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


  // Optimized theme application with reduced WebGL operations
  const applyThemeStyles = useCallback((map: mapboxgl.Map, forceRender = false) => {
    // Moody, Hot, Bauhaus, and Archival use complete custom styles, no additional styling needed
    // Skip ALL style modifications for these themes to prevent color bleeding
    if (theme === 'moody' || theme === 'hot' || theme === 'bauhaus' || theme === 'archival') {
      // No need to trigger repaint for complete custom styles - they handle their own rendering
      return
    }
    
    // For themes we haven't implemented complete custom styles yet,
    // continue with the modification approach
    if (theme !== 'cold' && theme !== 'cool' && theme !== 'warm' && theme !== 'art-nouveau') {
      // Unknown theme - skip modifications
      return
    }
    
    try {
      // Check if style is loaded before accessing
      if (!map.isStyleLoaded()) return
      
      const style = map.getStyle()
      if (!style || !style.layers) return
      
      const layers = style.layers
      
      // Get theme-specific map colors for modification themes only
      const getMapColors = () => {
        // Since this function only runs for modification themes (cold, cool, warm, art-nouveau),
        // use appropriate default colors for each
        if (theme === 'cold') {
          return {
            water: '#87CEEB',  // Sky blue
            park: '#90EE90',   // Light green  
            road: '#B0B0B0',   // Light gray
            background: '#F5F5F5' // Very light gray
          };
        } else {
          // Default colors for cool, warm, art-nouveau
          return {
            water: '#5a5766',  // Dark purple-gray
            park: '#97d8c0',   // Mint green
            road: '#f5cdb4',   // Light peach
            background: '#4a4a57' // Dark background
          };
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
            if (theme === 'cold') {
              // Cold theme uses subtle gray lines
              map.setPaintProperty(layer.id, 'line-color', mapColors.road)
              map.setPaintProperty(layer.id, 'line-opacity', 0.7)
            } else {
              // Use neutral colors for other modification themes
              if (layer.id.includes('motorway') || layer.id.includes('trunk')) {
                map.setPaintProperty(layer.id, 'line-color', '#666666') // Neutral gray
              } else if (layer.id.includes('primary') || layer.id.includes('secondary')) {
                map.setPaintProperty(layer.id, 'line-color', '#888888') // Lighter gray
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
      
      // Optimized WebGL render cycle after style changes
      if (styleChangesApplied || forceRender) {
        // Single batched render operation
        requestAnimationFrame(() => {
          if (map.isStyleLoaded()) {
            map.triggerRepaint()
            
            // Update symbol layers only once after render
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
            }
          }
        })
      }
    } catch (e) {
      console.warn('Error updating map theme:', e)
    }
  }, [theme])

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
        
        // Apply theme styles once
        applyThemeStyles(map, true)
        
      } catch (err) {
        console.warn('Error during theme style change:', err)
        // Minimal fallback - let the next render cycle handle it naturally
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
      case 'archival':
        return {
          backgroundColor: 'rgba(44, 74, 124, 0.85)',
          border: '3px solid rgba(255, 255, 255, 0.85)',
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
      return []
    }
    const [lng, lat] = feature.geometry.coordinates
    const properties = feature.properties || {}
    
    // Determine if we should show this label
    const shouldShowLabel = properties.id && labelPriorities.has(properties.id)

    if (properties.cluster) {
      const size = 30 + (properties.point_count! / markers.length) * 30
      const clusterStyle = getClusterStyle()
      
      // Special shapes for Bauhaus clusters
      if (theme === 'bauhaus') {
        return [
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
                cursor: 'pointer !important',
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
        ]
      }
      
      // Render cluster marker for other themes
      return [
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
              cursor: 'pointer !important',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {properties.point_count}
          </div>
        </Marker>
      ]
    }

    // Render individual marker
    const isActive = properties.id === activeMarkerId
    const isHovered = properties.id === hoveredMarkerId
    const color = colors[properties.state as keyof typeof colors] || colors.active

    const markerElements = []
    
    // Show label based on priority system
    if (shouldShowLabel || isHovered) {
      markerElements.push(
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
                       theme === 'bauhaus' ? '#ffffff' :
                       theme === 'archival' ? (
              properties.state === 'declining' ? '#5a7397' : // archival warning color
              properties.state === 'closed' ? '#8b9cae' :     // archival danger color  
              '#2c4a7c'                                        // archival primary color (active)
            ) : (
              properties.state === 'declining' ? `${colors.declining}e8` :
              properties.state === 'closed' ? `${colors.closed}e8` :
              `${colors.active}e8`
            ),
            color: theme === 'cool' || theme === 'cold' ? color :
                   theme === 'bauhaus' ? color :
                   theme === 'archival' ? '#ffffff' : // white text for good contrast on archival colors
                   (properties.state === 'closed' ? '#ffffff' : '#2a2a2a'),
            border: theme === 'bauhaus' ? `3px solid ${color}` : 
                    theme === 'cool' || theme === 'cold' ? `2px solid ${color}` :
                    theme === 'archival' ? `1px solid ${color}` :
                    `1px solid ${color}`,
            boxShadow: theme === 'bauhaus' ? '3px 3px 0px #000000' : 
                       theme === 'cool' || theme === 'cold' ? '0 2px 6px rgba(0,0,0,0.1)' :
                       '0 2px 6px rgba(0,0,0,0.2)',
            letterSpacing: theme === 'bauhaus' ? '0.1em' : 'normal',
            opacity: isHovered ? 1 : (popupInfo && popupInfo.properties.id !== properties.id ? 0.8 : 0.9),
            transition: 'all 200ms ease-in-out',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (onBusinessSelect && data) {
              // For Frankfurt data, find the business in the GeoJSON
              const business = data.features?.find((f: any) => f.properties.id?.toString() === properties.id)
              if (business) {
                onBusinessSelect(business)
              }
            } else if (onMarkerClick) {
              onMarkerClick(properties.id!)
            }
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
      </Marker>
      )
    }
    
    // Render marker dot with better click targets
    const dotSize = isHovered || isActive ? 12 : 10
    const bauhausDotSize = isHovered || isActive ? 18 : 14
    
    markerElements.push(
      <Marker
        key={`marker-${properties.id}`}
        longitude={lng}
        latitude={lat}
        onClick={() => {
          if (onBusinessSelect && data) {
            // For Frankfurt data, find the business in the GeoJSON
            const business = data.features?.find((f: any) => f.properties.id?.toString() === properties.id)
            if (business) {
              onBusinessSelect(business)
            }
          } else if (onMarkerClick) {
            onMarkerClick(properties.id!)
          }
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
          onMouseEnter={() => setHoveredMarkerId(properties.id!)}
          onMouseLeave={() => setHoveredMarkerId(null)}
          style={{
            backgroundColor: color,
            width: theme === 'bauhaus' && isActive ? '20px' : theme === 'bauhaus' ? `${bauhausDotSize}px` : `${dotSize}px`,
            height: theme === 'bauhaus' && isActive ? '20px' : theme === 'bauhaus' ? `${bauhausDotSize}px` : `${dotSize}px`,
            clipPath: theme === 'bauhaus' ? (
              properties.state === 'closed' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : // Triangle
              properties.state === 'declining' ? 'none' : // Square
              'circle(50%)' // Circle
            ) : undefined,
            borderRadius: theme === 'bauhaus' ? '0' : '50%',
            border: theme === 'bauhaus' ? '2px solid #000000' : '2px solid white',
            boxShadow: theme === 'bauhaus' ? '2px 2px 0px #000000' : '0 2px 4px rgba(0,0,0,0.3)',
            cursor: 'pointer !important',
            transition: 'transform 0.2s',
            transform: isActive ? 'scale(1.5)' : 'scale(1)'
          }}
        />
      </Marker>
    )
    
    return markerElements
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
              
              // Apply theme styles with coordinated rendering
              applyThemeStyles(map, true)
              
              // Single coordinated render for initial display
              requestAnimationFrame(() => {
                if (map.isStyleLoaded()) {
                  map.triggerRepaint()
                }
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
              if (!map.isStyleLoaded()) return
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
                // Single coordinated repaint for label updates
                requestAnimationFrame(() => {
                  if (map.isStyleLoaded()) {
                    map.triggerRepaint()
                  }
                })
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
        {mapLoaded && clusters && clusters.length > 0 && clusters.flatMap(cluster => {
          const result = renderMarker(cluster)
          return Array.isArray(result) ? result : []
        })}
        
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
                    className="text-xs mt-3 font-bold cursor-pointer uppercase tracking-wide"
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
                    {t('mainPage.map.viewMore') || 'View more →'}
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
          className="p-2.5 shadow-sm hover:shadow-md transition-all duration-200 border zoom-button hover:scale-110"
          style={{
            backgroundColor: 'rgba(var(--muted-rgb), 0.8)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
            cursor: 'pointer',
            transform: 'scale(1)',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
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
          className="p-2.5 shadow-sm hover:shadow-md transition-all duration-200 border zoom-button hover:scale-110"
          style={{
            backgroundColor: 'rgba(var(--muted-rgb), 0.8)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
            cursor: 'pointer',
            transform: 'scale(1)',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
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
  // Quick checks first - handle both center formats
  const getPrevCenter = prevProps.center 
    ? Array.isArray(prevProps.center) 
      ? prevProps.center 
      : [prevProps.center.lng, prevProps.center.lat]
    : [0, 0];
  const getNextCenter = nextProps.center 
    ? Array.isArray(nextProps.center) 
      ? nextProps.center 
      : [nextProps.center.lng, nextProps.center.lat]
    : [0, 0];
      
  if (getPrevCenter[0] !== getNextCenter[0] || 
      getPrevCenter[1] !== getNextCenter[1] ||
      prevProps.zoom !== nextProps.zoom ||
      prevProps.activeMarkerId !== nextProps.activeMarkerId) {
    return false
  }
  
  // Date comparison
  const prevTime = prevProps.currentDate?.getTime() || 0
  const nextTime = nextProps.currentDate?.getTime() || 0
  if (prevTime !== nextTime) {
    return false
  }
  
  // Array length checks before deep comparison
  if (prevProps.markers?.length !== nextProps.markers?.length ||
      prevProps.enrichedStories?.length !== nextProps.enrichedStories?.length) {
    return false
  }
  
  // Only do expensive comparison if lengths are the same and small
  if (prevProps.markers && nextProps.markers && prevProps.markers.length < 100) {
    // Shallow comparison for small arrays
    for (let i = 0; i < prevProps.markers.length; i++) {
      if (prevProps.markers[i]?.id !== nextProps.markers[i]?.id ||
          prevProps.markers[i]?.state !== nextProps.markers[i]?.state) {
        return false
      }
    }
  }
  
  return true
})