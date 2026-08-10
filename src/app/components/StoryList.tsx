// file: src/app/components/StoryList.tsx

'use client'

import Image from 'next/image'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import TimeSlider from './TimeSlider'
import YearMarkerCard from './YearMarkerCard'
import { StoryMap, YearMarker } from '../../types'
import BusinessDetailModal from './BusinessDetailModal'
import { throttle } from '../../utils/performance'
import { getZipcodeFromAddress } from '../../utils/berlinZipcodes'
import { useTranslation } from '../../i18n/useTranslation'
import {
  getTranslatedDescription,
  getTranslatedBusinessName,
} from '../../utils/businessTranslations'
import {
  ALL_CATEGORIES,
  UNCATEGORISED,
  mainBranchLabel,
  mainFilterValue,
  matchesFilter,
  parseFilter,
  sectorFilterValue,
  sectorLabel,
  tallyCategories,
} from '../../utils/businessSectors'
import { loadTimelineData, getTimelineContentForDate } from '../../utils/timelineLoader'
import { loadYearMarkers, sortMarkers, getMarkerDate } from '../../utils/yearMarkerLoader'

interface StoryListProps {
  visibleStories: StoryMap[]
  activeStoryId: string | null
  minDate: Date
  maxDate: Date
  currentDate: Date
  setCurrentDate: (date: Date) => void
  onStoryClick: (storyId: string) => void
  autoOpenDetailId?: string | null
  /** Records still in this list but withheld from the map because their address is ungeocoded. */
  unlocatedCount?: number
  /** Drawer layout renders the time slider over the map instead of inside this header. */
  hideTimeSlider?: boolean
  /**
   * Category filter. Optional so this component still works standalone, but
   * page.tsx passes both so the map legend and this dropdown drive the same
   * selection.
   */
  selectedCategory?: string
  onSelectCategory?: (value: string) => void
}

const StoryList: React.FC<StoryListProps> = ({
  visibleStories,
  activeStoryId,
  minDate,
  maxDate,
  currentDate,
  setCurrentDate,
  onStoryClick,
  autoOpenDetailId,
  unlocatedCount = 0,
  hideTimeSlider = false,
  selectedCategory: controlledCategory,
  onSelectCategory,
}) => {
  const [selectedStory, setSelectedStory] = useState<StoryMap | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { theme } = useTheme()
  const { t, language } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)
  const storyRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  // Controlled when page.tsx supplies both props (so the map legend stays in
  // sync), uncontrolled otherwise.
  const [internalCategory, setInternalCategory] = useState(ALL_CATEGORIES)
  const selectedCategory = controlledCategory ?? internalCategory
  const setSelectedCategory = onSelectCategory ?? setInternalCategory
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  const [showSearchFilter, setShowSearchFilter] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const listRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [timelineDescriptions, setTimelineDescriptions] = useState<{
    [key: string]: string | null
  }>({})
  const [yearMarkers, setYearMarkers] = useState<YearMarker[]>([])
  const [expandedMarkers, setExpandedMarkers] = useState<Set<string>>(new Set())
  const [showYearMarkers, setShowYearMarkers] = useState(true)

  // Debounce search query for performance (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleViewDetails = (story: StoryMap, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect()
    setOriginRect(rect)
    setSelectedStory(story)
    setModalOpen(true)

    // Update URL with business id for deep linking
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', story.id)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const closeModal = () => {
    setModalOpen(false)
    setTimeout(() => {
      setSelectedStory(null)
      setOriginRect(null)
    }, 600)

    // Remove id from URL when closing modal
    const params = new URLSearchParams(searchParams.toString())
    params.delete('id')
    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  const handleDropdownToggle = () => {
    if (!isDropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
    setIsDropdownOpen(!isDropdownOpen)
  }

  /**
   * One row of the category dropdown. Sectors are rendered indented under
   * their branch; the active row keeps the existing border-left treatment so
   * selection stays visible without a focus ring (project rule: no blue
   * outlines) and without a rounded corner.
   */
  const renderCategoryOption = (value: string, label: string, count?: number, indented = false) => {
    const isActive = selectedCategory === value
    return (
      <button
        key={value}
        onClick={() => {
          setSelectedCategory(value)
          setIsDropdownOpen(false)
        }}
        className={`w-full py-2.5 text-left text-xs font-mono transition-colors focus:outline-none flex items-center justify-between gap-2 ${
          indented ? 'pl-6 pr-3' : 'px-3'
        } ${isActive ? 'border-l-2 dropdown-active' : ''}`}
        style={{
          backgroundColor: isActive ? 'var(--border)' : 'transparent',
          color: isActive ? 'var(--primary)' : 'var(--foreground)',
          borderLeftColor: isActive ? 'var(--primary)' : 'transparent',
        }}
      >
        <span className={indented ? '' : 'uppercase tracking-wide'}>{label}</span>
        {typeof count === 'number' && (
          <span style={{ color: 'var(--foreground-muted)' }}>{count.toLocaleString()}</span>
        )}
      </button>
    )
  }

  // Update dropdown position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isDropdownOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isDropdownOpen])

  const handleModalNavigation = (direction: 'prev' | 'next') => {
    if (!selectedStory) return

    const currentIndex = allFilteredStories.findIndex((s) => s.id === selectedStory.id)
    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex >= 0 && targetIndex < allFilteredStories.length) {
      const targetStory = allFilteredStories[targetIndex]
      setSelectedStory(targetStory)
    }
  }

  const handleStoryClick = (storyId: string) => {
    onStoryClick(storyId)
    // Scroll to the story in the list
    setTimeout(() => {
      const element = storyRefs.current[storyId]
      if (element && listRef.current) {
        const listRect = listRef.current.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()
        const scrollTop = elementRect.top - listRect.top + listRef.current.scrollTop - 20
        listRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' })
      }
    }, 100)
  }

  // Listen for activeStoryId changes from map clicks
  useEffect(() => {
    if (activeStoryId && storyRefs.current[activeStoryId] && listRef.current) {
      const element = storyRefs.current[activeStoryId]
      const listRect = listRef.current.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const scrollTop = elementRect.top - listRect.top + listRef.current.scrollTop - 20
      listRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' })
    }
  }, [activeStoryId])

  // Auto-open detail modal when autoOpenDetailId is set (from URL deep link)
  const [hasAutoOpened, setHasAutoOpened] = useState(false)
  useEffect(() => {
    if (autoOpenDetailId && !hasAutoOpened && visibleStories.length > 0) {
      const story = visibleStories.find((s) => s.id === autoOpenDetailId)
      if (story) {
        // Small delay to let the UI settle
        setTimeout(() => {
          setSelectedStory(story)
          setModalOpen(true)
          setHasAutoOpened(true)
        }, 500)
      }
    }
  }, [autoOpenDetailId, visibleStories, hasAutoOpened])

  useEffect(() => {
    const handleScroll = throttle(() => {
      if (!listRef.current) return

      if (window.innerWidth <= 768) {
        if (listRef.current.scrollTop > 50 && !isHeaderCollapsed) {
          setIsHeaderCollapsed(true)
        }
      }
    }, 100)

    const listElement = listRef.current
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        listElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [isHeaderCollapsed])

  // Load timeline descriptions for businesses with timeline data using batched loading
  useEffect(() => {
    const MAX_CONCURRENT = 5 // Limit concurrent fetches for performance

    const loadTimelineDescriptions = async () => {
      // Filter to only stories that need timeline data
      const storiesWithTimeline = visibleStories.filter((s) => s.hasTimelineData)
      if (storiesWithTimeline.length === 0) {
        setTimelineDescriptions({})
        return
      }

      // Process in batches to avoid overwhelming the network
      const descriptions: { [key: string]: string | null } = {}
      const batches: (typeof storiesWithTimeline)[] = []

      for (let i = 0; i < storiesWithTimeline.length; i += MAX_CONCURRENT) {
        batches.push(storiesWithTimeline.slice(i, i + MAX_CONCURRENT))
      }

      // Process batches with Promise.all for concurrent loading
      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map(async (story) => {
            try {
              const timelineData = await loadTimelineData(story.id)
              if (timelineData) {
                const timelineContent = getTimelineContentForDate(timelineData, currentDate)
                return { id: story.id, description: timelineContent?.description || null }
              }
              return { id: story.id, description: null }
            } catch {
              return { id: story.id, description: null }
            }
          })
        )

        // Collect successful results
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            descriptions[result.value.id] = result.value.description
          }
        })
      }

      setTimelineDescriptions(descriptions)
    }

    loadTimelineDescriptions()
  }, [visibleStories, currentDate])

  // Load year markers on mount
  useEffect(() => {
    const fetchYearMarkers = async () => {
      try {
        const markers = await loadYearMarkers()
        setYearMarkers(sortMarkers(markers))
      } catch (error) {
        console.warn('Failed to load year markers:', error)
      }
    }
    fetchYearMarkers()
  }, [])

  // Handler for toggling marker expansion
  const handleToggleMarkerExpand = useCallback((markerId: string) => {
    setExpandedMarkers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(markerId)) {
        newSet.delete(markerId)
      } else {
        newSet.add(markerId)
      }
      return newSet
    })
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // The HU Berlin taxonomy is two-level, so the dropdown is too: four broad
  // branches, then the 25 detailed sectors grouped under whichever branch they
  // most often belong to, then an explicit bucket for the records the source
  // never classified. That last bucket is the point — under the old flat
  // `businessType || category` set they were simply unreachable.
  const categoryTally = useMemo(() => tallyCategories(visibleStories), [visibleStories])

  const dropdownGroups = useMemo(() => {
    const sectorsByBranch = new Map<string, { key: string; label: string; count: number }[]>()
    const ungrouped: { key: string; label: string; count: number }[] = []

    for (const [key, tally] of categoryTally.sectors) {
      const entry = { key, label: sectorLabel(t, key, tally.rawLabel), count: tally.count }
      if (tally.mainBranch) {
        const bucket = sectorsByBranch.get(tally.mainBranch) ?? []
        bucket.push(entry)
        sectorsByBranch.set(tally.mainBranch, bucket)
      } else {
        ungrouped.push(entry)
      }
    }
    for (const bucket of sectorsByBranch.values()) {
      bucket.sort((a, b) => a.label.localeCompare(b.label))
    }
    ungrouped.sort((a, b) => a.label.localeCompare(b.label))

    const branches = Array.from(categoryTally.mains.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([branch, count]) => ({
        branch,
        count,
        label: mainBranchLabel(t, branch),
        sectors: sectorsByBranch.get(branch) ?? [],
      }))

    return { branches, ungrouped, uncategorised: categoryTally.uncategorised }
  }, [categoryTally, t])

  // Label for the collapsed dropdown button.
  const selectedCategoryLabel = useMemo(() => {
    const parsed = parseFilter(selectedCategory)
    switch (parsed.kind) {
      case 'all':
        return t('mainPage.storyList.allCategories')
      case 'none':
        return t('mainPage.storyList.uncategorized')
      case 'main':
        return mainBranchLabel(t, parsed.value)
      case 'sector':
        return sectorLabel(t, parsed.value, categoryTally.sectors.get(parsed.value)?.rawLabel)
    }
  }, [selectedCategory, categoryTally, t])

  // Memoize filtered stories using debounced search query for performance
  const allFilteredStories = useMemo(() => {
    const searchLower = debouncedSearchQuery.toLowerCase()
    return visibleStories.filter((story) => {
      const matchesSearch =
        !searchLower ||
        story.title.toLowerCase().includes(searchLower) ||
        (story.description?.toLowerCase().includes(searchLower) ?? false)
      return matchesSearch && matchesFilter(story, selectedCategory)
    })
  }, [visibleStories, debouncedSearchQuery, selectedCategory])

  // Create combined list of stories and year markers, sorted by date
  type ListItem =
    | { type: 'story'; data: StoryMap; sortDate: Date }
    | { type: 'marker'; data: YearMarker; sortDate: Date }

  const combinedListItems = useMemo((): ListItem[] => {
    if (!showYearMarkers || yearMarkers.length === 0) {
      return allFilteredStories.map((story) => ({
        type: 'story' as const,
        data: story,
        sortDate: story.startDate ? new Date(story.startDate) : new Date(1920, 0, 1),
      }))
    }

    const storyItems: ListItem[] = allFilteredStories.map((story) => ({
      type: 'story' as const,
      data: story,
      sortDate: story.startDate ? new Date(story.startDate) : new Date(1920, 0, 1),
    }))

    const markerItems: ListItem[] = yearMarkers.map((marker) => ({
      type: 'marker' as const,
      data: marker,
      sortDate: getMarkerDate(marker),
    }))

    // Combine and sort by date
    const combined = [...storyItems, ...markerItems]
    combined.sort((a, b) => {
      const timeDiff = a.sortDate.getTime() - b.sortDate.getTime()
      if (timeDiff !== 0) return timeDiff
      // If same date, markers come before stories
      if (a.type === 'marker' && b.type === 'story') return -1
      if (a.type === 'story' && b.type === 'marker') return 1
      return 0
    })

    return combined
  }, [allFilteredStories, yearMarkers, showYearMarkers])

  // Limit displayed items for performance
  const [displayCount, setDisplayCount] = useState(50)
  const displayedItems = combinedListItems.slice(0, displayCount)

  // Progressive background loading
  useEffect(() => {
    if (displayCount < combinedListItems.length) {
      const timer = setTimeout(() => {
        setDisplayCount((prev) => {
          const nextCount = Math.min(prev + 100, combinedListItems.length)
          return nextCount
        })
      }, 500) // Load 100 more after 500ms
      return () => clearTimeout(timer)
    }
  }, [displayCount, combinedListItems.length])

  // Handle marker click - ensure story is loaded
  useEffect(() => {
    if (activeStoryId) {
      const index = combinedListItems.findIndex(
        (item) => item.type === 'story' && item.data.id === activeStoryId
      )
      if (index >= displayCount && index !== -1) {
        // Load up to the clicked item plus some buffer
        setDisplayCount(Math.min(index + 20, combinedListItems.length))
      }
    }
  }, [activeStoryId, combinedListItems, displayCount])

  const getStatusColor = (story: StoryMap) => {
    const now = currentDate.getTime()
    const start = story.startDate ? new Date(story.startDate).getTime() : 0
    const end = story.endDate ? new Date(story.endDate).getTime() : Infinity

    if (now < start) return 'border-l-muted' // Future - not yet opened
    if (now > end) return 'border-l-danger' // Closed
    if (story.midDate && now > new Date(story.midDate).getTime()) return 'border-l-warning' // Declining
    return 'border-l-primary' // Active
  }

  const getStoryState = (story: StoryMap) => {
    const now = currentDate.getTime()
    const start = story.startDate ? new Date(story.startDate).getTime() : 0
    const end = story.endDate ? new Date(story.endDate).getTime() : Infinity

    if (now < start) return 'future'
    if (now > end) return 'closed'
    if (story.midDate && now > new Date(story.midDate).getTime()) return 'declining'
    return 'active'
  }

  const getActiveStoryStyle = (story: StoryMap, isActive: boolean) => {
    if (!isActive) return {}

    const state = getStoryState(story)
    switch (state) {
      case 'declining':
        return {
          backgroundColor: 'var(--warning)',
          borderLeftColor: 'var(--warning)',
          color: 'var(--declining-text)',
          '--story-text-color': 'var(--declining-text)',
          '--story-text-secondary': 'var(--declining-text-secondary)',
        }
      case 'closed':
        return {
          backgroundColor: 'var(--danger)',
          borderLeftColor: 'var(--danger)',
          color: 'var(--closed-text)',
          '--story-text-color': 'var(--closed-text)',
          '--story-text-secondary': 'var(--closed-text-secondary)',
        }
      case 'active':
      default:
        // Use theme-specific colors
        if (theme === 'moody' || !theme) {
          return {
            backgroundColor: 'var(--success)',
            borderLeftColor: 'var(--success)',
            color: 'var(--active-text)',
            '--story-text-color': 'var(--active-text)',
            '--story-text-secondary': 'var(--active-text-secondary)',
          }
        } else if (theme === 'bauhaus') {
          return {
            backgroundColor: 'var(--primary)',
            borderLeftColor: 'var(--primary)',
            color: 'var(--active-text)',
            '--story-text-color': 'var(--active-text)',
            '--story-text-secondary': 'var(--active-text-secondary)',
          }
        } else {
          return {
            backgroundColor: 'rgba(var(--primary-rgb), 0.85)',
            borderLeftColor: 'var(--primary)',
            color: 'var(--active-text)',
            '--story-text-color': 'var(--active-text)',
            '--story-text-secondary': 'var(--active-text-secondary)',
          }
        }
    }
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      <div
        className={`border-b backdrop-blur transition-all duration-300 z-[1] relative ${
          isHeaderCollapsed ? 'p-3 md:p-6' : 'p-4 md:p-6'
        }`}
        style={{
          borderBottomColor: 'var(--border)',
          backgroundColor: 'rgba(var(--background-rgb), 0.95)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1
              className="text-lg font-mono font-bold mb-1 tracking-tight uppercase"
              style={{ color: 'var(--primary)' }}
            >
              {t('mainPage.intro.title')}
            </h1>
            {!isHeaderCollapsed && (
              <p
                className="text-xs font-mono uppercase tracking-wide"
                style={{ color: 'var(--accent-orange)' }}
              >
                {t('mainPage.intro.subtitle')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setShowSearchFilter(!showSearchFilter)}
                className="p-2 transition-colors hover:bg-[var(--border)]"
                aria-label="Toggle search and filters"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--primary)' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>

              <button
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                className="p-2 transition-colors hover:bg-[var(--border)]"
                aria-label="Toggle header"
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${isHeaderCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--primary)' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div
          className={`transition-all duration-300 overflow-hidden z-[1] relative ${
            isHeaderCollapsed && !showSearchFilter
              ? 'max-h-0 opacity-0 mt-0'
              : 'max-h-96 opacity-100 mt-4'
          } md:max-h-96 md:opacity-100 md:mt-4`}
        >
          <div className="space-y-3">
            <div className="flex gap-2 md:block">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={t('mainPage.storyList.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2.5 pl-9 focus:outline-none text-xs font-mono transition-all border"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
                <svg
                  className="absolute left-3 top-2.5 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--muted)' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div ref={dropdownRef} className="relative z-[100000]">
              <button
                onClick={handleDropdownToggle}
                className="w-full px-3 py-2.5 border focus:outline-none text-xs font-mono transition-all text-left flex items-center justify-between cursor-pointer hover:opacity-80"
                style={{
                  backgroundColor: 'var(--input-bg, rgba(107, 98, 117, 0.5))',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                }}
              >
                <span>{selectedCategoryLabel}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--muted)' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div
                  className="md:fixed absolute top-full left-0 right-0 border backdrop-blur-sm z-[99999] max-h-[600px] overflow-y-auto shadow-lg mt-1 hot-dropdown"
                  style={{
                    backgroundColor: 'var(--dropdown-bg)',
                    borderColor: 'var(--border)',
                    top: window.innerWidth >= 768 ? `${dropdownPosition.top}px` : undefined,
                    left: window.innerWidth >= 768 ? `${dropdownPosition.left}px` : undefined,
                    width: window.innerWidth >= 768 ? `${dropdownPosition.width}px` : undefined,
                  }}
                >
                  {renderCategoryOption(ALL_CATEGORIES, t('mainPage.storyList.allCategories'))}
                  {dropdownGroups.branches.map((branch) => (
                    <React.Fragment key={branch.branch}>
                      {renderCategoryOption(
                        mainFilterValue(branch.branch),
                        branch.label,
                        branch.count
                      )}
                      {branch.sectors.map((sector) =>
                        renderCategoryOption(
                          sectorFilterValue(sector.key),
                          sector.label,
                          sector.count,
                          true
                        )
                      )}
                    </React.Fragment>
                  ))}
                  {dropdownGroups.ungrouped.map((sector) =>
                    renderCategoryOption(
                      sectorFilterValue(sector.key),
                      sector.label,
                      sector.count,
                      true
                    )
                  )}
                  {dropdownGroups.uncategorised > 0 &&
                    renderCategoryOption(
                      UNCATEGORISED,
                      t('mainPage.storyList.uncategorized'),
                      dropdownGroups.uncategorised
                    )}
                </div>
              )}
            </div>
          </div>

          {/* In drawer layout the scrubber is rendered over the map instead, so it stays
              reachable while the list is collapsed. Skip the wrapper entirely rather than
              hiding it, or it leaves a dead 16px gap in the header. */}
          {!hideTimeSlider && (
            <div
              className={`transition-all duration-300 ${isHeaderCollapsed && !showSearchFilter ? 'mt-0' : 'mt-4'}`}
            >
              <TimeSlider
                minDate={minDate}
                maxDate={maxDate}
                currentDate={currentDate}
                onChange={setCurrentDate}
              />
            </div>
          )}
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <div
            className="text-xs font-mono uppercase tracking-wide font-semibold"
            style={{ color: 'var(--accent-orange)' }}
          >
            {allFilteredStories.length} locations found{' '}
            {displayCount < combinedListItems.length && `(showing ${displayCount})`}
            {unlocatedCount > 0 && (
              <span
                className="block normal-case font-normal tracking-normal mt-0.5"
                style={{ color: 'var(--foreground-muted)' }}
                title="These records have no geocoded address yet, so they are listed but not placed on the map."
              >
                {unlocatedCount.toLocaleString()} not yet located — listed, not mapped
              </span>
            )}
          </div>
          {yearMarkers.length > 0 && (
            <button
              onClick={() => setShowYearMarkers(!showYearMarkers)}
              className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono uppercase tracking-wide transition-all border"
              style={{
                backgroundColor: showYearMarkers ? 'var(--primary)' : 'transparent',
                color: showYearMarkers ? 'var(--background)' : 'var(--foreground-muted)',
                borderColor: showYearMarkers ? 'var(--primary)' : 'var(--border)',
              }}
              title={showYearMarkers ? 'Hide historical events' : 'Show historical events'}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {showYearMarkers ? 'Events On' : 'Events Off'}
            </button>
          )}
        </div>

        {/* Background loading indicator */}
        {displayCount < combinedListItems.length && (
          <div className="mb-3 px-2">
            <div className="relative h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full transition-all duration-500"
                style={{
                  width: `${(displayCount / combinedListItems.length) * 100}%`,
                  backgroundColor: 'var(--primary)',
                }}
              />
              <div
                className="absolute left-0 top-0 h-full animate-pulse"
                style={{
                  width: '100%',
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  animation: 'shimmer 2s infinite',
                }}
              />
            </div>
            <p className="text-[10px] font-mono mt-1 opacity-60">Loading more...</p>
          </div>
        )}

        {displayedItems.map((item) => {
          if (item.type === 'marker') {
            const marker = item.data
            return (
              <YearMarkerCard
                key={`marker-${marker.id}`}
                marker={marker}
                currentDate={currentDate}
                isExpanded={expandedMarkers.has(marker.id)}
                onToggleExpand={() => handleToggleMarkerExpand(marker.id)}
              />
            )
          }

          const story = item.data
          return (
            <div
              key={story.id}
              ref={(el) => {
                storyRefs.current[story.id] = el
              }}
              data-story-id={story.id}
              className={`group backdrop-blur border border-l-4 transition-all duration-500 cursor-pointer shadow-sm hover:shadow-lg ${
                story.id === activeStoryId ? 'shadow-xl scale-[1.02]' : ''
              } ${getStatusColor(story)}`}
              style={{
                backgroundColor: story.id === activeStoryId ? undefined : 'var(--card-bg)',
                borderTopColor: 'var(--border)',
                borderRightColor: 'var(--border)',
                borderBottomColor: 'var(--border)',
                borderLeftColor: 'var(--border)',
                opacity: 1,
                ...getActiveStoryStyle(story, story.id === activeStoryId),
              }}
              onClick={() => handleStoryClick(story.id)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className="font-mono font-semibold text-sm transition-colors"
                        style={{
                          color:
                            story.id === activeStoryId
                              ? 'var(--story-text-color, currentColor)'
                              : 'var(--foreground)',
                        }}
                      >
                        {getTranslatedBusinessName(story.title, language)}
                      </h3>
                      {/* Timeline Data Availability Indicator */}
                      {story.hasTimelineData && (
                        <div
                          className="flex items-center justify-center w-4 h-4 transition-opacity"
                          style={{
                            opacity: 0.6,
                          }}
                          title="Timeline data available - view details for historical progression"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{
                              color:
                                story.id === activeStoryId
                                  ? 'var(--story-text-color, var(--primary))'
                                  : 'var(--primary)',
                            }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    {story.address && (
                      <div
                        className="flex items-center gap-1.5 text-xs font-mono mt-1"
                        style={{
                          color:
                            story.id === activeStoryId
                              ? 'var(--story-text-secondary, currentColor)'
                              : 'var(--foreground-muted)',
                        }}
                      >
                        <svg
                          className="w-3 h-3 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>
                          {(() => {
                            const zipcode = getZipcodeFromAddress(
                              story.address,
                              story.lat,
                              story.lng
                            )
                            const streetPart = story.address
                              .replace(', Berlin', '')
                              .replace(', Germany', '')
                            return `${streetPart}, ${zipcode} Berlin`
                          })()}
                        </span>
                      </div>
                    )}
                    {(() => {
                      if (!story.description) return null

                      // Check if description is just a generic business type description
                      const desc = story.description.toLowerCase()
                      // Only the real sector label — `category` holds the
                      // literal "business" on every storymaps.json record,
                      // which would match far too much.
                      const businessType = (story.businessType || '').toLowerCase()

                      // Skip if description is just "[business type] business" or similar generic patterns
                      const isGeneric =
                        desc.endsWith(' business') ||
                        desc.endsWith(' establishment') ||
                        desc === businessType ||
                        (desc.includes(businessType) && desc.split(' ').length <= 4) ||
                        desc === `${businessType} business` ||
                        desc === `a ${businessType} establishment`

                      if (isGeneric) return null

                      // Use timeline description if available, otherwise fall back to static description
                      const description =
                        story.hasTimelineData && timelineDescriptions[story.id]
                          ? timelineDescriptions[story.id]
                          : getTranslatedDescription(story, language)

                      return (
                        <p
                          className="text-xs font-mono mt-1.5 line-clamp-2 leading-relaxed"
                          style={{
                            color:
                              story.id === activeStoryId
                                ? 'var(--story-text-secondary, currentColor)'
                                : 'var(--foreground-muted)',
                          }}
                        >
                          {description}
                        </p>
                      )
                    })()}

                    <div className="flex items-center gap-4 mt-3 text-xs font-mono">
                      <span
                        style={{
                          color:
                            story.id === activeStoryId
                              ? 'var(--story-text-color, currentColor)'
                              : 'var(--foreground)',
                        }}
                      >
                        {story.startDate ? new Date(story.startDate).getFullYear() : 'Unknown'} -{' '}
                        {story.endDate === 'Unknown'
                          ? 'Unknown'
                          : story.endDate
                            ? new Date(story.endDate).getFullYear()
                            : 'Unknown'}
                      </span>
                      {(() => {
                        // The sector recorded by HU Berlin, else the broad
                        // branch. This used to guess from the title by
                        // splitting on " - ", which turned any historical name
                        // containing a dash into a bogus type label.
                        const displayType =
                          sectorLabel(t, story.sectorKey, story.businessType) ||
                          mainBranchLabel(t, story.mainBranch)

                        if (!displayType) return null

                        return (
                          <span
                            className="px-2 py-1 text-xs font-mono uppercase tracking-wide"
                            style={{
                              backgroundColor:
                                story.id === activeStoryId
                                  ? 'rgba(0, 0, 0, 0.2)'
                                  : 'var(--card-bg)',
                              color:
                                story.id === activeStoryId
                                  ? 'var(--story-text-color, currentColor)'
                                  : 'var(--foreground)',
                              opacity: 1,
                            }}
                          >
                            {displayType}
                          </span>
                        )
                      })()}
                    </div>

                    {/* View Details button for businesses with actual details */}
                    {(story.longDescription ||
                      (story.description && story.description.length > 100) ||
                      story.media ||
                      (story.imageUrls && story.imageUrls.length > 0)) && (
                      <button
                        className={`view-details-button mt-3 px-3 py-1.5 text-xs font-mono bg-transparent border transition-all uppercase tracking-wider font-semibold inline-block ${
                          story.id === activeStoryId ? 'hover:opacity-80' : ''
                        }`}
                        style={{
                          color:
                            story.id === activeStoryId
                              ? 'var(--story-text-color, currentColor)'
                              : 'var(--foreground)',
                          borderColor: story.id === activeStoryId ? 'currentColor' : 'var(--muted)',
                          borderWidth: theme === 'bauhaus' ? '2px' : '1px',
                          backgroundColor:
                            story.id === activeStoryId ? 'transparent' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          if (story.id !== activeStoryId) {
                            e.currentTarget.style.backgroundColor = 'var(--muted)'
                            e.currentTarget.style.color = 'var(--background)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (story.id !== activeStoryId) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = 'var(--foreground)'
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          const element = storyRefs.current[story.id]
                          if (element) {
                            handleViewDetails(story, element)
                          }
                        }}
                      >
                        {t('mainPage.storyDetails.viewDetails')}
                      </button>
                    )}
                  </div>

                  {story.imageUrls && story.imageUrls.length > 0 && (
                    <div className="relative w-16 h-16 ml-4 overflow-hidden flex-shrink-0 border border-border">
                      <Image
                        src={story.imageUrls[0]}
                        alt={story.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Business Detail Modal */}
      {selectedStory && (
        <BusinessDetailModal
          story={selectedStory}
          isOpen={modalOpen}
          onClose={closeModal}
          originRect={originRect}
          currentDate={currentDate}
          minDate={minDate}
          maxDate={maxDate}
          onDateChange={setCurrentDate}
          onNavigate={handleModalNavigation}
          hasPrevious={allFilteredStories.findIndex((s) => s.id === selectedStory.id) > 0}
          hasNext={
            allFilteredStories.findIndex((s) => s.id === selectedStory.id) <
            allFilteredStories.length - 1
          }
        />
      )}
    </div>
  )
}

export default React.memo(StoryList, (prevProps, nextProps) => {
  return (
    prevProps.activeStoryId === nextProps.activeStoryId &&
    prevProps.autoOpenDetailId === nextProps.autoOpenDetailId &&
    // Must be named explicitly. This comparator reports "equal" for every prop
    // it does not list, so omitting the filter leaves the list frozen while
    // the map legend visibly updates — with no error anywhere.
    prevProps.selectedCategory === nextProps.selectedCategory &&
    prevProps.currentDate.getTime() === nextProps.currentDate.getTime() &&
    prevProps.minDate.getTime() === nextProps.minDate.getTime() &&
    prevProps.maxDate.getTime() === nextProps.maxDate.getTime() &&
    JSON.stringify(prevProps.visibleStories) === JSON.stringify(nextProps.visibleStories)
  )
})
