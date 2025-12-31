/**
 * Map helper utilities
 *
 * Shared functions for map-related operations like clustering and spatial sampling.
 */

export interface ClusterFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: {
    cluster?: boolean
    cluster_id?: number
    point_count?: number
    id?: string
    popup?: string
    state?: string
  }
}

export interface MarkerInput {
  id: string
  position: [number, number]
  popup: string
  state?: string
  description?: string
  startDate?: string
  endDate?: string
}

/**
 * Spatial sampling function for even marker distribution across a viewport.
 *
 * Given a set of markers and a bounding box, this function returns a subset
 * of markers that are evenly distributed across the viewport, prioritizing
 * active businesses.
 *
 * @param markers - Array of cluster features to sample from
 * @param maxCount - Maximum number of markers to return
 * @param bbox - Bounding box [west, south, east, north]
 * @returns Sampled markers with even spatial distribution
 */
export function spatialSample<T extends ClusterFeature>(
  markers: T[],
  maxCount: number,
  bbox: [number, number, number, number]
): T[] {
  if (markers.length <= maxCount) return markers

  const [west, south, east, north] = bbox

  // Handle edge case where bbox has zero width or height
  const width = east - west
  const height = north - south
  if (width <= 0 || height <= 0) {
    return markers.slice(0, maxCount)
  }

  // Create a spatial grid
  const gridSize = Math.ceil(Math.sqrt(maxCount))
  const cellWidth = width / gridSize
  const cellHeight = height / gridSize

  // Group markers by grid cell
  const grid: { [key: string]: T[] } = {}

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

  // Sample from each cell, prioritizing active businesses
  const sampled: T[] = []
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
 * Convert markers array to GeoJSON features
 */
export function markersToGeoJSON(markers: MarkerInput[]): ClusterFeature[] {
  return markers.map((marker) => ({
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
}

/**
 * Get initial markers with even spatial distribution
 *
 * @param markers - All markers
 * @param count - Number of initial markers to select
 * @returns Spatially distributed subset of markers
 */
export function getInitialMarkers(markers: MarkerInput[], count: number = 30): ClusterFeature[] {
  if (!markers.length) return []

  // Take every Nth marker for better spatial distribution
  const step = Math.max(1, Math.floor(markers.length / count))
  const selectedMarkers: MarkerInput[] = []

  for (let i = 0; i < markers.length && selectedMarkers.length < count; i += step) {
    selectedMarkers.push(markers[i])
  }

  return markersToGeoJSON(selectedMarkers)
}

/**
 * Calculate viewport bounds with buffer for smooth panning
 *
 * @param bounds - Original bounds object with getWest/getEast/getSouth/getNorth methods
 * @param buffer - Buffer percentage (0.1 = 10%)
 * @returns Expanded bounding box [west, south, east, north]
 */
export function getBufferedBbox(
  bounds: {
    getWest: () => number
    getEast: () => number
    getSouth: () => number
    getNorth: () => number
  },
  buffer: number = 0.1
): [number, number, number, number] {
  const width = bounds.getEast() - bounds.getWest()
  const height = bounds.getNorth() - bounds.getSouth()

  return [
    bounds.getWest() - width * buffer,
    bounds.getSouth() - height * buffer,
    bounds.getEast() + width * buffer,
    bounds.getNorth() + height * buffer,
  ]
}
