'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

interface ExhibitTimelineProps {
  minDate: Date
  maxDate: Date
  currentDate: Date
  onChange: (date: Date) => void
  isPlaying?: boolean
}

const historicalEvents = [
  { year: 1933, event: 'Nazi Party rises to power', type: 'critical' },
  { year: 1935, event: 'Nuremberg Laws enacted', type: 'critical' },
  { year: 1938, event: 'Kristallnacht', type: 'critical' },
  { year: 1941, event: 'Mass deportations begin', type: 'critical' },
]

// Shared height for the Play button, Speed buttons, and the date box so the
// control row reads as one balanced strip instead of the date box towering
// over everything else.
const CONTROL_HEIGHT = 48
const CONTROL_BORDER = '4px solid var(--exhibit-panel-border)'

const ExhibitTimeline: React.FC<ExhibitTimelineProps> = ({
  minDate,
  maxDate,
  currentDate,
  onChange,
  isPlaying = false,
}) => {
  const [autoPlay, setAutoPlay] = useState(false)
  const [speed, setSpeed] = useState(1)
  const currentDateRef = useRef(currentDate)

  // Keep ref in sync with prop
  useEffect(() => {
    currentDateRef.current = currentDate
  }, [currentDate])

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || !isPlaying) return

    const interval = setInterval(() => {
      // Use ref to get current date and avoid stale closure
      const current = currentDateRef.current
      const newDate = new Date(
        Math.min(
          current.getTime() + 30 * 24 * 60 * 60 * 1000 * speed, // Add days based on speed
          maxDate.getTime()
        )
      )

      // Loop back to start when reaching the end
      if (newDate >= maxDate) {
        onChange(minDate)
      } else {
        onChange(newDate)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [autoPlay, maxDate, minDate, onChange, speed, isPlaying])

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const timestamp = parseInt(e.target.value)
      onChange(new Date(timestamp))
      setAutoPlay(false) // Stop auto-play when manually adjusting
    },
    [onChange]
  )

  const handleYearClick = useCallback(
    (year: number) => {
      onChange(new Date(year, 0, 1))
      setAutoPlay(false)
    },
    [onChange]
  )

  const percentage =
    ((currentDate.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100
  const currentYear = currentDate.getFullYear()

  return (
    <div
      className="p-6"
      style={{
        backgroundColor: 'var(--exhibit-panel-bg)',
        border: '6px solid var(--exhibit-panel-border)',
      }}
    >
      {/* Control row: Play, Speed, and current date — one balanced strip */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          {/* Play/Pause button */}
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="flex items-center justify-center flex-shrink-0 transition-all duration-100"
            style={{
              width: `${CONTROL_HEIGHT}px`,
              height: `${CONTROL_HEIGHT}px`,
              backgroundColor: autoPlay ? '#00D9D9' : 'var(--exhibit-panel-bg)',
              border: CONTROL_BORDER,
              color: autoPlay ? '#000000' : 'var(--exhibit-panel-fg)',
              outline: 'none',
              boxShadow: 'none',
            }}
          >
            {autoPlay ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Speed controls */}
          <div className="flex items-center gap-2" style={{ height: `${CONTROL_HEIGHT}px` }}>
            <span
              className="text-sm font-black uppercase tracking-wider flex-shrink-0"
              style={{ color: 'var(--exhibit-panel-fg)' }}
            >
              SPEED
            </span>
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="flex items-center justify-center px-4 font-black text-sm uppercase transition-all duration-100 flex-shrink-0"
                style={{
                  height: `${CONTROL_HEIGHT}px`,
                  backgroundColor: speed === s ? '#FFD93D' : 'var(--exhibit-panel-bg)',
                  color: speed === s ? '#000000' : 'var(--exhibit-panel-fg)',
                  border: CONTROL_BORDER,
                  outline: 'none',
                  boxShadow: 'none',
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Current date display */}
        <div
          className="flex flex-col items-center justify-center flex-shrink-0 px-4"
          style={{
            height: `${CONTROL_HEIGHT}px`,
            backgroundColor: '#FF6B35',
            border: CONTROL_BORDER,
          }}
        >
          <div className="text-xl font-black leading-none" style={{ color: '#000000' }}>
            {currentYear}
          </div>
          <div
            className="text-[10px] font-black uppercase tracking-wider leading-none mt-1"
            style={{ color: '#000000' }}
          >
            {currentDate.toLocaleDateString('en-US', { month: 'long' })}
          </div>
        </div>
      </div>

      {/* Main timeline slider */}
      <div className="relative mb-4">
        {/* Timeline track */}
        <div className="relative h-12 flex items-center">
          <input
            type="range"
            min={minDate.getTime()}
            max={maxDate.getTime()}
            value={currentDate.getTime()}
            onChange={handleSliderChange}
            className="w-full h-2 appearance-none bg-transparent relative z-10 cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                #00D9D9 0%,
                #00D9D9 ${percentage * 0.4}%,
                #FFD93D ${percentage * 0.4}%,
                #FFD93D ${percentage * 0.7}%,
                #FF6B35 ${percentage * 0.7}%,
                #FF6B35 ${percentage}%,
                #C589E8 ${percentage}%,
                #C589E8 100%)`,
              border: '4px solid var(--exhibit-panel-border)',
              height: '12px',
            }}
          />

          {/* Progress indicator */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-12 h-12 pointer-events-none"
            style={{
              left: `${percentage}%`,
              backgroundColor: '#000000',
              border: '4px solid #FFFFFF',
              boxShadow: '0 0 20px #000000',
            }}
          >
            <div
              className="absolute inset-0 animate-ping opacity-50"
              style={{ backgroundColor: '#000000' }}
            />
          </div>
        </div>
      </div>

      {/* Historical events display - Prominent */}
      <div className="mt-4 pt-4" style={{ borderTop: '6px solid var(--exhibit-panel-border)' }}>
        <div
          className="text-xl font-black uppercase tracking-wider mb-4 text-center p-3"
          style={{
            backgroundColor: '#C589E8',
            border: '4px solid var(--exhibit-panel-border)',
            color: '#000000',
          }}
        >
          HISTORICAL EVENTS
        </div>
        <div className="grid grid-cols-4 gap-4">
          {historicalEvents.map((event) => {
            const isPast = currentYear >= event.year
            return (
              <button
                key={event.year}
                onClick={() => handleYearClick(event.year)}
                className="p-4 transition-all duration-200 text-center"
                style={{
                  backgroundColor: isPast ? '#FFD93D' : 'var(--exhibit-panel-bg)',
                  border: '6px solid var(--exhibit-panel-border)',
                  color: isPast ? '#000000' : 'var(--exhibit-panel-fg)',
                  outline: 'none',
                  boxShadow: 'none',
                }}
              >
                <div className="text-2xl font-black mb-2">{event.year}</div>
                <div className="text-sm font-black uppercase leading-tight">{event.event}</div>
              </button>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 40px;
          height: 40px;
          background: #000000;
          border: 4px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 0 10px #000000;
          transition: all 0.1s;
        }

        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px #000000;
        }

        input[type='range']::-moz-range-thumb {
          width: 40px;
          height: 40px;
          background: #000000;
          border: 4px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 0 10px #000000;
          transition: all 0.1s;
        }

        input[type='range']::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px #000000;
        }

        /* Remove focus outlines */
        button:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        input:focus {
          outline: none !important;
        }
      `}</style>
    </div>
  )
}

export default React.memo(ExhibitTimeline)
