'use client'

import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useMapFocus } from '../../hooks/useMapFocus'
import { useMarkerStates } from '../../hooks/useMarkerStates'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl;

const createCustomIcon = (state: string, isActive: boolean, hasImage?: boolean) => {
  const colors = {
    active: '#4a5f7a',
    declining: '#c4a574',
    closed: '#9b6b6b',
    future: '#8a8d91'
  };
  
  const color = colors[state] || colors.active;
  const size = isActive ? 36 : 28;
  
  if (hasImage) {
    return L.divIcon({
      className: 'custom-marker-portrait',
      html: `
        <div class="marker-portrait" style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 2px solid ${color};
          background: white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
          overflow: hidden;
          position: relative;
        ">
          <div style="
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, ${color}33 0%, ${color}66 100%);
          "></div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  }
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-pin ${isActive ? 'marker-active-state' : ''}" style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background-color: white;
          width: ${size * 0.3}px;
          height: ${size * 0.3}px;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};


interface MapProps {
  center: [number, number];
  zoom: number;
  markers?: Array<{
    id: string;
    position: [number, number];
    popup: string;
    state?: string;
  }>;
  onMarkerClick: (id: string) => void;
  activeMarkerId?: string | null;
  currentDate?: Date;
}


function ZoomControls() {
  const map = useMap();
  
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="bg-white dark:bg-slate-800 p-2.5 shadow-sm hover:shadow-md transition-all duration-200 border border-border"
        aria-label="Zoom in"
      >
        <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="bg-white dark:bg-slate-800 p-2.5 shadow-sm hover:shadow-md transition-all duration-200 border border-border"
        aria-label="Zoom out"
      >
        <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
    </div>
  );
}

function MapContent({ markers, onMarkerClick, activeMarkerId, currentDate }: Omit<MapProps, 'center' | 'zoom'>) {
  useMapFocus(activeMarkerId, markers || []);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

  const markerElements = useMemo(() => {
    return markers?.map((marker) => {
      const isActive = marker.id === activeMarkerId;
      const isHovered = marker.id === hoveredMarkerId;
      const icon = createCustomIcon(marker.state || 'active', isActive || isHovered, false);
      
      const getTooltipClass = () => {
        switch(marker.state) {
          case 'declining': return 'tooltip-label tooltip-label-declining';
          case 'closed': return 'tooltip-label tooltip-label-closed';
          default: return 'tooltip-label tooltip-label-active';
        }
      };
      
      return (
        <Marker
          key={marker.id}
          position={marker.position}
          icon={icon}
          eventHandlers={{
            click: () => onMarkerClick(marker.id),
            mouseover: () => setHoveredMarkerId(marker.id),
            mouseout: () => setHoveredMarkerId(null),
          }}
        >
          <Tooltip 
            permanent 
            direction="top" 
            offset={[0, -10]} 
            className={getTooltipClass()}
            opacity={1}
          >
            <div className="font-medium">{marker.popup}</div>
          </Tooltip>
        </Marker>
      );
    });
  }, [markers, activeMarkerId, hoveredMarkerId, onMarkerClick]);

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 z-[1] pointer-events-none" />
      <TileLayer
        url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        opacity={0.9}
      />
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
        iconCreateFunction={(cluster) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="cluster-marker" style="
              background: linear-gradient(135deg, #4a5f7a 0%, #6b82a0 100%);
              color: white;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: 15px;
              border: 2px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            ">${count}</div>`,
            className: 'custom-cluster',
            iconSize: L.point(44, 44),
          });
        }}
      >
        {markerElements}
      </MarkerClusterGroup>
      <ZoomControls />
    </>
  );
}

const Map: React.FC<MapProps> = ({ markers = [], center, zoom, onMarkerClick, activeMarkerId, currentDate }) => {
  useEffect(() => {
    console.log('Markers in Map component:', markers);
  }, [markers]);

  return (
    <div className="relative h-full w-full overflow-hidden border-l border-border">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        className="z-0"
      >
        <MapContent markers={markers} onMarkerClick={onMarkerClick} activeMarkerId={activeMarkerId} currentDate={currentDate} />
      </MapContainer>
    </div>
  )
}

export default Map