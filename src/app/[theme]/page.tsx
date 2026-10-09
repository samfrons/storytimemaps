import { notFound } from 'next/navigation'
import ThemeRedirect from './ThemeRedirect'

const VALID_THEMES = [
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
]

interface ThemePageProps {
  params: Promise<{
    theme: string
  }>
}

// Validated on the server so an unknown path (e.g. /llms.txt, a mistyped link) returns a
// real HTTP 404 to crawlers and agents instead of a 200 "Redirecting..." soft-404.
export default async function ThemePage({ params }: ThemePageProps) {
  const { theme } = await params
  if (!VALID_THEMES.includes(theme)) notFound()
  return <ThemeRedirect theme={theme} />
}
