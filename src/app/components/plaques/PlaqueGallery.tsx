'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from '../../../i18n/useTranslation'
import PREMIUM from '../../../../public/plaques/premium/index.json'

/**
 * The generated plaque set, read from the generator's own manifest.
 *
 * public/plaques/premium/index.json is written by
 * scripts/generate-premium-plaques.js alongside the SVGs, so a filename and
 * its caption cannot drift apart. Run `pnpm run plaques:web` to refresh.
 *
 * Links point at /map?id=… — the interactive map moved off the site root, and
 * the old /?id=… form now costs a client-side redirect on every card.
 */
const FEATURED = PREMIUM.featured
const PLAQUES = PREMIUM.plaques

const PlaqueGallery: React.FC = () => {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState<string | null>(null)

  /**
   * Alt text, interpolated by hand rather than by i18next.
   *
   * Passing `{ name }` to t() hydrated inconsistently: on the server the hook
   * resolves straight out of the bundled JSON and never interpolates, so the
   * markup shipped "Memorial plaque for {{name}}", while the client rendered
   * the real name — a mismatch React reported on every card. Asking for the
   * template on both sides and substituting here makes the two agree.
   */
  const plaqueAlt = (name: string) =>
    t('plaques.plaqueAltText', { defaultValue: 'Memorial plaque for {{name}}' }).replace(
      '{{name}}',
      name
    )

  return (
    <section
      id="gallery"
      className="px-5 sm:px-8 py-14 sm:py-20 border-t scroll-mt-20"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-10">
          <p
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--primary)' }}
          >
            {t('plaqueInitiative.gallery.eyebrow', { defaultValue: 'The set so far' })}
          </p>
          <h2
            className="font-kame text-3xl sm:text-5xl leading-tight mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            {t('plaqueInitiative.gallery.title', {
              defaultValue: 'Twenty-five addresses, drawn.',
            })}
          </h2>
          <p
            className="font-['Inter'] text-base sm:text-lg leading-relaxed"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('plaqueInitiative.gallery.intro', {
              defaultValue:
                'Every plaque below is generated straight from its archive record — no name, trade, address or date is typed by hand. Open one to read the business it belongs to.',
            })}
          </p>
        </div>

        {/* The one record with a researched narrative and a traced storefront,
            so the only one that exists in the detailed tier. */}
        <Link href={`/map?id=${FEATURED.id}`} className="group block mb-6">
          <article
            className="border transition-colors duration-200"
            style={{
              borderColor: hovered === FEATURED.id ? 'var(--primary)' : 'var(--border)',
            }}
            onMouseEnter={() => setHovered(FEATURED.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <Image
              src={`/plaques/premium/${FEATURED.slug}-detailed.svg`}
              unoptimized
              alt={plaqueAlt(FEATURED.name)}
              width={800}
              height={680}
              className="w-full h-auto"
            />
            <div
              className="p-5 border-t"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <h3 className="font-mono font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                {FEATURED.name}
              </h3>
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <span>{FEATURED.type}</span>
                <span>{FEATURED.years}</span>
                <span>{FEATURED.address}</span>
              </div>
            </div>
          </article>
        </Link>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PLAQUES.map((plaque) => (
            <Link
              key={plaque.id}
              href={`/map?id=${plaque.id}`}
              className="group block"
              onMouseEnter={() => setHovered(plaque.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <article
                className="border h-full flex flex-col transition-colors duration-200"
                style={{
                  borderColor: hovered === plaque.id ? 'var(--primary)' : 'var(--border)',
                }}
              >
                {/* The SVG carries its own field colour, so the frame stays transparent. */}
                <div className="aspect-[16/9] flex items-center justify-center">
                  <Image
                    src={`/plaques/premium/${plaque.file}`}
                    unoptimized
                    alt={plaqueAlt(plaque.name)}
                    width={800}
                    height={450}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div
                  className="p-5 border-t flex-1"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
                >
                  <h3
                    className="font-mono text-sm font-bold mb-2 leading-snug"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {plaque.name}
                  </h3>
                  <div
                    className="flex items-center justify-between gap-3 font-mono text-[11px] mb-1"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    <span className="truncate">{plaque.type}</span>
                    <span className="flex-shrink-0">{plaque.years}</span>
                  </div>
                  <p className="font-mono text-[11px] truncate" style={{ color: 'var(--muted)' }}>
                    {plaque.address}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default React.memo(PlaqueGallery)
