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
      className="py-20 sm:py-28 px-5 sm:px-8"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="max-w-3xl mb-14">
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

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute left-[7px] top-2 bottom-2 w-0.5"
            style={{ backgroundColor: 'var(--border)' }}
          />
          <ol className="space-y-6">
            {EVENTS.map((event, index) => (
              <li
                key={`${event.year}-${event.textKey}`}
                className={`relative flex items-start transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="relative z-10 w-4 h-4 flex-shrink-0 mt-1.5"
                  style={{ backgroundColor: event.color }}
                />
                <div
                  className="ml-6 flex-1 border p-5 sm:p-6"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
                >
                  <span
                    className="font-mono text-xl font-bold block mb-1"
                    style={{ color: event.color }}
                  >
                    {event.year}
                  </span>
                  <p
                    className="font-['Inter'] text-sm sm:text-base leading-relaxed"
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
          className="font-['Inter'] text-sm leading-relaxed mt-12 max-w-3xl"
          style={{ color: 'var(--foreground-muted)' }}
        >
          {t('homepage.history.note', {
            defaultValue:
              'This was not a collapse but a campaign: boycott, legal exclusion, forced sale, destruction. Each step is visible on the map as a wave of color moving through the city.',
          })}
        </p>
      </div>
    </section>
  )
}

export default React.memo(HistorySection)
