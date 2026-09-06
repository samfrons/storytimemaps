import React from 'react'
import { shareCard } from '../../shareCard'
import Link from 'next/link'
import EducationDocument, { readEducationDoc } from '../../components/education/EducationDocument'
import EducationPrintButton from '../../components/education/EducationPrintButton'
import SiteHeader from '../../components/SiteHeader'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Six Lessons From One Archive — Classroom Activities | StoryTimeMaps',
  description:
    'Six free standalone classroom activities for students aged 13–18, each fitting a single lesson and needing no trip: read a street, audit an archive, write a memorial plaque, chart a trade, and put the measures that destroyed Jewish commercial life in order.',
  alternates: {
    canonical: '/education/activities',
  },
  ...shareCard('education', {
    title: 'Six Lessons From One Archive — Classroom Activities | StoryTimeMaps',
    description:
      'Six free standalone classroom activities for students aged 13–18, each fitting a single lesson.',
    alt: 'The teachers page: "Teach it from the evidence, on their own street."',
    path: '/education/activities',
  }),
}

const LEARNING_RESOURCE_LD = {
  '@context': 'https://schema.org',
  '@type': 'LearningResource',
  name: 'Six Lessons From One Archive — Classroom Activities',
  description:
    'Six free standalone classroom activities for students aged 13-18, each fitting a single lesson: read a street, audit an archive, write a memorial plaque, chart a trade, and order the measures that destroyed Jewish commercial life in Berlin.',
  educationalLevel: 'Secondary education',
  learningResourceType: 'Lesson plan',
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'teacher',
  },
  isAccessibleForFree: true,
  inLanguage: 'en',
}

const FACTS: Array<[string, string]> = [
  ['Age range', '13–18'],
  ['Per activity', '45–90 minutes'],
  ['Needs', 'A classroom and one screen per group'],
  ['Subjects', 'History · Ethics · Economics · Language · Maths'],
]

export default function EducationActivitiesPage() {
  const activities = readEducationDoc('classroom-activities.md')

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
            Single-lesson activities · Free to use
          </p>
          <h1
            className="font-kame text-4xl sm:text-6xl leading-tight mb-6"
            style={{ color: 'var(--foreground)' }}
          >
            Six Lessons From One Archive
          </h1>
          <p
            className="font-['Inter'] text-base sm:text-lg leading-relaxed max-w-3xl mb-10"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Six activities that each fit one lesson and need no trip out of the building. Every one
            comes with a printable worksheet, differentiation for 13–15 and 16–18, an assessment
            note, and the pitfalls to expect. Run one, or run all six as a project week.
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

          <div
            className="border-l-4 pl-5 py-2 mb-10 max-w-3xl"
            style={{ borderColor: 'var(--danger)' }}
          >
            <p
              className="font-['Inter'] text-sm leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              <strong style={{ color: 'var(--foreground)' }}>Read this first.</strong> The guidance
              on teaching difficult history is not repeated in this document.{' '}
              <Link href="/education/workbook" style={{ color: 'var(--primary)' }}>
                It lives in the workbook
              </Link>{' '}
              and it is not optional.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/downloads/classroom-activities.md"
              download
              className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
            >
              Download the activities <span aria-hidden="true">↓</span>
            </a>
            <EducationPrintButton />
            <Link
              href="/education/workbook"
              className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider border transition-opacity hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              The project workbook <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* The activities themselves */}
      <section className="px-5 sm:px-8 pb-24 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto pt-16">
          {activities ? (
            <EducationDocument markdown={activities} />
          ) : (
            <p className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
              The activity document is currently unavailable. Please{' '}
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
