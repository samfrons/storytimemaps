// File: app/components/TimeSlider.tsx

'use client';

import React, { useState } from 'react';


interface TimeSliderProps {
  minDate: Date;
  maxDate: Date;
  currentDate: Date;
  onChange: (date: Date) => void;
}

const TimeSlider: React.FC<TimeSliderProps> = ({ minDate, maxDate, currentDate, onChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(parseInt(e.target.value));
    onChange(newDate);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  React.useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        if (nextMonth <= maxDate) {
          onChange(nextMonth);
        } else {
          setIsPlaying(false);
        }
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentDate, maxDate, onChange]);

  const percentage = ((currentDate.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-center mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            className="p-2 border transition-all shadow-sm hover:shadow-md"
            style={{
              backgroundColor: 'var(--muted)',
              borderColor: 'var(--border)',
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--primary)'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--primary)'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          <span className="text-xs font-mono font-bold px-3 py-1.5 border shadow-sm uppercase tracking-wide" style={{
            color: 'var(--foreground)',
            backgroundColor: 'var(--muted)',
            borderColor: 'var(--border)'
          }}>
            {`${String(currentDate.getMonth() + 1).padStart(2, '0')}.${currentDate.getFullYear()}`}
          </span>
        </div>
      </div>
      
      <div className="relative flex items-center gap-4">
        <span className="text-xs font-mono font-semibold" style={{color: 'var(--warning)'}}>1920</span>
        
        <div className="relative flex-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-4 overflow-hidden" style={{backgroundColor: 'var(--muted)'}}>
              <div 
                className="h-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%`, backgroundColor: 'var(--danger)' }}
              />
            </div>
          </div>
          
          <input
            type="range"
            min={minDate.getTime()}
            max={maxDate.getTime()}
            value={currentDate.getTime()}
            onChange={handleChange}
            className="relative w-full h-4 bg-transparent appearance-none cursor-pointer z-10
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:bg-[var(--foreground)]
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:hover:scale-125
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:bg-[var(--foreground)]
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-white
              [&::-moz-range-thumb]:shadow-md
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:transition-all
              [&::-moz-range-thumb]:hover:scale-125"
          />
        </div>
        
        <span className="text-xs font-mono font-semibold" style={{color: 'var(--warning)'}}>1945</span>
      </div>
      
      <div className="flex justify-between mt-2">
        <div className="flex gap-3 text-xs font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></span>
            <span style={{ color: 'var(--foreground)' }}>Active</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--warning)' }}></span>
            <span style={{ color: 'var(--foreground)' }}>Declining</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--danger)' }}></span>
            <span style={{ color: 'var(--foreground)' }}>Closed</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TimeSlider, (prevProps, nextProps) => {
  return (
    prevProps.minDate.getTime() === nextProps.minDate.getTime() &&
    prevProps.maxDate.getTime() === nextProps.maxDate.getTime() &&
    prevProps.currentDate.getTime() === nextProps.currentDate.getTime()
  );
});