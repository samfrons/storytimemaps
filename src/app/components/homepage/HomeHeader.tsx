'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'
import LanguageToggle from '../LanguageToggle'

/** Minimal top bar floating over the hero. */
const HomeHeader: React.FC = () => {
  const { t } = useTranslation()

  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <div className="flex items-center justify-between gap-4 px-5 sm:px-8 lg:px-14 py-5">
        <span
          className="font-kame text-lg sm:text-xl tracking-wide"
          style={{ color: 'var(--foreground)' }}
        >
          StoryTimeMaps
        </span>

        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="hidden md:flex items-center gap-6" aria-label="Primary">
            <Link
              href="/map"
              className="font-mono text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('homepage.nav.map', { defaultValue: 'Map' })}
            </Link>
            <Link
              href="/plaques"
              className="font-mono text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('homepage.nav.plaques', { defaultValue: 'Plaques' })}
            </Link>
            <Link
              href="/education"
              className="font-mono text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('homepage.nav.education', { defaultValue: 'For Teachers' })}
            </Link>
            <Link
              href="/jewish-businesses"
              className="font-mono text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('homepage.nav.data', { defaultValue: 'Data' })}
            </Link>
          </nav>
          <LanguageToggle />
        </div>
      </div>
    </header>
  )
}

export default React.memo(HomeHeader)
