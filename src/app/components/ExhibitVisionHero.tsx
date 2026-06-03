'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '../../i18n/useTranslation'

const ExhibitVisionHero: React.FC = () => {
  const { t } = useTranslation()

  return (
    <section
      className="py-16 px-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Decorative background elements */}
      <div
        className="absolute top-0 right-0 w-96 h-96 opacity-10 transform rotate-45"
        style={{ background: `linear-gradient(to bottom left, var(--primary), transparent)` }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 opacity-10"
        style={{ background: `linear-gradient(to top right, var(--success), transparent)` }}
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-mono uppercase tracking-widest"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
          >
            <span>🏛️</span>
            {t('exhibitVision.hero.badge')}
          </div>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-light mb-4"
            style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}
          >
            {t('exhibitVision.hero.title')}
          </h1>

          <p
            className="text-xl md:text-2xl font-light max-w-3xl mx-auto mb-4"
            style={{ color: 'var(--foreground-muted)', fontFamily: 'Space Mono, monospace' }}
          >
            {t('exhibitVision.hero.subtitle')}
          </p>

          <div
            className="w-56 h-1 mx-auto"
            style={{
              background: `linear-gradient(to right, var(--danger), var(--primary), var(--success))`,
            }}
          />
        </div>

        {/* Vision statement */}
        <div className="max-w-4xl mx-auto mb-12">
          <div
            className="p-6 md:p-8 border-l-4"
            style={{
              backgroundColor: 'rgba(var(--card-bg-rgb), 0.5)',
              borderColor: 'var(--primary)',
            }}
          >
            <h2
              className="text-xl font-semibold mb-3 font-mono"
              style={{ color: 'var(--foreground)' }}
            >
              {t('exhibitVision.hero.visionTitle')}
            </h2>
            <p
              className="leading-relaxed font-mono text-base md:text-lg"
              style={{ color: 'var(--foreground)' }}
            >
              {t('exhibitVision.hero.visionDescription')}
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div
          className="text-center p-8 border"
          style={{
            backgroundColor: 'rgba(var(--card-bg-rgb), 0.5)',
            borderColor: 'var(--border)',
          }}
        >
          <h3
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}
          >
            {t('exhibitVision.hero.ctaTitle')}
          </h3>
          <p
            className="mb-6 max-w-2xl mx-auto font-mono"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('exhibitVision.hero.ctaDescription')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:info@storytimemaps.com?subject=Museum Exhibit Vision"
              className="inline-flex items-center justify-center px-8 py-4 font-mono font-semibold text-lg transition-colors"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
            >
              {t('exhibitVision.hero.supportInitiative')}
            </a>
            <Link
              href="/museum-exhibit"
              className="inline-flex items-center justify-center px-8 py-4 font-mono font-semibold text-lg border-2 transition-all"
              style={{
                backgroundColor: 'transparent',
                borderColor: 'var(--success)',
                color: 'var(--success)',
              }}
            >
              {t('exhibitVision.hero.seeLiveExhibit')} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default React.memo(ExhibitVisionHero)
