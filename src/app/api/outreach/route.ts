import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import type { OutreachRecord } from '@/lib/types/outreach'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

const DATA_PATH = join(process.cwd(), 'public', 'data', 'outreach', 'businesses.json')
const DATA_FILE_REL = 'public/data/outreach/businesses.json'

function loadData(): OutreachRecord[] {
  if (!existsSync(DATA_PATH)) {
    return []
  }
  const content = readFileSync(DATA_PATH, 'utf8')
  return JSON.parse(content)
}

function saveData(data: OutreachRecord[]): void {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
}

async function autoCommit(message: string): Promise<void> {
  try {
    const cwd = process.cwd()
    await execAsync(`git add "${DATA_FILE_REL}"`, { cwd })
    await execAsync(`git commit -m "${message}" --no-verify`, { cwd })
    console.log('Auto-committed outreach data changes')
  } catch (error) {
    // Commit may fail if no changes or git not available - that's ok
    console.log('Auto-commit skipped:', (error as Error).message)
  }
}

export async function GET() {
  try {
    const data = loadData()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error loading outreach data:', error)
    return NextResponse.json({ success: false, error: 'Failed to load data' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing record ID' }, { status: 400 })
    }

    const data = loadData()
    const recordIndex = data.findIndex((r) => r.id === id)

    if (recordIndex === -1) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
    }

    // Update the record with new values
    data[recordIndex] = {
      ...data[recordIndex],
      ...updates,
    }

    saveData(data)

    // Auto-commit changes to git
    const recordTitle = data[recordIndex].title || `ID ${id}`
    await autoCommit(`chore: update outreach record - ${recordTitle}`)

    return NextResponse.json({
      success: true,
      data: data[recordIndex],
    })
  } catch (error) {
    console.error('Error updating outreach data:', error)
    return NextResponse.json({ success: false, error: 'Failed to update data' }, { status: 500 })
  }
}
