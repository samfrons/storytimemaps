'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * Ways into the project: the map itself, the memorial plaques initiative,
 * and the underlying dataset.
 */
const ExploreSection: React.FC = () => {
  const { t } = useTranslation()

  const cards = [
    {
      href: '/',
      primary: true,
      title: t('cta.exploreMap', { defaultValue: 'Explore the Interactive Map' }),
      text: t('homepage.explore.mapText', {
        defaultValue:
          'The full experience: ten thousand businesses, a time slider across 45 years, and in-depth stories of the people behind the storefronts.',
      }),
      tag: t('homepage.explore.mapTag', { defaultValue: 'Start here' }),
    },
    {
      href: '/plaques',
      primary: false,
      title: t('future.plaques.title', { defaultValue: 'Memorial Plaques Initiative' }),
      text: t('homepage.explore.plaquesText', {
        defaultValue:
          'Help bring the digital memorial into Berlin’s streets — physical plaques at the addresses where these businesses stood.',
      }),
      tag: t('homepage.explore.plaquesTag', { defaultValue: 'Initiative' }),
    },
    {
      href: '/jewish-businesses',
      primary: false,
      title: t('cta.viewData', { defaultValue: 'View Raw Data' }),
      text: t('homepage.explore.dataText', {
        defaultValue:
          'Browse the underlying records: names, addresses, trades and dates, with sources for every entry.',
      }),
      tag: t('homepage.explore.dataTag', { defaultValue: 'For researchers' }),
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
            {t('homepage.explore.eyebrow', { defaultValue: 'Ways in' })}
          </p>
          <h2
            className="font-kame text-3xl sm:text-5xl leading-tight"
            style={{ color: 'var(--foreground)' }}
          >
            {t('homepage.explore.title', { defaultValue: 'Begin exploring' })}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group border p-7 flex flex-col transition-transform duration-200 hover:-translate-y-1 explore-card"
              style={{
                borderColor: card.primary ? 'var(--primary)' : 'var(--border)',
                backgroundColor: card.primary ? 'var(--primary)' : 'var(--card-bg)',
              }}
            >
              <span
                className="font-mono text-[11px] uppercase tracking-[0.25em] mb-6"
                style={{
                  color: card.primary ? 'var(--background)' : 'var(--muted)',
                }}
              >
                {card.tag}
              </span>
              <h3
                className="font-mono text-lg font-bold mb-3 leading-snug"
                style={{ color: card.primary ? 'var(--background)' : 'var(--foreground)' }}
              >
                {card.title}
              </h3>
              <p
                className="font-['Inter'] text-sm leading-relaxed flex-1"
                style={{
                  color: card.primary ? 'var(--background)' : 'var(--foreground-muted)',
                  opacity: card.primary ? 0.85 : 1,
                }}
              >
                {card.text}
              </p>
              <span
                aria-hidden="true"
                className="font-mono text-xl mt-6 inline-block transition-transform duration-200 group-hover:translate-x-1"
                style={{ color: card.primary ? 'var(--background)' : 'var(--primary)' }}
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .explore-card:focus {
          outline: none;
          box-shadow: none;
          border-color: var(--foreground);
        }
      `}</style>
    </section>
  )
}

export default React.memo(ExploreSection)
