'use client'

import React from 'react'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * The part of the page a venue's technical and programming staff read.
 *
 * Three scales rather than one proposal: the smallest is the kiosk that
 * already exists and needs no build at all, which is what makes the larger
 * two credible. Figures are stated as design targets — the honest label for
 * numbers that have not yet been through a venue's own survey.
 */
const ExhibitSpec: React.FC = () => {
  const { t } = useTranslation()

  const scales = [
    {
      key: 'A',
      name: t('exhibit.scales.aName', { defaultValue: 'The lectern' }),
      area: t('exhibit.scales.aArea', { defaultValue: '6–10 m²' }),
      status: t('exhibit.scales.aStatus', { defaultValue: 'Available now' }),
      statusColor: 'var(--success)',
      install: t('exhibit.scales.aInstall', { defaultValue: 'Half a day' }),
      includes: [
        t('exhibit.scales.aItem1', { defaultValue: 'Touchscreen lectern running the built kiosk' }),
        t('exhibit.scales.aItem2', { defaultValue: 'Optional wall projection of the same map' }),
        t('exhibit.scales.aItem3', { defaultValue: 'Three languages, unattended, self-resetting' }),
        t('exhibit.scales.aItem4', { defaultValue: 'Ships in two flight cases' }),
      ],
      forWhom: t('exhibit.scales.aFor', {
        defaultValue: 'Foyers, libraries, schools, conferences, a month-long trial before a room.',
      }),
    },
    {
      key: 'B',
      name: t('exhibit.scales.bName', { defaultValue: 'The room' }),
      area: t('exhibit.scales.bArea', { defaultValue: '35–50 m²' }),
      status: t('exhibit.scales.bStatus', { defaultValue: 'Design stage' }),
      statusColor: 'var(--warning)',
      install: t('exhibit.scales.bInstall', { defaultValue: '2 days' }),
      includes: [
        t('exhibit.scales.bItem1', { defaultValue: 'Printed 4 × 4 m floor map, touring vinyl' }),
        t('exhibit.scales.bItem2', { defaultValue: 'Projection wall plus the touch lectern' }),
        t('exhibit.scales.bItem3', { defaultValue: 'Six dated panels of the exclusion timeline' }),
        t('exhibit.scales.bItem4', { defaultValue: 'Plaque table with both formats' }),
      ],
      forWhom: t('exhibit.scales.bFor', {
        defaultValue: 'A temporary-exhibition slot, a district museum, a memorial site annexe.',
      }),
    },
    {
      key: 'C',
      name: t('exhibit.scales.cName', { defaultValue: 'The full installation' }),
      area: t('exhibit.scales.cArea', { defaultValue: '100–120 m²' }),
      status: t('exhibit.scales.cStatus', { defaultValue: 'Seeking a partner' }),
      statusColor: 'var(--danger)',
      install: t('exhibit.scales.cInstall', { defaultValue: '5 days' }),
      includes: [
        t('exhibit.scales.cItem1', { defaultValue: 'Floor map etched into the venue floor' }),
        t('exhibit.scales.cItem2', {
          defaultValue: 'Twelve lit vitrine columns with loan objects',
        }),
        t('exhibit.scales.cItem3', { defaultValue: '12 running metres of dated wall' }),
        t('exhibit.scales.cItem4', { defaultValue: 'Record-card print station at the exit' }),
      ],
      forWhom: t('exhibit.scales.cFor', {
        defaultValue: 'A city museum or memorial institution taking the work as a headline show.',
      }),
    },
  ]

  const spec: Array<[string, string]> = [
    [
      t('exhibit.spec.powerLabel', { defaultValue: 'Power' }),
      t('exhibit.spec.powerValue', {
        defaultValue:
          '2 × 230 V 16 A circuits for scale B; 4 for scale C, including column lighting.',
      }),
    ],
    [
      t('exhibit.spec.networkLabel', { defaultValue: 'Network' }),
      t('exhibit.spec.networkValue', {
        defaultValue:
          'None required. The dataset ships with the machine and runs offline; a connection is only used for content updates.',
      }),
    ],
    [
      t('exhibit.spec.lightLabel', { defaultValue: 'Light' }),
      t('exhibit.spec.lightValue', {
        defaultValue:
          'Low ambient, ≤ 80 lux on the floor map so the projected points read. No daylight on the projection wall.',
      }),
    ],
    [
      t('exhibit.spec.soundLabel', { defaultValue: 'Sound' }),
      t('exhibit.spec.soundValue', {
        defaultValue:
          'Silent by default. Deliberately: nothing in the room performs grief on the visitor’s behalf.',
      }),
    ],
    [
      t('exhibit.spec.hardwareLabel', { defaultValue: 'Hardware' }),
      t('exhibit.spec.hardwareValue', {
        defaultValue:
          '1 × 27–32" capacitive touchscreen, 1 × mini-PC, 1 × 5,000-lumen laser projector. Venue may substitute its own stock.',
      }),
    ],
    [
      t('exhibit.spec.contentLabel', { defaultValue: 'Content' }),
      t('exhibit.spec.contentValue', {
        defaultValue:
          '10,021 verified records; 2,761 with dates and trade; 16 with full researched narratives. Panel and label texts supplied in German and English, kiosk additionally in Yiddish.',
      }),
    ],
    [
      t('exhibit.spec.staffLabel', { defaultValue: 'Staffing' }),
      t('exhibit.spec.staffValue', {
        defaultValue:
          'Unattended operation. The kiosk returns to its attract loop after three idle minutes and needs no daily reset.',
      }),
    ],
    [
      t('exhibit.spec.accessLabel', { defaultValue: 'Accessibility' }),
      t('exhibit.spec.accessValue', {
        defaultValue:
          'Every floor-map function is duplicated at seated height on the lectern. Panel type at 24 pt minimum, contrast ≥ 7:1, plaques readable by touch, no strobing or sudden light changes.',
      }),
    ],
    [
      t('exhibit.spec.transportLabel', { defaultValue: 'Transport' }),
      t('exhibit.spec.transportValue', {
        defaultValue:
          'Scale A: two flight cases, courier. Scale B: one 7.5 t vehicle. Scale C: built in place.',
      }),
    ],
    [
      t('exhibit.spec.loansLabel', { defaultValue: 'Loans' }),
      t('exhibit.spec.loansValue', {
        defaultValue:
          'The installation carries no objects of its own. Vitrine contents at scale C would be borrowed, with the lending institution named on the column.',
      }),
    ],
  ]

  return (
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
            {t('exhibit.spec.eyebrow', { defaultValue: 'For technical and programming staff' })}
          </p>
          <h2
            className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            {t('exhibit.spec.title', { defaultValue: 'Three scales. Start at the smallest.' })}
          </h2>
          <p
            className="font-['Inter'] text-base sm:text-lg leading-relaxed"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('exhibit.spec.intro', {
              defaultValue:
                'The smallest scale needs no build, no carpentry and no attendant — it is the finished kiosk in a flight case, and it can be in a foyer within weeks. The larger two grow out of it. A venue never has to commit to the full room to show this work.',
            })}
          </p>
        </div>

        {/* Scales */}
        <div className="grid md:grid-cols-3 gap-5 mb-14">
          {scales.map((s) => (
            <article
              key={s.key}
              className="border p-7 flex flex-col"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
            >
              <div className="flex items-baseline justify-between mb-5">
                <span className="font-mono text-4xl font-bold" style={{ color: 'var(--primary)' }}>
                  {s.key}
                </span>
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-1"
                  style={{ backgroundColor: s.statusColor, color: 'var(--background)' }}
                >
                  {s.status}
                </span>
              </div>

              <h3
                className="font-mono text-lg font-bold mb-4"
                style={{ color: 'var(--foreground)' }}
              >
                {s.name}
              </h3>

              <dl
                className="grid grid-cols-2 gap-px mb-5"
                style={{ backgroundColor: 'var(--border)' }}
              >
                <div className="p-3" style={{ backgroundColor: 'var(--background)' }}>
                  <dt
                    className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1"
                    style={{ color: 'var(--muted)' }}
                  >
                    {t('exhibit.spec.areaLabel', { defaultValue: 'Area' })}
                  </dt>
                  <dd
                    className="font-mono text-sm font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {s.area}
                  </dd>
                </div>
                <div className="p-3" style={{ backgroundColor: 'var(--background)' }}>
                  <dt
                    className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1"
                    style={{ color: 'var(--muted)' }}
                  >
                    {t('exhibit.spec.installLabel', { defaultValue: 'Install' })}
                  </dt>
                  <dd
                    className="font-mono text-sm font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {s.install}
                  </dd>
                </div>
              </dl>

              <ul className="space-y-2 mb-5 flex-1">
                {s.includes.map((item) => (
                  <li
                    key={item}
                    className="font-['Inter'] text-sm leading-relaxed flex gap-2"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    <span aria-hidden="true" style={{ color: 'var(--primary)' }}>
                      —
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p
                className="font-['Inter'] text-sm leading-relaxed pt-4 border-t"
                style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
              >
                {s.forWhom}
              </p>
            </article>
          ))}
        </div>

        {/* Technical specification */}
        <h3
          className="font-mono text-sm uppercase tracking-[0.25em] mb-5"
          style={{ color: 'var(--foreground)' }}
        >
          {t('exhibit.spec.tableTitle', { defaultValue: 'Technical specification' })}
        </h3>

        <div className="grid sm:grid-cols-2 gap-px" style={{ backgroundColor: 'var(--border)' }}>
          {spec.map(([label, value]) => (
            <div key={label} className="p-5" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div
                className="font-mono text-[10px] uppercase tracking-[0.25em] mb-2"
                style={{ color: 'var(--primary)' }}
              >
                {label}
              </div>
              <p
                className="font-['Inter'] text-sm leading-relaxed"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        <p className="font-mono text-[11px] leading-relaxed mt-5" style={{ color: 'var(--muted)' }}>
          {t('exhibit.spec.disclaimer', {
            defaultValue:
              'Figures are design targets, not a surveyed build. Every dimension adjusts to the host venue — the only fixed requirement is that a visitor can stand on the city.',
          })}
        </p>
      </div>
    </section>
  )
}

export default React.memo(ExhibitSpec)
