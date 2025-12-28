'use client'

import { useState, useCallback } from 'react'
import { useStorymapsData } from './useStorymapsData'
import { useMarkerCalculations } from './useMarkerCalculations'
import { useDateRange } from './useDateRange'
import { useViewMode } from './useViewMode'

/**
 * Main coordinator hook for the StoryMap application.
 * Composes smaller, focused hooks for data fetching, marker calculations,
 * date management, and view mode handling.
 *
 * This hook provides a unified API for the map page while delegating
 * responsibilities to specialized hooks.
 */
export const useStoryMapLogic = () => {
  // Data fetching and management
  const {
    jewishBusinesses,
    detailedStoriesData,
    fullDatabaseData,
    isLoading,
    loadMoreBusinesses,
    loadAllData,
  } = useStorymapsData()

  // Date range management
  const { currentDate, minDate, maxDate, setCurrentDate } = useDateRange()

  // View mode and visible items
  const {
    viewMode,
    mode,
    setViewMode,
    visibleStories,
    enrichedStories,
    totalItems,
    storiesWithDetailCount,
  } = useViewMode({
    detailedStoriesData,
    fullDatabaseData,
    loadAllData,
  })

  // Marker calculations based on current state
  const { markersWithState, enhancedStories } = useMarkerCalculations({
    jewishBusinesses,
    detailedStoriesData,
    fullDatabaseData,
    mode,
    currentDate,
  })

  // Active story selection (kept local for simplicity)
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null)

  const handleMarkerClick = useCallback((storyId: string) => {
    setActiveStoryId(storyId)
  }, [])

  return {
    // Data
    jewishBusinesses,
    enrichedStories: enhancedStories.length > 0 ? enhancedStories : enrichedStories,
    visibleStories,

    // Selection
    activeStoryId,
    setActiveStoryId,
    handleMarkerClick,

    // Date
    currentDate,
    minDate,
    maxDate,
    setCurrentDate,

    // Markers
    testMarkers: markersWithState,

    // Loading
    isLoading,
    totalItems,

    // View mode
    viewMode,
    setViewMode,
    storiesWithDetailCount,
    mode,
    setMode: setViewMode,

    // Progressive loading
    loadMoreBusinesses,
  }
}

export const berlinCoordinates: [number, number] = [52.52, 13.405]
export const defaultZoom = 12
