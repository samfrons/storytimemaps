'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { YearMarker } from '../../types'
import { useTranslation } from '../../i18n/useTranslation'
import {
  getMarkerTypeColor,
  getMarkerTypeLabel,
  formatMarkerDate,
  getMarkerDate,
} from '../../utils/yearMarkerLoader'

interface YearMarkerCardProps {
  marker: YearMarker
  currentDate: Date
  isExpanded?: boolean
  onToggleExpand?: () => void
}

const YearMarkerCard: React.FC<YearMarkerCardProps> = ({
  marker,
  currentDate,
  isExpanded = false,
  onToggleExpand,
}) => {
  const { t } = useTranslation()
  const [imageError, setImageError] = useState(false)

  const markerDate = getMarkerDate(marker)
  const isPast = currentDate >= markerDate
  const typeColor = getMarkerTypeColor(marker.type)
  const typeLabel = getMarkerTypeLabel(marker.type)

  // Get translated content or fall back to default
  const title = marker.titleKey ? t(marker.titleKey) : marker.title
  const description = marker.descriptionKey ? t(marker.descriptionKey) : marker.description
  const longDescription = marker.longDescriptionKey
    ? t(marker.longDescriptionKey)
    : marker.longDescription
  const imageCaption = marker.imageCaptionKey ? t(marker.imageCaptionKey) : marker.imageCaption

  // Don't render if title key returns the key itself (translation missing)
  const displayTitle = title === marker.titleKey ? marker.title : title
  const displayDescription =
    description === marker.descriptionKey ? marker.description : description
  const displayLongDescription =
    longDescription === marker.longDescriptionKey ? marker.longDescription : longDescription

  return (
    <div
      className={`group backdrop-blur border transition-all duration-500 ${
        isPast ? 'opacity-100' : 'opacity-70'
      }`}
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: typeColor,
        borderLeftWidth: '4px',
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {/* Type badge and date */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider"
                style={{
                  backgroundColor: typeColor,
                  color: 'var(--background)',
                }}
              >
                {typeLabel}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>
                {formatMarkerDate(marker)}
              </span>
            </div>

            {/* Title */}
            <h3
              className="font-mono font-bold text-sm transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              {displayTitle}
            </h3>

            {/* Description */}
            <p
              className={`text-xs font-mono mt-2 leading-relaxed ${
                isExpanded ? '' : 'line-clamp-3'
              }`}
              style={{ color: 'var(--foreground-muted)' }}
            >
              {isExpanded && displayLongDescription ? displayLongDescription : displayDescription}
            </p>

            {/* Expand/collapse button */}
            {(displayLongDescription || marker.imageUrl) && (
              <button
                onClick={onToggleExpand}
                className="mt-3 px-3 py-1.5 text-xs font-mono bg-transparent border transition-all uppercase tracking-wider font-semibold inline-flex items-center gap-1.5"
                style={{
                  color: 'var(--foreground)',
                  borderColor: 'var(--muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--muted)'
                  e.currentTarget.style.color = 'var(--background)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--foreground)'
                }}
              >
                {isExpanded ? 'Show Less' : 'Read More'}
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Timeline indicator */}
          <div
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center border"
            style={{
              borderColor: typeColor,
              backgroundColor: isPast ? typeColor : 'transparent',
            }}
          >
            {isPast ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--background)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: typeColor }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Expanded content with image */}
        {isExpanded && marker.imageUrl && !imageError && (
          <div className="mt-4">
            <div
              className="relative w-full h-48 overflow-hidden border"
              style={{ borderColor: 'var(--border)' }}
            >
              <Image
                src={marker.imageUrl}
                alt={displayTitle}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
                onError={() => setImageError(true)}
              />
            </div>
            {imageCaption && (
              <p
                className="text-[10px] font-mono mt-2 italic"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {imageCaption}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(YearMarkerCard)
