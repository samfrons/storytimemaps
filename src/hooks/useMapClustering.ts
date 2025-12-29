'use client'

import { useMemo, useState, useEffect } from 'react'
import Supercluster from 'supercluster'
import mapboxgl from 'mapbox-gl'

interface MarkerInput {
  id: string
  position: [number, number]
  popup: string
  state?: string
  description?: string
  startDate?: string
  endDate?: string
}

interface GeoJSONFeature {
  type: 'Feature'
  properties: {
    id: string
    popup: string
    state: string
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

interface ClusterProperties {
  cluster?: boolean
  cluster_id?: number
  point_count?: number
  id?: string
  popup?: string
  state?: string
}

export type ClusterFeature = GeoJSON.Feature<GeoJSON.Point, ClusterProperties>

interface UseMapClusteringProps {
  markers: MarkerInput[]
  data?: {
    features?: Array<{
      properties: {
        id?: string
        name?: string
        address?: string
        founded_date?: string
        closing_date?: string
      }
      geometry: {
        coordinates: [number, number]
      }
    }>
  }
  isTestMode: boolean
  isMobile: boolean
  mapLoaded: boolean
  mapRef: React.RefObject<{ getBounds: () => mapboxgl.LngLatBounds | null } | null>
  viewStateZoom: number
}

interface UseMapClusteringReturn {
  clusters: ClusterFeature[]
  supercluster: Supercluster<ClusterProperties, ClusterProperties>
  processedMarkers: MarkerInput[]
}

/**
 * Spatial sampling function for even marker distribution
 */
function spatialSample(
  markers: ClusterFeature[],
  maxCount: number,
  bbox: [number, number, number, number]
): ClusterFeature[] {
  if (markers.length <= maxCount) return markers

  // Create a spatial grid
  const gridSize = Math.ceil(Math.sqrt(maxCount))
  const [west, south, east, north] = bbox
  const cellWidth = (east - west) / gridSize
  const cellHeight = (north - south) / gridSize

  // Group markers by grid cell
  const grid: { [key: string]: ClusterFeature[] } = {}

  markers.forEach((marker) => {
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
  const sampled: ClusterFeature[] = []
  const gridKeys = Object.keys(grid)
  const markersPerCell = Math.max(1, Math.floor(maxCount / gridKeys.length))

  gridKeys.forEach((key) => {
    const cellMarkers = grid[key]
    // Prioritize active businesses
    const sorted = cellMarkers.sort((a, b) => {
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

/**
 * Hook for managing map marker clustering with Supercluster.
 * Handles viewport-based clustering and spatial sampling for large datasets.
 */
export function useMapClustering({
  markers,
  data,
  isTestMode,
  isMobile,
  mapLoaded,
  mapRef,
  viewStateZoom,
}: UseMapClusteringProps): UseMapClusteringReturn {
  // Throttled viewport bounds for better performance
  const [throttledViewport, setThrottledViewport] = useState<{
    zoom: number
    bounds: mapboxgl.LngLatBounds | null
  }>({ zoom: viewStateZoom, bounds: null })

  // Process GeoJSON data for Frankfurt
  const processedMarkers = useMemo(() => {
    if (data && data.features) {
      // Convert GeoJSON features to markers format
      return data.features.map((feature, index) => ({
        id: feature.properties.id?.toString() || `marker-${index}`,
        position: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]] as [
          number,
          number,
        ],
        popup: feature.properties.name || '',
        state: 'active', // Default state, can be derived from date comparison
        description: feature.properties.address || '',
        startDate: feature.properties.founded_date,
        endDate: feature.properties.closing_date,
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
      const currentZoom = viewStateZoom
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

    const index = new Supercluster<ClusterProperties, ClusterProperties>({
      radius,
      maxZoom,
      minPoints,
      extent: 512, // Standard tile extent
      nodeSize: 64, // Standard node size
    })

    if (processedMarkers.length > 0) {
      const points: GeoJSONFeature[] = processedMarkers.map((marker) => ({
        type: 'Feature',
        properties: {
          id: marker.id,
          popup: marker.popup,
          state: marker.state || 'active',
        },
        geometry: {
          type: 'Point',
          coordinates: [marker.position[1], marker.position[0]],
        },
      }))
      index.load(points as Supercluster.PointFeature<ClusterProperties>[])
    }

    return index
  }, [processedMarkers, isMobile, isTestMode, viewStateZoom])

  // Pre-compute initial markers for fallback with spatial distribution
  const initialMarkers = useMemo(() => {
    if (!processedMarkers.length) return []

    // Take every 10th marker for better spatial distribution than just first 40
    const step = Math.max(1, Math.floor(processedMarkers.length / 30))
    const selectedMarkers = []

    for (let i = 0; i < processedMarkers.length && selectedMarkers.length < 30; i += step) {
      selectedMarkers.push(processedMarkers[i])
    }

    return selectedMarkers.map((marker) => ({
      type: 'Feature' as const,
      properties: {
        id: marker.id,
        popup: marker.popup,
        state: marker.state || 'active',
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [marker.position[1], marker.position[0]] as [number, number],
      },
    }))
  }, [processedMarkers])

  // Throttle viewport updates
  useEffect(() => {
    const throttleTimer = setTimeout(() => {
      if (mapRef.current && mapLoaded) {
        const bounds = mapRef.current.getBounds()
        setThrottledViewport({ zoom: Math.floor(viewStateZoom), bounds })
      }
    }, 150) // Throttle viewport updates to 150ms

    return () => clearTimeout(throttleTimer)
  }, [viewStateZoom, mapLoaded, mapRef])

  // Get clusters for current viewport with optimized recalculation and viewport culling
  const clusters = useMemo(() => {
    // Always return initial markers if map is not ready
    if (!mapLoaded || !throttledViewport.bounds) {
      return initialMarkers as ClusterFeature[]
    }

    try {
      // Add buffer to viewport for smooth panning
      const buffer = 0.1 // 10% buffer around viewport
      const bounds = throttledViewport.bounds
      const width = bounds.getEast() - bounds.getWest()
      const height = bounds.getNorth() - bounds.getSouth()

      const bbox: [number, number, number, number] = [
        bounds.getWest() - width * buffer,
        bounds.getSouth() - height * buffer,
        bounds.getEast() + width * buffer,
        bounds.getNorth() + height * buffer,
      ]

      const clusteredMarkers = supercluster.getClusters(bbox, throttledViewport.zoom)

      // At very high zoom levels, limit individual markers spatially
      if (throttledViewport.zoom > 15) {
        const maxIndividualMarkers = isTestMode
          ? isMobile
            ? 200
            : 800 // Much higher limits for test mode
          : isMobile
            ? 50
            : 150
        const clusterItems = clusteredMarkers.filter((m) => m.properties?.cluster)
        const individuals = clusteredMarkers.filter((m) => !m.properties?.cluster)

        // Spatial sampling: spread markers evenly across viewport
        const sampledIndividuals = spatialSample(
          individuals as ClusterFeature[],
          maxIndividualMarkers,
          bbox
        )

        return [...clusterItems, ...sampledIndividuals] as ClusterFeature[]
      }

      return clusteredMarkers as ClusterFeature[]
    } catch (error) {
      console.warn('Error getting clusters:', error)
      return initialMarkers.slice(0, 20) as ClusterFeature[]
    }
  }, [supercluster, throttledViewport, mapLoaded, initialMarkers, isMobile, isTestMode])

  return {
    clusters,
    supercluster,
    processedMarkers,
  }
}

/**
 * Hook for managing label priorities based on zoom level
 */
export function useLabelPriorities(
  mapLoaded: boolean,
  clusters: ClusterFeature[],
  activeMarkerId: string | null | undefined,
  hoveredMarkerId: string | null,
  throttledZoom: number
): Set<string> {
  const [labelPriorities, setLabelPriorities] = useState<Set<string>>(new Set())

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

  // Update label priorities when viewport changes - throttled for performance
  useEffect(() => {
    if (!mapLoaded || !clusters) return

    const updatePriorities = () => {
      const maxLabels = getMaxLabels(throttledZoom)
      const nonClusteredMarkers = clusters.filter((c) => !('cluster' in (c.properties || {})))

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
      const step = Math.max(
        2,
        Math.floor(nonClusteredMarkers.length / (maxLabels - priorities.size))
      )
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
  }, [throttledZoom, clusters, activeMarkerId, hoveredMarkerId, mapLoaded])

  return labelPriorities
}
