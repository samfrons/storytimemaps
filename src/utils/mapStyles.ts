/**
 * Mapbox GL custom styles for different themes
 *
 * These are complete custom map styles that replace the default Mapbox style.
 * Each theme has a carefully designed color palette for historical visualization.
 */

import type { StyleSpecification } from 'mapbox-gl'

// Base source configuration used by all custom styles
const MAPBOX_VECTOR_SOURCE = {
  type: 'vector' as const,
  url: 'mapbox://mapbox.mapbox-streets-v8',
}

const MAPBOX_GLYPHS = 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf'

/**
 * Moody Theme - Dark purple-gray with warm accents
 * Default theme for the historical visualization
 */
export const MOODY_STYLE: StyleSpecification = {
  version: 8,
  name: 'Moody Theme',
  sources: {
    mapbox: MAPBOX_VECTOR_SOURCE,
  },
  glyphs: MAPBOX_GLYPHS,
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#4a4a57',
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#5a5766',
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
        'fill-color': '#97d8c0',
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
        'line-color': '#ee5760',
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
        'line-color': '#ffcb51',
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
        'line-color': '#f5cdb4',
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
    {
      id: 'place-label',
      type: 'symbol',
      source: 'mapbox',
      'source-layer': 'place_label',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': {
          stops: [
            [6, 10],
            [12, 16],
          ],
        },
      },
      paint: {
        'text-color': '#f5cdb4',
        'text-halo-color': '#3b3340',
        'text-halo-width': 1,
      },
    },
    {
      id: 'road-label',
      type: 'symbol',
      source: 'mapbox',
      'source-layer': 'road',
      layout: {
        'text-field': ['get', 'name'],
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

/**
 * Hot Theme - Deep red tones inspired by Snazzy Maps "Red Colored"
 */
export const HOT_STYLE: StyleSpecification = {
  version: 8,
  name: 'Red Colored - Snazzy Maps',
  sources: {
    mapbox: MAPBOX_VECTOR_SOURCE,
  },
  glyphs: MAPBOX_GLYPHS,
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#96000e',
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#2a0b0d',
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
        'fill-color': '#5f0006',
        'fill-opacity': 1,
      },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'building',
      paint: {
        'fill-color': '#7a0a11',
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
        'line-color': '#b93f3f',
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
        'line-color': '#8e895e',
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

/**
 * Bauhaus Theme - Clean geometric style with primary colors
 */
export const BAUHAUS_STYLE: StyleSpecification = {
  version: 8,
  name: 'Bauhaus Theme',
  sources: {
    mapbox: MAPBOX_VECTOR_SOURCE,
  },
  glyphs: MAPBOX_GLYPHS,
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#ffffff',
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#0066cc',
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
        'fill-color': '#ffcc00',
        'fill-opacity': 0.3,
      },
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'building',
      paint: {
        'fill-color': '#000000',
        'fill-opacity': 0.2,
      },
    },
    {
      id: 'roads',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      paint: {
        'line-color': '#cc0000',
        'line-width': 2,
      },
    },
    // No text labels for clean Bauhaus aesthetic
  ],
}

/**
 * Archival Theme - Minimal dark slate-blue for historical document feel
 */
export const ARCHIVAL_STYLE: StyleSpecification = {
  version: 8,
  name: 'Archival Theme',
  sources: {
    mapbox: MAPBOX_VECTOR_SOURCE,
  },
  sprite: 'mapbox://sprites/mapbox/dark-v10',
  glyphs: MAPBOX_GLYPHS,
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#3e4a5c',
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#1e3a52',
      },
    },
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
 * Hoefe Theme - Warm cream with elegant accents (Hackesche Höfe inspired)
 */
export const HOEFE_STYLE: StyleSpecification = {
  version: 8,
  name: 'Hackesche Hoefe Theme',
  sources: {
    mapbox: MAPBOX_VECTOR_SOURCE,
  },
  glyphs: MAPBOX_GLYPHS,
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#f5f0e1', // Cream
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#b5d5d5', // Light teal
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
        'fill-color': '#7db5a4', // Mint teal
        'fill-opacity': 0.3,
      },
    },
    {
      id: 'landuse-other',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'landuse',
      filter: ['!=', 'class', 'park'],
      paint: {
        'fill-color': '#f5f0e1',
        'fill-opacity': 0.1,
      },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'building',
      paint: {
        'fill-color': '#e8e3d4', // Light beige
        'fill-opacity': 0.6,
        'fill-outline-color': '#d4d0c8',
      },
    },
    {
      id: 'road-highway',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['in', 'class', 'motorway', 'trunk'],
      paint: {
        'line-color': '#4a90a4', // Steel blue
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
        'line-color': '#c5d5e5', // Powder blue
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
        'line-color': '#d4d0c8', // Warm gray
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
    {
      id: 'place-label',
      type: 'symbol',
      source: 'mapbox',
      'source-layer': 'place_label',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': {
          stops: [
            [6, 10],
            [12, 14],
          ],
        },
      },
      paint: {
        'text-color': '#1a1a1a', // Black
        'text-halo-color': '#f5f0e1', // Cream halo
        'text-halo-width': 1.5,
      },
    },
    {
      id: 'road-label',
      type: 'symbol',
      source: 'mapbox',
      'source-layer': 'road',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-size': 11,
        'symbol-placement': 'line',
        'text-rotation-alignment': 'map',
      },
      paint: {
        'text-color': '#5a5a5a', // Dark gray
        'text-halo-color': '#f5f0e1', // Cream halo
        'text-halo-width': 1,
      },
    },
  ],
}

/**
 * Brutal Pop Theme - the /museum-exhibit map, transcribed declaratively.
 *
 * The exhibit applies this look imperatively via setPaintProperty loops in
 * museum-exhibit/components/TouchMapSimple.tsx:227-328, which cannot be referenced from here.
 * These values are transcribed verbatim from that file so the two surfaces stay identical:
 * charcoal ground, cream water, and a four-weight gold road hierarchy.
 *
 * No label layers - the exhibit map carries none, and on a map whose job is showing thousands
 * of state-coloured pins at once, place labels compete with the data.
 */
export const BRUTAL_POP_STYLE: StyleSpecification = {
  version: 8,
  name: 'Brutal Pop Theme',
  sources: {
    mapbox: MAPBOX_VECTOR_SOURCE,
  },
  glyphs: MAPBOX_GLYPHS,
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#282833',
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': '#ffecc0',
      },
    },
    {
      id: 'parks',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'park'],
      paint: {
        'fill-color': '#21212d',
        'fill-opacity': 0.8,
      },
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'building',
      paint: {
        'fill-color': '#323240',
        'fill-opacity': 0.5,
      },
    },
    {
      id: 'road-local',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      // Mirrors the class list the other styles in this file use (see road-local above),
      // rather than the exhibit's looser matching, so the same streets light up per theme.
      filter: ['in', 'class', 'street', 'street_limited', 'service', 'track', 'pedestrian'],
      paint: {
        'line-color': '#a1823a',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 15, 2],
      },
    },
    {
      id: 'road-secondary',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['in', 'class', 'secondary', 'tertiary'],
      paint: {
        'line-color': '#cea74f',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 4],
      },
    },
    {
      id: 'road-highway',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['in', 'class', 'motorway', 'trunk', 'primary'],
      paint: {
        'line-color': '#ecc368',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 15, 6],
      },
    },
    {
      id: 'admin-boundaries',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'admin',
      paint: {
        'line-color': '#3a3a3a',
        'line-opacity': 0.3,
      },
    },
  ],
}

/**
 * Mapbox hosted style URLs for themes that use modification approach
 */
export const MAPBOX_HOSTED_STYLES = {
  cold: 'mapbox://styles/mapbox/light-v11',
  cool: 'mapbox://styles/mapbox/light-v11',
  warm: 'mapbox://styles/mapbox/outdoors-v12',
  'art-nouveau': 'mapbox://styles/mapbox/outdoors-v12',
} as const

/**
 * Get the appropriate map style for a theme
 */
export function getThemeMapStyle(theme: string | undefined): StyleSpecification | string {
  switch (theme) {
    case 'moody':
      return MOODY_STYLE
    case 'bauhaus':
      return BAUHAUS_STYLE
    case 'hot':
      return HOT_STYLE
    case 'archival':
      return ARCHIVAL_STYLE
    case 'hoefe':
      return HOEFE_STYLE
    case 'brutal-pop':
      return BRUTAL_POP_STYLE
    case 'cold':
    case 'cool':
      return MAPBOX_HOSTED_STYLES.cold
    case 'warm':
      return MAPBOX_HOSTED_STYLES.warm
    case 'art-nouveau':
      return MAPBOX_HOSTED_STYLES['art-nouveau']
    default:
      return MOODY_STYLE
  }
}

/**
 * Theme-specific marker colors
 */
export interface ThemeMarkerColors {
  active: string
  declining: string
  closed: string
  future: string
}

/**
 * Get marker colors for a specific theme
 */
export function getThemeMarkerColors(theme: string | undefined): ThemeMarkerColors {
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
        active: '#00ff00',
        declining: '#ffaa00',
        closed: '#ff0000',
        future: '#666666',
      }
    case 'archival':
      return {
        active: 'rgba(44, 74, 124, 0.85)',
        declining: 'rgba(90, 115, 151, 0.85)',
        closed: 'rgba(139, 156, 174, 0.85)',
        future: 'rgba(44, 74, 124, 0.85)',
      }
    case 'hoefe':
      return {
        active: '#7db5a4', // Mint teal
        declining: '#e8a830', // Amber gold
        closed: '#8b4049', // Burgundy
        future: '#c5d5e5', // Powder blue
      }
    case 'brutal-pop':
      // The basemap is charcoal with a four-weight GOLD road hierarchy (#ecc368 -> #7a6230),
      // so 'declining' must not be gold or thousands of pins would vanish into the streets.
      // These are pushed to high chroma deliberately: on this theme the basemap is silent and
      // the pins are the only saturated thing on screen, so the mint -> orange -> red shift
      // across the 1930s reads as a mass even at low zoom. 'future' is muted on purpose - it
      // recedes into the charcoal so the eye tracks businesses that are alive or dying.
      return {
        active: '#00e5c0', // Electric mint
        declining: '#ff7a1a', // Hot orange - deliberately not gold
        closed: '#ff2d55', // Hot red
        future: '#6b6b7d', // Muted violet-grey, recedes
      }
    case 'moody':
    default:
      return {
        active: '#97d8c0',
        declining: '#ffcb51',
        closed: '#ee5760',
        future: '#f5cdb4',
      }
  }
}

/**
 * Check if a theme uses a complete custom style (vs modification approach)
 */
export function isCustomStyleTheme(theme: string | undefined): boolean {
  return (
    theme === 'moody' ||
    theme === 'hot' ||
    theme === 'bauhaus' ||
    theme === 'archival' ||
    theme === 'hoefe' ||
    // Must be here and NOT in isModificationTheme: MapboxMap.applyThemeStyles early-returns for
    // custom-style themes, and routing brutal-pop through the modification path would run
    // imperative setPaintProperty loops against a declarative style.
    theme === 'brutal-pop'
  )
}

/**
 * Check if a theme uses the modification approach
 */
export function isModificationTheme(theme: string | undefined): boolean {
  return theme === 'cold' || theme === 'cool' || theme === 'warm' || theme === 'art-nouveau'
}
