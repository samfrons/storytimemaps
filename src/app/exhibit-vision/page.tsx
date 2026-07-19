'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useTranslation } from '../../i18n/useTranslation'
import ExhibitVisionHero from '../components/ExhibitVisionHero'
import LanguageToggle from '../components/LanguageToggle'

function ExhibitVisionContent() {
  const { t } = useTranslation()

  const experienceCards = [
    {
      icon: '🗺️',
      title: t('exhibitVision.experience.card1Title'),
      description: t('exhibitVision.experience.card1Description'),
      accent: 'var(--primary)',
    },
    {
      icon: '⏳',
      title: t('exhibitVision.experience.card2Title'),
      description: t('exhibitVision.experience.card2Description'),
      accent: 'var(--warning)',
    },
    {
      icon: '👤',
      title: t('exhibitVision.experience.card3Title'),
      description: t('exhibitVision.experience.card3Description'),
      accent: 'var(--success)',
    },
    {
      icon: '🌍',
      title: t('exhibitVision.experience.card4Title'),
      description: t('exhibitVision.experience.card4Description'),
      accent: 'var(--secondary)',
    },
  ]

  const layers = [
    {
      step: '01',
      title: t('exhibitVision.builds.digitalTitle'),
      description: t('exhibitVision.builds.digitalDescription'),
      accent: 'var(--success)',
    },
    {
      step: '02',
      title: t('exhibitVision.builds.plaquesTitle'),
      description: t('exhibitVision.builds.plaquesDescription'),
      accent: 'var(--danger)',
    },
    {
      step: '03',
      title: t('exhibitVision.builds.exhibitTitle'),
      description: t('exhibitVision.builds.exhibitDescription'),
      accent: 'var(--primary)',
    },
  ]

  const asks = [
    t('exhibitVision.partners.ask1'),
    t('exhibitVision.partners.ask2'),
    t('exhibitVision.partners.ask3'),
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Navigation Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b"
        style={{
          backgroundColor: 'rgba(var(--background-rgb), 0.95)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
              style={{ color: 'var(--primary)' }}
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-mono text-sm" style={{ color: 'var(--foreground)' }}>
              {t('exhibitVision.nav.backToMap')}
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span
              className="font-mono text-lg font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              StoryTimeMaps
            </span>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero */}
        <ExhibitVisionHero />

        {/* What visitors experience */}
        <section
          className="py-16 px-4"
          style={{ backgroundColor: 'rgba(var(--card-bg-rgb), 0.3)' }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className="text-3xl md:text-4xl font-light mb-4"
                style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}
              >
                {t('exhibitVision.experience.title')}
              </h2>
              <p
                className="font-mono max-w-2xl mx-auto"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {t('exhibitVision.experience.subtitle')}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {experienceCards.map((card, i) => (
                <div
                  key={i}
                  className="p-6 border-t-4 h-full"
                  style={{
                    backgroundColor: 'rgba(var(--card-bg-rgb), 0.6)',
                    borderColor: card.accent,
                  }}
                >
                  <div className="text-4xl mb-4">{card.icon}</div>
                  <h3
                    className="font-mono font-semibold mb-3 text-lg"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="font-mono text-sm leading-relaxed"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it builds on the project */}
        <section className="py-16 px-4" style={{ backgroundColor: 'var(--background)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className="text-3xl md:text-4xl font-light mb-4"
                style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}
              >
                {t('exhibitVision.builds.title')}
              </h2>
              <p
                className="font-mono max-w-2xl mx-auto"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {t('exhibitVision.builds.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {layers.map((layer, i) => (
                <div
                  key={i}
                  className="p-6 border-l-4"
                  style={{
                    backgroundColor: 'rgba(var(--card-bg-rgb), 0.5)',
                    borderColor: layer.accent,
                  }}
                >
                  <div
                    className="font-mono text-3xl font-bold mb-3"
                    style={{ color: layer.accent }}
                  >
                    {layer.step}
                  </div>
                  <h3
                    className="font-mono font-semibold mb-2 text-lg"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {layer.title}
                  </h3>
                  <p
                    className="font-mono text-sm leading-relaxed"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {layer.description}
                  </p>
                </div>
              ))}
            </div>

            <p
              className="font-mono text-sm italic text-center max-w-3xl mx-auto"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('exhibitVision.builds.provenance')}
            </p>
          </div>
        </section>

        {/* Partners & funding ask */}
        <section
          className="py-16 px-4"
          style={{ backgroundColor: 'rgba(var(--card-bg-rgb), 0.3)' }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2
                className="text-3xl md:text-4xl font-light mb-4"
                style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}
              >
                {t('exhibitVision.partners.title')}
              </h2>
              <p
                className="font-mono max-w-2xl mx-auto"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {t('exhibitVision.partners.description')}
              </p>
            </div>

            <ul className="space-y-4">
              {asks.map((ask, i) => (
                <li
                  key={i}
                  className="flex items-start gap-4 p-5 border"
                  style={{
                    backgroundColor: 'rgba(var(--card-bg-rgb), 0.6)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <span
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-mono font-bold text-sm"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="font-mono leading-relaxed"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {ask}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Footer CTA */}
        <section
          className="py-16 px-4 text-center"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-2xl font-light mb-4"
              style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}
            >
              {t('exhibitVision.footer.exploreTitle')}
            </h2>
            <p className="font-mono mb-8" style={{ color: 'var(--foreground-muted)' }}>
              {t('exhibitVision.footer.exploreDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/map"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-mono font-semibold text-lg transition-colors"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
              >
                {t('exhibitVision.footer.exploreMap')} →
              </Link>
              <Link
                href="/plaques"
                className="inline-flex items-center justify-center px-8 py-4 font-mono font-semibold text-lg border-2 transition-all"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'var(--danger)',
                  color: 'var(--danger)',
                }}
              >
                {t('exhibitVision.footer.viewPlaques')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer
        className="py-8 px-4 border-t"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
            © 2024 StoryTimeMaps. {t('exhibitVision.footer.rights')}
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/map"
              className="font-mono text-sm transition-colors"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('exhibitVision.footer.exploreMap')}
            </Link>
            <Link
              href="/museum-exhibit"
              className="font-mono text-sm transition-colors"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('exhibitVision.hero.seeLiveExhibit')}
            </Link>
            <Link
              href="/plaques"
              className="font-mono text-sm transition-colors"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('exhibitVision.footer.viewPlaques')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="font-mono" style={{ color: 'var(--primary)' }}>
        <span className="block">Loading...</span>
        <span className="block text-sm opacity-60">Laden...</span>
      </div>
    </div>
  )
}

export default function ExhibitVisionPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ExhibitVisionContent />
    </Suspense>
  )
}
