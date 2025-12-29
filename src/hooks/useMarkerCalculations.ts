'use client'

import { useMemo } from 'react'
import { StoryMap } from '../types'
import { BusinessFeature } from './useStorymapsData'

interface BaseMarker {
  id: string
  position: [number, number]
  popup: string
  startYear: number
  endYear: number
  midYear: number | null
  hasEnrichedData?: boolean
  businessType?: string
  type: string
}

interface MarkerWithState {
  id: string
  position: [number, number]
  popup: string
  hasEnrichedData?: boolean
  businessType?: string
  state: 'active' | 'declining' | 'closed' | 'future'
}

// Business type extraction patterns
const BUSINESS_TYPE_PATTERNS = [
  { pattern: /tailor\s*shop/i, type: 'Tailoring' },
  { pattern: /department\s*store/i, type: 'Department Store' },
  { pattern: /medical\s*practice/i, type: 'Medical Practice' },
  { pattern: /photography\s*agency/i, type: 'Photography Agency' },
  { pattern: /fine\s*foods/i, type: 'Fine Foods' },
  { pattern: /textiles/i, type: 'Textiles' },
  { pattern: /bakery/i, type: 'Bakery' },
  { pattern: /restaurant/i, type: 'Restaurant' },
  { pattern: /cafe/i, type: 'Café' },
  { pattern: /theater/i, type: 'Theater' },
  { pattern: /bookstore/i, type: 'Bookstore' },
  { pattern: /furrier/i, type: 'Furrier' },
  { pattern: /bank/i, type: 'Bank' },
  { pattern: /lawyer/i, type: 'Law Office' },
  { pattern: /dentist/i, type: 'Dental Practice' },
  { pattern: /doctor/i, type: 'Medical Practice' },
  { pattern: /pharmacy/i, type: 'Pharmacy' },
] as const

/**
 * Extract business type from title using pattern matching
 */
export function extractBusinessTypeFromTitle(title: string): string | undefined {
  for (const { pattern, type } of BUSINESS_TYPE_PATTERNS) {
    if (pattern.test(title)) {
      return type
    }
  }
  return undefined
}

interface UseMarkerCalculationsProps {
  jewishBusinesses: BusinessFeature[]
  detailedStoriesData: StoryMap[]
  fullDatabaseData: StoryMap[]
  mode: 'stories' | 'database'
  currentDate: Date
}

interface UseMarkerCalculationsReturn {
  baseMarkers: BaseMarker[]
  markersWithState: MarkerWithState[]
  enhancedStories: StoryMap[]
}

/**
 * Hook for calculating marker data and states based on current date.
 * Handles business type extraction and state determination.
 */
export function useMarkerCalculations({
  jewishBusinesses,
  detailedStoriesData,
  fullDatabaseData,
  mode,
  currentDate,
}: UseMarkerCalculationsProps): UseMarkerCalculationsReturn {
  // Enhance stories with extracted business types
  const enhancedStories = useMemo(() => {
    const dataToEnhance = mode === 'stories' ? detailedStoriesData : fullDatabaseData

    return dataToEnhance.map((story) => {
      // Try to find matching business in Jewish businesses dataset
      const matchingBusiness = jewishBusinesses.find(
        (business) =>
          story.title.toLowerCase().includes(business.properties.name.toLowerCase()) ||
          business.properties.name.toLowerCase().includes(story.title.toLowerCase())
      )

      // If found in dataset, use that business type
      if (matchingBusiness?.properties.business_type) {
        return {
          ...story,
          businessType: matchingBusiness.properties.business_type,
        }
      }

      // Otherwise, extract business type from the story title
      const extractedType = extractBusinessTypeFromTitle(story.title)
      if (extractedType) {
        return {
          ...story,
          businessType: extractedType,
        }
      }

      return story
    })
  }, [jewishBusinesses, detailedStoriesData, fullDatabaseData, mode])

  // Pre-compute base marker data that doesn't change with date
  const baseMarkers = useMemo(() => {
    const markers: BaseMarker[] = []
    const dataToUse = mode === 'stories' ? detailedStoriesData : fullDatabaseData

    // Add markers from the selected dataset
    dataToUse.forEach((story) => {
      if (story.lat && story.lng) {
        markers.push({
          id: story.id,
          position: [story.lat, story.lng] as [number, number],
          popup: story.title,
          startYear: story.startDate ? new Date(story.startDate).getFullYear() : 1900,
          endYear: story.endDate ? new Date(story.endDate).getFullYear() : 1945,
          midYear: story.midDate ? new Date(story.midDate).getFullYear() : null,
          hasEnrichedData: true,
          type: 'story',
        })
      }
    })

    // Add Jewish businesses that don't have enriched data
    jewishBusinesses.forEach((business, index) => {
      const enrichedStory = dataToUse.find(
        (story) =>
          story.title.toLowerCase().includes(business.properties.name.toLowerCase()) ||
          business.properties.name.toLowerCase().includes(story.title.toLowerCase())
      )

      if (!enrichedStory) {
        markers.push({
          id: `business-${business.properties.name}-${index}`,
          position: [business.geometry.coordinates[1], business.geometry.coordinates[0]] as [
            number,
            number,
          ],
          popup: business.properties.name,
          startYear: business.properties.registration_date
            ? parseInt(business.properties.registration_date)
            : 1900,
          endYear: business.properties.liquidation_date
            ? parseInt(business.properties.liquidation_date)
            : 1945,
          midYear: business.properties.takeover_date
            ? parseInt(business.properties.takeover_date)
            : null,
          businessType: business.properties.business_type,
          hasEnrichedData: false,
          type: 'business',
        })
      }
    })

    return markers
  }, [jewishBusinesses, detailedStoriesData, fullDatabaseData, mode])

  // Calculate marker states based on current date
  const markersWithState = useMemo(() => {
    const year = currentDate.getFullYear()

    return baseMarkers.map((marker) => {
      let state: 'active' | 'declining' | 'closed' | 'future' = 'active'

      if (year < marker.startYear) {
        state = 'future'
      } else if (year > marker.endYear) {
        state = 'closed'
      } else if (marker.midYear && year >= marker.midYear) {
        state = 'declining'
      }

      return {
        id: marker.id,
        position: marker.position,
        popup: marker.popup,
        hasEnrichedData: marker.hasEnrichedData,
        businessType: marker.businessType,
        state,
      }
    })
  }, [baseMarkers, currentDate])

  return {
    baseMarkers,
    markersWithState,
    enhancedStories,
  }
}

export type { BaseMarker, MarkerWithState }
