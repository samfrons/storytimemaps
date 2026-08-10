'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Map, { Marker, NavigationControl, Popup, Source, Layer } from 'react-map-gl/mapbox'
import Supercluster from 'supercluster'
import { useTheme } from 'next-themes'
import mapboxgl from 'mapbox-gl'
import { useMobileOptimizations } from '../../hooks/useMobileOptimizations'
import { useTranslation } from '../../i18n/useTranslation'
import { sectorLabel } from '../../utils/businessSectors'
import MapLegend from './map/MapLegend'
import { loadTimelineData, getTimelineContentForDate } from '../../utils/timelineLoader'
import {
  getThemeMapStyle,
  getThemeMarkerColors,
  isCustomStyleTheme,
  isModificationTheme,
} from '../../utils/mapStyles'
import { getMaxLabelsForZoom } from '../../config/performance'
import { spatialSample, type ClusterFeature } from '../../utils/mapHelpers'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

/** Ids for the GPU dot path (see GL_DOT_LAYER in the component). */
const GL_DOT_SOURCE_ID = 'business-dots-source'
const GL_DOT_LAYER_ID = 'business-dots'

/**
 * Pick readable text for a label chip from its background.
 *
 * The chip text used to be hardcoded dark except for 'closed'. That held while every state
 * colour was light, but the postwar 'standing' colour is black on bauhaus and dark slate on the
 * light themes, which would have printed dark-on-dark. Deriving it keeps every current and
 * future state legible without another per-state ternary.
 */
/**
 * Apply an alpha to a colour that may be hex OR rgb()/rgba().
 *
 * The label chip used to do `${chip}e8` to get ~91% alpha. That works for #rrggbb but produces
 * "rgba(44, 74, 124, 0.85)e8" for the archival theme, whose marker colours are all rgba - an
 * invalid value, so every archival label chip rendered fully transparent.
 */
const withAlpha = (color: string, alpha: number): string => {
  const hex = color.trim().match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    const n = parseInt(hex[1], 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
  }
  const rgb = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`
  return color
}

const readableTextOn = (background: string): string => {
  const hex = background.trim().match(/^#?([0-9a-f]{6})$/i)
  let r: number, g: number, b: number
  if (hex) {
    const n = parseInt(hex[1], 16)
    r = (n >> 16) & 255
    g = (n >> 8) & 255
    b = n & 255
  } else {
    const rgb = background.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (!rgb) return '#2a2a2a'
    r = +rgb[1]
    g = +rgb[2]
    b = +rgb[3]
  }
  // Rec. 601 luma is enough to separate "light chip" from "dark chip" here.
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luma > 0.6 ? '#2a2a2a' : '#ffffff'
}

if (!MAPBOX_TOKEN) {
  console.error(
    'Mapbox token is not configured. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local file'
  )
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
  /**
   * Date-INDEPENDENT points, used by the GPU dot layer (see GL_DOT_LAYER below).
   * Unlike `markers` these carry raw year fields instead of a resolved `state`, so the array
   * keeps its identity while the time slider moves. Supplying this alongside `isTestMode`
   * switches the map off DOM markers + Supercluster and onto a single GL circle layer.
   */
  timeMarkers?: Array<{
    id: string
    position: [number, number]
    popup: string
    startYear: number
    endYear: number
    midYear: number | null
    /** Documented post-1945 occupancy window; 9999 means "never" (see postwarLoader). */
    postwarFrom?: number
    postwarTo?: number
    businessType?: string
    hasEnrichedData?: boolean
  }>
  enrichedStories?: Array<{
    id: string
    startDate?: string | null
    endDate?: string | null
    description?: string | null
    hasTimelineData?: boolean
    businessType?: string
    sectorKey?: string
    mainBranch?: 'trade' | 'industry' | 'services' | 'handicraft'
  }>
  /** Category filter, shared with StoryList so the legend and dropdown agree. */
  selectedCategory?: string
  onSelectCategory?: (value: string) => void
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
  currentDate,
  timeMarkers,
  enrichedStories = [],
  isTestMode = false,
  city = 'berlin',
  data,
  selectedDate,
  onBusinessSelect,
  selectedCategory,
  onSelectCategory,
}) => {
  const mapRef = useRef<React.ComponentRef<typeof Map> | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const markerCache = useRef<globalThis.Map<string, React.ReactElement[]>>(new globalThis.Map())
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
    zoom: zoom,
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
      hasTimelineData?: boolean
      [key: string]: unknown
    }
  } | null>(null)
  const [popupTimelineData, setPopupTimelineData] = useState<{ [key: string]: any }>({})

  // Get theme-specific marker colors from centralized config
  const colors = useMemo(() => getThemeMarkerColors(theme), [theme])

  // Clear marker cache when theme or colors change
  useEffect(() => {
    markerCache.current.clear()
  }, [theme, colors])

  // Keep the GL canvas in step with its container.
  // mapbox-gl only listens for `window.resize`, so any layout change that resizes the container
  // WITHOUT resizing the window (a collapsing side panel, the nav rail changing width, a
  // devtools split) leaves the canvas frozen at its old size and paints a dead strip of
  // background where the map should be. Verified: collapsing the list container grew the box to
  // ~1348px while the canvas stayed at 916px until a resize was dispatched.
  useEffect(() => {
    const container = mapContainerRef.current
    if (!container || !mapLoaded) return
    if (typeof ResizeObserver === 'undefined') return

    let frame = 0
    const observer = new ResizeObserver(() => {
      // Coalesce to one resize per frame; a CSS width transition fires this on every frame and
      // map.resize() is not cheap with 10k markers mounted.
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        mapRef.current?.getMap()?.resize()
      })
    })
    observer.observe(container)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [mapLoaded])

  // getMaxLabels is now imported from config as getMaxLabelsForZoom
  const getMaxLabels = getMaxLabelsForZoom

  // Get mobile optimizations
  const { isMobile } = useMobileOptimizations()

  // Process GeoJSON data for Frankfurt
  const processedMarkers = useMemo(() => {
    if (data && data.features) {
      // Convert GeoJSON features to markers format
      return data.features.map((feature: any, index: number) => ({
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

  /* ------------------------------------------------------------------ *
   * GL_DOT_LAYER - the GPU path for the main storymap
   *
   * The DOM-marker + Supercluster path below cannot serve this map. Every slider step rebuilt
   * all 10k marker objects, which invalidated the Supercluster index and re-rendered every
   * <Marker>; measured 2.6-3.0 s of blocked main thread per drag, and it was insensitive to
   * marker count (839 markers stalled as long as 2,589), so clustering harder never helped.
   *
   * Here the 10,021 points become ONE GeoJSON source built once, and `state` is derived on the
   * GPU by a data-driven paint expression over the raw year fields. A date change therefore
   * only swaps a colour expression - no re-cluster, no React reconciliation, no DOM churn.
   * That is also why the points are no longer clustered at all: at 10k GL circles there is
   * nothing to save, and the uninterrupted field of coloured dots IS the visualisation.
   * ------------------------------------------------------------------ */
  const useGlDots = Boolean(isTestMode && timeMarkers && timeMarkers.length > 0)

  const currentYear = useMemo(
    () => (currentDate ? currentDate.getFullYear() : selectedDate?.getFullYear()) ?? 1920,
    [currentDate, selectedDate]
  )

  // Built from `timeMarkers`, which is memoised upstream on the dataset (not the date), so this
  // GeoJSON is re-serialised only when businesses are actually added - not on every slider tick.
  const dotsGeoJSON = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(() => {
    const features: GeoJSON.Feature<GeoJSON.Point>[] = []
    if (timeMarkers) {
      for (const m of timeMarkers) {
        const [lat, lng] = m.position
        if (typeof lat !== 'number' || typeof lng !== 'number') continue
        features.push({
          type: 'Feature',
          // No top-level `id` here on purpose: mapbox-gl only accepts numeric feature ids at
          // that position, and these are strings. The Source below sets promoteId="id" so the
          // `id` PROPERTY becomes the feature id, which is what setFeatureState addresses.
          properties: {
            id: m.id,
            name: m.popup,
            startYear: m.startYear,
            endYear: m.endYear,
            // Expressions cannot test for null, so absent midYear becomes a sentinel that can
            // never satisfy `year >= midYear` for this dataset's 1900-1945 range.
            midYear: m.midYear ?? 9999,
            // Documented-occupancy window for this address after 1945. 9999 is the
            // never-matches sentinel, same convention as midYear above.
            postwarFrom: m.postwarFrom ?? 9999,
            postwarTo: m.postwarTo ?? 9999,
          },
          geometry: { type: 'Point', coordinates: [lng, lat] },
        })
      }
    }
    return { type: 'FeatureCollection', features }
  }, [timeMarkers])

  // The whole point of the rewrite: `currentYear` enters as a literal inside a Mapbox
  // expression, so moving the slider is a setPaintProperty, not a data reload.
  // Order matters and mirrors useStoryMapLogic's state ladder: future -> closed -> declining.
  const dotColorExpression = useMemo(
    () =>
      [
        'case',
        // Postwar occupancy wins over the wartime ladder: once the business is gone, what the
        // pin reports is the address, not the firm. Only addresses with a documented, in-use
        // period reach this branch - destroyed and demolished sites deliberately do not.
        [
          'all',
          ['>=', currentYear, ['get', 'postwarFrom']],
          ['<=', currentYear, ['get', 'postwarTo']],
        ],
        colors.standing,
        ['<', currentYear, ['get', 'startYear']],
        colors.future || colors.active,
        ['>', currentYear, ['get', 'endYear']],
        colors.closed,
        ['>=', currentYear, ['get', 'midYear']],
        colors.declining,
        colors.active,
      ] as unknown as mapboxgl.ExpressionSpecification,
    [currentYear, colors]
  )

  const isHardEdgeTheme = theme === 'bauhaus' || theme === 'brutal-pop'

  const dotLayer = useMemo(
    () => ({
      id: GL_DOT_LAYER_ID,
      type: 'circle' as const,
      paint: {
        'circle-color': dotColorExpression,
        // Small enough at Berlin-wide zoom that 10k dots read as density rather than mush,
        // large enough by z16 to stay a comfortable click target.
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          9,
          1.6,
          11,
          2.6,
          13,
          4,
          15,
          5.5,
          17,
          7,
        ] as unknown as mapboxgl.DataDrivenPropertyValueSpecification<number>,
        // Hover/active get a heavier ring instead of a size jump, so nothing reflows.
        'circle-stroke-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          2.5,
          ['boolean', ['feature-state', 'active'], false],
          3,
          isHardEdgeTheme ? 0.75 : 1,
        ] as unknown as mapboxgl.DataDrivenPropertyValueSpecification<number>,
        'circle-stroke-color': isHardEdgeTheme ? '#131318' : '#ffffff',
        'circle-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          9,
          0.75,
          13,
          0.95,
        ] as unknown as mapboxgl.DataDrivenPropertyValueSpecification<number>,
      },
    }),
    [dotColorExpression, isHardEdgeTheme]
  )

  // Initialize Supercluster for clustering with optimized settings for large datasets
  // PERF: Removed viewState.zoom from dependencies - Supercluster handles zoom internally via getClusters()
  // This prevents expensive index rebuilding on every zoom change (was causing jank)
  const supercluster = useMemo(() => {
    // Use fixed radius settings - Supercluster adjusts clustering based on zoom passed to getClusters()
    // Higher radius = more aggressive clustering at all zoom levels
    //
    // isTestMode is the MAIN storymap (page.tsx passes isTestMode), not a test fixture.
    // It used to cluster hardest of all modes (radius 60 / minPoints 2), which collapsed ~9,500
    // in-viewport points into ~91 bubbles and left only a handful of loose pins. That defeats
    // the point of the map: the time-based colour gradient across thousands of individual dots
    // IS the visualisation - the time slider only reads if enough dots are individually
    // coloured at the zoom people actually sit at (the default is z12, Berlin-wide).
    //
    // Measured against the live 10,021-point dataset at z12 in a 950x900 map pane:
    //   radius 15 / minPoints 4  ->   652 loose pins / 346 bubbles   (previous)
    //   radius  8 / minPoints 8  -> 2,617 loose pins / 186 bubbles   (current)
    // minPoints is the higher-leverage knob: it is the floor on how many points must fall
    // within `radius` before they collapse, so raising it keeps small groups as separate dots.
    // Mobile stays deliberately coarser - same trade, smaller pane, weaker GPU.
    //
    // The non-isTestMode branch is deliberately left untouched: /jewish-businesses rides it with
    // 2,760 features and retuning it there would roughly double its DOM marker count.
    const radius = isTestMode ? (isMobile ? 12 : 8) : isMobile ? 40 : 20
    const maxZoom = 18
    const minPoints = isTestMode ? (isMobile ? 8 : 8) : isMobile ? 4 : 2

    const index = new Supercluster({
      radius,
      maxZoom,
      minPoints,
      extent: 512, // Standard tile extent
      nodeSize: 64, // Standard node size
      // Tally member states into each cluster so a bubble can be coloured by its dominant
      // state instead of one flat theme colour. Computed once at index build, so reading it
      // per render is O(1) - getLeaves() would be O(n) per bubble per frame.
      map: (props) => ({
        activeCount: props.state === 'active' ? 1 : 0,
        decliningCount: props.state === 'declining' ? 1 : 0,
        closedCount: props.state === 'closed' ? 1 : 0,
        futureCount: props.state === 'future' ? 1 : 0,
        standingCount: props.state === 'standing' ? 1 : 0,
      }),
      reduce: (accumulated, props) => {
        accumulated.activeCount += props.activeCount
        accumulated.decliningCount += props.decliningCount
        accumulated.closedCount += props.closedCount
        accumulated.futureCount += props.futureCount
        accumulated.standingCount += props.standingCount
      },
    })

    // Loading the index is the single most expensive thing this component did per date change
    // (10k points, and `processedMarkers` changed identity on every slider tick). The GL dot
    // path does not consume clusters at all, so skip the load entirely and hand back an empty
    // index - handleClusterClick still needs a valid instance to call into.
    const markersToUse = useGlDots ? [] : processedMarkers
    if (markersToUse.length > 0) {
      const points: GeoJSON.Feature<GeoJSON.Point, { id: string; popup: string; state: string }>[] =
        markersToUse.map((marker: any) => ({
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
      index.load(points as Supercluster.PointFeature<Supercluster.AnyProps>[])
    }

    return index
  }, [processedMarkers, isMobile, isTestMode, useGlDots])

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

    return selectedMarkers.map((marker) => ({
      type: 'Feature' as const,
      properties: {
        id: marker.id,
        popup: marker.popup,
        state: marker.state || 'active',
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [marker.position[1], marker.position[0]],
      },
    }))
  }, [processedMarkers])

  // Throttled viewport bounds for better performance
  const [throttledViewport, setThrottledViewport] = useState({
    zoom: viewState.zoom,
    bounds: null as mapboxgl.LngLatBounds | null,
  })

  useEffect(() => {
    const throttleTimer = setTimeout(() => {
      if (mapRef.current && mapLoaded) {
        const bounds = mapRef.current.getBounds()
        setThrottledViewport({ zoom: Math.floor(viewState.zoom), bounds })
      }
    }, 150) // Throttle viewport updates to 150ms

    return () => clearTimeout(throttleTimer)
  }, [viewState.zoom, mapLoaded])

  // Labels for the GL dot path. The old system mounted a DOM <Marker> per label and derived
  // priorities from the cluster output; with the dots on the GPU there is no cluster output, so
  // candidates come straight off the stable source, sampled across the viewport and capped by
  // the same per-zoom budget as before. These labels are the only DOM this path still mounts.
  const glLabels = useMemo(() => {
    if (!useGlDots || !mapLoaded) return []
    const bounds = throttledViewport.bounds
    if (!bounds) return []

    const maxLabels = getMaxLabels(throttledViewport.zoom)
    if (maxLabels <= 0) return []

    const west = bounds.getWest()
    const east = bounds.getEast()
    const south = bounds.getSouth()
    const north = bounds.getNorth()

    const inView: GeoJSON.Feature<GeoJSON.Point>[] = []
    for (const f of dotsGeoJSON.features) {
      const [lng, lat] = f.geometry.coordinates
      if (lng >= west && lng <= east && lat >= south && lat <= north) inView.push(f)
    }
    if (inView.length === 0) return []

    // Even stride rather than the first N, so labels spread across the viewport instead of
    // piling up wherever the dataset happens to start.
    const step = Math.max(1, Math.floor(inView.length / maxLabels))
    const picked: GeoJSON.Feature<GeoJSON.Point>[] = []
    for (let i = 0; i < inView.length && picked.length < maxLabels; i += step) {
      picked.push(inView[i])
    }
    return picked
  }, [useGlDots, mapLoaded, throttledViewport, dotsGeoJSON, getMaxLabels])

  // Get clusters for current viewport with optimized recalculation and viewport culling
  const clusters = useMemo(() => {
    // The GL dot path renders every point itself; running the DOM/cluster path alongside it
    // would double-draw the map and re-introduce the per-date stall this rewrite removed.
    if (useGlDots) return []

    // Always return initial markers if map is not ready
    if (!mapLoaded || !throttledViewport.bounds) {
      return initialMarkers
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

      // Smart limiting: show ALL clusters, limit only individual markers
      const processedMarkers = clusteredMarkers.map((marker) => {
        // Always show clusters
        if (marker.properties?.cluster) {
          return marker
        }
        // For individual markers, apply spatial sampling at high zoom
        return marker
      })

      // At very high zoom levels, limit individual markers spatially.
      // The isTestMode ceiling must sit ABOVE what z14 already renders under the current
      // cluster tuning (~1,500 loose pins), otherwise crossing z15 while zooming IN visibly
      // thins the map out - pins disappear as you get closer, which reads as a bug.
      if (throttledViewport.zoom > 15) {
        const maxIndividualMarkers = isTestMode ? (isMobile ? 400 : 1800) : isMobile ? 50 : 150
        const clusters = processedMarkers.filter((m) => m.properties?.cluster)
        const individuals = processedMarkers.filter((m) => !m.properties?.cluster)

        // Spatial sampling: spread markers evenly across viewport
        const sampledIndividuals = spatialSample(
          individuals as ClusterFeature[],
          maxIndividualMarkers,
          bbox
        )

        return [...clusters, ...sampledIndividuals]
      }

      return processedMarkers
    } catch (error) {
      console.warn('Error getting clusters:', error)
      return initialMarkers.slice(0, 20)
    }
  }, [supercluster, throttledViewport, mapLoaded, initialMarkers, isMobile, isTestMode, useGlDots])

  // Update label priorities when viewport changes - throttled for performance
  useEffect(() => {
    if (!mapLoaded || !clusters) return

    const updatePriorities = () => {
      const maxLabels = getMaxLabels(throttledViewport.zoom)
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
        // nonClusteredMarkers holds only leaf features, but Supercluster's union type also
        // covers cluster properties (which carry no id), so narrow before reading it.
        const markerId = (marker?.properties as { id?: string } | undefined)?.id
        if (markerId) {
          priorities.add(markerId)
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

    const activeMarker = markers.find((m) => m.id === activeMarkerId)
    if (activeMarker) {
      // Fly to the marker
      mapRef.current.flyTo({
        center: [activeMarker.position[1], activeMarker.position[0]],
        zoom: 14,
        duration: 800,
      })

      // Open the popup for this marker
      const enrichedStory = enrichedStories.find((s) => s.id === activeMarkerId)
      setPopupInfo({
        longitude: activeMarker.position[1],
        latitude: activeMarker.position[0],
        properties: {
          id: activeMarker.id,
          popup: activeMarker.popup,
          state: activeMarker.state,
          ...enrichedStory,
        },
      })
    }
  }, [activeMarkerId, markers, enrichedStories])

  // Optimized theme application with reduced WebGL operations
  const applyThemeStyles = useCallback(
    (map: mapboxgl.Map, forceRender = false) => {
      // Custom style themes handle their own rendering - no modifications needed
      if (isCustomStyleTheme(theme)) {
        return
      }

      // Only apply modifications to themes that use the modification approach
      if (!isModificationTheme(theme)) {
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
              water: '#87CEEB', // Sky blue
              park: '#90EE90', // Light green
              road: '#B0B0B0', // Light gray
              background: '#F5F5F5', // Very light gray
            }
          } else {
            // Default colors for cool, warm, art-nouveau
            return {
              water: '#5a5766', // Dark purple-gray
              park: '#97d8c0', // Mint green
              road: '#f5cdb4', // Light peach
              background: '#4a4a57', // Dark background
            }
          }
        }

        const mapColors = getMapColors()
        let styleChangesApplied = false

        // Apply custom colors to layers with batch operations
        layers.forEach((layer) => {
          try {
            let layerModified = false

            // Water layers
            if (layer.id.includes('water') && layer.type === 'fill') {
              map.setPaintProperty(layer.id, 'fill-color', mapColors.water)
              map.setPaintProperty(layer.id, 'fill-opacity', theme === 'cold' ? 0.5 : 0.8)
              layerModified = true
            }

            // Park/landuse layers
            if (
              (layer.id.includes('park') || layer.id.includes('landuse')) &&
              layer.type === 'fill'
            ) {
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
                const style = getComputedStyle(document.documentElement)
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

                style.layers.forEach((layer) => {
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
    },
    [theme]
  )

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

      popupTips.forEach((tip) => {
        const tipElement = tip as HTMLElement
        tipElement.style.borderTopColor = color
        tipElement.style.borderBottomColor = color
        tipElement.style.borderLeftColor = color
        tipElement.style.borderRightColor = color
      })
    }, 50) // Small delay to ensure DOM is ready

    return () => clearTimeout(timer)
  }, [popupInfo, colors.active, colors.declining, colors.closed])

  /**
   * Resolve a point's state the same way the GL colour expression does, for popups and label
   * chips. The postwar branch has to be first and has to be here as well as in the expression:
   * label chips are DOM, the dots are GL, and if only one of them knew about postwar occupancy
   * a site would render as a white dot wearing a red "closed" label.
   */
  const stateForYears = useCallback(
    (
      startYear: number,
      endYear: number,
      midYear: number | null | undefined,
      postwarFrom?: number,
      postwarTo?: number
    ) => {
      if (
        postwarFrom != null &&
        postwarTo != null &&
        currentYear >= postwarFrom &&
        currentYear <= postwarTo
      ) {
        return 'standing'
      }
      if (currentYear < startYear) return 'future'
      if (currentYear > endYear) return 'closed'
      if (midYear != null && midYear !== 9999 && currentYear >= midYear) return 'declining'
      return 'active'
    },
    [currentYear]
  )

  // Shared by the GL dot layer and its labels so both open the identical popup.
  const openBusinessPopup = useCallback(
    async (
      id: string,
      name: string,
      lng: number,
      lat: number,
      state: string,
      sourceEvent?: { originalEvent?: MouseEvent }
    ) => {
      sourceEvent?.originalEvent?.stopPropagation()
      if (onMarkerClick) onMarkerClick(id)

      const enrichedStory = enrichedStories.find((s) => s.id === id)
      if (enrichedStory?.hasTimelineData) {
        const timelineData = await loadTimelineData(id)
        if (timelineData) {
          setPopupTimelineData((prev) => ({ ...prev, [id]: timelineData }))
        }
      }

      setPopupInfo({
        longitude: lng,
        latitude: lat,
        properties: { id, popup: name, state, ...enrichedStory },
      })
    },
    [onMarkerClick, enrichedStories]
  )

  // feature-state drives the hover/active ring in the dot layer's paint expression, which keeps
  // emphasis on the GPU - setting React state per mousemove over 10k points would defeat the
  // whole rewrite.
  const hoveredFeatureId = useRef<string | null>(null)

  const setDotFeatureState = useCallback(
    (id: string | null, key: 'hover' | 'active', value: boolean) => {
      const map = mapRef.current?.getMap()
      if (!map || !id) return
      if (!map.getSource(GL_DOT_SOURCE_ID)) return
      try {
        map.setFeatureState({ source: GL_DOT_SOURCE_ID, id }, { [key]: value })
      } catch {
        // Source can be mid-reload while the dataset grows; the next hover re-applies it.
      }
    },
    []
  )

  // Keep the active pin's ring in sync when the list selection changes.
  const prevActiveDotId = useRef<string | null>(null)
  useEffect(() => {
    if (!useGlDots || !mapLoaded) return
    if (prevActiveDotId.current && prevActiveDotId.current !== activeMarkerId) {
      setDotFeatureState(prevActiveDotId.current, 'active', false)
    }
    if (activeMarkerId) setDotFeatureState(activeMarkerId, 'active', true)
    prevActiveDotId.current = activeMarkerId ?? null
  }, [activeMarkerId, useGlDots, mapLoaded, setDotFeatureState])

  const handleDotHover = useCallback(
    (evt: mapboxgl.MapMouseEvent & { features?: mapboxgl.GeoJSONFeature[] }) => {
      if (!useGlDots) return
      const map = mapRef.current?.getMap()
      const feature = evt.features?.[0]
      const nextId = (feature?.properties?.id as string | undefined) ?? null

      if (nextId === hoveredFeatureId.current) return
      if (hoveredFeatureId.current) setDotFeatureState(hoveredFeatureId.current, 'hover', false)
      hoveredFeatureId.current = nextId
      if (nextId) setDotFeatureState(nextId, 'hover', true)

      if (map) map.getCanvas().style.cursor = nextId ? 'pointer' : ''
      // React state is updated only on enter/leave of a dot, not per mousemove.
      setHoveredMarkerId(nextId)
    },
    [useGlDots, setDotFeatureState]
  )

  const handleDotClick = useCallback(
    (evt: mapboxgl.MapMouseEvent & { features?: mapboxgl.GeoJSONFeature[] }) => {
      const feature = evt.features?.find((f) => f.layer?.id === GL_DOT_LAYER_ID)
      if (!feature || feature.geometry.type !== 'Point') return false
      const props = feature.properties as {
        id: string
        name: string
        startYear: number
        endYear: number
        midYear: number
        postwarFrom?: number
        postwarTo?: number
      }
      const [lng, lat] = feature.geometry.coordinates as [number, number]
      void openBusinessPopup(
        props.id,
        props.name,
        lng,
        lat,
        stateForYears(
          props.startYear,
          props.endYear,
          props.midYear,
          props.postwarFrom,
          props.postwarTo
        )
      )
      return true
    },
    [openBusinessPopup, stateForYears]
  )

  const handleClusterClick = useCallback(
    (cluster: { properties: { cluster_id: number } }, lng: number, lat: number) => {
      const expansionZoom = supercluster.getClusterExpansionZoom(cluster.properties.cluster_id)
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: expansionZoom,
        duration: 300,
      })
    },
    [supercluster]
  )

  // Pick the state that most members of a cluster are in, so the bubble carries the same
  // active/declining/closed colour the loose dots do. Returns null when the cluster has no
  // state tallies (e.g. a dataset loaded without state), so callers fall back to theme colour.
  const getDominantClusterState = (properties: {
    activeCount?: number
    decliningCount?: number
    closedCount?: number
    futureCount?: number
    standingCount?: number
  }): keyof typeof colors | null => {
    const tallies: [keyof typeof colors, number][] = [
      ['active', properties.activeCount ?? 0],
      ['declining', properties.decliningCount ?? 0],
      ['closed', properties.closedCount ?? 0],
      ['future', properties.futureCount ?? 0],
      ['standing', properties.standingCount ?? 0],
    ]
    let best: keyof typeof colors | null = null
    let bestCount = 0
    for (const [state, count] of tallies) {
      if (count > bestCount) {
        best = state
        bestCount = count
      }
    }
    return best
  }

  // Get cluster style based on theme
  const getClusterStyle = () => {
    switch (theme) {
      case 'moody':
        return {
          backgroundColor: '#f5cdb4',
          border: '3px solid #6b6275',
          color: '#2a2a2a',
        }
      case 'cool':
        return {
          backgroundColor: '#4a90e2',
          border: '3px solid white',
          color: 'white',
        }
      case 'warm':
        return {
          backgroundColor: '#d67b5a',
          border: '3px solid white',
          color: 'white',
        }
      case 'hot':
        return {
          backgroundColor: '#e4525e',
          border: '3px solid white',
          color: 'white',
        }
      case 'cold':
        return {
          backgroundColor: '#64b5f6',
          border: '3px solid white',
          color: 'white',
        }
      case 'bauhaus':
        return {
          backgroundColor: '#ffcc00',
          border: '3px solid #000000',
          color: '#000000',
        }
      case 'art-nouveau':
        return {
          backgroundColor: '#8b7355',
          border: '3px solid white',
          color: 'white',
        }
      case 'archival':
        return {
          backgroundColor: 'rgba(44, 74, 124, 0.85)',
          border: '3px solid rgba(255, 255, 255, 0.85)',
          color: 'white',
        }
      case 'hoefe':
        // Was missing, so hoefe silently fell through to the moody peach default.
        return {
          backgroundColor: '#7db5a4',
          border: '3px solid #f5f0e1',
          color: '#2a2a2a',
        }
      case 'brutal-pop':
        return {
          backgroundColor: '#ecc368',
          border: '3px solid #131318',
          color: '#131318',
        }
      default: // moody
        return {
          backgroundColor: '#f5cdb4',
          border: '3px solid #6b6275',
          color: '#2a2a2a',
        }
    }
  }

  const renderMarker = (
    feature: GeoJSON.Feature<
      GeoJSON.Point,
      {
        cluster?: boolean
        cluster_id?: number
        point_count?: number
        id?: string
        popup?: string
        state?: string
        // Per-cluster state tallies produced by the Supercluster map/reduce above
        activeCount?: number
        decliningCount?: number
        closedCount?: number
        futureCount?: number
        standingCount?: number
      }
    >
  ) => {
    if (!feature || !feature.geometry || !feature.geometry.coordinates) {
      return []
    }
    const [lng, lat] = feature.geometry.coordinates
    const properties = feature.properties || {}

    // Determine if we should show this label
    const shouldShowLabel = properties.id && labelPriorities.has(properties.id)

    if (properties.cluster) {
      // Log scale, tightly bounded. The old formula produced 30-60px bubbles sitting next to
      // 10px dots, so a single bubble visually outweighed the dozens of dots around it and the
      // mass-colour effect was lost. Most bubbles now hold 4-50 points.
      const size = Math.round(Math.min(28, 16 + Math.log2((properties.point_count ?? 2) + 1) * 2.2))
      const themeClusterStyle = getClusterStyle()
      // Colour the bubble by the state most of its members are in, so the time-based gradient
      // survives clustering instead of flattening to one theme colour.
      const dominantState = getDominantClusterState(properties)
      const clusterStyle = dominantState
        ? { ...themeClusterStyle, backgroundColor: colors[dominantState] }
        : themeClusterStyle
      const isHardEdgeTheme = theme === 'brutal-pop'

      // Special shapes for Bauhaus clusters
      if (theme === 'bauhaus') {
        return [
          <Marker
            key={`cluster-${properties.cluster_id}`}
            longitude={lng}
            latitude={lat}
            onClick={() =>
              handleClusterClick({ properties: { cluster_id: properties.cluster_id! } }, lng, lat)
            }
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
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(45deg) scale(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'rotate(45deg) scale(1)')}
            >
              <span style={{ transform: 'rotate(-45deg)' }}>{properties.point_count}</span>
            </div>
          </Marker>,
        ]
      }

      // Render cluster marker for other themes
      return [
        <Marker
          key={`cluster-${properties.cluster_id}`}
          longitude={lng}
          latitude={lat}
          onClick={() =>
            handleClusterClick({ properties: { cluster_id: properties.cluster_id! } }, lng, lat)
          }
        >
          <div
            className="mapbox-cluster-marker"
            style={{
              backgroundColor: clusterStyle.backgroundColor,
              color: clusterStyle.color,
              width: `${size}px`,
              height: `${size}px`,
              // brutal-pop is a hard-edged theme; CLAUDE.md forbids border-radius, and a round
              // soft-shadowed bubble under black-bordered brutalist chrome reads as a bug.
              borderRadius: isHardEdgeTheme ? '0' : '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              fontSize: '14px',
              border: clusterStyle.border,
              boxShadow: isHardEdgeTheme ? '2px 2px 0px #131318' : '0 2px 8px rgba(0,0,0,0.2)',
              cursor: 'pointer !important',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {properties.point_count}
          </div>
        </Marker>,
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
              background:
                theme === 'cool' || theme === 'cold'
                  ? 'rgba(255, 255, 255, 0.95)'
                  : theme === 'bauhaus'
                    ? '#ffffff'
                    : theme === 'archival'
                      ? properties.state === 'declining'
                        ? '#5a7397' // archival warning color
                        : properties.state === 'closed'
                          ? '#8b9cae' // archival danger color
                          : '#2c4a7c' // archival primary color (active)
                      : properties.state === 'declining'
                        ? `${colors.declining}e8`
                        : properties.state === 'closed'
                          ? `${colors.closed}e8`
                          : `${colors.active}e8`,
              color:
                theme === 'cool' || theme === 'cold'
                  ? color
                  : theme === 'bauhaus'
                    ? color
                    : theme === 'archival'
                      ? '#ffffff' // white text for good contrast on archival colors
                      : properties.state === 'closed'
                        ? '#ffffff'
                        : '#2a2a2a',
              border:
                theme === 'bauhaus'
                  ? `3px solid ${color}`
                  : theme === 'cool' || theme === 'cold'
                    ? `2px solid ${color}`
                    : theme === 'archival'
                      ? `1px solid ${color}`
                      : `1px solid ${color}`,
              boxShadow:
                theme === 'bauhaus'
                  ? '3px 3px 0px #000000'
                  : theme === 'cool' || theme === 'cold'
                    ? '0 2px 6px rgba(0,0,0,0.1)'
                    : '0 2px 6px rgba(0,0,0,0.2)',
              letterSpacing: theme === 'bauhaus' ? '0.1em' : 'normal',
              opacity: isHovered
                ? 1
                : popupInfo && popupInfo.properties.id !== properties.id
                  ? 0.8
                  : 0.9,
              transition: 'all 200ms ease-in-out',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              pointerEvents: 'auto',
            }}
            onClick={async (e) => {
              e.stopPropagation()
              if (onBusinessSelect && data) {
                // For Frankfurt data, find the business in the GeoJSON
                const business = data.features?.find(
                  (f: any) => f.properties.id?.toString() === properties.id
                )
                if (business) {
                  onBusinessSelect(business)
                }
              } else if (onMarkerClick) {
                onMarkerClick(properties.id!)
              }
              const enrichedStory = enrichedStories.find((s) => s.id === properties.id)

              // Load timeline data if available
              if (enrichedStory?.hasTimelineData && properties.id) {
                const timelineData = await loadTimelineData(properties.id)
                if (timelineData) {
                  setPopupTimelineData((prev) => ({ ...prev, [properties.id!]: timelineData }))
                }
              }

              setPopupInfo({
                longitude: lng,
                latitude: lat,
                properties: {
                  ...properties,
                  ...enrichedStory,
                },
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
        onClick={async () => {
          if (onBusinessSelect && data) {
            // For Frankfurt data, find the business in the GeoJSON
            const business = data.features?.find(
              (f: any) => f.properties.id?.toString() === properties.id
            )
            if (business) {
              onBusinessSelect(business)
            }
          } else if (onMarkerClick) {
            onMarkerClick(properties.id!)
          }
          const enrichedStory = enrichedStories.find((s) => s.id === properties.id)

          // Load timeline data if available
          if (enrichedStory?.hasTimelineData && properties.id) {
            const timelineData = await loadTimelineData(properties.id)
            if (timelineData) {
              setPopupTimelineData((prev) => ({ ...prev, [properties.id!]: timelineData }))
            }
          }

          setPopupInfo({
            longitude: lng,
            latitude: lat,
            properties: {
              ...properties,
              ...enrichedStory,
            },
          })
        }}
        anchor="center"
      >
        <div
          onMouseEnter={() => setHoveredMarkerId(properties.id!)}
          onMouseLeave={() => setHoveredMarkerId(null)}
          style={{
            backgroundColor: color,
            width:
              theme === 'bauhaus' && isActive
                ? '20px'
                : theme === 'bauhaus'
                  ? `${bauhausDotSize}px`
                  : `${dotSize}px`,
            height:
              theme === 'bauhaus' && isActive
                ? '20px'
                : theme === 'bauhaus'
                  ? `${bauhausDotSize}px`
                  : `${dotSize}px`,
            clipPath:
              theme === 'bauhaus'
                ? properties.state === 'closed'
                  ? 'polygon(50% 0%, 0% 100%, 100% 100%)' // Triangle
                  : properties.state === 'declining'
                    ? 'none' // Square
                    : 'circle(50%)' // Circle
                : undefined,
            borderRadius: theme === 'bauhaus' || theme === 'brutal-pop' ? '0' : '50%',
            border:
              theme === 'bauhaus'
                ? '2px solid #000000'
                : theme === 'brutal-pop'
                  ? '1px solid #131318'
                  : '2px solid white',
            boxShadow:
              theme === 'bauhaus'
                ? '2px 2px 0px #000000'
                : theme === 'brutal-pop'
                  ? // Flat, no blur: on a dark map a soft drop shadow just muddies the dot edge,
                    // and thousands of blurred shadows are a real compositor cost.
                    '1px 1px 0px #131318'
                  : '0 2px 4px rgba(0,0,0,0.3)',
            cursor: 'pointer !important',
            transition: 'transform 0.2s',
            transform: isActive ? 'scale(1.5)' : 'scale(1)',
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
            Mapbox token is missing. Please configure NEXT_PUBLIC_MAPBOX_TOKEN in the deployment
            environment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={mapContainerRef}
      className="relative h-full w-full overflow-hidden border-l border-[#6b6275]"
    >
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        interactiveLayerIds={useGlDots ? [GL_DOT_LAYER_ID] : undefined}
        onMouseMove={useGlDots ? handleDotHover : undefined}
        onMouseOut={
          useGlDots
            ? () => {
                if (hoveredFeatureId.current) {
                  setDotFeatureState(hoveredFeatureId.current, 'hover', false)
                  hoveredFeatureId.current = null
                  setHoveredMarkerId(null)
                }
              }
            : undefined
        }
        onClick={(evt) => {
          // A dot hit takes precedence; only a click on bare map closes the popup.
          if (useGlDots && handleDotClick(evt)) return
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

                style.layers.forEach((layer) => {
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
        {/* GPU dot layer - the main storymap's 10k points. One source, recoloured by
            expression as the slider moves. See GL_DOT_LAYER above. */}
        {useGlDots && (
          <Source id={GL_DOT_SOURCE_ID} type="geojson" data={dotsGeoJSON} promoteId="id">
            <Layer {...dotLayer} />
          </Source>
        )}

        {/* Labels for the dot layer. Capped per zoom, so this stays tens of nodes, not thousands. */}
        {useGlDots &&
          glLabels.map((feature) => {
            const props = feature.properties as {
              id: string
              name: string
              startYear: number
              endYear: number
              midYear: number
              postwarFrom?: number
              postwarTo?: number
            }
            const [lng, lat] = feature.geometry.coordinates
            const state = stateForYears(
              props.startYear,
              props.endYear,
              props.midYear,
              props.postwarFrom,
              props.postwarTo
            )
            const isHovered = hoveredMarkerId === props.id
            const chip =
              state === 'standing'
                ? colors.standing
                : state === 'declining'
                  ? colors.declining
                  : state === 'closed'
                    ? colors.closed
                    : state === 'future'
                      ? colors.future || colors.active
                      : colors.active
            return (
              <Marker
                key={`gl-label-${props.id}`}
                longitude={lng}
                latitude={lat}
                anchor="bottom"
                offset={[0, -10]}
              >
                <div
                  className="px-2 py-1 text-xs font-mono font-bold whitespace-nowrap cursor-pointer"
                  style={{
                    background: withAlpha(chip, 0.91),
                    color: readableTextOn(chip),
                    border: `1px solid ${chip}`,
                    boxShadow: isHardEdgeTheme
                      ? '2px 2px 0px #131318'
                      : '0 2px 6px rgba(0,0,0,0.2)',
                    opacity: isHovered ? 1 : 0.9,
                    pointerEvents: 'auto',
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    void openBusinessPopup(props.id, props.name, lng, lat, state)
                  }}
                >
                  {props.name}
                </div>
              </Marker>
            )
          })}

        {/* Render all markers and clusters (DOM path: Frankfurt + /jewish-businesses) */}
        {mapLoaded &&
          clusters &&
          clusters.length > 0 &&
          clusters.flatMap((cluster) => {
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
                background:
                  theme === 'archival'
                    ? popupInfo.properties.state === 'declining'
                      ? 'var(--popup-declining-bg)'
                      : popupInfo.properties.state === 'closed'
                        ? 'var(--popup-closed-bg)'
                        : 'var(--popup-active-bg)'
                    : popupInfo.properties.state === 'declining'
                      ? `${colors.declining}fa`
                      : popupInfo.properties.state === 'closed'
                        ? `${colors.closed}fa`
                        : `${colors.active}fa`,
                color:
                  popupInfo.properties.state === 'closed'
                    ? 'var(--closed-text)'
                    : popupInfo.properties.state === 'declining'
                      ? 'var(--declining-text)'
                      : theme === 'bauhaus'
                        ? 'var(--active-text)'
                        : theme === 'moody' || !theme
                          ? 'var(--active-text)'
                          : theme === 'archival'
                            ? 'var(--active-text)'
                            : '#2a2a2a',
                fontFamily: 'Space Mono, monospace',
                border:
                  theme === 'archival'
                    ? `2px solid #5a7397`
                    : `2px solid ${
                        popupInfo.properties.state === 'declining'
                          ? colors.declining
                          : popupInfo.properties.state === 'closed'
                            ? colors.closed
                            : colors.active
                      }`,
              }}
            >
              <h3
                className="font-bold text-base mb-2"
                style={{
                  color: 'inherit',
                  fontFamily: 'Space Mono, monospace',
                }}
              >
                {popupInfo.properties.popup}
              </h3>
              {popupInfo.properties && (
                <>
                  <div
                    className="text-xs mb-2"
                    style={{
                      opacity: 0.8,
                      color: 'inherit',
                    }}
                  >
                    {popupInfo.properties.startDate &&
                      popupInfo.properties.endDate &&
                      `${new Date(popupInfo.properties.startDate).getFullYear()} - 
                       ${new Date(popupInfo.properties.endDate).getFullYear()}`}
                  </div>
                  {/* Sector recorded by HU Berlin. `color: inherit` is load-
                      bearing: the popup background is state-dependent, so any
                      fixed colour fails contrast on one of the states. */}
                  {Boolean(popupInfo.properties.sectorKey || popupInfo.properties.businessType) && (
                    <div
                      className="text-xs uppercase tracking-wide mb-2 px-2 py-1 inline-block"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'inherit',
                      }}
                    >
                      {sectorLabel(
                        t,
                        popupInfo.properties.sectorKey as string | undefined,
                        popupInfo.properties.businessType as string | undefined
                      )}
                    </div>
                  )}
                  {(() => {
                    // Get timeline-aware description if available
                    const timelineData =
                      popupInfo.properties.id && popupTimelineData[popupInfo.properties.id]
                    const timelineContent =
                      timelineData && selectedDate
                        ? getTimelineContentForDate(timelineData, selectedDate)
                        : null
                    const description =
                      timelineContent?.description || popupInfo.properties.description

                    return description ? (
                      <p
                        className="text-xs line-clamp-3"
                        style={{
                          color: 'inherit',
                          opacity: 0.9,
                        }}
                      >
                        {description}
                      </p>
                    ) : null
                  })()}
                  {/* Timeline Data Availability Indicator */}
                  {Boolean(popupInfo.properties.hasTimelineData) && (
                    <div
                      className="flex items-center gap-1 text-xs mb-2 px-2 py-1"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'inherit',
                      }}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span style={{ opacity: 0.9 }}>Timeline data available</span>
                    </div>
                  )}
                  <div
                    className="text-xs mt-3 font-bold cursor-pointer uppercase tracking-wide flex items-center justify-between"
                    style={{
                      color: 'inherit',
                      textDecoration: 'underline',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      padding: 0,
                    }}
                    onClick={() => {
                      // Find the story in the list and trigger view details
                      const storyElement = document.querySelector(
                        `[data-story-id="${popupInfo.properties.id}"]`
                      )
                      if (storyElement) {
                        const viewDetailsButton = storyElement.querySelector(
                          '.view-details-button'
                        ) as HTMLElement
                        if (viewDetailsButton) {
                          viewDetailsButton.click()
                        }
                      }
                      setPopupInfo(null)
                    }}
                  >
                    <span>{t('mainPage.map.viewMore') || 'View more →'}</span>
                    {Boolean(popupInfo.properties.hasTimelineData) && (
                      <svg
                        className="w-3 h-3 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ opacity: 0.7 }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    )}
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

      {/* Legend. Only rendered when the parent owns the filter state — without
          onSelectCategory its category rows would be inert. */}
      {selectedCategory !== undefined && onSelectCategory && (
        <div className="absolute bottom-4 left-4 z-[1000]">
          <MapLegend
            stories={enrichedStories}
            theme={theme}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
            currentYear={currentYear}
          />
        </div>
      )}

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
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
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
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
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
    : [0, 0]
  const getNextCenter = nextProps.center
    ? Array.isArray(nextProps.center)
      ? nextProps.center
      : [nextProps.center.lng, nextProps.center.lat]
    : [0, 0]

  if (
    getPrevCenter[0] !== getNextCenter[0] ||
    getPrevCenter[1] !== getNextCenter[1] ||
    prevProps.zoom !== nextProps.zoom ||
    prevProps.activeMarkerId !== nextProps.activeMarkerId ||
    // Must be listed explicitly: this comparator falls through to "equal" for
    // any prop it does not name, so an omitted selectedCategory would leave
    // the legend frozen on its first render with no error anywhere.
    prevProps.selectedCategory !== nextProps.selectedCategory
  ) {
    return false
  }

  // Date comparison
  const prevTime = prevProps.currentDate?.getTime() || 0
  const nextTime = nextProps.currentDate?.getTime() || 0
  if (prevTime !== nextTime) {
    return false
  }

  // Array length checks before deep comparison.
  // timeMarkers must be listed: it feeds the GL dot source, and this comparator treats any
  // prop it does not name as unchanged - omitting it would freeze the dot layer at whatever
  // the first progressive-load batch contained, with no error anywhere.
  if (
    prevProps.markers?.length !== nextProps.markers?.length ||
    prevProps.timeMarkers?.length !== nextProps.timeMarkers?.length ||
    prevProps.enrichedStories?.length !== nextProps.enrichedStories?.length
  ) {
    return false
  }

  // For large arrays (100+), compare a sample of marker IDs and states
  // This catches most content changes without O(n) comparison
  if (prevProps.markers && nextProps.markers) {
    const len = prevProps.markers.length
    if (len > 100) {
      // Sample comparison for large arrays: first, last, and a few middle elements
      const sampleIndices = [
        0,
        Math.floor(len / 4),
        Math.floor(len / 2),
        Math.floor((3 * len) / 4),
        len - 1,
      ]
      for (const i of sampleIndices) {
        if (
          prevProps.markers[i]?.id !== nextProps.markers[i]?.id ||
          prevProps.markers[i]?.state !== nextProps.markers[i]?.state
        ) {
          return false
        }
      }
    } else {
      // Full comparison for small arrays
      for (let i = 0; i < len; i++) {
        if (
          prevProps.markers[i]?.id !== nextProps.markers[i]?.id ||
          prevProps.markers[i]?.state !== nextProps.markers[i]?.state
        ) {
          return false
        }
      }
    }
  }

  return true
})
