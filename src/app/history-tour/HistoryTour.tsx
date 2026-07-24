'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import * as maplibregl from 'maplibre-gl'
import type { PaddingOptions, StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './history-tour.css'
import {
  AXIS_END,
  AXIS_START,
  ERA_EVENTS,
  INTRO_CAM,
  OUTRO_CAM,
  TOUR_STOPS,
  axisPercent,
  formatDateLabel,
  formatMonthYear,
  toDecimalYear,
  type TourStop,
} from './tourData'
import { FOOTPRINTS_1930 } from './footprints1930'

// Map-internal palette. WebGL layers require literal color values (CSS
// variables cannot reach into the map) — the documented map-styling
// exception to the CSS-variable rule.
const MAP_COLORS = {
  paper: '#eadfc6',
  shadow: '#2a2216',
  highlight: '#f6ecd6',
  accentHs: '#4a4030',
  // 1930 Berlin facade tonality (from the period photographic record):
  // courtyard workshops in ochre plaster, the Mietskaserne stock in
  // soot-dulled grey-sand stucco, and the monumental scale in grey sandstone.
  buildingLow: '#d8c9a2',
  buildingMid: '#cabb98',
  buildingHigh: '#a89e85',
  buildingMonument: '#948b74',
  inkSoft: '#5a4a35',
  accent: '#8a3b2e',
}

// Berlin's building code held the 1930 city to a uniform eaves line
// (Traufhöhe) of ~22 m — five storeys. Buildings up to TRAUF_TRUE keep their
// real height (the surviving Gründerzeit fabric IS the 1930 fabric); taller
// structures are compressed hard so pre-war landmarks (church towers, domes,
// the Rathaus) still rise over the roofscape at period-plausible scale while
// post-war towers stop reading as skyline. Structures above MODERN_CUTOFF
// (the 1969 TV tower, antenna masts) did not exist in 1930 and are omitted.
const TRAUF_DEFAULT = 21 // five storeys — the safe assumption for the 1930 center
const TRAUF_TRUE = 26
const TALL_COMPRESS = 0.3
const TALL_CAP = 55
const MODERN_CUTOFF = 150

// Style-expression form of the height normalization.
const HEIGHT_1930_EXPR = [
  'let',
  'h',
  ['coalesce', ['get', 'render_height'], TRAUF_DEFAULT],
  [
    'case',
    ['<=', ['var', 'h'], TRAUF_TRUE],
    ['var', 'h'],
    ['min', ['+', TRAUF_TRUE, ['*', ['-', ['var', 'h'], TRAUF_TRUE], TALL_COMPRESS]], TALL_CAP],
  ],
]

// The same normalization for the JS side (highlight clone).
function height1930(h: number): number {
  if (h <= TRAUF_TRUE) return h
  return Math.min(TRAUF_TRUE + (h - TRAUF_TRUE) * TALL_COMPRESS, TALL_CAP)
}

// The K2-style relief stage: keyless sources — Esri World Imagery draped
// over AWS terrarium elevation tiles with a sepia hillshade, plus extruded
// OpenStreetMap building volumes (OpenFreeMap vector tiles) so each stop
// reads as a modeled city block rather than a flat aerial.
const TERRARIUM_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

function buildTourStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      sat: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 18,
        attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
      },
      demhs: {
        type: 'raster-dem',
        tiles: [TERRARIUM_TILES],
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 14,
      },
      dem: {
        type: 'raster-dem',
        tiles: [TERRARIUM_TILES],
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 14,
        attribution: 'Terrain: Mapzen/AWS Open Data',
      },
      ofm: {
        type: 'vector',
        url: 'https://tiles.openfreemap.org/planet',
        attribution: 'Buildings © OpenStreetMap contributors · OpenFreeMap',
      },
      'ht-sites': {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: TOUR_STOPS.map((s, idx) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
            properties: { idx },
          })),
        },
      },
      'ht-active-building': {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    },
    sky: {
      'sky-color': '#cfd2c0',
      'horizon-color': '#e8dab4',
      'fog-color': '#e3d3a8',
      'sky-horizon-blend': 0.7,
      'horizon-fog-blend': 0.5,
      'fog-ground-blend': 0.35,
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': MAP_COLORS.paper } },
      {
        id: 'sat',
        type: 'raster',
        source: 'sat',
        paint: {
          'raster-saturation': -0.55,
          'raster-contrast': 0.06,
          'raster-brightness-max': 0.95,
        },
      },
      {
        id: 'hs',
        type: 'hillshade',
        source: 'demhs',
        paint: {
          'hillshade-exaggeration': 0.4,
          'hillshade-shadow-color': MAP_COLORS.shadow,
          'hillshade-highlight-color': MAP_COLORS.highlight,
          'hillshade-accent-color': MAP_COLORS.accentHs,
        },
      },
      {
        id: 'ht-3d-buildings',
        type: 'fill-extrusion',
        source: 'ofm',
        'source-layer': 'building',
        minzoom: 14,
        filter: [
          'all',
          ['!=', ['get', 'hide_3d'], true],
          ['<=', ['coalesce', ['get', 'render_height'], TRAUF_DEFAULT], MODERN_CUTOFF],
        ],
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'render_height'], TRAUF_DEFAULT],
            5,
            MAP_COLORS.buildingLow,
            16,
            MAP_COLORS.buildingMid,
            30,
            MAP_COLORS.buildingHigh,
            60,
            MAP_COLORS.buildingMonument,
          ],
          'fill-extrusion-height': HEIGHT_1930_EXPR as never,
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.82,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      {
        // Engraved parcel lines under the block model — the plan-drawing
        // detail of a 1930 city model.
        id: 'ht-building-lines',
        type: 'line',
        source: 'ofm',
        'source-layer': 'building',
        minzoom: 15,
        paint: {
          'line-color': MAP_COLORS.inkSoft,
          'line-opacity': 0.28,
          'line-width': 0.6,
        },
      },
      {
        id: 'ht-active-building',
        type: 'fill-extrusion',
        source: 'ht-active-building',
        paint: {
          'fill-extrusion-color': MAP_COLORS.accent,
          // Drawn 2 m above the base extrusion of the same footprint so the
          // highlight wins the depth test instead of z-fighting it. The
          // render_height set on the clone is already 1930-normalized.
          'fill-extrusion-height': ['+', ['coalesce', ['get', 'render_height'], TRAUF_DEFAULT], 2],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.96,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      {
        id: 'ht-site-rings',
        type: 'circle',
        source: 'ht-sites',
        paint: {
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-color': MAP_COLORS.highlight,
          'circle-stroke-width': 1,
          'circle-opacity': 0,
          'circle-stroke-opacity': 0.6,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 3, 17, 14],
        },
      },
      {
        id: 'ht-site-active',
        type: 'circle',
        source: 'ht-sites',
        filter: ['==', ['get', 'idx'], -1],
        paint: {
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-color': MAP_COLORS.accent,
          'circle-stroke-width': 2.5,
          'circle-opacity': 0,
          'circle-stroke-opacity': 0.9,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 6, 17, 30],
        },
      },
    ],
  }
}

interface CamKey {
  y: number
  lng: number
  lat: number
  zoom: number
  pitch: number
  bearing: number
  year: number
  stopIdx: number | null
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpAngle = (a: number, b: number, t: number) => {
  const d = ((b - a + 540) % 360) - 180
  return (a + d * t + 360) % 360
}
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

type LngLat = [number, number]

function pointInRing(pt: LngLat, ring: LngLat[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// Vector-tile building features arrive merged into multipart geometries at
// these zooms — extract only the footprint that contains (or is nearest to)
// the stop's coordinates, so the highlight marks one block, not a district.
function pickFootprint(geometry: GeoJSON.Geometry, pt: LngLat): GeoJSON.Polygon | null {
  const polys: LngLat[][][] =
    geometry.type === 'Polygon'
      ? [geometry.coordinates as LngLat[][]]
      : geometry.type === 'MultiPolygon'
        ? (geometry.coordinates as LngLat[][][])
        : []
  if (polys.length === 0) return null
  const containing = polys.find((poly) => poly[0] && pointInRing(pt, poly[0]))
  if (containing) return { type: 'Polygon', coordinates: containing }
  let best: LngLat[][] | null = null
  let bestDist = Infinity
  for (const poly of polys) {
    const ring = poly[0]
    if (!ring) continue
    for (const [x, y] of ring) {
      const d = (x - pt[0]) * (x - pt[0]) + (y - pt[1]) * (y - pt[1])
      if (d < bestDist) {
        bestDist = d
        best = poly
      }
    }
  }
  // Only accept a nearby footprint (~60 m) — otherwise show no highlight
  // rather than tinting the wrong building.
  if (best && bestDist < 0.0006 * 0.0006) return { type: 'Polygon', coordinates: best }
  return null
}

interface StopCardProps {
  stop: TourStop
  index: number
  total: number
}

const StopCard: React.FC<StopCardProps> = ({ stop, index, total }) => (
  <article className="ht-card" data-ht-card>
    <div className="ht-card-meta">
      <span className="ht-card-index">
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
      <span>
        {formatDateLabel(stop.startDate)} — {formatDateLabel(stop.endDate)}
      </span>
    </div>
    <h2>{stop.title}</h2>
    <p className="ht-card-address">
      {stop.address} · {stop.district}
    </p>
    <figure className="ht-card-figure">
      <Image
        src={stop.image}
        alt={`Archival image — ${stop.title}`}
        width={860}
        height={560}
        sizes="(max-width: 768px) 92vw, 430px"
        style={{ width: '100%', height: 'auto' }}
      />
      <figcaption>{stop.imageCredit}</figcaption>
    </figure>
    <p className="ht-card-story">{stop.story}</p>
    <div className="ht-card-building">
      <h3>The building &amp; the street</h3>
      <p>{stop.building}</p>
    </div>
    <span className={`ht-card-fate${stop.fateKind === 'destroyed' ? ' is-destroyed' : ''}`}>
      {stop.fate}
    </span>
  </article>
)

const HistoryTour: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const introRef = useRef<HTMLElement | null>(null)
  const outroRef = useRef<HTMLElement | null>(null)
  const stopSectionRefs = useRef<(HTMLElement | null)[]>([])
  const markerElsRef = useRef<(HTMLDivElement | null)[]>([])
  const keysRef = useRef<CamKey[]>([])
  const rafRef = useRef<number>(0)
  const lastScrollRef = useRef<number>(-1)
  const paddingRef = useRef<PaddingOptions>({ top: 0, bottom: 0, left: 0, right: 0 })
  const pendingHighlightRef = useRef<number>(-1)
  const lastHighlightTryRef = useRef<number>(0)
  const activeIdxRef = useRef<number>(-1)
  const reduceMotionRef = useRef<boolean>(false)

  const yearElRef = useRef<HTMLDivElement | null>(null)
  const districtElRef = useRef<HTMLDivElement | null>(null)
  const needleElRef = useRef<HTMLDivElement | null>(null)
  const compassElRef = useRef<HTMLSpanElement | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [mapFailed, setMapFailed] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  const stopYears = useMemo(() => TOUR_STOPS.map((s) => toDecimalYear(s.endDate)), [])

  const axisTicks = useMemo(() => {
    const ticks: { year: number; major: boolean }[] = []
    for (let y = AXIS_START; y <= AXIS_END; y++) {
      ticks.push({ year: y, major: y % 5 === 0 })
    }
    return ticks
  }, [])

  const scrollToStop = useCallback((idx: number) => {
    const el = stopSectionRefs.current[idx]
    if (el) {
      el.scrollIntoView({
        behavior: reduceMotionRef.current ? 'auto' : 'smooth',
        block: 'start',
      })
    }
  }, [])

  // Measure keyframe anchor positions from the DOM.
  const measure = useCallback(() => {
    const keys: CamKey[] = []
    const scrollTop = window.scrollY

    const intro = introRef.current
    if (intro) {
      const r = intro.getBoundingClientRect()
      const top = r.top + scrollTop
      keys.push({ y: top, ...INTRO_CAM, stopIdx: null })
      keys.push({ y: top + r.height * 0.55, ...INTRO_CAM, stopIdx: null })
    }

    TOUR_STOPS.forEach((stop, i) => {
      const el = stopSectionRefs.current[i]
      if (!el) return
      const r = el.getBoundingClientRect()
      const top = r.top + scrollTop
      const base = {
        lng: stop.lng,
        lat: stop.lat,
        zoom: stop.cam.zoom,
        pitch: stop.cam.pitch,
        bearing: stop.cam.bearing,
        year: stopYears[i],
        stopIdx: i,
      }
      keys.push({ y: top + r.height * 0.18, ...base })
      keys.push({ y: top + r.height * 0.72, ...base })
    })

    const outro = outroRef.current
    if (outro) {
      const r = outro.getBoundingClientRect()
      keys.push({ y: r.top + scrollTop + r.height * 0.35, ...OUTRO_CAM, stopIdx: null })
    }

    keys.sort((a, b) => a.y - b.y)
    keysRef.current = keys
    lastScrollRef.current = -1
  }, [stopYears])

  const updatePadding = useCallback(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    paddingRef.current =
      w > 768
        ? { top: 40, bottom: 120, left: 60, right: Math.min(540, w * 0.44) }
        : { top: 60, bottom: h * 0.44, left: 0, right: 0 }
  }, [])

  // Copy the building footprint under the active stop into the highlight
  // source (OpenFreeMap building features carry no stable ids, so a geojson
  // clone is more reliable than feature-state here).
  const tryHighlight = useCallback((idx: number) => {
    const map = mapRef.current
    // No isStyleLoaded() gate: the ambient drift keeps tiles loading, so the
    // style rarely reports "loaded" — the try/catch guards pre-load calls.
    if (!map) return
    try {
      const src = map.getSource('ht-active-building') as maplibregl.GeoJSONSource | undefined
      if (!src) return
      if (idx < 0) {
        src.setData({ type: 'FeatureCollection', features: [] })
        pendingHighlightRef.current = -1
        return
      }
      const stop = TOUR_STOPS[idx]

      // Documented 1930 footprint (traced from the 1928 aerial survey, or
      // the surviving building's cadastral outline) — no querying needed.
      const fp = FOOTPRINTS_1930[stop.id]
      if (fp) {
        src.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [fp.ring] },
              properties: {
                // Floor at 24 m so the marker volume stands proud of the
                // uniform roofline (the footprint is the documented part;
                // the height is the marker convention).
                render_height: Math.max(fp.height, 24),
                render_min_height: 0,
              },
            },
          ],
        })
        pendingHighlightRef.current = -1
        return
      }

      // Fallback for stops without a documented footprint: pick the modern
      // footprint under the address. Mid-flight the camera is still zoomed
      // out and the query box covers whole blocks — wait until the camera
      // has nearly arrived.
      if (map.getZoom() < stop.cam.zoom - 0.6) {
        pendingHighlightRef.current = idx
        return
      }
      const p = map.project([stop.lng, stop.lat])
      const features = map.queryRenderedFeatures(
        [
          [p.x - 32, p.y - 32],
          [p.x + 32, p.y + 32],
        ],
        { layers: ['ht-3d-buildings'] }
      )
      const pt: [number, number] = [stop.lng, stop.lat]
      let footprint: GeoJSON.Polygon | null = null
      let sourceFeature: (typeof features)[number] | null = null
      for (const f of features) {
        footprint = pickFootprint(f.geometry, pt)
        if (footprint) {
          sourceFeature = f
          break
        }
      }
      if (footprint && sourceFeature) {
        src.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: footprint,
              properties: {
                // Floor at 24 m so the marked building stands a storey proud
                // of the uniform ~22 m roofline — low courtyard wings would
                // otherwise vanish behind their Traufhöhe neighbors.
                render_height: Math.max(
                  height1930((sourceFeature.properties?.render_height as number) ?? TRAUF_DEFAULT),
                  24
                ),
                render_min_height: (sourceFeature.properties?.render_min_height as number) ?? 0,
              },
            },
          ],
        })
        pendingHighlightRef.current = -1
      } else {
        // Buildings may not be rendered yet at this camera — retry on idle.
        src.setData({ type: 'FeatureCollection', features: [] })
        pendingHighlightRef.current = idx
      }
    } catch {
      pendingHighlightRef.current = -1
    }
  }, [])

  // Main camera loop: scroll-scrubbed keyframe interpolation + gentle drift.
  useEffect(() => {
    reduceMotionRef.current =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    let map: maplibregl.Map | null = null
    const markers: maplibregl.Marker[] = []

    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current as HTMLDivElement,
        style: buildTourStyle(),
        center: [INTRO_CAM.lng, INTRO_CAM.lat],
        zoom: INTRO_CAM.zoom,
        pitch: INTRO_CAM.pitch,
        bearing: INTRO_CAM.bearing,
        maxPitch: 70,
        interactive: false,
        attributionControl: { compact: true },
        canvasContextAttributes: { antialias: true },
      })
    } catch {
      setMapFailed(true)
      return
    }
    mapRef.current = map
    if (process.env.NODE_ENV === 'development') {
      ;(window as unknown as Record<string, unknown>).__htMap = map
    }

    map.on('error', (e) => {
      // Tile/source hiccups are non-fatal; never leave the veil up. The
      // narrative remains fully readable over the paper background.
      if (process.env.NODE_ENV === 'development') {
        console.warn('History tour map error:', e?.error?.message)
      }
    })

    map.on('load', () => {
      if (!map) return
      try {
        map.setTerrain({ source: 'dem', exaggeration: 1.8 })
      } catch {
        // Terrain is an enhancement; the imagery stage still works flat.
      }

      // Numbered plan markers, one per stop. MapLibre writes inline opacity
      // on the marker root for terrain occlusion, so give it a plain wrapper
      // and keep our transitions on the chip inside (same trick as the K2
      // engine).
      TOUR_STOPS.forEach((stop, i) => {
        const chip = document.createElement('div')
        chip.className = 'ht-marker'
        chip.textContent = String(i + 1)
        chip.setAttribute('role', 'button')
        chip.setAttribute('aria-label', `Go to stop ${i + 1}: ${stop.title}`)
        chip.addEventListener('click', () => scrollToStop(i))
        const wrap = document.createElement('div')
        wrap.appendChild(chip)
        markerElsRef.current[i] = chip
        markers.push(
          new maplibregl.Marker({ element: wrap, anchor: 'center' })
            .setLngLat([stop.lng, stop.lat])
            .addTo(map as maplibregl.Map)
        )
      })

      setMapReady(true)
      measure()
    })

    map.on('zoom', () => {
      const root = rootRef.current
      if (!root || !map) return
      root.classList.toggle('ht-far', map.getZoom() < 13.2)
    })

    map.on('idle', () => {
      if (pendingHighlightRef.current >= 0) {
        tryHighlight(pendingHighlightRef.current)
      }
    })

    updatePadding()
    measure()

    let frame = 0
    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick)
      frame++
      const m = mapRef.current
      const keys = keysRef.current
      if (!m || keys.length < 2 || document.hidden) return

      // Retry any pending building highlight even when the camera is at
      // rest — the map may only finish loading the destination's building
      // tiles after arrival, and under reduced motion neither drift nor
      // scrolling would bring the loop past the early return below.
      // Time-based cadence: frame counts are hardware-dependent.
      if (
        pendingHighlightRef.current >= 0 &&
        pendingHighlightRef.current === activeIdxRef.current &&
        now - lastHighlightTryRef.current > 600
      ) {
        lastHighlightTryRef.current = now
        tryHighlight(pendingHighlightRef.current)
      }

      const scrollTop = window.scrollY
      const drifting = !reduceMotionRef.current
      const scrolled = scrollTop !== lastScrollRef.current
      // When idle, refresh at half rate purely for the ambient drift.
      if (!scrolled && (!drifting || frame % 2 !== 0)) return
      lastScrollRef.current = scrollTop

      const yr = scrollTop + window.innerHeight * 0.45
      let a = keys[0]
      let b = keys[0]
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].y <= yr) {
          a = keys[i]
          b = keys[i + 1] || keys[i]
        }
      }
      const t = a === b ? 0 : easeInOut(Math.min(1, Math.max(0, (yr - a.y) / (b.y - a.y))))

      const driftBearing = drifting ? Math.sin(now / 9000) * 1.4 : 0
      const driftPitch = drifting ? Math.sin(now / 13000) * 0.7 : 0

      try {
        m.jumpTo({
          center: [lerp(a.lng, b.lng, t), lerp(a.lat, b.lat, t)],
          zoom: lerp(a.zoom, b.zoom, t),
          pitch: Math.max(0, lerp(a.pitch, b.pitch, t) + driftPitch),
          bearing: lerpAngle(a.bearing, b.bearing, t) + driftBearing,
          padding: paddingRef.current,
        })
      } catch {
        return
      }

      // HUD updates outside React state (runs every frame).
      const year = lerp(a.year, b.year, t)
      if (yearElRef.current) yearElRef.current.textContent = formatMonthYear(year)
      if (needleElRef.current) needleElRef.current.style.left = `${axisPercent(year)}%`
      if (compassElRef.current) {
        compassElRef.current.style.transform = `rotate(${-m.getBearing()}deg)`
      }

      const nextIdx = (t > 0.5 ? b.stopIdx : a.stopIdx) ?? -1
      if (nextIdx !== activeIdxRef.current) {
        activeIdxRef.current = nextIdx
        setActiveIdx(nextIdx)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        updatePadding()
        measure()
      }, 200)
    }
    window.addEventListener('resize', onResize)

    // Re-measure when content height changes (e.g. images finish loading).
    const scroller = rootRef.current?.querySelector('.ht-scroll')
    const ro = scroller ? new ResizeObserver(() => measure()) : null
    if (scroller && ro) ro.observe(scroller)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      if (resizeTimer) clearTimeout(resizeTimer)
      ro?.disconnect()
      markers.forEach((mk) => mk.remove())
      map?.remove()
      mapRef.current = null
    }
  }, [measure, scrollToStop, tryHighlight, updatePadding])

  // React to the active stop changing: marker state + building highlight.
  useEffect(() => {
    markerElsRef.current.forEach((el, i) => {
      if (el) el.classList.toggle('is-active', i === activeIdx)
    })
    const map = mapRef.current
    if (map && mapReady) {
      try {
        if (map.getLayer('ht-site-active')) {
          map.setFilter('ht-site-active', ['==', ['get', 'idx'], activeIdx])
        }
      } catch {
        // Decorative ring only.
      }
      tryHighlight(activeIdx)
    }
    if (districtElRef.current) {
      districtElRef.current.textContent =
        activeIdx >= 0 ? TOUR_STOPS[activeIdx].district : 'Berlin — Übersicht'
    }
  }, [activeIdx, mapReady, tryHighlight])

  // Card reveal on intersection.
  useEffect(() => {
    const cards = rootRef.current?.querySelectorAll('[data-ht-card]')
    if (!cards || cards.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('is-on')
        })
      },
      { threshold: 0.2 }
    )
    cards.forEach((c) => io.observe(c))
    return () => io.disconnect()
  }, [])

  return (
    <div ref={rootRef} className="htour">
      {!mapFailed && (
        <div className="ht-stage" aria-hidden="true">
          <div ref={mapContainerRef} className="ht-map" />
          <div className="ht-vignette" />
          <div className="ht-paper-overlay" />
          <div className="ht-grain" />
          <div className={`ht-veil${mapReady ? ' is-hidden' : ''}`}>
            <span>Preparing the relief …</span>
          </div>
        </div>
      )}

      {/* HUD */}
      <div className="ht-hud ht-hud--brand">
        <div className="ht-brand-kicker">StoryMaps Berlin</div>
        <div className="ht-brand-title">A City Plan of Vanished Businesses</div>
        <Link href="/" className="ht-back-link">
          ← Back to the map
        </Link>
      </div>
      <div className="ht-hud ht-hud--year">
        <div ref={yearElRef} className="ht-year">
          {formatMonthYear(AXIS_START)}
        </div>
        <div ref={districtElRef} className="ht-district">
          Berlin — Übersicht
        </div>
        <div className="ht-compass">
          <span ref={compassElRef} className="ht-compass-needle">
            <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
              <polygon points="7,0.5 9.2,7 7,13.5 4.8,7" fill="currentColor" />
              <circle cx="7" cy="7" r="1.1" fill="currentColor" />
            </svg>
          </span>
          N
        </div>
      </div>

      {/* Stop index rail */}
      {!mapFailed && (
        <nav className="ht-rail" aria-label="Tour stops">
          {TOUR_STOPS.map((stop, i) => (
            <button
              key={stop.id}
              className={i === activeIdx ? 'is-active' : ''}
              onClick={() => scrollToStop(i)}
              aria-label={`Stop ${i + 1}: ${stop.title}`}
            >
              {String(i + 1).padStart(2, '0')}
            </button>
          ))}
        </nav>
      )}

      {/* Time axis — x = years */}
      <div className="ht-axis" aria-hidden="true">
        <div className="ht-axis-track">
          {axisTicks.map((tk) => (
            <div
              key={tk.year}
              className={`ht-axis-tick${tk.major ? ' is-major' : ''}${
                tk.year === AXIS_START ? ' is-first' : ''
              }${tk.year === AXIS_END ? ' is-last' : ''}`}
              style={{ left: `${axisPercent(tk.year)}%` }}
            >
              {tk.major && <span className="ht-axis-tick-label">{tk.year}</span>}
            </div>
          ))}
          {ERA_EVENTS.map((ev) => (
            <div
              key={ev.date}
              className="ht-axis-event"
              style={{ left: `${axisPercent(toDecimalYear(ev.date))}%` }}
              title={`${formatDateLabel(ev.date)} — ${ev.label}`}
            />
          ))}
          {TOUR_STOPS.map((stop, i) => (
            <div
              key={stop.id}
              className={`ht-axis-stop${i === activeIdx ? ' is-active' : ''}`}
              style={{ left: `${axisPercent(stopYears[i])}%` }}
              title={`${stop.title} — ${formatDateLabel(stop.endDate)}`}
              onClick={() => scrollToStop(i)}
            />
          ))}
          <div ref={needleElRef} className="ht-axis-needle" style={{ left: '0%' }} />
        </div>
      </div>

      {/* Scroll narrative */}
      {!mapFailed ? (
        <div className="ht-scroll">
          <section
            ref={(el) => {
              introRef.current = el
            }}
            className="ht-intro"
          >
            <div className="ht-intro-inner">
              <div className="ht-kicker">Berlin · 1925 — 1945</div>
              <h1>Fifteen Addresses</h1>
              <p>
                Between the wars, Jewish-owned businesses were part of the fabric of every Berlin
                street — tailors and booksellers, physicians and photographers, department stores
                and courtyard factories. This tour follows the fifteen businesses of the story
                archive through the city they belonged to, and through the years in which each of
                them was boycotted, expropriated, or destroyed.
              </p>
              <p>
                As you scroll, the timeline below advances through the years, and the camera moves
                from address to address across a sepia relief of the city.
              </p>
              <p className="ht-intro-note">
                The relief is built from present-day satellite imagery, elevation data, and
                OpenStreetMap building volumes, rendered in the manner of an aged aerial survey.
                Building heights are normalized to the uniform ~22&nbsp;m eaves line
                (Traufh&ouml;he) that governed the 1930 skyline: the surviving Gr&uuml;nderzeit
                fabric keeps its true height, taller pre-war landmarks are shown compressed, and
                towers built after the war are omitted. At each of the fifteen addresses, the marked
                building is the documented 1930 footprint &mdash; the surviving building&apos;s
                outline where it still stands, or the parcel traced from the 1928 aerial survey of
                Berlin where the war and rebuilding erased it. Stories are drawn from the StoryMaps
                archive and shown at the street addresses recorded there.
              </p>
              <div className="ht-scroll-cue">Scroll to begin</div>
            </div>
          </section>

          {TOUR_STOPS.map((stop, i) => (
            <section
              key={stop.id}
              ref={(el) => {
                stopSectionRefs.current[i] = el
              }}
              className="ht-stop"
              id={`tour-stop-${stop.id}`}
            >
              <div className="ht-card-holder">
                <StopCard stop={stop} index={i} total={TOUR_STOPS.length} />
              </div>
            </section>
          ))}

          <section
            ref={(el) => {
              outroRef.current = el
            }}
            className="ht-outro"
          >
            <div className="ht-outro-inner">
              <div className="ht-kicker">1945</div>
              <h2>What remained</h2>
              <p>
                By 1939, almost none of the roughly 50,000 Jewish-owned businesses that had existed
                in Germany in 1933 were still in their owners&apos; hands. The fifteen addresses on
                this tour stand for thousands more across Berlin — documented in the city&apos;s
                trade registers, address books, and restitution files.
              </p>
              <p>
                The buildings changed hands; the streets kept their names or lost them; the people
                behind these shopfronts were driven into exile or murdered. Mapping their addresses
                is a small act of return.
              </p>
              <div className="ht-outro-links">
                <Link href="/">Explore the full map</Link>
                <Link href="/barcharts" className="ht-link-secondary">
                  View the data
                </Link>
              </div>
              <p className="ht-colophon">
                Sources: StoryMaps Berlin story archive; Humboldt-Universität zu Berlin, database of
                Jewish businesses in Berlin 1930–1945. Relief: imagery © Esri, Maxar, Earthstar
                Geographics; terrain Mapzen/AWS Open Data; buildings © OpenStreetMap contributors
                via OpenFreeMap — rendered as an aged aerial survey.
              </p>
            </div>
          </section>
        </div>
      ) : (
        <div className="ht-fallback">
          <div className="ht-kicker">Berlin · 1925 — 1945</div>
          <h1
            style={{
              fontFamily: 'var(--ht-font-display)',
              fontWeight: 900,
              fontSize: '2.4rem',
              marginBottom: '1.2rem',
            }}
          >
            Fifteen Addresses
          </h1>
          <p style={{ marginBottom: '2rem', color: 'var(--ht-ink-soft)' }}>
            The three-dimensional relief could not be initialized in this browser. The tour stops
            are listed below.
          </p>
          {TOUR_STOPS.map((stop, i) => (
            <StopCard key={stop.id} stop={stop} index={i} total={TOUR_STOPS.length} />
          ))}
        </div>
      )}
    </div>
  )
}

export default React.memo(HistoryTour)
