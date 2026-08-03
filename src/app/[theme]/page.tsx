'use client'

import React, { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { notFound, useRouter } from 'next/navigation'

interface ThemePageProps {
  params: Promise<{
    theme: string
  }>
}

export default function ThemePage({ params }: ThemePageProps) {
  const { setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    const validThemes = [
      'moody',
      'cool',
      'warm',
      'hot',
      'cold',
      'bauhaus',
      'art-nouveau',
      'archival',
    ]

    params.then((resolvedParams) => {
      if (validThemes.includes(resolvedParams.theme)) {
        // Set the theme and redirect to the map for single-page performance
        setTheme(resolvedParams.theme)
        router.replace('/map')
      } else {
        notFound()
      }
    })
  }, [params, setTheme, router])

  // Show loading while redirecting
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
