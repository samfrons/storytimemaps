'use client'

import React from 'react'
import { useTranslation } from '../../../i18n/useTranslation'

/** A quiet full-width pause between the interface sections and the history. */
const MemorialBand: React.FC = () => {
  const { t } = useTranslation()

  return (
    <section
      className="py-16 sm:py-24 px-5 sm:px-8 border-t border-b"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <p
          className="text-xl sm:text-2xl lg:text-3xl leading-relaxed italic"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          {t('homepage.memorial.quote', {
            defaultValue:
              'Behind every dot: a family, a livelihood, a place where Berlin bought its bread, its books, its winter coats. This map exists so that they are not reduced to a number.',
          })}
        </p>
      </div>
    </section>
  )
}

export default React.memo(MemorialBand)
