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
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-[#ffcb51] font-semibold">{minDate.getFullYear()}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            className="p-2 bg-[#564b5a]/50 border border-[#564b5a] hover:bg-[#564b5a]/70 transition-all shadow-sm hover:shadow-md"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="w-4 h-4 text-[#97d8c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-[#97d8c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          <span className="text-xs font-mono font-bold text-[#f5cdb4] bg-[#564b5a]/50 px-3 py-1.5 border border-[#564b5a] shadow-sm uppercase tracking-wide">
            {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>
        <span className="text-xs font-mono text-[#ffcb51] font-semibold">{maxDate.getFullYear()}</span>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-1.5 bg-[#564b5a]/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#97d8c0] via-[#ffcb51] to-[#ee5760] transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        
        <input
          type="range"
          min={minDate.getTime()}
          max={maxDate.getTime()}
          value={currentDate.getTime()}
          onChange={handleChange}
          className="relative w-full h-2 bg-transparent appearance-none cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3.5
            [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[#ee5760]
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-all
            [&::-webkit-slider-thumb]:hover:scale-125
            [&::-moz-range-thumb]:w-3.5
            [&::-moz-range-thumb]:h-3.5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[#ee5760]
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:transition-all
            [&::-moz-range-thumb]:hover:scale-125"
        />
      </div>
      
      <div className="flex justify-between mt-2">
        <div className="flex gap-3 text-xs font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#97d8c0' }}></span>
            <span className="text-[#f5cdb4]">Active</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ffcb51' }}></span>
            <span className="text-[#f5cdb4]">Declining</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ee5760' }}></span>
            <span className="text-[#f5cdb4]">Closed</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimeSlider;