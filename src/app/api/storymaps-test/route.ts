import { NextResponse, NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { inferBusinessCategory } from '../../../utils/businessTranslations'

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'storymaps_test_full.json')
const STORIES_FILE_PATH = path.join(process.cwd(), 'data', 'storymaps.json')
const DEFAULT_PAGE_SIZE = 10000
const MAX_PAGE_SIZE = 10000
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes TTL

// In-memory cache with TTL
interface CacheEntry<T> {
  data: T
  timestamp: number
  etag: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dataCache: CacheEntry<any[]> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let storiesCache: CacheEntry<any[]> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let minimalDataCache: CacheEntry<any[]> | null = null

function isCacheValid<T>(cache: CacheEntry<T> | null): cache is CacheEntry<T> {
  return cache !== null && Date.now() - cache.timestamp < CACHE_TTL_MS
}

function generateETag(data: unknown): string {
  const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')
  return `"${hash.substring(0, 16)}"`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMinimalFields(stories: any[]): any[] {
  return stories.map((story) => ({
    id: story.id,
    title: story.title,
    lat: story.lat,
    lng: story.lng,
    state: story.state,
    startDate: story.startDate,
    endDate: story.endDate,
    businessType: story.businessType,
  }))
}

async function getStoryMaps(minimal = false) {
  // Check cache first
  if (minimal && isCacheValid(minimalDataCache)) {
    return minimalDataCache
  }
  if (!minimal && isCacheValid(dataCache)) {
    return dataCache
  }

  try {
    const rawData = await fs.readFile(DATA_FILE_PATH, 'utf8')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsedData: any[] = JSON.parse(rawData)

    // Infer business types if missing
    parsedData = parsedData.map((story) => {
      if (!story.businessType && story.description) {
        return { ...story, businessType: inferBusinessCategory(story) }
      }
      return story
    })

    // Cache full data
    dataCache = {
      data: parsedData,
      timestamp: Date.now(),
      etag: generateETag(parsedData),
    }

    // Cache minimal data
    const minimalData = extractMinimalFields(parsedData)
    minimalDataCache = {
      data: minimalData,
      timestamp: Date.now(),
      etag: generateETag(minimalData),
    }

    return minimal ? minimalDataCache : dataCache
  } catch (error) {
    console.error('Error reading storymaps_test_full.json:', error)
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.error(
        'File not found. Please ensure storymaps_test_full.json exists in the data directory.'
      )
      return { data: [], timestamp: Date.now(), etag: generateETag([]) }
    }
    throw error
  }
}

async function getDetailedStories() {
  // Check cache first
  if (isCacheValid(storiesCache)) {
    return storiesCache
  }

  try {
    const rawData = await fs.readFile(STORIES_FILE_PATH, 'utf8')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsedData: any[] = JSON.parse(rawData)

    // Infer business types if missing
    parsedData = parsedData.map((story) => {
      if (!story.businessType && story.description) {
        return { ...story, businessType: inferBusinessCategory(story) }
      }
      return story
    })

    storiesCache = {
      data: parsedData.slice(0, 15), // Only first 15 detailed stories
      timestamp: Date.now(),
      etag: generateETag(parsedData.slice(0, 15)),
    }

    return storiesCache
  } catch (error) {
    console.error('Error reading storymaps.json:', error)
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.error('File not found. Please ensure storymaps.json exists in the data directory.')
      return { data: [], timestamp: Date.now(), etag: generateETag([]) }
    }
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const requestedPageSize = parseInt(
      searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE),
      10
    )
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
    const all = searchParams.get('all') === 'true'
    const storiesOnly = searchParams.get('stories') === 'true'
    const combined = searchParams.get('combined') === 'true'
    const minimal = searchParams.get('minimal') === 'true'

    // Check If-None-Match header for conditional requests
    const ifNoneMatch = request.headers.get('if-none-match')

    // Combined mode: return both datasets in one request
    if (combined) {
      const [fullCache, storiesCache] = await Promise.all([
        getStoryMaps(minimal),
        getDetailedStories(),
      ])

      const combinedEtag = generateETag({ full: fullCache.etag, stories: storiesCache.etag })

      // Return 304 if client has current version
      if (ifNoneMatch === combinedEtag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            ETag: combinedEtag,
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
          },
        })
      }

      const responseData = {
        full: fullCache.data,
        stories: storiesCache.data,
        metadata: {
          fullCount: fullCache.data.length,
          storiesCount: storiesCache.data.length,
          minimal,
        },
      }

      return NextResponse.json(responseData, {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
          ETag: combinedEtag,
          Vary: 'Accept-Encoding',
          'Content-Type': 'application/json; charset=utf-8',
        },
      })
    }

    let cache

    if (storiesOnly) {
      cache = await getDetailedStories()
    } else {
      cache = await getStoryMaps(minimal)
    }

    const storyMaps = cache.data
    const etag = cache.etag

    // Return 304 if client has current version
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
        },
      })
    }

    // Return all data if requested (for backwards compatibility)
    if (all) {
      return NextResponse.json(storyMaps, {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
          ETag: etag,
          Vary: 'Accept-Encoding',
          'Content-Type': 'application/json; charset=utf-8',
        },
      })
    }

    // Handle null/empty case
    if (!storyMaps || storyMaps.length === 0) {
      return NextResponse.json(
        {
          data: [],
          metadata: {
            page,
            pageSize,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
            ETag: etag,
            Vary: 'Accept-Encoding',
          },
        }
      )
    }

    // Calculate pagination
    const totalItems = storyMaps.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    // Get paginated data
    const paginatedData = storyMaps.slice(startIndex, endIndex)

    // Prepare response data
    const responseData = {
      data: paginatedData,
      metadata: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
        ETag: etag,
        Vary: 'Accept-Encoding',
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/storymaps-test:', error)
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Test data file not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
