'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'
import ExhibitFigure from './ExhibitFigure'

/**
 * The exhibition itself: what a visitor does, and the four things in the room
 * that let them do it.
 *
 * Station 02 is the only one that already exists as working software — it is
 * the kiosk at /museum-exhibit, running the same dataset as the public map.
 * That distinction is stated on the card rather than left for a venue to
 * discover.
 */
const ExhibitStations: React.FC = () => {
  const { t } = useTranslation()

  const journey = [
    {
      step: '01',
      title: t('exhibit.journey.step1Title', { defaultValue: 'Walk in and look down' }),
      text: t('exhibit.journey.step1Text', {
        defaultValue:
          'There is no wall text to read first. The city is on the floor, unlabelled except for district outlines, and the lights on it are already moving through the years.',
      }),
    },
    {
      step: '02',
      title: t('exhibit.journey.step2Title', { defaultValue: 'Find one street' }),
      text: t('exhibit.journey.step2Text', {
        defaultValue:
          'At the lectern a visitor types the street they live on, work on, or came in on. The floor answers: every business the archive holds for that street lights up at once.',
      }),
    },
    {
      step: '03',
      title: t('exhibit.journey.step3Title', { defaultValue: 'Move the years' }),
      text: t('exhibit.journey.step3Text', {
        defaultValue:
          'A single slider runs 1900 to 1945. Pushed forward it turns points from open, to under pressure, to gone — 1933, 1935, 1938, 1941 each visible as a change in the room, not as a caption.',
      }),
    },
    {
      step: '04',
      title: t('exhibit.journey.step4Title', { defaultValue: 'Leave with a name' }),
      text: t('exhibit.journey.step4Text', {
        defaultValue:
          'The exit station prints one record on a card: a business, its owner, its address, its dates. Visitors are asked to take one — and, if they want, to say the name out loud once before they go.',
      }),
    },
  ]

  return (
    <>
      {/* What a visitor does */}
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
              {t('exhibit.journey.eyebrow', { defaultValue: 'The visit' })}
            </p>
            <h2
              className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {t('exhibit.journey.title', { defaultValue: 'Four minutes, or forty.' })}
            </h2>
            <p
              className="font-['Inter'] text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('exhibit.journey.intro', {
                defaultValue:
                  'The installation is designed to work at two speeds at once: legible to someone passing through a foyer in four minutes, and deep enough to hold a school group for forty. Nothing needs to be read in order, and nothing needs a guide.',
              })}
            </p>
          </div>

          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {journey.map(({ step, title, text }) => (
              <li
                key={step}
                className="border p-6 flex flex-col"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
              >
                <span
                  className="font-mono text-4xl font-bold mb-5"
                  style={{ color: 'var(--primary)' }}
                >
                  {step}
                </span>
                <h3
                  className="font-mono text-base font-bold mb-3"
                  style={{ color: 'var(--foreground)' }}
                >
                  {title}
                </h3>
                <p
                  className="font-['Inter'] text-sm leading-relaxed"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The stations */}
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
              {t('exhibit.stations.eyebrow', { defaultValue: 'The room' })}
            </p>
            <h2
              className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {t('exhibit.stations.title', { defaultValue: 'Four things in one space.' })}
            </h2>
            <p
              className="font-['Inter'] text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('exhibit.stations.intro', {
                defaultValue:
                  'A floor, a screen, a wall and a table. Each can be dropped if a venue has less space — the floor and the screen are the two that carry the argument.',
              })}
            </p>
          </div>

          {/* Two explicit columns rather than a two-up grid. The stations are
              deliberately uneven — two carry a figure, two do not — and in a
              grid that left a column-height hole beside each short card. Pairing
              a short card with a tall one per column keeps the two sides level. */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-start">
            <div className="flex flex-col gap-10 lg:gap-12">
              {/* Station 01 — the floor */}
              <article
                className="border p-7 lg:p-8"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
              >
                <div className="flex items-baseline justify-between mb-6">
                  <span
                    className="font-mono text-4xl font-bold"
                    style={{ color: 'var(--primary)' }}
                  >
                    01
                  </span>
                  <span
                    className="font-mono text-[11px] uppercase tracking-[0.25em]"
                    style={{ color: 'var(--muted)' }}
                  >
                    {t('exhibit.stations.floorTag', { defaultValue: 'The floor · 16 m²' })}
                  </span>
                </div>
                <h3
                  className="font-mono text-lg font-bold mb-3"
                  style={{ color: 'var(--foreground)' }}
                >
                  {t('exhibit.stations.floorTitle', {
                    defaultValue: 'Berlin, cut into the ground',
                  })}
                </h3>
                <p
                  className="font-['Inter'] text-sm leading-relaxed mb-4"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {t('exhibit.stations.floorText', {
                    defaultValue:
                      'A 4 × 4 m city map, laser-etched into parquet or printed on hard-wearing vinyl for touring. District boundaries and the Spree are the only lines; there are no street names, so a visitor has to orient themselves the way they do in the actual city.',
                  })}
                </p>
                <p
                  className="font-['Inter'] text-sm leading-relaxed"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {t('exhibit.stations.floorText2', {
                    defaultValue:
                      'Twelve lit columns stand on the districts the archive documents most densely — Mitte, northern Kreuzberg, Charlottenburg. Each holds a vitrine: one business, one object, one page of its file.',
                  })}
                </p>
              </article>

              {/* Station 02 — the kiosk, with figure */}
              <div className="flex flex-col gap-6">
                <article
                  className="border p-7 lg:p-8"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
                >
                  <div className="flex items-baseline justify-between mb-6">
                    <span
                      className="font-mono text-4xl font-bold"
                      style={{ color: 'var(--primary)' }}
                    >
                      02
                    </span>
                    <span
                      className="font-mono text-[11px] uppercase tracking-[0.25em]"
                      style={{ color: 'var(--success)' }}
                    >
                      {t('exhibit.stations.kioskTag', { defaultValue: 'Built and running' })}
                    </span>
                  </div>
                  <h3
                    className="font-mono text-lg font-bold mb-3"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {t('exhibit.stations.kioskTitle', {
                      defaultValue: 'The screen and the lectern',
                    })}
                  </h3>
                  <p
                    className="font-['Inter'] text-sm leading-relaxed mb-4"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {t('exhibit.stations.kioskText', {
                      defaultValue:
                        'A projected wall map paired with a touch lectern. The visitor drives the year slider; the wall follows. Live counts of open, pressured, seized and closed businesses update as the year moves, and a strip of dated events explains what caused each drop.',
                    })}
                  </p>
                  <p
                    className="font-['Inter'] text-sm leading-relaxed mb-5"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {t('exhibit.stations.kioskText2', {
                      defaultValue:
                        'This station is not a rendering. The kiosk software is finished, runs in German, English and Yiddish, resets itself after three idle minutes, and returns to an attract loop with no attendant needed.',
                    })}
                  </p>
                  <Link
                    href="/museum-exhibit"
                    className="font-mono text-xs uppercase tracking-wider"
                    style={{ color: 'var(--primary)' }}
                  >
                    {t('exhibit.stations.kioskLink', { defaultValue: 'Open the kiosk build' })}{' '}
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>

                <ExhibitFigure
                  src="/images/exhibit/kiosk-in-gallery.webp"
                  alt={t('exhibit.figures.kioskAlt', {
                    defaultValue:
                      'A visitor at a touch lectern in a darkened gallery, facing a large projected map of Berlin with statistics panels and a time slider.',
                  })}
                  width={1047}
                  height={706}
                  eyebrow={t('exhibit.figures.kioskEyebrow', { defaultValue: 'Station 02' })}
                  caption={t('exhibit.figures.kioskCaption', {
                    defaultValue:
                      'The kiosk in situ. The screen content is the real interface — statistics, year slider, status key and historical-event strip — placed into a gallery setting.',
                  })}
                  disclosure={t('exhibit.figures.kioskDisclosure', {
                    defaultValue:
                      'Composite: actual software screenshot, simulated gallery. Room not yet built.',
                  })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-10 lg:gap-12">
              {/* Station 03 — timeline wall, with figure */}
              <div className="flex flex-col gap-6">
                <article
                  className="border p-7 lg:p-8"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
                >
                  <div className="flex items-baseline justify-between mb-6">
                    <span
                      className="font-mono text-4xl font-bold"
                      style={{ color: 'var(--primary)' }}
                    >
                      03
                    </span>
                    <span
                      className="font-mono text-[11px] uppercase tracking-[0.25em]"
                      style={{ color: 'var(--muted)' }}
                    >
                      {t('exhibit.stations.wallTag', {
                        defaultValue: 'The wall · 12 running metres',
                      })}
                    </span>
                  </div>
                  <h3
                    className="font-mono text-lg font-bold mb-3"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {t('exhibit.stations.wallTitle', { defaultValue: 'The law, in order' })}
                  </h3>
                  <p
                    className="font-['Inter'] text-sm leading-relaxed mb-4"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {t('exhibit.stations.wallText', {
                      defaultValue:
                        'A dated wall running 1920 to 1945, framed panel by framed panel: the April 1933 boycott, the exclusion from trade associations, the blocked accounts, the 1938 decree that forced the remaining businesses out of Jewish hands, the liquidations. Each panel names the measure, the date, and how many businesses in this archive end within twelve months of it.',
                    })}
                  </p>
                  <p
                    className="font-['Inter'] text-sm leading-relaxed"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {t('exhibit.stations.wallText2', {
                      defaultValue:
                        'The point of the wall is causation. Nothing on the floor goes dark by itself; every darkened point has a decree behind it and a beneficiary in front of it.',
                    })}
                  </p>
                </article>

                <ExhibitFigure
                  src="/images/exhibit/gallery-isometric-plan.webp"
                  alt={t('exhibit.figures.planAlt', {
                    defaultValue:
                      'Isometric line drawing of the exhibition space: a dated panel run along two walls, free-standing vitrines, and a raised relief map on a plinth.',
                  })}
                  width={1024}
                  height={1024}
                  eyebrow={t('exhibit.figures.planEyebrow', { defaultValue: 'Room study' })}
                  caption={t('exhibit.figures.planCaption', {
                    defaultValue:
                      'Plan study for the full build: the dated wall along two sides, vitrine columns free in the space, the map raised on a plinth for wheelchair-height reading where a floor map cannot be walked.',
                  })}
                />
              </div>

              {/* Station 04 — plaque table */}
              <article
                className="border p-7 lg:p-8"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
              >
                <div className="flex items-baseline justify-between mb-6">
                  <span
                    className="font-mono text-4xl font-bold"
                    style={{ color: 'var(--primary)' }}
                  >
                    04
                  </span>
                  <span
                    className="font-mono text-[11px] uppercase tracking-[0.25em]"
                    style={{ color: 'var(--muted)' }}
                  >
                    {t('exhibit.stations.tableTag', { defaultValue: 'The table · 2 × 1 m' })}
                  </span>
                </div>
                <h3
                  className="font-mono text-lg font-bold mb-3"
                  style={{ color: 'var(--foreground)' }}
                >
                  {t('exhibit.stations.tableTitle', { defaultValue: 'The plaques you can handle' })}
                </h3>
                <p
                  className="font-['Inter'] text-sm leading-relaxed mb-4"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {t('exhibit.stations.tableText', {
                    defaultValue:
                      'Finished memorial plaques laid flat and unglazed, so they can be picked up and read with the fingers. Both formats are on the table: the 300 × 200 mm narrative plaque with its engraved storefront, and the 300 × 100 mm compact plaque that states the four facts a record must have to earn one.',
                  })}
                </p>
                <p
                  className="font-['Inter'] text-sm leading-relaxed mb-5"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {t('exhibit.stations.tableText2', {
                    defaultValue:
                      '2,464 records in the archive are complete enough to be made into a plaque. The table is where a visitor understands that the exhibition is a working stage of something that ends up screwed to a wall in the street outside.',
                  })}
                </p>
                <Link
                  href="/plaques"
                  className="font-mono text-xs uppercase tracking-wider"
                  style={{ color: 'var(--primary)' }}
                >
                  {t('exhibit.stations.tableLink', { defaultValue: 'See the plaque initiative' })}{' '}
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default React.memo(ExhibitStations)
