'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * Project context AND the ways into it, in one section.
 *
 * These used to be two: an "About the project" phase grid and a separate
 * "Begin exploring" card grid further down. They pointed at the same handful
 * of destinations — /map and /plaques appeared in both — so a reader met the
 * same two links twice, described twice, a screen apart. Merged, the page
 * states the project's arc once and then offers every destination on it in a
 * single grid, ranked: the things you can look at right now carry a picture
 * and lead, the rest follow as a compact row.
 */

interface Destination {
  number: string
  status: string
  statusColor: string
  title: string
  text: string
  href: string
  linkLabel: string
  image?: string
  imageAlt?: string
}

const AboutSection: React.FC = () => {
  const { t } = useTranslation()

  const featured: Destination[] = [
    {
      number: '01',
      status: t('homepage.about.statusLive', { defaultValue: 'Live' }),
      statusColor: 'var(--success)',
      title: t('homepage.about.phaseMapTitle', { defaultValue: 'The digital map' }),
      text: t('homepage.about.phaseMapText', {
        defaultValue:
          'The interactive memorial itself: ten thousand documented businesses, a time slider across 45 years, and the stories of the people behind the storefronts — searchable in three languages.',
      }),
      href: '/map',
      linkLabel: t('homepage.nav.map', { defaultValue: 'Map' }),
      image: '/images/map-preview.webp',
      imageAlt: t('homepage.about.mapImageAlt', {
        defaultValue:
          'The interactive map of Berlin: gold streets on a dark ground, scattered with teal squares marking each documented Jewish-owned business.',
      }),
    },
    {
      number: '02',
      status: t('homepage.about.statusProgress', { defaultValue: 'In progress' }),
      statusColor: 'var(--warning)',
      title: t('homepage.about.phasePlaquesTitle', { defaultValue: 'Memorial plaques' }),
      text: t('homepage.about.phasePlaquesText', {
        defaultValue:
          'Fifteen plaques are fully designed — each carrying a QR code that links the street back to the business’s story. Outreach to building owners is underway.',
      }),
      href: '/plaques',
      linkLabel: t('homepage.nav.plaques', { defaultValue: 'Plaques' }),
      image: '/images/plaques/e-braun-plaque.webp',
      imageAlt: t('homepage.explore.plaquesImageAlt', {
        defaultValue:
          'Memorial plaque for E. Braun & Co., Unter den Linden 75, Berlin-Mitte — gold lettering on deep blue, with an engraving of the storefront and a QR code.',
      }),
    },
    {
      number: '03',
      status: t('homepage.about.statusLive', { defaultValue: 'Live' }),
      statusColor: 'var(--success)',
      title: t('homepage.about.phaseTourTitle', { defaultValue: 'Historical virtual tour' }),
      text: t('homepage.about.phaseTourText', {
        defaultValue:
          'Fifteen addresses in a modelled 1930s Berlin. Scroll, and the camera flies from one storefront to the next as the years advance from 1925 to 1945.',
      }),
      href: '/history-tour',
      linkLabel: t('homepage.nav.historyTour', { defaultValue: 'Take the tour' }),
      image: '/images/history-tour-card.webp',
      imageAlt: t('homepage.about.tourImageAlt', {
        defaultValue:
          'A sepia aerial view of Berlin with the 1930s city modelled as extruded blocks, one building marked in red and numbered — the address of the Wassermann brothers’ grocery in Brunnenstrasse.',
      }),
    },
  ]

  const further: Destination[] = [
    {
      number: '04',
      status: t('homepage.about.statusPrototype', { defaultValue: 'Prototype' }),
      statusColor: 'var(--warning)',
      title: t('homepage.about.phaseExhibitTitle', { defaultValue: 'Museum exhibit' }),
      text: t('homepage.about.phaseExhibitText', {
        defaultValue:
          'A touch-screen exhibit version of the map is built and running, designed for kiosk display. We are seeking museum and cultural partners to host it.',
      }),
      href: '/exhibit-vision',
      linkLabel: t('homepage.about.exhibitLink', { defaultValue: 'Exhibit vision' }),
    },
    {
      number: '05',
      status: t('homepage.about.statusPilot', { defaultValue: 'Pilot' }),
      statusColor: 'var(--primary)',
      title: t('homepage.about.phaseBeyondTitle', { defaultValue: 'Beyond Berlin' }),
      text: t('homepage.about.phaseBeyondText', {
        defaultValue:
          'A Frankfurt pilot of 57 businesses shows the model extends to other German cities.',
      }),
      href: '/frankfurt',
      linkLabel: t('homepage.nav.frankfurt', { defaultValue: 'Frankfurt' }),
    },
    {
      number: '06',
      status: t('homepage.about.statusFree', { defaultValue: 'Free to use' }),
      statusColor: 'var(--success)',
      title: t('homepage.about.phaseEducationTitle', {
        defaultValue: 'Classroom workbook',
      }),
      text: t('homepage.about.phaseEducationText', {
        defaultValue:
          'A neighbourhood workbook for ages 13–18: research the businesses on your own street, walk to the addresses, and design what continuity could have looked like.',
      }),
      href: '/education',
      linkLabel: t('homepage.nav.education', { defaultValue: 'For Teachers' }),
    },
    {
      number: '07',
      status: t('homepage.explore.dataTag', { defaultValue: 'For researchers' }),
      statusColor: 'var(--muted)',
      title: t('cta.viewData', { defaultValue: 'View Raw Data' }),
      text: t('homepage.explore.dataText', {
        defaultValue:
          'Browse the underlying records: names, addresses, trades and dates, with sources for every entry.',
      }),
      href: '/jewish-businesses',
      linkLabel: t('homepage.nav.data', { defaultValue: 'Data' }),
    },
  ]

  return (
    <section
      className="py-12 sm:py-16 px-5 sm:px-8 border-t"
      style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mb-10">
          <div>
            <p
              className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
              style={{ color: 'var(--primary)' }}
            >
              {t('homepage.about.eyebrow', { defaultValue: 'About the project' })}
            </p>
            <h2
              className="font-kame text-3xl sm:text-5xl leading-tight mb-6"
              style={{ color: 'var(--foreground)' }}
            >
              {t('homepage.about.title', {
                defaultValue: 'A digital memorial with a physical future',
              })}
            </h2>
            <p
              className="font-['Inter'] text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('homepage.about.mission', {
                defaultValue:
                  'StoryTimeMaps set out to map the formerly Jewish-owned businesses of Berlin from verified historical records and archival imagery — and then to carry that memory back into the physical city: through memorial plaques at the original addresses, and a public museum exhibit.',
              })}
            </p>
          </div>

          <div
            className="border p-7 sm:p-8"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
          >
            <h3
              className="font-mono text-sm font-bold uppercase tracking-wider mb-5"
              style={{ color: 'var(--foreground)' }}
            >
              {t('homepage.about.sourceTitle', { defaultValue: 'Sourced and verified' })}
            </h3>
            <p
              className="font-['Inter'] text-sm leading-relaxed mb-6"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('homepage.about.sourceText', {
                defaultValue:
                  'Every record comes from the Datenbank jüdischer Gewerbebetriebe in Berlin at Humboldt-Universität zu Berlin — the scholarly database grounded in Dr. Christoph Kreutzmüller’s research — with archival material informed by the Leo Baeck Institute.',
              })}
            </p>
            <ul className="space-y-3">
              {[
                t('homepage.about.fact1', {
                  defaultValue:
                    'All 10,021 records re-verified against the original source in 2026',
                }),
                t('homepage.about.fact2', {
                  defaultValue: 'Every record carries its source link and a verification date',
                }),
                t('homepage.about.fact3', {
                  defaultValue:
                    'Roughly nine in ten businesses plotted at their exact street address',
                }),
                t('homepage.about.fact4', {
                  defaultValue: 'Multilingual from the ground up: English, German and Yiddish',
                }),
              ].map((fact) => (
                <li key={fact} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: 'var(--primary)' }}
                  />
                  <span
                    className="font-mono text-xs leading-relaxed"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {fact}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p
          className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-6"
          style={{ color: 'var(--primary)' }}
        >
          {t('homepage.explore.eyebrow', { defaultValue: 'Ways in' })}
        </p>

        {/* The destinations you can look at today, each with the thing itself. */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          {featured.map((dest) => (
            <Link
              key={dest.href}
              href={dest.href}
              className="group border flex flex-col transition-transform duration-200 hover:-translate-y-1 about-card"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
            >
              {dest.image && (
                <div className="relative w-full aspect-[16/9] overflow-hidden">
                  <Image
                    src={dest.image}
                    alt={dest.imageAlt ?? ''}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-7 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-bold" style={{ color: 'var(--muted)' }}>
                    {dest.number}
                  </span>
                  <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
                    <span
                      aria-hidden="true"
                      className="w-2 h-2"
                      style={{ backgroundColor: dest.statusColor }}
                    />
                    <span style={{ color: 'var(--foreground-muted)' }}>{dest.status}</span>
                  </span>
                </div>
                <h3
                  className="font-mono text-lg font-bold mb-3 leading-snug"
                  style={{ color: 'var(--foreground)' }}
                >
                  {dest.title}
                </h3>
                <p
                  className="font-['Inter'] text-sm leading-relaxed flex-1"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {dest.text}
                </p>
                <span
                  className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider mt-5 transition-transform duration-200 group-hover:translate-x-1"
                  style={{ color: 'var(--primary)' }}
                >
                  {dest.linkLabel} <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Everything else on the arc: still ahead, or for researchers. */}
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px"
          style={{ backgroundColor: 'var(--border)' }}
        >
          {further.map((dest) => (
            <Link
              key={dest.href}
              href={dest.href}
              className="group p-6 sm:p-7 flex flex-col about-card"
              style={{ backgroundColor: 'var(--card-bg)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-2xl font-bold" style={{ color: 'var(--muted)' }}>
                  {dest.number}
                </span>
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
                  <span
                    aria-hidden="true"
                    className="w-2 h-2"
                    style={{ backgroundColor: dest.statusColor }}
                  />
                  <span style={{ color: 'var(--foreground-muted)' }}>{dest.status}</span>
                </span>
              </div>
              <h3
                className="font-mono text-base font-bold mb-3 leading-snug"
                style={{ color: 'var(--foreground)' }}
              >
                {dest.title}
              </h3>
              <p
                className="font-['Inter'] text-sm leading-relaxed flex-1"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {dest.text}
              </p>
              <span
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider mt-5 transition-transform duration-200 group-hover:translate-x-1"
                style={{ color: 'var(--primary)' }}
              >
                {dest.linkLabel} <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>

        <div
          className="mt-10 border p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
        >
          <div>
            <h3
              className="font-mono text-sm font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              {t('homepage.about.collaborateTitle', { defaultValue: 'Built by volunteers' })}
            </h3>
            <p
              className="font-['Inter'] text-sm leading-relaxed max-w-2xl"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('homepage.about.collaborateText', {
                defaultValue:
                  'Developers, researchers, translators, and outreach volunteers keep this memorial growing. There is a place for you.',
              })}
            </p>
          </div>
          <Link
            href="/collaborate"
            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider px-5 py-3 flex-shrink-0 transition-opacity hover:opacity-80"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--background)',
              outline: 'none',
              boxShadow: 'none',
            }}
          >
            {t('homepage.about.collaborateLink', { defaultValue: 'Get involved' })}{' '}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <style jsx global>{`
        /* The "further" grid cards (03-05) have no border of their own — they sit in a
           gap-px grid where the background shows through as the rule — so the old
           border-color-on-focus reset was invisible there; keyboard focus had no visible
           indicator on 3 of 5 cards. An inset outline works on both the bordered and
           borderless cards. :focus-visible so a mouse click doesn't draw it too. */
        .about-card:focus {
          outline: none;
          box-shadow: none;
        }
        .about-card:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: -2px;
        }
      `}</style>
    </section>
  )
}

export default React.memo(AboutSection)
