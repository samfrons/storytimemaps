'use client'

import React, { useState, useMemo, useCallback } from 'react'
import type { OutreachRecord, OutreachFilters as FiltersType } from '@/lib/types/outreach'
import { OUTREACH_STATUS_LABELS, OCCUPANT_TYPE_LABELS, STATUS_COLORS } from '@/lib/types/outreach'

interface OutreachTableProps {
  data: OutreachRecord[]
  filters: FiltersType
  onRowClick: (record: OutreachRecord) => void
}

type SortField = 'title' | 'address' | 'outreach_status' | 'last_contact_date' | 'interest_level'
type SortDirection = 'asc' | 'desc'

function OutreachTable({ data, filters, onRowClick }: OutreachTableProps) {
  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDirection('asc')
      }
    },
    [sortField]
  )

  const filteredAndSortedData = useMemo(() => {
    let result = [...data]

    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          r.address.toLowerCase().includes(search) ||
          r.current_occupant_name.toLowerCase().includes(search)
      )
    }

    if (filters.status !== 'all') {
      result = result.filter((r) => r.outreach_status === filters.status)
    }

    if (filters.occupantType !== 'all') {
      result = result.filter((r) => r.current_occupant_type === filters.occupantType)
    }

    if (filters.interestLevel !== 'all') {
      result = result.filter((r) => r.interest_level === filters.interestLevel)
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''

      switch (sortField) {
        case 'title':
          aVal = a.title.toLowerCase()
          bVal = b.title.toLowerCase()
          break
        case 'address':
          aVal = a.address.toLowerCase()
          bVal = b.address.toLowerCase()
          break
        case 'outreach_status':
          aVal = a.outreach_status
          bVal = b.outreach_status
          break
        case 'last_contact_date':
          aVal = a.last_contact_date || ''
          bVal = b.last_contact_date || ''
          break
        case 'interest_level':
          aVal = a.interest_level
          bVal = b.interest_level
          break
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [data, filters, sortField, sortDirection])

  const headerStyle: React.CSSProperties = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
  }

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  const googleMapsLink = (record: OutreachRecord) => {
    if (record.lat && record.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${record.lat},${record.lng}`
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(record.address)}`
  }

  return (
    <div className="overflow-x-auto border" style={{ borderColor: 'var(--border)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={headerStyle}>
            <th
              className="px-3 py-2 text-left font-mono text-xs uppercase cursor-pointer hover:opacity-80 border-b"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => handleSort('title')}
            >
              Historical Business
              <SortIndicator field="title" />
            </th>
            <th
              className="px-3 py-2 text-left font-mono text-xs uppercase cursor-pointer hover:opacity-80 border-b"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => handleSort('address')}
            >
              Address
              <SortIndicator field="address" />
            </th>
            <th
              className="px-3 py-2 text-left font-mono text-xs uppercase border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              Current Occupant
            </th>
            <th
              className="px-3 py-2 text-left font-mono text-xs uppercase border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              Type
            </th>
            <th
              className="px-3 py-2 text-left font-mono text-xs uppercase cursor-pointer hover:opacity-80 border-b"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => handleSort('outreach_status')}
            >
              Status
              <SortIndicator field="outreach_status" />
            </th>
            <th
              className="px-3 py-2 text-left font-mono text-xs uppercase cursor-pointer hover:opacity-80 border-b"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => handleSort('last_contact_date')}
            >
              Last Contact
              <SortIndicator field="last_contact_date" />
            </th>
            <th
              className="px-3 py-2 text-left font-mono text-xs uppercase cursor-pointer hover:opacity-80 border-b"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => handleSort('interest_level')}
            >
              Interest
              <SortIndicator field="interest_level" />
            </th>
            <th
              className="px-3 py-2 text-left font-mono text-xs uppercase border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedData.map((record) => {
            const statusColors = STATUS_COLORS[record.outreach_status]
            return (
              <tr
                key={record.id}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onRowClick(record)}
                style={{
                  backgroundColor: 'var(--background)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <td className="px-3 py-2">
                  <div
                    className="font-mono text-xs truncate max-w-[200px]"
                    title={record.title}
                    style={{ color: 'var(--foreground)' }}
                  >
                    {record.title}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div
                    className="font-mono text-xs truncate max-w-[200px]"
                    title={record.address}
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {record.address || '-'}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div
                    className="font-mono text-xs truncate max-w-[150px]"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {record.current_occupant_name || '-'}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className="font-mono text-xs" style={{ color: 'var(--foreground-muted)' }}>
                    {OCCUPANT_TYPE_LABELS[record.current_occupant_type] || '-'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className="px-2 py-1 text-xs font-mono"
                    style={{
                      backgroundColor: statusColors.bg,
                      color: statusColors.text,
                    }}
                  >
                    {OUTREACH_STATUS_LABELS[record.outreach_status]}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="font-mono text-xs" style={{ color: 'var(--foreground-muted)' }}>
                    {record.last_contact_date || '-'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className="font-mono text-xs capitalize"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {record.interest_level}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <a
                    href={googleMapsLink(record)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-mono underline hover:opacity-70"
                    style={{ color: 'var(--primary)' }}
                  >
                    Maps
                  </a>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {filteredAndSortedData.length === 0 && (
        <div className="p-8 text-center font-mono" style={{ color: 'var(--foreground-muted)' }}>
          No records match your filters.
        </div>
      )}

      <div
        className="px-3 py-2 text-xs font-mono border-t"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)',
          color: 'var(--foreground-muted)',
        }}
      >
        Showing {filteredAndSortedData.length} of {data.length} records
      </div>
    </div>
  )
}

export default React.memo(OutreachTable)
