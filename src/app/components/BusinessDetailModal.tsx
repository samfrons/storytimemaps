'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { StoryMap, TimelineData } from '../../types'
import StoryDetail from './StoryDetail'
import TimeSlider from './TimeSlider'
import { useTranslation } from '../../i18n/useTranslation'
import { loadTimelineData } from '../../utils/timelineLoader'
import { useAuth } from '../../contexts/AuthContext'
import ProposalForm from '../../components/proposals/ProposalForm'

// Mobile breakpoint constant
const MOBILE_BREAKPOINT = 768

interface BusinessDetailModalProps {
  story: StoryMap
  isOpen: boolean
  onClose: () => void
  originRect: DOMRect | null
  currentDate: Date
  minDate: Date
  maxDate: Date
  onDateChange: (date: Date) => void
  onNavigate?: (direction: 'prev' | 'next') => void
  hasPrevious?: boolean
  hasNext?: boolean
}

const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({
  story,
  isOpen,
  onClose,
  originRect,
  currentDate,
  minDate,
  maxDate,
  onDateChange,
  onNavigate,
  hasPrevious = false,
  hasNext = false,
}) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [timelineChangePoints, setTimelineChangePoints] = useState<Date[]>([])
  const [showProposalForm, setShowProposalForm] = useState(false)
  // Initialize mobile state based on SSR-safe check
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT
    }
    return false
  })
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [touchDeltaY, setTouchDeltaY] = useState(0)
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(true) // Start collapsed on mobile for faster perceived load
  const modalRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Cache viewport dimensions to avoid recalculation
  const viewportRef = useRef({ width: 0, height: 0 })

  // Detect mobile viewport with throttled resize
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT
      viewportRef.current = { width: window.innerWidth, height: window.innerHeight }
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile)
      }
    }

    const throttledResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(checkMobile, 100)
    }

    checkMobile() // Initial check
    window.addEventListener('resize', throttledResize)
    return () => {
      window.removeEventListener('resize', throttledResize)
      clearTimeout(resizeTimeout)
    }
  }, [isMobile])

  // Touch handlers for swipe-to-close on mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start tracking if at top of scroll
    if (contentRef.current && contentRef.current.scrollTop <= 0) {
      setTouchStartY(e.touches[0].clientY)
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY !== null) {
        const delta = e.touches[0].clientY - touchStartY
        // Only allow downward swipe
        if (delta > 0) {
          setTouchDeltaY(delta)
        }
      }
    },
    [touchStartY]
  )

  const handleTouchEnd = useCallback(() => {
    // Close if dragged down more than 100px
    if (touchDeltaY > 100) {
      onClose()
    }
    setTouchStartY(null)
    setTouchDeltaY(0)
  }, [touchDeltaY, onClose])

  // Load timeline change points when modal opens
  useEffect(() => {
    if (story.hasTimelineData && isOpen) {
      loadTimelineData(story.id).then((data: TimelineData | null) => {
        if (data && data.timeline) {
          const changePoints = data.timeline.flatMap((period) => {
            const points: Date[] = [new Date(period.startDate)]
            if (period.endDate) {
              points.push(new Date(period.endDate))
            }
            return points
          })
          // Remove duplicates and sort
          const uniquePoints = Array.from(new Set(changePoints.map((d) => d.getTime())))
            .map((time) => new Date(time))
            .sort((a, b) => a.getTime() - b.getTime())
          setTimelineChangePoints(uniquePoints)
        }
      })
    }
  }, [story.hasTimelineData, story.id, isOpen])

  useEffect(() => {
    if (isOpen && originRect) {
      setIsVisible(true)
      // Start expansion after a frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsExpanded(true)
          // Show content faster for better perceived performance
          setTimeout(() => setShowContent(true), 150)
        })
      })
    } else if (!isOpen) {
      setShowContent(false)
      setIsExpanded(false)
      setTimeout(() => setIsVisible(false), 500)
    }
  }, [isOpen, originRect])

  // Handle story changes with fade transition
  useEffect(() => {
    if (isTransitioning) {
      setShowContent(false)
      setTimeout(() => {
        setShowContent(true)
        setIsTransitioning(false)
      }, 300)
    }
  }, [story.id, isTransitioning])

  if (!isVisible || !originRect) return null

  // Calculate the transform origin and initial position
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Mobile: full screen, Desktop: wider modal (1100px max)
  const modalWidth = isMobile ? viewportWidth : Math.min(1100, viewportWidth * 0.92)
  const modalHeight = isMobile ? viewportHeight : viewportHeight * 0.95

  const initialScaleX = originRect.width / modalWidth
  const initialScaleY = originRect.height / modalHeight

  // Calculate swipe transform for mobile
  const swipeTransform = touchDeltaY > 0 ? `translateY(${touchDeltaY}px)` : ''
  const swipeOpacity = touchDeltaY > 0 ? Math.max(0.5, 1 - touchDeltaY / 200) : 1

  const handleNavigate = (direction: 'prev' | 'next') => {
    setIsTransitioning(true)
    onNavigate?.(direction)
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black backdrop-blur-md transition-all duration-500 ease-out ${
          isExpanded ? 'bg-opacity-70' : 'bg-opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Expanding Modal */}
      <div
        ref={modalRef}
        className={`fixed shadow-2xl transition-all duration-700 ease-out overflow-hidden ${
          isMobile ? 'modal-mobile-fullscreen' : ''
        }`}
        style={{
          backgroundColor: 'var(--background)',
          borderColor: isMobile ? 'transparent' : 'var(--border)',
          borderWidth: isMobile ? '0' : '1px',
          borderStyle: 'solid',
          width: `${modalWidth}px`,
          height: `${modalHeight}px`,
          left: isMobile ? '0' : '50%',
          top: isMobile ? '0' : '50%',
          transform: isMobile
            ? isExpanded
              ? swipeTransform || 'none'
              : `translateY(100%)`
            : isExpanded
              ? `translate(-50%, -50%) scale(1)`
              : `translate(-50%, -50%) translate(${originRect.left + originRect.width / 2 - viewportWidth / 2}px, ${originRect.top + originRect.height / 2 - viewportHeight / 2}px) scale(${initialScaleX}, ${initialScaleY})`,
          transformOrigin: 'center',
          transitionTimingFunction: isExpanded
            ? 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: swipeOpacity,
        }}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {/* Mobile swipe indicator */}
        {isMobile && (
          <div
            className={`flex justify-center pt-3 pb-1 transition-opacity duration-300 ${
              showContent && !isTransitioning ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundColor: 'var(--background)' }}
          >
            <div className="swipe-indicator" />
          </div>
        )}

        {/* Header */}
        <div
          className={`flex items-center justify-between border-b transition-opacity duration-300 ${
            showContent && !isTransitioning ? 'opacity-100' : 'opacity-0'
          } ${isMobile ? 'p-4 mobile-header-blur' : 'p-6'}`}
          style={{
            borderBottomColor: 'var(--border)',
            backgroundColor: isMobile ? 'rgba(var(--background-rgb), 0.95)' : 'var(--background)',
          }}
        >
          <div className="flex-1 min-w-0">
            <h2
              className={`font-mono font-bold mb-1 truncate ${isMobile ? 'text-lg' : 'text-xl'}`}
              style={{ color: 'var(--primary)' }}
            >
              {story.title}
            </h2>
            <div
              className={`flex items-center gap-2 font-mono flex-wrap ${isMobile ? 'text-xs' : 'text-xs gap-4'}`}
              style={{ color: 'var(--foreground-muted)' }}
            >
              <span style={{ color: 'var(--accent-orange)' }}>
                {story.startDate ? new Date(story.startDate).getFullYear() : 'Unknown'} -{' '}
                {story.endDate === 'Unknown'
                  ? 'Unknown'
                  : story.endDate
                    ? new Date(story.endDate).getFullYear()
                    : 'Unknown'}
              </span>
              {/* Timeline breadcrumb showing current viewing period */}
              {!isMobile && (
                <span
                  className="px-2 py-1 flex items-center gap-1"
                  style={{
                    backgroundColor: 'rgba(var(--primary-rgb), 0.15)',
                    borderColor: 'var(--primary)',
                    border: '1px solid',
                    color: 'var(--primary)',
                  }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Viewing:{' '}
                  {currentDate
                    .toLocaleDateString('en-GB', {
                      month: '2-digit',
                      year: 'numeric',
                    })
                    .replace('/', '.')}
                </span>
              )}
              {story.category && (
                <span
                  className="px-2 py-1 uppercase tracking-wide"
                  style={{
                    backgroundColor: 'rgba(var(--muted-rgb), 0.5)',
                    color: 'var(--accent-orange)',
                  }}
                >
                  {story.category}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className={`transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center ${
              isMobile ? 'w-11 h-11 touch-target-lg' : 'p-2'
            }`}
            style={{
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(var(--muted-rgb), 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg
              className={`transition-colors duration-200 ${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--foreground-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--foreground)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--foreground-muted)'
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Timeline Slider - Only show if business has timeline data */}
        {story.hasTimelineData && (
          <div
            className={`border-b transition-opacity duration-300 ${
              showContent && !isTransitioning ? 'opacity-100' : 'opacity-0'
            } ${isMobile ? 'px-4' : 'px-6 py-4'}`}
            style={{
              borderBottomColor: 'var(--border)',
              backgroundColor: 'var(--background)',
            }}
          >
            {/* Mobile: Collapsible timeline */}
            {isMobile ? (
              <div>
                <button
                  onClick={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
                  className="w-full py-3 flex items-center justify-between text-xs font-mono uppercase tracking-wide"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Timeline:{' '}
                    {currentDate
                      .toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })
                      .replace('/', '.')}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isTimelineCollapsed ? '' : 'rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {!isTimelineCollapsed && (
                  <div className="pb-3">
                    <TimeSlider
                      minDate={minDate}
                      maxDate={maxDate}
                      currentDate={currentDate}
                      onChange={onDateChange}
                      timelineChangePoints={timelineChangePoints}
                    />
                  </div>
                )}
              </div>
            ) : (
              <TimeSlider
                minDate={minDate}
                maxDate={maxDate}
                currentDate={currentDate}
                onChange={onDateChange}
                timelineChangePoints={timelineChangePoints}
              />
            )}
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className={`overflow-y-auto momentum-scroll transition-opacity duration-300 ${
            showContent && !isTransitioning ? 'opacity-100' : 'opacity-0'
          } ${isMobile ? 'p-4 pb-24' : 'p-6'}`}
          style={{
            height: isMobile
              ? `calc(100% - ${story.hasTimelineData ? (isTimelineCollapsed ? '120px' : '180px') : '80px'})`
              : story.hasTimelineData
                ? 'calc(100% - 220px)'
                : 'calc(100% - 88px)',
          }}
        >
          <StoryDetail story={story} currentDate={currentDate} isMobile={isMobile} />

          {/* Suggest Edit Button - Only show if user is logged in */}
          {user && (
            <div
              className={`border-t ${isMobile ? 'mt-4 pt-4' : 'mt-6 pt-6'}`}
              style={{ borderTopColor: 'var(--border)' }}
            >
              <button
                onClick={() => setShowProposalForm(true)}
                className={`w-full font-mono font-semibold border transition-all duration-200 uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                  isMobile ? 'text-sm py-4 px-4' : 'text-xs py-3 px-4'
                }`}
                style={{
                  backgroundColor: 'var(--primary)',
                  borderColor: 'var(--primary)',
                  color: 'var(--background)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                <svg
                  className={isMobile ? 'w-5 h-5' : 'w-4 h-4'}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Suggest Edit to this Location
              </button>
            </div>
          )}

          {/* Desktop Navigation Buttons - inline */}
          {!isMobile && (
            <div className="mt-6 pt-6 border-t" style={{ borderTopColor: 'var(--border)' }}>
              <div className="flex gap-3">
                <button
                  onClick={() => handleNavigate('prev')}
                  disabled={!hasPrevious || isTransitioning}
                  className="flex-1 font-mono text-xs font-semibold py-3 px-4 border transition-all duration-200 uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor:
                      hasPrevious && !isTransitioning
                        ? 'var(--background)'
                        : 'rgba(var(--background-rgb), 0.5)',
                    borderColor:
                      hasPrevious && !isTransitioning
                        ? 'var(--border)'
                        : 'rgba(var(--muted-rgb), 0.3)',
                    color:
                      hasPrevious && !isTransitioning
                        ? 'var(--foreground)'
                        : 'rgba(var(--foreground-muted), 0.5)',
                    cursor: hasPrevious && !isTransitioning ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={(e) => {
                    if (hasPrevious && !isTransitioning) {
                      e.currentTarget.style.backgroundColor = 'rgba(var(--muted-rgb), 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasPrevious && !isTransitioning) {
                      e.currentTarget.style.backgroundColor = 'var(--background)'
                    }
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  {t('mainPage.storyDetails.previous')}
                </button>

                <button
                  onClick={() => handleNavigate('next')}
                  disabled={!hasNext || isTransitioning}
                  className="flex-1 font-mono text-xs font-semibold py-3 px-4 border transition-all duration-200 uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor:
                      hasNext && !isTransitioning
                        ? 'var(--background)'
                        : 'rgba(var(--background-rgb), 0.5)',
                    borderColor:
                      hasNext && !isTransitioning ? 'var(--border)' : 'rgba(var(--muted-rgb), 0.3)',
                    color:
                      hasNext && !isTransitioning
                        ? 'var(--foreground)'
                        : 'rgba(var(--foreground-muted), 0.5)',
                    cursor: hasNext && !isTransitioning ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={(e) => {
                    if (hasNext && !isTransitioning) {
                      e.currentTarget.style.backgroundColor = 'rgba(var(--muted-rgb), 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasNext && !isTransitioning) {
                      e.currentTarget.style.backgroundColor = 'var(--background)'
                    }
                  }}
                >
                  {t('mainPage.storyDetails.next')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        {isMobile && (
          <div
            className="mobile-bottom-nav safe-area-bottom"
            style={{
              backgroundColor: 'var(--background)',
              borderTopColor: 'var(--border)',
            }}
          >
            <div className="flex gap-3">
              <button
                onClick={() => handleNavigate('prev')}
                disabled={!hasPrevious || isTransitioning}
                className="flex-1 font-mono text-sm font-semibold py-4 px-4 border transition-all duration-200 uppercase tracking-wide flex items-center justify-center gap-2 touch-target-xl active:scale-[0.98]"
                style={{
                  backgroundColor:
                    hasPrevious && !isTransitioning
                      ? 'var(--background)'
                      : 'rgba(var(--background-rgb), 0.5)',
                  borderColor:
                    hasPrevious && !isTransitioning
                      ? 'var(--border)'
                      : 'rgba(var(--muted-rgb), 0.3)',
                  color:
                    hasPrevious && !isTransitioning
                      ? 'var(--foreground)'
                      : 'rgba(var(--foreground-muted), 0.5)',
                  cursor: hasPrevious && !isTransitioning ? 'pointer' : 'not-allowed',
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {t('mainPage.storyDetails.previous')}
              </button>

              <button
                onClick={() => handleNavigate('next')}
                disabled={!hasNext || isTransitioning}
                className="flex-1 font-mono text-sm font-semibold py-4 px-4 border transition-all duration-200 uppercase tracking-wide flex items-center justify-center gap-2 touch-target-xl active:scale-[0.98]"
                style={{
                  backgroundColor:
                    hasNext && !isTransitioning
                      ? 'var(--primary)'
                      : 'rgba(var(--background-rgb), 0.5)',
                  borderColor:
                    hasNext && !isTransitioning ? 'var(--primary)' : 'rgba(var(--muted-rgb), 0.3)',
                  color:
                    hasNext && !isTransitioning
                      ? 'var(--background)'
                      : 'rgba(var(--foreground-muted), 0.5)',
                  cursor: hasNext && !isTransitioning ? 'pointer' : 'not-allowed',
                }}
              >
                {t('mainPage.storyDetails.next')}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Proposal Form Modal */}
      <ProposalForm
        isOpen={showProposalForm}
        onClose={() => setShowProposalForm(false)}
        existingBusiness={story}
        proposalType="edit_location"
      />
    </div>
  )
}

export default BusinessDetailModal
