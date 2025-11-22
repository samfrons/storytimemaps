'use client'

import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

export default function UserMenu() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()
  const [showMenu, setShowMenu] = useState(false)

  if (status === 'loading') {
    return null
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
    setShowMenu(false)
  }

  if (!session) {
    // Show login/register buttons when not authenticated
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={() => router.push('/auth/login')}
          className="w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110"
          style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
            cursor: 'pointer',
            transform: 'scale(1)',
            transition: 'transform 0.2s ease-in-out, background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label={t('auth.login') as string}
          title={t('auth.login') as string}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    )
  }

  // Show user menu when authenticated
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110"
        style={{
          backgroundColor: showMenu ? 'var(--primary)' : 'var(--input-bg)',
          borderColor: 'var(--border)',
          color: showMenu ? 'var(--background)' : 'var(--foreground)',
          cursor: 'pointer',
          transform: 'scale(1)',
          transition: 'transform 0.2s ease-in-out, background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
        aria-label={t('auth.account') as string}
        title={session.user?.name || session.user?.email || t('auth.account') as string}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </button>

      {/* User Dropdown */}
      {showMenu && (
        <div
          className="absolute left-12 top-0 w-40 border backdrop-blur-md shadow-lg"
          style={{
            backgroundColor: 'var(--dropdown-bg)',
            borderColor: 'var(--border)',
            zIndex: 10000
          }}
        >
          <div
            className="px-3 py-2 border-b"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--foreground-muted)'
            }}
          >
            <div className="text-xs font-mono truncate">
              {session.user?.name || t('common.unknown')}
            </div>
            <div className="text-xs font-mono truncate" style={{ color: 'var(--foreground-muted)' }}>
              {session.user?.email}
            </div>
          </div>

          <button
            onClick={() => {
              router.push('/profile')
              setShowMenu(false)
            }}
            className="w-full px-3 py-2 text-left text-xs font-mono transition-all"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--foreground)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)'
              e.currentTarget.style.color = 'var(--primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--foreground)'
            }}
          >
            {t('auth.profile')}
          </button>

          <button
            onClick={handleSignOut}
            className="w-full px-3 py-2 text-left text-xs font-mono transition-all border-t"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--danger)'
              e.currentTarget.style.color = 'var(--background)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--foreground)'
            }}
          >
            {t('auth.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
