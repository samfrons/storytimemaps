import './globals.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Mono, Playfair_Display } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { I18nProvider } from '../i18n/I18nProvider'
import { AuthProvider } from '../contexts/AuthContext'
import CookieConsentWrapper from './components/CookieConsentWrapper'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  weight: ['400', '500', '600'],
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-mono',
  preload: true,
  weight: ['400', '700'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  preload: true,
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://storymaps.vercel.app'),
  title: 'Jewish Businesses in Berlin 1900-1945',
  description:
    'Interactive map documenting Jewish-owned businesses in Berlin from 1900-1945. Explore the history of Jewish entrepreneurship and discover the stories of businesses that shaped the city.',
  keywords: [
    'Jewish history',
    'Berlin history',
    'Jewish businesses',
    'Holocaust education',
    'historical map',
    'data visualization',
    'Jewish heritage',
  ],
  authors: [{ name: 'StoryMaps Project' }],
  creator: 'StoryMaps Project',
  publisher: 'StoryMaps Project',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Jewish Businesses in Berlin 1900-1945',
    title: 'Jewish Businesses in Berlin 1900-1945',
    description:
      'Interactive map documenting Jewish-owned businesses in Berlin from 1900-1945. Explore the history of Jewish entrepreneurship and discover the stories of businesses that shaped the city.',
    images: [
      {
        url: '/images/og-share-image.svg',
        width: 1200,
        height: 630,
        alt: 'Jewish Businesses in Berlin 1900-1945 - Interactive Historical Map',
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jewish Businesses in Berlin 1900-1945',
    description:
      'Interactive map documenting Jewish-owned businesses in Berlin from 1900-1945. Explore history through data visualization.',
    images: ['/images/og-share-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'dns-prefetch': '//api.mapbox.com',
    preconnect: 'https://api.mapbox.com',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#4a4a57' },
  ],
  colorScheme: 'dark light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceMono.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//api.mapbox.com" />
        <link rel="dns-prefetch" href="//events.mapbox.com" />
        <link rel="dns-prefetch" href="//tiles.mapbox.com" />

        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://api.mapbox.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://events.mapbox.com" crossOrigin="anonymous" />

        {/* Preload critical custom fonts */}
        <link
          rel="preload"
          href="/fonts/Kame Poster Black.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Kame Book.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Preload critical resources */}
        <link rel="preload" href="/api/storymaps/metadata" as="fetch" crossOrigin="anonymous" />

        {/* Preload critical background image only when needed */}
        <link rel="prefetch" href="/berlin-map.png" as="image" />

        {/* Resource hints for better performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* Mobile-specific optimizations */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* Disable tap highlight on mobile for better performance */}
        <style>{`
          @media (max-width: 768px) {
            * {
              -webkit-tap-highlight-color: transparent;
              -webkit-touch-callout: none;
            }
            
            /* Optimize scrolling performance on mobile */
            .overflow-y-auto {
              -webkit-overflow-scrolling: touch;
              overflow-scrolling: touch;
            }
            
            /* Prevent layout shifts during font loading */
            body {
              font-display: swap;
            }
            
            /* Reduce animations on mobile for better performance */
            @media (prefers-reduced-motion: reduce) {
              *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
              }
            }
            
            /* Prevent layout shifts from loading states */
            .loading-skeleton {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            /* Optimize input responsiveness for better FID/INP */
            input, button, select, textarea {
              touch-action: manipulation;
            }
          }
        `}</style>
      </head>
      <body className="font-sans">
        <I18nProvider>
          {/* CRITICAL: Theme Provider Settings - DO NOT CHANGE
              disableTransitionOnChange MUST be true to prevent flashing
              enableColorScheme MUST be false to prevent browser interference
              enableSystem MUST be false for consistent behavior

              defaultTheme is brutal-pop: it is the /museum-exhibit kiosk palette, so the site a
              visitor lands on and the screen standing in the exhibition read as the same
              project. next-themes only falls back to the default when the storage key holds
              nothing, so anyone who had ever tried another theme — or who passed through a page
              that used to force one — stayed on it forever and never saw brutal-pop at all.
              The key is versioned for exactly that reason: bumping it retires those stored
              choices once, so brutal-pop is the default in fact and not only in this prop.
              Bump it again only to force another site-wide reset. */}
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="brutal-pop"
            themes={[
              'moody',
              'cool',
              'warm',
              'hot',
              'cold',
              'bauhaus',
              'art-nouveau',
              'archival',
              'hoefe',
              'brutal-pop',
            ]}
            enableSystem={false}
            enableColorScheme={false}
            disableTransitionOnChange={true}
            storageKey="storymap-theme-v2"
            forcedTheme={undefined}
          >
            <AuthProvider>
              {children}
              <CookieConsentWrapper />
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
