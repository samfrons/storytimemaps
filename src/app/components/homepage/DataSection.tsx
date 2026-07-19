'use client'

import React, { useMemo } from 'react'
import { useTranslation } from '../../../i18n/useTranslation'
import { formatCount, type HomepagePointsData } from './homepageData'

interface DataSectionProps {
  data: HomepagePointsData | null
}

// Values computed from the shipped dataset; used until (or in case) the
// live points file cannot be fetched.
const FALLBACK = {
  total: 10021,
  plotted: 8838,
  closedInEra: 9679,
  closingsByYear: {
    '1930': 14,
    '1931': 36,
    '1932': 151,
    '1933': 237,
    '1934': 253,
    '1935': 377,
    '1936': 672,
    '1937': 799,
    '1938': 1498,
    '1939': 2195,
    '1940': 1074,
    '1941': 370,
    '1942': 88,
    '1943': 44,
    '1944': 11,
    '1945': 2061,
  } as Record<string, number>,
}

const CHART_YEARS = Array.from({ length: 16 }, (_, i) => 1930 + i)

const barColor = (year: number): string => {
  if (year < 1933) return 'var(--muted)'
  if (year < 1938) return 'var(--warning)'
  return 'var(--danger)'
}

/**
 * The record in numbers: headline statistics and the closings-per-year
 * chart whose shape — the 1938/39 surge — is the argument of the site.
 */
const DataSection: React.FC<DataSectionProps> = ({ data }) => {
  const { t, language } = useTranslation()

  const { total, plotted, closingsByYear, closedInEra, maxClosings } = useMemo(() => {
    const closings = data?.closingsByYear ?? FALLBACK.closingsByYear
    const closedTotal = Object.entries(closings)
      .filter(([year]) => Number(year) >= 1933)
      .reduce((sum, [, count]) => sum + count, 0)
    return {
      total: data?.total ?? FALLBACK.total,
      plotted: data?.plotted ?? FALLBACK.plotted,
      closingsByYear: closings,
      closedInEra: closedTotal || FALLBACK.closedInEra,
      maxClosings: Math.max(...CHART_YEARS.map((y) => closings[String(y)] ?? 0), 1),
    }
  }, [data])

  const stats = [
    {
      value: formatCount(total, language),
      label: t('homepage.data.statDocumented', { defaultValue: 'Businesses documented' }),
    },
    {
      value: formatCount(plotted, language),
      label: t('homepage.data.statMapped', { defaultValue: 'Mapped to street addresses' }),
    },
    {
      value: formatCount(closedInEra, language),
      label: t('homepage.data.statClosed', { defaultValue: 'Closed between 1933 and 1945' }),
    },
    {
      value: '45',
      label: t('homepage.data.statYears', { defaultValue: 'Years of history covered' }),
    },
  ]

  const annotations = [
    {
      color: 'var(--warning)',
      text: t('homepage.data.note1933', { defaultValue: '1933 — the April boycott begins' }),
    },
    {
      color: 'var(--danger)',
      text: t('homepage.data.note1938', {
        defaultValue: '1938–39 — “Aryanization” and Kristallnacht',
      }),
    },
    {
      color: 'var(--danger)',
      text: t('homepage.data.note1945', {
        defaultValue: '1945 — liquidations recorded by the war’s end',
      }),
    },
  ]

  return (
    <section
      className="py-20 sm:py-28 px-5 sm:px-8"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-14">
          <p
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--primary)' }}
          >
            {t('homepage.data.eyebrow', { defaultValue: 'The record' })}
          </p>
          <h2
            className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            {t('homepage.data.title', { defaultValue: 'The numbers tell the story' })}
          </h2>
          <p
            className="font-['Inter'] text-base sm:text-lg leading-relaxed"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('homepage.data.intro', {
              defaultValue:
                'Every figure below comes from the same archive the map draws from. The shape of the chart is the history: pressure building through the 1930s, then the catastrophe of 1938.',
            })}
          </p>
        </div>

        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-14"
          style={{ backgroundColor: 'var(--border)' }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-6 sm:p-8"
              style={{ backgroundColor: 'var(--card-bg)' }}
            >
              <div
                className="font-mono text-3xl sm:text-4xl font-bold tabular-nums mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                {stat.value}
              </div>
              <div
                className="font-mono text-[11px] sm:text-xs uppercase tracking-wider leading-relaxed"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div
          className="border p-6 sm:p-8"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
        >
          <h3
            className="font-mono text-sm font-bold uppercase tracking-wider mb-8"
            style={{ color: 'var(--foreground)' }}
          >
            {t('homepage.data.chartTitle', {
              defaultValue: 'Documented business closings per year, 1930–1945',
            })}
          </h3>

          <div
            role="img"
            aria-label={t('homepage.data.chartAlt', {
              defaultValue:
                'Bar chart of business closings per year from 1930 to 1945, peaking at 2,195 in 1939 and 2,061 in 1945',
            })}
          >
            <div className="flex items-end gap-1 sm:gap-1.5 h-52 sm:h-64">
              {CHART_YEARS.map((year) => {
                const count = closingsByYear[String(year)] ?? 0
                const isPeak = count > 0 && count >= maxClosings * 0.6
                return (
                  <div
                    key={year}
                    className="flex-1 flex flex-col justify-end h-full min-w-0"
                    title={`${year}: ${formatCount(count, language)}`}
                  >
                    {isPeak && (
                      <span
                        className="font-mono text-[10px] sm:text-xs text-center tabular-nums mb-1"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {formatCount(count, language)}
                      </span>
                    )}
                    <div
                      style={{
                        height: `${Math.max((count / maxClosings) * 100, 1)}%`,
                        backgroundColor: barColor(year),
                        opacity: year < 1933 ? 0.5 : 1,
                      }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex gap-1 sm:gap-1.5 mt-2">
              {CHART_YEARS.map((year) => (
                <div
                  key={year}
                  className="flex-1 text-center font-mono text-[9px] sm:text-[11px] min-w-0"
                  style={{
                    color: [1933, 1938, 1945].includes(year) ? 'var(--foreground)' : 'var(--muted)',
                  }}
                >
                  {year % 5 === 0 || [1933, 1938].includes(year) ? `'${String(year).slice(2)}` : ''}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 mt-8">
            {annotations.map((note) => (
              <div key={note.text} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="w-3 h-3 flex-shrink-0"
                  style={{ backgroundColor: note.color }}
                />
                <span className="font-mono text-xs" style={{ color: 'var(--foreground-muted)' }}>
                  {note.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default React.memo(DataSection)
