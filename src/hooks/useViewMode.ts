'use client'

import { useState, useEffect, useCallback } from 'react'
import { StoryMap } from '../types'

type ViewMode = 'stories' | 'database'

interface UseViewModeProps {
  detailedStoriesData: StoryMap[]
  fullDatabaseData: StoryMap[]
  loadAllData: () => Promise<void>
}

interface UseViewModeReturn {
  viewMode: ViewMode
  mode: ViewMode
  setViewMode: (mode: ViewMode) => void
  visibleStories: StoryMap[]
  enrichedStories: StoryMap[]
  totalItems: number
  storiesWithDetailCount: number
}

/**
 * Hook for managing view mode (stories vs database) and visible items.
 * Handles switching between curated stories and full database view.
 */
export function useViewMode({
  detailedStoriesData,
  fullDatabaseData,
  loadAllData,
}: UseViewModeProps): UseViewModeReturn {
  const [viewMode, setViewModeState] = useState<ViewMode>('stories')
  const [mode, setMode] = useState<ViewMode>('stories')
  const [visibleStories, setVisibleStories] = useState<StoryMap[]>([])
  const [enrichedStories, setEnrichedStories] = useState<StoryMap[]>([])
  const [totalItems, setTotalItems] = useState(10847)

  // Calculate stories with detail count
  const storiesWithDetailCount = detailedStoriesData.length > 0 ? detailedStoriesData.length : 15

  // Handle view mode changes
  const setViewMode = useCallback(
    (newMode: ViewMode) => {
      setViewModeState(newMode)

      // Load all data when switching to database mode
      if (newMode === 'database' && fullDatabaseData.length < 10000) {
        loadAllData()
      }
    },
    [fullDatabaseData.length, loadAllData]
  )

  // Update visible stories based on mode
  useEffect(() => {
    if (viewMode === 'stories') {
      setVisibleStories(detailedStoriesData)
      setEnrichedStories(detailedStoriesData)
      setTotalItems(detailedStoriesData.length || 15)
    } else {
      setVisibleStories(fullDatabaseData)
      setEnrichedStories(fullDatabaseData)
      setTotalItems(fullDatabaseData.length >= 10000 ? fullDatabaseData.length : 10021)
    }
    setMode(viewMode)
  }, [fullDatabaseData, detailedStoriesData, viewMode])

  return {
    viewMode,
    mode,
    setViewMode,
    visibleStories,
    enrichedStories,
    totalItems,
    storiesWithDetailCount,
  }
}

export type { ViewMode }
