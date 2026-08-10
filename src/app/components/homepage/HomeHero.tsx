'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'
import {
  GRID_SIZE,
  MAP_ASPECT,
  countStates,
  dotStateForYear,
  formatCount,
  useThemeColors,
  type HomepagePointsData,
  type StateCounts,
} from './homepageData'

interface HomeHeroProps {
  data: HomepagePointsData | null
}

const YEAR_MIN = 1900
const YEAR_MAX = 1945
const YEARS_PER_SECOND = 2.2
const HOLD_AT_END_MS = 3200

/**
 * Full-viewport hero: every geocoded business in the archive drawn as a
 * square dot at its real location, animated through 1900-1945. The scrubber
 * below the headline is a working miniature of the site's core interface.
 */
const HomeHero: React.FC<HomeHeroProps> = ({ data }) => {
  const { t, language } = useTranslation()
  const colors = useThemeColors()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Mutable animation state, read by the rAF loop without re-rendering React
  const animRef = useRef({
    year: YEAR_MIN,
    playing: true,
    holdUntil: 0,
    visible: true,
    reducedMotion: false,
  })

  const [displayYear, setDisplayYear] = useState(YEAR_MIN)
  const [isPlaying, setIsPlaying] = useState(true)
  const [counts, setCounts] = useState<StateCounts>({ active: 0, declining: 0, closed: 0 })

  const numberFormat = useCallback((value: number) => formatCount(value, language), [language])

  // Respect prefers-reduced-motion: start paused on a meaningful year
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animRef.current.reducedMotion = true
      animRef.current.playing = false
      animRef.current.year = 1933
      setIsPlaying(false)
      setDisplayYear(1933)
    }
  }, [])

  // Pause the loop while the hero is offscreen
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new IntersectionObserver(
      (entries) => {
        animRef.current.visible = entries[0]?.isIntersecting ?? true
      },
      { threshold: 0.05 }
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Keep the canvas buffer sized to its container (device-pixel aware)
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(container.clientWidth * dpr)
      canvas.height = Math.round(container.clientHeight * dpr)
    }
    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Main draw + animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const points = data.points
    let raf = 0
    let lastTime = 0
    let lastReportedYear = -1

    const draw = (year: number) => {
      const { width, height } = canvas
      if (width === 0 || height === 0) return
      ctx.clearRect(0, 0, width, height)

      // Scale the quantized grid to cover the canvas, preserving Berlin's
      // real east-west/north-south proportions
      const scale = Math.max(width / MAP_ASPECT, height)
      const drawWidth = scale * MAP_ASPECT
      const drawHeight = scale
      const offsetX = (width - drawWidth) / 2
      const offsetY = (height - drawHeight) / 2
      const fx = drawWidth / GRID_SIZE
      const fy = drawHeight / GRID_SIZE

      // 380 put roughly 2px dots on a laptop, which disappeared entirely once the scrim was
      // over them. The field has to read as a city from across the room, so the dots are now
      // ~2x the area and the floor is 2.5px on small viewports.
      const size = Math.max(2.5, Math.min(width, height) / 240)
      const half = size / 2

      // One pass per state keeps fillStyle changes to four per frame
      const passes: Array<['future' | 'active' | 'declining' | 'closed', string, number]> = [
        ['future', colors.future, 0.22],
        ['closed', colors.closed, 0.3],
        ['declining', colors.declining, 0.9],
        ['active', colors.active, 0.85],
      ]

      for (const [state, color, alpha] of passes) {
        ctx.fillStyle = color
        ctx.globalAlpha = alpha
        for (let i = 0; i < points.length; i++) {
          const p = points[i]
          if (dotStateForYear(year, p[2], p[3]) !== state) continue
          ctx.fillRect(offsetX + p[0] * fx - half, offsetY + p[1] * fy - half, size, size)
        }
      }
      ctx.globalAlpha = 1
    }

    const tick = (time: number) => {
      raf = requestAnimationFrame(tick)
      const anim = animRef.current
      if (!anim.visible) {
        lastTime = time
        return
      }
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0
      lastTime = time

      if (anim.playing) {
        if (anim.year >= YEAR_MAX) {
          if (anim.holdUntil === 0) {
            anim.holdUntil = time + HOLD_AT_END_MS
          } else if (time >= anim.holdUntil) {
            anim.year = YEAR_MIN
            anim.holdUntil = 0
          }
        } else {
          anim.year = Math.min(anim.year + dt * YEARS_PER_SECOND, YEAR_MAX)
        }
      }

      draw(anim.year)

      // Throttle React updates to whole-year changes
      const wholeYear = Math.floor(anim.year)
      if (wholeYear !== lastReportedYear) {
        lastReportedYear = wholeYear
        setDisplayYear(wholeYear)
        setCounts(countStates(points, wholeYear))
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [data, colors])

  const handleScrub = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const year = Number(event.target.value)
    animRef.current.year = year
    animRef.current.playing = false
    animRef.current.holdUntil = 0
    setIsPlaying(false)
    setDisplayYear(year)
  }, [])

  const togglePlay = useCallback(() => {
    const anim = animRef.current
    if (!anim.playing && anim.year >= YEAR_MAX) {
      anim.year = YEAR_MIN
      anim.holdUntil = 0
    }
    anim.playing = !anim.playing
    setIsPlaying(anim.playing)
  }, [])

  const legend = useMemo(
    () => [
      {
        key: 'active',
        color: 'var(--success)',
        label: t('homepage.states.active', { defaultValue: 'Open' }),
        value: counts.active,
      },
      {
        key: 'declining',
        color: 'var(--warning)',
        label: t('homepage.states.declining', { defaultValue: 'Under pressure' }),
        value: counts.declining,
      },
      {
        key: 'closed',
        color: 'var(--danger)',
        label: t('homepage.states.closed', { defaultValue: 'Closed' }),
        value: counts.closed,
      },
    ],
    [counts, t]
  )

  return (
    <section
      ref={containerRef}
      /*
        A MINIMUM height, not a fixed one. The copy is bottom-aligned, so a
        fixed full-viewport hero left a band of empty ground above it that grew
        with the window — worst on a short, wide window, where a 660px floor
        exceeded the viewport and pushed the headline below the fold of
        attention. Sized from content instead, the section only exceeds the copy
        when there is genuinely room for the dot field to show.
      */
      className="relative w-full overflow-hidden min-h-[68svh] sm:min-h-[76svh]"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
          data ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/*
        Legibility gradient over the dot field.

        Two layers, not one. The old single bottom-up wash sat at 0.96 across the whole width,
        which meant the dot field was only ever visible as a faint haze - the hero read as an
        empty coloured panel with a headline on it. The copy only occupies the lower-left, so
        the scrim is now directional: heavy behind the text, and clearing to almost nothing on
        the right and top where the map is the only thing on screen. The second layer is a
        short bottom fade that keeps the year slider and legend readable.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'linear-gradient(100deg, rgba(var(--background-rgb), 0.93) 0%, rgba(var(--background-rgb), 0.82) 30%, rgba(var(--background-rgb), 0.34) 58%, rgba(var(--background-rgb), 0.08) 100%)',
            'linear-gradient(to top, rgba(var(--background-rgb), 0.9) 0%, rgba(var(--background-rgb), 0.35) 16%, rgba(var(--background-rgb), 0) 34%)',
          ].join(', '),
        }}
      />

      {/* pt-24 is the header guard: this column is bottom-aligned, so on a short
          viewport the block grows upward and would otherwise slide under the
          fixed header. */}
      <div className="relative z-10 flex flex-col justify-end px-5 sm:px-8 lg:px-14 pt-24 sm:pt-28 pb-6 sm:pb-10 overflow-hidden">
        <div className="max-w-5xl">
          <p
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--primary)' }}
          >
            {t('homepage.hero.eyebrow', {
              defaultValue: 'A living map of Jewish commercial life · Berlin 1900–1945',
            })}
          </p>

          {/* Sized for THIS headline, which runs to three lines at large sizes.
              The previous scale (up to text-8xl) was set for a much shorter
              line and pushed the third line up behind the fixed header. */}
          <h1
            className="font-kame leading-[1.02] text-[1.75rem] sm:text-4xl lg:text-5xl xl:text-6xl mb-5 max-w-4xl text-balance"
            style={{ color: 'var(--foreground)' }}
          >
            {t('homepage.hero.titleLine1', { defaultValue: '10,021 Jewish-owned businesses.' })}
            <br />
            {t('homepage.hero.titleLine2', {
              defaultValue: 'Mapped to the streets where they stood.',
            })}
          </h1>

          <p
            className="font-['Inter'] text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mb-7"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('homepage.hero.description', {
              defaultValue:
                'StoryTimeMaps charts more than ten thousand Jewish-owned businesses at their real Berlin addresses — and lets you move through time to watch a community’s economy flourish, come under attack, and be systematically erased.',
            })}
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
            >
              {t('homepage.hero.ctaMap', { defaultValue: 'Explore the map' })}
              <span aria-hidden="true">→</span>
            </Link>
            <a
              href="#concept"
              className="inline-flex items-center px-6 py-3 font-mono text-sm uppercase tracking-wider border transition-opacity hover:opacity-80"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                backgroundColor: 'rgba(var(--background-rgb), 0.5)',
              }}
            >
              {t('homepage.hero.ctaHow', { defaultValue: 'How it works' })}
            </a>
          </div>
        </div>

        {/* Working miniature of the app's time interface */}
        <div className="border-t pt-4" style={{ borderColor: 'rgba(var(--muted-rgb), 0.6)' }}>
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={togglePlay}
              className="w-11 h-11 flex-shrink-0 flex items-center justify-center border transition-opacity hover:opacity-80 hero-control"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                backgroundColor: 'rgba(var(--input-bg-rgb), 0.5)',
              }}
              aria-label={
                isPlaying
                  ? t('homepage.hero.pause', { defaultValue: 'Pause the timeline' })
                  : t('homepage.hero.play', { defaultValue: 'Play the timeline' })
              }
            >
              {isPlaying ? (
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <rect x="2" y="2" width="4" height="12" />
                  <rect x="10" y="2" width="4" height="12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M3 2l11 6-11 6z" />
                </svg>
              )}
            </button>

            <div
              className="font-mono font-bold text-3xl sm:text-4xl tabular-nums flex-shrink-0 w-[5.5rem] sm:w-[6.5rem]"
              style={{ color: 'var(--foreground)' }}
              aria-live="off"
            >
              {displayYear}
            </div>

            <input
              type="range"
              min={YEAR_MIN}
              max={YEAR_MAX}
              step={1}
              value={displayYear}
              onChange={handleScrub}
              className="hero-range flex-1 min-w-0"
              aria-label={t('homepage.hero.sliderLabel', { defaultValue: 'Year' })}
              aria-valuetext={String(displayYear)}
            />
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
            {legend.map((item) => (
              <div key={item.key} className="flex items-center gap-2 font-mono text-xs sm:text-sm">
                <span
                  aria-hidden="true"
                  className="inline-block w-3 h-3 flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="tabular-nums font-bold" style={{ color: 'var(--foreground)' }}>
                  {data ? numberFormat(item.value) : '—'}
                </span>
                <span style={{ color: 'var(--foreground-muted)' }}>{item.label}</span>
              </div>
            ))}
            <div
              className="font-mono text-xs sm:text-sm ml-auto hidden md:block"
              style={{ color: 'var(--muted)' }}
            >
              {data
                ? t('homepage.hero.plotted', {
                    defaultValue: '{{total}} documented locations, drawn from the archive',
                    total: numberFormat(data.plotted),
                  })
                : t('homepage.hero.loading', { defaultValue: 'Loading the archive…' })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-control:focus {
          outline: none;
          box-shadow: none;
          border-color: var(--primary);
        }
        .hero-range {
          -webkit-appearance: none;
          appearance: none;
          height: 2px;
          background: var(--border);
          cursor: pointer;
        }
        .hero-range:focus {
          outline: none;
          box-shadow: none;
        }
        .hero-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 0;
          background: var(--primary);
          border: none;
          cursor: pointer;
        }
        .hero-range:focus::-webkit-slider-thumb {
          background: var(--foreground);
        }
        .hero-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 0;
          background: var(--primary);
          border: none;
          cursor: pointer;
        }
        .hero-range:focus::-moz-range-thumb {
          background: var(--foreground);
        }
        .hero-range::-moz-range-track {
          height: 2px;
          background: var(--border);
        }
      `}</style>
    </section>
  )
}

export default React.memo(HomeHero)
