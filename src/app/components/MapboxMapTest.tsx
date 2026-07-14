'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Supercluster from 'supercluster'
import { useTheme } from 'next-themes'

// Theme-specific color functions
const getMapColors = (theme: string | undefined) => {
  switch(theme) {
    case 'moody':
      return {
        water: '#6b6275',
        buildings: '#8b7d8e',
        roads: '#4a4a57',
        parks: '#5a5a67'
      }
    case 'hot':
      return {
        water: '#ff6b6b',
        buildings: '#ff8787',
        roads: '#ff5252',
        parks: '#ffaaaa'
      }
    case 'cold':
      return {
        water: '#4fc3f7',
        buildings: '#81d4fa',
        roads: '#29b6f6',
        parks: '#b3e5fc'
      }
    case 'warm':
      return {
        water: '#ffb74d',
        buildings: '#ffcc80',
        roads: '#ffa726',
        parks: '#ffe0b2'
      }
    case 'cool':
      return {
        water: '#4db6ac',
        buildings: '#80cbc4',
        roads: '#26a69a',
        parks: '#b2dfdb'
      }
    case 'bauhaus':
      return {
        water: '#0066cc',
        buildings: '#000000',
        roads: '#cc0000',
        parks: '#ffcc00'
      }
    case 'art-nouveau':
      return {
        water: '#7b68ee',
        buildings: '#9370db',
        roads: '#8a2be2',
        parks: '#dda0dd'
      }
    default:
      return {
        water: '#6b6275',
        buildings: '#8b7d8e',
        roads: '#4a4a57',
        parks: '#5a5a67'
      }
  }
}

const getThemeColors = (theme: string | undefined) => {
  switch(theme) {
    case 'moody':
      return { background: '#4a4a57' }
    case 'hot':
      return { background: '#2c1810' }
    case 'cold':
      return { background: '#0d1117' }
    case 'warm':
      return { background: '#1a1613' }
    case 'cool':
      return { background: '#0f1419' }
    case 'bauhaus':
      return { background: '#ffffff' }
    case 'art-nouveau':
      return { background: '#1a1627' }
    default:
      return { background: '#4a4a57' }
  }
}

// Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface Marker {
  id: string
  position: [number, number]
  popup: string
  state?: string
  description?: string
  startDate?: string
  endDate?: string
}

interface MapboxMapTestProps {
  center: [number, number]
  zoom: number
  markers: Marker[]
  onMarkerClick?: (markerId: string) => void
  activeMarkerId?: string | null
  currentDate?: Date
  enrichedStories?: Array<{ id: string; lat: number; lng: number; title: string; businessType?: string; }>
}

const MapboxMapTest: React.FC<MapboxMapTestProps> = ({
  center,
  zoom,
  markers,
  onMarkerClick,
  activeMarkerId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentDate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  enrichedStories = []
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const [mapLoaded, setMapLoaded] = useState(false)
  const { theme } = useTheme()

  // Enhanced clustering parameters based on zoom level
  const getClusteringParams = useCallback((currentZoom: number) => {
    if (currentZoom < 10) {
      // City level - aggressive clustering
      return { radius: 120, minPoints: 3, maxMarkersVisible: 50 }
    } else if (currentZoom < 12) {
      // District level - moderate clustering
      return { radius: 80, minPoints: 3, maxMarkersVisible: 150 }
    } else if (currentZoom < 14) {
      // Neighborhood level - light clustering
      return { radius: 50, minPoints: 2, maxMarkersVisible: 300 }
    } else if (currentZoom < 16) {
      // Street level - minimal clustering
      return { radius: 30, minPoints: 2, maxMarkersVisible: 500 }
    } else {
      // Building level - show individual markers
      return { radius: 15, minPoints: 2, maxMarkersVisible: 1000 }
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [center[1], center[0]], // Convert from [lat, lng] to [lng, lat]
      zoom,
      pitch: 0,
      bearing: 0,
      antialias: true
    })

    map.current = mapInstance

    mapInstance.on('load', () => {
      setMapLoaded(true)
      
      // Apply theme-specific styling
      const colors = getMapColors(theme)
      const themeColors = getThemeColors(theme)
      
      // Customize map style
      if (mapInstance.getLayer('water')) {
        mapInstance.setPaintProperty('water', 'fill-color', colors.water)
      }
      if (mapInstance.getLayer('building')) {
        mapInstance.setPaintProperty('building', 'fill-color', colors.buildings)
        mapInstance.setPaintProperty('building', 'fill-opacity', 0.2)
      }
      
      // Set background
      const layers = mapInstance.getStyle().layers
      const backgroundLayer = layers?.find(layer => layer.type === 'background')
      if (backgroundLayer && backgroundLayer.id) {
        mapInstance.setPaintProperty(backgroundLayer.id, 'background-color', themeColors.background)
      }
    })

    return () => {
      mapInstance.remove()
      map.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers with smart clustering
  useEffect(() => {
    if (!map.current || !mapLoaded || markers.length === 0) return

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove())
    markersRef.current = {}

    const currentZoom = map.current.getZoom()
    const { radius, minPoints, maxMarkersVisible } = getClusteringParams(currentZoom)

    // Initialize Supercluster with dynamic parameters
    const index = new Supercluster({
      radius,
      maxZoom: 18,
      minPoints,
      extent: 512,
      nodeSize: 64
    })

    // Convert markers to GeoJSON features
    const points = markers.map(marker => ({
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    index.load(points as any)

    // Get viewport bounds
    const bounds = map.current.getBounds()
    if (!bounds) return
    
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ]

    // Get clusters for current viewport
    const clusters = index.getClusters(bbox, Math.floor(currentZoom))

    // Limit visible markers for performance
    const visibleClusters = clusters.slice(0, maxMarkersVisible)

    // Add markers for clusters and individual points
    visibleClusters.forEach(cluster => {
      const [lng, lat] = cluster.geometry.coordinates
      const properties = cluster.properties

      if (properties.cluster) {
        // Create cluster marker
        const el = document.createElement('div')
        el.className = 'cluster-marker'
        
        // Calculate size based on point count
        const pointCount = properties.point_count
        const size = Math.min(60, Math.max(30, 20 + Math.log2(pointCount) * 5))
        
        el.style.width = `${size}px`
        el.style.height = `${size}px`
        el.style.borderRadius = '50%'
        el.style.backgroundColor = 'var(--warning)'
        el.style.border = '3px solid var(--foreground)'
        el.style.display = 'flex'
        el.style.alignItems = 'center'
        el.style.justifyContent = 'center'
        el.style.color = 'var(--background)'
        el.style.fontWeight = 'bold'
        el.style.fontSize = `${Math.min(16, size / 3)}px`
        el.style.cursor = 'pointer'
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
        el.textContent = pointCount >= 1000 ? `${(pointCount / 1000).toFixed(1)}k` : String(pointCount)

        // Add click handler to zoom into cluster
        el.addEventListener('click', () => {
          const zoom = index.getClusterExpansionZoom(properties.cluster_id)
          map.current?.easeTo({
            center: [lng, lat],
            zoom: Math.min(zoom, 18)
          })
        })

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!)

        markersRef.current[`cluster-${properties.cluster_id}`] = marker
      } else {
        // Create individual marker
        const el = document.createElement('div')
        el.className = 'marker'
        
        // Determine color based on state
        const state = properties.state || 'active'
        let color = 'var(--success)' // active
        if (state === 'declining') color = 'var(--warning)'
        else if (state === 'closed') color = 'var(--danger)'
        else if (state === 'future') color = 'var(--foreground-muted)'

        // Create diamond shape with CSS
        el.style.width = '20px'
        el.style.height = '20px'
        el.style.backgroundColor = color
        el.style.border = '2px solid var(--foreground)'
        el.style.transform = 'rotate(45deg)'
        el.style.cursor = 'pointer'
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

        // Add hover effect
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'rotate(45deg) scale(1.2)'
        })
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'rotate(45deg)'
        })

        // Add click handler
        el.addEventListener('click', () => {
          if (onMarkerClick) {
            onMarkerClick(properties.id)
          }
        })

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(properties.popup))
          .addTo(map.current!)

        markersRef.current[properties.id] = marker

        // Highlight active marker
        if (properties.id === activeMarkerId) {
          el.style.transform = 'rotate(45deg) scale(1.3)'
          el.style.zIndex = '1000'
        }
      }
    })

    // Update on map move
    const updateMarkers = () => {
      // Remove all markers
      Object.values(markersRef.current).forEach(marker => marker.remove())
      markersRef.current = {}

      const newZoom = map.current!.getZoom()
      const newParams = getClusteringParams(newZoom)
      
      // Note: Supercluster doesn't allow runtime reconfiguration of options
      // Would need to create a new instance if we want to change clustering parameters
      
      const newBounds = map.current!.getBounds()
      if (!newBounds) return
      
      const newBbox: [number, number, number, number] = [
        newBounds.getWest(),
        newBounds.getSouth(),
        newBounds.getEast(),
        newBounds.getNorth()
      ]

      const newClusters = index.getClusters(newBbox, Math.floor(newZoom))
      const visibleNewClusters = newClusters.slice(0, newParams.maxMarkersVisible)

      // Re-add markers with new clustering
      visibleNewClusters.forEach(cluster => {
        const [lng, lat] = cluster.geometry.coordinates
        const properties = cluster.properties

        if (properties.cluster) {
          // Create cluster marker
          const el = document.createElement('div')
          el.className = 'cluster-marker'
          
          const pointCount = properties.point_count
          const size = Math.min(60, Math.max(30, 20 + Math.log2(pointCount) * 5))
          
          el.style.width = `${size}px`
          el.style.height = `${size}px`
          el.style.borderRadius = '50%'
          el.style.backgroundColor = 'var(--warning)'
          el.style.border = '3px solid var(--foreground)'
          el.style.display = 'flex'
          el.style.alignItems = 'center'
          el.style.justifyContent = 'center'
          el.style.color = 'var(--background)'
          el.style.fontWeight = 'bold'
          el.style.fontSize = `${Math.min(16, size / 3)}px`
          el.style.cursor = 'pointer'
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
          el.textContent = pointCount >= 1000 ? `${(pointCount / 1000).toFixed(1)}k` : String(pointCount)

          el.addEventListener('click', () => {
            const zoom = index.getClusterExpansionZoom(properties.cluster_id)
            map.current?.easeTo({
              center: [lng, lat],
              zoom: Math.min(zoom, 18)
            })
          })

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(map.current!)

          markersRef.current[`cluster-${properties.cluster_id}`] = marker
        } else {
          // Create individual marker
          const el = document.createElement('div')
          el.className = 'marker'
          
          const state = properties.state || 'active'
          let color = 'var(--success)'
          if (state === 'declining') color = 'var(--warning)'
          else if (state === 'closed') color = 'var(--danger)'
          else if (state === 'future') color = 'var(--foreground-muted)'

          el.style.width = '20px'
          el.style.height = '20px'
          el.style.backgroundColor = color
          el.style.border = '2px solid var(--foreground)'
          el.style.transform = 'rotate(45deg)'
          el.style.cursor = 'pointer'
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

          el.addEventListener('mouseenter', () => {
            el.style.transform = 'rotate(45deg) scale(1.2)'
          })
          el.addEventListener('mouseleave', () => {
            el.style.transform = 'rotate(45deg)'
          })

          el.addEventListener('click', () => {
            if (onMarkerClick) {
              onMarkerClick(properties.id)
            }
          })

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(properties.popup))
            .addTo(map.current!)

          markersRef.current[properties.id] = marker

          if (properties.id === activeMarkerId) {
            el.style.transform = 'rotate(45deg) scale(1.3)'
            el.style.zIndex = '1000'
          }
        }
      })
    }

    // Debounce updates for performance
    let updateTimeout: NodeJS.Timeout
    const debouncedUpdate = () => {
      clearTimeout(updateTimeout)
      updateTimeout = setTimeout(updateMarkers, 100)
    }

    map.current.on('moveend', debouncedUpdate)
    map.current.on('zoomend', debouncedUpdate)

    return () => {
      map.current?.off('moveend', debouncedUpdate)
      map.current?.off('zoomend', debouncedUpdate)
    }
  }, [markers, mapLoaded, activeMarkerId, onMarkerClick, getClusteringParams])

  return (
    <div ref={mapContainer} className="w-full h-full" />
  )
}

export default React.memo(MapboxMapTest)