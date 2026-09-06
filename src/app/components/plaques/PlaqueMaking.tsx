'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * Who qualifies for a plaque, and how the plate is actually produced.
 *
 * The funnel numbers are computed by the same code that emits the plaques —
 * isComplete() in scripts/lightburn-businesses.js decides eligibility — so
 * the figures quoted here are the ones the generator would produce today.
 * The fabrication facts come from the generator's own header.
 */

const FUNNEL: Array<{
  value: number
  labelKey: string
  labelFallback: string
  noteKey: string
  noteFallback: string
  color: string
}> = [
  {
    value: 10021,
    labelKey: 'plaqueInitiative.funnel.allLabel',
    labelFallback: 'Records in the archive',
    noteKey: 'plaqueInitiative.funnel.allNote',
    noteFallback: 'Every business the database holds, re-verified against the source in 2026.',
    color: 'var(--muted)',
  },
  {
    value: 2761,
    labelKey: 'plaqueInitiative.funnel.curatedLabel',
    labelFallback: 'Carrying a trade and a date',
    noteKey: 'plaqueInitiative.funnel.curatedNote',
    noteFallback:
      'Records complete enough to place in time as well as space. The rest are directory entries: a name and an address.',
    color: 'var(--warning)',
  },
  {
    value: 2464,
    labelKey: 'plaqueInitiative.funnel.eligibleLabel',
    labelFallback: 'Eligible for a plaque',
    noteKey: 'plaqueInitiative.funnel.eligibleNote',
    noteFallback:
      'All four facts present, address inside Berlin, trade specific enough to name. Across 24 different trades.',
    color: 'var(--success)',
  },
  {
    value: 16,
    labelKey: 'plaqueInitiative.funnel.narrativeLabel',
    labelFallback: 'With a researched narrative',
    noteKey: 'plaqueInitiative.funnel.narrativeNote',
    noteFallback:
      'The only records that can carry the large format, because only they have a story and a storefront to engrave.',
    color: 'var(--danger)',
  },
]

const PlaqueMaking: React.FC = () => {
  const { t } = useTranslation()

  const max = FUNNEL[0].value

  const craft = [
    {
      n: '01',
      title: t('plaqueInitiative.craft.c1Title', { defaultValue: 'Two-tone plate' }),
      text: t('plaqueInitiative.craft.c1Text', {
        defaultValue:
          '1.3 mm engraving plate: a coloured cap layer over a contrasting core. The laser removes the cap, and the letter is the core showing through. Nothing is painted, so nothing fades off it.',
      }),
    },
    {
      n: '02',
      title: t('plaqueInitiative.craft.c2Title', { defaultValue: 'Two readings, one artwork' }),
      text: t('plaqueInitiative.craft.c2Text', {
        defaultValue:
          'Each plaque is emitted twice. The positive engraves the lettering; the negative engraves everything except it, leaving the text standing in cap colour. A wall gets whichever reading suits its light.',
      }),
    },
    {
      n: '03',
      title: t('plaqueInitiative.craft.c3Title', { defaultValue: 'Nothing thinner than 0.3 mm' }),
      text: t('plaqueInitiative.craft.c3Text', {
        defaultValue:
          'Below roughly a quarter of a millimetre the laser kerf swallows the line and the two-tone contrast is lost. Every hairline in the source artwork is widened before it is outlined.',
      }),
    },
    {
      n: '04',
      title: t('plaqueInitiative.craft.c4Title', { defaultValue: 'The QR sits on an island' }),
      text: t('plaqueInitiative.craft.c4Text', {
        defaultValue:
          'In the negative reading the code is left on an unengraved island, so its quiet zone survives the inversion and a phone can still read it in the street.',
      }),
    },
    {
      n: '05',
      title: t('plaqueInitiative.craft.c5Title', { defaultValue: 'Real millimetres' }),
      text: t('plaqueInitiative.craft.c5Text', {
        defaultValue:
          'One SVG unit is one millimetre, so a file lands in the cutting software at exactly its stated size. Text is converted to outlines first: the plate cannot depend on a font being installed.',
      }),
    },
    {
      n: '06',
      title: t('plaqueInitiative.craft.c6Title', { defaultValue: 'Checked before it is cut' }),
      text: t('plaqueInitiative.craft.c6Text', {
        defaultValue:
          'A verification pass refuses any file that has drifted — wrong dimensions, stray strokes, live text, or a missing funder line. Material is not spent on a plate that would be wrong.',
      }),
    },
  ]

  return (
    <>
      {/* Eligibility */}
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
              {t('plaqueInitiative.funnel.eyebrow', { defaultValue: 'Eligibility' })}
            </p>
            <h2
              className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {t('plaqueInitiative.funnel.title', {
                defaultValue: 'Not every record can have one.',
              })}
            </h2>
            <p
              className="font-['Inter'] text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('plaqueInitiative.funnel.intro', {
                defaultValue:
                  'A plaque has to state four facts: the business name, the trade, the address, and the dates. A record missing any of them is not eligible, and the gap is never filled with a plausible guess. That rule is enforced in the code that generates the plaques, not by hand.',
              })}
            </p>
          </div>

          <div className="grid gap-px mb-8" style={{ backgroundColor: 'var(--border)' }}>
            {FUNNEL.map((row) => (
              <div key={row.labelKey} className="p-6" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                  <span
                    className="font-mono text-sm font-bold uppercase tracking-wider"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {t(row.labelKey, { defaultValue: row.labelFallback })}
                  </span>
                  <span
                    className="font-mono text-2xl font-bold leading-none"
                    style={{ color: row.color }}
                  >
                    {row.value.toLocaleString('en-GB')}
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="h-2 mb-3"
                  style={{ backgroundColor: 'var(--background)' }}
                >
                  <div
                    className="h-full"
                    style={{
                      // A pure proportional bar makes the last row invisible, so the
                      // scale is square-rooted: 16 out of 10,021 still reads as a mark
                      // on the page while staying visibly tiny next to the others.
                      width: `${Math.max(Math.sqrt(row.value / max) * 100, 1.5)}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
                <p
                  className="font-['Inter'] text-sm leading-relaxed"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {t(row.noteKey, { defaultValue: row.noteFallback })}
                </p>
              </div>
            ))}
          </div>

          <p className="font-mono text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {t('plaqueInitiative.funnel.scaleNote', {
              defaultValue:
                'Bar lengths are scaled non-linearly so the smallest group stays visible. Figures are counted from the archive at build time.',
            })}
          </p>
        </div>
      </section>

      {/* How they are made */}
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
              {t('plaqueInitiative.craft.eyebrow', { defaultValue: 'Fabrication' })}
            </p>
            <h2
              className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {t('plaqueInitiative.craft.title', { defaultValue: 'Made to survive a street.' })}
            </h2>
            <p
              className="font-['Inter'] text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('plaqueInitiative.craft.intro', {
                defaultValue:
                  'The plaques are cut, not printed. Everything below is a constraint the artwork is built to, so that a file can go from the archive to a laser bed without anyone redrawing it.',
              })}
            </p>
          </div>

          <div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px"
            style={{ backgroundColor: 'var(--border)' }}
          >
            {craft.map((c) => (
              <article key={c.n} className="p-7" style={{ backgroundColor: 'var(--background)' }}>
                <span
                  className="font-mono text-3xl font-bold block mb-4"
                  style={{ color: 'var(--primary)' }}
                >
                  {c.n}
                </span>
                <h3
                  className="font-mono text-base font-bold mb-3"
                  style={{ color: 'var(--foreground)' }}
                >
                  {c.title}
                </h3>
                <p
                  className="font-['Inter'] text-sm leading-relaxed"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {c.text}
                </p>
              </article>
            ))}
          </div>

          <p
            className="font-['Inter'] text-sm leading-relaxed mt-8 max-w-3xl"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('plaqueInitiative.craft.outro', {
              defaultValue:
                'Five plaques exist as finished cutting files today — one narrative and four compact — as the prototype set. The remaining 2,459 eligible records are a question of funding and permission, not of research.',
            })}{' '}
            <Link href="/map" style={{ color: 'var(--primary)' }}>
              {t('plaqueInitiative.craft.outroLink', {
                defaultValue: 'Find an address on the map',
              })}
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  )
}

export default React.memo(PlaqueMaking)
