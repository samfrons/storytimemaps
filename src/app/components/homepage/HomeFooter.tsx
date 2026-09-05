'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'
import SiteCredit from '../SiteCredit'
import { NAV_LINKS } from '../SiteHeader'

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

            {/* The funder's mark. The foundation publishes it only on a white
                ground, so the image multiplies that white away against the
                plate behind it — see .partner-logo-plate in globals.css, which
                also decides what colour that plate is per theme. The intrinsic
                size is the asset's own 900 x 275; the rendered width is CSS. */}
            <span className="partner-logo-plate mt-8">
              <Image
                src="/images/logos/stiftung-zurueckgeben.webp"
                alt={t('homepage.footer.funderLogoAlt', {
                  defaultValue:
                    'Stiftung Zurückgeben — Stiftung zur Förderung jüdischer Frauen in Kunst & Wissenschaft',
                })}
                width={900}
                height={275}
                className="partner-logo block h-auto w-[180px] sm:w-[200px]"
              />
            </span>
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

        <div
          className="border-t mt-10 pt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            {t('homepage.footer.citation', {
              defaultValue:
                'Based on the research of Dr. Christoph Kreutzmüller and the database of Jewish commercial activity in Berlin. For academic use, please cite the original research.',
            })}
          </p>
          <SiteCredit className="shrink-0" />
        </div>
      </div>
    </footer>
  )
}

export default React.memo(HomeFooter)
