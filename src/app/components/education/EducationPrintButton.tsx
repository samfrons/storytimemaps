'use client'

import React from 'react'

/**
 * Print trigger for the workbook page.
 *
 * Split into its own client component so /education itself can stay a server
 * component — it reads the workbook off disk, which a client component cannot do.
 */
const EducationPrintButton: React.FC = () => (
  <button
    type="button"
    onClick={() => window.print()}
    className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm uppercase tracking-wider border transition-opacity hover:opacity-80 education-print-btn"
    style={{
      borderColor: 'var(--border)',
      color: 'var(--foreground)',
      backgroundColor: 'var(--card-bg)',
      cursor: 'pointer',
    }}
  >
    Print worksheets
  </button>
)

export default React.memo(EducationPrintButton)
