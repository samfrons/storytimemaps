import { renderHook, waitFor } from '@testing-library/react'
import { useStorymapsData } from '../useStorymapsData'

// Mock the i18n hook
jest.mock('../../i18n/useTranslation', () => ({
  useTranslation: () => ({
    language: 'en',
    t: (key: string) => key,
    toggleLanguage: jest.fn(),
    switchToLanguage: jest.fn(),
  }),
}))

// Mock the services
jest.mock('../../services', () => ({
  fetchInitialBundle: jest.fn(),
  fetchBusinessesPage: jest.fn(),
  fetchAllBusinesses: jest.fn(),
  convertToGeoJSON: jest.fn((data) =>
    data.map((item: { id: string; title: string }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { name: item.title },
    }))
  ),
}))

import { fetchInitialBundle, fetchBusinessesPage, fetchAllBusinesses } from '../../services'

const mockFetchInitialBundle = fetchInitialBundle as jest.MockedFunction<typeof fetchInitialBundle>
const mockFetchBusinessesPage = fetchBusinessesPage as jest.MockedFunction<
  typeof fetchBusinessesPage
>
const mockFetchAllBusinesses = fetchAllBusinesses as jest.MockedFunction<typeof fetchAllBusinesses>

describe('useStorymapsData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch initial data on mount', async () => {
    const mockInitialData = [
      { id: '1', title: 'Business 1' },
      { id: '2', title: 'Business 2' },
    ]
    const mockStories = [{ id: '3', title: 'Story 1' }]

    mockFetchInitialBundle.mockResolvedValueOnce({
      initialData: mockInitialData,
      stories: mockStories,
    } as ReturnType<typeof fetchInitialBundle> extends Promise<infer T> ? T : never)

    const { result } = renderHook(() => useStorymapsData())

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify data is set correctly
    expect(result.current.fullDatabaseData).toEqual(mockInitialData)
    expect(result.current.detailedStoriesData).toEqual(mockStories)
    expect(result.current.totalItems).toBe(2)
    expect(mockFetchInitialBundle).toHaveBeenCalledTimes(1)
  })

  it('should convert data to GeoJSON format', async () => {
    const mockInitialData = [
      { id: '1', title: 'Business 1' },
      { id: '2', title: 'Business 2' },
    ]

    mockFetchInitialBundle.mockResolvedValueOnce({
      initialData: mockInitialData,
      stories: [],
    } as ReturnType<typeof fetchInitialBundle> extends Promise<infer T> ? T : never)

    const { result } = renderHook(() => useStorymapsData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify GeoJSON conversion
    expect(result.current.jewishBusinesses).toHaveLength(2)
    expect(result.current.jewishBusinesses[0]).toHaveProperty('type', 'Feature')
    expect(result.current.jewishBusinesses[0]).toHaveProperty('geometry')
    expect(result.current.jewishBusinesses[0]).toHaveProperty('properties')
  })

  it('should handle fetch errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockFetchInitialBundle.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useStorymapsData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should have empty data on error
    expect(result.current.fullDatabaseData).toEqual([])
    expect(result.current.detailedStoriesData).toEqual([])
    expect(result.current.jewishBusinesses).toEqual([])

    consoleSpy.mockRestore()
  })

  it('should provide loadMoreBusinesses function', async () => {
    const mockInitialData = [{ id: '1', title: 'Business 1' }]
    const mockMoreData = [{ id: '4', title: 'Business 4' }]

    mockFetchInitialBundle.mockResolvedValueOnce({
      initialData: mockInitialData,
      stories: [],
    } as ReturnType<typeof fetchInitialBundle> extends Promise<infer T> ? T : never)
    mockFetchBusinessesPage.mockResolvedValueOnce(
      mockMoreData as ReturnType<typeof fetchBusinessesPage> extends Promise<infer T> ? T : never
    )

    const { result } = renderHook(() => useStorymapsData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Call loadMoreBusinesses
    const moreData = await result.current.loadMoreBusinesses(2, 200)

    expect(mockFetchBusinessesPage).toHaveBeenCalledWith(2, 200)
    expect(moreData).toEqual(mockMoreData)
  })

  it('should provide loadAllData function', async () => {
    const mockInitialData = [{ id: '1', title: 'Business 1' }]
    const mockAllData = Array.from({ length: 10000 }, (_, i) => ({
      id: String(i),
      title: `Business ${i}`,
    }))

    mockFetchInitialBundle.mockResolvedValueOnce({
      initialData: mockInitialData,
      stories: [],
    } as ReturnType<typeof fetchInitialBundle> extends Promise<infer T> ? T : never)
    mockFetchAllBusinesses.mockResolvedValueOnce(
      mockAllData as ReturnType<typeof fetchAllBusinesses> extends Promise<infer T> ? T : never
    )

    const { result } = renderHook(() => useStorymapsData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Call loadAllData
    await result.current.loadAllData()

    expect(mockFetchAllBusinesses).toHaveBeenCalledTimes(1)
  })
})
