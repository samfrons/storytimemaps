import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'storymaps.json');
const DEFAULT_PAGE_SIZE = 3000;  // Load all businesses by default
const MAX_PAGE_SIZE = 3000;  // Allow loading all at once

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedData: any[] | null = null;

async function getStoryMaps() {
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    cachedData = JSON.parse(data);
    return cachedData;
  } catch (error) {
    console.error('Error reading storymaps.json:', error);
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.error('File not found. Please ensure storymaps.json exists in the data directory.');
      // Return empty array as fallback for build time
      return [];
    }
    throw error; // Re-throw the error to be caught in the GET function
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const requestedPageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10);
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
    const all = searchParams.get('all') === 'true';
    
    const storyMaps = await getStoryMaps();
    
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
    
    // Add cache and compression headers for better performance
    const headers = {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      'Vary': 'Accept-Encoding',
      'Content-Type': 'application/json; charset=utf-8'
    };
    
    return NextResponse.json(responseData, { headers });
  } catch (error) {
    console.error('Error in GET /api/storymaps:', error);
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Data file not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}