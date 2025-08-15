import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'storymaps.json');

async function getStoryMaps() {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading storymaps.json:', error);
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.error('File not found. Please ensure storymaps.json exists in the data directory.');
    }
    throw error; // Re-throw the error to be caught in the GET function
  }
}

export async function GET() {
  try {
    const storyMaps = await getStoryMaps();
    return NextResponse.json(storyMaps);
  } catch (error) {
    console.error('Error in GET /api/storymaps:', error);
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Data file not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}