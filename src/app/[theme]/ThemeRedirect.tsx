'use client'

import React, { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'

interface ThemeRedirectProps {
  theme: string
}

// The theme name is validated on the server (see page.tsx), so only real themes get here.
const ThemeRedirect: React.FC<ThemeRedirectProps> = ({ theme }) => {
  const { setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    // Set the theme and redirect to the map for single-page performance
    setTheme(theme)
    router.replace('/map')
  }, [theme, setTheme, router])

  return (
    <div
      className="w-full h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="font-mono" style={{ color: 'var(--primary)' }}>
        Redirecting...
      </div>
    </div>
  )
}

export default React.memo(ThemeRedirect)
