import React from 'react'
import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import EducationPrintButton from '../components/education/EducationPrintButton'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'The Street You Walk On — Classroom Workbook | StoryTimeMaps',
  description:
    'A free neighbourhood workbook for students aged 13–18: research the Jewish-owned businesses that stood on your own street before 1945, walk to the addresses, and design what continuity could have looked like.',
}

/**
 * The classroom workbook, served as a page.
 *
 * The workbook is authored and maintained as Markdown in docs/education — that
 * file is the single source of truth, and it is also what a teacher downloads.
 * Rendering it here rather than re-typing it as JSX means the page can never
 * drift from the document, and edits stay reviewable as prose diffs.
 *
 * Read at request time from the repo (not /public): the file is a build input,
 * not a static asset, and force-dynamic keeps it off the prerender path so a
 * missing docs/ directory can never fail a build.
 */
function readWorkbook(): string | null {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'docs/education/neighborhood-walk-workbook.md'),
      'utf8'
    )
    // The document opens with its own title and subtitle, which the page hero
    // above already states. Drop just those two leading heading lines so the
    // reader is not shown the title twice — the draft/translation note that
    // follows them is kept, since it is real information for a teacher.
    return raw.replace(/^\s*#\s+.*\n(?:\s*#{3}\s+.*\n)?/, '')
  } catch {
    return null
  }
}

const FACTS: Array<[string, string]> = [
  ['Age range', '13–18'],
  ['Group size', '12–30, in pairs or threes'],
  ['Time', '4–6 lesson hours + one 60–90 min walk'],
  ['Subjects', 'History · Geography · Ethics · Economics · Art'],
]

export default function EducationPage() {
  const workbook = readWorkbook()

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header
        className="border-b px-5 sm:px-8 py-5 education-no-print"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-kame text-lg tracking-wide"
            style={{ color: 'var(--foreground)' }}
          >
            STORYTIMEMAPS
          </Link>
          <nav className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.2em]">
            <Link href="/map" style={{ color: 'var(--foreground-muted)' }}>
              Map
            </Link>
            <Link href="/plaques" style={{ color: 'var(--foreground-muted)' }}>
              Plaques
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 education-no-print">
        <div className="max-w-5xl mx-auto">
          <p
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--primary)' }}
          >
            For teachers · Free to use
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
          </div>
        </div>
      </section>

      {/* The workbook itself */}
      <section className="px-5 sm:px-8 pb-24 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto pt-16">
          {workbook ? (
            <article className="workbook-prose">
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // The worksheet grids are wide; without this wrapper they push the
                  // whole page into horizontal scroll on a phone.
                  //
                  // `node` (react-markdown's hast element) is destructured out and
                  // discarded, not spread — spreading it onto a real <table> passes an
                  // object as a DOM attribute, which React warns about on every render.
                  table: ({ node: _node, children, ...props }) => (
                    <div className="workbook-table-scroll">
                      <table {...props}>{children}</table>
                    </div>
                  ),
                }}
              >
                {workbook}
              </Markdown>
            </article>
          ) : (
            <p className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
              The workbook document is currently unavailable. Please{' '}
              <Link href="/" style={{ color: 'var(--primary)' }}>
                return to the homepage
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
