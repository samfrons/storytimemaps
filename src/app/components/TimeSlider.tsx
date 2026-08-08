// File: app/components/TimeSlider.tsx

'use client'

import React, { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { useDebounce } from '../../hooks/useDebounce'

interface TimeSliderProps {
  minDate: Date
  maxDate: Date
  currentDate: Date
  onChange: (date: Date) => void
  timelineChangePoints?: Date[]
}

const TimeSlider: React.FC<TimeSliderProps> = ({
  minDate,
  maxDate,
  currentDate,
  onChange,
  timelineChangePoints = [],
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const { t } = useTranslation()

  // Debounce for optimistic UI updates during scrubbing
  const debouncedDate = useDebounce(currentDate, 100)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(parseInt(e.target.value))
    onChange(newDate)
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  React.useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        const nextMonth = new Date(currentDate)
        nextMonth.setMonth(nextMonth.getMonth() + 1)

        if (nextMonth <= maxDate) {
          onChange(nextMonth)
        } else {
          setIsPlaying(false)
        }
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isPlaying, currentDate, maxDate, onChange])

  const percentage =
    ((currentDate.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100

  return (
    <div className="w-full">
      <div className="flex items-center justify-center mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            className="p-2 border transition-all shadow-sm hover:shadow-md"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
            }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--primary)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--primary)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </button>
          <span
            className={`text-xs font-mono font-bold px-3 py-1.5 border shadow-sm uppercase tracking-wide transition-all duration-200 ${
              isInteracting ? 'scale-105 shadow-lg' : 'scale-100'
            }`}
            style={{
              color: isInteracting ? 'var(--primary)' : 'var(--foreground)',
              backgroundColor: isInteracting ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--input-bg)',
              borderColor: isInteracting ? 'var(--primary)' : 'var(--border)',
            }}
          >
            {isInteracting && <span className="inline-block mr-1 animate-pulse">⚡</span>}
            {`${String(currentDate.getMonth() + 1).padStart(2, '0')}.${currentDate.getFullYear()}`}
          </span>
        </div>
      </div>

      <div className="relative flex items-center gap-4">
        <span className="text-xs font-mono font-semibold" style={{ color: 'var(--warning)' }}>
          1920
        </span>

        <div className="relative flex-1">
          <div className="absolute inset-0 flex items-center">
            <div
              className="w-full h-4 overflow-hidden"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                className="h-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%`, backgroundColor: 'var(--danger)' }}
              />
              {/* Timeline change indicators */}
              {timelineChangePoints.map((changePoint, index) => {
                const changePercentage =
                  ((changePoint.getTime() - minDate.getTime()) /
                    (maxDate.getTime() - minDate.getTime())) *
                  100
                return (
                  <div
                    key={index}
                    className="absolute top-0 bottom-0 w-1"
                    style={{
                      left: `${changePercentage}%`,
                      backgroundColor: 'var(--primary)',
                      opacity: 0.8,
                      transform: 'translateX(-50%)',
                    }}
                    title={t('timeline.changeIndicator', {
                      date: changePoint
                        .toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })
                        .replace('/', '.'),
                      ns: 'business',
                    })}
                  />
                )
              })}
            </div>
          </div>

          <input
            type="range"
            min={minDate.getTime()}
            max={maxDate.getTime()}
            value={currentDate.getTime()}
            onChange={handleChange}
            onMouseDown={() => setIsInteracting(true)}
            onMouseUp={() => setIsInteracting(false)}
            onTouchStart={() => setIsInteracting(true)}
            onTouchEnd={() => setIsInteracting(false)}
            className={`relative w-full h-4 bg-transparent appearance-none cursor-pointer z-10 transition-all duration-200
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:bg-[var(--foreground)]
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:duration-200
              [&::-webkit-slider-thumb]:hover:scale-125
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:bg-[var(--foreground)]
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-white
              [&::-moz-range-thumb]:shadow-md
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:transition-all
              [&::-moz-range-thumb]:duration-200
              [&::-moz-range-thumb]:hover:scale-125
              ${isInteracting ? 'scale-[1.02]' : 'scale-100'}`}
          />
        </div>

        <span className="text-xs font-mono font-semibold" style={{ color: 'var(--warning)' }}>
          1945
        </span>
      </div>

      <div className="flex justify-between mt-2">
        <div className="flex gap-3 text-xs font-mono">
          <span className="flex items-center gap-1">
            {/* Square, not rounded-full: the project forbids border-radius, and these swatches
                stand in for map pins - they should share the pins' shape as well as their colour.
                --success (not --primary) is the variable the active marker colour is keyed to. */}
            <span className="w-2 h-2" style={{ backgroundColor: 'var(--success)' }}></span>
            <span style={{ color: 'var(--foreground)' }}>{t('businessStates.active')}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2" style={{ backgroundColor: 'var(--warning)' }}></span>
            <span style={{ color: 'var(--foreground)' }}>{t('businessStates.declining')}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2" style={{ backgroundColor: 'var(--danger)' }}></span>
            <span style={{ color: 'var(--foreground)' }}>{t('businessStates.closed')}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default React.memo(TimeSlider, (prevProps, nextProps) => {
  return (
    prevProps.minDate.getTime() === nextProps.minDate.getTime() &&
    prevProps.maxDate.getTime() === nextProps.maxDate.getTime() &&
    prevProps.currentDate.getTime() === nextProps.currentDate.getTime() &&
    // onChange must be compared too. It was safe to omit while this component only ever
    // rendered next to its owner, but the floating scrubber in drawer mode is mounted from
    // page.tsx - without this a stale setCurrentDate closure would be silently retained and
    // the scrubber would stop moving the map.
    prevProps.onChange === nextProps.onChange
  )
})
