// Custom Mapbox style for dark theme with gold roads
export const customMapStyle = {
  version: 8,
  sources: {
    'mapbox-streets': {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8'
    }
  },
  layers: [
    // Background
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#282833'
      }
    },
    // Water
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox-streets',
      'source-layer': 'water',
      paint: {
        'fill-color': '#ffecc0'
      }
    },
    // Parks and landuse
    {
      id: 'parks',
      type: 'fill',
      source: 'mapbox-streets',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'park', 'cemetery', 'pitch', 'grass'],
      paint: {
        'fill-color': '#21212d',
        'fill-opacity': 0.8
      }
    },
    // Buildings
    {
      id: 'buildings',
      type: 'fill',
      source: 'mapbox-streets',
      'source-layer': 'building',
      paint: {
        'fill-color': '#323240',
        'fill-opacity': 0.5
      }
    },
    // Minor roads
    {
      id: 'road-minor',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'road',
      filter: ['in', 'class', 'service', 'path', 'track'],
      paint: {
        'line-color': '#7a6230',
        'line-width': 1
      }
    },
    // Streets
    {
      id: 'road-street',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'road',
      filter: ['==', 'class', 'street'],
      paint: {
        'line-color': '#a1823a',
        'line-width': {
          base: 1.5,
          stops: [[10, 1], [15, 3]]
        }
      }
    },
    // Secondary roads
    {
      id: 'road-secondary',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'road',
      filter: ['in', 'class', 'secondary', 'tertiary'],
      paint: {
        'line-color': '#cea74f',
        'line-width': {
          base: 1.5,
          stops: [[10, 1.5], [15, 4]]
        }
      }
    },
    // Primary roads
    {
      id: 'road-primary',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'road',
      filter: ['==', 'class', 'primary'],
      paint: {
        'line-color': '#ecc368',
        'line-width': {
          base: 1.5,
          stops: [[10, 2], [15, 5]]
        }
      }
    },
    // Highways
    {
      id: 'road-highway',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'road',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#ecc368',
        'line-width': {
          base: 1.5,
          stops: [[10, 2.5], [15, 6]]
        }
      }
    },
    // Transit
    {
      id: 'transit',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'transit',
      paint: {
        'line-color': '#deaf44',
        'line-opacity': 0.5
      }
    },
    // Admin boundaries
    {
      id: 'admin',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'admin',
      paint: {
        'line-color': '#3a3a3a',
        'line-opacity': 0.3
      }
    }
  ]
};

// Alternative: Apply styles to existing Mapbox style
export const applyCustomStyleToMap = (map: any) => {
  try {
    if (!map.isStyleLoaded()) {
      console.log('Style not loaded yet, retrying...');
      setTimeout(() => applyCustomStyleToMap(map), 100);
      return;
    }

    const layers = map.getStyle().layers;
    
    // First pass: Hide all labels and symbols
    layers.forEach((layer: any) => {
      if (layer.type === 'symbol') {
        map.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    });

    // Second pass: Apply colors
    layers.forEach((layer: any) => {
      const layerId = layer.id.toLowerCase();
      
      // Background
      if (layerId === 'background') {
        map.setPaintProperty(layer.id, 'background-color', '#282833');
      }
      
      // Water
      else if (layerId.includes('water')) {
        if (layer.type === 'fill') {
          map.setPaintProperty(layer.id, 'fill-color', '#ffecc0');
          map.setPaintProperty(layer.id, 'fill-opacity', 1);
        } else if (layer.type === 'line') {
          map.setPaintProperty(layer.id, 'line-color', '#ffecc0');
        }
      }
      
      // Parks and green spaces
      else if (layerId.includes('park') || layerId.includes('landuse') || 
               layerId.includes('grass') || layerId.includes('cemetery')) {
        if (layer.type === 'fill') {
          map.setPaintProperty(layer.id, 'fill-color', '#21212d');
          map.setPaintProperty(layer.id, 'fill-opacity', 0.8);
        }
      }
      
      // Buildings
      else if (layerId.includes('building')) {
        if (layer.type === 'fill') {
          map.setPaintProperty(layer.id, 'fill-color', '#323240');
          map.setPaintProperty(layer.id, 'fill-opacity', 0.5);
        }
      }
      
      // Roads
      else if (layer.type === 'line' && (layerId.includes('road') || layerId.includes('street') || 
               layerId.includes('highway') || layerId.includes('path'))) {
        
        // Hide casings
        if (layerId.includes('case') || layerId.includes('casing')) {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
        // Highways and motorways
        else if (layerId.includes('motorway') || layerId.includes('trunk')) {
          map.setPaintProperty(layer.id, 'line-color', '#ecc368');
          map.setPaintProperty(layer.id, 'line-width', 3);
        }
        // Primary roads
        else if (layerId.includes('primary')) {
          map.setPaintProperty(layer.id, 'line-color', '#ecc368');
          map.setPaintProperty(layer.id, 'line-width', 2.5);
        }
        // Secondary roads
        else if (layerId.includes('secondary') || layerId.includes('tertiary')) {
          map.setPaintProperty(layer.id, 'line-color', '#cea74f');
          map.setPaintProperty(layer.id, 'line-width', 2);
        }
        // Streets
        else if (layerId.includes('street') || layerId.includes('minor')) {
          map.setPaintProperty(layer.id, 'line-color', '#a1823a');
          map.setPaintProperty(layer.id, 'line-width', 1.5);
        }
        // Paths and service roads
        else if (layerId.includes('path') || layerId.includes('service') || layerId.includes('track')) {
          map.setPaintProperty(layer.id, 'line-color', '#7a6230');
          map.setPaintProperty(layer.id, 'line-width', 1);
        }
        // Default road color
        else {
          map.setPaintProperty(layer.id, 'line-color', '#8a7040');
          map.setPaintProperty(layer.id, 'line-width', 1.5);
        }
      }
      
      // Transit
      else if (layer.type === 'line' && layerId.includes('transit')) {
        map.setPaintProperty(layer.id, 'line-color', '#deaf44');
        map.setPaintProperty(layer.id, 'line-opacity', 0.5);
      }
      
      // Admin boundaries
      else if (layer.type === 'line' && (layerId.includes('admin') || layerId.includes('boundary'))) {
        map.setPaintProperty(layer.id, 'line-color', '#3a3a3a');
        map.setPaintProperty(layer.id, 'line-opacity', 0.3);
      }
    });
    
    console.log('Custom map style applied successfully');
    return true;
    
  } catch (error) {
    console.error('Error applying custom style:', error);
    return false;
  }
};