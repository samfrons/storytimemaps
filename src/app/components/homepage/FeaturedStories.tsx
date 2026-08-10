'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * The human dimension behind the dots: a selection of the archive's
 * deeply researched stories, each with archival imagery, deep-linking
 * into the map's detail view (/map?id=N).
 */

interface FeaturedStory {
  id: string
  title: string
  address: string
  years: string
  image: string
}

// Drawn from the 15 curated narratives in data/storymaps.json;
// ids match the map's ?id= deep links and images are checked into /public.
const STORIES: FeaturedStory[] = [
  {
    id: '1',
    title: 'Elias Braun – Tailor Shop',
    address: 'Rosenthaler Straße 40',
    years: '1925–1938',
    image: '/images/ebraun/ebraun1.webp',
  },
  {
    id: '2',
    title: 'Breslauer Brothers Department Store',
    address: 'Unter den Linden 15',
    years: '1920–1935',
    image: '/images/breslaur/breslaur1.webp',
  },
  {
    id: '5',
    title: 'Hoxter & Sons Bookshop',
    address: 'Oranienburger Straße 28',
    years: '1910–1938',
    image: '/images/hoxter/hoxter.webp',
  },
  {
    id: '10',
    title: 'Kutschera Photography Studio',
    address: 'Potsdamer Straße 125',
    years: '1930–1938',
    image: '/images/kutschera/kutschera.webp',
  },
  {
    id: '11',
    title: 'P. Kunst Gallery',
    address: 'Unter den Linden 35',
    years: '1924–1937',
    image: '/images/pkunst/pkunst.webp',
  },
  {
    id: '15',
    title: 'YVA Photography Agency',
    address: 'Kaiserdamm 118',
    years: '1925–1938',
    image: '/images/yva/yva.webp',
  },
]

const FeaturedStories: React.FC = () => {
  const { t } = useTranslation()

  return (
    <section
      className="py-20 sm:py-28 px-5 sm:px-8"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-14">
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
