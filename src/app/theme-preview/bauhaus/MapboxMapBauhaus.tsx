'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox'
import Supercluster from 'supercluster'

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FtZnJvbnMiLCJhIjoiY21lOTU4cnlxMG5wbjJtcTVtcGc4aWhhaiJ9.V-JWJlxk2hksMuxe0wsolQ'

// Bauhaus-inspired map style with geometric patterns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bauhausMapStyle: any = {
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

interface MapboxMapProps {
  center: [number, number]
  zoom: number
  markers?: Array<{
    id: string
    position: [number, number]
    popup: string
    state?: string
  }>
  onMarkerClick: (id: string) => void
  activeMarkerId: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrichedStories?: any[]
}

const MapboxMapBauhaus: React.FC<MapboxMapProps> = ({ 
  center, 
  zoom, 
  markers = [], 
  onMarkerClick,
  activeMarkerId,
  enrichedStories = []
}) => {
  const mapRef = useRef<React.ComponentRef<typeof Map> | null>(null)
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
      id: string
      popup: string
      state?: string
      [key: string]: unknown
    }
  } | null>(null)
  const [labelOpacity, setLabelOpacity] = useState(1)

  // Bauhaus primary colors
  const colors = {
    active: '#0066ff',      // Blue
    declining: '#ffcc00',   // Yellow
    closed: '#ff0000',      // Red
    future: '#666666'       // Gray
  }

  // Create supercluster instance
  const supercluster = useMemo(() => {
    const index = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minPoints: 2
    })
    
    if (markers.length > 0) {
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
      index.load(points as Supercluster.PointFeature<Supercluster.AnyProps>[])
    }

    return index
  }, [markers])

  // Pre-compute initial markers
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

  // Get clusters for current viewport
  const clusters = useMemo(() => {
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
      return clusteredMarkers.length > 0 ? clusteredMarkers : initialMarkers
    } catch (error) {
      console.warn('Error getting clusters:', error)
      return initialMarkers
    }
  }, [supercluster, viewState.zoom, mapLoaded, initialMarkers])

  // Focus on active marker
  useEffect(() => {
    if (!activeMarkerId || !mapRef.current) return

    const activeMarker = markers.find(m => m.id === activeMarkerId)
    if (activeMarker) {
      mapRef.current.flyTo({
        center: [activeMarker.position[1], activeMarker.position[0]],
        zoom: 14,
        duration: 800
      })
      
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

  // Set label opacity based on popup state
  useEffect(() => {
    setLabelOpacity(popupInfo ? 0.6 : 1)
  }, [popupInfo])

  const handleClusterClick = useCallback((cluster: { properties: { cluster_id: number } }, lng: number, lat: number) => {
    const expansionZoom = supercluster.getClusterExpansionZoom(cluster.properties.cluster_id)
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: expansionZoom,
      duration: 300
    })
  }, [supercluster])

  const renderMarker = (cluster: {
    id?: string | number
    geometry: { coordinates: [number, number] }
    properties: {
      cluster?: boolean
      cluster_id?: number
      point_count?: number
      id?: string
      popup?: string
      state?: string
    }
  }) => {
    const [lng, lat] = cluster.geometry.coordinates
    const { cluster: isCluster, point_count } = cluster.properties

    // Render cluster as geometric shape
    if (isCluster && point_count) {
      const size = 40 + (point_count / markers.length) * 40
      return (
        <Marker key={`cluster-${cluster.id}`} longitude={lng} latitude={lat}>
          <div
            onClick={() => handleClusterClick({ properties: { cluster_id: cluster.properties.cluster_id || 0 } }, lng, lat)}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: '#ffcc00',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              border: '3px solid #000000',
              boxShadow: '4px 4px 0px #000000',
              transform: 'rotate(45deg)'
            }}
          >
            <span style={{ transform: 'rotate(-45deg)' }}>{point_count}</span>
          </div>
        </Marker>
      )
    }

    // Render individual marker as geometric shapes
    const properties = cluster.properties
    const isActive = properties.id === activeMarkerId
    const color = colors[properties.state as keyof typeof colors] || colors.active
    
    // Different shapes for different states
    const getMarkerShape = () => {
      switch(properties.state) {
        case 'closed':
          return 'polygon(50% 0%, 0% 100%, 100% 100%)' // Triangle
        case 'declining':
          return 'none' // Square (default)
        default:
          return 'circle(50%)' // Circle
      }
    }
    
    return [
      // Label with stark geometric style as a Marker
      <Marker
        key={`label-${properties.id}`}
        longitude={lng}
        latitude={lat}
        anchor="bottom"
        offset={[0, -10]}
      >
        <div 
          className={`px-3 py-1 text-xs font-mono font-black uppercase whitespace-nowrap cursor-pointer transition-opacity duration-200`}
          style={{
            background: '#ffffff',
            color: color,
            border: `3px solid ${color}`,
            boxShadow: '3px 3px 0px #000000',
            letterSpacing: '0.1em',
            opacity: labelOpacity,
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (properties.id && properties.popup) {
              onMarkerClick(properties.id)
              const enrichedStory = enrichedStories.find(s => s.id === properties.id) || {}
              setPopupInfo({
                longitude: lng,
                latitude: lat,
                properties: {
                  ...properties,
                  ...enrichedStory
                }
              })
            }
          }}
        >
          {properties.popup}
        </div>
      </Marker>,
      
      // Marker as geometric shape
      <Marker
        key={`marker-${properties.id}`}
        longitude={lng}
        latitude={lat}
        onClick={() => {
          if (properties.id && properties.popup) {
            onMarkerClick(properties.id)
            const enrichedStory = enrichedStories.find(s => s.id === properties.id) || {}
            setPopupInfo({
              longitude: lng,
              latitude: lat,
              properties: {
                ...properties,
                ...enrichedStory
              }
            })
          }
        }}
        anchor="center"
      >
        <div
          style={{
            backgroundColor: color,
            width: isActive ? '20px' : '14px',
            height: isActive ? '20px' : '14px',
            clipPath: getMarkerShape(),
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        />
      </Marker>
    ]
  }

  return (
    <div className="relative h-full w-full overflow-hidden border-l-4 border-black">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={(evt) => {
          if (!evt.features || evt.features.length === 0) {
            if (popupInfo) {
              setPopupInfo(null)
            }
          }
        }}
        onLoad={() => setMapLoaded(true)}
        mapStyle={bauhausMapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        maxZoom={20}
        minZoom={3}
      >
        {/* Render all markers and clusters */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {clusters.flatMap(cluster => renderMarker(cluster as any))}
        
        {/* Detailed popup with Bauhaus styling */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            anchor="top"
            offset={20}
            className="mapbox-detail-popup"
          >
            <div 
              style={{
                minWidth: '250px',
                maxWidth: '350px',
                padding: '20px',
                background: '#ffffff',
                color: '#000000',
                fontFamily: 'Space Mono, monospace',
                border: `4px solid ${colors[popupInfo.properties.state as keyof typeof colors] || colors.active}`,
                boxShadow: '6px 6px 0px #000000'
              }}
            >
              <h3 className="font-black text-lg mb-3 uppercase tracking-wider" style={{ 
                color: colors[popupInfo.properties.state as keyof typeof colors] || colors.active
              }}>
                {popupInfo.properties.popup}
              </h3>
              {popupInfo.properties && (
                <>
                  <div className="text-xs mb-2 font-bold" style={{ color: '#666666' }}>
                    {popupInfo.properties.startDate && 
                     popupInfo.properties.endDate && 
                      `${new Date(popupInfo.properties.startDate).getFullYear()} - 
                       ${new Date(popupInfo.properties.endDate).getFullYear()}`
                    }
                  </div>
                  {popupInfo.properties.description && (
                    <p className="text-xs line-clamp-3 mb-4" style={{ color: '#000000' }}>
                      {popupInfo.properties.description}
                    </p>
                  )}
                  <button
                    className="text-xs font-black uppercase px-4 py-2"
                    style={{
                      color: '#ffffff',
                      background: '#000000',
                      border: 'none',
                      cursor: 'pointer',
                      letterSpacing: '0.1em'
                    }}
                    onClick={() => {
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
                    VIEW MORE →
                  </button>
                </>
              )}
            </div>
          </Popup>
        )}
        
        <NavigationControl 
          position="top-right" 
          showCompass={false}
          visualizePitch={false}
          style={{ display: 'none' }}
        />
      </Map>
      
      {/* Geometric decoration overlays */}
      <div className="absolute top-8 right-8 w-16 h-16 bg-[#ff0000] opacity-20 transform rotate-12 pointer-events-none"></div>
      <div className="absolute bottom-8 left-8 w-20 h-20 bg-[#0066ff] opacity-20 rounded-full pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[50px] border-b-[#ffcc00] opacity-20 pointer-events-none"></div>
    </div>
  )
}

export default MapboxMapBauhaus