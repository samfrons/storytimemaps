'use client'

import React, { Suspense } from 'react'
import CookieConsent from './CookieConsent'

// Wrapper component to handle Suspense boundary for useSearchParams.
// Memoized so theme/language changes in the parent don't cascade a
// re-render through the cookie consent subtree.
const CookieConsentWrapper: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <CookieConsent />
    </Suspense>
  )
}

export default React.memo(CookieConsentWrapper)
