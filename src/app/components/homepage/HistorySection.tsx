'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../../i18n/useTranslation'

interface HistoryEvent {
  year: string
  textKey: string
  fallback: string
  color: string
}

const EVENTS: HistoryEvent[] = [
  {
    year: '1933',
    textKey: 'timeline.boycott1933',
    fallback: 'April 1933: Nationwide boycott of Jewish businesses',
    color: 'var(--warning)',
  },
  {
    year: '1935',
    textKey: 'timeline.laws1935',
    fallback: '1935: Nuremberg Laws restrict Jewish economic activity',
    color: 'var(--warning)',
  },
  {
    year: '1938',
    textKey: 'timeline.aryanization1938',
    fallback: "1938: Systematic 'Aryanization' of Jewish businesses",
    color: 'var(--accent-orange)',
  },
  {
    year: '1938',
    textKey: 'timeline.kristallnacht1938',
    fallback: 'November 1938: Kristallnacht — widespread destruction',
    color: 'var(--danger)',
  },
  {
    year: '1941–45',
    textKey: 'timeline.final1941',
    fallback: '1941–1945: Final liquidation of remaining businesses',
    color: 'var(--danger)',
  },
]

/**
 * The historical arc the map animates: from boycott to liquidation,
 * color-shifting from warning to danger just as the dots do.
 */
const HistorySection: React.FC = () => {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.15 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="py-12 sm:py-16 px-5 sm:px-8"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-8">
          <p
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--primary)' }}
          >
            {t('homepage.history.eyebrow', { defaultValue: 'What happened' })}
          </p>
          <h2
            className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            {t('timeline.title', { defaultValue: 'Historical Context' })}
          </h2>
          <p
            className="font-['Inter'] text-base sm:text-lg leading-relaxed"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('timeline.subtitle', {
              defaultValue: 'Key moments in the destruction of Jewish commerce',
            })}
          </p>
        </div>

        {/*
          Horizontal rail, not a vertical timeline.

          Five stacked cards ran to well over a screen of height for what is
          really one line of chronology, pushing the sections after it off the
          page. Read sideways the same five beats occupy a single band, and the
          left-to-right reading direction carries the sequence better than a
          top-to-bottom list did.

          The rail keeps its own scrollbar (overflow-x on this container only),
          so the page body never scrolls sideways. Cards are a fixed width so
          they always break mid-card, which is what signals there is more to
          the right without needing an affordance.
        */}
        <div className="relative -mx-5 sm:-mx-8">
          <ol className="flex gap-4 overflow-x-auto px-5 sm:px-8 pb-4 history-rail snap-x snap-mandatory">
            {EVENTS.map((event, index) => (
              <li
                key={`${event.year}-${event.textKey}`}
                className={`flex-shrink-0 w-[260px] sm:w-[290px] snap-start transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                {/* The colour bar replaces the old timeline dot: it is the same
                    warning -> danger shift the map's markers make. */}
                <span
                  aria-hidden="true"
                  className="block h-1.5 w-full"
                  style={{ backgroundColor: event.color }}
                />
                <div
                  className="border border-t-0 p-5 h-full"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
                >
                  <span
                    className="font-mono text-xl font-bold block mb-2"
                    style={{ color: event.color }}
                  >
                    {event.year}
                  </span>
                  <p
                    className="font-['Inter'] text-sm leading-relaxed"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {t(event.textKey, { defaultValue: event.fallback })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p
          className="font-['Inter'] text-sm leading-relaxed mt-8 max-w-3xl"
          style={{ color: 'var(--foreground-muted)' }}
        >
          {t('homepage.history.note', {
            defaultValue:
              'This was not a collapse but a campaign: boycott, legal exclusion, forced sale, destruction. Each step is visible on the map as a wave of color moving through the city.',
          })}
        </p>
      </div>

      <style jsx global>{`
        /* A thin rail-coloured scrollbar; the default chrome one is heavy
           enough to read as a page element rather than part of the band. */
        .history-rail {
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }
        .history-rail::-webkit-scrollbar {
          height: 6px;
        }
        .history-rail::-webkit-scrollbar-track {
          background: transparent;
        }
        .history-rail::-webkit-scrollbar-thumb {
          background: var(--border);
        }
      `}</style>
    </section>
  )
}

export default React.memo(HistorySection)
