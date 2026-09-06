'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'
import ExhibitFigure from './ExhibitFigure'

/**
 * Opening statement of the exhibition proposal.
 *
 * The numbers in the fact strip are the archive's real ones — 10,021 records
 * verified against the Humboldt-Universität source, 2,761 with dates and a
 * trade, 16 with full researched narratives — so a venue reading this page is
 * reading the same figures as the map itself.
 */
const ExhibitHero: React.FC = () => {
  const { t } = useTranslation()

  const facts: Array<[string, string]> = [
    [
      t('exhibit.facts.footprintLabel', { defaultValue: 'Footprint' }),
      t('exhibit.facts.footprintValue', { defaultValue: '25–120 m², three scales' }),
    ],
    [
      t('exhibit.facts.durationLabel', { defaultValue: 'Visit length' }),
      t('exhibit.facts.durationValue', { defaultValue: '4 min pass-through — 40 min deep' }),
    ],
    [
      t('exhibit.facts.languagesLabel', { defaultValue: 'Languages' }),
      t('exhibit.facts.languagesValue', { defaultValue: 'German · English · Yiddish' }),
    ],
    [
      t('exhibit.facts.statusLabel', { defaultValue: 'Status' }),
      t('exhibit.facts.statusValue', { defaultValue: 'Software built · seeking a host venue' }),
    ],
  ]

  return (
    <section className="px-5 sm:px-8 pt-14 sm:pt-20 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-start">
          <div>
            <p
              className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-5"
              style={{ color: 'var(--primary)' }}
            >
              {t('exhibit.hero.eyebrow', {
                defaultValue: 'Exhibition concept · Seeking a host venue',
              })}
            </p>

            <h1
              className="font-kame text-4xl sm:text-6xl leading-[1.05] mb-6"
              style={{ color: 'var(--foreground)' }}
            >
              {t('exhibit.hero.title', { defaultValue: 'Stand in the city that was taken.' })}
            </h1>

            <p
              className="font-['Inter'] text-base sm:text-lg leading-relaxed mb-5"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('exhibit.hero.lead', {
                defaultValue:
                  'A room-scale installation built on this archive. Berlin is cut into the floor at 1:2,000. Ten thousand Jewish-owned businesses sit on it as points of light. A visitor walks the years from 1900 to 1945 and watches the lights go out around their own feet — street by street, trade by trade, in the order it actually happened.',
              })}
            </p>

            <p
              className="font-['Inter'] text-base leading-relaxed mb-8"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('exhibit.hero.lead2', {
                defaultValue:
                  'The exhibition asks nothing of a visitor except that they find one address. Everything else — the name of the owner, the trade, the year it ended and who took it — is attached to that single point on the floor they are standing over.',
              })}
            </p>

            <div
              className="grid sm:grid-cols-2 gap-px mb-8"
              style={{ backgroundColor: 'var(--border)' }}
            >
              {facts.map(([label, value]) => (
                <div key={label} className="p-5" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <div
                    className="font-mono text-[10px] uppercase tracking-[0.25em] mb-2"
                    style={{ color: 'var(--muted)' }}
                  >
                    {label}
                  </div>
                  <div
                    className="font-mono text-sm font-bold leading-snug"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:info@storytimemaps.com?subject=Exhibition%20hosting%20enquiry"
                className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
              >
                {t('exhibit.hero.ctaHost', { defaultValue: 'Host the exhibition' })}
              </a>
              <Link
                href="/museum-exhibit"
                className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider border transition-opacity hover:opacity-80"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                {t('exhibit.hero.ctaKiosk', { defaultValue: 'Open the live kiosk' })}{' '}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <ExhibitFigure
            src="/images/exhibit/floor-map-installation.webp"
            alt={t('exhibit.figures.floorAlt', {
              defaultValue:
                'A large map of Berlin laid into a parquet gallery floor, districts in separate colours, with lit glass columns standing on it.',
            })}
            width={1024}
            height={1024}
            priority
            eyebrow={t('exhibit.figures.floorEyebrow', { defaultValue: 'The main room' })}
            caption={t('exhibit.figures.floorCaption', {
              defaultValue:
                'The floor map: Berlin at roughly 4 × 4 m, districts separated by line, twelve lit columns standing on the neighbourhoods where the archive is densest. Visitors walk on the city rather than look at it on a wall.',
            })}
          />
        </div>
      </div>
    </section>
  )
}

export default React.memo(ExhibitHero)
