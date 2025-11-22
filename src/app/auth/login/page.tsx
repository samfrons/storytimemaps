'use client'

import React, { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

function LoginForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError(t('auth.loginError'))
      } else {
        const callbackUrl = searchParams?.get('callbackUrl') || '/'
        router.push(callbackUrl)
      }
    } catch (err) {
      setError(t('auth.loginError'))
    } finally {
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
              {t('auth.welcomeBack')}
            </h1>
            <p className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
              {t('auth.loginSubtitle')}
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
              <label htmlFor="email" className="block font-mono text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? t('common.loading') : t('auth.loginButton')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
              {t('auth.noAccount')}{' '}
              <Link
                href="/auth/register"
                className="font-bold outline-none hover:opacity-80 transition-opacity"
                style={{ color: 'var(--primary)' }}
              >
                {t('auth.createAccount')}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="font-mono" style={{ color: 'var(--primary)' }}>Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
