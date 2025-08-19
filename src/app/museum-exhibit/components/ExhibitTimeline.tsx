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
    if (year < 1933) return 'from-green-600 to-green-400';
    if (year < 1938) return 'from-yellow-600 to-yellow-400';
    return 'from-red-600 to-red-400';
  };

  return (
    <div className="bg-black bg-opacity-90 backdrop-blur-lg border-t border-gray-800 p-8">
      
      {/* Timeline header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-8">
          {/* Play/Pause button */}
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="w-16 h-16 bg-white bg-opacity-10 hover:bg-opacity-20 flex items-center justify-center transition-all duration-300"
            style={{ minWidth: '64px', minHeight: '64px' }}
          >
            {autoPlay ? (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Speed controls */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm uppercase">Speed</span>
            {[0.5, 1, 2].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-4 py-2 text-sm transition-all duration-300 ${
                  speed === s 
                    ? 'bg-white text-black' 
                    : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
                }`}
                style={{ minWidth: '60px', minHeight: '40px' }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Current date display */}
        <div className="text-center">
          <div className={`text-6xl font-light text-white mb-2 transition-all duration-500`}>
            {currentYear}
          </div>
          <div className="text-gray-400 text-sm uppercase tracking-wider">
            {currentDate.toLocaleDateString('en-US', { month: 'long' })}
          </div>
        </div>
      </div>

      {/* Main timeline slider */}
      <div className="relative mb-8">
        {/* Background gradient showing eras */}
        <div className="absolute inset-0 h-20 overflow-hidden opacity-30">
          <div className={`h-full bg-gradient-to-r ${getEraColor(currentYear)} transition-all duration-1000`} />
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
                rgba(34, 197, 94, 0.8) 0%, 
                rgba(34, 197, 94, 0.8) ${percentage * 0.4}%,
                rgba(251, 191, 36, 0.8) ${percentage * 0.4}%,
                rgba(251, 191, 36, 0.8) ${percentage * 0.7}%,
                rgba(239, 68, 68, 0.8) ${percentage * 0.7}%,
                rgba(239, 68, 68, 0.8) ${percentage}%,
                rgba(255, 255, 255, 0.1) ${percentage}%,
                rgba(255, 255, 255, 0.1) 100%)`
            }}
          />

          {/* Progress indicator */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-2xl pointer-events-none animate-pulse"
            style={{ left: `${percentage}%` }}
          >
            <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-50" />
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
                <span className={`text-sm transition-all duration-300 ${
                  currentYear === year ? 'text-white font-bold text-lg' : 'text-gray-400'
                } ${hoveredYear === year ? 'text-white' : ''}`}>
                  {year}
                </span>
                
                {/* Event marker */}
                {event && (
                  <div className={`absolute -top-8 px-2 py-1 bg-red-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
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
              className={`p-4 border transition-all duration-500 ${
                isPast 
                  ? 'bg-red-900 bg-opacity-30 border-red-700 text-white' 
                  : 'bg-white bg-opacity-5 border-gray-700 text-gray-500'
              } hover:bg-opacity-40`}
            >
              <div className="text-2xl font-light mb-2">{event.year}</div>
              <div className="text-sm">{event.event}</div>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
          transition: all 0.3s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(255, 255, 255, 1);
        }

        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
          transition: all 0.3s;
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(255, 255, 255, 1);
        }
      `}</style>
    </div>
  );
};

export default React.memo(ExhibitTimeline);