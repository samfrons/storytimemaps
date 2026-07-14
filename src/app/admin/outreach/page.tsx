'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import type { OutreachRecord, OutreachFilters as FiltersType } from '@/lib/types/outreach'
import OutreachStats from '@/app/components/outreach/OutreachStats'
import OutreachFilters from '@/app/components/outreach/OutreachFilters'
import OutreachTable from '@/app/components/outreach/OutreachTable'
import OutreachForm from '@/app/components/outreach/OutreachForm'
import ResearchHelper from '@/app/components/outreach/ResearchHelper'

/**
 * Gate the outreach admin UI behind real Supabase admin auth.
 *
 * This is a UX convenience only — the authoritative check lives server-side in
 * every /api/outreach* handler (see requireAdmin). Do NOT reintroduce a
 * client-side password: NEXT_PUBLIC_ values ship in the browser bundle and any
 * client gate is trivially bypassed.
 */
function AdminAuth({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="font-mono" style={{ color: 'var(--primary)' }}>
          Loading...
        </div>
      </div>
    )
  }

  if (!user || !profile?.is_admin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div
          className="w-full max-w-md p-6 border text-center"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
        >
          <h1 className="text-xl font-mono mb-4" style={{ color: 'var(--foreground)' }}>
            Outreach Admin
          </h1>
          <p className="text-sm font-mono mb-6" style={{ color: 'var(--foreground-muted)' }}>
            {user
              ? 'Your account does not have admin access.'
              : 'You must sign in with an admin account to view this page.'}
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 text-sm font-mono border transition-all hover:opacity-80"
            style={{
              backgroundColor: 'var(--primary)',
              borderColor: 'var(--primary)',
              color: 'var(--background)',
            }}
          >
            Return home
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function OutreachPageContent() {
  const { signOut } = useAuth()
  const [data, setData] = useState<OutreachRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<OutreachRecord | null>(null)
  const [showResearchHelper, setShowResearchHelper] = useState(false)
  const [researchIndex, setResearchIndex] = useState(0)

  const [filters, setFilters] = useState<FiltersType>({
    search: '',
    status: 'all',
    occupantType: 'all',
    interestLevel: 'all',
  })

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/outreach')
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to load data')
      }
    } catch (err) {
      setError('Failed to connect to server')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Save record
  const handleSave = useCallback(
    async (updates: Partial<OutreachRecord>) => {
      if (!selectedRecord) return

      const response = await fetch('/api/outreach', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedRecord.id, ...updates }),
      })

      const result = await response.json()

      if (result.success) {
        setData((prev) => prev.map((r) => (r.id === selectedRecord.id ? { ...r, ...updates } : r)))
      } else {
        throw new Error(result.error || 'Failed to save')
      }
    },
    [selectedRecord]
  )

  // Export CSV
  const handleExport = useCallback(() => {
    window.open('/api/outreach/export', '_blank')
  }, [])

  // Get unresearched records for research helper
  const unresearchedRecords = useMemo(() => {
    return data.filter((r) => r.outreach_status === 'not_started')
  }, [data])

  const currentResearchRecord = unresearchedRecords[researchIndex] || null

  // Handle row click
  const handleRowClick = useCallback((record: OutreachRecord) => {
    setSelectedRecord(record)
  }, [])

  // Logout function
  const handleLogout = useCallback(async () => {
    await signOut()
    window.location.href = '/'
  }, [signOut])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="font-mono" style={{ color: 'var(--primary)' }}>
          Loading outreach data...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div
          className="p-6 border max-w-md text-center"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
        >
          <div className="text-lg font-mono mb-4" style={{ color: 'var(--danger)' }}>
            Error Loading Data
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
            {error}
          </p>
          <button
            onClick={fetchData}
            className="px-4 py-2 text-sm font-mono border"
            style={{
              backgroundColor: 'var(--primary)',
              borderColor: 'var(--primary)',
              color: 'var(--background)',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-mono" style={{ color: 'var(--foreground)' }}>
            Outreach Tracking
          </h1>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Memorial plaque outreach management for Berlin Jewish businesses
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowResearchHelper(!showResearchHelper)}
            className="px-4 py-2 text-sm font-mono border transition-all hover:opacity-80"
            style={{
              backgroundColor: showResearchHelper ? 'var(--success)' : 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: showResearchHelper ? 'var(--active-text)' : 'var(--foreground)',
            }}
          >
            Research Mode
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-mono border transition-all hover:opacity-80"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
          >
            Back to Map
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-mono border transition-all hover:opacity-80"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content with optional sidebar */}
      <div className="flex gap-4">
        {/* Main content area */}
        <div className={showResearchHelper ? 'flex-1' : 'w-full'}>
          <OutreachStats data={data} />
          <OutreachFilters filters={filters} onFilterChange={setFilters} onExport={handleExport} />
          <OutreachTable data={data} filters={filters} onRowClick={handleRowClick} />
        </div>

        {/* Research helper sidebar */}
        {showResearchHelper && (
          <div className="w-80 flex-shrink-0">
            <ResearchHelper
              record={currentResearchRecord}
              onClose={() => setShowResearchHelper(false)}
              onNext={() =>
                setResearchIndex((prev) => Math.min(prev + 1, unresearchedRecords.length - 1))
              }
              onPrevious={() => setResearchIndex((prev) => Math.max(prev - 1, 0))}
              currentIndex={researchIndex}
              totalUnresearched={unresearchedRecords.length}
            />
          </div>
        )}
      </div>

      {/* Edit modal */}
      {selectedRecord && (
        <OutreachForm
          record={selectedRecord}
          onSave={handleSave}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  )
}

export default function OutreachAdminPage() {
  return (
    <Suspense
      fallback={
        <div
          className="w-full h-screen flex items-center justify-center"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <div className="font-mono" style={{ color: 'var(--primary)' }}>
            Loading...
          </div>
        </div>
      }
    >
      <AdminAuth>
        <OutreachPageContent />
      </AdminAuth>
    </Suspense>
  )
}
