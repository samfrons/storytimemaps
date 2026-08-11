'use client'

import React from 'react'
import Image from 'next/image'

interface ExhibitFigureProps {
  src: string
  alt: string
  width: number
  height: number
  /** Short label printed above the caption, e.g. "Station 01". */
  eyebrow?: string
  caption: string
  /**
   * Every image on this page is a design study, not documentation of an
   * installation that exists. Saying so on the image itself — rather than in
   * small print somewhere below — is the honest way to show a proposal to a
   * venue or a funder.
   */
  disclosure?: string
  priority?: boolean
}

const DEFAULT_DISCLOSURE = 'Concept visualisation — not a photograph of an existing installation.'

const ExhibitFigure: React.FC<ExhibitFigureProps> = ({
  src,
  alt,
  width,
  height,
  eyebrow,
  caption,
  disclosure = DEFAULT_DISCLOSURE,
  priority = false,
}) => (
  <figure className="border" style={{ borderColor: 'var(--border)' }}>
    <div style={{ backgroundColor: 'var(--card-bg)' }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes="(max-width: 768px) 100vw, 640px"
        className="w-full h-auto"
      />
    </div>
    <figcaption
      className="p-5 border-t"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
    >
      {eyebrow && (
        <div
          className="font-mono text-[10px] uppercase tracking-[0.25em] mb-2"
          style={{ color: 'var(--primary)' }}
        >
          {eyebrow}
        </div>
      )}
      <p
        className="font-['Inter'] text-sm leading-relaxed mb-2"
        style={{ color: 'var(--foreground-muted)' }}
      >
        {caption}
      </p>
      <p className="font-mono text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        {disclosure}
      </p>
    </figcaption>
  </figure>
)

export default React.memo(ExhibitFigure)
