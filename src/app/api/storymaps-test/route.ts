import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { inferBusinessCategory } from '../../../utils/businessTranslations';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'storymaps_test_full.json');
const STORIES_FILE_PATH = path.join(process.cwd(), 'data', 'storymaps.json');
const DEFAULT_PAGE_SIZE = 10000;  // Load all businesses by default for testing
const MAX_PAGE_SIZE = 10000;  // Allow loading all at once

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedData: any[] | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedStoriesData: any[] | null = null;

async function getStoryMaps() {
  // Always read fresh data for test dataset to pick up changes
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    cachedData = JSON.parse(data);
    return cachedData;
  } catch (error) {
    console.error('Error reading storymaps_test_full.json:', error);
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.error('File not found. Please ensure storymaps_test_full.json exists in the data directory.');
      // Fallback to empty array for graceful degradation
      return [];
    }
    throw error; // Re-throw the error to be caught in the GET function
  }
}

async function getDetailedStories() {
  // Read detailed stories from main storymaps.json
  try {
    const data = await fs.readFile(STORIES_FILE_PATH, 'utf8');
    cachedStoriesData = JSON.parse(data);
    return cachedStoriesData;
  } catch (error) {
    console.error('Error reading storymaps.json:', error);
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.error('File not found. Please ensure storymaps.json exists in the data directory.');
      return [];
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const requestedPageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10);
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
    const all = searchParams.get('all') === 'true';
    const storiesOnly = searchParams.get('stories') === 'true';
    
    let storyMaps;
    
    if (storiesOnly) {
      // Return only the first 15 detailed stories from main data file
      const allStories = await getDetailedStories();
      storyMaps = allStories ? allStories.slice(0, 15) : [];
    } else {
      // Return full test dataset
      storyMaps = await getStoryMaps();
    }
    
    // Populate businessType field using inference if it's missing
    if (storyMaps && storyMaps.length > 0) {
      storyMaps = storyMaps.map(story => {
        if (!story.businessType && story.description) {
          // Use inferBusinessCategory to extract business type from description
          const inferredType = inferBusinessCategory(story);
          return {
            ...story,
            businessType: inferredType
          };
        }
        return story;
      });
    }
    
    // Return all data if requested (for backwards compatibility)
    if (all) {
      return NextResponse.json(storyMaps);
    }
    
    // Handle null/empty case
    if (!storyMaps || storyMaps.length === 0) {
      return NextResponse.json({
        data: [],
        metadata: {
          page,
          pageSize,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      });
    }
    
    // Calculate pagination
    const totalItems = storyMaps.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Get paginated data
    const paginatedData = storyMaps.slice(startIndex, endIndex);
    
    // Prepare response data
    const responseData = {
      data: paginatedData,
      metadata: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
    
    // Add cache headers for better performance
    const headers = {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      'Vary': 'Accept-Encoding'
    };
    
    return NextResponse.json(responseData, { headers });
  } catch (error) {
    console.error('Error in GET /api/storymaps-test:', error);
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Test data file not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}