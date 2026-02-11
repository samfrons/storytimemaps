'use client'

import React from 'react'
import type {
  OutreachFilters as FiltersType,
  OutreachStatus,
  OccupantType,
  InterestLevel,
} from '@/lib/types/outreach'
import {
  OUTREACH_STATUS_LABELS,
  OCCUPANT_TYPE_LABELS,
  INTEREST_LEVEL_LABELS,
} from '@/lib/types/outreach'

interface OutreachFiltersProps {
  filters: FiltersType
  onFilterChange: (filters: FiltersType) => void
  onExport: () => void
}

function OutreachFilters({ filters, onFilterChange, onExport }: OutreachFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value })
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, status: e.target.value as OutreachStatus | 'all' })
  }

  const handleOccupantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, occupantType: e.target.value as OccupantType | 'all' })
  }

  const handleInterestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, interestLevel: e.target.value as InterestLevel | 'all' })
  }

  const selectStyle: React.CSSProperties = {
    backgroundColor: 'var(--input-bg)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
  }

  return (
    <div
      className="p-4 border mb-4 flex flex-wrap gap-4 items-center"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
    >
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Search by business name or address..."
          value={filters.search}
          onChange={handleSearchChange}
          className="w-full px-3 py-2 text-sm font-mono border"
          style={selectStyle}
        />
      </div>

      {/* Status filter */}
      <div className="min-w-[150px]">
        <select
          value={filters.status}
          onChange={handleStatusChange}
          className="w-full px-3 py-2 text-sm font-mono border"
          style={selectStyle}
        >
          <option value="all">All Statuses</option>
          {Object.entries(OUTREACH_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Occupant type filter */}
      <div className="min-w-[150px]">
        <select
          value={filters.occupantType}
          onChange={handleOccupantChange}
          className="w-full px-3 py-2 text-sm font-mono border"
          style={selectStyle}
        >
          <option value="all">All Types</option>
          {Object.entries(OCCUPANT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Interest level filter */}
      <div className="min-w-[130px]">
        <select
          value={filters.interestLevel}
          onChange={handleInterestChange}
          className="w-full px-3 py-2 text-sm font-mono border"
          style={selectStyle}
        >
          <option value="all">All Interest</option>
          {Object.entries(INTEREST_LEVEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Export button */}
      <button
        onClick={onExport}
        className="px-4 py-2 text-sm font-mono border transition-all hover:opacity-80"
        style={{
          backgroundColor: 'var(--primary)',
          borderColor: 'var(--border)',
          color: 'var(--background)',
        }}
      >
        Export CSV
      </button>
    </div>
  )
}

export default React.memo(OutreachFilters)
