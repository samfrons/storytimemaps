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
  title: 'StoryMap Cluster',
  description: 'Interactive story map with clustering',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="moody"
          themes={['moody', 'cool', 'warm', 'hot', 'cold', 'bauhaus', 'art-nouveau']}
          enableSystem={false}
          storageKey="storymap-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}