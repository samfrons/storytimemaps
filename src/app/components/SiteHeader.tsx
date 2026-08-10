'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useTranslation } from '../../i18n/useTranslation'
import LanguageToggle from './LanguageToggle'

interface SiteHeaderProps {
  /** Route to mark as current, e.g. "/exhibit-vision". */
  active?: string
}

const LINKS: Array<{ href: string; key: string; label: string }> = [
  { href: '/map', key: 'homepage.nav.map', label: 'Map' },
  { href: '/plaques', key: 'homepage.nav.plaques', label: 'Plaques' },
  { href: '/exhibit-vision', key: 'homepage.nav.exhibit', label: 'Exhibition' },
  { href: '/education', key: 'homepage.nav.education', label: 'For Teachers' },
  { href: '/jewish-businesses', key: 'homepage.nav.data', label: 'Data' },
]

/**
 * The bar shared by the standing pages (plaques, exhibition, education).
 *
 * Each of those pages previously carried its own hand-rolled header, which is
 * why they had drifted apart — different nav sets, different type, and no way
 * to reach the exhibition or the workbook from the plaque page at all. One
 * component keeps the set complete and the styling identical everywhere.
 */
const SiteHeaderNav: React.FC<SiteHeaderProps> = ({ active }) => {
  const { t } = useTranslation()

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-sm print:hidden"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'rgba(var(--background-rgb), 0.94)',
      }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-kame text-lg tracking-wide whitespace-nowrap"
          style={{ color: 'var(--foreground)' }}
        >
          StoryTimeMaps
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <nav
            className="hidden md:flex items-center gap-5 lg:gap-6"
            aria-label={t('homepage.footer.navLabel', { defaultValue: 'Primary' })}
          >
            {LINKS.map(({ href, key, label }) => {
              const isActive = active === href
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className="font-mono text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--foreground-muted)',
                  }}
                >
                  {t(key, { defaultValue: label })}
                </Link>
              )
            })}
          </nav>
          <LanguageToggle />
        </div>
      </div>
    </header>
  )
}

/**
 * The bar reads the ?lang= search param through useTranslation, so it carries
 * its own Suspense boundary. Without one, every page that mounts it — including
 * the server-rendered teaching pages — would have to add a boundary of its own
 * or fall out of static rendering entirely.
 */
const SiteHeader: React.FC<SiteHeaderProps> = (props) => (
  <Suspense
    fallback={
      <div
        className="sticky top-0 z-50 border-b h-[65px] print:hidden"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
      />
    }
  >
    <SiteHeaderNav {...props} />
  </Suspense>
)

export default React.memo(SiteHeader)
