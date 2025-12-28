'use client'

import React from 'react'
import { Popup } from 'react-map-gl/mapbox'
import { getTimelineContentForDate } from '../../../utils/timelineLoader'
import type { ThemeColors } from './mapStyles'
import type { TimelineData } from '../../../types'

interface PopupProperties {
  id?: string
  popup?: string
  state?: string
  description?: string | null
  startDate?: string | null
  endDate?: string | null
  hasTimelineData?: boolean
  [key: string]: unknown
}

interface PopupInfo {
  longitude: number
  latitude: number
  properties: PopupProperties
}

interface TimelineDataMap {
  [key: string]: TimelineData | null
}

interface MapPopupProps {
  popupInfo: PopupInfo
  onClose: () => void
  theme: string | undefined
  colors: ThemeColors
  popupTimelineData: TimelineDataMap
  selectedDate?: Date
  t: (key: string) => string
}

/**
 * Map popup component for displaying business details.
 * Shows title, date range, description, and timeline data indicator.
 */
const MapPopup: React.FC<MapPopupProps> = ({
  popupInfo,
  onClose,
  theme,
  colors,
  popupTimelineData,
  selectedDate,
  t,
}) => {
  const { properties, longitude, latitude } = popupInfo

  // Get background color based on state and theme
  const getBackgroundColor = () => {
    if (theme === 'archival') {
      if (properties.state === 'declining') return 'var(--popup-declining-bg)'
      if (properties.state === 'closed') return 'var(--popup-closed-bg)'
      return 'var(--popup-active-bg)'
    }
    if (properties.state === 'declining') return `${colors.declining}fa`
    if (properties.state === 'closed') return `${colors.closed}fa`
    return `${colors.active}fa`
  }

  // Get text color based on state and theme
  const getTextColor = () => {
    if (properties.state === 'closed') return 'var(--closed-text)'
    if (properties.state === 'declining') return 'var(--declining-text)'
    if (theme === 'bauhaus') return 'var(--active-text)'
    if (theme === 'moody' || !theme) return 'var(--active-text)'
    if (theme === 'archival') return 'var(--active-text)'
    return '#2a2a2a'
  }

  // Get border color
  const getBorderColor = () => {
    if (theme === 'archival') return '#5a7397'
    if (properties.state === 'declining') return colors.declining
    if (properties.state === 'closed') return colors.closed
    return colors.active
  }

  // Get timeline-aware description if available
  const getDescription = () => {
    const timelineData = properties.id && popupTimelineData[properties.id]
    const timelineContent =
      timelineData && selectedDate ? getTimelineContentForDate(timelineData, selectedDate) : null
    return timelineContent?.description || properties.description
  }

  const handleViewMore = () => {
    // Find the story in the list and trigger view details
    const storyElement = document.querySelector(`[data-story-id="${properties.id}"]`)
    if (storyElement) {
      const viewDetailsButton = storyElement.querySelector('.view-details-button') as HTMLElement
      if (viewDetailsButton) {
        viewDetailsButton.click()
      }
    }
    onClose()
  }

  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      onClose={onClose}
      closeButton={true}
      anchor="top"
      offset={15}
      className={`mapbox-detail-popup popup-state-${properties.state || 'active'}`}
    >
      <div
        style={{
          minWidth: '200px',
          maxWidth: '300px',
          padding: '14px',
          background: getBackgroundColor(),
          color: getTextColor(),
          fontFamily: 'Space Mono, monospace',
          border: `2px solid ${getBorderColor()}`,
        }}
      >
        <h3
          className="font-bold text-base mb-2"
          style={{
            color: 'inherit',
            fontFamily: 'Space Mono, monospace',
          }}
        >
          {properties.popup}
        </h3>
        {properties && (
          <>
            <div
              className="text-xs mb-2"
              style={{
                opacity: 0.8,
                color: 'inherit',
              }}
            >
              {properties.startDate &&
                properties.endDate &&
                `${new Date(properties.startDate).getFullYear()} -
                 ${new Date(properties.endDate).getFullYear()}`}
            </div>
            {(() => {
              const description = getDescription()
              return description ? (
                <p
                  className="text-xs line-clamp-3"
                  style={{
                    color: 'inherit',
                    opacity: 0.9,
                  }}
                >
                  {description}
                </p>
              ) : null
            })()}
            {/* Timeline Data Availability Indicator */}
            {Boolean(properties.hasTimelineData) && (
              <div
                className="flex items-center gap-1 text-xs mb-2 px-2 py-1"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'inherit',
                }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span style={{ opacity: 0.9 }}>Timeline data available</span>
              </div>
            )}
            <div
              className="text-xs mt-3 font-bold cursor-pointer uppercase tracking-wide flex items-center justify-between"
              style={{
                color: 'inherit',
                textDecoration: 'underline',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                padding: 0,
              }}
              onClick={handleViewMore}
            >
              <span>{t('mainPage.map.viewMore') || 'View more →'}</span>
              {Boolean(properties.hasTimelineData) && (
                <svg
                  className="w-3 h-3 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ opacity: 0.7 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              )}
            </div>
          </>
        )}
      </div>
    </Popup>
  )
}

export default React.memo(MapPopup)
