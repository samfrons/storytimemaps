'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * How a plaque gets from a database row onto a building, who has to agree,
 * and how to take part.
 *
 * Step 03 is the one that is genuinely outside the project's control, so it
 * is stated plainly rather than buried: nothing is fixed to a façade without
 * the building's consent.
 */
const PlaqueSupport: React.FC = () => {
  const { t } = useTranslation()

  const steps = [
    {
      n: '01',
      title: t('plaqueInitiative.process.s1Title', { defaultValue: 'An address is chosen' }),
      text: t('plaqueInitiative.process.s1Text', {
        defaultValue:
          'From the 2,464 eligible records — usually because someone has a reason to choose it: they live in the building, teach on the street, or are researching the trade.',
      }),
    },
    {
      n: '02',
      title: t('plaqueInitiative.process.s2Title', { defaultValue: 'The record is re-checked' }),
      text: t('plaqueInitiative.process.s2Text', {
        defaultValue:
          'Name, trade, address and dates are confirmed against the source database before anything is drawn. If a fact will not hold, the address does not get a plaque.',
      }),
    },
    {
      n: '03',
      title: t('plaqueInitiative.process.s3Title', { defaultValue: 'The building agrees' }),
      text: t('plaqueInitiative.process.s3Text', {
        defaultValue:
          'Nothing is fixed to a façade without the owner or managing agent, and, on a protected building, the district’s consent. Owners and tenants can register interest directly from any verified record on the map.',
      }),
    },
    {
      n: '04',
      title: t('plaqueInitiative.process.s4Title', { defaultValue: 'The plate is cut' }),
      text: t('plaqueInitiative.process.s4Text', {
        defaultValue:
          'The generator writes both readings, the verification pass checks them, and the file goes to the laser at exactly the size it was drawn.',
      }),
    },
    {
      n: '05',
      title: t('plaqueInitiative.process.s5Title', { defaultValue: 'It goes up, and stays' }),
      text: t('plaqueInitiative.process.s5Text', {
        defaultValue:
          'Mounted at the door, with the QR live and the funder named on the plate. The record it came from stays online underneath it.',
      }),
    },
  ]

  const partners = [
    t('plaques.partners.culturalInstitutions', { defaultValue: 'Cultural institutions' }),
    t('plaques.partners.educationalOrganizations', { defaultValue: 'Schools and universities' }),
    t('plaques.partners.jewishCommunity', { defaultValue: 'Jewish community organisations' }),
    t('plaques.partners.cityPlanning', { defaultValue: 'District and planning offices' }),
  ]

  return (
    <>
      {/* Process */}
      <section
        className="px-5 sm:px-8 py-14 sm:py-20 border-t"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-10">
            <p
              className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
              style={{ color: 'var(--primary)' }}
            >
              {t('plaqueInitiative.process.eyebrow', { defaultValue: 'From record to wall' })}
            </p>
            <h2
              className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {t('plaqueInitiative.process.title', {
                defaultValue: 'Five steps, one of them slow.',
              })}
            </h2>
          </div>

          <ol
            className="grid sm:grid-cols-2 lg:grid-cols-5 gap-px"
            style={{ backgroundColor: 'var(--border)' }}
          >
            {steps.map((s) => (
              <li
                key={s.n}
                className="p-6 flex flex-col"
                style={{ backgroundColor: 'var(--card-bg)' }}
              >
                <span
                  aria-hidden="true"
                  className="font-mono text-3xl font-bold mb-4"
                  style={{ color: 'var(--primary)' }}
                >
                  {s.n}
                </span>
                <h3
                  className="font-mono text-sm font-bold mb-3 leading-snug"
                  style={{ color: 'var(--foreground)' }}
                >
                  {s.title}
                </h3>
                <p
                  className="font-['Inter'] text-sm leading-relaxed"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {s.text}
                </p>
              </li>
            ))}
          </ol>

          <div
            className="border p-7 sm:p-8 mt-8 max-w-3xl"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
          >
            <h3
              className="font-mono text-sm font-bold uppercase tracking-wider mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {t('plaqueInitiative.stolpersteine.title', {
                defaultValue: 'Alongside the Stolpersteine, not instead of them',
              })}
            </h3>
            <p
              className="font-['Inter'] text-sm leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('plaqueInitiative.stolpersteine.text', {
                defaultValue:
                  'Gunter Demnig’s Stolpersteine mark where people lived — the last address they chose freely. These plaques mark where they worked: the shop, the workshop, the office, the thing they built and were dispossessed of. A city needs both, and where a Stolperstein already stands at a business address, the plaque names it.',
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Support */}
      <section
        className="px-5 sm:px-8 py-14 sm:py-20 border-t"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p
                className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
                style={{ color: 'var(--primary)' }}
              >
                {t('plaqueInitiative.support.eyebrow', { defaultValue: 'Take part' })}
              </p>
              <h2
                className="font-kame text-3xl sm:text-5xl leading-tight mb-5"
                style={{ color: 'var(--foreground)' }}
              >
                {t('plaqueInitiative.support.title', { defaultValue: 'Choose one address.' })}
              </h2>
              <p
                className="font-['Inter'] text-base leading-relaxed mb-8"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {t('plaqueInitiative.support.text', {
                  defaultValue:
                    'A sponsored plaque covers the plate, the cutting and the mounting for one address, and the record behind it stays public forever. Institutions can adopt a street or a trade; a school can adopt the businesses on its own block.',
                })}
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="mailto:info@storytimemaps.com?subject=Memorial%20plaque%20—%20sponsor%20an%20address"
                  className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
                >
                  {t('plaqueInitiative.support.ctaSponsor', { defaultValue: 'Sponsor a plaque' })}
                </a>
                <a
                  href="mailto:info@storytimemaps.com?subject=Memorial%20plaques%20—%20partnership"
                  className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider border transition-opacity hover:opacity-80"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  {t('plaqueInitiative.support.ctaPartner', { defaultValue: 'Partner with us' })}
                </a>
              </div>
            </div>

            <div>
              <h3
                className="font-mono text-sm font-bold uppercase tracking-wider mb-5"
                style={{ color: 'var(--foreground)' }}
              >
                {t('plaqueInitiative.support.whoTitle', { defaultValue: 'Who we work with' })}
              </h3>
              <ul className="grid gap-px mb-8" style={{ backgroundColor: 'var(--border)' }}>
                {partners.map((p) => (
                  <li
                    key={p}
                    className="p-4 font-mono text-sm"
                    style={{
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground-muted)',
                    }}
                  >
                    {p}
                  </li>
                ))}
              </ul>

              <div className="border-l-4 pl-5 py-1" style={{ borderColor: 'var(--primary)' }}>
                <p
                  className="font-['Inter'] text-sm leading-relaxed mb-3"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {t('plaqueInitiative.support.grant', {
                    defaultValue:
                      'The plaque programme is funded by Stiftung Zurückgeben, and every plate says so. The exhibition puts both formats on a table where they can be picked up and read.',
                  })}
                </p>
                <Link
                  href="/exhibit-vision"
                  className="font-mono text-xs uppercase tracking-wider"
                  style={{ color: 'var(--primary)' }}
                >
                  {t('plaqueInitiative.support.exhibitLink', { defaultValue: 'The exhibition' })}{' '}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default React.memo(PlaqueSupport)
