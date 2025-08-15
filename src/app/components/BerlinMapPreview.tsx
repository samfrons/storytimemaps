'use client';

import React, { useEffect, useState } from 'react';

interface MapMarker {
  id: number;
  x: number;
  y: number;
  delay: number;
  state: 'active' | 'declining' | 'closed';
}

const BerlinMapPreview: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Actual business locations based on Berlin map coordinates
  const markers: MapMarker[] = [
    // Mitte area - high concentration
    { id: 1, x: 48, y: 40, delay: 0.2, state: 'active' },
    { id: 2, x: 52, y: 42, delay: 0.4, state: 'active' },
    { id: 3, x: 50, y: 44, delay: 0.6, state: 'declining' },
    { id: 4, x: 49, y: 38, delay: 0.8, state: 'closed' },
    { id: 5, x: 51, y: 41, delay: 1.0, state: 'active' },
    
    // Charlottenburg - wealthy district
    { id: 6, x: 35, y: 42, delay: 1.2, state: 'active' },
    { id: 7, x: 37, y: 45, delay: 1.4, state: 'declining' },
    { id: 8, x: 39, y: 40, delay: 1.6, state: 'closed' },
    
    // Prenzlauer Berg
    { id: 9, x: 55, y: 35, delay: 1.8, state: 'active' },
    { id: 10, x: 58, y: 37, delay: 2.0, state: 'declining' },
    
    // Kreuzberg
    { id: 11, x: 50, y: 50, delay: 2.2, state: 'active' },
    { id: 12, x: 52, y: 48, delay: 2.4, state: 'closed' },
    
    // Schöneberg
    { id: 13, x: 42, y: 52, delay: 2.6, state: 'active' },
    { id: 14, x: 44, y: 50, delay: 2.8, state: 'declining' },
    
    // Friedrichshain
    { id: 15, x: 60, y: 44, delay: 3.0, state: 'active' },
    { id: 16, x: 58, y: 42, delay: 0.3, state: 'closed' },
    
    // Wilmersdorf
    { id: 17, x: 38, y: 48, delay: 0.7, state: 'active' },
    { id: 18, x: 40, y: 50, delay: 1.1, state: 'declining' },
    
    // Wedding/Moabit
    { id: 19, x: 45, y: 32, delay: 1.5, state: 'active' },
    { id: 20, x: 47, y: 30, delay: 1.9, state: 'closed' },
  ];

  const getMarkerColor = (state: string) => {
    if (typeof window === 'undefined') {
      // Server-side fallback colors
      switch (state) {
        case 'active': return '#97d8c0';
        case 'declining': return '#ffcb51';
        case 'closed': return '#ee5760';
        default: return '#97d8c0';
      }
    }
    
    const style = getComputedStyle(document.documentElement);
    switch (state) {
      case 'active': return style.getPropertyValue('--success').trim() || '#97d8c0';
      case 'declining': return style.getPropertyValue('--warning').trim() || '#ffcb51';
      case 'closed': return style.getPropertyValue('--danger').trim() || '#ee5760';
      default: return style.getPropertyValue('--success').trim() || '#97d8c0';
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{backgroundColor: 'var(--background)'}}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
      >
        {/* Map background with street-like grid */}
        <defs>
          <pattern id="streets" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="var(--accent-navy)" />
            <path d="M0 4h8M4 0v8" stroke="var(--border)" strokeWidth="0.2" opacity="0.4" />
          </pattern>
          <pattern id="blocks" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="var(--background)" />
            <rect x="0.5" y="0.5" width="3" height="3" fill="var(--accent-navy)" stroke="var(--border)" strokeWidth="0.1" opacity="0.3" />
          </pattern>
          
          {/* Glow effect for markers */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background layers */}
        <rect width="100" height="100" fill="url(#streets)" />
        <rect width="100" height="100" fill="url(#blocks)" opacity="0.6" />

        {/* Spree River - more realistic path */}
        <path
          d="M 25 45 Q 35 43, 45 45 T 55 44 Q 65 43, 75 45"
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="2"
          opacity="0.8"
        />
        <path
          d="M 25 45 Q 35 43, 45 45 T 55 44 Q 65 43, 75 45"
          fill="none"
          stroke="var(--background)"
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Major streets/avenues */}
        <g opacity="0.3">
          {/* Unter den Linden */}
          <path d="M 30 42 L 60 40" stroke="var(--border)" strokeWidth="0.8" />
          {/* Friedrichstraße */}
          <path d="M 50 25 L 48 60" stroke="var(--border)" strokeWidth="0.8" />
          {/* Kurfürstendamm */}
          <path d="M 20 48 L 45 45" stroke="var(--border)" strokeWidth="0.8" />
          {/* Karl-Marx-Allee */}
          <path d="M 52 44 L 75 42" stroke="var(--border)" strokeWidth="0.8" />
        </g>

        {/* District boundaries (subtle) */}
        <g opacity="0.2" stroke="var(--foreground-muted)" strokeWidth="0.3" fill="none" strokeDasharray="1 1">
          {/* Mitte boundary */}
          <path d="M 40 35 L 45 32 L 55 33 L 60 37 L 58 45 L 52 48 L 45 47 L 42 42 Z" />
          {/* Charlottenburg */}
          <path d="M 25 35 L 35 33 L 40 38 L 38 52 L 28 54 L 22 48 Z" />
          {/* Kreuzberg */}
          <path d="M 42 47 L 52 48 L 55 55 L 48 58 L 40 56 L 38 52 Z" />
        </g>

        {/* Animated markers with realistic clustering */}
        {markers.map((marker) => (
          <g key={marker.id}>
            {/* Pulsing ring animation */}
            <circle
              cx={marker.x}
              cy={marker.y}
              r="0"
              fill="none"
              stroke={getMarkerColor(marker.state)}
              strokeWidth="0.4"
              opacity="0.6"
              className={isVisible ? 'animate-pulse-ring' : ''}
              style={{
                animationDelay: `${marker.delay}s`,
                animationDuration: '4s',
                animationIterationCount: 'infinite'
              }}
            />
            
            {/* Main marker */}
            <circle
              cx={marker.x}
              cy={marker.y}
              r={hoveredMarker === marker.id ? "1.8" : "1.2"}
              fill={getMarkerColor(marker.state)}
              className="cursor-pointer transition-all duration-200"
              filter="url(#glow)"
              style={{
                opacity: isVisible ? 1 : 0,
                animationDelay: `${marker.delay}s`,
              }}
              onMouseEnter={() => setHoveredMarker(marker.id)}
              onMouseLeave={() => setHoveredMarker(null)}
            >
              <animate
                attributeName="opacity"
                values="0;1"
                dur="0.8s"
                begin={`${marker.delay}s`}
                fill="freeze"
              />
            </circle>

            {/* Small label on hover */}
            {hoveredMarker === marker.id && (
              <g>
                <rect
                  x={marker.x - 8}
                  y={marker.y - 8}
                  width="16"
                  height="6"
                  fill="var(--foreground)"
                  stroke={getMarkerColor(marker.state)}
                  strokeWidth="0.2"
                  rx="1"
                  opacity="0.9"
                />
                <text
                  x={marker.x}
                  y={marker.y - 5}
                  textAnchor="middle"
                  fill={getMarkerColor(marker.state)}
                  fontSize="2.5"
                  fontFamily="monospace"
                  className="pointer-events-none"
                >
                  Business #{marker.id}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* Map controls indicator (like real map) */}
        <g transform="translate(5, 5)" opacity="0.8">
          <rect width="12" height="8" fill="var(--accent-navy)" stroke="var(--border)" strokeWidth="0.2" />
          <text x="6" y="4.5" textAnchor="middle" fill="var(--foreground-muted)" fontSize="1.8" fontFamily="monospace">
            ZOOM
          </text>
        </g>

        {/* Time slider indicator */}
        <g transform="translate(5, 85)" opacity="0.8">
          <rect width="90" height="4" fill="var(--accent-navy)" stroke="var(--border)" strokeWidth="0.2" />
          <rect x="20" y="1" width="30" height="2" fill="var(--primary)" />
          <circle cx="35" r="1.5" cy="2" fill="var(--primary)" />
          <text x="2" y="3" fill="var(--foreground-muted)" fontSize="1.5" fontFamily="monospace">1900</text>
          <text x="88" y="3" fill="var(--foreground-muted)" fontSize="1.5" fontFamily="monospace">1945</text>
          <text x="35" y="-1" fill="var(--primary)" fontSize="1.8" fontFamily="monospace" textAnchor="middle">1933</text>
        </g>
      </svg>

      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            r: 1.2;
            opacity: 0.8;
          }
          100% {
            r: 4;
            opacity: 0;
          }
        }

        .animate-pulse-ring {
          animation-name: pulse-ring;
        }
      `}</style>
    </div>
  );
};

export default React.memo(BerlinMapPreview);