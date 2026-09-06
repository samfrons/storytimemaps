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
import {
  STATUS_LABEL,
  extractSiteToday,
  initialTodayMode,
  streetViewEmbedUrl,
  streetViewLink,
  todayStatus,
} from './today'

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
  // The commercial ground floor sat darker than the plaster above it — painted
  // stucco, stone facing or timber shopfronts, and grimier for being at street
  // level.
  shopfront: '#8a7c62',
  // Berlin roofscape: red clay tile on the tenement stock, grey slate or zinc
  // on the monumental scale.
  roofTile: '#8d5a43',
  roofSlate: '#6d6a63',
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

// --- The three horizontal bands of a Berlin street wall ---------------------
//
// OpenStreetMap gives us a footprint and one height, so a facade can only be
// modelled as bands of the extrusion — but bands are exactly how the 1930
// Mietskaserne street wall was actually composed, so the little we can express
// is the part that carries the period:
//
//   Ladenzone   the commercial ground floor, ~4 m, in darker painted stucco or
//               stone. These are the shopfronts this whole archive is about.
//   Facade      four residential storeys of plaster to the 22 m Traufhöhe.
//   Roof course a steep tiled or mansard roof — the single most recognisable
//               feature of the Berlin roofscape, and the thing whose absence
//               made the old flat-topped blocks read as post-war slabs.
//
// A window texture was tried first and abandoned: MapLibre's
// `fill-extrusion-pattern` tiles the image down the wall in tile units, so at
// this camera distance (a storey is a handful of pixels) every variant
// averaged into flat mush while costing a sprite atlas per frame. Flat bands
// read correctly at exactly the distance the tour is flown at.
//
// Fractions, not just absolute metres, so a 3 m garage still gets proportional
// bands instead of being entirely roof. The fractions also guarantee the
// ordering base < shopTop < facadeTop < height for every input.
const SHOPFRONT_TOP = ['min', 4.2, ['*', HEIGHT_1930_EXPR, 0.34]]
const ROOF_DEPTH = ['min', 3.2, ['*', HEIGHT_1930_EXPR, 0.28]]
const FACADE_TOP = ['-', HEIGHT_1930_EXPR, ROOF_DEPTH]
const MIN_HEIGHT = ['coalesce', ['get', 'render_min_height'], 0]

// Shared by all three bands so they always extrude the same set of features.
const BUILDING_FILTER = [
  'all',
  ['!=', ['get', 'hide_3d'], true],
  ['<=', ['coalesce', ['get', 'render_height'], TRAUF_DEFAULT], MODERN_CUTOFF],
]

// The Ladenzone band additionally skips features that already start above
// ground. Named so the "Heute" toggle can restore it without retyping it.
const SHOPFRONT_FILTER = ['all', ...BUILDING_FILTER.slice(1), ['==', MIN_HEIGHT, 0]]

// --- "Heute" (today) mode --------------------------------------------------
//
// The tour's default rendering compresses building heights to the 1930
// Traufhöhe and hides anything built after the war (BUILDING_FILTER,
// MODERN_CUTOFF). "Heute" temporarily undoes both — real heights, post-war
// towers included, unfiltered — plus removes the aging colour grade, so the
// same relief reads as the city today. Values below are named once and
// reused by the toggle effect so the "1930" state it restores can never
// drift from the values buildTourStyle() actually shipped.
const RAW_HEIGHT_EXPR = ['coalesce', ['get', 'render_height'], TRAUF_DEFAULT]
const TODAY_BUILDING_FILTER = ['!=', ['get', 'hide_3d'], true]
const SAT_PAINT_1930 = {
  'raster-saturation': -0.62,
  'raster-contrast': -0.04,
  'raster-brightness-min': 0.14,
} as const
const SAT_PAINT_TODAY = {
  'raster-saturation': 0,
  'raster-contrast': 0,
  'raster-brightness-min': 0,
} as const

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
      // Two DEM sources off one tile URL, deliberately. MapLibre warns when a
      // hillshade layer and setTerrain() share a source — terrain re-tiles the
      // cache for its own overscaling and the shading degrades. The second
      // fetch costs nothing on the wire (same URL, same HTTP cache), only a
      // second in-memory tile cache.
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
    // Directional light, anchored to the map rather than the viewport, so the
    // sun stays in one place while the camera orbits — the block model then
    // shades consistently with the terrain hillshade instead of swimming as
    // the bearing changes. Azimuth matches the hillshade's default 335°
    // illumination; the low polar angle is what gives the extrusions readable
    // lit/shadowed faces instead of a uniform beige mass.
    light: {
      anchor: 'map',
      color: '#fff3d8',
      intensity: 0.55,
      position: [1.5, 335, 42],
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
          // Desaturation moved here from the canvas CSS filter — same look on
          // the imagery, but it no longer costs a full-canvas repaint per
          // frame and no longer drains the contrast out of the extrusions.
          // brightness-min lifts the blacks so the ground stays a mid-tone
          // archival plate instead of dropping out under the lit model.
          ...SAT_PAINT_1930,
          'raster-brightness-max': 1,
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
        // Band 1 — the Ladenzone. Skipped for features that already start
        // above ground (upper-storey parts carry render_min_height), where a
        // ground-floor band would be meaningless.
        id: 'ht-shopfronts',
        type: 'fill-extrusion',
        source: 'ofm',
        'source-layer': 'building',
        minzoom: 15,
        filter: SHOPFRONT_FILTER as never,
        paint: {
          'fill-extrusion-color': MAP_COLORS.shopfront,
          'fill-extrusion-base': 0,
          'fill-extrusion-height': SHOPFRONT_TOP as never,
          'fill-extrusion-opacity': 1,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      {
        // Band 2 — the plaster storeys.
        id: 'ht-3d-buildings',
        type: 'fill-extrusion',
        source: 'ofm',
        'source-layer': 'building',
        minzoom: 14,
        filter: BUILDING_FILTER as never,
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
          'fill-extrusion-height': FACADE_TOP as never,
          'fill-extrusion-base': ['max', SHOPFRONT_TOP, MIN_HEIGHT] as never,
          // Near-opaque on purpose: at 0.82 the satellite imagery read straight
          // through the volumes and the whole model looked like vapour over a
          // photo. Solid blocks are what make the relief legible.
          'fill-extrusion-opacity': 1,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      {
        // Band 3 — the roof course. Red clay Biberschwanz over the tenement
        // stock, grey slate and zinc over the monumental scale.
        id: 'ht-roofs',
        type: 'fill-extrusion',
        source: 'ofm',
        'source-layer': 'building',
        minzoom: 14,
        filter: BUILDING_FILTER as never,
        paint: {
          'fill-extrusion-color': [
            'step',
            ['coalesce', ['get', 'render_height'], TRAUF_DEFAULT],
            MAP_COLORS.roofTile,
            30,
            MAP_COLORS.roofSlate,
          ],
          'fill-extrusion-height': HEIGHT_1930_EXPR as never,
          'fill-extrusion-base': ['max', FACADE_TOP, MIN_HEIGHT] as never,
          'fill-extrusion-opacity': 1,
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

// Last-resort marker volume for an address whose building cannot be resolved
// — either no 1930 footprint was traced for it (stops 5 and 6) or the modern
// parcel query came back empty. A stop with no marked volume at all leaves the
// reader looking at an anonymous block, which is the one thing this stage
// exists to prevent; a plain square on the address is honest about being a
// marker rather than a traced outline.
// Retries are ~600 ms apart. Generous on purpose: a real traced footprint is
// always better than the synthetic marker below, and on a throttled phone the
// building tiles can take several seconds to become queryable after arrival.
const HIGHLIGHT_RETRIES = 14

function syntheticFootprint(lng: number, lat: number, metres = 17): GeoJSON.Polygon {
  const dLat = metres / 111_320
  const dLng = metres / (111_320 * Math.cos((lat * Math.PI) / 180))
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lng - dLng, lat - dLat],
        [lng + dLng, lat - dLat],
        [lng + dLng, lat + dLat],
        [lng - dLng, lat + dLat],
        [lng - dLng, lat - dLat],
      ],
    ],
  }
}

// Called only from inside the map effect, so `window` is always present.
const isCoarsePointer = () =>
  window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth <= 768

// Terrain is the single most expensive thing on this stage — measured at
// roughly half the per-frame budget. Berlin is flat, so at street zoom the
// relief it buys is invisible; it only earns its cost on the wide intro and
// outro shots. Toggle it across this band, with hysteresis so a camera
// hovering at the threshold can't thrash setTerrain() every frame.
const TERRAIN_ON_BELOW = 13.6
const TERRAIN_OFF_ABOVE = 14.4

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

// --- "Heute" site-today text, fetched lazily -------------------------------
//
// Only the timeline JSON (not tourData.ts) carries the "the site today"
// paragraph, so the card fetches it on demand rather than loading all 16
// files up front. Resolved text (or null, meaning the record has no such
// section) is cached at module scope so the fetch never repeats for a stop
// once resolved, across every StopCard instance and every mount.
interface TimelineFile {
  timeline?: { longDescription?: string }[]
}

const siteTodayCache = new Map<string, string | null>()

/**
 * Warm the per-stop assets as soon as the page mounts, in parallel, so they are
 * in the browser cache before the map has finished loading tiles. The card
 * photos use next/image's optimizer, so we request the same URL it will ask
 * for (largest configured width for the card's sizes attribute).
 */
function warmTourAssets(): void {
  if (typeof window === 'undefined') return
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (conn?.saveData) return
  // Same width ladder next/image builds from next.config deviceSizes for the
  // card's sizes attribute; the browser picks one entry, so this warms exactly
  // the variant the card will render and nothing else.
  const widths = [640, 750, 828, 1080, 1200, 1920]
  for (const stop of TOUR_STOPS) {
    const src = stop.images[0]
    if (src) {
      const enc = encodeURIComponent(src)
      const img = new window.Image()
      img.decoding = 'async'
      img.sizes = '(max-width: 768px) 92vw, 430px'
      img.srcset = widths.map((w) => `/_next/image?url=${enc}&w=${w}&q=75 ${w}w`).join(', ')
      img.src = `/_next/image?url=${enc}&w=828&q=75`
    }
    void loadSiteToday(stop.id)
  }
}
const siteTodayRequests = new Map<string, Promise<string | null>>()

function loadSiteToday(id: string): Promise<string | null> {
  const cached = siteTodayCache.get(id)
  if (cached !== undefined) return Promise.resolve(cached)
  const pending = siteTodayRequests.get(id)
  if (pending) return pending

  const request = fetch(`/data/timeline/${id}.json`)
    .then((res) => (res.ok ? (res.json() as Promise<TimelineFile>) : null))
    .then((data) => {
      const last = data?.timeline?.[data.timeline.length - 1]
      const text = last?.longDescription ? extractSiteToday(last.longDescription) : null
      siteTodayCache.set(id, text)
      return text
    })
    .catch(() => {
      siteTodayCache.set(id, null)
      return null
    })
    .finally(() => {
      siteTodayRequests.delete(id)
    })

  siteTodayRequests.set(id, request)
  return request
}

interface StopCardProps {
  /** Street View iframes mount only once the map has settled. */
  embedsAllowed: boolean
  /**
   * "Heute" swaps the card's lead: the present-day block (status and Street
   * View of what stands at the address now) takes the figure slot at the
   * top, and the archival photograph moves down to where that block sat.
   */
  todayMode: boolean
  stop: TourStop
  index: number
  total: number
}

const StopCardComponent: React.FC<StopCardProps> = ({
  stop,
  index,
  total,
  embedsAllowed,
  todayMode,
}) => {
  const [expanded, setExpanded] = useState(false)
  const [siteToday, setSiteToday] = useState<string | null>(null)
  const articleRef = useRef<HTMLElement | null>(null)
  const siteTodayFetchedRef = useRef(false)

  // The catalogue text arrives as a single string with blank-line paragraph
  // breaks; the first line is its own heading.
  const paragraphs = useMemo(
    () =>
      stop.longStory
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean),
    [stop.longStory]
  )

  const fetchSiteToday = useCallback(() => {
    if (siteTodayFetchedRef.current) return
    siteTodayFetchedRef.current = true
    loadSiteToday(stop.id).then(setSiteToday)
  }, [stop.id])

  const toggle = useCallback(() => {
    setExpanded((v) => !v)
    fetchSiteToday()
  }, [fetchSiteToday])

  // "Becomes active": the card scrolling into view. Covers both the
  // scroll-driven tour (one card in view at a time) and the no-WebGL
  // fallback (a plain scrolling list) without needing the active-stop index
  // threaded down as a prop.
  useEffect(() => {
    const el = articleRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) fetchSiteToday()
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [fetchSiteToday])

  const todayStatusValue = todayStatus(stop.id)
  const todayStatusColor =
    todayStatusValue === 'standing'
      ? 'var(--success)'
      : todayStatusValue === 'replacement'
        ? 'var(--warning)'
        : 'var(--danger)'
  const streetViewEmbed = streetViewEmbedUrl(
    stop.lat,
    stop.lng,
    stop.cam.bearing,
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY
  )

  // The card has two picture slots — the lead figure under the address and
  // the block above the fate line. "1930" leads with the archival photograph
  // and keeps the present day below; "Heute" swaps them so what stands at
  // the address now (status + Street View) is the first thing on the card,
  // rather than the bottom of a scrolling one.
  const archivalFigure = stop.images[0] ? (
    <figure className={`ht-card-figure${todayMode ? ' is-then' : ''}`}>
      {todayMode && <h3 className="ht-card-figure-label">1930</h3>}
      <Image
        src={stop.images[0]}
        alt={`Archival image — ${stop.title}`}
        width={860}
        height={560}
        sizes="(max-width: 768px) 92vw, 430px"
        style={{ width: '100%', height: 'auto' }}
        // Eager on purpose: next/image defaults to lazy, which meant each
        // photo only started downloading when its card scrolled into view,
        // right when the map is busiest. All fifteen are ~100 KB WebPs.
        loading="eager"
        priority={index === 0}
      />
      <figcaption>{stop.imageCredit}</figcaption>
    </figure>
  ) : null

  const todayBlock = (
    <div className={`ht-card-today${todayMode ? ' is-lead' : ''}`}>
      <h3>{todayMode ? 'What stands here today' : 'Today'}</h3>
      <div className="ht-today-status">
        <span
          className="ht-today-swatch"
          style={{ backgroundColor: todayStatusColor }}
          aria-hidden="true"
        />
        <span>{STATUS_LABEL[todayStatusValue].en}</span>
      </div>
      {streetViewEmbed && embedsAllowed ? (
        <div className="ht-today-streetview">
          <iframe
            src={streetViewEmbed}
            title={`Street View — ${stop.title}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : (
        <a
          className="ht-today-streetview-link"
          href={streetViewLink(stop.lat, stop.lng)}
          target="_blank"
          rel="noopener"
        >
          Open in Street View
          <span aria-hidden="true"> ↗</span>
        </a>
      )}
      {siteToday && <p className="ht-today-text">{siteToday}</p>}
    </div>
  )

  return (
    <article ref={articleRef} className={`ht-card${expanded ? ' is-expanded' : ''}`} data-ht-card>
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
      {todayMode ? todayBlock : archivalFigure}
      <p className="ht-card-story">{stop.story}</p>

      <button
        type="button"
        className="ht-card-expand"
        onClick={toggle}
        aria-expanded={expanded}
        aria-controls={`ht-long-${stop.id}`}
      >
        {expanded ? 'Close the full account' : 'Read the full account'}
      </button>

      <div
        id={`ht-long-${stop.id}`}
        className={`ht-card-long${expanded ? ' is-open' : ''}`}
        hidden={!expanded}
      >
        {paragraphs.map((p, i) =>
          i === 0 ? (
            <h3 key={i} className="ht-card-long-title">
              {p}
            </h3>
          ) : (
            <p key={i}>{p}</p>
          )
        )}
        {stop.images.length > 1 && (
          <div className="ht-card-gallery">
            {stop.images.slice(1).map((src) => (
              <Image
                key={src}
                src={src}
                alt={`Archival image — ${stop.title}`}
                width={430}
                height={280}
                sizes="(max-width: 768px) 46vw, 210px"
                style={{ width: '100%', height: 'auto' }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="ht-card-building">
        <h3>The building &amp; the street</h3>
        <p>{stop.building}</p>
      </div>

      {todayMode ? archivalFigure : todayBlock}

      <span className={`ht-card-fate${stop.fateKind === 'destroyed' ? ' is-destroyed' : ''}`}>
        {stop.fate}
      </span>
    </article>
  )
}

const StopCard = React.memo(StopCardComponent)

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
  const highlightTriesRef = useRef<number>(0)
  const activeIdxRef = useRef<number>(-1)
  const reduceMotionRef = useRef<boolean>(false)
  const terrainOnRef = useRef<boolean>(true)
  const farRef = useRef<boolean | null>(null)

  const yearElRef = useRef<HTMLDivElement | null>(null)
  const districtElRef = useRef<HTMLDivElement | null>(null)
  const needleElRef = useRef<HTMLDivElement | null>(null)
  const axisTrackRef = useRef<HTMLDivElement | null>(null)
  const axisWidthRef = useRef<number>(0)
  const compassElRef = useRef<HTMLSpanElement | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [mapFailed, setMapFailed] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [todayMode, setTodayMode] = useState(false)
  // Street View iframes are heavy (each loads Google's full viewer); hold them
  // until the map has rendered so they don't compete for bandwidth with tiles.
  const [embedsAllowed, setEmbedsAllowed] = useState(false)

  useEffect(() => {
    warmTourAssets()
  }, [])

  useEffect(() => {
    if (!mapReady && !mapFailed) return
    const t = window.setTimeout(() => setEmbedsAllowed(true), 1500)
    return () => window.clearTimeout(t)
  }, [mapReady, mapFailed])

  const stopYears = useMemo(() => TOUR_STOPS.map((s) => toDecimalYear(s.turningDate)), [])

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
    axisWidthRef.current = axisTrackRef.current?.getBoundingClientRect().width ?? 0
    lastScrollRef.current = -1
  }, [stopYears])

  const updatePadding = useCallback(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    paddingRef.current =
      w > 768
        ? { top: 40, bottom: 120, left: 60, right: Math.min(540, w * 0.44) }
        : // The phone card occupies roughly the lower 55% of the screen, so
          // reserving only 44% left the marked building sitting on the card's
          // top edge. This lifts the subject into the middle of the strip the
          // reader can actually see.
          { top: 50, bottom: h * 0.66, left: 0, right: 0 }
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
      } else if (highlightTriesRef.current < HIGHLIGHT_RETRIES) {
        // Buildings may not be rendered yet at this camera — retry on idle.
        highlightTriesRef.current += 1
        pendingHighlightRef.current = idx
      } else {
        // Out of retries: mark the address itself rather than leaving the
        // reader on an unmarked block.
        src.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: syntheticFootprint(stop.lng, stop.lat),
              properties: { render_height: 24, render_min_height: 0 },
            },
          ],
        })
        pendingHighlightRef.current = -1
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
        // A phone at DPR 3 renders ~3M pixels of terrain + extrusions + raster
        // every frame, which is what put the tour under 20 fps on mobile.
        // Capping the backing store costs almost nothing visually at this
        // scale (the imagery is a soft sepia plate, not fine type).
        pixelRatio: Math.min(window.devicePixelRatio || 1, isCoarsePointer() ? 1.5 : 2),
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
        // Keys are sorted by y, so the first one past the focal line ends it.
        if (keys[i].y > yr) break
        a = keys[i]
        b = keys[i + 1] || keys[i]
      }
      const t = a === b ? 0 : easeInOut(Math.min(1, Math.max(0, (yr - a.y) / (b.y - a.y))))

      const driftBearing = drifting ? Math.sin(now / 9000) * 1.4 : 0
      const driftPitch = drifting ? Math.sin(now / 13000) * 0.7 : 0
      const zoom = lerp(a.zoom, b.zoom, t)

      // Drop terrain once the camera is down among the buildings and bring it
      // back for the wide shots. setTerrain() rebuilds the render pipeline, so
      // it must only ever be called on an actual state change.
      if (terrainOnRef.current && zoom > TERRAIN_OFF_ABOVE) {
        terrainOnRef.current = false
        try {
          m.setTerrain(null)
        } catch {
          // Terrain is an enhancement; the stage still works flat.
        }
      } else if (!terrainOnRef.current && zoom < TERRAIN_ON_BELOW) {
        terrainOnRef.current = true
        try {
          m.setTerrain({ source: 'dem', exaggeration: 1.8 })
        } catch {
          // As above.
        }
      }

      try {
        m.jumpTo({
          center: [lerp(a.lng, b.lng, t), lerp(a.lat, b.lat, t)],
          zoom,
          pitch: Math.max(0, lerp(a.pitch, b.pitch, t) + driftPitch),
          bearing: lerpAngle(a.bearing, b.bearing, t) + driftBearing,
          padding: paddingRef.current,
        })
      } catch {
        return
      }

      // Folded in from a map 'zoom' listener, which fired on every one of
      // these jumpTo calls. Only touch the DOM when the state actually flips.
      const far = zoom < 13.2
      if (far !== farRef.current) {
        farRef.current = far
        rootRef.current?.classList.toggle('ht-far', far)
      }

      // HUD updates outside React state (runs every frame).
      const year = lerp(a.year, b.year, t)
      if (yearElRef.current) yearElRef.current.textContent = formatMonthYear(year)
      // translateX in px, not `left: %` — `left` forced a layout pass on every
      // single frame. The track width is cached by measure() so this stays a
      // pure composited transform.
      if (needleElRef.current) {
        const x = (axisPercent(year) / 100) * axisWidthRef.current
        needleElRef.current.style.transform = `translateX(${x}px) translateX(-50%)`
      }
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

    // Re-measure when content height changes (e.g. images finish loading, or a
    // card is expanded). measure() does ~35 getBoundingClientRect calls, so it
    // must never run synchronously inside the observer callback — expanding a
    // card injects thousands of words and would fire a reflow storm mid-scroll.
    const scroller = rootRef.current?.querySelector('.ht-scroll')
    let measureRaf = 0
    const ro = scroller
      ? new ResizeObserver(() => {
          if (measureRaf) return
          measureRaf = requestAnimationFrame(() => {
            measureRaf = 0
            measure()
          })
        })
      : null
    if (scroller && ro) ro.observe(scroller)

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (measureRaf) cancelAnimationFrame(measureRaf)
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
      // New stop, fresh retry budget before we fall back to a marker volume.
      highlightTriesRef.current = 0
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

  // Restore the reader's "Heute" preference after mount. Read is deferred
  // out of the initial render (rather than a useState initializer) so the
  // server-rendered and first client-rendered markup match — sessionStorage
  // does not exist during SSR.
  // A `?view=heute` in the URL overrides it, so an embed can open straight
  // onto the present-day view (see initialTodayMode).
  useEffect(() => {
    let stored: string | null = null
    try {
      stored = window.sessionStorage.getItem('ht-today')
    } catch {
      // Storage may be unavailable (private browsing, disabled site data);
      // the toggle still works for the session, it just won't persist.
    }
    if (initialTodayMode(window.location.search, stored)) setTodayMode(true)
  }, [])

  useEffect(() => {
    try {
      window.sessionStorage.setItem('ht-today', todayMode ? '1' : '0')
    } catch {
      // Same as above — persistence is a nicety, not a requirement.
    }
  }, [todayMode])

  // "Heute" toggle: swap the 1930-normalized building relief and aged
  // colour grade for true heights, post-war towers, and colour imagery.
  // Every value it sets is restored from the same named constants
  // buildTourStyle() used, so toggling back and forth can never drift from
  // the "1930" state the map actually loaded with.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    try {
      if (todayMode) {
        map.setPaintProperty('sat', 'raster-saturation', SAT_PAINT_TODAY['raster-saturation'])
        map.setPaintProperty('sat', 'raster-contrast', SAT_PAINT_TODAY['raster-contrast'])
        map.setPaintProperty(
          'sat',
          'raster-brightness-min',
          SAT_PAINT_TODAY['raster-brightness-min']
        )
        map.setPaintProperty('ht-3d-buildings', 'fill-extrusion-height', RAW_HEIGHT_EXPR)
        map.setPaintProperty('ht-3d-buildings', 'fill-extrusion-base', MIN_HEIGHT)
        map.setLayoutProperty('ht-shopfronts', 'visibility', 'none')
        map.setLayoutProperty('ht-roofs', 'visibility', 'none')
        map.setFilter('ht-shopfronts', TODAY_BUILDING_FILTER as never)
        map.setFilter('ht-3d-buildings', TODAY_BUILDING_FILTER as never)
        map.setFilter('ht-roofs', TODAY_BUILDING_FILTER as never)
      } else {
        map.setPaintProperty('sat', 'raster-saturation', SAT_PAINT_1930['raster-saturation'])
        map.setPaintProperty('sat', 'raster-contrast', SAT_PAINT_1930['raster-contrast'])
        map.setPaintProperty(
          'sat',
          'raster-brightness-min',
          SAT_PAINT_1930['raster-brightness-min']
        )
        map.setPaintProperty('ht-3d-buildings', 'fill-extrusion-height', FACADE_TOP)
        map.setPaintProperty('ht-3d-buildings', 'fill-extrusion-base', [
          'max',
          SHOPFRONT_TOP,
          MIN_HEIGHT,
        ])
        map.setLayoutProperty('ht-shopfronts', 'visibility', 'visible')
        map.setLayoutProperty('ht-roofs', 'visibility', 'visible')
        map.setFilter('ht-shopfronts', SHOPFRONT_FILTER as never)
        map.setFilter('ht-3d-buildings', BUILDING_FILTER as never)
        map.setFilter('ht-roofs', BUILDING_FILTER as never)
      }
    } catch {
      // The style may still be settling right after 'load'; harmless to
      // skip a frame; the effect re-runs on the next mapReady/todayMode
      // change.
    }
  }, [todayMode, mapReady])

  const toggleTodayMode = useCallback((value: boolean) => setTodayMode(value), [])

  return (
    <div ref={rootRef} className={`htour${todayMode ? ' is-heute' : ''}`}>
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
        <div className="ht-mode-toggle" role="group" aria-label="Time period">
          <button
            type="button"
            className={todayMode ? '' : 'is-active'}
            aria-pressed={!todayMode}
            onClick={() => toggleTodayMode(false)}
          >
            1930
          </button>
          <button
            type="button"
            className={todayMode ? 'is-active' : ''}
            aria-pressed={todayMode}
            onClick={() => toggleTodayMode(true)}
          >
            Heute
          </button>
        </div>
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
        <div className="ht-axis-track" ref={axisTrackRef}>
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
              title={`${stop.title} — ${formatDateLabel(stop.turningDate)}`}
              onClick={() => scrollToStop(i)}
            />
          ))}
          <div ref={needleElRef} className="ht-axis-needle" />
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
                towers built after the war are omitted. At each address the marked building is the
                present-day outline from OpenStreetMap: where the pre-war building still stands it
                is that building, and where it was destroyed the outline is the replacement now on
                the site &mdash; not a 1930 footprint. Two addresses, Pariser Stra&szlig;e 32 and
                Ritter Stra&szlig;e 86, are documented as gone and are marked with no building at
                all. Every story, address and date is taken from the same archive records the map
                listings use.
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
                <StopCard
                  stop={stop}
                  index={i}
                  total={TOUR_STOPS.length}
                  embedsAllowed={embedsAllowed}
                  todayMode={todayMode}
                />
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
                Sources: story texts and dates from the “Final Sale” catalogue via the StoryMaps
                Berlin archive; Humboldt-Universität zu Berlin, database of Jewish businesses in
                Berlin 1930–1945. Addresses geocoded to house-number precision via
                Nominatim/OpenStreetMap. Relief: imagery © Esri, Maxar, Earthstar Geographics;
                terrain Mapzen/AWS Open Data; buildings © OpenStreetMap contributors via OpenFreeMap
                — rendered as an aged aerial survey.
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
            <StopCard
              key={stop.id}
              stop={stop}
              index={i}
              total={TOUR_STOPS.length}
              embedsAllowed={embedsAllowed}
              todayMode={todayMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default React.memo(HistoryTour)
