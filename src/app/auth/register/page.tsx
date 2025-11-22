'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError(t('auth.emailRequired'))
      return false
    }

    if (formData.password.length < 8) {
      setError(t('auth.passwordMinLength'))
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'))
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t('auth.registerError'))
        setIsLoading(false)
        return
      }

      // Auto sign in after successful registration
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      })

      if (result?.error) {
        // Registration successful but auto-login failed, redirect to login
        router.push('/auth/login?registered=true')
      } else {
        // Both registration and login successful
        router.push('/')
      }
    } catch (err) {
      setError(t('auth.registerError'))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="p-8" style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 6px rgba(var(--shadow), 0.1)'
        }}>
          <div className="mb-8 text-center">
            <h1 className="font-mono text-3xl font-bold mb-2" style={{ color: 'var(--primary)' }}>
              {t('auth.welcome')}
            </h1>
            <p className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
              {t('auth.registerSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="p-3 font-mono text-sm"
                style={{
                  backgroundColor: 'rgba(var(--danger), 0.1)',
                  border: '1px solid var(--danger)',
                  color: 'var(--danger)'
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block font-mono text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('auth.name')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 font-mono outline-none"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)'
                }}
                placeholder={t('auth.name') as string}
              />
            </div>

            <div>
              <label htmlFor="email" className="block font-mono text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 font-mono outline-none"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)'
                }}
                placeholder={t('auth.email') as string}
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-mono text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 font-mono outline-none"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)'
                }}
                placeholder={t('auth.password') as string}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block font-mono text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 font-mono outline-none"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)'
                }}
                placeholder={t('auth.confirmPassword') as string}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 font-mono font-bold transition-opacity duration-200 hover:opacity-80 outline-none"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? t('common.loading') : t('auth.registerButton')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
              {t('auth.hasAccount')}{' '}
              <Link
                href="/auth/login"
                className="font-bold outline-none hover:opacity-80 transition-opacity"
                style={{ color: 'var(--primary)' }}
              >
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="font-mono text-sm outline-none hover:opacity-80 transition-opacity"
            style={{ color: 'var(--foreground-muted)' }}
          >
            ← {t('cta.exploreMap')}
          </Link>
        </div>
      </div>
    </div>
  )
}
