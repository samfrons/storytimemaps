'use client'

import React from 'react'
import Image from 'next/image'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * Opening of the plaque initiative page.
 *
 * The lead image is the actual cutting file — e-braun-300x200-field.svg from
 * public/plaques/lightburn, the negative reading that goes to the laser — not
 * a mock-up drawn for the web. Showing the production artwork is the point:
 * the initiative is at the stage where the files exist.
 */
const PlaqueHero: React.FC = () => {
  const { t } = useTranslation()

  const facts: Array<[string, string]> = [
    [
      t('plaqueInitiative.facts.eligibleLabel', { defaultValue: 'Records eligible' }),
      t('plaqueInitiative.facts.eligibleValue', { defaultValue: '2,464 of 10,021' }),
    ],
    [
      t('plaqueInitiative.facts.formatsLabel', { defaultValue: 'Formats' }),
      t('plaqueInitiative.facts.formatsValue', { defaultValue: '300 × 200 · 300 × 100 mm' }),
    ],
    [
      t('plaqueInitiative.facts.materialLabel', { defaultValue: 'Material' }),
      t('plaqueInitiative.facts.materialValue', {
        defaultValue: '1.3 mm two-tone engraving plate',
      }),
    ],
    [
      t('plaqueInitiative.facts.fundingLabel', { defaultValue: 'Funded by' }),
      t('plaqueInitiative.facts.fundingValue', { defaultValue: 'Stiftung Zurückgeben' }),
    ],
  ]

  return (
    <section className="px-5 sm:px-8 pt-14 sm:pt-20 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-14 items-start">
          <div>
            <p
              className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-5"
              style={{ color: 'var(--primary)' }}
            >
              {t('plaqueInitiative.hero.eyebrow', {
                defaultValue: 'The plaque initiative · Berlin',
              })}
            </p>

            <h1
              className="font-kame text-4xl sm:text-6xl leading-[1.05] mb-6"
              style={{ color: 'var(--foreground)' }}
            >
              {t('plaqueInitiative.hero.title', {
                defaultValue: 'Put the record back on the wall it was taken from.',
              })}
            </h1>

            <p
              className="font-['Inter'] text-base sm:text-lg leading-relaxed mb-5"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('plaqueInitiative.hero.lead', {
                defaultValue:
                  'An archive can be closed. A plaque cannot. This initiative takes the businesses documented in the database and returns them to the street door they traded behind — one engraved plate per address, stating what stood there, what it did, and when it was ended.',
              })}
            </p>

            <p
              className="font-['Inter'] text-base leading-relaxed mb-8"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('plaqueInitiative.hero.lead2', {
                defaultValue:
                  'The plaques are in German, because they are read by whoever is walking past. Every one carries a QR code back to the full record, and every one names the funder.',
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
                href="mailto:info@storytimemaps.com?subject=Memorial%20plaque%20—%20sponsor%20an%20address"
                className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
              >
                {t('plaqueInitiative.hero.ctaSponsor', { defaultValue: 'Sponsor an address' })}
              </a>
              <a
                href="#gallery"
                className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider border transition-opacity hover:opacity-80"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                {t('plaqueInitiative.hero.ctaGallery', { defaultValue: 'See the plaques' })}{' '}
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>

          <figure className="border" style={{ borderColor: 'var(--border)' }}>
            <Image
              src="/plaques/lightburn/e-braun-300x200-field.svg"
              unoptimized
              alt={t('plaqueInitiative.hero.imageAlt', {
                defaultValue:
                  'The 300 by 200 millimetre memorial plaque for E. Braun & Co., shown as the negative cutting file: engraved field around light lettering, with a storefront line engraving and a QR code.',
              })}
              width={1200}
              height={800}
              priority
              className="w-full h-auto"
              style={{ backgroundColor: 'var(--card-bg)' }}
            />
            <figcaption
              className="p-5 border-t"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
            >
              <p
                className="font-['Inter'] text-sm leading-relaxed"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {t('plaqueInitiative.hero.imageCaption', {
                  defaultValue:
                    'E. Braun & Co., Unter den Linden 2 — the 300 × 200 mm narrative format, shown as the production file that goes to the laser.',
                })}
              </p>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}

export default React.memo(PlaqueHero)
