'use client'

import { useState, useEffect, useCallback } from 'react'
import { StoryMap } from '../types'
import { useTranslation } from '../i18n/useTranslation'

interface BusinessFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: {
    name: string
    business_type: string
    category: string
    address: string
    registration_date: string
    liquidation_date: string
    takeover_date: string
  }
}

interface UseStorymapsDataReturn {
  jewishBusinesses: BusinessFeature[]
  detailedStoriesData: StoryMap[]
  fullDatabaseData: StoryMap[]
  isLoading: boolean
  totalItems: number
  loadMoreBusinesses: (page: number, pageSize?: number) => Promise<StoryMap[]>
  loadAllData: () => Promise<void>
}

/**
 * Hook for fetching and managing storymaps data from the API.
 * Handles initial data loading, pagination, and full dataset loading.
 */
export function useStorymapsData(): UseStorymapsDataReturn {
  const { language } = useTranslation()
  const [jewishBusinesses, setJewishBusinesses] = useState<BusinessFeature[]>([])
  const [detailedStoriesData, setDetailedStoriesData] = useState<StoryMap[]>([])
  const [fullDatabaseData, setFullDatabaseData] = useState<StoryMap[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(10847)

  // Convert StoryMap array to GeoJSON BusinessFeature array
  const convertToGeoJSON = useCallback((data: StoryMap[]): BusinessFeature[] => {
    return data.map((story) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [story.lng || 13.405, story.lat || 52.52] as [number, number],
      },
      properties: {
        name: story.title,
        business_type: story.businessType || '',
        category: story.category || '',
        address: story.address || '',
        registration_date: story.startDate || '',
        liquidation_date: story.endDate || '',
        takeover_date: story.midDate || '',
      },
    }))
  }, [])

  // Fetch initial data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true)

        // Load stories data (detailed narratives)
        const storiesResponse = await fetch('/api/storymaps-test?stories=true')
        if (!storiesResponse.ok) {
          throw new Error(`HTTP error! status: ${storiesResponse.status}`)
        }
        const storiesData = await storiesResponse.json()
        const storiesDataArray = Array.isArray(storiesData) ? storiesData : storiesData.data || []

        // Load initial dataset (first page)
        const initialResponse = await fetch('/api/storymaps-test?page=1&pageSize=200')
        if (!initialResponse.ok) {
          throw new Error(`HTTP error! status: ${initialResponse.status}`)
        }
        const initialData = await initialResponse.json()
        const initialDataArray = Array.isArray(initialData) ? initialData : initialData.data || []

        // Store datasets
        setFullDatabaseData(initialDataArray)
        setDetailedStoriesData(storiesDataArray)
        setTotalItems(initialDataArray.length)
        setJewishBusinesses(convertToGeoJSON(initialDataArray))
      } catch (error) {
        console.error('Error fetching initial data:', error)
        setFullDatabaseData([])
        setDetailedStoriesData([])
        setJewishBusinesses([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [language, convertToGeoJSON])

  // Progressive loading for pagination
  const loadMoreBusinesses = useCallback(
    async (page: number, pageSize: number = 200): Promise<StoryMap[]> => {
      try {
        const response = await fetch(`/api/storymaps-test?page=${page}&pageSize=${pageSize}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        return Array.isArray(data) ? data : data.data || []
      } catch (error) {
        console.error('Error loading more businesses:', error)
        return []
      }
    },
    []
  )

  // Load all data for database mode
  const loadAllData = useCallback(async () => {
    if (fullDatabaseData.length >= 10000) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/storymaps-test?all=true')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const allData = Array.isArray(data) ? data : data.data || []

      setFullDatabaseData(allData)
      setTotalItems(allData.length)
      setJewishBusinesses(convertToGeoJSON(allData))
    } catch (error) {
      console.error('Error loading all data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fullDatabaseData.length, convertToGeoJSON])

  return {
    jewishBusinesses,
    detailedStoriesData,
    fullDatabaseData,
    isLoading,
    totalItems,
    loadMoreBusinesses,
    loadAllData,
  }
}

export type { BusinessFeature }
