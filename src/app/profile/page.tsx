'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/profile')
    } else {
      setIsLoading(false)
    }
  }, [status, router])

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="font-mono" style={{ color: 'var(--primary)' }}>
          {t('common.loading')}
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen px-4 py-12" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-mono text-4xl font-bold mb-2" style={{ color: 'var(--primary)' }}>
            {t('auth.myAccount')}
          </h1>
          <p className="font-mono" style={{ color: 'var(--foreground-muted)' }}>
            {t('auth.editProfile')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Information Card */}
          <div
            className="p-6"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
            }}
          >
            <h2 className="font-mono text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              {t('auth.profile')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-sm font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
                  {t('auth.name')}
                </label>
                <div className="font-mono" style={{ color: 'var(--foreground)' }}>
                  {session.user?.name || t('common.unknown')}
                </div>
              </div>

              <div>
                <label className="block font-mono text-sm font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
                  {t('auth.email')}
                </label>
                <div className="font-mono" style={{ color: 'var(--foreground)' }}>
                  {session.user?.email || t('common.unknown')}
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions Card */}
          <div
            className="p-6"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
            }}
          >
            <h2 className="font-mono text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              {t('auth.account')}
            </h2>

            <div className="space-y-3">
              <p className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
                Account features coming soon:
              </p>
              <ul className="font-mono text-sm space-y-2" style={{ color: 'var(--foreground-muted)' }}>
                <li>• Save favorite businesses</li>
                <li>• Create custom collections</li>
                <li>• Share stories with others</li>
                <li>• Receive updates on new research</li>
              </ul>
            </div>
          </div>

          {/* Back Button */}
          <div className="pt-4">
            <button
              onClick={() => router.push('/')}
              className="font-mono outline-none hover:opacity-80 transition-opacity"
              style={{ color: 'var(--primary)' }}
            >
              ← {t('cta.exploreMap')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
