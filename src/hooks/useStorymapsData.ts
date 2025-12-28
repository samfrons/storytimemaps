'use client'

import { useState, useEffect, useCallback } from 'react'
import { StoryMap } from '../types'
import { useTranslation } from '../i18n/useTranslation'
import {
  fetchInitialBundle,
  fetchBusinessesPage,
  fetchAllBusinesses,
  convertToGeoJSON,
  type BusinessFeature,
} from '../services'

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
 * Hook for fetching and managing storymaps data.
 * Uses the service layer for API abstraction and caching.
 */
export function useStorymapsData(): UseStorymapsDataReturn {
  const { language } = useTranslation()
  const [jewishBusinesses, setJewishBusinesses] = useState<BusinessFeature[]>([])
  const [detailedStoriesData, setDetailedStoriesData] = useState<StoryMap[]>([])
  const [fullDatabaseData, setFullDatabaseData] = useState<StoryMap[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(10847)

  // Fetch initial data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true)

        // Use service to fetch both datasets in parallel
        const { initialData, stories } = await fetchInitialBundle()

        // Store datasets
        setFullDatabaseData(initialData)
        setDetailedStoriesData(stories)
        setTotalItems(initialData.length)
        setJewishBusinesses(convertToGeoJSON(initialData))
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
  }, [language])

  // Progressive loading for pagination
  const loadMoreBusinesses = useCallback(
    async (page: number, pageSize: number = 200): Promise<StoryMap[]> => {
      try {
        return await fetchBusinessesPage(page, pageSize)
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
      const allData = await fetchAllBusinesses()

      setFullDatabaseData(allData)
      setTotalItems(allData.length)
      setJewishBusinesses(convertToGeoJSON(allData))
    } catch (error) {
      console.error('Error loading all data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fullDatabaseData.length])

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
