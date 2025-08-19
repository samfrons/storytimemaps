'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface ExhibitTimelineProps {
  minDate: Date;
  maxDate: Date;
  currentDate: Date;
  onChange: (date: Date) => void;
  isPlaying?: boolean;
}

const historicalEvents = [
  { year: 1933, event: 'Nazi Party rises to power', type: 'critical' },
  { year: 1935, event: 'Nuremberg Laws enacted', type: 'critical' },
  { year: 1938, event: 'Kristallnacht', type: 'critical' },
  { year: 1941, event: 'Mass deportations begin', type: 'critical' },
];

const ExhibitTimeline: React.FC<ExhibitTimelineProps> = ({ 
  minDate, 
  maxDate, 
  currentDate, 
  onChange,
  isPlaying = false 
}) => {
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || !isPlaying) return;

    const interval = setInterval(() => {
      onChange(new Date(
        Math.min(
          currentDate.getTime() + (30 * 24 * 60 * 60 * 1000 * speed), // Add days based on speed
          maxDate.getTime()
        )
      ));
      
      // Loop back to start when reaching the end
      if (currentDate >= maxDate) {
        onChange(minDate);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [autoPlay, currentDate, maxDate, minDate, onChange, speed, isPlaying]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const timestamp = parseInt(e.target.value);
    onChange(new Date(timestamp));
    setAutoPlay(false); // Stop auto-play when manually adjusting
  }, [onChange]);

  const handleYearClick = useCallback((year: number) => {
    onChange(new Date(year, 0, 1));
    setAutoPlay(false);
  }, [onChange]);

  const percentage = ((currentDate.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;
  const currentYear = currentDate.getFullYear();

  // Determine era color based on year
  const getEraColor = (year: number) => {
    if (year < 1933) return '#00d9bf';
    if (year < 1938) return '#ffb700';
    return '#ff8c00';
  };

  return (
    <div className="p-6" style={{ 
      backgroundColor: '#FFFFFF',
      border: '6px solid #000000'
    }}>
      
      {/* Timeline header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Play/Pause button */}
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="flex items-center justify-center transition-all duration-100"
            style={{ 
              minWidth: '60px', 
              minHeight: '60px',
              backgroundColor: autoPlay ? '#00D9D9' : '#FFFFFF',
              border: '6px solid #000000',
              color: '#000000',
              outline: 'none',
              boxShadow: 'none'
            }}
          >
            {autoPlay ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Speed controls */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-black uppercase tracking-wider" style={{ color: '#000000' }}>SPEED</span>
            {[0.5, 1, 2].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="px-4 py-3 font-black text-lg uppercase transition-all duration-100"
                style={{ 
                  backgroundColor: speed === s ? '#FFD93D' : '#FFFFFF',
                  color: '#000000',
                  border: '6px solid #000000',
                  minWidth: '60px',
                  outline: 'none',
                  boxShadow: 'none'
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Current date display */}
        <div className="text-center p-4" style={{ backgroundColor: '#FF6B35', border: '6px solid #000000' }}>
          <div className="text-5xl font-black" style={{ color: '#000000' }}>
            {currentYear}
          </div>
          <div className="text-lg font-black uppercase tracking-wider" style={{ color: '#000000' }}>
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
              border: '4px solid #000000',
              height: '12px'
            }}
          />

          {/* Progress indicator */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-12 h-12 pointer-events-none"
            style={{ 
              left: `${percentage}%`,
              backgroundColor: '#000000',
              border: '4px solid #FFFFFF',
              boxShadow: '0 0 20px #000000'
            }}
          >
            <div className="absolute inset-0 animate-ping opacity-50" style={{ backgroundColor: '#000000' }} />
          </div>
        </div>

        {/* Year markers */}
        <div className="absolute top-full mt-2 w-full flex justify-between px-2">
          {[1920, 1925, 1930, 1933, 1935, 1938, 1941, 1945].map(year => {
            const yearPercentage = ((new Date(year, 0, 1).getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;
            const event = historicalEvents.find(e => e.year === year);
            
            return (
              <button
                key={year}
                onClick={() => handleYearClick(year)}
                onMouseEnter={() => setHoveredYear(year)}
                onMouseLeave={() => setHoveredYear(null)}
                className="relative flex flex-col items-center group"
                style={{ 
                  position: 'absolute', 
                  left: `${yearPercentage}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {/* Year label */}
                <span className={`text-lg font-black uppercase transition-all duration-300`}
                      style={{ 
                        color: currentYear === year ? '#FF6B35' : (hoveredYear === year ? '#FFD93D' : '#000000'),
                        fontSize: currentYear === year ? '20px' : '16px'
                      }}>
                  {year}
                </span>
                
                {/* Event marker */}
                {event && (
                  <div className="absolute -top-12 px-4 py-3 text-sm font-black uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                       style={{ 
                         backgroundColor: '#FFD93D',
                         color: '#000000',
                         border: '4px solid #000000'
                       }}>
                    {event.event}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Historical events display - Prominent */}
      <div className="mt-6 pt-6" style={{ borderTop: '6px solid #000000' }}>
        <div className="text-xl font-black uppercase tracking-wider mb-4 text-center p-3" style={{ backgroundColor: '#C589E8', border: '4px solid #000000', color: '#000000' }}>
          HISTORICAL EVENTS
        </div>
        <div className="grid grid-cols-4 gap-4">
          {historicalEvents.map(event => {
            const isPast = currentYear >= event.year;
            return (
              <button
                key={event.year}
                onClick={() => handleYearClick(event.year)}
                className="p-4 transition-all duration-200 text-center"
                style={{ 
                  backgroundColor: isPast ? '#FFD93D' : '#FFFFFF',
                  border: '6px solid #000000',
                  color: '#000000',
                  outline: 'none',
                  boxShadow: 'none'
                }}
              >
                <div className="text-2xl font-black mb-2" style={{ 
                  color: '#000000'
                }}>
                  {event.year}
                </div>
                <div className="text-sm font-black uppercase leading-tight">
                  {event.event}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 40px;
          height: 40px;
          background: #000000;
          border: 4px solid #FFFFFF;
          cursor: pointer;
          box-shadow: 0 0 10px #000000;
          transition: all 0.1s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px #000000;
        }

        input[type="range"]::-moz-range-thumb {
          width: 40px;
          height: 40px;
          background: #000000;
          border: 4px solid #FFFFFF;
          cursor: pointer;
          box-shadow: 0 0 10px #000000;
          transition: all 0.1s;
        }

        input[type="range"]::-moz-range-thumb:hover {
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
  );
};

export default React.memo(ExhibitTimeline);