'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignup: () => void
}

// Google icon SVG component
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
      fill="#34A853"
    />
    <path
      d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      fill="#EA4335"
    />
  </svg>
)

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToSignup }) => {
  const { t } = useTranslation()
  const { signIn, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)

    const { error } = await signInWithGoogle()

    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
    // Note: On success, user will be redirected to Google OAuth page
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onClose()
      setEmail('')
      setPassword('')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(var(--background-rgb), 0.8)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6"
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
            {t('Welcome Back')}
          </h2>
          <p className="text-sm font-sans" style={{ color: 'var(--foreground-muted)' }}>
            Sign in to continue contributing to historical research
          </p>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 font-mono text-sm transition-opacity mb-4"
          style={{
            backgroundColor: 'var(--card-bg)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            outline: 'none',
            opacity: googleLoading || loading ? 0.6 : 1,
            cursor: googleLoading || loading ? 'not-allowed' : 'pointer',
          }}
          onFocus={(e) => {
            e.target.style.outline = 'none'
            e.target.style.boxShadow = 'none'
          }}
          onMouseEnter={(e) => {
            if (!googleLoading && !loading) {
              e.currentTarget.style.backgroundColor = 'var(--input-bg)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--card-bg)'
          }}
        >
          <GoogleIcon />
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>
            or sign in with email
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
        </div>

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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-mono mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 font-mono text-sm"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none'
                e.target.style.boxShadow = 'none'
                e.target.style.borderColor = 'var(--primary)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)'
              }}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-mono mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 font-mono text-sm"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none'
                e.target.style.boxShadow = 'none'
                e.target.style.borderColor = 'var(--primary)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)'
              }}
              placeholder="••••••••"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 font-mono text-sm font-bold transition-opacity"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
                border: 'none',
                outline: 'none',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none'
                e.target.style.boxShadow = 'none'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = '0.8'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.opacity = '1'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 font-mono text-sm transition-opacity"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--foreground-muted)',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none'
                e.target.style.boxShadow = 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.7'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Switch to signup */}
        <div className="mt-6 text-center">
          <p className="text-sm font-sans" style={{ color: 'var(--foreground-muted)' }}>
            Don&apos;t have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="font-mono font-bold"
              style={{
                color: 'var(--primary)',
                background: 'none',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none'
                e.target.style.boxShadow = 'none'
              }}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default React.memo(LoginModal)
