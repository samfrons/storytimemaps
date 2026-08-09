'use client'

import React from 'react'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * Explains the site's three-part idea — place, time, fate — each card
 * carrying a small diagram built from the same visual language as the map.
 */
const ConceptSection: React.FC = () => {
  const { t } = useTranslation()

  return (
    <section
      id="concept"
      className="py-20 sm:py-28 px-5 sm:px-8"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-14">
          <p
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--primary)' }}
          >
            {t('homepage.concept.eyebrow', { defaultValue: 'The concept' })}
          </p>
          <h2
            className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            {t('homepage.concept.title', { defaultValue: 'One map. Three dimensions.' })}
          </h2>
          <p
            className="font-['Inter'] text-base sm:text-lg leading-relaxed"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('homepage.concept.intro', {
              defaultValue:
                'The archive behind this site is a list of names, addresses and dates. The map turns that list back into a city — one you can stand in, move through, and watch change.',
            })}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* 01 — Place */}
          <article
            className="border p-7 flex flex-col"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
          >
            <div className="flex items-baseline justify-between mb-6">
              <span className="font-mono text-4xl font-bold" style={{ color: 'var(--primary)' }}>
                01
              </span>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.25em]"
                style={{ color: 'var(--muted)' }}
              >
                {t('homepage.concept.placeTag', { defaultValue: 'Place' })}
              </span>
            </div>

            <div aria-hidden="true" className="relative h-24 mb-6">
              {[
                [12, 30],
                [22, 48],
                [30, 22],
                [38, 60],
                [45, 38],
                [52, 30],
                [58, 55],
                [66, 42],
                [74, 26],
                [82, 50],
                [48, 74],
                [28, 70],
              ].map(([x, y], i) => (
                <span
                  key={i}
                  className="absolute w-2 h-2"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    backgroundColor: i % 4 === 0 ? 'var(--primary)' : 'var(--muted)',
                    opacity: i % 4 === 0 ? 1 : 0.5,
                  }}
                />
              ))}
            </div>

            <h3 className="font-mono text-lg font-bold mb-3" style={{ color: 'var(--foreground)' }}>
              {t('homepage.concept.placeTitle', { defaultValue: 'Every dot is a real address' })}
            </h3>
            <p
              className="font-['Inter'] text-sm leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('homepage.concept.placeText', {
                defaultValue:
                  'Each business is mapped to the street where it actually stood — tailors in Mitte, publishers in Kreuzberg, department stores on Kurfürstendamm. Zoom in and the dots become shops with names, owners and stories.',
              })}
            </p>
          </article>

          {/* 02 — Time */}
          <article
            className="border p-7 flex flex-col"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
          >
            <div className="flex items-baseline justify-between mb-6">
              <span className="font-mono text-4xl font-bold" style={{ color: 'var(--primary)' }}>
                02
              </span>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.25em]"
                style={{ color: 'var(--muted)' }}
              >
                {t('homepage.concept.timeTag', { defaultValue: 'Time' })}
              </span>
            </div>

            <div aria-hidden="true" className="relative h-24 mb-6 flex items-center">
              <div className="w-full">
                <div className="relative h-0.5" style={{ backgroundColor: 'var(--border)' }}>
                  <span
                    className="absolute -top-[7px] w-4 h-4"
                    style={{ left: '62%', backgroundColor: 'var(--primary)' }}
                  />
                </div>
                <div
                  className="flex justify-between font-mono text-[10px] mt-3"
                  style={{ color: 'var(--muted)' }}
                >
                  <span>1900</span>
                  <span>1933</span>
                  <span>1945</span>
                </div>
              </div>
            </div>

            <h3 className="font-mono text-lg font-bold mb-3" style={{ color: 'var(--foreground)' }}>
              {t('homepage.concept.timeTitle', {
                defaultValue: 'Drag the years, watch the city change',
              })}
            </h3>
            <p
              className="font-['Inter'] text-sm leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('homepage.concept.timeText', {
                defaultValue:
                  'A time slider runs beneath the map from 1900 to 1945. Slide it and businesses open, struggle and vanish around you — the boycott of 1933, the forced transfers of 1938, the end of the war.',
              })}
            </p>
          </article>

          {/* 03 — Fate */}
          <article
            className="border p-7 flex flex-col"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
          >
            <div className="flex items-baseline justify-between mb-6">
              <span className="font-mono text-4xl font-bold" style={{ color: 'var(--primary)' }}>
                03
              </span>
              <span
                className="font-mono text-[11px] uppercase tracking-[0.25em]"
                style={{ color: 'var(--muted)' }}
              >
                {t('homepage.concept.fateTag', { defaultValue: 'Fate' })}
              </span>
            </div>

            <div aria-hidden="true" className="h-24 mb-6 flex flex-col justify-center gap-3">
              {[
                ['var(--success)', t('homepage.states.active', { defaultValue: 'Open' })],
                [
                  'var(--warning)',
                  t('homepage.states.declining', { defaultValue: 'Under pressure' }),
                ],
                ['var(--danger)', t('homepage.states.closed', { defaultValue: 'Closed' })],
              ].map(([color, label]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-3 h-3 flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-mono text-xs" style={{ color: 'var(--foreground-muted)' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <h3 className="font-mono text-lg font-bold mb-3" style={{ color: 'var(--foreground)' }}>
              {t('homepage.concept.fateTitle', { defaultValue: 'Color carries the story' })}
            </h3>
            <p
              className="font-['Inter'] text-sm leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('homepage.concept.fateText', {
                defaultValue:
                  'At any moment, each dot shows the state of that business: operating normally, under growing pressure in its final years, or closed — liquidated, seized, or destroyed.',
              })}
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

export default React.memo(ConceptSection)
