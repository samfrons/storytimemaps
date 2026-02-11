'use client'

import React from 'react'
import type { OutreachRecord, OutreachStats as StatsType } from '@/lib/types/outreach'

interface OutreachStatsProps {
  data: OutreachRecord[]
}

function calculateStats(data: OutreachRecord[]): StatsType {
  return {
    total: data.length,
    notStarted: data.filter((r) => r.outreach_status === 'not_started').length,
    researching: data.filter((r) => r.outreach_status === 'researching').length,
    contacted: data.filter((r) => r.outreach_status === 'contacted').length,
    awaitingResponse: data.filter((r) => r.outreach_status === 'awaiting_response').length,
    followUpNeeded: data.filter((r) => r.outreach_status === 'follow_up_needed').length,
    interested: data.filter((r) => r.outreach_status === 'interested').length,
    approved: data.filter((r) => r.outreach_status === 'approved').length,
    declined: data.filter((r) => r.outreach_status === 'declined').length,
    notApplicable: data.filter((r) => r.outreach_status === 'not_applicable').length,
  }
}

function OutreachStats({ data }: OutreachStatsProps) {
  const stats = calculateStats(data)
  const researchedCount = stats.total - stats.notStarted
  const progressPercent = stats.total > 0 ? Math.round((researchedCount / stats.total) * 100) : 0

  const statItems = [
    { label: 'Total', value: stats.total, color: 'var(--foreground)' },
    { label: 'Not Started', value: stats.notStarted, color: 'var(--muted)' },
    { label: 'Researching', value: stats.researching, color: 'var(--primary)' },
    { label: 'Contacted', value: stats.contacted, color: 'var(--primary)' },
    { label: 'Awaiting', value: stats.awaitingResponse, color: 'var(--warning)' },
    { label: 'Follow-Up', value: stats.followUpNeeded, color: 'var(--warning)' },
    { label: 'Interested', value: stats.interested, color: 'var(--success)' },
    { label: 'Approved', value: stats.approved, color: 'var(--success)' },
    { label: 'Declined', value: stats.declined, color: 'var(--danger)' },
  ]

  return (
    <div
      className="p-4 border mb-4"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-mono" style={{ color: 'var(--foreground)' }}>
          Outreach Progress
        </h2>
        <div className="text-sm font-mono" style={{ color: 'var(--primary)' }}>
          {progressPercent}% researched ({researchedCount}/{stats.total})
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full mb-4" style={{ backgroundColor: 'var(--muted)' }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: 'var(--success)',
          }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="p-2 text-center border"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="text-xl font-mono font-bold" style={{ color: item.color }}>
              {item.value}
            </div>
            <div
              className="text-xs font-mono uppercase"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(OutreachStats)
