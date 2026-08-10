'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'

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
            <Link
              href="/frankfurt"
              className="font-mono text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('homepage.nav.frankfurt', { defaultValue: 'Frankfurt' })}
            </Link>
          </nav>
        </div>

        <div className="border-t mt-10 pt-6" style={{ borderColor: 'var(--border)' }}>
          <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            {t('homepage.footer.citation', {
              defaultValue:
                'Based on the research of Dr. Christoph Kreutzmüller and the database of Jewish commercial activity in Berlin. For academic use, please cite the original research.',
            })}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default React.memo(HomeFooter)
