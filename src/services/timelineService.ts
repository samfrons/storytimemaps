/**
 * Timeline Service
 * Centralized service for timeline data loading and management.
 * Re-exports and enhances utilities from timelineLoader.
 */

import { TimelineData, TimelineContent, TimelineMediaItem } from '../types'
import {
  loadTimelineData as _loadTimelineData,
  getTimelineContentForDate as _getTimelineContentForDate,
  getTimelineMediaForDate as _getTimelineMediaForDate,
  clearTimelineCache as _clearTimelineCache,
  preloadTimelineData as _preloadTimelineData,
  hasTimelineData as _hasTimelineData,
  subscribeToLoadingState as _subscribeToLoadingState,
} from '../utils/timelineLoader'

// Re-export core timeline utilities
export const loadTimelineData = _loadTimelineData
export const getTimelineContentForDate = _getTimelineContentForDate
export const getTimelineMediaForDate = _getTimelineMediaForDate
export const clearTimelineCache = _clearTimelineCache
export const preloadTimelineData = _preloadTimelineData
export const hasTimelineData = _hasTimelineData
export const subscribeToLoadingState = _subscribeToLoadingState

// ============================================================================
// Types
// ============================================================================

export interface TimelineLoadResult {
  businessId: string
  data: TimelineData | null
  error?: string
}

export interface TimelinePeriod {
  startDate: Date
  endDate: Date | null
  description: string
  media: TimelineMediaItem[]
}

// ============================================================================
// Enhanced Timeline Functions
// ============================================================================

/**
 * Load timeline data for multiple businesses with results
 */
export async function loadMultipleTimelines(businessIds: string[]): Promise<TimelineLoadResult[]> {
  const { loadTimelineData } = await import('../utils/timelineLoader')

  const results = await Promise.allSettled(
    businessIds.map(async (id) => {
      try {
        const data = await loadTimelineData(id)
        return { businessId: id, data }
      } catch (error) {
        return {
          businessId: id,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    return {
      businessId: businessIds[index],
      data: null,
      error: 'Promise rejected',
    }
  })
}

/**
 * Get all timeline periods for a business as structured data
 */
export function getTimelinePeriods(timelineData: TimelineData | null): TimelinePeriod[] {
  if (!timelineData?.timeline) return []

  return timelineData.timeline.map((content) => ({
    startDate: new Date(content.startDate),
    endDate: content.endDate ? new Date(content.endDate) : null,
    description: content.description || content.longDescription || '',
    media: content.media || [],
  }))
}

/**
 * Get the date range covered by timeline data
 */
export function getTimelineDateRange(timelineData: TimelineData | null): {
  start: Date | null
  end: Date | null
} {
  if (!timelineData?.timeline?.length) {
    return { start: null, end: null }
  }

  const dates = timelineData.timeline.flatMap((content) => {
    const dates: Date[] = [new Date(content.startDate)]
    if (content.endDate) dates.push(new Date(content.endDate))
    return dates
  })

  const timestamps = dates.map((d) => d.getTime())

  return {
    start: new Date(Math.min(...timestamps)),
    end: new Date(Math.max(...timestamps)),
  }
}

/**
 * Check if a date falls within any timeline period
 */
export function isDateInTimeline(timelineData: TimelineData | null, date: Date): boolean {
  if (!timelineData?.timeline) return false

  const timestamp = date.getTime()

  return timelineData.timeline.some((content) => {
    const start = new Date(content.startDate).getTime()
    const end = content.endDate ? new Date(content.endDate).getTime() : Infinity

    return timestamp >= start && timestamp <= end
  })
}

/**
 * Get the state description for a business at a specific date
 */
export function getBusinessStateAtDate(
  timelineData: TimelineData | null,
  date: Date
): TimelineContent | null {
  return _getTimelineContentForDate(timelineData, date)
}

/**
 * Count media items available across all timeline periods
 */
export function countTimelineMedia(timelineData: TimelineData | null): number {
  if (!timelineData?.timeline) return 0

  return timelineData.timeline.reduce((count, content) => {
    return count + (content.media?.length || 0)
  }, 0)
}

/**
 * Get all media items from timeline data, flattened
 */
export function getAllTimelineMedia(timelineData: TimelineData | null): TimelineMediaItem[] {
  if (!timelineData?.timeline) return []

  return timelineData.timeline.flatMap((content) => content.media || [])
}

/**
 * Filter timeline content by date range
 */
export function filterTimelineByDateRange(
  timelineData: TimelineData | null,
  startDate: Date,
  endDate: Date
): TimelineContent[] {
  if (!timelineData?.timeline) return []

  const startTimestamp = startDate.getTime()
  const endTimestamp = endDate.getTime()

  return timelineData.timeline.filter((content) => {
    const contentStart = new Date(content.startDate).getTime()
    const contentEnd = content.endDate ? new Date(content.endDate).getTime() : Infinity

    // Check for any overlap
    return contentStart <= endTimestamp && contentEnd >= startTimestamp
  })
}
