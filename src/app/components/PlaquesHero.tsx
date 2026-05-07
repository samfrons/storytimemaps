'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '../../i18n/useTranslation'

// Plaque data for the featured businesses
const FEATURED_PLAQUES = [
  {
    id: 1,
    name: 'Elias Braun - Tailor Shop',
    type: 'Tailoring',
    location: 'Rosenthaler Straße 40',
    years: '1925-1938',
  },
  {
    id: 2,
    name: 'Breslauer Brothers',
    type: 'Department Store',
    location: 'Unter den Linden 15',
    years: '1920-1935',
  },
  {
    id: 3,
    name: 'Deutsches Theater Café',
    type: 'Café',
    location: 'Schumannstraße 13a',
    years: '1928-1933',
  },
  {
    id: 4,
    name: 'Ebro Textiles',
    type: 'Textiles',
    location: 'Alexanderstraße 125',
    years: '1922-1939',
  },
  {
    id: 5,
    name: 'Hoxter & Sons Bookshop',
    type: 'Bookshop',
    location: 'Oranienburger Straße 28',
    years: '1910-1938',
  },
  {
    id: 6,
    name: 'Pelz Furrier',
    type: 'Furrier',
    location: 'Friedrichstraße 180',
    years: '1918-1937',
  },
]

interface PlaquesHeroProps {
  showFullContent?: boolean
  compact?: boolean
}

const PlaquesHero: React.FC<PlaquesHeroProps> = ({ showFullContent = true, compact = false }) => {
  const { t } = useTranslation()
  const [selectedStyle, setSelectedStyle] = useState<'berlin' | 'brass'>('berlin')
  const [selectedPlaque, setSelectedPlaque] = useState(0)

  const currentPlaque = useMemo(() => FEATURED_PLAQUES[selectedPlaque], [selectedPlaque])

  const getPlaqueFileName = (id: number, name: string) => {
    const slugName = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30)
    return `plaque-${String(id).padStart(3, '0')}-${slugName}.svg`
  }

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

                {/* Stolpersteine Connection */}
                <div
                  className="p-6 border"
                  style={{
                    backgroundColor: 'rgba(var(--danger-rgb), 0.1)',
                    borderColor: 'var(--danger)',
                  }}
                >
                  <h3
                    className="font-semibold mb-3 flex items-center gap-2 font-mono"
                    style={{ color: 'var(--danger)' }}
                  >
                    <span>🪨</span> {t('plaques.hero.stolpersteineTitle')}
                  </h3>
                  <p className="mb-4 font-mono text-sm" style={{ color: 'var(--foreground)' }}>
                    {t('plaques.hero.stolpersteineDescription')}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4
                        className="font-semibold mb-2 font-mono"
                        style={{ color: 'var(--danger)' }}
                      >
                        {t('plaques.hero.stolpersteineFocus')}:
                      </h4>
                      <ul
                        className="space-y-1 font-mono"
                        style={{ color: 'var(--foreground-muted)' }}
                      >
                        <li>• {t('plaques.hero.individualVictims')}</li>
                        <li>• {t('plaques.hero.residentialAddresses')}</li>
                        <li>• {t('plaques.hero.personalStories')}</li>
                      </ul>
                    </div>
                    <div>
                      <h4
                        className="font-semibold mb-2 font-mono"
                        style={{ color: 'var(--success)' }}
                      >
                        {t('plaques.hero.businessPlaquesFocus')}:
                      </h4>
                      <ul
                        className="space-y-1 font-mono"
                        style={{ color: 'var(--foreground-muted)' }}
                      >
                        <li>• {t('plaques.hero.commercialEnterprises')}</li>
                        <li>• {t('plaques.hero.businessLocations')}</li>
                        <li>• {t('plaques.hero.economicPersecution')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Plaque Preview */}
              <div className="space-y-4">
                {/* Style Selector */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSelectedStyle('berlin')}
                    className={`flex-1 px-4 py-3 font-mono text-sm font-semibold transition-all border`}
                    style={{
                      backgroundColor:
                        selectedStyle === 'berlin' ? 'var(--primary)' : 'transparent',
                      color: selectedStyle === 'berlin' ? 'var(--background)' : 'var(--foreground)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    {t('plaques.hero.berlinStyle')}
                  </button>
                  <button
                    onClick={() => setSelectedStyle('brass')}
                    className={`flex-1 px-4 py-3 font-mono text-sm font-semibold transition-all border`}
                    style={{
                      backgroundColor: selectedStyle === 'brass' ? 'var(--warning)' : 'transparent',
                      color: selectedStyle === 'brass' ? 'var(--background)' : 'var(--foreground)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    {t('plaques.hero.brassStyle')}
                  </button>
                </div>

                {/* Plaque Display */}
                <div
                  className="relative aspect-[4/3] border shadow-lg flex items-center justify-center p-4"
                  style={{
                    backgroundColor: selectedStyle === 'berlin' ? '#ffffff' : '#d4af37',
                    borderColor: 'var(--border)',
                  }}
                >
                  <Image
                    src={`/plaques/${selectedStyle}-style/${getPlaqueFileName(currentPlaque.id, currentPlaque.name)}`}
                    alt={
                      t('plaques.plaqueAltText', { name: currentPlaque.name.split(' - ')[0] }) ||
                      `Memorial plaque for ${currentPlaque.name}`
                    }
                    width={400}
                    height={300}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      // Fallback to text display if image fails
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
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
                      <div className="font-semibold truncate">{plaque.name.split(' - ')[0]}</div>
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
                <a
                  href="https://www.stolpersteine.eu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 font-mono font-semibold text-lg border-2 transition-all"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: 'var(--success)',
                    color: 'var(--success)',
                  }}
                >
                  {t('plaques.hero.learnStolpersteine')}
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
