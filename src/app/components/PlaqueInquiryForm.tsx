// File: src/app/components/PlaqueInquiryForm.tsx
//
// Building-owner CTA form rendered on every business listing page that
// has verified_address=true. Captures name + email + role + optional
// message and posts to /api/plaque-inquiry, which inserts a row in the
// proposals table with proposal_type='plaque_inquiry' for admin review
// at /admin/proposals.
//
// Includes an empty "website" honeypot field — bots that auto-fill
// every input cause a 400 response on the server.

'use client'

import React, { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import type { BuildingRole, CreatePlaqueInquiryInput } from '@/lib/types/proposal'

interface PlaqueInquiryFormProps {
  businessId: string
  businessName: string
  businessAddress: string
  businessLat: number
  businessLng: number
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

const ROLE_OPTIONS: BuildingRole[] = ['owner', 'tenant', 'manager', 'other']

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const PlaqueInquiryForm: React.FC<PlaqueInquiryFormProps> = ({
  businessId,
  businessName,
  businessAddress,
  businessLat,
  businessLng,
}) => {
  const { t } = useTranslation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<BuildingRole>('owner')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // Honeypot
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitState === 'submitting') return

    if (!name.trim()) {
      setErrorMsg(t('plaques.form.errorName') || 'Please enter your name.')
      setSubmitState('error')
      return
    }
    if (!isValidEmail(email)) {
      setErrorMsg(t('plaques.form.errorEmail') || 'Please enter a valid email address.')
      setSubmitState('error')
      return
    }

    setSubmitState('submitting')
    setErrorMsg('')

    const payload: CreatePlaqueInquiryInput = {
      business_id: businessId,
      business_name: businessName,
      business_address: businessAddress,
      business_lat: businessLat,
      business_lng: businessLng,
      inquiry_name: name.trim(),
      inquiry_email: email.trim(),
      inquiry_phone: phone.trim() || undefined,
      building_role: role,
      message: message.trim() || undefined,
      website: website.trim() || undefined,
    }

    try {
      const res = await fetch('/api/plaque-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const message =
          (data as { error?: string }).error ||
          t('plaques.form.errorGeneric') ||
          'Submission failed. Please try again.'
        setErrorMsg(message)
        setSubmitState('error')
        return
      }

      setSubmitState('success')
      setName('')
      setEmail('')
      setPhone('')
      setRole('owner')
      setMessage('')
    } catch {
      setErrorMsg(t('plaques.form.errorGeneric') || 'Submission failed. Please try again.')
      setSubmitState('error')
    }
  }

  if (submitState === 'success') {
    return (
      <div
        className="p-6 border"
        style={{
          backgroundColor: 'rgba(var(--success), 0.08)',
          borderColor: 'var(--success)',
        }}
      >
        <h3 className="font-mono font-semibold text-base mb-2" style={{ color: 'var(--success)' }}>
          {t('plaques.form.thanksTitle') || 'Thank you'}
        </h3>
        <p className="font-mono text-sm" style={{ color: 'var(--foreground)' }}>
          {t('plaques.form.thanksBody') ||
            'We received your inquiry and will be in touch soon about a memorial plaque for this address.'}
        </p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--input-bg)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
    outline: 'none',
    boxShadow: 'none',
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 border space-y-4"
      style={{
        backgroundColor: 'rgba(var(--card-bg-rgb), 0.6)',
        borderColor: 'var(--border)',
      }}
      aria-label={t('plaques.cta.title') || 'Plaque inquiry form'}
    >
      <div>
        <h3
          className="font-semibold text-lg mb-1"
          style={{
            color: 'var(--foreground)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t('plaques.cta.title') || 'Are you the owner of this building?'}
        </h3>
        <p className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
          {t('plaques.cta.body', { businessName }) ||
            `Help us install a memorial plaque commemorating ${businessName} at this address. Tell us a bit about yourself and we will reach out.`}
        </p>
      </div>

      {/* Honeypot field — visually hidden, bots will fill it */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        <label htmlFor="plaque-inquiry-website">Website</label>
        <input
          id="plaque-inquiry-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <span
            className="block text-xs font-mono uppercase tracking-wider mb-1"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('plaques.form.name') || 'Name'} *
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="w-full px-3 py-2 border font-mono text-sm"
            style={inputStyle}
          />
        </label>

        <label className="block">
          <span
            className="block text-xs font-mono uppercase tracking-wider mb-1"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('plaques.form.email') || 'Email'} *
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3 py-2 border font-mono text-sm"
            style={inputStyle}
          />
        </label>

        <label className="block">
          <span
            className="block text-xs font-mono uppercase tracking-wider mb-1"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('plaques.form.phone') || 'Phone (optional)'}
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            className="w-full px-3 py-2 border font-mono text-sm"
            style={inputStyle}
          />
        </label>

        <label className="block">
          <span
            className="block text-xs font-mono uppercase tracking-wider mb-1"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('plaques.form.role') || 'Your relationship to the building'} *
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as BuildingRole)}
            required
            className="w-full px-3 py-2 border font-mono text-sm"
            style={inputStyle}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {t(`plaques.role.${r}`) || r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span
          className="block text-xs font-mono uppercase tracking-wider mb-1"
          style={{ color: 'var(--foreground-muted)' }}
        >
          {t('plaques.form.message') || 'Message (optional)'}
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full px-3 py-2 border font-mono text-sm"
          style={inputStyle}
        />
      </label>

      {submitState === 'error' && errorMsg && (
        <div
          className="p-3 border font-mono text-xs"
          style={{
            backgroundColor: 'rgba(var(--card-bg-rgb), 0.4)',
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
          }}
          role="alert"
        >
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={submitState === 'submitting'}
        className="px-6 py-3 font-mono font-semibold text-sm transition-opacity disabled:opacity-50"
        style={{
          backgroundColor: 'var(--danger)',
          color: 'var(--background)',
          border: '1px solid var(--danger)',
        }}
      >
        {submitState === 'submitting'
          ? t('plaques.form.submitting') || 'Sending…'
          : t('plaques.form.submit') || 'Get in touch'}
      </button>
    </form>
  )
}

export default React.memo(PlaqueInquiryForm)
