'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * How the room behaves, what it still needs, and who to write to.
 *
 * The ethics block is first on purpose: it is the part a memorial institution
 * assesses before it looks at the floor plan, and it is the part that commits
 * the design to what the CLAUDE.md rules already commit the plaques to —
 * naming the measures and the beneficiaries rather than dramatising the loss.
 */
const ExhibitPartners: React.FC = () => {
  const { t } = useTranslation()

  const principles = [
    {
      title: t('exhibit.ethics.p1Title', { defaultValue: 'No reenactment' }),
      text: t('exhibit.ethics.p1Text', {
        defaultValue:
          'Nobody is asked to imagine being a victim, and nobody plays a perpetrator. The visitor is a neighbour standing in a street, which is the only honest position the room can offer.',
      }),
    },
    {
      title: t('exhibit.ethics.p2Title', { defaultValue: 'Name the actors' }),
      text: t('exhibit.ethics.p2Text', {
        defaultValue:
          'Businesses in this archive did not “fail” and did not “disappear”. They were boycotted, denied licences, forcibly transferred and liquidated — by a state, and by local competitors and neighbours who profited. The wall texts use the active voice throughout.',
      }),
    },
    {
      title: t('exhibit.ethics.p3Title', { defaultValue: 'Mark the euphemism' }),
      text: t('exhibit.ethics.p3Text', {
        defaultValue:
          '“Arisierung” is the word in the files, so it appears — always marked as a Nazi term, always paired with what it actually describes: expropriation followed by wind-up.',
      }),
    },
    {
      title: t('exhibit.ethics.p4Title', { defaultValue: 'No spectacle' }),
      text: t('exhibit.ethics.p4Text', {
        defaultValue:
          'No images of violence, no soundtrack, no deportation used as a closing reveal. The room is quiet and the data is allowed to be as bad as it is without help.',
      }),
    },
  ]

  const asks = [
    {
      title: t('exhibit.asks.a1Title', { defaultValue: 'A venue and a slot' }),
      text: t('exhibit.asks.a1Text', {
        defaultValue:
          'A museum, memorial site, library, university or district hall willing to take scale A for a month, or scale B for a season. The lectern needs 6 m² and a socket.',
      }),
    },
    {
      title: t('exhibit.asks.a2Title', { defaultValue: 'Fabrication funding' }),
      text: t('exhibit.asks.a2Text', {
        defaultValue:
          'The floor map, the vitrine columns and the panel run are the costed items. The software, the dataset and the design are already funded and finished.',
      }),
    },
    {
      title: t('exhibit.asks.a3Title', { defaultValue: 'Objects on loan' }),
      text: t('exhibit.asks.a3Text', {
        defaultValue:
          'Twelve columns, twelve businesses, twelve objects or documents — a ledger, a letterhead, a trade licence, a photograph of a shopfront. Lenders are named on the column.',
      }),
    },
    {
      title: t('exhibit.asks.a4Title', { defaultValue: 'Scholarly review' }),
      text: t('exhibit.asks.a4Text', {
        defaultValue:
          'A historian or institution to read the panel texts before they are cut, and to check the dated timeline against the current literature.',
      }),
    },
  ]

  return (
    <>
      {/* How the room behaves */}
      <section
        className="px-5 sm:px-8 py-14 sm:py-20 border-t"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-10">
            <p
              className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
              style={{ color: 'var(--primary)' }}
            >
              {t('exhibit.ethics.eyebrow', { defaultValue: 'How the room behaves' })}
            </p>
            <h2
              className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {t('exhibit.ethics.title', { defaultValue: 'Four rules the design does not break.' })}
            </h2>
            <p
              className="font-['Inter'] text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('exhibit.ethics.intro', {
                defaultValue:
                  'These are the same rules the classroom workbook and the memorial plaques are written under. They are not a statement of intent; they are constraints on what may be built.',
              })}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-px" style={{ backgroundColor: 'var(--border)' }}>
            {principles.map((p) => (
              <article
                key={p.title}
                className="p-7"
                style={{ backgroundColor: 'var(--background)' }}
              >
                <h3
                  className="font-mono text-base font-bold mb-3"
                  style={{ color: 'var(--foreground)' }}
                >
                  {p.title}
                </h3>
                <p
                  className="font-['Inter'] text-sm leading-relaxed"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {p.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* What it needs */}
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
              {t('exhibit.asks.eyebrow', { defaultValue: 'What it needs' })}
            </p>
            <h2
              className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {t('exhibit.asks.title', { defaultValue: 'Four things, in this order.' })}
            </h2>
          </div>

          <ol className="grid sm:grid-cols-2 gap-5 mb-12">
            {asks.map((ask, i) => (
              <li
                key={ask.title}
                className="border p-7 flex gap-5"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
              >
                <span
                  aria-hidden="true"
                  className="font-mono text-3xl font-bold leading-none flex-shrink-0"
                  style={{ color: 'var(--primary)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3
                    className="font-mono text-base font-bold mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {ask.title}
                  </h3>
                  <p
                    className="font-['Inter'] text-sm leading-relaxed"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {ask.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Provenance */}
          <div
            className="border p-7 sm:p-8 mb-12"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
          >
            <h3
              className="font-mono text-sm font-bold uppercase tracking-wider mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {t('exhibit.provenance.title', { defaultValue: 'What the room is built on' })}
            </h3>
            <p
              className="font-['Inter'] text-sm leading-relaxed mb-4"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('exhibit.provenance.text', {
                defaultValue:
                  'Every point of light is a record from the Datenbank jüdischer Gewerbebetriebe in Berlin at Humboldt-Universität zu Berlin — the scholarly database grounded in Dr. Christoph Kreutzmüller’s research — re-verified against the original source in 2026, with archival material informed by the Leo Baeck Institute. No business in the installation is a composite, an illustration, or a reconstruction.',
              })}
            </p>
            <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              {t('exhibit.provenance.grant', {
                defaultValue:
                  'The memorial plaque programme shown at station 04 is funded by Stiftung Zurückgeben.',
              })}
            </p>
          </div>

          {/* Contact */}
          <div className="max-w-3xl">
            <h2
              className="font-kame text-2xl sm:text-4xl leading-tight mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {t('exhibit.contact.title', { defaultValue: 'Write to us about a room.' })}
            </h2>
            <p
              className="font-['Inter'] text-base leading-relaxed mb-8"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('exhibit.contact.text', {
                defaultValue:
                  'Tell us the space you have and the months it is free. We will send a floor plan sized to it, the panel texts as they stand, and a date we could install.',
              })}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:info@storytimemaps.com?subject=Exhibition%20hosting%20enquiry"
                className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
              >
                {t('exhibit.contact.cta', { defaultValue: 'Enquire about hosting' })}
              </a>
              <Link
                href="/education"
                className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider border transition-opacity hover:opacity-80"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                {t('exhibit.contact.education', { defaultValue: 'The school programme' })}{' '}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default React.memo(ExhibitPartners)
