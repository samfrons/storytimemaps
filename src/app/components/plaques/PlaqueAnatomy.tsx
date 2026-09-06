'use client'

import React from 'react'
import Image from 'next/image'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * What is actually written on a plaque, and why each line is there.
 *
 * The German strings quoted here are the ones the generator writes — the
 * GEDENKTAFEL / HIER STAND labels and the standing context line from
 * scripts/generate-lightburn-plaque.js. They are quoted, not paraphrased,
 * because the wording is a project rule: "enteignet und liquidiert" is what
 * the records document, and softer or louder verbs would misstate it.
 */
const PlaqueAnatomy: React.FC = () => {
  const { t } = useTranslation()

  const parts = [
    {
      n: '01',
      de: 'GEDENKTAFEL',
      title: t('plaqueInitiative.anatomy.p1Title', { defaultValue: 'It says what it is' }),
      text: t('plaqueInitiative.anatomy.p1Text', {
        defaultValue:
          'A memorial plate, labelled as one. Without the label a passer-by reads a shop name and a pair of dates and has no reason to stop.',
      }),
    },
    {
      n: '02',
      de: 'HIER STAND',
      title: t('plaqueInitiative.anatomy.p2Title', { defaultValue: '“Here stood”' }),
      text: t('plaqueInitiative.anatomy.p2Text', {
        defaultValue:
          'The plaque is fixed to the building the business traded in. It speaks about this doorway, not about the period in general.',
      }),
    },
    {
      n: '03',
      de: 'Name · Branche · Adresse · Jahre',
      title: t('plaqueInitiative.anatomy.p3Title', { defaultValue: 'The four facts' }),
      text: t('plaqueInitiative.anatomy.p3Text', {
        defaultValue:
          'Business name, trade, address, start and end year. A record missing any of the four does not get a plaque — the gap is never filled with a guess.',
      }),
    },
    {
      n: '04',
      de: 'Jüdisches Unternehmen, unter nationalsozialistischer Herrschaft enteignet und liquidiert.',
      title: t('plaqueInitiative.anatomy.p4Title', { defaultValue: 'The context line' }),
      text: t('plaqueInitiative.anatomy.p4Text', {
        defaultValue:
          '“A Jewish business, expropriated and liquidated under National Socialist rule.” Expropriation under the “Aryanisation” programme, then wind-up — which is where the end date in the database comes from.',
      }),
    },
    {
      n: '05',
      de: 'Stiftung Zurückgeben',
      title: t('plaqueInitiative.anatomy.p5Title', { defaultValue: 'The funder, in the field' }),
      text: t('plaqueInitiative.anatomy.p5Text', {
        defaultValue:
          'Every plaque this project produces carries the funding attribution, set as a thin-and-bold lock-up. Not only in the paperwork — on the object, in the street.',
      }),
    },
    {
      n: '06',
      de: 'QR → b3rlin.storytimemaps.com',
      title: t('plaqueInitiative.anatomy.p6Title', { defaultValue: 'A way back to the file' }),
      text: t('plaqueInitiative.anatomy.p6Text', {
        defaultValue:
          'The code opens that business’s record on the map: sources, dates, the district around it, and whatever narrative research exists. The plate is 100 mm tall; the archive behind it is not.',
      }),
    },
  ]

  const formats = [
    {
      size: '300 × 200 mm',
      name: t('plaqueInitiative.formats.narrativeName', { defaultValue: 'Narrative plaque' }),
      img: '/plaques/lightburn/e-braun-300x200-field.svg',
      alt: t('plaqueInitiative.formats.narrativeAlt', {
        defaultValue:
          'The larger narrative plaque, with body text, an engraved storefront illustration and a QR code.',
      }),
      w: 1200,
      h: 800,
      rows: [
        [
          t('plaqueInitiative.formats.forLabel', { defaultValue: 'For' }),
          t('plaqueInitiative.formats.narrativeFor', {
            defaultValue: 'The 16 featured stories — records with researched narrative',
          }),
        ],
        [
          t('plaqueInitiative.formats.carriesLabel', { defaultValue: 'Carries' }),
          t('plaqueInitiative.formats.narrativeCarries', {
            defaultValue: 'Body copy plus a line engraving of the storefront',
          }),
        ],
        [
          t('plaqueInitiative.formats.contextLabel', { defaultValue: 'Context' }),
          t('plaqueInitiative.formats.narrativeContext', {
            defaultValue: 'Told in the body text itself',
          }),
        ],
      ],
    },
    {
      size: '300 × 100 mm',
      name: t('plaqueInitiative.formats.compactName', { defaultValue: 'Compact plaque' }),
      img: '/plaques/lightburn/a-breslauer-300x100-field.svg',
      alt: t('plaqueInitiative.formats.compactAlt', {
        defaultValue:
          'The compact plaque: label, business name, trade and address, years, context line, funder and QR code.',
      }),
      w: 1200,
      h: 400,
      rows: [
        [
          t('plaqueInitiative.formats.forLabel', { defaultValue: 'For' }),
          t('plaqueInitiative.formats.compactFor', {
            defaultValue: 'The long tail — 2,464 records with the four facts and nothing more',
          }),
        ],
        [
          t('plaqueInitiative.formats.carriesLabel', { defaultValue: 'Carries' }),
          t('plaqueInitiative.formats.compactCarries', {
            defaultValue: 'No illustration. The record, stated, and then it stops',
          }),
        ],
        [
          t('plaqueInitiative.formats.contextLabel', { defaultValue: 'Context' }),
          t('plaqueInitiative.formats.compactContext', {
            defaultValue: 'The standing context line at the foot',
          }),
        ],
      ],
    },
  ]

  return (
    <>
      {/* Anatomy */}
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
              {t('plaqueInitiative.anatomy.eyebrow', { defaultValue: 'Anatomy' })}
            </p>
            <h2
              className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {t('plaqueInitiative.anatomy.title', { defaultValue: 'Six things on one plate.' })}
            </h2>
            <p
              className="font-['Inter'] text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('plaqueInitiative.anatomy.intro', {
                defaultValue:
                  'Nothing on a plaque is decoration. Each line answers a question a stranger walking past would otherwise have to guess at.',
              })}
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-start">
            <figure className="border lg:sticky lg:top-24" style={{ borderColor: 'var(--border)' }}>
              <Image
                src="/plaques/lightburn/a-breslauer-300x100-field.svg"
                unoptimized
                alt={t('plaqueInitiative.anatomy.imageAlt', {
                  defaultValue:
                    'A compact memorial plaque reading GEDENKTAFEL, HIER STAND, A. BRESLAUER, the trade and address, the years, the German context line, the funder Stiftung Zurückgeben, and a QR code.',
                })}
                width={1200}
                height={400}
                className="w-full h-auto"
                style={{ backgroundColor: 'var(--card-bg)' }}
              />
              <figcaption
                className="p-5 border-t"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
              >
                <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {t('plaqueInitiative.anatomy.imageCaption', {
                    defaultValue:
                      'Compact format, 300 × 100 mm, shown at the size it is cut. Actual production file.',
                  })}
                </p>
              </figcaption>
            </figure>

            <ol className="grid gap-px" style={{ backgroundColor: 'var(--border)' }}>
              {parts.map((p) => (
                <li key={p.n} className="p-6" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <div className="flex items-baseline gap-4 mb-2">
                    <span
                      aria-hidden="true"
                      className="font-mono text-2xl font-bold flex-shrink-0"
                      style={{ color: 'var(--primary)' }}
                    >
                      {p.n}
                    </span>
                    <h3
                      className="font-mono text-base font-bold"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {p.title}
                    </h3>
                  </div>
                  <p
                    lang="de"
                    className="font-mono text-xs leading-relaxed mb-3 pl-10"
                    style={{ color: 'var(--primary)' }}
                  >
                    {p.de}
                  </p>
                  <p
                    className="font-['Inter'] text-sm leading-relaxed pl-10"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {p.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Formats */}
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
              {t('plaqueInitiative.formats.eyebrow', { defaultValue: 'Two formats' })}
            </p>
            <h2
              className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {t('plaqueInitiative.formats.title', {
                defaultValue: 'The size follows the evidence.',
              })}
            </h2>
            <p
              className="font-['Inter'] text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('plaqueInitiative.formats.intro', {
                defaultValue:
                  'A business we can tell a story about gets a plaque with room for the story. A business we hold four facts about gets a plaque that states four facts. Neither is padded to fill the plate.',
              })}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {formats.map((f) => (
              <article
                key={f.size}
                className="border flex flex-col"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
              >
                <Image
                  src={f.img}
                  unoptimized
                  alt={f.alt}
                  width={f.w}
                  height={f.h}
                  className="w-full h-auto border-b"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
                />
                <div className="p-7">
                  <div className="flex items-baseline justify-between mb-4">
                    <h3
                      className="font-mono text-lg font-bold"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {f.name}
                    </h3>
                    <span
                      className="font-mono text-xs uppercase tracking-[0.2em]"
                      style={{ color: 'var(--primary)' }}
                    >
                      {f.size}
                    </span>
                  </div>
                  <dl className="grid gap-3">
                    {f.rows.map(([label, value]) => (
                      <div key={label}>
                        <dt
                          className="font-mono text-[10px] uppercase tracking-[0.25em] mb-1"
                          style={{ color: 'var(--muted)' }}
                        >
                          {label}
                        </dt>
                        <dd
                          className="font-['Inter'] text-sm leading-relaxed"
                          style={{ color: 'var(--foreground-muted)' }}
                        >
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default React.memo(PlaqueAnatomy)
