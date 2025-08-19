'use client';

import React, { useEffect, useState } from 'react';

interface AttractModeProps {
  isVisible: boolean;
}

const AttractMode: React.FC<AttractModeProps> = ({ isVisible }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [stats, setStats] = useState({ businesses: 0, years: 0, stories: 0 });
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, delay: number}>>([]);
  
  // Historical images for slideshow (using placeholder paths)
  const images = [
    '/berlin-map.png',
    '/berlin-map.png', // In production, would have multiple historical photos
    '/berlin-map.png',
  ];

  // Animated statistics counter
  useEffect(() => {
    if (!isVisible) {
      setStats({ businesses: 0, years: 0, stories: 0 });
      return;
    }

    const interval = setInterval(() => {
      setStats(prev => ({
        businesses: Math.min(prev.businesses + 87, 10021),
        years: Math.min(prev.years + 1, 45),
        stories: Math.min(prev.stories + 3, 542),
      }));
    }, 30);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Image carousel
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % images.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isVisible, images.length]);

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 20,
    }));
    setParticles(newParticles);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      
      {/* Animated background with Ken Burns effect */}
      <div className="absolute inset-0">
        {images.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-3000 ${
              index === currentImage ? 'opacity-30' : 'opacity-0'
            }`}
          >
            <div
              className="absolute w-[120%] h-[120%] -top-[10%] -left-[10%] bg-cover bg-center"
              style={{
                backgroundImage: `url(${img})`,
                animation: index === currentImage ? 'kenBurnsMuseum 20s ease-in-out infinite' : 'none',
                filter: 'contrast(1.2) brightness(0.7) sepia(0.3)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white opacity-20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float ${20 + particle.delay}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center z-10">
        
        {/* Title with glow effect */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-7xl font-light text-white mb-4 tracking-wider museum-title">
            JEWISH BUSINESSES
          </h1>
          <h2 className="text-5xl font-light text-gray-400 tracking-wide">
            IN BERLIN 1900-1945
          </h2>
        </div>

        {/* Animated statistics */}
        <div className="flex gap-24 mb-20">
          <div className="text-center transform hover:scale-110 transition-transform duration-500">
            <div className="text-6xl font-light text-white mb-2 museum-counter">
              {stats.businesses.toLocaleString()}
            </div>
            <div className="text-gray-500 uppercase tracking-widest text-sm">
              Businesses Documented
            </div>
          </div>
          <div className="text-center transform hover:scale-110 transition-transform duration-500">
            <div className="text-6xl font-light text-white mb-2 museum-counter">
              {stats.years}
            </div>
            <div className="text-gray-500 uppercase tracking-widest text-sm">
              Years of History
            </div>
          </div>
          <div className="text-center transform hover:scale-110 transition-transform duration-500">
            <div className="text-6xl font-light text-white mb-2 museum-counter">
              {stats.stories}
            </div>
            <div className="text-gray-500 uppercase tracking-widest text-sm">
              Personal Stories
            </div>
          </div>
        </div>

        {/* Touch prompt with pulse animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20" />
          <button className="relative px-16 py-8 bg-white bg-opacity-10 backdrop-blur-md text-white text-3xl font-light border-2 border-white border-opacity-30 hover:bg-opacity-20 transition-all duration-500">
            <span className="flex items-center gap-4">
              <svg className="w-10 h-10 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
              TOUCH TO BEGIN
            </span>
          </button>
        </div>

        {/* Floating timeline preview */}
        <div className="absolute bottom-12 left-0 right-0 px-20">
          <div className="relative h-2 bg-white bg-opacity-10 overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
              style={{
                animation: 'timeline-preview 15s ease-in-out infinite',
                width: '100%',
              }}
            />
          </div>
          <div className="flex justify-between mt-4 text-gray-500 text-sm">
            <span>1920</span>
            <span className="text-white">1933</span>
            <span>1945</span>
          </div>
        </div>
      </div>

      {/* Museum branding */}
      <div className="absolute bottom-8 right-8 text-gray-600 text-sm">
        Interactive Historical Exhibition
      </div>

      <style jsx>{`
        @keyframes kenBurnsMuseum {
          0% {
            transform: scale(1) translate(0, 0) rotate(0deg);
          }
          25% {
            transform: scale(1.1) translate(-5%, -5%) rotate(0.5deg);
          }
          50% {
            transform: scale(1.15) translate(5%, -10%) rotate(-0.5deg);
          }
          75% {
            transform: scale(1.1) translate(-10%, 5%) rotate(0.3deg);
          }
          100% {
            transform: scale(1) translate(0, 0) rotate(0deg);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(10px) translateX(-10px);
          }
          75% {
            transform: translateY(-10px) translateX(5px);
          }
        }

        @keyframes timeline-preview {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .museum-title {
          text-shadow: 0 0 40px rgba(255, 255, 255, 0.3);
          animation: glow 3s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from {
            text-shadow: 0 0 40px rgba(255, 255, 255, 0.3);
          }
          to {
            text-shadow: 0 0 60px rgba(255, 255, 255, 0.5);
          }
        }

        .museum-counter {
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.1em;
        }

        .animate-fade-in {
          animation: fadeIn 2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default React.memo(AttractMode);