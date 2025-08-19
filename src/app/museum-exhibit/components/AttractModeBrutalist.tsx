'use client';

import React, { useEffect, useState } from 'react';

interface AttractModeProps {
  isVisible: boolean;
}

const AttractModeBrutalist: React.FC<AttractModeProps> = ({ isVisible }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [stats, setStats] = useState({ businesses: 0, years: 0, stories: 0 });
  const [glitchText, setGlitchText] = useState(false);
  
  // Animated statistics counter
  useEffect(() => {
    if (!isVisible) {
      setStats({ businesses: 0, years: 0, stories: 0 });
      return;
    }

    const interval = setInterval(() => {
      setStats(prev => ({
        businesses: Math.min(prev.businesses + 137, 10021),
        years: Math.min(prev.years + 1, 45),
        stories: Math.min(prev.stories + 7, 542),
      }));
    }, 20);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Glitch effect
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setGlitchText(true);
      setTimeout(() => setGlitchText(false), 200);
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 brutalist-concrete overflow-hidden">
      
      {/* Geometric background pattern */}
      <div className="absolute inset-0 brutalist-diagonal opacity-20" />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 brutalist-grid" />
      
      {/* Noise texture */}
      <div className="brutalist-noise" />
      
      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center z-10">
        
        {/* Brutalist title block */}
        <div className="text-center mb-16">
          <div className="relative inline-block">
            <h1 className={`brutalist-title text-8xl mb-4 ${glitchText ? 'brutalist-glitch' : ''}`} 
                style={{ color: '#fff', textShadow: '5px 5px 0 #ff0000, 10px 10px 0 #000' }}>
              JEWISH<br/>
              BUSINESSES
            </h1>
            <div className="absolute -bottom-2 left-0 w-full h-2" style={{ backgroundColor: '#ffff00' }} />
          </div>
          <div className="mt-8 relative">
            <h2 className="brutalist-mono text-3xl" style={{ color: '#ff0000' }}>
              BERLIN
            </h2>
            <div className="brutalist-mono text-2xl mt-2" style={{ color: '#ffff00' }}>
              1900—1945
            </div>
          </div>
        </div>

        {/* Statistics blocks */}
        <div className="flex gap-8 mb-20">
          {[
            { value: stats.businesses, label: 'BUSINESSES', color: '#00ff00' },
            { value: stats.years, label: 'YEARS', color: '#ffff00' },
            { value: stats.stories, label: 'STORIES', color: '#ff6600' },
          ].map((stat, index) => (
            <div key={stat.label} className="relative">
              <div 
                className="brutalist-card p-8" 
                style={{ 
                  backgroundColor: '#1a1a1a',
                  border: `3px solid ${stat.color}`,
                  transform: `rotate(${index === 1 ? '-2deg' : index === 2 ? '2deg' : '0'})`
                }}
              >
                <div className="brutalist-title text-6xl mb-2" style={{ color: stat.color }}>
                  {stat.value.toLocaleString()}
                </div>
                <div className="brutalist-mono text-sm" style={{ color: '#808080', letterSpacing: '0.3em' }}>
                  {stat.label}
                </div>
              </div>
              {/* Shadow block */}
              <div 
                className="absolute inset-0 -z-10"
                style={{
                  backgroundColor: '#000',
                  transform: 'translate(10px, 10px)',
                }}
              />
            </div>
          ))}
        </div>

        {/* Touch prompt - brutalist style */}
        <div className="relative group cursor-pointer">
          <button className="brutalist-button relative overflow-hidden group">
            <span className="relative z-10 flex items-center gap-4 brutalist-mono text-2xl px-12 py-8">
              <span className="brutalist-blink">▶</span>
              TOUCH TO BEGIN
              <span className="brutalist-blink">◀</span>
            </span>
            {/* Animated border */}
            <div className="absolute inset-0 border-4 border-white animate-pulse" />
          </button>
          
          {/* Offset shadow blocks */}
          <div className="absolute inset-0 -z-10" style={{ backgroundColor: '#ff0000', transform: 'translate(5px, 5px)' }} />
          <div className="absolute inset-0 -z-20" style={{ backgroundColor: '#000', transform: 'translate(10px, 10px)' }} />
        </div>

        {/* Bottom text blocks */}
        <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
          <div className="brutalist-card p-4" style={{ backgroundColor: '#000', border: '2px solid #fff' }}>
            <div className="brutalist-mono text-xs" style={{ color: '#ffff00', letterSpacing: '0.2em' }}>
              HISTORICAL DATA VISUALIZATION
            </div>
          </div>
          
          <div className="flex gap-4">
            {['1920', '1933', '1938', '1945'].map(year => (
              <div key={year} className="brutalist-card p-3" style={{ backgroundColor: '#ff0000' }}>
                <div className="brutalist-title text-xl" style={{ color: '#000' }}>
                  {year}
                </div>
              </div>
            ))}
          </div>
          
          <div className="brutalist-card p-4" style={{ backgroundColor: '#000', border: '2px solid #fff' }}>
            <div className="brutalist-mono text-xs" style={{ color: '#00ff00', letterSpacing: '0.2em' }}>
              MUSEUM EXHIBITION
            </div>
          </div>
        </div>
      </div>

      {/* Animated geometric shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 border-4 border-white opacity-20 animate-spin" style={{ animationDuration: '20s' }} />
      <div className="absolute bottom-20 right-20 w-48 h-48 border-4 border-yellow-400 opacity-20 animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-red-600 opacity-10 animate-pulse" />
      
      <style jsx>{`
        @keyframes glitch-skew {
          0% {
            transform: skew(0deg);
          }
          20% {
            transform: skew(-2deg);
          }
          40% {
            transform: skew(1deg);
          }
          60% {
            transform: skew(-1deg);
          }
          80% {
            transform: skew(0.5deg);
          }
          100% {
            transform: skew(0deg);
          }
        }
        
        .brutalist-glitch {
          animation: glitch-skew 0.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default React.memo(AttractModeBrutalist);