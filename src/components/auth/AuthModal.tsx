'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
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

type AuthStep = 'email' | 'signin' | 'signup'

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signUp, signIn, signInWithGoogle } = useAuth()

  // Form state
  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Handle modal open/close animation
  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  const resetForm = useCallback(() => {
    setStep('email')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setDisplayName('')
    setError(null)
    setSuccess(false)
    setLoading(false)
    setGoogleLoading(false)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    // Wait for animation to complete before closing
    setTimeout(() => {
      resetForm()
      onClose()
    }, 200)
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)

    const { error } = await signInWithGoogle()

    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
    // On success, user will be redirected to Google OAuth page
  }

  // Step 1: Check email and try to sign in
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    // Move to password step - we'll determine signin vs signup based on the result
    setStep('signin')
  }

  // Step 2: Try to sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      const errorMsg = error.message.toLowerCase()

      // Check if user doesn't exist - suggest creating account
      if (
        errorMsg.includes('invalid login credentials') ||
        errorMsg.includes('user not found') ||
        errorMsg.includes('invalid credentials')
      ) {
        setError(null)
        // Ask if they want to create an account
        setStep('signup')
        setPassword('') // Clear password for fresh start
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      // Success - close modal
      handleClose()
    }
  }

  // Step 3: Sign up (if user doesn't exist)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password, displayName)

    if (error) {
      const errorMsg = error.message.toLowerCase()

      // Check if user already exists - switch to sign in
      if (
        errorMsg.includes('already registered') ||
        errorMsg.includes('already exists') ||
        errorMsg.includes('user already')
      ) {
        setError('This email is already registered. Please sign in instead.')
        setStep('signin')
        setPassword('')
        setConfirmPassword('')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Show success message, then close
      setTimeout(() => {
        handleClose()
      }, 3000)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="auth-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(var(--background-rgb), 0.8)',
        opacity: isVisible ? 1 : 0,
      }}
      onClick={handleClose}
    >
      <div
        className="auth-modal-panel w-full max-w-md p-6"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(var(--shadow), 0.4)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-16px) scale(0.98)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-mono font-bold mb-2" style={{ color: 'var(--primary)' }}>
            {step === 'email' && 'Continue to StoryMaps'}
            {step === 'signin' && 'Welcome Back'}
            {step === 'signup' && 'Create Your Account'}
          </h2>
          <p className="text-sm font-sans" style={{ color: 'var(--foreground-muted)' }}>
            {step === 'email' && 'Sign in or create an account to contribute historical data'}
            {step === 'signin' && 'Enter your password to continue'}
            {step === 'signup' && 'Complete your registration to start contributing'}
          </p>

          {step === 'signup' && (
            <div
              className="auth-message mt-3 p-3 text-xs font-mono"
              style={{
                backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                border: '1px solid var(--border)',
              }}
            >
              <p style={{ color: 'var(--foreground)' }}>
                <strong>For historians &amp; researchers:</strong> Your contributions help document
                Jewish commercial history in Berlin.
              </p>
            </div>
          )}
        </div>

        {/* Success message */}
        {success && (
          <div
            className="auth-message mb-4 p-3"
            style={{
              backgroundColor: 'rgba(var(--success-rgb), 0.1)',
              border: '1px solid var(--success)',
            }}
          >
            <p className="text-sm font-mono" style={{ color: 'var(--success)' }}>
              Account created! Please check your email to confirm your account.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            className="auth-message mb-4 p-3"
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

        {/* Google Sign In - always available */}
        {!success && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="auth-btn-secondary w-full flex items-center justify-center gap-3 px-4 py-3 font-mono text-sm mb-4"
              style={{
                backgroundColor: 'var(--card-bg)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                outline: 'none',
                opacity: googleLoading || loading ? 0.6 : 1,
                cursor: googleLoading || loading ? 'not-allowed' : 'pointer',
              }}
            >
              <GoogleIcon />
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
              <span className="text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>
                or continue with email
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
            </div>
          </>
        )}

        {/* Email Step */}
        {step === 'email' && !success && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-mono mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="auth-input w-full px-4 py-3 font-mono text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              className="auth-btn-primary w-full px-4 py-3 font-mono text-sm font-bold"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
                border: 'none',
                outline: 'none',
              }}
            >
              Continue
            </button>
          </form>
        )}

        {/* Sign In Step */}
        {step === 'signin' && !success && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="email-display"
                  className="text-sm font-mono"
                  style={{ color: 'var(--foreground)' }}
                >
                  Email
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setPassword('')
                    setError(null)
                  }}
                  className="auth-link text-xs font-mono"
                  style={{
                    color: 'var(--primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Change
                </button>
              </div>
              <div
                className="px-4 py-3 font-mono text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--foreground-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                {email}
              </div>
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
                autoFocus
                className="auth-input w-full px-4 py-3 font-mono text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-btn-primary w-full px-4 py-3 font-mono text-sm font-bold"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
                border: 'none',
                outline: 'none',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Switch to signup */}
            <div className="text-center pt-2">
              <p className="text-sm font-sans" style={{ color: 'var(--foreground-muted)' }}>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setStep('signup')
                    setPassword('')
                    setError(null)
                  }}
                  className="auth-link font-mono font-bold"
                  style={{
                    color: 'var(--primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Create an account
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Sign Up Step */}
        {step === 'signup' && !success && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="email-display"
                  className="text-sm font-mono"
                  style={{ color: 'var(--foreground)' }}
                >
                  Email
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setPassword('')
                    setConfirmPassword('')
                    setError(null)
                  }}
                  className="auth-link text-xs font-mono"
                  style={{
                    color: 'var(--primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Change
                </button>
              </div>
              <div
                className="px-4 py-3 font-mono text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--foreground-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                {email}
              </div>
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-mono mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
                className="auth-input w-full px-4 py-3 font-mono text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
                placeholder="Your Name"
              />
            </div>

            <div>
              <label
                htmlFor="password-new"
                className="block text-sm font-mono mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Password
              </label>
              <input
                type="password"
                id="password-new"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input w-full px-4 py-3 font-mono text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
                placeholder="••••••••"
              />
              <p className="text-xs mt-1 font-mono" style={{ color: 'var(--foreground-muted)' }}>
                At least 6 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-mono mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="auth-input w-full px-4 py-3 font-mono text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-btn-primary w-full px-4 py-3 font-mono text-sm font-bold"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
                border: 'none',
                outline: 'none',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Switch to signin */}
            <div className="text-center pt-2">
              <p className="text-sm font-sans" style={{ color: 'var(--foreground-muted)' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setStep('signin')
                    setPassword('')
                    setConfirmPassword('')
                    setError(null)
                  }}
                  className="auth-link font-mono font-bold"
                  style={{
                    color: 'var(--primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Cancel button */}
        {!success && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading || googleLoading}
              className="auth-btn-cancel text-sm font-mono"
              style={{
                color: 'var(--foreground-muted)',
                background: 'none',
                border: 'none',
                cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
                opacity: loading || googleLoading ? 0.6 : 1,
                padding: '4px 8px',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(AuthModal)
