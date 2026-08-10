'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import type { Proposal, ProposalStatus, ProposalType } from '@/lib/types/proposal'

const PROPOSAL_TYPES: Array<ProposalType | 'all'> = [
  'all',
  'plaque_inquiry',
  'new_location',
  'edit_location',
  'correction',
]

export default function AdminProposalsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ProposalStatus | 'all'>('pending')
  const [typeFilter, setTypeFilter] = useState<ProposalType | 'all'>('all')

  useEffect(() => {
    if (!authLoading && (!user || !profile?.is_admin)) {
      router.push('/')
    }
  }, [user, profile, authLoading, router])

  useEffect(() => {
    if (user && profile?.is_admin) {
      fetchProposals()
    }
  }, [user, profile, filter, typeFilter])

  const fetchProposals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (typeFilter !== 'all') params.set('proposal_type', typeFilter)
      const qs = params.toString()
      const url = qs ? `/api/proposals?${qs}` : '/api/proposals'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch proposals')
      }
      const data = await response.json()
      setProposals(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateProposalStatus = async (id: string, status: ProposalStatus, adminNotes?: string) => {
    try {
      const response = await fetch(`/api/proposals/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      })

      if (!response.ok) {
        throw new Error('Failed to update proposal')
      }

      fetchProposals()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update proposal')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'var(--success)'
      case 'rejected':
        return 'var(--danger)'
      case 'under_review':
        return 'var(--warning)'
      default:
        return 'var(--foreground-muted)'
    }
  }

  if (authLoading || !user || !profile?.is_admin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <p className="font-mono" style={{ color: 'var(--foreground)' }}>
          Loading...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-mono font-bold mb-2" style={{ color: 'var(--primary)' }}>
            Admin Panel - Proposal Review
          </h1>
          <p className="font-sans" style={{ color: 'var(--foreground-muted)' }}>
            Review and manage location proposals from contributors
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-3 flex gap-2 flex-wrap">
          {(['all', 'pending', 'under_review', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className="px-4 py-2 font-mono text-sm transition-all"
              style={{
                backgroundColor: filter === status ? 'var(--primary)' : 'var(--card-bg)',
                color: filter === status ? 'var(--background)' : 'var(--foreground)',
                border: `1px solid ${filter === status ? 'var(--primary)' : 'var(--border)'}`,
                outline: 'none',
              }}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
              {status !== 'all' && ` (${proposals.filter((p) => p.status === status).length})`}
            </button>
          ))}
        </div>

        {/* Type Filter Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap items-center">
          <span
            className="text-xs font-mono uppercase tracking-wider mr-1"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Type:
          </span>
          {PROPOSAL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className="px-3 py-1.5 font-mono text-xs transition-all"
              style={{
                backgroundColor: typeFilter === type ? 'var(--primary)' : 'transparent',
                color: typeFilter === type ? 'var(--background)' : 'var(--foreground)',
                border: `1px solid ${typeFilter === type ? 'var(--primary)' : 'var(--border)'}`,
                outline: 'none',
              }}
            >
              {type === 'all' ? 'All' : type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 font-mono text-sm transition-opacity"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Back to Map
          </button>
        </div>

        {/* Proposals List */}
        {loading ? (
          <p className="font-mono" style={{ color: 'var(--foreground-muted)' }}>
            Loading proposals...
          </p>
        ) : error ? (
          <div
            className="p-4"
            style={{
              backgroundColor: 'rgba(var(--danger-rgb), 0.1)',
              border: '1px solid var(--danger)',
            }}
          >
            <p className="font-mono" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          </div>
        ) : proposals.length === 0 ? (
          <div
            className="p-8 text-center"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="font-mono" style={{ color: 'var(--foreground-muted)' }}>
              No proposals found with status: {filter}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="p-6"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3
                      className="text-xl font-mono font-bold mb-1"
                      style={{ color: 'var(--primary)' }}
                    >
                      {proposal.title}
                    </h3>
                    <p
                      className="text-sm font-mono mb-2"
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      {proposal.address}
                    </p>
                    <div
                      className="flex gap-3 text-xs font-mono"
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      <span>Type: {proposal.proposal_type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Submitted: {new Date(proposal.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div
                    className="px-3 py-1 font-mono text-xs uppercase"
                    style={{
                      backgroundColor: `rgba(${getStatusColor(proposal.status)}, 0.1)`,
                      color: getStatusColor(proposal.status),
                      border: `1px solid ${getStatusColor(proposal.status)}`,
                    }}
                  >
                    {proposal.status.replace('_', ' ')}
                  </div>
                </div>

                {/* Description */}
                {proposal.description && (
                  <div className="mb-4">
                    <p className="text-sm font-sans" style={{ color: 'var(--foreground)' }}>
                      {proposal.description}
                    </p>
                  </div>
                )}

                {/* Details Grid */}
                <div
                  className="grid grid-cols-2 gap-4 mb-4 p-4"
                  style={{ backgroundColor: 'rgba(var(--muted-rgb), 0.1)' }}
                >
                  <div>
                    <p
                      className="text-xs font-mono mb-1"
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      Business Type:
                    </p>
                    <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                      {proposal.business_type || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs font-mono mb-1"
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      Coordinates:
                    </p>
                    <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                      {proposal.lat.toFixed(6)}, {proposal.lng.toFixed(6)}
                    </p>
                  </div>
                  {proposal.start_date && (
                    <div>
                      <p
                        className="text-xs font-mono mb-1"
                        style={{ color: 'var(--foreground-muted)' }}
                      >
                        Dates:
                      </p>
                      <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                        {proposal.start_date} - {proposal.end_date || 'Unknown'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sources */}
                {proposal.sources && (
                  <div
                    className="mb-4 p-3"
                    style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }}
                  >
                    <p
                      className="text-xs font-mono mb-1 font-bold"
                      style={{ color: 'var(--primary)' }}
                    >
                      Sources:
                    </p>
                    <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                      {proposal.sources}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {proposal.notes && (
                  <div
                    className="mb-4 p-3"
                    style={{ backgroundColor: 'rgba(var(--muted-rgb), 0.1)' }}
                  >
                    <p
                      className="text-xs font-mono mb-1 font-bold"
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      {proposal.proposal_type === 'plaque_inquiry'
                        ? 'Inquirer Message:'
                        : 'Contributor Notes:'}
                    </p>
                    <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                      {proposal.notes}
                    </p>
                  </div>
                )}

                {/* Plaque Inquiry contact details */}
                {proposal.proposal_type === 'plaque_inquiry' && (
                  <div
                    className="mb-4 p-4"
                    style={{
                      backgroundColor: 'rgba(var(--primary-rgb), 0.08)',
                      border: '1px solid var(--primary)',
                    }}
                  >
                    <p
                      className="text-xs font-mono mb-3 font-bold uppercase tracking-wider"
                      style={{ color: 'var(--primary)' }}
                    >
                      Plaque Inquiry &mdash; Building Owner Contact
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p
                          className="text-xs font-mono mb-1"
                          style={{ color: 'var(--foreground-muted)' }}
                        >
                          Name:
                        </p>
                        <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                          {proposal.inquiry_name || '—'}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-xs font-mono mb-1"
                          style={{ color: 'var(--foreground-muted)' }}
                        >
                          Role:
                        </p>
                        <p
                          className="text-sm font-mono capitalize"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {proposal.building_role || '—'}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-xs font-mono mb-1"
                          style={{ color: 'var(--foreground-muted)' }}
                        >
                          Email:
                        </p>
                        {proposal.inquiry_email ? (
                          <a
                            href={`mailto:${proposal.inquiry_email}?subject=${encodeURIComponent(`Memorial plaque for ${proposal.title}`)}`}
                            className="text-sm font-mono underline"
                            style={{ color: 'var(--primary)' }}
                          >
                            {proposal.inquiry_email}
                          </a>
                        ) : (
                          <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                            —
                          </p>
                        )}
                      </div>
                      <div>
                        <p
                          className="text-xs font-mono mb-1"
                          style={{ color: 'var(--foreground-muted)' }}
                        >
                          Phone:
                        </p>
                        <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                          {proposal.inquiry_phone || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p
                    className="text-xs font-mono mb-2 font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Admin Actions:
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateProposalStatus(proposal.id, 'approved', 'Approved by admin')
                      }
                      disabled={proposal.status === 'approved'}
                      className="px-4 py-2 font-mono text-xs font-bold transition-opacity"
                      style={{
                        backgroundColor:
                          proposal.status === 'approved'
                            ? 'rgba(var(--success-rgb), 0.3)'
                            : 'var(--success)',
                        color: 'var(--background)',
                        border: 'none',
                        cursor: proposal.status === 'approved' ? 'not-allowed' : 'pointer',
                        opacity: proposal.status === 'approved' ? 0.5 : 1,
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Enter reason for rejection (optional):')
                        updateProposalStatus(proposal.id, 'rejected', notes || 'Rejected by admin')
                      }}
                      disabled={proposal.status === 'rejected'}
                      className="px-4 py-2 font-mono text-xs font-bold transition-opacity"
                      style={{
                        backgroundColor:
                          proposal.status === 'rejected'
                            ? 'rgba(var(--danger-rgb), 0.3)'
                            : 'var(--danger)',
                        color: 'var(--background)',
                        border: 'none',
                        cursor: proposal.status === 'rejected' ? 'not-allowed' : 'pointer',
                        opacity: proposal.status === 'rejected' ? 0.5 : 1,
                      }}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => updateProposalStatus(proposal.id, 'under_review')}
                      disabled={proposal.status === 'under_review'}
                      className="px-4 py-2 font-mono text-xs font-bold transition-opacity"
                      style={{
                        backgroundColor:
                          proposal.status === 'under_review'
                            ? 'rgba(var(--warning-rgb), 0.3)'
                            : 'var(--warning)',
                        color: 'var(--background)',
                        border: 'none',
                        cursor: proposal.status === 'under_review' ? 'not-allowed' : 'pointer',
                        opacity: proposal.status === 'under_review' ? 0.5 : 1,
                      }}
                    >
                      Under Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
