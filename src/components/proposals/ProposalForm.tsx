'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { CreateProposalInput, ProposalType } from '@/lib/types/proposal'
import type { StoryMap } from '@/types'

interface ProposalFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  existingBusiness?: StoryMap // For editing existing businesses
  proposalType?: ProposalType
}

const ProposalForm: React.FC<ProposalFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingBusiness,
  proposalType = 'new_location',
}) => {
  const { user } = useAuth()

  // Form state
  const [formData, setFormData] = useState<Partial<CreateProposalInput>>({
    proposal_type: proposalType,
    original_business_id: existingBusiness?.id,
    title: existingBusiness?.title || '',
    description: existingBusiness?.description || '',
    address: existingBusiness?.address || '',
    lat: existingBusiness?.lat || 52.52,
    lng: existingBusiness?.lng || 13.405,
    start_date: existingBusiness?.startDate || '',
    mid_date: existingBusiness?.midDate || '',
    end_date: existingBusiness?.endDate || '',
    business_type: existingBusiness?.businessType || '',
    category: existingBusiness?.category || 'business',
    sources: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!user) {
      setError('You must be logged in to submit a proposal')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData as CreateProposalInput),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit proposal')
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        if (onSuccess) onSuccess()
        // Reset form
        setFormData({
          proposal_type: proposalType,
          title: '',
          description: '',
          address: '',
          lat: 52.52,
          lng: 13.405,
          sources: '',
          notes: '',
        })
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field: keyof CreateProposalInput, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const formTitle = useMemo(() => {
    switch (formData.proposal_type) {
      case 'edit_location':
        return 'Suggest Edit to Location'
      case 'correction':
        return 'Submit Correction'
      default:
        return 'Propose New Location'
    }
  }, [formData.proposal_type])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(var(--background-rgb), 0.9)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl p-6 my-8"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 12px rgba(var(--shadow), 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-mono font-bold mb-2" style={{ color: 'var(--primary)' }}>
            {formTitle}
          </h2>
          <p className="text-sm font-sans" style={{ color: 'var(--foreground-muted)' }}>
            Help preserve history by contributing information about Jewish businesses in Berlin
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div
            className="mb-4 p-3"
            style={{
              backgroundColor: 'rgba(var(--success-rgb), 0.1)',
              border: '1px solid var(--success)',
            }}
          >
            <p className="text-sm font-mono" style={{ color: 'var(--success)' }}>
              Proposal submitted successfully! Thank you for your contribution.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            className="mb-4 p-3"
            style={{
              backgroundColor: 'rgba(var(--danger-rgb), 0.1)',
              border: '1px solid var(--danger)',
            }}
          >
            <p className="text-sm font-mono" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Proposal Type */}
          <div>
            <label className="block text-sm font-mono mb-2" style={{ color: 'var(--foreground)' }}>
              Proposal Type
            </label>
            <select
              value={formData.proposal_type}
              onChange={(e) => handleFieldChange('proposal_type', e.target.value)}
              className="w-full px-4 py-3 font-mono text-sm"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              disabled={!!existingBusiness}
            >
              <option value="new_location">New Location</option>
              <option value="edit_location">Edit Existing Location</option>
              <option value="correction">Correction</option>
            </select>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-mono mb-2" style={{ color: 'var(--foreground)' }}>
              Business Name <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              required
              className="w-full px-4 py-3 font-mono text-sm"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              placeholder="e.g., Cohen's Bakery"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-mono mb-2" style={{ color: 'var(--foreground)' }}>
              Address <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              required
              className="w-full px-4 py-3 font-mono text-sm"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              placeholder="e.g., Rosenthaler Straße 40, Berlin"
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-mono mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Latitude <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.lat}
                onChange={(e) => handleFieldChange('lat', parseFloat(e.target.value))}
                required
                className="w-full px-4 py-3 font-mono text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label
                className="block text-sm font-mono mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Longitude <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.lng}
                onChange={(e) => handleFieldChange('lng', parseFloat(e.target.value))}
                required
                className="w-full px-4 py-3 font-mono text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-sm font-mono mb-2" style={{ color: 'var(--foreground)' }}>
              Business Type
            </label>
            <input
              type="text"
              value={formData.business_type}
              onChange={(e) => handleFieldChange('business_type', e.target.value)}
              className="w-full px-4 py-3 font-mono text-sm"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              placeholder="e.g., Bakery, Tailor, Department Store"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-mono mb-2" style={{ color: 'var(--foreground)' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 font-mono text-sm resize-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              placeholder="Provide any historical context, family stories, or other relevant information..."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                className="block text-sm font-mono mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleFieldChange('start_date', e.target.value)}
                className="w-full px-4 py-3 font-mono text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label
                className="block text-sm font-mono mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Mid Date
              </label>
              <input
                type="date"
                value={formData.mid_date}
                onChange={(e) => handleFieldChange('mid_date', e.target.value)}
                className="w-full px-4 py-3 font-mono text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label
                className="block text-sm font-mono mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleFieldChange('end_date', e.target.value)}
                className="w-full px-4 py-3 font-mono text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Sources */}
          <div>
            <label className="block text-sm font-mono mb-2" style={{ color: 'var(--foreground)' }}>
              Sources / References
            </label>
            <textarea
              value={formData.sources}
              onChange={(e) => handleFieldChange('sources', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 font-mono text-sm resize-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              placeholder="List any historical documents, books, archives, or websites that support this information..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-mono mb-2" style={{ color: 'var(--foreground)' }}>
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 font-mono text-sm resize-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              placeholder="Any additional context or information for reviewers..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-4 py-3 font-mono text-sm font-bold transition-opacity"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
                border: 'none',
                outline: 'none',
                opacity: loading || success ? 0.6 : 1,
                cursor: loading || success ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Submitting...' : success ? 'Submitted!' : 'Submit Proposal'}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 font-mono text-sm transition-opacity"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--foreground-muted)',
                border: '1px solid var(--border)',
                outline: 'none',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default React.memo(ProposalForm)
