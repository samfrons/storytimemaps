'use client'

import React, { Suspense } from 'react'
import CookieConsent from './CookieConsent'

// Wrapper component to handle Suspense boundary for useSearchParams
const CookieConsentWrapper: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <CookieConsent />
    </Suspense>
  )
}

export default CookieConsentWrapper
