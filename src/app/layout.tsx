import './globals.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { I18nProvider } from '../i18n/I18nProvider'
import SessionProvider from './components/SessionProvider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  weight: ['400', '500', '600']
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-mono',
  preload: true,
  weight: ['400', '700']
})

export const metadata: Metadata = {
  title: 'Jewish Businesses in Berlin 1900-1945',
  description: 'Interactive map documenting Jewish-owned businesses in Berlin from 1900-1945',
  other: {
    'dns-prefetch': '//api.mapbox.com',
    'preconnect': 'https://api.mapbox.com',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#4a4a57' }
  ],
  colorScheme: 'dark light'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`} suppressHydrationWarning>
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
        <link 
          rel="preload" 
          href="/api/storymaps/metadata" 
          as="fetch" 
          crossOrigin="anonymous" 
        />
        
        {/* Preload critical background image only when needed */}
        <link 
          rel="prefetch" 
          href="/berlin-map.png" 
          as="image"
        />
        
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
        <SessionProvider>
          <I18nProvider>
            <ThemeProvider
              attribute="data-theme"
              defaultTheme="moody"
              themes={['moody', 'cool', 'warm', 'hot', 'cold', 'bauhaus', 'art-nouveau', 'archival']}
              enableSystem={false}
              enableColorScheme={true}
              disableTransitionOnChange={true}
              storageKey="storymap-theme"
              forcedTheme={undefined}
            >
              {children}
            </ThemeProvider>
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  )
}