/**
 * Map style definitions for different themes.
 * Contains complete Mapbox GL style objects for each supported theme.
 */

// Complete custom style for moody theme
export const MOODY_STYLE = {
  version: 8 as const,
  name: 'Moody Theme',
  sources: {
    mapbox: {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    },
  },
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#4a4a57', // Dark purple-gray background
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#5a5766', // Darker purple-gray water
        'fill-opacity': 0.8,
      },
    },
    {
      id: 'landuse-park',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'park'],
      paint: {
        'fill-color': '#97d8c0', // Mint green parks
        'fill-opacity': 0.2,
      },
    },
    {
      id: 'landuse-other',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'landuse',
      filter: ['!=', 'class', 'park'],
      paint: {
        'fill-color': '#4a4a57',
        'fill-opacity': 0.1,
      },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'building',
      paint: {
        'fill-color': '#4a4a57',
        'fill-opacity': 0.6,
        'fill-outline-color': '#3b3340',
      },
    },
    {
      id: 'road-highway',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#ee5760', // Coral red for highways
        'line-width': {
          base: 1.5,
          stops: [
            [8, 0.5],
            [10, 1],
            [12, 3],
            [16, 8],
            [20, 18],
          ],
        },
        'line-opacity': 1,
      },
    },
    {
      id: 'road-primary',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['in', 'class', 'primary', 'secondary'],
      paint: {
        'line-color': '#ffcb51', // Golden yellow for primary roads
        'line-width': {
          base: 1.5,
          stops: [
            [12, 0.5],
            [14, 1],
            [16, 3],
            [20, 8],
          ],
        },
        'line-opacity': 1,
      },
    },
    {
      id: 'road-local',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['in', 'class', 'street', 'street_limited', 'service', 'track', 'pedestrian'],
      paint: {
        'line-color': '#f5cdb4', // Light peach for local streets
        'line-width': {
          base: 1.5,
          stops: [
            [12, 0.5],
            [14, 0.8],
            [16, 2],
            [20, 6],
          ],
        },
        'line-opacity': 0.6,
      },
    },
    // Labels
    {
      id: 'place-label',
      type: 'symbol',
      source: 'mapbox',
      'source-layer': 'place_label',
      layout: {
        'text-field': '{name}',
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': {
          stops: [
            [6, 10],
            [12, 16],
          ],
        },
      },
      paint: {
        'text-color': '#f5cdb4', // Peach text
        'text-halo-color': '#3b3340', // Dark navy halo
        'text-halo-width': 1,
      },
    },
    {
      id: 'road-label',
      type: 'symbol',
      source: 'mapbox',
      'source-layer': 'road',
      layout: {
        'text-field': '{name}',
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-size': 12,
        'symbol-placement': 'line',
        'text-rotation-alignment': 'map',
      },
      paint: {
        'text-color': '#f5cdb4',
        'text-halo-color': '#3b3340',
        'text-halo-width': 1,
      },
    },
  ],
}

// Snazzy Maps "Red Colored" style conversion for hot theme
export const SNAZZY_RED_STYLE = {
  version: 8 as const,
  name: 'Red Colored - Snazzy Maps',
  sources: {
    mapbox: {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    },
  },
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#96000e', // Main red from Snazzy Maps
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#2a0b0d', // Dark red-brown water
        'fill-opacity': 1,
      },
    },
    {
      id: 'landuse-park',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'park'],
      paint: {
        'fill-color': '#5f0006', // Dark red parks
        'fill-opacity': 1,
      },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'building',
      paint: {
        'fill-color': '#7a0a11', // Slightly lighter red buildings
        'fill-opacity': 0.9,
        'fill-outline-color': '#5f0006',
      },
    },
    {
      id: 'road-highway',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#b93f3f', // Bright red highways
        'line-width': {
          base: 1.5,
          stops: [
            [8, 0.5],
            [10, 1],
            [12, 3],
            [16, 8],
            [20, 18],
          ],
        },
        'line-opacity': 1,
      },
    },
    {
      id: 'road-local',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['in', 'class', 'street', 'street_limited', 'primary', 'secondary'],
      paint: {
        'line-color': '#8e895e', // Brownish roads
        'line-width': {
          base: 1.5,
          stops: [
            [12, 0.5],
            [14, 1],
            [16, 3],
            [20, 8],
          ],
        },
        'line-opacity': 1,
      },
    },
  ],
}

// Get complete Bauhaus style
export const BAUHAUS_STYLE = {
  version: 8 as const,
  name: 'Bauhaus Theme',
  sources: {
    mapbox: {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    },
  },
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#ffffff', // white background for Bauhaus
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#0066cc', // primary blue
        'fill-opacity': 0.4,
      },
    },
    {
      id: 'parks',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'park'],
      paint: {
        'fill-color': '#ffcc00', // yellow
        'fill-opacity': 0.3,
      },
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'building',
      paint: {
        'fill-color': '#000000', // black
        'fill-opacity': 0.2,
      },
    },
    {
      id: 'roads',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      paint: {
        'line-color': '#cc0000', // red
        'line-width': 2,
      },
    },
    // No text labels for clean Bauhaus aesthetic
  ],
}

// Get minimal dark archival map style
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ARCHIVAL_STYLE: any = {
  version: 8,
  sources: {
    mapbox: {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    },
  },
  sprite: 'mapbox://sprites/mapbox/dark-v10',
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  layers: [
    // Background - slate blue-grey
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#3e4a5c',
      },
    },
    // Water - darker blue
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#1e3a52',
      },
    },
    // Land/landscape - off-white blue
    {
      id: 'landuse',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'landuse',
      paint: {
        'fill-color': '#e8eef5',
        'fill-opacity': 0.4,
      },
    },
    // Buildings - not shown
    // Roads - minimal dark blue
    {
      id: 'road-local',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['all', ['!=', 'class', 'motorway'], ['!=', 'class', 'trunk']],
      paint: {
        'line-color': '#1a2e5a',
        'line-width': 1,
        'line-opacity': 0.8,
      },
    },
    {
      id: 'road-highway',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#2c4166',
        'line-width': 2,
        'line-opacity': 0.9,
      },
    },
    // No labels for minimal design
  ],
}

/**
 * Get custom map style for each theme
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getThemeMapStyle = (theme: string | undefined): any => {
  switch (theme) {
    case 'moody':
      return MOODY_STYLE // Use complete moody style

    case 'bauhaus':
      return BAUHAUS_STYLE // Use complete bauhaus style

    case 'hot':
      return SNAZZY_RED_STYLE // Use complete Snazzy Maps "Red Colored" style

    case 'archival':
      return ARCHIVAL_STYLE // Use minimal dark style for archival theme

    case 'cold':
      return 'mapbox://styles/mapbox/light-v11' // We'll customize this after load

    case 'cool':
      return 'mapbox://styles/mapbox/light-v11' // We'll customize this after load

    case 'warm':
      return 'mapbox://styles/mapbox/outdoors-v12' // We'll customize this after load

    case 'art-nouveau':
      return 'mapbox://styles/mapbox/outdoors-v12' // We'll customize this after load

    default:
      return MOODY_STYLE // Use moody as default
  }
}

/**
 * Get theme-specific marker colors
 */
export interface ThemeColors {
  active: string
  declining: string
  closed: string
  future: string
}

export const getThemeColors = (theme: string | undefined): ThemeColors => {
  switch (theme) {
    case 'bauhaus':
      return {
        active: '#0066ff',
        declining: '#ffcc00',
        closed: '#ff0000',
        future: '#333333',
      }
    case 'hot':
      return {
        active: '#00ff00', // Bright green for hot theme
        declining: '#ffaa00', // Orange
        closed: '#ff0000', // Red
        future: '#666666', // Gray
      }
    case 'archival':
      return {
        active: 'rgba(44, 74, 124, 0.85)', // Navy-slate rich blue for active
        declining: 'rgba(90, 115, 151, 0.85)', // Medium shade blue for declining
        closed: 'rgba(139, 156, 174, 0.85)', // Light shade blue for closed
        future: 'rgba(44, 74, 124, 0.85)', // Navy-slate blue for future
      }
    case 'cold':
    case 'cool':
    case 'warm':
    case 'art-nouveau':
      return {
        active: '#97d8c0', // Default active color for modification themes
        declining: '#ffcb51', // Default declining color
        closed: '#ee5760', // Default closed color
        future: '#f5cdb4', // Default future color
      }
    default:
      // moody (default)
      return {
        active: '#97d8c0',
        declining: '#ffcb51',
        closed: '#ee5760',
        future: '#f5cdb4',
      }
  }
}

/**
 * Get cluster marker style based on theme
 */
export interface ClusterStyle {
  backgroundColor: string
  border: string
  color: string
}

export const getClusterStyle = (theme: string | undefined): ClusterStyle => {
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
    default:
      // moody
      return {
        backgroundColor: '#f5cdb4',
        border: '3px solid #6b6275',
        color: '#2a2a2a',
      }
  }
}

/**
 * Get map colors for themes that use the modification approach
 * (cold, cool, warm, art-nouveau)
 */
export interface MapColors {
  water: string
  park: string
  road: string
  background: string
}

export const getMapColors = (theme: string | undefined): MapColors => {
  if (theme === 'cold') {
    return {
      water: '#87CEEB', // Sky blue
      park: '#90EE90', // Light green
      road: '#B0B0B0', // Light gray
      background: '#F5F5F5', // Very light gray
    }
  }
  // Default colors for cool, warm, art-nouveau
  return {
    water: '#5a5766', // Dark purple-gray
    park: '#97d8c0', // Mint green
    road: '#f5cdb4', // Light peach
    background: '#4a4a57', // Dark background
  }
}
