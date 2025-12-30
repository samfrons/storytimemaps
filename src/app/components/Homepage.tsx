'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '../../i18n/useTranslation'
import { useAuth } from '@/contexts/AuthContext'
import LanguageToggle from './LanguageToggle'
import AnimatedBusinessCarousel from './AnimatedBusinessCarousel'
import StatisticsSection from './StatisticsSection'
import BerlinMapPreview from './BerlinMapPreview'
import MethodologySection from './MethodologySection'
import TimelineSection from './TimelineSection'
import InsightsSection from './InsightsSection'
import NavigationGuide from './NavigationGuide'
import ResearchSection from './ResearchSection'
import FutureInitiatives from './FutureInitiatives'
import AuthModal from '@/components/auth/AuthModal'

interface BusinessFeature {
  properties: {
    name: string
    business_type?: string
    address?: string
    registration_date?: string
    dissolution_date?: string
    liquidation_date?: string
    date_range?: string
    category?: string
  }
}

interface StoryMapBusiness {
  id: string
  title: string
  description: string
  address: string
  startDate: string
  endDate?: string
  category: string
  imageUrls?: string[]
}

interface HomepageProps {
  businessData: BusinessFeature[]
  storyMapData?: StoryMapBusiness[]
}

const Homepage: React.FC<HomepageProps> = ({ businessData, storyMapData }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Process business data for carousel - use storymap data with images
  const carouselBusinesses = useMemo(() => {
    if (storyMapData && storyMapData.length > 0) {
      // Use businesses with images and descriptions
      return storyMapData
        .filter((business) => business.imageUrls && business.imageUrls.length > 0)
        .slice(0, 8)
        .map((business) => ({
          name: business.title,
          business_type: business.category,
          address: business.address,
          registration_date: business.startDate
            ? new Date(business.startDate).getFullYear().toString()
            : 'Unknown',
          dissolution_date: business.endDate
            ? new Date(business.endDate).getFullYear().toString()
            : '',
          category: business.category,
          description: business.description,
          imageUrls: business.imageUrls,
        }))
    }

    // Fallback to geojson data
    const selectedBusinesses = []
    const categories = new Set()

    for (const feature of businessData) {
      const props = feature.properties
      if (categories.has(props.category)) continue

      selectedBusinesses.push({
        name: props.name,
        business_type: props.business_type || 'Unknown',
        address: props.address || 'Unknown address',
        registration_date: props.registration_date || props.date_range?.split('-')[0] || 'Unknown',
        dissolution_date: props.dissolution_date || props.liquidation_date || '',
        category: props.category || 'Unknown',
      })

      categories.add(props.category)
      if (selectedBusinesses.length >= 8) break
    }

    return selectedBusinesses
  }, [businessData, storyMapData])

  // Calculate statistics
  const statistics = useMemo(() => {
    const categories: { [key: string]: number } = {}
    const yearCounts: { [key: string]: number } = {}

    businessData.forEach((feature) => {
      const props = feature.properties

      // Count categories
      const category = props.category || 'Unknown'
      categories[category] = (categories[category] || 0) + 1

      // Count by registration year
      if (props.registration_date) {
        const year = props.registration_date.toString()
        yearCounts[year] = (yearCounts[year] || 0) + 1
      }
    })

    // Find peak year
    let peakYear = { year: 1930, count: 0 }
    Object.entries(yearCounts).forEach(([year, count]) => {
      if (count > peakYear.count) {
        peakYear = { year: parseInt(year), count }
      }
    })

    return {
      totalBusinesses: businessData.length,
      timeSpanStart: 1900,
      timeSpanEnd: 1945,
      categories,
      peakYear,
    }
  }, [businessData])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Clean, Modern, Light */}
      <header
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, var(--background), var(--card-bg))' }}
      >
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Floating accent elements - subtle */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-amber-50 to-transparent rounded-full blur-3xl opacity-40" />

        <div className="absolute top-6 right-6 z-10 flex items-center gap-4">
          <LanguageToggle />
          {!user ? (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 font-mono text-sm font-bold transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
                border: 'none',
              }}
            >
              Sign In / Sign Up
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="px-4 py-2 font-mono text-sm transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
              }}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="relative pt-32 pb-28 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Clean typography */}
            <div className="space-y-8">
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-mono uppercase tracking-widest">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 7a2 2 0 114 0 2 2 0 01-4 0z" />
                  </svg>
                  Berlin 1900-1945
                </span>
              </div>

              <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-light text-gray-900 text-center leading-[0.9] tracking-tight">
                {t('hero.title')}
              </h1>

              <p className="font-serif text-2xl md:text-3xl lg:text-4xl text-gray-600 text-center max-w-4xl mx-auto leading-relaxed font-light italic">
                {t('hero.subtitle')}
              </p>

              {/* Modern CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <button className="px-8 py-4 bg-black text-white font-medium hover:bg-gray-900 transition-all duration-200 text-lg group">
                  Explore Map
                  <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </button>
                <button className="px-8 py-4 bg-white border-2 border-black text-black font-medium hover:bg-gray-50 transition-all duration-200 text-lg">
                  View Archive
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-8 mt-20 pt-12 border-t border-gray-200">
              <div className="text-center">
                <div className="font-mono text-4xl font-bold text-gray-900">8,000+</div>
                <div className="text-sm text-gray-600 mt-2 font-medium uppercase tracking-wider">
                  Businesses
                </div>
              </div>
              <div className="text-center">
                <div className="font-mono text-4xl font-bold text-gray-900">45</div>
                <div className="text-sm text-gray-600 mt-2 font-medium uppercase tracking-wider">
                  Years Documented
                </div>
              </div>
              <div className="text-center">
                <div className="font-mono text-4xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-600 mt-2 font-medium uppercase tracking-wider">
                  Open Data
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Introduction Section - Clean Layout */}
      <section className="py-32 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text content */}
            <div className="space-y-8">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
                  About the Project
                </span>
                <h2 className="font-display text-5xl md:text-6xl font-light text-gray-900 mt-4 leading-tight">
                  {t('intro.title')}
                </h2>
              </div>

              <div className="space-y-6">
                <p className="text-lg text-gray-700 leading-relaxed">{t('intro.paragraph1')}</p>
                <p className="text-lg text-gray-700 leading-relaxed">{t('intro.paragraph2')}</p>
                <p className="text-lg text-gray-700 leading-relaxed">{t('intro.paragraph3')}</p>
              </div>

              {/* Modern quote block */}
              <blockquote className="border-l-4 border-black pl-6 py-2">
                <p className="font-serif text-2xl text-gray-900 italic leading-relaxed">
                  &ldquo;Every data point represents a life, a story, a piece of Berlin&apos;s
                  commercial heritage.&rdquo;
                </p>
                <cite className="block mt-4 font-mono text-sm text-gray-600 not-italic">
                  — StoryTimeMaps Archive
                </cite>
              </blockquote>
            </div>

            {/* Map Preview - Modern card */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-gray-200 to-gray-300 opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-white p-2 shadow-2xl">
                <div className="bg-gray-100 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-mono text-sm uppercase tracking-wider text-gray-700">
                      {t('intro.mapTitle')}
                    </h3>
                    <span className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Live Data
                    </span>
                  </div>
                  <div className="h-[500px] bg-white overflow-hidden">
                    <BerlinMapPreview />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Carousel Section - Clean & Modern */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
              Featured Stories
            </span>
            <h2 className="font-display text-5xl md:text-6xl font-light text-gray-900 mt-4 mb-6">
              {t('preview.title')}
            </h2>
            <p className="font-serif text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('preview.subtitle')}
            </p>
          </div>

          {/* Modern carousel wrapper */}
          <div className="relative">
            <div className="absolute -inset-x-4 -inset-y-2 bg-gradient-to-r from-gray-50 via-white to-gray-50 blur-xl opacity-50" />
            <div className="relative">
              <AnimatedBusinessCarousel businesses={carouselBusinesses} />
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <StatisticsSection {...statistics} />

      {/* Methodology Section */}
      <MethodologySection />

      {/* Timeline Section */}
      <TimelineSection />

      {/* Data Insights Section */}
      <InsightsSection />

      {/* Navigation Guide */}
      <NavigationGuide />

      {/* Research Foundation */}
      <ResearchSection />

      {/* Future Initiatives */}
      <FutureInitiatives />

      {/* Contributor Call to Action */}
      {!user && (
        <section className="py-24 px-6" style={{ backgroundColor: 'var(--card-bg)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left side - Messaging */}
              <div className="space-y-6">
                <div>
                  <span
                    className="font-mono text-xs uppercase tracking-widest"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    For Researchers &amp; Historians
                  </span>
                  <h2
                    className="font-display text-4xl md:text-5xl font-light mt-4 leading-tight"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Help Preserve History
                  </h2>
                </div>

                <p className="text-lg leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
                  Whether you&apos;re an academic researcher, a local historian, or someone
                  passionate about preserving Jewish heritage, your contributions make a difference.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 flex items-center justify-center mt-0.5"
                      style={{ color: 'var(--success)' }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        className="font-mono text-sm font-bold"
                        style={{ color: 'var(--foreground)' }}
                      >
                        Add New Business Records
                      </p>
                      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        Share discoveries from archives, documents, and family records
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 flex items-center justify-center mt-0.5"
                      style={{ color: 'var(--success)' }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        className="font-mono text-sm font-bold"
                        style={{ color: 'var(--foreground)' }}
                      >
                        Correct &amp; Enhance Data
                      </p>
                      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        Help improve accuracy with updated information and sources
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 flex items-center justify-center mt-0.5"
                      style={{ color: 'var(--success)' }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        className="font-mono text-sm font-bold"
                        style={{ color: 'var(--foreground)' }}
                      >
                        Join Our Community
                      </p>
                      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        Connect with fellow historians and researchers worldwide
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Sign up card */}
              <div
                className="p-8 space-y-6"
                style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <h3
                    className="font-mono text-xl font-bold mb-2"
                    style={{ color: 'var(--primary)' }}
                  >
                    Become a Contributor
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    Create an account to start adding and editing historical business data. All
                    contributions are reviewed by our team.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full px-6 py-4 font-mono text-sm font-bold transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: 'var(--background)',
                      border: 'none',
                    }}
                  >
                    Get Started
                  </button>
                </div>

                <p className="text-xs text-center" style={{ color: 'var(--foreground-muted)' }}>
                  By signing up, you agree to contribute data responsibly and respect historical
                  accuracy.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modern Call to Action */}
      <section className="py-32 px-6 bg-gradient-to-b from-gray-900 to-black text-white relative overflow-hidden">
        {/* Subtle gradient overlays */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-600 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-amber-600 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative">
          <h2 className="font-display text-6xl md:text-7xl lg:text-8xl font-light mb-8 leading-tight">
            Ready to Explore?
          </h2>
          <p className="font-serif text-xl md:text-2xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed">
            Step into Berlin&apos;s past and discover the stories of thousands of Jewish businesses
            that once formed the heart of the city&apos;s commercial life.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
            <Link
              href="/"
              className="group inline-flex items-center justify-center px-10 py-5 bg-white text-black font-medium text-lg hover:bg-gray-100 transition-all duration-200"
            >
              <span className="flex items-center gap-3">
                {t('cta.exploreMap')}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </Link>

            <Link
              href="/jewish-businesses"
              className="group inline-flex items-center justify-center px-10 py-5 bg-transparent border-2 border-white text-white font-medium text-lg hover:bg-white hover:text-black transition-all duration-200"
            >
              <span className="flex items-center gap-3">
                {t('cta.viewData')}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </span>
            </Link>
          </div>

          <div className="border-t border-gray-800 pt-12">
            <p className="text-gray-400 text-base leading-relaxed max-w-3xl mx-auto">
              This project is part of <strong className="text-white">StoryTimeMaps</strong> ongoing
              work to make historical data accessible. For academic use and citations, please
              reference <strong className="text-white">Dr. Kreutzmüller&apos;s</strong> original
              research.
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        .animation-delay-800 {
          animation-delay: 0.8s;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}

export default React.memo(Homepage)
