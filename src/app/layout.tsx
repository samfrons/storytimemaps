import './globals.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Metadata } from 'next'
import { Inter, Space_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'

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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#4a4a57' }
  ],
  viewport: 'width=device-width, initial-scale=1',
  colorScheme: 'dark light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="moody"
          themes={['moody', 'cool', 'warm', 'hot', 'cold', 'bauhaus', 'art-nouveau']}
          enableSystem={false}
          enableColorScheme={true}
          disableTransitionOnChange={false}
          storageKey="storymap-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}