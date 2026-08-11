import React from 'react'
import Link from 'next/link'
import EducationDocument, { readEducationDoc } from '../../components/education/EducationDocument'
import EducationPrintButton from '../../components/education/EducationPrintButton'
import SiteHeader from '../../components/SiteHeader'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'The Street You Walk On — Classroom Workbook | StoryTimeMaps',
  description:
    'A free neighbourhood workbook for students aged 13–18: research the Jewish-owned businesses that stood on your own street before 1945, walk to the addresses, and design what continuity could have looked like.',
  alternates: {
    canonical: '/education/workbook',
  },
  openGraph: {
    title: 'The Street You Walk On — Classroom Workbook | StoryTimeMaps',
    description:
      'A free neighbourhood workbook for students aged 13–18, built on the Berlin business archive.',
    url: '/education/workbook',
  },
}

const LEARNING_RESOURCE_LD = {
  '@context': 'https://schema.org',
  '@type': 'LearningResource',
  name: 'The Street You Walk On — Classroom Workbook',
  description:
    'A free neighbourhood workbook for students aged 13-18: research the Jewish-owned businesses that stood on your own street before 1945, walk to the addresses, and design what continuity could have looked like.',
  educationalLevel: 'Secondary education',
  learningResourceType: 'Workbook',
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'teacher',
  },
  isAccessibleForFree: true,
  inLanguage: 'en',
}

const FACTS: Array<[string, string]> = [
  ['Age range', '13–18'],
  ['Group size', '12–30, in pairs or threes'],
  ['Time', '4–6 lesson hours + one 60–90 min walk'],
  ['Subjects', 'History · Geography · Ethics · Economics · Art'],
]

export default function EducationWorkbookPage() {
  const workbook = readEducationDoc('neighborhood-walk-workbook.md')

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LEARNING_RESOURCE_LD) }}
      />
      <SiteHeader active="/education" />

      {/* Hero */}
      <section className="px-5 sm:px-8 py-14 sm:py-20 education-no-print">
        <div className="max-w-5xl mx-auto">
          <p
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--primary)' }}
          >
            The project workbook · Free to use
          </p>
          <h1
            className="font-kame text-4xl sm:text-6xl leading-tight mb-6"
            style={{ color: 'var(--foreground)' }}
          >
            The Street You Walk On
          </h1>
          <p
            className="font-['Inter'] text-base sm:text-lg leading-relaxed max-w-3xl mb-10"
            style={{ color: 'var(--foreground-muted)' }}
          >
            A neighbourhood workbook built on this archive. Students find the Jewish-owned
            businesses that stood on their own street before 1945, walk to the addresses to see what
            is there now, and then take one business forward — designing what it could have become
            had it never been destroyed.
          </p>

          <div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px mb-10"
            style={{ backgroundColor: 'var(--border)' }}
          >
            {FACTS.map(([label, value]) => (
              <div key={label} className="p-5" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.25em] mb-2"
                  style={{ color: 'var(--muted)' }}
                >
                  {label}
                </div>
                <div
                  className="font-mono text-sm font-bold leading-snug"
                  style={{ color: 'var(--foreground)' }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/downloads/neighborhood-walk-workbook.md"
              download
              className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
            >
              Download the workbook <span aria-hidden="true">↓</span>
            </a>
            <EducationPrintButton />
            <Link
              href="/education/activities"
              className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider border transition-opacity hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              Single-lesson activities <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* The workbook itself */}
      <section className="px-5 sm:px-8 pb-24 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto pt-16">
          {workbook ? (
            <EducationDocument markdown={workbook} />
          ) : (
            <p className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
              The workbook document is currently unavailable. Please{' '}
              <Link href="/education" style={{ color: 'var(--primary)' }}>
                return to the teaching hub
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
