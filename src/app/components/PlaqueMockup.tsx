// File: src/app/components/PlaqueMockup.tsx
//
// Renders a per-business memorial plaque mockup as inline SVG.
// Used on every business listing page (gated on verified_address) to
// visualize what a real plaque would look like at that address, paired
// with the PlaqueInquiryForm.
//
// The visual layout matches the hand-crafted SVGs in
// /public/plaques/{berlin,brass}-style/ used by PlaquesHero.tsx so the
// design language is consistent across the landing page and listings.

'use client'

import React from 'react'
import { useTranslation } from '../../i18n/useTranslation'

interface PlaqueMockupProps {
  businessName: string
  address: string
  startYear?: number
  endYear?: number
  businessType?: string
  style?: 'berlin' | 'brass'
}

// Approximates a glyph width as a fraction of font size. SVG text doesn't
// auto-wrap, so we use this to pick a font size that fits the 660px text
// column without measuring DOM.
const GLYPH_RATIO = 0.55
const MAX_TEXT_WIDTH = 480 // x=335 anchor, plaque text column reaches ~75-595

const fitFontSize = (text: string, baseSize: number, minSize: number): number => {
  if (!text) return baseSize
  const estWidth = text.length * baseSize * GLYPH_RATIO
  if (estWidth <= MAX_TEXT_WIDTH) return baseSize
  const scaled = Math.floor((MAX_TEXT_WIDTH / (text.length * GLYPH_RATIO)) * 0.95)
  return Math.max(minSize, scaled)
}

const stripCitySuffix = (address: string): string =>
  address
    .replace(/,\s*Berlin.*$/i, '')
    .replace(/,\s*Germany.*$/i, '')
    .trim()

const formatYearRange = (startYear?: number, endYear?: number): string => {
  if (startYear && endYear) return `${startYear} – ${endYear}`
  if (startYear) return `${startYear} –`
  if (endYear) return `– ${endYear}`
  return ''
}

const PlaqueMockup: React.FC<PlaqueMockupProps> = ({
  businessName,
  address,
  startYear,
  endYear,
  businessType,
  style = 'berlin',
}) => {
  const { t } = useTranslation()

  const isBerlin = style === 'berlin'
  const palette = isBerlin
    ? {
        outerFrame: '#a0917a',
        innerFrame: '#c4b8a8',
        background: '#f8f6f0',
        primary: '#1a365d',
        secondary: '#2c5282',
        qrBorder: '#2c5282',
      }
    : {
        outerFrame: '#8b6914',
        innerFrame: '#b8902f',
        background: '#d4af37',
        primary: '#3d2817',
        secondary: '#5c3d1f',
        qrBorder: '#3d2817',
      }

  const displayAddress = stripCitySuffix(address)
  const yearRange = formatYearRange(startYear, endYear)

  const nameSize = fitFontSize(businessName, 32, 18)
  const addressSize = fitFontSize(`${displayAddress}, Berlin`, 18, 13)
  const typeSize = fitFontSize(businessType || '', 16, 12)

  const altText =
    t('plaques.mockup.altText', { name: businessName }) ||
    `Memorial plaque mockup for ${businessName}`
  const caption = t('plaques.mockup.caption') || 'Imagine a plaque like this here'

  return (
    <figure className="w-full">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 450"
        role="img"
        aria-label={altText}
        className="w-full h-auto border"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Outer metallic frame */}
        <rect width="800" height="450" fill={palette.outerFrame} />

        {/* Inner frame border */}
        <rect x="8" y="8" width="784" height="434" fill={palette.innerFrame} />

        {/* Main background */}
        <rect x="16" y="16" width="768" height="418" fill={palette.background} />

        {/* MOCKUP watermark — small, top-right corner — communicates this is not a real plaque */}
        <text
          x="775"
          y="35"
          textAnchor="end"
          fontFamily="'Helvetica Neue', Arial, sans-serif"
          fontSize="10"
          fill={palette.secondary}
          opacity="0.5"
          letterSpacing="2"
        >
          {(t('plaques.mockup.watermark') || 'MOCKUP').toString().toUpperCase()}
        </text>

        {/* Business type (italic, top) */}
        {businessType && (
          <text
            x="335"
            y="65"
            textAnchor="middle"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize={typeSize}
            fill={palette.secondary}
            fontStyle="italic"
          >
            {businessType}
          </text>
        )}

        {/* Business name (large, centered) */}
        <text
          x="335"
          y="115"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize={nameSize}
          fill={palette.primary}
          fontWeight="600"
        >
          {businessName}
        </text>

        {/* Year range */}
        {yearRange && (
          <text
            x="335"
            y="165"
            textAnchor="middle"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize="22"
            fill={palette.primary}
          >
            {yearRange}
          </text>
        )}

        {/* Address */}
        <text
          x="335"
          y="215"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize={addressSize}
          fill={palette.secondary}
        >
          {`${displayAddress}, Berlin`}
        </text>

        {/* Divider line */}
        <line
          x1="80"
          y1="250"
          x2="540"
          y2="250"
          stroke={palette.secondary}
          strokeWidth="0.5"
          opacity="0.4"
        />

        {/* Memorial text */}
        <text
          x="335"
          y="295"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="13"
          fill={palette.secondary}
          fontStyle="italic"
        >
          {(
            t('plaques.mockup.memorial') || 'In memory of Berlin’s Jewish business community'
          ).toString()}
        </text>

        {/* URL at bottom */}
        <text
          x="335"
          y="400"
          textAnchor="middle"
          fontFamily="'Helvetica Neue', Arial, sans-serif"
          fontSize="13"
          fill={palette.secondary}
          letterSpacing="1"
        >
          storytimemaps.com
        </text>

        {/* QR placeholder section (right side) — decorative grid suggesting a real QR code would live here */}
        <g transform="translate(610, 140)">
          <rect
            x="-8"
            y="-8"
            width="156"
            height="156"
            fill={palette.background}
            stroke={palette.qrBorder}
            strokeWidth="0.5"
          />
          {/* Stylized 7x7 grid pattern as QR placeholder */}
          {Array.from({ length: 7 }, (_, row) =>
            Array.from({ length: 7 }, (_, col) => {
              // Deterministic dot pattern — placement-finder corners + sparse infill
              const isCorner = (row < 3 && col < 3) || (row < 3 && col > 3) || (row > 3 && col < 3)
              const isCornerEdge =
                (isCorner && (row === 0 || row === 2 || col === 0 || col === 2)) ||
                (isCorner && row === 1 && col === 1)
              const sparse = (row * 7 + col) % 5 === 0 && !isCorner
              const filled = isCornerEdge || sparse
              if (!filled) return null
              return (
                <rect
                  key={`${row}-${col}`}
                  x={col * 20}
                  y={row * 20}
                  width="18"
                  height="18"
                  fill={palette.primary}
                />
              )
            })
          )}
        </g>
      </svg>
      <figcaption
        className="text-xs font-mono mt-2 text-center"
        style={{ color: 'var(--foreground-muted)' }}
      >
        {caption}
      </figcaption>
    </figure>
  )
}

export default React.memo(PlaqueMockup)
