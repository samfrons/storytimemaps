'use client'

import React from 'react'
import { useTranslation } from '../../../i18n/useTranslation'

/**
 * Credits the scholarship the site is built on. Reuses the translated
 * research.* keys shared with the rest of the application.
 */
const ResearchFoundation: React.FC = () => {
  const { t } = useTranslation()

  const columns = [
    {
      titleKey: 'research.kreutzmuller.title',
      titleFallback: "Dr. Christoph Kreutzmüller's Pioneering Work",
      textKey: 'research.kreutzmuller.description',
      textFallback:
        "This project builds directly upon Dr. Kreutzmüller's groundbreaking 2015 study 'Final Sale: The Destruction of Jewish Commercial Activity in Nazi Germany'.",
      link: {
        href: 'https://www.berghahnbooks.com/title/KreutzmllerFinal',
        labelKey: 'cta.buyBook',
        labelFallback: "Read 'Final Sale'",
      },
    },
    {
      titleKey: 'research.database.title',
      titleFallback: 'The Leo Baeck Institute Database',
      textKey: 'research.database.description',
      textFallback:
        'The comprehensive database housed at the Leo Baeck Institute contains detailed records of Jewish businesses across Germany.',
      link: {
        href: 'https://www.leobaeck.org/',
        labelKey: 'cta.leoBackInstitute',
        labelFallback: 'Leo Baeck Institute',
      },
    },
    {
      titleKey: 'research.transformation.title',
      titleFallback: 'From Archive to Accessibility',
      textKey: 'research.transformation.description',
      textFallback:
        'StoryTimeMaps transforms this scholarly database into an interactive digital experience, making decades of research accessible to everyone.',
      link: null,
    },
  ]

  return (
    <section
      className="py-20 sm:py-28 px-5 sm:px-8 border-t"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-14">
          <p
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--primary)' }}
          >
            {t('homepage.research.eyebrow', { defaultValue: 'The foundation' })}
          </p>
          <h2
            className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            {t('research.title', { defaultValue: 'Research Foundation' })}
          </h2>
          <p
            className="font-['Inter'] text-base sm:text-lg leading-relaxed"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('research.subtitle', { defaultValue: 'Standing on the shoulders of giants' })}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {columns.map((column) => (
            <article
              key={column.titleKey}
              className="border p-7 flex flex-col"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
            >
              <h3
                className="font-mono text-base font-bold mb-4 leading-snug"
                style={{ color: 'var(--foreground)' }}
              >
                {t(column.titleKey, { defaultValue: column.titleFallback })}
              </h3>
              <p
                className="font-['Inter'] text-sm leading-relaxed flex-1"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {t(column.textKey, { defaultValue: column.textFallback })}
              </p>
              {column.link && (
                <a
                  href={column.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider mt-6 transition-opacity hover:opacity-80"
                  style={{ color: 'var(--primary)' }}
                >
                  {t(column.link.labelKey, { defaultValue: column.link.labelFallback })}
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default React.memo(ResearchFoundation)
