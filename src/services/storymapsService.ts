/**
 * Storymaps Service
 * Centralized API abstraction for fetching business and story data.
 * Handles caching, error handling, and data transformation.
 */

import { StoryMap, GeoJSONFeature } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface BusinessFeature {
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

export interface FetchOptions {
  page?: number
  pageSize?: number
  all?: boolean
  stories?: boolean
}

export interface StorymapsResponse {
  data: StoryMap[]
  total: number
  page?: number
  pageSize?: number
}

// ============================================================================
// Cache Management
// ============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const pendingRequests = new Map<string, Promise<unknown>>()

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCacheKey(endpoint: string, options?: FetchOptions): string {
  return `${endpoint}:${JSON.stringify(options || {})}`
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data
  }
  return null
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

/**
 * Clear all cached data
 */
export function clearStorymapsCache(): void {
  cache.clear()
  pendingRequests.clear()
}

/**
 * Clear cache for a specific endpoint
 */
export function clearCacheForEndpoint(endpoint: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(endpoint)) {
      cache.delete(key)
    }
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch storymaps data from the API with caching and deduplication
 */
async function fetchStorymapsAPI(options: FetchOptions = {}): Promise<StoryMap[]> {
  const queryParams = new URLSearchParams()

  if (options.page) queryParams.set('page', String(options.page))
  if (options.pageSize) queryParams.set('pageSize', String(options.pageSize))
  if (options.all) queryParams.set('all', 'true')
  if (options.stories) queryParams.set('stories', 'true')

  const endpoint = `/api/storymaps-test${queryParams.toString() ? `?${queryParams}` : ''}`
  const cacheKey = getCacheKey('storymaps', options)

  // Check cache first
  const cached = getFromCache<StoryMap[]>(cacheKey)
  if (cached) {
    return cached
  }

  // Check for pending request (deduplication)
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey) as Promise<StoryMap[]>
  }

  // Create new request
  const request = fetch(endpoint)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      const result = Array.isArray(data) ? data : data.data || []
      setCache(cacheKey, result)
      pendingRequests.delete(cacheKey)
      return result
    })
    .catch((error) => {
      pendingRequests.delete(cacheKey)
      console.error('Error fetching storymaps data:', error)
      throw error
    })

  pendingRequests.set(cacheKey, request)
  return request
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch detailed stories (businesses with narrative content)
 */
export async function fetchDetailedStories(): Promise<StoryMap[]> {
  return fetchStorymapsAPI({ stories: true })
}

/**
 * Fetch initial dataset with pagination
 */
export async function fetchInitialData(
  page: number = 1,
  pageSize: number = 200
): Promise<StoryMap[]> {
  return fetchStorymapsAPI({ page, pageSize })
}

/**
 * Fetch a page of businesses
 */
export async function fetchBusinessesPage(
  page: number,
  pageSize: number = 200
): Promise<StoryMap[]> {
  return fetchStorymapsAPI({ page, pageSize })
}

/**
 * Fetch all businesses (for database mode)
 */
export async function fetchAllBusinesses(): Promise<StoryMap[]> {
  return fetchStorymapsAPI({ all: true })
}

/**
 * Fetch both initial data and stories in parallel
 */
export async function fetchInitialBundle(): Promise<{
  initialData: StoryMap[]
  stories: StoryMap[]
}> {
  const [initialData, stories] = await Promise.all([
    fetchInitialData(1, 200),
    fetchDetailedStories(),
  ])

  return { initialData, stories }
}

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Convert StoryMap array to GeoJSON BusinessFeature array
 */
export function convertToGeoJSON(data: StoryMap[]): BusinessFeature[] {
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
}

/**
 * Convert StoryMap to standard GeoJSONFeature format
 */
export function convertToStandardGeoJSON(data: StoryMap[]): GeoJSONFeature[] {
  return data.map((story) => ({
    type: 'Feature' as const,
    properties: {
      id: story.id,
      name: story.title,
      category: story.category,
      businessType: story.businessType,
      description: story.description || undefined,
      startDate: story.startDate || undefined,
      endDate: story.endDate || undefined,
    },
    geometry: {
      type: 'Point' as const,
      coordinates: [story.lng || 13.405, story.lat || 52.52] as [number, number],
    },
  }))
}

/**
 * Filter businesses by date range
 */
export function filterByDateRange(data: StoryMap[], startDate?: Date, endDate?: Date): StoryMap[] {
  if (!startDate && !endDate) return data

  return data.filter((story) => {
    const storyStart = story.startDate ? new Date(story.startDate) : null
    const storyEnd = story.endDate ? new Date(story.endDate) : null

    // Include if no dates specified on story
    if (!storyStart && !storyEnd) return true

    // Check date range overlap
    if (startDate && storyEnd && storyEnd < startDate) return false
    if (endDate && storyStart && storyStart > endDate) return false

    return true
  })
}

/**
 * Search businesses by title or address
 */
export function searchBusinesses(data: StoryMap[], query: string): StoryMap[] {
  if (!query.trim()) return data

  const lowerQuery = query.toLowerCase().trim()

  return data.filter((story) => {
    const title = story.title?.toLowerCase() || ''
    const address = story.address?.toLowerCase() || ''
    const description = story.description?.toLowerCase() || ''

    return (
      title.includes(lowerQuery) || address.includes(lowerQuery) || description.includes(lowerQuery)
    )
  })
}

/**
 * Get unique categories from data
 */
export function getUniqueCategories(data: StoryMap[]): string[] {
  const categories = new Set<string>()

  data.forEach((story) => {
    if (story.category) categories.add(story.category)
  })

  return Array.from(categories).sort()
}

/**
 * Get unique business types from data
 */
export function getUniqueBusinessTypes(data: StoryMap[]): string[] {
  const types = new Set<string>()

  data.forEach((story) => {
    if (story.businessType) types.add(story.businessType)
  })

  return Array.from(types).sort()
}
