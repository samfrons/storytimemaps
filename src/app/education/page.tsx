import React from 'react'
import Link from 'next/link'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'For teachers — Teaching from the archive | StoryTimeMaps',
  description:
    'Free teaching materials built on the archive of Jewish businesses in Berlin, 1900–1945: a three-phase neighbourhood workbook with a walk, and six standalone single-lesson activities with printable worksheets, for students aged 13–18.',
  alternates: {
    canonical: '/education',
  },
  openGraph: {
    title: 'For teachers — Teaching from the archive | StoryTimeMaps',
    description:
      'Free teaching materials built on the archive of Jewish businesses in Berlin, 1900–1945, for students aged 13–18.',
    url: '/education',
  },
}

const LEARNING_RESOURCE_LD = {
  '@context': 'https://schema.org',
  '@type': 'LearningResource',
  name: 'Teaching from the Archive: Jewish Businesses in Berlin, 1900-1945',
  description:
    'Free teaching materials built on the archive of Jewish businesses in Berlin, 1900-1945, for students aged 13-18: a neighbourhood workbook and six standalone classroom activities.',
  educationalLevel: 'Secondary education',
  learningResourceType: 'Lesson plan',
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'teacher',
  },
  isAccessibleForFree: true,
  inLanguage: 'en',
}

/**
 * The teaching hub.
 *
 * /education used to be the workbook itself — one 500-line document with no
 * route in front of it, so a teacher arriving from the nav met a wall of prose
 * and no way to tell whether it fitted their timetable. The workbook now lives
 * at /education/workbook, the single-lesson set at /education/activities, and
 * this page is the choice between them.
 */

const ROUTES = [
  {
    step: '01',
    href: '/education/workbook',
    kicker: 'The project',
    title: 'The Street You Walk On',
    time: '4–6 lesson hours + one walk',
    text: 'Students research the Jewish-owned businesses on their own street, walk to the addresses to see what stands there now, and then design what one of those businesses could have become had it never been destroyed. Three phases, three worksheets, a 90-minute post-walk plan.',
    accent: 'var(--primary)',
    cta: 'Open the workbook',
  },
  {
    step: '02',
    href: '/education/activities',
    kicker: 'Single lessons',
    title: 'Six Lessons From One Archive',
    time: '45–90 minutes each, no trip',
    text: 'Six activities that stand alone and run in a normal classroom. Read one street’s century, take apart a misleading colour, audit what the archive does not hold, draft a memorial plaque under the four-facts rule, chart a trade across the city, and put the decrees in order against the closures they caused.',
    accent: 'var(--success)',
    cta: 'Open the activities',
  },
]

const ACTIVITY_INDEX: Array<[string, string, string, string]> = [
  ['1', 'One street, one century', '60 min', 'History · Geography'],
  ['2', 'Reading the colour', '45 min', 'Media literacy'],
  ['3', 'What the record does not say', '60 min', 'Source criticism'],
  ['4', 'Write the plaque', '90 min', 'Language · Ethics · Design'],
  ['5', 'The trade map', '60 min', 'Economics · Maths'],
  ['6', 'The order of events', '60 min', 'History (causation)'],
]

const RULES = [
  {
    title: 'Set the frame before they touch the map',
    text: 'Say it plainly in the first lesson: these were people’s shops, workshops and offices; they were taken; the people who took them were often local. Students given the frame in advance do not have to discover it alone at an address.',
  },
  {
    title: 'Never let a business “fail”',
    text: 'Use forced sale, forced transfer, liquidation. “The business went under” or “the owner lost the shop” moves the cause onto the victims. Name the actor wherever you can.',
  },
  {
    title: 'Explain the amber state',
    text: '“Declining” on the map does not mean weak sales. It marks the period a business was being squeezed out by boycott, exclusion from trade associations, refused licences and blocked accounts. Unexplained, the colour misleads.',
  },
  {
    title: 'One name said out loud',
    text: 'Ask every group to be able to say one owner’s or founder’s full name. Ten thousand records is a number students cannot feel; one person on one street is.',
  },
  {
    title: 'Anyone can step back, without explaining',
    text: 'Some students have family history inside this material, on any side of it. Offer an alternative task from the start, never assign a business because of a student’s assumed background, and never run any of this as a competition.',
  },
]

const ARCHIVE_FACTS: Array<[string, string]> = [
  ['10,021', 'records in the archive, re-verified against the original source in 2026'],
  ['2,761', 'carrying a trade and dates as well as a name and an address'],
  ['16', 'with a full researched narrative, timeline and photographs'],
  ['2,464', 'complete enough to earn a memorial plaque under the four-facts rule'],
]

export default function EducationHubPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LEARNING_RESOURCE_LD) }}
      />
      <SiteHeader active="/education" />

      {/* Hero */}
      <section className="px-5 sm:px-8 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <p
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-5"
            style={{ color: 'var(--primary)' }}
          >
            For teachers · Free, no sign-up
          </p>
          <h1
            className="font-kame text-4xl sm:text-6xl leading-[1.05] mb-6"
            style={{ color: 'var(--foreground)' }}
          >
            Teach it from the evidence, on their own street.
          </h1>
          <p
            className="font-['Inter'] text-base sm:text-lg leading-relaxed max-w-3xl mb-6"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Two sets of materials, both built directly on the archive behind this site, both written
            for students aged 13–18. Everything is free to copy, print, translate and adapt. Nothing
            asks a student to perform emotion, and nothing turns this history into a game.
          </p>
          <p
            className="font-['Inter'] text-base leading-relaxed max-w-3xl"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Pick the workbook if you have a project week and can leave the building. Pick the
            activities if you have one lesson.
          </p>
        </div>
      </section>

      {/* The two routes */}
      <section
        className="px-5 sm:px-8 pb-14 sm:pb-20 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-5">
          {ROUTES.map((route) => (
            <article
              key={route.href}
              className="border p-7 sm:p-8 flex flex-col"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
            >
              <div className="flex items-baseline justify-between mb-6">
                <span className="font-mono text-4xl font-bold" style={{ color: route.accent }}>
                  {route.step}
                </span>
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.25em]"
                  style={{ color: 'var(--muted)' }}
                >
                  {route.kicker}
                </span>
              </div>

              <h2
                className="font-kame text-2xl sm:text-3xl leading-tight mb-3"
                style={{ color: 'var(--foreground)' }}
              >
                {route.title}
              </h2>
              <p
                className="font-mono text-xs uppercase tracking-wider mb-4"
                style={{ color: route.accent }}
              >
                {route.time}
              </p>
              <p
                className="font-['Inter'] text-sm leading-relaxed mb-7 flex-1"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {route.text}
              </p>

              <Link
                href={route.href}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: route.accent, color: 'var(--background)' }}
              >
                {route.cta} <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Activity index */}
      <section className="px-5 sm:px-8 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <p
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--primary)' }}
          >
            What is in the single-lesson set
          </p>
          <h2
            className="font-kame text-3xl sm:text-5xl leading-tight mb-8"
            style={{ color: 'var(--foreground)' }}
          >
            Six lessons, each with its worksheet.
          </h2>

          <ol className="grid gap-px" style={{ backgroundColor: 'var(--border)' }}>
            {ACTIVITY_INDEX.map(([n, title, time, subjects]) => (
              <li
                key={n}
                className="p-5 flex flex-wrap items-baseline gap-x-5 gap-y-1"
                style={{ backgroundColor: 'var(--card-bg)' }}
              >
                <span
                  aria-hidden="true"
                  className="font-mono text-xl font-bold w-8 flex-shrink-0"
                  style={{ color: 'var(--primary)' }}
                >
                  {n}
                </span>
                <span
                  className="font-mono text-sm font-bold flex-1 min-w-[12rem]"
                  style={{ color: 'var(--foreground)' }}
                >
                  {title}
                </span>
                <span className="font-mono text-xs" style={{ color: 'var(--foreground-muted)' }}>
                  {time}
                </span>
                <span
                  className="font-mono text-[11px] uppercase tracking-wider"
                  style={{ color: 'var(--muted)' }}
                >
                  {subjects}
                </span>
              </li>
            ))}
          </ol>

          <p
            className="font-['Inter'] text-sm leading-relaxed mt-6"
            style={{ color: 'var(--foreground-muted)' }}
          >
            If you can only run one: activity 1 makes the archive personal, activity 6 makes it
            explicable.{' '}
            <Link href="/education/activities" style={{ color: 'var(--primary)' }}>
              Read them in full
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Before you teach this */}
      <section
        className="px-5 sm:px-8 py-14 sm:py-20 border-t"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
      >
        <div className="max-w-5xl mx-auto">
          <p
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--danger)' }}
          >
            Read before you plan the lesson
          </p>
          <h2
            className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            Five things that are not optional.
          </h2>
          <p
            className="font-['Inter'] text-base leading-relaxed max-w-3xl mb-8"
            style={{ color: 'var(--foreground-muted)' }}
          >
            The full guidance on teaching this history — including what to do when a student
            discloses something, and how to handle antisemitism in the room — is in the workbook.
            This is the part no one should skip.
          </p>

          <ol className="grid sm:grid-cols-2 gap-px" style={{ backgroundColor: 'var(--border)' }}>
            {RULES.map((rule, i) => (
              <li key={rule.title} className="p-6" style={{ backgroundColor: 'var(--background)' }}>
                <div className="flex items-baseline gap-3 mb-3">
                  <span
                    aria-hidden="true"
                    className="font-mono text-lg font-bold"
                    style={{ color: 'var(--danger)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3
                    className="font-mono text-sm font-bold leading-snug"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {rule.title}
                  </h3>
                </div>
                <p
                  className="font-['Inter'] text-sm leading-relaxed"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {rule.text}
                </p>
              </li>
            ))}
          </ol>

          <p className="font-mono text-xs mt-6" style={{ color: 'var(--foreground-muted)' }}>
            <Link href="/education/workbook" style={{ color: 'var(--primary)' }}>
              Read the full guidance in the workbook →
            </Link>
          </p>
        </div>
      </section>

      {/* What the archive holds */}
      <section
        className="px-5 sm:px-8 py-14 sm:py-20 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-5xl mx-auto">
          <p
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--primary)' }}
          >
            Tell students this before they search
          </p>
          <h2
            className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            What the archive holds, and what it does not.
          </h2>
          <p
            className="font-['Inter'] text-base leading-relaxed max-w-3xl mb-8"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Coverage is dense in Mitte, northern Kreuzberg and Charlottenburg, and thin in the outer
            districts. A thin result is not evidence that nothing happened there — it is partly
            where research has been done so far. A record with no dates is not a business with no
            story; it is one whose story has not been reconstructed yet, and naming that gap is
            itself a finding.
          </p>

          <div className="grid sm:grid-cols-2 gap-px" style={{ backgroundColor: 'var(--border)' }}>
            {ARCHIVE_FACTS.map(([value, label]) => (
              <div key={value} className="p-6" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div
                  className="font-mono text-3xl font-bold mb-2"
                  style={{ color: 'var(--primary)' }}
                >
                  {value}
                </div>
                <p
                  className="font-['Inter'] text-sm leading-relaxed"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Downloads and onward links */}
      <section
        className="px-5 sm:px-8 py-14 sm:py-20 border-t"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="font-kame text-2xl sm:text-4xl leading-tight mb-6"
            style={{ color: 'var(--foreground)' }}
          >
            Take it with you.
          </h2>
          <div className="flex flex-wrap gap-3 mb-10">
            <a
              href="/downloads/neighborhood-walk-workbook.md"
              download
              className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
            >
              Workbook <span aria-hidden="true">↓</span>
            </a>
            <a
              href="/downloads/classroom-activities.md"
              download
              className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--success)', color: 'var(--background)' }}
            >
              Six activities <span aria-hidden="true">↓</span>
            </a>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider border transition-opacity hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              Open the map <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="border p-6" style={{ borderColor: 'var(--border)' }}>
              <h3
                className="font-mono text-sm font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--foreground)' }}
              >
                Bring a class to the exhibition
              </h3>
              <p
                className="font-['Inter'] text-sm leading-relaxed mb-4"
                style={{ color: 'var(--foreground-muted)' }}
              >
                The installation is designed to hold a school group for forty minutes: a city map on
                the floor, a year slider on the wall, and a table of finished memorial plaques that
                can be picked up and read.
              </p>
              <Link
                href="/exhibit-vision"
                className="font-mono text-xs uppercase tracking-wider"
                style={{ color: 'var(--primary)' }}
              >
                The exhibition <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="border p-6" style={{ borderColor: 'var(--border)' }}>
              <h3
                className="font-mono text-sm font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--foreground)' }}
              >
                Adopt the block your school stands on
              </h3>
              <p
                className="font-['Inter'] text-sm leading-relaxed mb-4"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Activity 4 ends with a drafted plaque. A school can take that further and sponsor a
                real one at a real address — the four-facts rule is the same on paper and on the
                wall.
              </p>
              <Link
                href="/plaques"
                className="font-mono text-xs uppercase tracking-wider"
                style={{ color: 'var(--primary)' }}
              >
                The plaque initiative <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <p
            className="font-mono text-[11px] leading-relaxed mt-10"
            style={{ color: 'var(--muted)' }}
          >
            Materials are drawn from the Datenbank jüdischer Gewerbebetriebe in Berlin at
            Humboldt-Universität zu Berlin, grounded in Dr. Christoph Kreutzmüller’s research, with
            archival material informed by the Leo Baeck Institute. Free to copy, print, translate
            and adapt for classroom use.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
