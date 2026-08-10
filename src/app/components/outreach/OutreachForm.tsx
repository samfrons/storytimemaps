'use client'

import React, { useState, useEffect } from 'react'
import type {
  OutreachRecord,
  OutreachStatus,
  OccupantType,
  PropertyType,
  InterestLevel,
  DataSource,
} from '@/lib/types/outreach'

interface FormData {
  current_occupant_name: string
  current_occupant_type: OccupantType
  property_type: PropertyType
  contact_email: string
  contact_phone: string
  contact_website: string
  contact_person: string
  outreach_status: OutreachStatus
  first_contact_date: string
  last_contact_date: string
  next_follow_up_date: string
  outreach_notes: string
  data_source: DataSource | ''
  interest_level: InterestLevel
}
import {
  OUTREACH_STATUS_LABELS,
  OCCUPANT_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  INTEREST_LEVEL_LABELS,
  DATA_SOURCE_LABELS,
} from '@/lib/types/outreach'

interface OutreachFormProps {
  record: OutreachRecord
  onSave: (updates: Partial<OutreachRecord>) => Promise<void>
  onClose: () => void
}

function OutreachForm({ record, onSave, onClose }: OutreachFormProps) {
  const [formData, setFormData] = useState<FormData>({
    current_occupant_name: record.current_occupant_name || '',
    current_occupant_type: record.current_occupant_type || 'unknown',
    property_type: record.property_type || 'commercial',
    contact_email: record.contact_email || '',
    contact_phone: record.contact_phone || '',
    contact_website: record.contact_website || '',
    contact_person: record.contact_person || '',
    outreach_status: record.outreach_status || 'not_started',
    first_contact_date: record.first_contact_date || '',
    last_contact_date: record.last_contact_date || '',
    next_follow_up_date: record.next_follow_up_date || '',
    outreach_notes: record.outreach_notes || '',
    data_source: record.data_source || '',
    interest_level: record.interest_level || 'unknown',
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFormData({
      current_occupant_name: record.current_occupant_name || '',
      current_occupant_type: record.current_occupant_type || 'unknown',
      property_type: record.property_type || 'commercial',
      contact_email: record.contact_email || '',
      contact_phone: record.contact_phone || '',
      contact_website: record.contact_website || '',
      contact_person: record.contact_person || '',
      outreach_status: record.outreach_status || 'not_started',
      first_contact_date: record.first_contact_date || '',
      last_contact_date: record.last_contact_date || '',
      next_follow_up_date: record.next_follow_up_date || '',
      outreach_notes: record.outreach_notes || '',
      data_source: record.data_source || '',
      interest_level: record.interest_level || 'unknown',
    })
  }, [record])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--input-bg)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
  }

  const labelStyle: React.CSSProperties = {
    color: 'var(--foreground-muted)',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border"
        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div
          className="sticky top-0 p-4 border-b flex items-center justify-between"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
        >
          <div>
            <h2 className="text-lg font-mono" style={{ color: 'var(--foreground)' }}>
              Edit Outreach Record
            </h2>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              {record.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl px-2 hover:opacity-70"
            style={{ color: 'var(--foreground-muted)' }}
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Current Location Section */}
          <div className="space-y-3">
            <h3
              className="text-sm font-mono uppercase border-b pb-2"
              style={{ color: 'var(--primary)', borderColor: 'var(--border)' }}
            >
              Current Location
            </h3>

            <div>
              <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                Current Occupant Name
              </label>
              <input
                type="text"
                name="current_occupant_name"
                value={formData.current_occupant_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm font-mono border"
                style={inputStyle}
                placeholder="e.g., Starbucks, Residential Building"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                  Occupant Type
                </label>
                <select
                  name="current_occupant_type"
                  value={formData.current_occupant_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm font-mono border"
                  style={inputStyle}
                >
                  {Object.entries(OCCUPANT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                  Property Type
                </label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm font-mono border"
                  style={inputStyle}
                >
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                Data Source
              </label>
              <select
                name="data_source"
                value={formData.data_source}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm font-mono border"
                style={inputStyle}
              >
                <option value="">Select source...</option>
                {Object.entries(DATA_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-3">
            <h3
              className="text-sm font-mono uppercase border-b pb-2"
              style={{ color: 'var(--primary)', borderColor: 'var(--border)' }}
            >
              Contact Information
            </h3>

            <div>
              <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                Contact Person
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm font-mono border"
                style={inputStyle}
                placeholder="Name of contact"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                  Email
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm font-mono border"
                  style={inputStyle}
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                  Phone
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm font-mono border"
                  style={inputStyle}
                  placeholder="+49..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                Website
              </label>
              <input
                type="url"
                name="contact_website"
                value={formData.contact_website}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm font-mono border"
                style={inputStyle}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Outreach Status Section */}
          <div className="space-y-3">
            <h3
              className="text-sm font-mono uppercase border-b pb-2"
              style={{ color: 'var(--primary)', borderColor: 'var(--border)' }}
            >
              Outreach Status
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                  Status
                </label>
                <select
                  name="outreach_status"
                  value={formData.outreach_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm font-mono border"
                  style={inputStyle}
                >
                  {Object.entries(OUTREACH_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                  Interest Level
                </label>
                <select
                  name="interest_level"
                  value={formData.interest_level}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm font-mono border"
                  style={inputStyle}
                >
                  {Object.entries(INTEREST_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                  First Contact
                </label>
                <input
                  type="date"
                  name="first_contact_date"
                  value={formData.first_contact_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm font-mono border"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                  Last Contact
                </label>
                <input
                  type="date"
                  name="last_contact_date"
                  value={formData.last_contact_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm font-mono border"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                  Next Follow-Up
                </label>
                <input
                  type="date"
                  name="next_follow_up_date"
                  value={formData.next_follow_up_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm font-mono border"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase mb-1" style={labelStyle}>
                Notes
              </label>
              <textarea
                name="outreach_notes"
                value={formData.outreach_notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 text-sm font-mono border resize-y"
                style={inputStyle}
                placeholder="Add notes about outreach attempts, conversations, etc."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-mono border transition-all hover:opacity-80"
              style={inputStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-mono border transition-all hover:opacity-80 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--primary)',
                borderColor: 'var(--primary)',
                color: 'var(--background)',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default React.memo(OutreachForm)
