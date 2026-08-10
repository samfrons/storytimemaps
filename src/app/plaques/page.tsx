'use client'

import React, { Suspense, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from '../../i18n/useTranslation'
import PlaquesHero from '../components/PlaquesHero'
import LanguageToggle from '../components/LanguageToggle'
import PREMIUM from '../../../public/plaques/premium/index.json'

/**
 * The plaque set, read from the generator's manifest.
 *
 * This replaces a hand-typed ALL_PLAQUES array whose names, trades, addresses
 * and dates did not match the archive (it listed, for example, "Elias Braun -
 * Tailor Shop, Rosenthaler Straße 40, 1925-1938" where record id=1 is
 * "E. Braun & Co., Unter den Linden 2, 1914-1943"). It also pointed at
 * /plaques/berlin-style/ and /plaques/brass-style/, directories that have never
 * existed, so every image on this page 404'd.
 *
 * public/plaques/premium/index.json is written by
 * scripts/generate-premium-plaques.js alongside the SVGs, so filenames and
 * captions can no longer drift apart. Run `pnpm run plaques:web` to refresh.
 */
const FEATURED = PREMIUM.featured
const PLAQUES = PREMIUM.plaques

function PlaquesPageContent() {
  const { t } = useTranslation()
  const [hoveredPlaque, setHoveredPlaque] = useState<string | null>(null)

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
              {t('plaques.nav.backToMap')}
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

      {/* Main Content */}
      <main className="pt-20">
        {/* Hero Section */}
        <PlaquesHero showFullContent={true} />

        {/* Plaque Gallery Section */}
        <section
          className="py-16 px-4"
          style={{ backgroundColor: 'rgba(var(--card-bg-rgb), 0.3)' }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className="text-3xl md:text-4xl font-light mb-4"
                style={{
                  color: 'var(--foreground)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {t('plaques.gallery.title')}
              </h2>
              <p
                className="text-lg font-mono max-w-2xl mx-auto"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {t('plaques.gallery.subtitle')}
              </p>
            </div>

            {/* The one fully-researched plaque: E. Braun & Co. is the only record
                with a traced storefront engraving and its own narrative copy, so it
                is the only one that exists in the detailed tier. It leads the gallery
                at full width; the trade set below is the typographic tier. */}
            <Link href={`/?id=${FEATURED.id}`} className="group block mb-10">
              <div
                className="border overflow-hidden transition-all duration-300"
                style={{
                  borderColor: hoveredPlaque === FEATURED.id ? 'var(--primary)' : 'var(--border)',
                }}
                onMouseEnter={() => setHoveredPlaque(FEATURED.id)}
                onMouseLeave={() => setHoveredPlaque(null)}
              >
                <Image
                  src={`/plaques/premium/${FEATURED.slug}-detailed.svg`}
                  alt={
                    t('plaques.plaqueAltText', { name: FEATURED.name }) ||
                    `Memorial plaque for ${FEATURED.name}`
                  }
                  width={800}
                  height={680}
                  priority
                  className="w-full h-auto"
                />
                <div className="p-5" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <h3
                    className="font-mono font-semibold mb-1"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {FEATURED.name}
                  </h3>
                  <div
                    className="flex flex-wrap items-center gap-x-4 text-sm font-mono"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    <span>{FEATURED.type}</span>
                    <span>{FEATURED.years}</span>
                    <span>{FEATURED.address}</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Plaques Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PLAQUES.map((plaque) => (
                <Link
                  key={plaque.id}
                  href={`/?id=${plaque.id}`}
                  className="group block"
                  onMouseEnter={() => setHoveredPlaque(plaque.id)}
                  onMouseLeave={() => setHoveredPlaque(null)}
                >
                  <div
                    className="border transition-all duration-300 overflow-hidden"
                    style={{
                      borderColor: hoveredPlaque === plaque.id ? 'var(--primary)' : 'var(--border)',
                      transform: hoveredPlaque === plaque.id ? 'scale(1.02)' : 'scale(1)',
                      boxShadow:
                        hoveredPlaque === plaque.id ? '0 10px 30px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    {/* Plaque artwork. The SVG carries its own navy field, so the
                        container stays transparent rather than painting a backdrop. */}
                    <div className="aspect-[16/9] flex items-center justify-center">
                      <Image
                        src={`/plaques/premium/${plaque.file}`}
                        alt={
                          t('plaques.plaqueAltText', { name: plaque.name }) ||
                          `Memorial plaque for ${plaque.name}`
                        }
                        width={800}
                        height={450}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Plaque Info */}
                    <div className="p-4" style={{ backgroundColor: 'var(--card-bg)' }}>
                      <h3
                        className="font-mono font-semibold mb-1 truncate"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {plaque.name}
                      </h3>
                      <div
                        className="flex items-center justify-between text-sm font-mono"
                        style={{ color: 'var(--foreground-muted)' }}
                      >
                        <span>{plaque.type}</span>
                        <span>{plaque.years}</span>
                      </div>
                      <p
                        className="text-xs font-mono mt-2 truncate"
                        style={{ color: 'var(--muted)' }}
                      >
                        📍 {plaque.address}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How Plaques Work Section */}
        <section className="py-16 px-4" style={{ backgroundColor: 'var(--background)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className="text-3xl md:text-4xl font-light mb-4"
                style={{
                  color: 'var(--foreground)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {t('plaques.howItWorks.title')}
              </h2>
              <p
                className="text-lg font-mono max-w-2xl mx-auto"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {t('plaques.howItWorks.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div
                className="text-center p-6 border"
                style={{
                  backgroundColor: 'rgba(var(--card-bg-rgb), 0.5)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-3xl"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--background)',
                  }}
                >
                  📖
                </div>
                <h3 className="font-mono font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  {t('plaques.howItWorks.step1Title')}
                </h3>
                <p className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
                  {t('plaques.howItWorks.step1Description')}
                </p>
              </div>

              {/* Step 2 */}
              <div
                className="text-center p-6 border"
                style={{
                  backgroundColor: 'rgba(var(--card-bg-rgb), 0.5)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-3xl"
                  style={{
                    backgroundColor: 'var(--danger)',
                    color: 'var(--background)',
                  }}
                >
                  🏛️
                </div>
                <h3 className="font-mono font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  {t('plaques.howItWorks.step2Title')}
                </h3>
                <p className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
                  {t('plaques.howItWorks.step2Description')}
                </p>
              </div>

              {/* Step 3 */}
              <div
                className="text-center p-6 border"
                style={{
                  backgroundColor: 'rgba(var(--card-bg-rgb), 0.5)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-3xl"
                  style={{
                    backgroundColor: 'var(--success)',
                    color: 'var(--background)',
                  }}
                >
                  📱
                </div>
                <h3 className="font-mono font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  {t('plaques.howItWorks.step3Title')}
                </h3>
                <p className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
                  {t('plaques.howItWorks.step3Description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Partners & Support Section */}
        <section
          className="py-16 px-4"
          style={{
            background: `linear-gradient(to right, rgba(var(--danger-rgb), 0.1), rgba(var(--success-rgb), 0.1))`,
          }}
        >
          <div className="max-w-5xl mx-auto text-center">
            <h2
              className="text-3xl md:text-4xl font-light mb-4"
              style={{
                color: 'var(--foreground)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {t('plaques.partners.title')}
            </h2>
            <p
              className="text-lg font-mono max-w-3xl mx-auto mb-8"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('plaques.partners.description')}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              <div
                className="p-4 border font-mono text-sm"
                style={{
                  backgroundColor: 'rgba(var(--card-bg-rgb), 0.8)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground-muted)',
                }}
              >
                🏛️ {t('plaques.partners.culturalInstitutions')}
              </div>
              <div
                className="p-4 border font-mono text-sm"
                style={{
                  backgroundColor: 'rgba(var(--card-bg-rgb), 0.8)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground-muted)',
                }}
              >
                🎓 {t('plaques.partners.educationalOrganizations')}
              </div>
              <div
                className="p-4 border font-mono text-sm"
                style={{
                  backgroundColor: 'rgba(var(--card-bg-rgb), 0.8)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground-muted)',
                }}
              >
                ✡️ {t('plaques.partners.jewishCommunity')}
              </div>
              <div
                className="p-4 border font-mono text-sm"
                style={{
                  backgroundColor: 'rgba(var(--card-bg-rgb), 0.8)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground-muted)',
                }}
              >
                🏢 {t('plaques.partners.cityPlanning')}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:info@storytimemaps.com?subject=Memorial Plaques Partnership"
                className="inline-flex items-center justify-center px-8 py-4 font-mono font-semibold text-lg transition-colors"
                style={{
                  backgroundColor: 'var(--danger)',
                  color: 'var(--background)',
                }}
              >
                {t('plaques.partners.becomePartner')}
              </a>
              <a
                href="mailto:info@storytimemaps.com?subject=Memorial Plaques Donation"
                className="inline-flex items-center justify-center px-8 py-4 font-mono font-semibold text-lg border-2 transition-all"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)',
                }}
              >
                {t('plaques.partners.supportProject')}
              </a>
            </div>
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
              style={{
                color: 'var(--foreground)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {t('plaques.footer.exploreTitle')}
            </h2>
            <p className="font-mono mb-8" style={{ color: 'var(--foreground-muted)' }}>
              {t('plaques.footer.exploreDescription')}
            </p>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-8 py-4 font-mono font-semibold text-lg transition-colors"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
              }}
            >
              {t('plaques.footer.exploreMap')} →
            </Link>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer
        className="py-8 px-4 border-t"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
            © 2024 StoryTimeMaps. {t('plaques.footer.rights')}
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-mono text-sm transition-colors"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('plaques.footer.map')}
            </Link>
            <Link
              href="/home"
              className="font-mono text-sm transition-colors"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('plaques.footer.about')}
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
        <span className="block text-sm opacity-60">Laden... / לאָדן...</span>
      </div>
    </div>
  )
}

export default function PlaquesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PlaquesPageContent />
    </Suspense>
  )
}
