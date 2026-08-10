import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { StoryMap } from '../../../../types'

// Required by the project deployment rules: without this Next can statically optimise
// the route at build time and serve a stale snapshot. That is wrong for every route
// here - they read mutable data, and the auth-scoped ones would leak one user's view
// to everyone.
export const dynamic = 'force-dynamic'

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'storymaps.json')

interface Metadata {
  totalItems: number
  bounds: {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  }
  dateRange: {
    minDate: string
    maxDate: string
  }
  categories: string[]
}

let cachedMetadata: Metadata | null = null

async function getMetadata() {
  if (cachedMetadata) {
    return cachedMetadata
  }

  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8')
    const storyMaps = JSON.parse(data)

    // Calculate bounds
    let minLat = Infinity,
      maxLat = -Infinity
    let minLng = Infinity,
      maxLng = -Infinity
    let minDate: Date | undefined
    let maxDate: Date | undefined

    const categories = new Set<string>()

    ;(storyMaps as StoryMap[]).forEach((story) => {
      // Update bounds
      if (story.lat && story.lng) {
        minLat = Math.min(minLat, story.lat)
        maxLat = Math.max(maxLat, story.lat)
        minLng = Math.min(minLng, story.lng)
        maxLng = Math.max(maxLng, story.lng)
      }

      // Update date range
      if (story.startDate) {
        const date = new Date(story.startDate)
        if (!minDate || date < minDate) minDate = date
      }
      if (story.endDate && story.endDate !== 'Unknown') {
        const date = new Date(story.endDate)
        if (!maxDate || date > maxDate) maxDate = date
      }

      // Collect categories
      if (story.businessType) categories.add(story.businessType)
      else if (story.category) categories.add(story.category)
    })

    cachedMetadata = {
      totalItems: storyMaps.length,
      bounds: {
        minLat: minLat === Infinity ? 52.4 : minLat,
        maxLat: maxLat === -Infinity ? 52.6 : maxLat,
        minLng: minLng === Infinity ? 13.2 : minLng,
        maxLng: maxLng === -Infinity ? 13.6 : maxLng,
      },
      dateRange: {
        minDate: minDate?.toISOString() || '1920-01-01',
        maxDate: maxDate?.toISOString() || '1945-12-31',
      },
      categories: Array.from(categories).sort(),
    }

    return cachedMetadata
  } catch (error) {
    console.error('Error reading metadata:', error)
    return null
  }
}

export async function GET() {
  try {
    const metadata = await getMetadata()
    if (!metadata) {
      return NextResponse.json({ error: 'Could not load metadata' }, { status: 500 })
    }

    // Add cache headers for better performance
    const headers = {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', // Cache for 1 hour
      Vary: 'Accept-Encoding',
    }

    return NextResponse.json(metadata, { headers })
  } catch (error) {
    console.error('Error in GET /api/storymaps/metadata:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
