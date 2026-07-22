'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import mapboxgl from 'mapbox-gl'
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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

// Period city-plan palette for the map itself. Mapbox layers require hex
// values (CSS variables cannot reach into WebGL) — this is the documented
// map-styling exception to the CSS-variable rule.
const MAP_COLORS = {
  paper: '#eadfc6',
  paperDeep: '#ddcfae',
  water: '#a9bfba',
  green: '#d6cfa9',
  roadMinor: '#f2e7cb',
  roadMajor: '#e6d5a8',
  roadCasing: '#b7a075',
  rail: '#a08a63',
  ink: '#2e2418',
  inkSoft: '#5a4a35',
  halo: '#f4ecd9',
  buildingLow: '#ddd0af',
  buildingMid: '#cbbb96',
  buildingHigh: '#b09d78',
  accent: '#8a3b2e',
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

// Recolors the light-v11 style into an aged 1930s city plan.
function applyVintageStyle(map: mapboxgl.Map) {
  const style = map.getStyle()
  if (!style || !style.layers) return

  for (const layer of style.layers) {
    const id = layer.id
    try {
      if (layer.type === 'background') {
        map.setPaintProperty(id, 'background-color', MAP_COLORS.paper)
        continue
      }
      if (id === 'building' || id === 'building-outline' || id === 'building-underground') {
        map.setLayoutProperty(id, 'visibility', 'none')
        continue
      }
      if (layer.type === 'fill') {
        if (/water/.test(id)) {
          map.setPaintProperty(id, 'fill-color', MAP_COLORS.water)
        } else if (/landuse|landcover|park|pitch|national|sand|aeroway/.test(id)) {
          map.setPaintProperty(id, 'fill-color', MAP_COLORS.green)
          map.setPaintProperty(id, 'fill-opacity', 0.5)
        } else {
          map.setPaintProperty(id, 'fill-color', MAP_COLORS.paperDeep)
        }
        continue
      }
      if (layer.type === 'line') {
        if (/waterway/.test(id)) {
          map.setPaintProperty(id, 'line-color', MAP_COLORS.water)
        } else if (/rail|transit/.test(id)) {
          map.setPaintProperty(id, 'line-color', MAP_COLORS.rail)
        } else if (/admin/.test(id)) {
          map.setPaintProperty(id, 'line-color', MAP_COLORS.roadCasing)
          map.setPaintProperty(id, 'line-opacity', 0.5)
        } else if (/case/.test(id)) {
          map.setPaintProperty(id, 'line-color', MAP_COLORS.roadCasing)
        } else if (/motorway|trunk|primary|major/.test(id)) {
          map.setPaintProperty(id, 'line-color', MAP_COLORS.roadMajor)
        } else {
          map.setPaintProperty(id, 'line-color', MAP_COLORS.roadMinor)
        }
        continue
      }
      if (layer.type === 'symbol') {
        if (/poi|transit|airport|golf|ferry|shield|junction|oneway/.test(id)) {
          map.setLayoutProperty(id, 'visibility', 'none')
        } else {
          map.setPaintProperty(id, 'text-color', MAP_COLORS.ink)
          map.setPaintProperty(id, 'text-halo-color', MAP_COLORS.halo)
          map.setPaintProperty(id, 'text-halo-width', 1.1)
        }
        continue
      }
    } catch {
      // Individual layers may not support a property — never fatal.
    }
  }

  // Sepia atmospheric haze toward the horizon.
  try {
    map.setFog({
      color: '#e8dab4',
      'high-color': '#d9c493',
      'horizon-blend': 0.08,
      'space-color': '#cdbb92',
      'star-intensity': 0,
    })
  } catch {
    // Fog is unsupported on some styles/devices; the tour works without it.
  }
}

// Adds the extruded building mass in aged-plaster tones, plus the site rings.
function addTourLayers(map: mapboxgl.Map, activeStopIdx: number) {
  const style = map.getStyle()
  const firstSymbolId = style?.layers?.find((l) => l.type === 'symbol')?.id

  try {
    if (!map.getLayer('ht-3d-buildings')) {
      map.addLayer(
        {
          id: 'ht-3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 13.5,
          paint: {
            'fill-extrusion-color': [
              'case',
              ['boolean', ['feature-state', 'active'], false],
              MAP_COLORS.accent,
              [
                'interpolate',
                ['linear'],
                ['get', 'height'],
                0,
                MAP_COLORS.buildingLow,
                18,
                MAP_COLORS.buildingMid,
                45,
                MAP_COLORS.buildingHigh,
              ],
            ],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              13.5,
              0,
              15.2,
              ['get', 'height'],
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              13.5,
              0,
              15.2,
              ['get', 'min_height'],
            ],
            'fill-extrusion-opacity': 0.92,
            'fill-extrusion-vertical-gradient': true,
          },
        },
        firstSymbolId
      )
    }
  } catch {
    // Building extrusions unavailable (e.g. missing composite source).
  }

  try {
    if (!map.getSource('ht-sites')) {
      map.addSource('ht-sites', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: TOUR_STOPS.map((s, idx) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
            properties: { idx },
          })),
        },
      })
      map.addLayer({
        id: 'ht-site-rings',
        type: 'circle',
        source: 'ht-sites',
        paint: {
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-color': MAP_COLORS.inkSoft,
          'circle-stroke-width': 1,
          'circle-opacity': 0,
          'circle-stroke-opacity': 0.55,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 3, 17, 14],
        },
      })
      map.addLayer({
        id: 'ht-site-active',
        type: 'circle',
        source: 'ht-sites',
        filter: ['==', ['get', 'idx'], activeStopIdx],
        paint: {
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-color': MAP_COLORS.accent,
          'circle-stroke-width': 2.5,
          'circle-opacity': 0,
          'circle-stroke-opacity': 0.9,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 6, 17, 30],
        },
      })
    }
  } catch {
    // Ring layers are decorative only.
  }
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
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const introRef = useRef<HTMLElement | null>(null)
  const outroRef = useRef<HTMLElement | null>(null)
  const stopSectionRefs = useRef<(HTMLElement | null)[]>([])
  const markerElsRef = useRef<(HTMLDivElement | null)[]>([])
  const keysRef = useRef<CamKey[]>([])
  const rafRef = useRef<number>(0)
  const lastScrollRef = useRef<number>(-1)
  const paddingRef = useRef<mapboxgl.PaddingOptions>({ top: 0, bottom: 0, left: 0, right: 0 })
  const highlightedRef = useRef<{ id: string | number } | null>(null)
  const pendingHighlightRef = useRef<number>(-1)
  const activeIdxRef = useRef<number>(-1)
  const reduceMotionRef = useRef<boolean>(false)

  const yearElRef = useRef<HTMLDivElement | null>(null)
  const districtElRef = useRef<HTMLDivElement | null>(null)
  const needleElRef = useRef<HTMLDivElement | null>(null)
  const compassElRef = useRef<HTMLSpanElement | null>(null)

  const [mapReady, setMapReady] = useState(false)
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

  // Try to highlight the building footprint under the active stop.
  const tryHighlight = useCallback((idx: number) => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded() || !map.getLayer('ht-3d-buildings')) return
    try {
      if (highlightedRef.current !== null) {
        map.setFeatureState(
          { source: 'composite', sourceLayer: 'building', id: highlightedRef.current.id },
          { active: false }
        )
        highlightedRef.current = null
      }
      if (idx < 0) {
        pendingHighlightRef.current = -1
        return
      }
      const stop = TOUR_STOPS[idx]
      const p = map.project([stop.lng, stop.lat])
      const features = map.queryRenderedFeatures(
        [
          [p.x - 24, p.y - 24],
          [p.x + 24, p.y + 24],
        ],
        { layers: ['ht-3d-buildings'] }
      )
      const feature = features.find((f) => f.id !== undefined)
      if (feature && feature.id !== undefined) {
        map.setFeatureState(
          { source: 'composite', sourceLayer: 'building', id: feature.id },
          { active: true }
        )
        highlightedRef.current = { id: feature.id }
        pendingHighlightRef.current = -1
      } else {
        // Buildings may not be rendered yet at this camera — retry on idle.
        pendingHighlightRef.current = idx
      }
    } catch {
      pendingHighlightRef.current = -1
    }
  }, [])

  // Main camera loop: scroll-scrubbed keyframe interpolation + gentle drift.
  useEffect(() => {
    if (!MAPBOX_TOKEN) return

    reduceMotionRef.current =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    mapboxgl.accessToken = MAPBOX_TOKEN
    let map: mapboxgl.Map | null = null
    const markers: mapboxgl.Marker[] = []

    try {
      map = new mapboxgl.Map({
        container: mapContainerRef.current as HTMLDivElement,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [INTRO_CAM.lng, INTRO_CAM.lat],
        zoom: INTRO_CAM.zoom,
        pitch: INTRO_CAM.pitch,
        bearing: INTRO_CAM.bearing,
        interactive: false,
        antialias: true,
      })
    } catch {
      return
    }
    mapRef.current = map

    map.on('error', (e) => {
      // Never leave the loading veil up if the style cannot load; the tour
      // narrative remains fully readable over the paper background.
      setMapReady(true)
      if (process.env.NODE_ENV === 'development') {
        console.warn('History tour map error:', e?.error?.message)
      }
    })

    map.on('load', () => {
      if (!map) return
      applyVintageStyle(map)
      addTourLayers(map, activeIdxRef.current)

      // Numbered plan markers, one per stop.
      TOUR_STOPS.forEach((stop, i) => {
        const el = document.createElement('div')
        el.className = 'ht-marker'
        el.textContent = String(i + 1)
        el.setAttribute('role', 'button')
        el.setAttribute('aria-label', `Go to stop ${i + 1}: ${stop.title}`)
        el.addEventListener('click', () => scrollToStop(i))
        markerElsRef.current[i] = el
        markers.push(
          new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([stop.lng, stop.lat])
            .addTo(map as mapboxgl.Map)
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

  const hasToken = MAPBOX_TOKEN.length > 0

  return (
    <div ref={rootRef} className="htour">
      {hasToken && (
        <div className="ht-stage" aria-hidden="true">
          <div ref={mapContainerRef} className="ht-map" />
          <div className="ht-vignette" />
          <div className="ht-paper-overlay" />
          <div className="ht-grain" />
          <div className={`ht-veil${mapReady ? ' is-hidden' : ''}`}>
            <span>Preparing the city plan …</span>
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
      {hasToken && (
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
      {hasToken ? (
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
                from address to address across a city plan drawn in the manner of the period.
              </p>
              <p className="ht-intro-note">
                The three-dimensional blocks are present-day building footprints rendered in the
                style of a 1930s city model; individual buildings may differ from their pre-war
                state. Stories are drawn from the StoryMaps archive and shown at the street
                addresses recorded there.
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
                Jewish businesses in Berlin 1930–1945. Base cartography © Mapbox © OpenStreetMap,
                recolored as a period city plan.
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
            The interactive map requires a Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN). The tour stops
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
