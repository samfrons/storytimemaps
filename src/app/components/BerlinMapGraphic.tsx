'use client';

import React, { useEffect, useState } from 'react';

interface MapMarker {
  id: number;
  x: number;
  y: number;
  delay: number;
  state: 'active' | 'declining' | 'closed';
}

const BerlinMapGraphic: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
  const [activeAnimation, setActiveAnimation] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    // Cycle animations
    const interval = setInterval(() => {
      setActiveAnimation(prev => !prev);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Generate marker positions within Berlin boundaries
  const markers: MapMarker[] = [
    // Mitte area
    { id: 1, x: 50, y: 40, delay: 0.2, state: 'active' },
    { id: 2, x: 52, y: 42, delay: 0.4, state: 'active' },
    { id: 3, x: 48, y: 44, delay: 0.6, state: 'declining' },
    // Charlottenburg
    { id: 4, x: 42, y: 42, delay: 0.8, state: 'active' },
    { id: 5, x: 40, y: 45, delay: 1.0, state: 'closed' },
    // Prenzlauer Berg
    { id: 6, x: 54, y: 38, delay: 1.2, state: 'active' },
    { id: 7, x: 56, y: 36, delay: 1.4, state: 'declining' },
    // Kreuzberg
    { id: 8, x: 50, y: 48, delay: 1.6, state: 'active' },
    { id: 9, x: 52, y: 50, delay: 1.8, state: 'active' },
    // Schöneberg
    { id: 10, x: 46, y: 50, delay: 2.0, state: 'closed' },
    { id: 11, x: 44, y: 48, delay: 2.2, state: 'active' },
    // Friedrichshain
    { id: 12, x: 58, y: 44, delay: 2.4, state: 'declining' },
    { id: 13, x: 60, y: 42, delay: 2.6, state: 'active' },
    // Wilmersdorf
    { id: 14, x: 43, y: 46, delay: 2.8, state: 'active' },
    { id: 15, x: 45, y: 43, delay: 3.0, state: 'closed' },
    // Additional markers
    { id: 16, x: 49, y: 38, delay: 0.3, state: 'active' },
    { id: 17, x: 53, y: 45, delay: 0.7, state: 'declining' },
    { id: 18, x: 47, y: 41, delay: 1.1, state: 'active' },
    { id: 19, x: 55, y: 43, delay: 1.5, state: 'closed' },
    { id: 20, x: 51, y: 46, delay: 1.9, state: 'active' },
  ];

  const getMarkerColor = (state: string) => {
    switch (state) {
      case 'active': return '#97d8c0';
      case 'declining': return '#ffcb51';
      case 'closed': return '#ee5760';
      default: return '#97d8c0';
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full max-w-lg"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }}
      >
        {/* Berlin simplified boundary shape */}
        <g className={`transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          {/* Outer boundary */}
          <path
            d="M 30 25 
               L 35 20 
               L 45 18 
               L 55 19 
               L 65 22 
               L 70 28 
               L 72 35 
               L 71 45 
               L 68 52 
               L 65 58 
               L 60 62 
               L 52 65 
               L 45 64 
               L 38 61 
               L 32 55 
               L 28 48 
               L 27 40 
               L 28 32 
               Z"
            fill="none"
            stroke="#6b6275"
            strokeWidth="0.5"
            className="transition-all duration-500"
          />
          
          {/* Inner districts boundary (simplified) */}
          <path
            d="M 40 35 
               L 45 33 
               L 52 34 
               L 58 37 
               L 60 42 
               L 58 48 
               L 53 51 
               L 47 50 
               L 42 47 
               L 40 42 
               Z"
            fill="none"
            stroke="#6b6275"
            strokeWidth="0.3"
            strokeDasharray="1 1"
            opacity="0.5"
          />

          {/* Spree River (simplified) */}
          <path
            d="M 35 45 Q 45 43, 50 45 T 65 44"
            fill="none"
            stroke="#4a4a57"
            strokeWidth="1"
            opacity="0.6"
          />
        </g>

        {/* Grid pattern for texture */}
        <defs>
          <pattern id="grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="#6b6275"
              strokeWidth="0.1"
              opacity="0.2"
            />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Animated markers */}
        {markers.map((marker) => (
          <g key={marker.id}>
            {/* Pulse animation ring */}
            {activeAnimation && (
              <circle
                cx={marker.x}
                cy={marker.y}
                r="2"
                fill="none"
                stroke={getMarkerColor(marker.state)}
                strokeWidth="0.5"
                opacity="0"
                className={isVisible ? 'animate-pulse-ring' : ''}
                style={{
                  animationDelay: `${marker.delay}s`,
                  animationDuration: '3s',
                  animationIterationCount: 'infinite'
                }}
              />
            )}
            
            {/* Main marker */}
            <circle
              cx={marker.x}
              cy={marker.y}
              r="1"
              fill={getMarkerColor(marker.state)}
              className={`cursor-pointer transition-all duration-300 ${
                isVisible ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: hoveredMarker === marker.id ? 'scale(1.5)' : 'scale(1)',
                transformOrigin: `${marker.x}% ${marker.y}%`,
                animationDelay: `${marker.delay}s`,
              }}
              onMouseEnter={() => setHoveredMarker(marker.id)}
              onMouseLeave={() => setHoveredMarker(null)}
            >
              <animate
                attributeName="opacity"
                values="0;1"
                dur="0.5s"
                begin={`${marker.delay}s`}
                fill="freeze"
              />
            </circle>
          </g>
        ))}

        {/* Legend */}
        <g transform="translate(5, 85)" className={`transition-opacity duration-1000 delay-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <text x="0" y="0" fill="#8b7d8e" fontSize="3" fontFamily="monospace">
            Jewish Businesses
          </text>
          <circle cx="2" cy="5" r="0.8" fill="#97d8c0" />
          <text x="4" y="5.5" fill="#8b7d8e" fontSize="2.5" fontFamily="monospace">Active</text>
          
          <circle cx="2" cy="8" r="0.8" fill="#ffcb51" />
          <text x="4" y="8.5" fill="#8b7d8e" fontSize="2.5" fontFamily="monospace">Declining</text>
          
          <circle cx="2" cy="11" r="0.8" fill="#ee5760" />
          <text x="4" y="11.5" fill="#8b7d8e" fontSize="2.5" fontFamily="monospace">Closed</text>
        </g>
      </svg>

      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            r: 1;
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

export default React.memo(BerlinMapGraphic);