'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'
import { NAV_LINKS } from '../SiteHeader'
import CopyrightNotice from '../CopyrightNotice'

const HomeFooter: React.FC = () => {
  const { t } = useTranslation()

  return (
    <footer
      className="border-t px-5 sm:px-8 py-12"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="max-w-md">
            <span className="font-kame text-lg block mb-3" style={{ color: 'var(--foreground)' }}>
              StoryTimeMaps
            </span>
            <p
              className="font-['Inter'] text-sm leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('homepage.footer.about', {
                defaultValue:
                  'A digital memorial to the Jewish businesses of Berlin, 1900–1945. Built to preserve memory and educate — every record is drawn from documented archival sources.',
              })}
            </p>
          </div>

          <nav
            className="flex flex-col gap-2"
            aria-label={t('homepage.footer.navLabel', { defaultValue: 'Footer' })}
          >
            {/* Same destinations as both headers, plus the footer-only links:
                the Frankfurt sibling project and the two collaborator entry
                points, which belong here rather than in the primary nav — a
                visitor comes for the map, a contributor goes looking. */}
            {[
              ...NAV_LINKS,
              { href: '/frankfurt', key: 'homepage.nav.frankfurt', label: 'Frankfurt' },
              { href: '/collaborate', key: 'homepage.nav.collaborate', label: 'Collaborate' },
              { href: '/onboarding', key: 'homepage.nav.onboarding', label: 'Onboarding' },
            ].map(({ href, key, label }) => (
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
        </div>

        <div className="border-t mt-10 pt-6" style={{ borderColor: 'var(--border)' }}>
          <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            {t('homepage.footer.citation', {
              defaultValue:
                'Based on the research of Dr. Christoph Kreutzmüller and the database of Jewish commercial activity in Berlin. For academic use, please cite the original research.',
            })}
          </p>
          <p className="font-mono text-xs leading-relaxed mt-4" style={{ color: 'var(--muted)' }}>
            <CopyrightNotice
              linkClassName="transition-opacity hover:opacity-80"
              linkStyle={{ color: 'var(--foreground-muted)' }}
            />
          </p>
        </div>
      </div>
    </footer>
  )
}

export default React.memo(HomeFooter)
