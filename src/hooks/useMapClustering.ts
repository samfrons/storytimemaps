'use client'

import { useMemo, useState, useEffect } from 'react'
import Supercluster from 'supercluster'
import mapboxgl from 'mapbox-gl'
import { spatialSample, type ClusterFeature, type MarkerInput } from '../utils/mapHelpers'
import { PERFORMANCE_CONFIG } from '../config/performance'

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

export type { ClusterFeature } from '../utils/mapHelpers'

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
  // NOTE: Removed viewStateZoom from dependencies to prevent expensive re-indexing on zoom change
  // The clustering radius is set to a moderate value that works well across zoom levels
  // Supercluster.getClusters() already handles zoom-based clustering at query time
  const supercluster = useMemo(() => {
    const { CLUSTERING } = PERFORMANCE_CONFIG

    // Use a moderate radius that works across zoom levels
    // For test mode with 10,000+ markers, use a slightly larger radius
    const radius = isTestMode
      ? isMobile
        ? 60
        : 40 // Moderate radius for large datasets
      : isMobile
        ? CLUSTERING.MOBILE_RADIUS
        : CLUSTERING.DESKTOP_RADIUS

    const maxZoom = isMobile ? CLUSTERING.MOBILE_MAX_ZOOM : CLUSTERING.DESKTOP_MAX_ZOOM
    const minPoints = isMobile ? CLUSTERING.MOBILE_MIN_POINTS : CLUSTERING.DESKTOP_MIN_POINTS

    const index = new Supercluster<ClusterProperties, ClusterProperties>({
      radius,
      maxZoom,
      minPoints,
      extent: CLUSTERING.TILE_EXTENT,
      nodeSize: CLUSTERING.NODE_SIZE,
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
  }, [processedMarkers, isMobile, isTestMode]) // Removed viewStateZoom - clustering handled at query time

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
    }, PERFORMANCE_CONFIG.THROTTLE_MS.VIEWPORT) // Throttle viewport updates

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
      const buffer = PERFORMANCE_CONFIG.VIEWPORT.BUFFER
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
      const { DISPLAY_LIMITS, VIEWPORT } = PERFORMANCE_CONFIG
      if (throttledViewport.zoom > VIEWPORT.HIGH_ZOOM_THRESHOLD) {
        const maxIndividualMarkers = isTestMode
          ? isMobile
            ? DISPLAY_LIMITS.MAX_MARKERS_MOBILE
            : DISPLAY_LIMITS.MAX_MARKERS_DESKTOP
          : isMobile
            ? DISPLAY_LIMITS.MAX_MARKERS_MOBILE_NORMAL
            : DISPLAY_LIMITS.MAX_MARKERS_DESKTOP_NORMAL
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
