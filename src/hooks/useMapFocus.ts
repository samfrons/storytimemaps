import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MarkerData } from '../types'; // Assuming you have a types file

export const useMapFocus = (activeMarkerId: string | null | undefined, markers: MarkerData[], zoomLevel: number = 15) => {
  const map = useMap();

  useEffect(() => {
    if (activeMarkerId) {
      const activeMarker = markers.find(marker => marker.id === activeMarkerId);
      if (activeMarker) {
        map.setView(activeMarker.position, zoomLevel);
        
        // Open popup for the active marker
        const leafletMarkers = (map as unknown as { _layers: Record<string, { options?: { id?: string }; openPopup?: () => void }> })._layers;
        Object.keys(leafletMarkers).forEach(key => {
          const layer = leafletMarkers[key];
          if (layer.options && layer.options.id === activeMarkerId && layer.openPopup) {
            layer.openPopup();
          }
        });
      }
    }
  }, [activeMarkerId, markers, map, zoomLevel]);
};