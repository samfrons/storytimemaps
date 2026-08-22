import React from 'react'

/**
 * The site's copyright and authorship credit, in one place so the three
 * footers (homepage, collaborator hub, contributor guides) can never drift
 * out of sync with each other.
 */

export const COPYRIGHT_YEAR = '2026'
export const AUTHOR_SITE = 'samfrons.xyz'
export const AUTHOR_SITE_URL = 'https://samfrons.xyz'

const SiteCopyright: React.FC<{ className?: string }> = ({ className }) => (
  <span className={className} style={{ color: 'var(--foreground-muted)' }}>
    © {COPYRIGHT_YEAR}{' '}
    <a
      href={AUTHOR_SITE_URL}
      target="_blank"
      rel="noreferrer noopener"
      className="transition-opacity hover:opacity-80"
      style={{ color: 'var(--primary)', outline: 'none', boxShadow: 'none' }}
    >
      {AUTHOR_SITE}
    </a>
  </span>
)

export default React.memo(SiteCopyright)
