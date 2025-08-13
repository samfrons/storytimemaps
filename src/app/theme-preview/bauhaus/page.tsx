'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import StoryList from '../../components/StoryList';
import { useStoryMapLogic, berlinCoordinates, defaultZoom } from '../../../hooks/useStoryMapLogic';

const MapboxMap = dynamic(() => import('./MapboxMapBauhaus'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#f5f5f0] flex items-center justify-center">
      <div className="text-[#000000] font-mono font-bold">LOADING...</div>
    </div>
  )
});

export default function BauhausTheme() {
  const {
    visibleStories,
    activeStoryId,
    currentDate,
    minDate,
    maxDate,
    setCurrentDate,
    handleMarkerClick,
    testMarkers
  } = useStoryMapLogic();

  return (
    <div className="flex h-screen overflow-hidden bauhaus-theme">
      <style jsx global>{`
        .bauhaus-theme {
          --primary: #000000;
          --primary-light: #333333;
          --secondary: #ff0000;
          --warning: #ffcc00;
          --danger: #ff0000;
          --success: #0066ff;
          --background: #f5f5f0;
          --foreground: #000000;
          --muted: #666666;
          --border: #000000;
          --shadow: rgba(0, 0, 0, 0.3);
          --accent-yellow: #ffcc00;
          --accent-red: #ff0000;
          --accent-blue: #0066ff;
        }
        
        .bauhaus-theme * {
          color: var(--foreground);
          border-color: var(--border);
        }
        
        .bauhaus-theme .bg-\\[\\#4a4a57\\] {
          background-color: var(--background) !important;
        }
        
        .bauhaus-theme .bg-\\[\\#6b6275\\]\\/40 {
          background-color: transparent !important;
          border: 2px solid #000000 !important;
        }
        
        .bauhaus-theme .border-\\[\\#6b6275\\] {
          border-color: var(--border) !important;
          border-width: 2px !important;
        }
        
        .bauhaus-theme .text-\\[\\#97d8c0\\] {
          color: var(--accent-blue) !important;
          font-weight: bold !important;
        }
        
        .bauhaus-theme .text-\\[\\#f5cdb4\\] {
          color: var(--foreground) !important;
        }
        
        .bauhaus-theme .text-\\[\\#8b7d8e\\] {
          color: var(--muted) !important;
        }
        
        .bauhaus-theme .text-\\[\\#ffcb51\\] {
          color: var(--accent-yellow) !important;
          font-weight: bold !important;
        }
        
        .bauhaus-theme .text-\\[\\#ee5760\\] {
          color: var(--accent-red) !important;
          font-weight: bold !important;
        }
        
        .bauhaus-theme .text-\\[\\#eca27d\\] {
          color: var(--accent-red) !important;
        }
        
        .bauhaus-theme .bg-\\[\\#97d8c0\\] {
          background-color: var(--accent-blue) !important;
        }
        
        .bauhaus-theme .bg-\\[\\#6b6275\\]\\/50 {
          background-color: var(--accent-yellow) !important;
          opacity: 0.2 !important;
        }
        
        .bauhaus-theme .hover\\:bg-\\[\\#6b6275\\]\\/50:hover {
          background-color: var(--accent-yellow) !important;
          opacity: 0.3 !important;
        }
        
        .bauhaus-theme .bg-\\[\\#97d8c0\\]\\/20 {
          background-color: var(--accent-blue) !important;
          opacity: 0.2 !important;
        }
        
        .bauhaus-theme .border-l-\\[\\#97d8c0\\] {
          border-left-color: var(--accent-blue) !important;
          border-left-width: 4px !important;
        }
        
        .bauhaus-theme .hover\\:text-\\[\\#97d8c0\\]:hover {
          color: var(--accent-blue) !important;
        }
        
        .bauhaus-theme .shadow-sm {
          box-shadow: 4px 4px 0px #000000 !important;
        }
        
        .bauhaus-theme .shadow-lg {
          box-shadow: 8px 8px 0px #000000 !important;
        }
        
        .bauhaus-theme button {
          font-weight: bold !important;
          text-transform: uppercase !important;
        }
        
        /* Geometric patterns background */
        .bauhaus-theme .pattern-bg {
          position: relative;
        }
        
        .bauhaus-theme .pattern-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 35px,
              rgba(255, 204, 0, 0.1) 35px,
              rgba(255, 204, 0, 0.1) 70px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 35px,
              rgba(0, 102, 255, 0.1) 35px,
              rgba(0, 102, 255, 0.1) 70px
            );
          pointer-events: none;
        }
      `}</style>
      
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-[#ffcc00] px-6 py-3 border-4 border-black shadow-lg">
        <h1 className="text-black font-mono font-black text-xl tracking-wider">BAUHAUS</h1>
      </div>
      
      {/* Sidebar with geometric elements */}
      <div className="w-full md:w-96 flex-shrink-0 bg-[#f5f5f0] border-r-4 border-black relative pattern-bg">
        <StoryList 
          visibleStories={visibleStories}
          activeStoryId={activeStoryId}
          minDate={minDate}
          maxDate={maxDate}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          onStoryClick={handleMarkerClick}
        />
        
        {/* Geometric decorations */}
        <div className="absolute top-20 right-4 w-12 h-12 bg-[#ff0000] transform rotate-45"></div>
        <div className="absolute bottom-20 left-4 w-16 h-16 bg-[#0066ff] rounded-full"></div>
        <div className="absolute top-1/2 right-8 w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[40px] border-b-[#ffcc00]"></div>
      </div>
      
      {/* Map */}
      <div className="flex-1 relative">
        <MapboxMap 
          center={berlinCoordinates}
          zoom={defaultZoom}
          markers={testMarkers}
          onMarkerClick={handleMarkerClick}
          activeMarkerId={activeStoryId}
          enrichedStories={visibleStories}
        />
      </div>
    </div>
  );
}