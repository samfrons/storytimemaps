'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '../../../i18n/useTranslation'
import { TOUR_STOPS } from '../../history-tour/tourData'

/**
 * The human dimension behind the dots: a selection of the archive's
 * deeply researched stories, each with archival imagery, deep-linking
 * into the map's detail view (/map?id=N).
 */

/**
 * The six stories shown here are derived from TOUR_STOPS, not typed out.
 *
 * The previous hand-written list was wrong in every field but the id: it
 * described record 1 as "Elias Braun – Tailor Shop, Rosenthaler Straße 40,
 * 1925–1938" when the archive record is "E. Braun & Co., Unter den Linden 2,
 * 1914–1943". tourData.ts is transcribed verbatim from data/storymaps.json and
 * carries the same titles, addresses, dates and imagery the map renders, so
 * sourcing from it means the homepage and the map can no longer disagree.
 *
 * Six of fifteen, chosen as the stops that have a checked-in photograph — a
 * card with no image is a hole in the grid.
 */
const STORIES = TOUR_STOPS.filter((stop) => stop.images.length > 0)
  .slice(0, 6)
  .map((stop) => ({
    id: stop.id,
    title: stop.title,
    // "Schumannstrasse 13a, Berlin-Mitte, Germany" -> "Schumannstrasse 13a"
    address: stop.address.split(',')[0].trim(),
    years: `${stop.startDate.slice(0, 4)}–${stop.endDate.slice(0, 4)}`,
    image: stop.images[0],
  }))

const FeaturedStories: React.FC = () => {
  const { t } = useTranslation()

  return (
    <section
      className="py-12 sm:py-16 px-5 sm:px-8"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <div className="max-w-3xl">
            <p
              className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
              style={{ color: 'var(--primary)' }}
            >
              {t('homepage.stories.eyebrow', { defaultValue: 'The human dimension' })}
            </p>
            <h2
              className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {t('homepage.stories.title', { defaultValue: 'Behind every dot, a story' })}
            </h2>
            <p
              className="font-['Inter'] text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('homepage.stories.intro', {
                defaultValue:
                  'Fifteen businesses have been researched in depth — with archival photographs, documents and the histories of the families who built them. They are the first of many.',
              })}
            </p>
          </div>
          <Link
            href="/map"
            className="font-mono text-xs sm:text-sm uppercase tracking-wider transition-opacity hover:opacity-80 flex-shrink-0"
            style={{ color: 'var(--primary)' }}
          >
            {t('homepage.stories.cta', { defaultValue: 'Read them all in the map' })}{' '}
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {STORIES.map((story) => (
            <Link
              key={story.id}
              href={`/map?id=${story.id}`}
              className="group border transition-transform duration-200 hover:-translate-y-1 story-card"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
            >
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: '3 / 2', backgroundColor: 'var(--muted)' }}
              >
                <Image
                  src={story.image}
                  alt={t('homepage.stories.imageAlt', {
                    defaultValue: 'Archival photograph: {{name}}',
                    name: story.title,
                  })}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5">
                <h3
                  className="font-mono text-sm font-bold leading-snug mb-2"
                  style={{ color: 'var(--foreground)' }}
                >
                  {story.title}
                </h3>
                <p className="font-mono text-xs" style={{ color: 'var(--foreground-muted)' }}>
                  {story.address}
                </p>
                <p
                  className="font-mono text-xs tabular-nums mt-1"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {story.years}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <p className="font-mono text-xs mt-6" style={{ color: 'var(--muted)' }}>
          {t('homepage.stories.credit', {
            defaultValue: 'Photographs and documents from the project archive.',
          })}
        </p>
      </div>

      <style jsx global>{`
        .story-card {
          display: block;
        }
        .story-card:focus {
          outline: none;
          box-shadow: none;
          border-color: var(--primary);
        }
      `}</style>
    </section>
  )
}

export default React.memo(FeaturedStories)
