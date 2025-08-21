'use client';

import React, { useEffect, useState } from 'react';

interface MapMarker {
  id: number;
  x: number;
  y: number;
  delay: number;
  state: 'active' | 'declining' | 'closed';
  district: string;
}

const FrankfurtMapPreview: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Frankfurt business locations based on actual districts
  const markers: MapMarker[] = [
    // Altstadt - historic center, high concentration
    { id: 1, x: 50, y: 45, delay: 0.2, state: 'active', district: 'Altstadt' },
    { id: 2, x: 52, y: 47, delay: 0.4, state: 'active', district: 'Altstadt' },
    { id: 3, x: 48, y: 46, delay: 0.6, state: 'declining', district: 'Altstadt' },
    { id: 4, x: 51, y: 44, delay: 0.8, state: 'closed', district: 'Altstadt' },
    { id: 5, x: 49, y: 48, delay: 1.0, state: 'active', district: 'Altstadt' },
    
    // Westend - wealthy district
    { id: 6, x: 35, y: 40, delay: 1.2, state: 'active', district: 'Westend' },
    { id: 7, x: 37, y: 38, delay: 1.4, state: 'declining', district: 'Westend' },
    { id: 8, x: 33, y: 42, delay: 1.6, state: 'active', district: 'Westend' },
    
    // Ostend - eastern district
    { id: 9, x: 65, y: 45, delay: 1.8, state: 'active', district: 'Ostend' },
    { id: 10, x: 68, y: 47, delay: 2.0, state: 'declining', district: 'Ostend' },
    
    // Nordend - northern district
    { id: 11, x: 52, y: 35, delay: 2.2, state: 'active', district: 'Nordend' },
    { id: 12, x: 55, y: 32, delay: 2.4, state: 'closed', district: 'Nordend' },
    
    // Sachsenhausen - south of Main River
    { id: 13, x: 48, y: 58, delay: 2.6, state: 'active', district: 'Sachsenhausen' },
    { id: 14, x: 52, y: 60, delay: 2.8, state: 'declining', district: 'Sachsenhausen' },
    
    // Bornheim - northeast
    { id: 15, x: 62, y: 38, delay: 3.0, state: 'active', district: 'Bornheim' },
    { id: 16, x: 60, y: 35, delay: 0.3, state: 'closed', district: 'Bornheim' },
    
    // Bockenheim - northwest
    { id: 17, x: 30, y: 35, delay: 0.7, state: 'active', district: 'Bockenheim' },
    { id: 18, x: 28, y: 38, delay: 1.1, state: 'declining', district: 'Bockenheim' },
    
    // Bahnhofsviertel - station district
    { id: 19, x: 45, y: 42, delay: 1.5, state: 'active', district: 'Bahnhofsviertel' },
    { id: 20, x: 43, y: 44, delay: 1.9, state: 'closed', district: 'Bahnhofsviertel' },
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
          <pattern id="frankfurt-streets" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="var(--accent-navy)" />
            <path d="M0 4h8M4 0v8" stroke="var(--border)" strokeWidth="0.2" opacity="0.4" />
          </pattern>
          <pattern id="frankfurt-blocks" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="var(--background)" />
            <rect x="0.5" y="0.5" width="3" height="3" fill="var(--accent-navy)" stroke="var(--border)" strokeWidth="0.1" opacity="0.3" />
          </pattern>
          
          {/* Glow effect for markers */}
          <filter id="frankfurt-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background layers */}
        <rect width="100" height="100" fill="url(#frankfurt-streets)" />
        <rect width="100" height="100" fill="url(#frankfurt-blocks)" opacity="0.6" />

        {/* Main River - flowing west to east through Frankfurt */}
        <path
          d="M 15 52 Q 25 50, 35 51 T 50 52 Q 60 53, 70 52 T 85 53"
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="3"
          opacity="0.8"
        />
        <path
          d="M 15 52 Q 25 50, 35 51 T 50 52 Q 60 53, 70 52 T 85 53"
          fill="none"
          stroke="var(--background)"
          strokeWidth="2"
          opacity="0.6"
        />

        {/* Major streets/avenues of Frankfurt */}
        <g opacity="0.3">
          {/* Zeil - main shopping street */}
          <path d="M 40 45 L 65 45" stroke="var(--border)" strokeWidth="0.8" />
          {/* Kaiserstraße */}
          <path d="M 35 44 L 55 42" stroke="var(--border)" strokeWidth="0.8" />
          {/* Bockenheimer Landstraße */}
          <path d="M 20 40 L 45 38" stroke="var(--border)" strokeWidth="0.8" />
          {/* Berger Straße */}
          <path d="M 55 40 L 70 35" stroke="var(--border)" strokeWidth="0.8" />
          {/* North-South axis */}
          <path d="M 50 25 L 50 75" stroke="var(--border)" strokeWidth="0.6" />
        </g>

        {/* District boundaries (subtle) */}
        <g opacity="0.2" stroke="var(--foreground-muted)" strokeWidth="0.3" fill="none" strokeDasharray="1 1">
          {/* Altstadt boundary */}
          <path d="M 45 40 L 55 40 L 55 50 L 45 50 Z" />
          {/* Westend */}
          <path d="M 25 35 L 40 35 L 40 48 L 25 48 Z" />
          {/* Ostend */}
          <path d="M 60 40 L 75 40 L 75 50 L 60 50 Z" />
          {/* Sachsenhausen (south of river) */}
          <path d="M 40 55 L 60 55 L 60 65 L 40 65 Z" />
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
              filter="url(#frankfurt-glow)"
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
                  x={marker.x - 10}
                  y={marker.y - 8}
                  width="20"
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
                  {marker.district} #{marker.id}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* Map controls indicator */}
        <g transform="translate(5, 5)" opacity="0.8">
          <rect width="12" height="8" fill="var(--accent-navy)" stroke="var(--border)" strokeWidth="0.2" />
          <text x="6" y="4.5" textAnchor="middle" fill="var(--foreground-muted)" fontSize="1.8" fontFamily="monospace">
            ZOOM
          </text>
        </g>

        {/* City label */}
        <g transform="translate(50, 15)" opacity="0.8">
          <text x="0" y="0" textAnchor="middle" fill="var(--primary)" fontSize="3" fontFamily="monospace">
            FRANKFURT AM MAIN
          </text>
          <text x="0" y="4" textAnchor="middle" fill="var(--foreground-muted)" fontSize="1.8" fontFamily="monospace">
            1935
          </text>
        </g>

        {/* Time indicator - static for 1935 */}
        <g transform="translate(5, 85)" opacity="0.8">
          <rect width="90" height="4" fill="var(--accent-navy)" stroke="var(--border)" strokeWidth="0.2" />
          <rect x="30" y="1" width="30" height="2" fill="var(--danger)" />
          <circle cx="45" r="1.5" cy="2" fill="var(--danger)" />
          <text x="2" y="3" fill="var(--foreground-muted)" fontSize="1.5" fontFamily="monospace">1900</text>
          <text x="88" y="3" fill="var(--foreground-muted)" fontSize="1.5" fontFamily="monospace">1945</text>
          <text x="45" y="-1" fill="var(--danger)" fontSize="1.8" fontFamily="monospace" textAnchor="middle">1935</text>
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

export default React.memo(FrankfurtMapPreview);