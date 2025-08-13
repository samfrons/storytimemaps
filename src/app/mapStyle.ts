export const customMapStyle = {
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
        'background-color': '#2b3f57'
      }
    },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#1a2633'
      }
    },
    {
      id: 'roads',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      paint: {
        'line-color': '#f55f77',
        'line-width': {
          base: 1.5,
          stops: [[12, 0.5], [14, 2], [18, 18]]
        }
      }
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'building',
      paint: {
        'fill-color': '#3a4e68',
        'fill-opacity': 0.8
      }
    },
    {
      id: 'poi',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'poi_label',
      paint: {
        'fill-color': '#6c5b7b'
      }
    }
  ]
};

// Simpler style object for react-map-gl
export const mapboxDarkStyle = {
  version: 8,
  name: 'Dark Berlin',
  sources: {
    'mapbox-streets': {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8'
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#2b3f57'
      }
    }
  ]
};