'use client'

import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Supercluster from 'supercluster'

// Set the access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface Marker {
  id: string
  position: [number, number]
  popup: string
  state?: string
}

interface MapboxMapTestProps {
  center: [number, number]
  zoom: number
  markers: Marker[]
  onMarkerClick?: (markerId: string) => void
  activeMarkerId?: string | null
}

const MapboxMapTestSimple: React.FC<MapboxMapTestProps> = ({
  center,
  zoom,
  markers,
  onMarkerClick,
  activeMarkerId,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return
    if (map.current) return // Initialize only once

    try {
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [center[1], center[0]], // [lng, lat]
        zoom: zoom,
        attributionControl: false,
      })

      map.current = mapInstance

      mapInstance.on('load', () => {
        console.log('Map loaded successfully')
        setMapLoaded(true)
      })

      mapInstance.on('error', (e) => {
        console.error('Map error:', e)
      })

      // Add navigation controls
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right')
    } catch (error) {
      console.error('Error initializing map:', error)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Handle markers with clustering
  useEffect(() => {
    if (!map.current || !mapLoaded || !markers.length) return

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove())
    markersRef.current = {}

    // Get current zoom for clustering params
    const currentZoom = map.current.getZoom()

    // Dynamic clustering based on zoom
    let clusterRadius = 60
    let maxMarkers = 200

    if (currentZoom < 10) {
      clusterRadius = 100
      maxMarkers = 100
    } else if (currentZoom < 12) {
      clusterRadius = 60
      maxMarkers = 200
    } else if (currentZoom < 14) {
      clusterRadius = 40
      maxMarkers = 400
    } else {
      clusterRadius = 20
      maxMarkers = 800
    }

    // Setup supercluster
    const index = new Supercluster({
      radius: clusterRadius,
      maxZoom: 16,
      minPoints: 2,
    })

    // Convert markers to GeoJSON
    const points = markers.map((marker) => ({
      type: 'Feature' as const,
      properties: {
        id: marker.id,
        popup: marker.popup,
        state: marker.state || 'active',
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [marker.position[1], marker.position[0]], // [lng, lat]
      },
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    index.load(points as any)

    // Get bounds
    const bounds = map.current.getBounds()
    if (!bounds) return

    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]

    // Get clusters
    const clusters = index.getClusters(bbox, Math.floor(currentZoom))
    const visibleClusters = clusters.slice(0, maxMarkers)

    // Add markers
    visibleClusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates
      const properties = cluster.properties

      if (properties.cluster) {
        // Cluster marker
        const el = document.createElement('div')
        el.className = 'cluster-marker'

        const count = properties.point_count
        const size = Math.min(50, 30 + Math.log2(count) * 3)

        el.style.width = `${size}px`
        el.style.height = `${size}px`
        el.style.borderRadius = '50%'
        el.style.backgroundColor = '#ffcb51'
        el.style.border = '2px solid #fff'
        el.style.display = 'flex'
        el.style.alignItems = 'center'
        el.style.justifyContent = 'center'
        el.style.color = '#000'
        el.style.fontWeight = 'bold'
        el.style.fontSize = '14px'
        el.style.cursor = 'pointer'
        el.textContent = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count)

        el.addEventListener('click', () => {
          const expansionZoom = index.getClusterExpansionZoom(properties.cluster_id)
          map.current?.easeTo({
            center: [lng, lat],
            zoom: expansionZoom,
          })
        })

        new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current!)
      } else {
        // Individual marker
        const el = document.createElement('div')

        // Color based on state
        let color = '#97d8c0' // active
        if (properties.state === 'declining') color = '#ffcb51'
        else if (properties.state === 'closed') color = '#ee5760'

        el.style.width = '16px'
        el.style.height = '16px'
        el.style.backgroundColor = color
        el.style.border = '2px solid #fff'
        el.style.borderRadius = '0'
        el.style.transform = 'rotate(45deg)'
        el.style.cursor = 'pointer'

        el.addEventListener('click', () => {
          if (onMarkerClick) onMarkerClick(properties.id)
        })

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!)

        markersRef.current[properties.id] = marker

        // Add popup
        if (properties.popup) {
          marker.setPopup(new mapboxgl.Popup({ offset: 25 }).setText(properties.popup))
        }
      }
    })

    // Update on map movement
    const updateMarkers = () => {
      // Recursively call this effect
      setTimeout(() => {
        if (!map.current) return

        const newBounds = map.current.getBounds()
        if (!newBounds) return

        const newBbox: [number, number, number, number] = [
          newBounds.getWest(),
          newBounds.getSouth(),
          newBounds.getEast(),
          newBounds.getNorth(),
        ]

        const newZoom = map.current.getZoom()
        const newClusters = index.getClusters(newBbox, Math.floor(newZoom))

        // Clear and re-add markers
        Object.values(markersRef.current).forEach((m) => m.remove())
        markersRef.current = {}

        // Re-add with new clusters
        const limited = newClusters.slice(0, maxMarkers)
        limited.forEach((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates
          const properties = cluster.properties

          if (properties.cluster) {
            const el = document.createElement('div')
            const count = properties.point_count
            const size = Math.min(50, 30 + Math.log2(count) * 3)

            el.style.width = `${size}px`
            el.style.height = `${size}px`
            el.style.borderRadius = '50%'
            el.style.backgroundColor = '#ffcb51'
            el.style.border = '2px solid #fff'
            el.style.display = 'flex'
            el.style.alignItems = 'center'
            el.style.justifyContent = 'center'
            el.style.color = '#000'
            el.style.fontWeight = 'bold'
            el.style.fontSize = '14px'
            el.style.cursor = 'pointer'
            el.textContent = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count)

            el.addEventListener('click', () => {
              const expansionZoom = index.getClusterExpansionZoom(properties.cluster_id)
              map.current?.easeTo({
                center: [lng, lat],
                zoom: expansionZoom,
              })
            })

            new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current!)
          } else {
            const el = document.createElement('div')
            let color = '#97d8c0'
            if (properties.state === 'declining') color = '#ffcb51'
            else if (properties.state === 'closed') color = '#ee5760'

            el.style.width = '16px'
            el.style.height = '16px'
            el.style.backgroundColor = color
            el.style.border = '2px solid #fff'
            el.style.borderRadius = '0'
            el.style.transform = 'rotate(45deg)'
            el.style.cursor = 'pointer'

            el.addEventListener('click', () => {
              if (onMarkerClick) onMarkerClick(properties.id)
            })

            const marker = new mapboxgl.Marker({ element: el })
              .setLngLat([lng, lat])
              .addTo(map.current!)

            if (properties.popup) {
              marker.setPopup(new mapboxgl.Popup({ offset: 25 }).setText(properties.popup))
            }
          }
        })
      }, 100)
    }

    let debounceTimer: NodeJS.Timeout
    const debouncedUpdate = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(updateMarkers, 200)
    }

    map.current.on('moveend', debouncedUpdate)
    map.current.on('zoomend', debouncedUpdate)

    return () => {
      map.current?.off('moveend', debouncedUpdate)
      map.current?.off('zoomend', debouncedUpdate)
    }
  }, [markers, mapLoaded, onMarkerClick, activeMarkerId])

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
}

export default React.memo(MapboxMapTestSimple)
