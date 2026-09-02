import React from 'react'

/**
 * The site-wide copyright line.
 *
 * One component so the notice reads identically wherever a page ends — the
 * homepage footer, the guide shell, the collaborate page, the tour colophon —
 * and so the year and the domain have a single place to change.
 *
 * It renders inline content only, without a wrapper: each footer already has
 * its own element and typography (a chip in a flex row, a paragraph under a
 * rule), and this line should inherit them rather than fight them.
 *
 * Deliberately untranslated — a name and a domain read the same in every
 * language the site is served in.
 */
const CopyrightNotice: React.FC<{
  /** Applied to the samfrons.xyz link, which each footer colors for itself. */
  linkClassName?: string
  linkStyle?: React.CSSProperties
}> = ({ linkClassName, linkStyle }) => (
  <>
    © 2026 Sam Frons ·{' '}
    <a
      href="https://samfrons.xyz"
      target="_blank"
      rel="noreferrer noopener"
      className={linkClassName}
      style={{ outline: 'none', boxShadow: 'none', ...linkStyle }}
    >
      samfrons.xyz
    </a>
  </>
)

export default React.memo(CopyrightNotice)
