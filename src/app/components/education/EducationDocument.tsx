import React from 'react'
import fs from 'fs'
import path from 'path'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders a teaching document from docs/education.
 *
 * The Markdown files are the single source of truth: they are what a teacher
 * downloads, and rendering them rather than re-typing them as JSX means the
 * page can never drift from the document and edits stay reviewable as prose
 * diffs.
 *
 * Read at request time from the repo (not /public): these are build inputs,
 * not static assets, and the pages that use this set `force-dynamic` so a
 * missing docs/ directory can never fail a build.
 */
export function readEducationDoc(filename: string): string | null {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'docs/education', filename), 'utf8')
    // Each document opens with its own title and subtitle, which the page hero
    // above already states. Drop just those two leading heading lines so the
    // reader is not shown the title twice — the draft/translation note that
    // follows them is kept, since it is real information for a teacher.
    return raw.replace(/^\s*#\s+.*\n(?:\s*#{3}\s+.*\n)?/, '')
  } catch {
    return null
  }
}

const EducationDocument: React.FC<{ markdown: string }> = ({ markdown }) => (
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
      {markdown}
    </Markdown>
  </article>
)

export default EducationDocument
