import React from 'react'
import type { DocHeading } from './MarkdownDocument'

/**
 * Section links for a long document.
 *
 * The contributor guides run to several screens; without this a reader has to
 * scroll the whole thing to find out whether it covers their question. The ids
 * come from the same slugger rehype-slug uses when rendering, so every entry
 * lands on its heading.
 */
const DocTableOfContents: React.FC<{ headings: DocHeading[]; label?: string }> = ({
  headings,
  label = 'On this page',
}) => {
  if (headings.length < 2) return null

  return (
    <nav
      aria-label={label}
      className="border p-6 mb-14 print:hidden"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
    >
      <h2
        className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </h2>
      <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
        {headings.map(({ id, text }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="font-mono text-xs leading-relaxed transition-opacity hover:opacity-70"
              style={{ color: 'var(--foreground)' }}
            >
              {text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default React.memo(DocTableOfContents)
