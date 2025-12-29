// file: src/app/components/StoryDetail.tsx

import React from 'react'
import Image from 'next/image'
import { StoryMap, TimelineData, TimelineContent, MediaItem } from '../../types'
import { getZipcodeFromAddress } from '../../utils/berlinZipcodes'
import { useTranslation } from '../../i18n/useTranslation'
import {
  loadTimelineData,
  getTimelineContentForDate,
  getTimelineMediaForDate,
  subscribeToLoadingState,
} from '../../utils/timelineLoader'
import { useDebounce } from '../../hooks/useDebounce'

interface StoryDetailProps {
  story: StoryMap
  currentDate: Date
  isMobile?: boolean
}

const StoryDetail: React.FC<StoryDetailProps> = ({ story, currentDate, isMobile = false }) => {
  const { t } = useTranslation()
  const [selectedMediaIndex, setSelectedMediaIndex] = React.useState(0)
  const [showFullDescription, setShowFullDescription] = React.useState(false)
  const [timelineData, setTimelineData] = React.useState<TimelineData | null>(null)
  const [timelineLoading, setTimelineLoading] = React.useState(false)
  const [timelineError, setTimelineError] = React.useState(false)
  const [isTransitioning, setIsTransitioning] = React.useState(false)
  const [contentStage, setContentStage] = React.useState<
    'media' | 'description' | 'details' | 'complete'
  >('complete')
  const [previousTimelineContent, setPreviousTimelineContent] =
    React.useState<TimelineContent | null>(null)
  const [isLoadingDetailed, setIsLoadingDetailed] = React.useState(false)
  const [imageSwipeStart, setImageSwipeStart] = React.useState<number | null>(null)

  // Debounce rapid timeline changes to prevent flicker
  // Use shorter debounce for better responsiveness during auto-play
  const debouncedCurrentDate = useDebounce(currentDate, 50)

  // Subscribe to fine-grained loading state for this business
  React.useEffect(() => {
    if (!story.hasTimelineData) return

    const unsubscribe = subscribeToLoadingState(story.id, (loading) => {
      setIsLoadingDetailed(loading)
    })

    return unsubscribe
  }, [story.id, story.hasTimelineData])

  // Load timeline data when component mounts and story has timeline data
  React.useEffect(() => {
    if (!story.hasTimelineData) return

    setTimelineLoading(true)
    setTimelineError(false)

    loadTimelineData(story.id)
      .then((data) => {
        setTimelineData(data)
        setTimelineError(data === null)
      })
      .catch(() => {
        setTimelineError(true)
        setTimelineData(null)
      })
      .finally(() => {
        setTimelineLoading(false)
      })
  }, [story.id, story.hasTimelineData])

  // Get timeline content for debounced date to prevent flicker
  const timelineContent = React.useMemo(() => {
    if (!timelineData || !story.hasTimelineData) return null
    return getTimelineContentForDate(timelineData, debouncedCurrentDate)
  }, [timelineData, debouncedCurrentDate, story.hasTimelineData])

  // Get timeline content for immediate feedback (non-debounced for quick preview)
  const immediateTimelineContent = React.useMemo(() => {
    if (!timelineData || !story.hasTimelineData) return null
    return getTimelineContentForDate(timelineData, currentDate)
  }, [timelineData, currentDate, story.hasTimelineData])

  // Get timeline-aware media for debounced date
  const timelineMedia = React.useMemo(() => {
    if (!timelineData || !story.hasTimelineData) return []
    return getTimelineMediaForDate(timelineData, debouncedCurrentDate)
  }, [timelineData, debouncedCurrentDate, story.hasTimelineData])

  // Handle staggered content transitions when timeline content changes
  React.useEffect(() => {
    if (story.hasTimelineData && timelineContent && timelineContent !== previousTimelineContent) {
      setIsTransitioning(true)
      setPreviousTimelineContent(timelineContent)

      // Narrative-driven staggered animation sequence: media → description → details
      // Each stage represents a deeper dive into the historical context
      setContentStage('media')

      const mediaTimer = setTimeout(() => {
        setContentStage('description')
      }, 120) // Slightly longer to let media settle

      const descriptionTimer = setTimeout(() => {
        setContentStage('details')
      }, 240) // Consistent timing progression

      const completeTimer = setTimeout(() => {
        setContentStage('complete')
        setIsTransitioning(false)
      }, 400) // Total transition time: 400ms for smooth narrative flow

      return () => {
        clearTimeout(mediaTimer)
        clearTimeout(descriptionTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [timelineContent, previousTimelineContent, story.hasTimelineData])

  // Reset media selection when timeline content changes
  React.useEffect(() => {
    setSelectedMediaIndex(0)
  }, [timelineContent])

  // Determine content based on timeline data availability
  const currentContent = React.useMemo(() => {
    if (story.hasTimelineData && timelineContent && !timelineError) {
      // Use timeline content with translation keys
      const { descriptionKey, longDescriptionKey } = timelineContent

      // Try to translate if keys exist, otherwise use fallback
      const translatedDescription = descriptionKey
        ? t(descriptionKey, { ns: 'business', defaultValue: timelineContent.description })
        : timelineContent.description
      const translatedLongDescription = longDescriptionKey
        ? t(longDescriptionKey, { ns: 'business', defaultValue: timelineContent.longDescription })
        : timelineContent.longDescription

      return {
        description: translatedDescription || story.description,
        longDescription: translatedLongDescription || story.longDescription,
        hasTimelineContent: true,
      }
    }

    // Use static content as fallback
    return {
      description: story.description,
      longDescription: story.longDescription,
      hasTimelineContent: false,
    }
  }, [story, timelineContent, timelineError, t])

  // Combine legacy imageUrls with new media array, prioritizing timeline media
  const allMedia = React.useMemo(() => {
    const mediaItems: MediaItem[] = []

    // Add timeline media first (highest priority) if available and not in error state
    if (story.hasTimelineData && timelineMedia.length > 0 && !timelineError) {
      // Convert TimelineMediaItem to MediaItem with translated captions
      mediaItems.push(
        ...timelineMedia.map((item) => {
          const { captionKey } = item
          const translatedCaption = captionKey
            ? t(captionKey, { ns: 'business', defaultValue: item.caption })
            : item.caption

          return {
            url: item.url,
            type: item.type || ('image' as const),
            caption: translatedCaption,
          }
        })
      )
    } else {
      // Add new media array items (higher priority than legacy)
      if (story.media && story.media.length > 0) {
        mediaItems.push(...story.media)
      }

      // Add legacy imageUrls as image media items
      if (story.imageUrls && story.imageUrls.length > 0) {
        story.imageUrls.forEach((url, index) => {
          mediaItems.push({
            url,
            type: 'image' as const,
            caption: `Image ${index + 1}`,
          })
        })
      }
    }

    return mediaItems
  }, [story.media, story.imageUrls, story.hasTimelineData, timelineMedia, timelineError, t])

  const currentMedia = allMedia[selectedMediaIndex]

  // Touch handlers for image gallery swiping on mobile
  const handleImageTouchStart = React.useCallback(
    (e: React.TouchEvent) => {
      if (isMobile && allMedia.length > 1) {
        setImageSwipeStart(e.touches[0].clientX)
      }
    },
    [isMobile, allMedia.length]
  )

  const handleImageTouchEnd = React.useCallback(
    (e: React.TouchEvent) => {
      if (imageSwipeStart !== null && allMedia.length > 1) {
        const delta = e.changedTouches[0].clientX - imageSwipeStart
        // Swipe left to go to next image
        if (delta < -50 && selectedMediaIndex < allMedia.length - 1) {
          setSelectedMediaIndex((prev) => prev + 1)
        }
        // Swipe right to go to previous image
        else if (delta > 50 && selectedMediaIndex > 0) {
          setSelectedMediaIndex((prev) => prev - 1)
        }
        setImageSwipeStart(null)
      }
    },
    [imageSwipeStart, allMedia.length, selectedMediaIndex]
  )

  return (
    <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
      {allMedia.length > 0 && (
        <div className={isMobile ? 'space-y-3' : 'space-y-2'}>
          <div
            className={`relative w-full transition-all duration-400 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
              isTransitioning && contentStage === 'media'
                ? 'transform scale-[0.97]'
                : 'opacity-100 transform scale-100 brightness-100'
            } ${isMobile ? 'min-h-[14rem] max-h-[28rem] mobile-full-bleed' : 'min-h-[12rem] max-h-[32rem]'}`}
            style={{
              backgroundColor: 'var(--background)',
              // Subtle vignette effect during transition to focus attention
              background:
                isTransitioning && contentStage === 'media'
                  ? `radial-gradient(ellipse at center, transparent 20%, rgba(var(--background-rgb), 0.3) 100%), var(--background)`
                  : 'var(--background)',
            }}
            onTouchStart={handleImageTouchStart}
            onTouchEnd={handleImageTouchEnd}
          >
            {currentMedia?.type === 'video' ? (
              <video
                src={currentMedia.url}
                controls
                className={`w-full h-auto object-contain ${isMobile ? 'max-h-[28rem]' : 'max-h-[32rem]'}`}
                poster={currentMedia.url.replace(/\.(mp4|webm)$/, '.jpg')}
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <Image
                src={currentMedia?.url || ''}
                alt={currentMedia?.caption || `${story.title} - Media ${selectedMediaIndex + 1}`}
                width={1100}
                height={600}
                className={`w-full h-auto object-contain ${isMobile ? 'max-h-[28rem]' : 'max-h-[32rem]'}`}
                priority={selectedMediaIndex === 0}
                loading={selectedMediaIndex === 0 ? 'eager' : 'lazy'}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
            )}

            {/* Mobile swipe indicator for image gallery */}
            {isMobile && allMedia.length > 1 && (
              <div
                className="absolute bottom-12 left-0 right-0 flex justify-center gap-1.5 py-2"
                style={{ backgroundColor: 'transparent' }}
              >
                {allMedia.map((_, idx) => (
                  <div
                    key={idx}
                    className="w-2 h-2 transition-all duration-200"
                    style={{
                      backgroundColor:
                        idx === selectedMediaIndex
                          ? 'var(--primary)'
                          : 'rgba(var(--muted-rgb), 0.6)',
                    }}
                  />
                ))}
              </div>
            )}

            {currentMedia?.caption && (
              <div
                className="absolute bottom-0 left-0 right-0 p-2"
                style={{
                  backgroundColor: 'rgba(var(--background-rgb), 0.8)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <p className="text-xs font-mono" style={{ color: 'var(--foreground)' }}>
                  {currentMedia.caption}
                </p>
              </div>
            )}
          </div>

          {allMedia.length > 1 && !isMobile && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allMedia.map((mediaItem, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMediaIndex(index)}
                  className={`relative flex-shrink-0 overflow-hidden border-2 transition-all ${
                    isMobile ? 'w-20 h-20 touch-target-xl' : 'w-20 h-20'
                  }`}
                  style={{
                    borderColor: selectedMediaIndex === index ? 'var(--primary)' : 'transparent',
                    opacity: selectedMediaIndex === index ? 1 : 0.7,
                    boxShadow:
                      selectedMediaIndex === index
                        ? '0 0 0 2px rgba(var(--primary-rgb), 0.5)'
                        : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedMediaIndex !== index) {
                      e.currentTarget.style.opacity = '1'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedMediaIndex !== index) {
                      e.currentTarget.style.opacity = '0.7'
                    }
                  }}
                >
                  {mediaItem.type === 'video' ? (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--muted)' }}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: 'var(--foreground)' }}
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  ) : (
                    <Image
                      src={mediaItem.url}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        className={`grid grid-cols-1 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isTransitioning &&
          (contentStage === 'details' || contentStage === 'description' || contentStage === 'media')
            ? 'transform translateY(6px) scale-[0.99]'
            : 'opacity-100 transform translateY(0) scale-100'
        } ${isMobile ? 'gap-3' : 'gap-4'}`}
      >
        <div className={`flex items-start ${isMobile ? 'gap-4' : 'gap-3'}`}>
          <svg
            className={`flex-shrink-0 ${isMobile ? 'w-5 h-5 mt-0.5' : 'w-4 h-4 mt-0.5'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <div className="flex-1">
            <p
              className={`font-mono font-semibold ${isMobile ? 'text-sm' : 'text-xs'}`}
              style={{ color: 'var(--foreground)' }}
            >
              {(() => {
                if (!story.address) return ''
                const zipcode = getZipcodeFromAddress(story.address, story.lat, story.lng)
                const streetPart = story.address.replace(', Berlin', '').replace(', Germany', '')
                return `${streetPart}, ${zipcode} Berlin`
              })()}
            </p>
            <p
              className={`font-mono mt-0.5 ${isMobile ? 'text-sm' : 'text-xs'}`}
              style={{ color: 'var(--foreground-muted)' }}
            >
              {story.lat.toFixed(6)}, {story.lng.toFixed(6)}
            </p>
          </div>
        </div>

        {story.category && (
          <div className={`flex items-start ${isMobile ? 'gap-4' : 'gap-3'}`}>
            <svg
              className={`flex-shrink-0 ${isMobile ? 'w-5 h-5 mt-0.5' : 'w-4 h-4 mt-0.5'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--foreground-muted)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <div className="flex-1">
              <p
                className={`font-mono font-semibold uppercase ${isMobile ? 'text-sm' : 'text-xs'}`}
                style={{ color: 'var(--foreground)' }}
              >
                {story.category}
              </p>
              <p
                className={`font-mono mt-0.5 ${isMobile ? 'text-sm' : 'text-xs'}`}
                style={{ color: 'var(--foreground-muted)' }}
              >
                Category
              </p>
            </div>
          </div>
        )}

        <div className={`flex items-start ${isMobile ? 'gap-4' : 'gap-3'}`}>
          <svg
            className={`flex-shrink-0 ${isMobile ? 'w-5 h-5 mt-0.5' : 'w-4 h-4 mt-0.5'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p
              className={`font-mono font-semibold ${isMobile ? 'text-sm' : 'text-xs'}`}
              style={{ color: 'var(--foreground)' }}
            >
              {story.startDate ? new Date(story.startDate).getFullYear() : 'Unknown'} -{' '}
              {story.endDate === 'Unknown'
                ? 'Unknown'
                : story.endDate
                  ? new Date(story.endDate).getFullYear()
                  : 'Unknown'}
            </p>
            <p
              className={`font-mono mt-0.5 ${isMobile ? 'text-sm' : 'text-xs'}`}
              style={{ color: 'var(--foreground-muted)' }}
            >
              {t('mainPage.storyDetails.activePeriod')}
            </p>
          </div>
        </div>
      </div>

      {(currentContent.description || currentContent.longDescription) && (
        <div
          className={`border-t transition-all duration-300 ease-out ${
            isTransitioning && contentStage !== 'complete'
              ? 'opacity-60 transform translateY(8px)'
              : 'opacity-100 transform translateY(0)'
          } ${isMobile ? 'pt-3' : 'pt-4'}`}
          style={{ borderTopColor: 'var(--border)' }}
        >
          <h5
            className={`font-mono font-bold uppercase tracking-wider ${isMobile ? 'text-sm mb-2' : 'text-xs mb-3'}`}
            style={{ color: 'var(--foreground-muted)' }}
          >
            {currentContent.hasTimelineContent ? 'Timeline Context' : 'Historical Context'}
            {(timelineLoading || isLoadingDetailed) && (
              <span
                className="ml-2 text-xs normal-case flex items-center gap-1"
                style={{ color: 'var(--primary)' }}
              >
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading timeline data...
              </span>
            )}
            {/* Show period indicator for immediate feedback with smooth transition */}
            {story.hasTimelineData &&
              immediateTimelineContent &&
              !timelineLoading &&
              !isLoadingDetailed && (
                <span
                  className={`ml-2 text-xs normal-case transition-all duration-300 ${
                    isTransitioning && contentStage !== 'complete'
                      ? 'transform scale-95'
                      : 'opacity-100 transform scale-100'
                  }`}
                  style={{ color: 'var(--accent-orange)' }}
                >
                  •{' '}
                  {new Date(immediateTimelineContent.startDate)
                    .toLocaleDateString('en-GB', {
                      month: '2-digit',
                      year: 'numeric',
                    })
                    .replace('/', '.')}
                  {immediateTimelineContent.endDate &&
                    ' - ' +
                      new Date(immediateTimelineContent.endDate)
                        .toLocaleDateString('en-GB', {
                          month: '2-digit',
                          year: 'numeric',
                        })
                        .replace('/', '.')}
                </span>
              )}
            {/* Optimistic loading state for timeline transitions */}
            {story.hasTimelineData &&
              !immediateTimelineContent &&
              !timelineLoading &&
              !isLoadingDetailed && (
                <span
                  className="ml-2 text-xs normal-case opacity-60"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  • No data for{' '}
                  {currentDate
                    .toLocaleDateString('en-GB', {
                      month: '2-digit',
                      year: 'numeric',
                    })
                    .replace('/', '.')}
                </span>
              )}
          </h5>

          <div
            className={`transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
              isTransitioning && (contentStage === 'description' || contentStage === 'media')
                ? 'transform translateY(12px) scale-[0.98]'
                : 'opacity-100 transform translateY(0) scale-100'
            }`}
            style={{
              // No filter effects during transitions
              filter: 'none',
            }}
          >
            {currentContent.description && (
              <p
                className={`font-mono leading-relaxed ${isMobile ? 'text-sm mb-2' : 'text-xs mb-3'}`}
                style={{ color: 'var(--foreground)' }}
              >
                {currentContent.description}
              </p>
            )}

            {currentContent.longDescription && (
              <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
                <div
                  className={`font-mono leading-relaxed ${isMobile ? 'text-sm' : 'text-xs'} ${!showFullDescription ? 'line-clamp-4' : ''}`}
                  style={{ color: 'var(--foreground)' }}
                >
                  {currentContent.longDescription}
                </div>

                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className={`font-mono font-semibold transition-colors cursor-pointer ${isMobile ? 'text-sm py-2' : 'text-xs'}`}
                  style={{ color: 'var(--primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent-yellow)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--primary)'
                  }}
                >
                  {showFullDescription ? 'Read less' : 'Read more'} →
                </button>
              </div>
            )}

            {/* Error state indicator */}
            {story.hasTimelineData && timelineError && (
              <div
                className="p-2 mt-2 border text-xs font-mono"
                style={{
                  backgroundColor: 'rgba(var(--danger), 0.1)',
                  borderColor: 'var(--danger)',
                  color: 'var(--danger)',
                }}
              >
                Timeline data unavailable. Showing static content.
              </div>
            )}
          </div>
        </div>
      )}

      {story.businessType && (
        <div
          className={`pt-4 border-t transition-all duration-300 ease-out ${
            isTransitioning && contentStage !== 'complete'
              ? 'opacity-60 transform translateY(8px)'
              : 'opacity-100 transform translateY(0)'
          }`}
          style={{ borderTopColor: 'var(--border)' }}
        >
          <h5
            className="font-mono text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('mainPage.storyDetails.businessType')}
          </h5>
          <p className="font-mono text-xs capitalize" style={{ color: 'var(--foreground)' }}>
            {story.businessType}
          </p>
        </div>
      )}

      <div className={`flex gap-3 ${isMobile ? 'pt-3' : 'pt-4'}`}>
        <button
          className={`flex-1 font-mono font-semibold border transition-all shadow-sm hover:shadow uppercase tracking-wide ${
            isMobile ? 'text-sm py-3.5 px-4 touch-target-xl' : 'text-xs py-2.5 px-4'
          }`}
          style={{
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            borderColor: 'var(--border)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--muted)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--background)'
          }}
        >
          View Sources
        </button>
        <button
          className={`flex-1 font-mono font-semibold border transition-all shadow-sm hover:shadow uppercase tracking-wide ${
            isMobile ? 'text-sm py-3.5 px-4 touch-target-xl' : 'text-xs py-2.5 px-4'
          }`}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--background)',
            borderColor: 'var(--primary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-yellow)'
            e.currentTarget.style.borderColor = 'var(--accent-yellow)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary)'
            e.currentTarget.style.borderColor = 'var(--primary)'
          }}
        >
          Share Story
        </button>
      </div>
    </div>
  )
}

export default React.memo(StoryDetail)
