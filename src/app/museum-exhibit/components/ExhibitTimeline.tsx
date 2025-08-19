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
    if (year < 1933) return '#00ff00';
    if (year < 1938) return '#ffcc00';
    return '#ff3300';
  };

  return (
    <div className="p-6" style={{ borderTop: '3px solid #ff3300' }}>
      
      {/* Timeline header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          {/* Play/Pause button */}
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="flex items-center justify-center transition-all duration-100"
            style={{ 
              minWidth: '60px', 
              minHeight: '60px',
              backgroundColor: autoPlay ? '#ff6600' : 'transparent',
              border: '3px solid #ff6600',
              color: autoPlay ? '#000' : '#ff6600'
            }}
          >
            {autoPlay ? (
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Speed controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-black uppercase tracking-wider" style={{ color: '#ffcc00' }}>SPEED</span>
            {[0.5, 1, 2].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="px-4 py-3 font-black text-sm uppercase transition-all duration-100"
                style={{ 
                  backgroundColor: speed === s ? '#ffcc00' : 'transparent',
                  color: speed === s ? '#000' : '#fff',
                  border: `3px solid ${speed === s ? '#ffcc00' : '#fff'}`,
                  minWidth: '60px'
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Current date display */}
        <div className="text-center">
          <div className="text-6xl font-black" style={{ color: '#ff3300' }}>
            {currentYear}
          </div>
          <div className="text-sm font-black uppercase tracking-wider" style={{ color: '#ffcc00' }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long' })}
          </div>
        </div>
      </div>

      {/* Main timeline slider */}
      <div className="relative mb-8">
        {/* Background gradient showing eras */}
        <div className="absolute inset-0 h-20 overflow-hidden opacity-30">
          <div className="h-full transition-all duration-1000" style={{ backgroundColor: getEraColor(currentYear) }} />
        </div>

        {/* Timeline track */}
        <div className="relative h-20 flex items-center">
          <input
            type="range"
            min={minDate.getTime()}
            max={maxDate.getTime()}
            value={currentDate.getTime()}
            onChange={handleSliderChange}
            className="w-full h-2 appearance-none bg-transparent relative z-10 cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                rgba(0, 255, 0, 0.8) 0%, 
                rgba(0, 255, 0, 0.8) ${percentage * 0.4}%,
                rgba(255, 204, 0, 0.8) ${percentage * 0.4}%,
                rgba(255, 204, 0, 0.8) ${percentage * 0.7}%,
                rgba(255, 51, 0, 0.8) ${percentage * 0.7}%,
                rgba(255, 51, 0, 0.8) ${percentage}%,
                rgba(255, 255, 255, 0.2) ${percentage}%,
                rgba(255, 255, 255, 0.2) 100%)`
            }}
          />

          {/* Progress indicator */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-8 h-8 pointer-events-none"
            style={{ 
              left: `${percentage}%`,
              backgroundColor: '#ff3300',
              border: '3px solid #fff',
              boxShadow: '0 0 20px rgba(255, 51, 0, 0.8)'
            }}
          >
            <div className="absolute inset-0 animate-ping opacity-50" style={{ backgroundColor: '#ff3300' }} />
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
                <span className={`text-sm font-black uppercase transition-all duration-300`}
                      style={{ 
                        color: currentYear === year ? '#ff3300' : (hoveredYear === year ? '#ffcc00' : '#808080'),
                        fontSize: currentYear === year ? '18px' : '14px'
                      }}>
                  {year}
                </span>
                
                {/* Event marker */}
                {event && (
                  <div className="absolute -top-8 px-3 py-2 text-xs font-black uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                       style={{ 
                         backgroundColor: '#ff3300',
                         color: '#fff',
                         border: '2px solid #fff'
                       }}>
                    {event.event}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Historical events display */}
      <div className="grid grid-cols-4 gap-4">
        {historicalEvents.map(event => {
          const isPast = currentYear >= event.year;
          return (
            <button
              key={event.year}
              onClick={() => handleYearClick(event.year)}
              className="p-4 transition-all duration-100"
              style={{ 
                backgroundColor: isPast ? 'rgba(255, 51, 0, 0.2)' : 'transparent',
                border: `3px solid ${isPast ? '#ff3300' : '#333'}`,
                color: isPast ? '#fff' : '#808080'
              }}
            >
              <div className="text-2xl font-black mb-2">{event.year}</div>
              <div className="text-xs font-bold uppercase">{event.event}</div>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 30px;
          height: 30px;
          background: #ff3300;
          border: 3px solid #fff;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(255, 51, 0, 0.8);
          transition: all 0.1s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(255, 51, 0, 1);
        }

        input[type="range"]::-moz-range-thumb {
          width: 30px;
          height: 30px;
          background: #ff3300;
          border: 3px solid #fff;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(255, 51, 0, 0.8);
          transition: all 0.1s;
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(255, 51, 0, 1);
        }
      `}</style>
    </div>
  );
};

export default React.memo(ExhibitTimeline);