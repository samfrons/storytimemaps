'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox'
import Supercluster from 'supercluster'

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FtZnJvbnMiLCJhIjoiY21lOTU4cnlxMG5wbjJtcTVtcGc4aWhhaiJ9.V-JWJlxk2hksMuxe0wsolQ'

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

const MapboxMapCool: React.FC<MapboxMapProps> = ({ 
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
      id?: string
      popup?: string
      state?: string
      description?: string | null
      startDate?: string | null
      endDate?: string | null
      [key: string]: unknown
    }
  } | null>(null)
  const [labelOpacity, setLabelOpacity] = useState(1)

  // Cool theme colors - blues and teals
  const colors = {
    active: '#4a90e2',      // Bright blue
    declining: '#f5a623',   // Orange warning
    closed: '#d0021b',      // Red danger
    future: '#95a5a6'       // Gray future
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

    // Render cluster
    if (isCluster && point_count) {
      const size = 30 + (point_count / markers.length) * 30
      return (
        <Marker key={`cluster-${cluster.id}`} longitude={lng} latitude={lat}>
          <div
            onClick={() => handleClusterClick({ properties: { cluster_id: cluster.properties.cluster_id || 0 } }, lng, lat)}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              backgroundColor: '#4a90e2',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              border: '3px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            {point_count}
          </div>
        </Marker>
      )
    }

    // Render individual marker
    const properties = cluster.properties
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
          className={`px-2 py-1 text-xs font-mono font-semibold whitespace-nowrap cursor-pointer transition-opacity duration-200`}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            color: color,
            border: `2px solid ${color}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
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
      
      // Marker dot
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
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            transform: isActive ? 'scale(1.5)' : 'scale(1)'
          }}
        />
      </Marker>
    ]
  }

  return (
    <div className="relative h-full w-full overflow-hidden border-l border-[#bdc3c7]">
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
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        maxZoom={20}
        minZoom={3}
      >
        {/* Render all markers and clusters */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {clusters.flatMap(cluster => renderMarker(cluster as any))}
        
        {/* Detailed popup on click */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            anchor="top"
            offset={15}
            className="mapbox-detail-popup"
          >
            <div 
              style={{
                minWidth: '200px',
                maxWidth: '300px',
                padding: '16px',
                background: 'white',
                color: '#2c3e50',
                fontFamily: 'Inter, sans-serif',
                border: `3px solid ${colors[popupInfo.properties.state as keyof typeof colors] || colors.active}`
              }}
            >
              <h3 className="font-bold text-base mb-2" style={{ 
                color: colors[popupInfo.properties.state as keyof typeof colors] || colors.active,
                fontFamily: 'Space Mono, monospace'
              }}>
                {popupInfo.properties.popup}
              </h3>
              {popupInfo.properties && (
                <>
                  <div className="text-xs mb-2" style={{ color: '#7f8c8d' }}>
                    {(() => {
                      const startDate = popupInfo.properties.startDate as string;
                      const endDate = popupInfo.properties.endDate as string;
                      if (startDate && endDate) {
                        const startYear = new Date(startDate).getFullYear();
                        const endYear = new Date(endDate).getFullYear();
                        return `${startYear} - ${endYear}`;
                      }
                      return null;
                    })()}
                  </div>
                  {(() => {
                    const description = popupInfo.properties.description as string;
                    if (description) {
                      return (
                        <p className="text-xs line-clamp-3 mb-3" style={{ color: '#2c3e50' }}>
                          {description}
                        </p>
                      );
                    }
                    return null;
                  })()}
                  <div 
                    className="text-xs font-bold cursor-pointer"
                    style={{
                      color: '#4a90e2',
                      textDecoration: 'underline'
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
                    View more →
                  </div>
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
    </div>
  )
}

export default MapboxMapCool