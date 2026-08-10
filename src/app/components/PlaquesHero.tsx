'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '../../i18n/useTranslation'
import PREMIUM from '../../../public/plaques/premium/index.json'

/**
 * Preview set, read from the plaque generator's manifest.
 *
 * Replaces a hand-typed list whose names, trades, addresses and dates did not
 * match the archive, and which pointed at /plaques/{berlin,brass}-style/ —
 * directories that have never existed, so the preview was always blank.
 * public/plaques/premium/index.json is written next to the SVGs by
 * scripts/generate-premium-plaques.js.
 */
const FEATURED_PLAQUES = [
  {
    id: PREMIUM.featured.id,
    name: PREMIUM.featured.name,
    type: PREMIUM.featured.type,
    location: PREMIUM.featured.address,
    years: PREMIUM.featured.years,
    file: `${PREMIUM.featured.slug}-simple.svg`,
  },
  ...PREMIUM.plaques.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    location: p.address,
    years: p.years,
    file: p.file,
  })),
]

interface PlaquesHeroProps {
  showFullContent?: boolean
  compact?: boolean
}

const PlaquesHero: React.FC<PlaquesHeroProps> = ({ showFullContent = true, compact = false }) => {
  const { t } = useTranslation()
  const [selectedPlaque, setSelectedPlaque] = useState(0)

  const currentPlaque = useMemo(() => FEATURED_PLAQUES[selectedPlaque], [selectedPlaque])

  if (compact) {
    // Compact version for use in intro overlay
    return (
      <div
        className="p-6 border"
        style={{
          backgroundColor: 'rgba(var(--card-bg-rgb), 0.8)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-16 h-16 flex items-center justify-center text-3xl"
            style={{
              backgroundColor: 'var(--danger)',
              color: 'var(--background)',
            }}
          >
            🏛️
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold font-mono mb-2" style={{ color: 'var(--danger)' }}>
              {t('plaques.hero.title')}
            </h3>
            <p className="text-sm font-mono mb-3" style={{ color: 'var(--foreground-muted)' }}>
              {t('plaques.hero.compactDescription')}
            </p>
            <Link
              href="/plaques"
              className="inline-flex items-center gap-2 text-sm font-mono font-semibold transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              {t('plaques.hero.learnMore')} →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      className="py-16 px-4 relative overflow-hidden"
      style={{
        backgroundColor: 'var(--background)',
      }}
    >
      {/* Decorative background elements */}
      <div
        className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl opacity-10 transform rotate-45"
        style={{
          background: `linear-gradient(to bottom left, var(--danger), transparent)`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr opacity-10"
        style={{
          background: `linear-gradient(to top right, var(--success), transparent)`,
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-mono uppercase tracking-widest"
            style={{
              backgroundColor: 'var(--danger)',
              color: 'var(--background)',
            }}
          >
            <span>🏛️</span>
            {t('plaques.hero.badge')}
          </div>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-light mb-4"
            style={{
              color: 'var(--foreground)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {t('plaques.hero.title')}
          </h1>

          <p
            className="text-xl md:text-2xl font-light max-w-3xl mx-auto mb-4"
            style={{
              color: 'var(--foreground-muted)',
              fontFamily: 'Space Mono, monospace',
            }}
          >
            {t('plaques.hero.subtitle')}
          </p>

          <div
            className="w-56 h-1 mx-auto"
            style={{
              background: `linear-gradient(to right, var(--danger), var(--primary), var(--success))`,
            }}
          />
        </div>

        {showFullContent && (
          <>
            {/* Main content grid */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              {/* Left: Description */}
              <div className="space-y-6">
                <div
                  className="p-6 border-l-4"
                  style={{
                    backgroundColor: 'rgba(var(--card-bg-rgb), 0.5)',
                    borderColor: 'var(--danger)',
                  }}
                >
                  <h2
                    className="text-xl font-semibold mb-3 font-mono"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {t('plaques.hero.visionTitle')}
                  </h2>
                  <p className="leading-relaxed font-mono" style={{ color: 'var(--foreground)' }}>
                    {t('plaques.hero.visionDescription')}
                  </p>
                </div>
              </div>

              {/* Right: Plaque Preview */}
              <div className="space-y-4">
                {/* Plaque Display */}
                <div
                  className="relative aspect-[16/9] border shadow-lg flex items-center justify-center"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <Image
                    src={`/plaques/premium/${currentPlaque.file}`}
                    alt={
                      t('plaques.plaqueAltText', { name: currentPlaque.name }) ||
                      `Memorial plaque for ${currentPlaque.name}`
                    }
                    width={800}
                    height={450}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Plaque Selector */}
                <div className="grid grid-cols-3 gap-2">
                  {FEATURED_PLAQUES.map((plaque, index) => (
                    <button
                      key={plaque.id}
                      onClick={() => setSelectedPlaque(index)}
                      className={`p-2 text-xs font-mono text-left transition-all border`}
                      style={{
                        backgroundColor:
                          selectedPlaque === index ? 'var(--primary)' : 'transparent',
                        color:
                          selectedPlaque === index
                            ? 'var(--background)'
                            : 'var(--foreground-muted)',
                        borderColor: selectedPlaque === index ? 'var(--primary)' : 'var(--border)',
                      }}
                    >
                      <div className="font-semibold truncate">{plaque.name}</div>
                      <div className="opacity-75">{plaque.years}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div
              className="text-center p-8 border"
              style={{
                backgroundColor: 'rgba(var(--card-bg-rgb), 0.5)',
                borderColor: 'var(--border)',
              }}
            >
              <h3
                className="text-2xl font-semibold mb-4"
                style={{
                  color: 'var(--foreground)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {t('plaques.hero.ctaTitle')}
              </h3>
              <p
                className="mb-6 max-w-2xl mx-auto font-mono"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {t('plaques.hero.ctaDescription')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:info@storytimemaps.com?subject=Memorial Plaques Initiative"
                  className="inline-flex items-center justify-center px-8 py-4 font-mono font-semibold text-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--danger)',
                    color: 'var(--background)',
                  }}
                >
                  {t('plaques.hero.supportInitiative')}
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default React.memo(PlaquesHero)
