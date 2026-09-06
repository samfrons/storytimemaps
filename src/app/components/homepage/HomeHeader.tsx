'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'
import LanguageToggle from '../LanguageToggle'
import { NAV_LINKS } from '../SiteHeader'

/**
 * Minimal top bar floating over the hero.
 *
 * Visually it is its own thing — transparent, sitting on the animated map —
 * but the links come from the same NAV_LINKS list the sticky SiteHeader uses,
 * so the homepage can never offer a different set of destinations than the
 * pages it links to. It previously omitted the exhibition entirely.
 */
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
          <nav className="hidden md:flex items-center gap-5 lg:gap-6" aria-label="Primary">
            {NAV_LINKS.map(({ href, key, label }) => (
              <Link
                key={href}
                href={href}
                className="font-mono text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {t(key, { defaultValue: label })}
              </Link>
            ))}
          </nav>
          <LanguageToggle />
        </div>
      </div>
    </header>
  )
}

export default React.memo(HomeHeader)
