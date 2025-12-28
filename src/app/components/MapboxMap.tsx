'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import { useTheme } from 'next-themes'
import mapboxgl from 'mapbox-gl'
import { useMobileOptimizations } from '../../hooks/useMobileOptimizations'
import { useTranslation } from '../../i18n/useTranslation'
import { loadTimelineData } from '../../utils/timelineLoader'
import {
  useMapClustering,
  useLabelPriorities,
  type ClusterFeature,
} from '../../hooks/useMapClustering'
import {
  getThemeMapStyle,
  getThemeColors,
  getClusterStyle,
  getMapColors,
  type ThemeColors,
} from './map/mapStyles'
import MapPopup from './map/MapPopup'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

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
  enrichedStories?: Array<{
    id: string
    startDate?: string | null
    endDate?: string | null
    description?: string | null
    hasTimelineData?: boolean
  }>
  isTestMode?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  selectedDate?: Date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  data,
  selectedDate,
  onBusinessSelect,
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
    zoom: zoom,
  })
  const [mapLoaded, setMapLoaded] = useState(false)
  const [, setWebglReady] = useState(false) // Track WebGL readiness for context loss handling
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [popupTimelineData, setPopupTimelineData] = useState<{ [key: string]: any }>({})

  // Get mobile optimizations
  const { isMobile } = useMobileOptimizations()

  // Get theme colors
  const [colors, setColors] = useState<ThemeColors>(getThemeColors(theme))

  // Update colors when theme changes
  useEffect(() => {
    setColors(getThemeColors(theme))
  }, [theme])

  // Use clustering hook
  const { clusters, supercluster } = useMapClustering({
    markers,
    data,
    isTestMode,
    isMobile,
    mapLoaded,
    mapRef: mapRef as React.RefObject<{ getBounds: () => mapboxgl.LngLatBounds | null } | null>,
    viewStateZoom: viewState.zoom,
  })

  // Use label priorities hook
  const labelPriorities = useLabelPriorities(
    mapLoaded,
    clusters,
    activeMarkerId,
    hoveredMarkerId,
    Math.floor(viewState.zoom)
  )

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
      // Moody, Hot, Bauhaus, and Archival use complete custom styles, no additional styling needed
      if (theme === 'moody' || theme === 'hot' || theme === 'bauhaus' || theme === 'archival') {
        return
      }

      // For themes we haven't implemented complete custom styles yet
      if (theme !== 'cold' && theme !== 'cool' && theme !== 'warm' && theme !== 'art-nouveau') {
        return
      }

      try {
        if (!map.isStyleLoaded()) return

        const style = map.getStyle()
        if (!style || !style.layers) return

        const layers = style.layers
        const mapColors = getMapColors(theme)
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
                map.setPaintProperty(layer.id, 'line-color', mapColors.road)
                map.setPaintProperty(layer.id, 'line-opacity', 0.7)
              } else {
                if (layer.id.includes('motorway') || layer.id.includes('trunk')) {
                  map.setPaintProperty(layer.id, 'line-color', '#666666')
                } else if (layer.id.includes('primary') || layer.id.includes('secondary')) {
                  map.setPaintProperty(layer.id, 'line-color', '#888888')
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

            // Text labels
            if (layer.type === 'symbol') {
              let textColor = '#f5cdb4'
              let haloColor = '#3b3340'

              if (typeof window !== 'undefined') {
                const computedStyle = getComputedStyle(document.documentElement)
                textColor = computedStyle.getPropertyValue('--foreground').trim() || '#f5cdb4'
                haloColor = computedStyle.getPropertyValue('--accent-navy').trim() || '#3b3340'
              }

              try {
                map.setPaintProperty(layer.id, 'text-color', textColor)
                map.setPaintProperty(layer.id, 'text-halo-color', haloColor)
                map.setPaintProperty(layer.id, 'text-halo-width', 1)
                layerModified = true
              } catch {
                // Some properties might not exist for all symbol layers
              }
            }

            if (layerModified) {
              styleChangesApplied = true
            }
          } catch {
            // Silently ignore layer errors
          }
        })

        // Optimized WebGL render cycle after style changes
        if (styleChangesApplied || forceRender) {
          requestAnimationFrame(() => {
            if (map.isStyleLoaded()) {
              map.triggerRepaint()
            }
          })
        }
      } catch (e) {
        console.warn('Error updating map theme:', e)
      }
    },
    [theme]
  )

  // Re-apply theme colors when theme changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const map = mapRef.current.getMap()
    if (!map) return

    const handleStyleLoad = () => {
      try {
        if (!map.isStyleLoaded()) {
          setTimeout(handleStyleLoad, 50)
          return
        }
        applyThemeStyles(map, true)
      } catch (err) {
        console.warn('Error during theme style change:', err)
      }
    }

    map.off('style.load', handleStyleLoad)
    map.on('style.load', handleStyleLoad)
    handleStyleLoad()

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
      setWebglReady(true)
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

      let color = colors.active || '#97d8c0'
      if (state === 'declining') color = colors.declining || 'rgba(255, 203, 81, 0.98)'
      if (state === 'closed') color = colors.closed || 'rgba(238, 87, 96, 0.98)'

      popupTips.forEach((tip) => {
        const tipElement = tip as HTMLElement
        tipElement.style.borderTopColor = color
        tipElement.style.borderBottomColor = color
        tipElement.style.borderLeftColor = color
        tipElement.style.borderRightColor = color
      })
    }, 50)

    return () => clearTimeout(timer)
  }, [popupInfo, colors.active, colors.declining, colors.closed])

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

  const renderMarker = (feature: ClusterFeature) => {
    if (!feature || !feature.geometry || !feature.geometry.coordinates) {
      return []
    }
    const [lng, lat] = feature.geometry.coordinates
    const properties = feature.properties || {}

    // Determine if we should show this label
    const shouldShowLabel = properties.id && labelPriorities.has(properties.id)

    if (properties.cluster) {
      const size = 30 + ((properties.point_count || 0) / markers.length) * 30
      const clusterStyle = getClusterStyle(theme)

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
    const color = colors[properties.state as keyof ThemeColors] || colors.active

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
            className={`px-2 py-1 text-xs font-mono ${
              theme === 'bauhaus'
                ? 'font-black uppercase'
                : theme === 'cool' || theme === 'cold'
                  ? 'font-semibold'
                  : 'font-bold'
            } whitespace-nowrap cursor-pointer`}
            style={{
              background:
                theme === 'cool' || theme === 'cold'
                  ? 'rgba(255, 255, 255, 0.95)'
                  : theme === 'bauhaus'
                    ? '#ffffff'
                    : theme === 'archival'
                      ? properties.state === 'declining'
                        ? '#5a7397'
                        : properties.state === 'closed'
                          ? '#8b9cae'
                          : '#2c4a7c'
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
                      ? '#ffffff'
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (onBusinessSelect && data) {
                const business = data.features?.find(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (f: any) => f.properties.id?.toString() === properties.id
                )
                if (business) {
                  onBusinessSelect(business)
                }
              } else if (onMarkerClick) {
                onMarkerClick(properties.id!)
              }
              const enrichedStory = enrichedStories.find((s) => s.id === properties.id)

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

    // Render marker dot
    const dotSize = isHovered || isActive ? 12 : 10
    const bauhausDotSize = isHovered || isActive ? 18 : 14

    markerElements.push(
      <Marker
        key={`marker-${properties.id}`}
        longitude={lng}
        latitude={lat}
        onClick={async () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (onBusinessSelect && data) {
            const business = data.features?.find(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (f: any) => f.properties.id?.toString() === properties.id
            )
            if (business) {
              onBusinessSelect(business)
            }
          } else if (onMarkerClick) {
            onMarkerClick(properties.id!)
          }
          const enrichedStory = enrichedStories.find((s) => s.id === properties.id)

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
            borderRadius: theme === 'bauhaus' ? '0' : '50%',
            border: theme === 'bauhaus' ? '2px solid #000000' : '2px solid white',
            boxShadow: theme === 'bauhaus' ? '2px 2px 0px #000000' : '0 2px 4px rgba(0,0,0,0.3)',
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
    <div className="relative h-full w-full overflow-hidden border-l border-[#6b6275]">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={(evt) => {
          if (!evt.features || evt.features.length === 0) {
            if (popupInfo) {
              setPopupInfo(null)
            }
          }
        }}
        onLoad={() => {
          const map = mapRef.current?.getMap()
          if (!map) return

          setMapLoaded(true)

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

          const applyInitialStyles = () => {
            try {
              if (!map.isStyleLoaded()) {
                map.once('styledata', applyInitialStyles)
                return
              }

              if (!checkWebGLReady()) {
                setTimeout(applyInitialStyles, 16)
                return
              }

              applyThemeStyles(map, true)

              requestAnimationFrame(() => {
                if (map.isStyleLoaded()) {
                  map.triggerRepaint()
                }
              })
            } catch (err) {
              console.warn('Could not apply initial map styles:', err)
            }
          }

          applyInitialStyles()

          const canvas = map.getCanvas()
          canvas.addEventListener('webglcontextlost', () => {
            console.warn('WebGL context lost')
            setWebglReady(false)
          })

          canvas.addEventListener('webglcontextrestored', () => {
            setWebglReady(true)
            setTimeout(() => applyThemeStyles(map, true), 100)
          })

          map.on('styledata', () => {
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
                    } catch {
                      // Ignore
                    }
                  }
                })
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
        {mapLoaded &&
          clusters &&
          clusters.length > 0 &&
          clusters.flatMap((cluster) => {
            const result = renderMarker(cluster)
            return Array.isArray(result) ? result : []
          })}

        {/* Detailed popup on click */}
        {popupInfo && (
          <MapPopup
            popupInfo={popupInfo}
            onClose={() => setPopupInfo(null)}
            theme={theme}
            colors={colors}
            popupTimelineData={popupTimelineData}
            selectedDate={selectedDate}
            t={t}
          />
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
    prevProps.activeMarkerId !== nextProps.activeMarkerId
  ) {
    return false
  }

  // Date comparison
  const prevTime = prevProps.currentDate?.getTime() || 0
  const nextTime = nextProps.currentDate?.getTime() || 0
  if (prevTime !== nextTime) {
    return false
  }

  // Array length checks before deep comparison
  if (
    prevProps.markers?.length !== nextProps.markers?.length ||
    prevProps.enrichedStories?.length !== nextProps.enrichedStories?.length
  ) {
    return false
  }

  // Only do expensive comparison if lengths are the same and small
  if (prevProps.markers && nextProps.markers && prevProps.markers.length < 100) {
    for (let i = 0; i < prevProps.markers.length; i++) {
      if (
        prevProps.markers[i]?.id !== nextProps.markers[i]?.id ||
        prevProps.markers[i]?.state !== nextProps.markers[i]?.state
      ) {
        return false
      }
    }
  }

  return true
})
