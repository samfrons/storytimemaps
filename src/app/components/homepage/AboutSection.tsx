'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * Project context: what StoryTimeMaps is, where its data comes from and
 * how it is verified, and the arc from digital map to physical memorial
 * (plaques, museum exhibit, other cities).
 */
const AboutSection: React.FC = () => {
  const { t } = useTranslation()

  const phases = [
    {
      number: '01',
      status: t('homepage.about.statusLive', { defaultValue: 'Live' }),
      statusColor: 'var(--success)',
      title: t('homepage.about.phaseMapTitle', { defaultValue: 'The digital map' }),
      text: t('homepage.about.phaseMapText', {
        defaultValue:
          'The interactive memorial you are looking at: every documented business, searchable and explorable in three languages.',
      }),
      href: '/map',
      linkLabel: t('homepage.nav.map', { defaultValue: 'Map' }),
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
    },
    {
      number: '03',
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
      number: '04',
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
  ]

  return (
    <section
      className="py-20 sm:py-28 px-5 sm:px-8 border-t"
      style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mb-16">
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

        <div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px"
          style={{ backgroundColor: 'var(--border)' }}
        >
          {phases.map((phase) => (
            <article
              key={phase.number}
              className="p-6 sm:p-7 flex flex-col"
              style={{ backgroundColor: 'var(--card-bg)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-2xl font-bold" style={{ color: 'var(--muted)' }}>
                  {phase.number}
                </span>
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
                  <span
                    aria-hidden="true"
                    className="w-2 h-2"
                    style={{ backgroundColor: phase.statusColor }}
                  />
                  <span style={{ color: 'var(--foreground-muted)' }}>{phase.status}</span>
                </span>
              </div>
              <h3
                className="font-mono text-base font-bold mb-3 leading-snug"
                style={{ color: 'var(--foreground)' }}
              >
                {phase.title}
              </h3>
              <p
                className="font-['Inter'] text-sm leading-relaxed flex-1"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {phase.text}
              </p>
              <Link
                href={phase.href}
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider mt-5 transition-opacity hover:opacity-80"
                style={{ color: 'var(--primary)' }}
              >
                {phase.linkLabel} <span aria-hidden="true">→</span>
              </Link>
            </article>
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
    </section>
  )
}

export default React.memo(AboutSection)
