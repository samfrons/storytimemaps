'use client';

import React from 'react';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full flex">
      {/* Map skeleton */}
      <div className="flex-1 relative bg-gray-200 dark:bg-gray-800 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-400 border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-mono">Loading map...</p>
          </div>
        </div>
      </div>
      
      {/* List skeleton */}
      <div className="w-[400px] flex flex-col" style={{backgroundColor: 'var(--background)'}}>
        {/* Header skeleton */}
        <div className="p-6 border-b" style={{borderColor: 'var(--border)'}}>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 animate-pulse mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 animate-pulse w-1/2"></div>
        </div>
        
        {/* List items skeleton */}
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className="border p-4" 
              style={{borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)'}}
            >
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 animate-pulse w-1/2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 animate-pulse w-full"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 animate-pulse w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;