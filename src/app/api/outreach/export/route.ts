import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { OutreachRecord } from '@/lib/types/outreach'
import { isAuthorized } from '@/lib/outreachAuth'

export const dynamic = 'force-dynamic'

const DATA_PATH = join(process.cwd(), 'public', 'data', 'outreach', 'businesses.json')

function escapeCSV(value: string | number | undefined): string {
  if (value === undefined || value === null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: NextRequest) {
  // Same gate as /api/outreach — this returns the whole contact dataset as CSV.
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    if (!existsSync(DATA_PATH)) {
      return NextResponse.json({ success: false, error: 'Data file not found' }, { status: 404 })
    }

    const content = readFileSync(DATA_PATH, 'utf8')
    const data: OutreachRecord[] = JSON.parse(content)

    // CSV header
    const headers = [
      'id',
      'title',
      'description',
      'category',
      'address',
      'lat',
      'lng',
      'startDate',
      'midDate',
      'endDate',
      'imageUrls',
      'current_occupant_name',
      'current_occupant_type',
      'property_type',
      'contact_email',
      'contact_phone',
      'contact_website',
      'contact_person',
      'outreach_status',
      'first_contact_date',
      'last_contact_date',
      'next_follow_up_date',
      'outreach_notes',
      'data_source',
      'interest_level',
    ]

    // Build CSV content
    const csvRows = [headers.join(',')]

    for (const record of data) {
      const row = headers.map((header) => {
        const value = record[header as keyof OutreachRecord]
        return escapeCSV(value)
      })
      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')

    // Return as downloadable CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="outreach_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting outreach data:', error)
    return NextResponse.json({ success: false, error: 'Failed to export data' }, { status: 500 })
  }
}
