'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import type { Proposal } from '@/lib/types/proposal'
import ProposalForm from '@/components/proposals/ProposalForm'

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showProposalForm, setShowProposalForm] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchProposals()
    }
  }, [user])

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/proposals/user')
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

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'rgba(var(--success-rgb), 0.1)'
      case 'rejected':
        return 'rgba(var(--danger-rgb), 0.1)'
      case 'under_review':
        return 'rgba(var(--warning-rgb), 0.1)'
      default:
        return 'rgba(var(--muted-rgb), 0.1)'
    }
  }

  if (authLoading || !user) {
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-mono font-bold mb-2" style={{ color: 'var(--primary)' }}>
            My Dashboard
          </h1>
          <p className="font-sans" style={{ color: 'var(--foreground-muted)' }}>
            Welcome back, {profile?.display_name || user.email}
          </p>
        </div>

        {/* Actions */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setShowProposalForm(true)}
            className="px-6 py-3 font-mono text-sm font-bold transition-opacity"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--background)',
              border: 'none',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            + Propose New Location
          </button>

          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 font-mono text-sm transition-opacity"
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
        <div>
          <h2 className="text-2xl font-mono font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            My Proposals
          </h2>

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
              <p className="font-mono mb-4" style={{ color: 'var(--foreground-muted)' }}>
                You haven&apos;t submitted any proposals yet.
              </p>
              <button
                onClick={() => setShowProposalForm(true)}
                className="px-6 py-3 font-mono text-sm font-bold"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--background)',
                  border: 'none',
                }}
              >
                Submit Your First Proposal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="p-6"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3
                        className="text-xl font-mono font-bold mb-1"
                        style={{ color: 'var(--primary)' }}
                      >
                        {proposal.title}
                      </h3>
                      <p className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
                        {proposal.address}
                      </p>
                    </div>
                    <div
                      className="px-3 py-1 font-mono text-xs uppercase"
                      style={{
                        backgroundColor: getStatusBgColor(proposal.status),
                        color: getStatusColor(proposal.status),
                        border: `1px solid ${getStatusColor(proposal.status)}`,
                      }}
                    >
                      {proposal.status.replace('_', ' ')}
                    </div>
                  </div>

                  {proposal.description && (
                    <p className="text-sm font-sans mb-4" style={{ color: 'var(--foreground)' }}>
                      {proposal.description}
                    </p>
                  )}

                  <div
                    className="flex gap-4 text-xs font-mono"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    <span>Type: {proposal.proposal_type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>Submitted: {new Date(proposal.created_at).toLocaleDateString()}</span>
                  </div>

                  {proposal.admin_notes && (
                    <div
                      className="mt-4 p-3"
                      style={{
                        backgroundColor: 'rgba(var(--warning-rgb), 0.1)',
                        border: '1px solid var(--warning)',
                      }}
                    >
                      <p
                        className="text-xs font-mono font-bold mb-1"
                        style={{ color: 'var(--warning)' }}
                      >
                        Admin Notes:
                      </p>
                      <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                        {proposal.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Proposal Form Modal */}
      <ProposalForm
        isOpen={showProposalForm}
        onClose={() => setShowProposalForm(false)}
        onSuccess={fetchProposals}
        proposalType="new_location"
      />
    </div>
  )
}
