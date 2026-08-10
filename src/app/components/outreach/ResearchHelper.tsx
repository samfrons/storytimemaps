'use client'

import React from 'react'
import type { OutreachRecord } from '@/lib/types/outreach'

interface ResearchHelperProps {
  record: OutreachRecord | null
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  currentIndex: number
  totalUnresearched: number
}

function ResearchHelper({
  record,
  onClose,
  onNext,
  onPrevious,
  currentIndex,
  totalUnresearched,
}: ResearchHelperProps) {
  if (!record) {
    return (
      <div
        className="p-6 border text-center"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
        <div className="text-lg font-mono mb-2" style={{ color: 'var(--success)' }}>
          All locations researched!
        </div>
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          No more unresearched addresses remaining.
        </p>
      </div>
    )
  }

  const googleMapsUrl =
    record.lat && record.lng
      ? `https://www.google.com/maps/search/?api=1&query=${record.lat},${record.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(record.address)}`

  const osmUrl =
    record.lat && record.lng
      ? `https://www.openstreetmap.org/?mlat=${record.lat}&mlon=${record.lng}&zoom=18`
      : `https://www.openstreetmap.org/search?query=${encodeURIComponent(record.address)}`

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    record.address + ' Berlin'
  )}`

  const buttonStyle: React.CSSProperties = {
    backgroundColor: 'var(--input-bg)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
  }

  return (
    <div
      className="p-4 border"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-mono" style={{ color: 'var(--foreground)' }}>
          Research Helper
        </h3>
        <button
          onClick={onClose}
          className="text-xl px-2 hover:opacity-70"
          style={{ color: 'var(--foreground-muted)' }}
        >
          &times;
        </button>
      </div>

      {/* Progress */}
      <div
        className="text-sm font-mono mb-4 px-3 py-2 border"
        style={{
          backgroundColor: 'var(--background)',
          borderColor: 'var(--border)',
          color: 'var(--primary)',
        }}
      >
        Unresearched: {currentIndex + 1} of {totalUnresearched}
      </div>

      {/* Current record info */}
      <div className="mb-4 space-y-2">
        <div>
          <div
            className="text-xs uppercase font-mono mb-1"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Historical Business
          </div>
          <div className="font-mono text-sm" style={{ color: 'var(--foreground)' }}>
            {record.title}
          </div>
        </div>

        <div>
          <div
            className="text-xs uppercase font-mono mb-1"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Address
          </div>
          <div className="font-mono text-sm" style={{ color: 'var(--foreground)' }}>
            {record.address}
          </div>
        </div>

        <div>
          <div
            className="text-xs uppercase font-mono mb-1"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Coordinates
          </div>
          <div className="font-mono text-sm" style={{ color: 'var(--foreground)' }}>
            {record.lat.toFixed(6)}, {record.lng.toFixed(6)}
          </div>
        </div>
      </div>

      {/* Research action buttons */}
      <div className="space-y-2 mb-4">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 py-3 text-center text-sm font-mono border transition-all hover:opacity-80"
          style={{
            backgroundColor: 'var(--primary)',
            borderColor: 'var(--primary)',
            color: 'var(--background)',
          }}
        >
          Open in Google Maps
        </a>

        <a
          href={osmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 py-2 text-center text-sm font-mono border transition-all hover:opacity-80"
          style={buttonStyle}
        >
          Open in OpenStreetMap
        </a>

        <a
          href={googleSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 py-2 text-center text-sm font-mono border transition-all hover:opacity-80"
          style={buttonStyle}
        >
          Google Search Address
        </a>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="flex-1 px-4 py-2 text-sm font-mono border transition-all hover:opacity-80 disabled:opacity-40"
          style={buttonStyle}
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={currentIndex >= totalUnresearched - 1}
          className="flex-1 px-4 py-2 text-sm font-mono border transition-all hover:opacity-80 disabled:opacity-40"
          style={buttonStyle}
        >
          Next
        </button>
      </div>

      <p className="mt-4 text-xs text-center" style={{ color: 'var(--foreground-muted)' }}>
        Click the address row in the table to edit after researching
      </p>
    </div>
  )
}

export default React.memo(ResearchHelper)
