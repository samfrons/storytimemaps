'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SessionManagerProps {
  isActive: boolean;
  onSessionEnd: () => void;
  timeoutMinutes: number;
}

const SessionManager: React.FC<SessionManagerProps> = ({ 
  isActive, 
  onSessionEnd, 
  timeoutMinutes 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(timeoutMinutes * 60);
  const [showWarning, setShowWarning] = useState(false);
  const lastActivityRef = useRef(Date.now());

  // Reset timer on any activity
  useEffect(() => {
    if (!isActive) {
      setTimeRemaining(timeoutMinutes * 60);
      setShowWarning(false);
      return;
    }

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setTimeRemaining(timeoutMinutes * 60);
      setShowWarning(false);
    };

    // Listen for any interaction
    const events = ['touchstart', 'mousedown', 'mousemove', 'touchmove'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isActive, timeoutMinutes]);

  // Countdown timer
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - lastActivityRef.current) / 1000;
      const remaining = Math.max(0, timeoutMinutes * 60 - elapsed);
      
      setTimeRemaining(Math.floor(remaining));
      
      // Show warning at 30 seconds
      if (remaining <= 30 && remaining > 0) {
        setShowWarning(true);
      }
      
      // End session when time is up
      if (remaining === 0) {
        onSessionEnd();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeoutMinutes, onSessionEnd]);

  if (!isActive) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <>
      {/* Session timer display */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-black bg-opacity-50 backdrop-blur-sm px-6 py-2 flex items-center gap-4">
          <div className="text-gray-400 text-sm uppercase tracking-wider">
            Session Time
          </div>
          <div className={`text-2xl font-mono ${showWarning ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Warning modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-red-900 bg-opacity-90 backdrop-blur-lg p-12 max-w-2xl pointer-events-auto animate-warning-pulse">
            <h2 className="text-4xl font-light text-white mb-6">
              Session Ending Soon
            </h2>
            <p className="text-2xl text-gray-200 mb-8">
              Touch the screen to continue exploring
            </p>
            <div className="text-6xl font-mono text-white text-center animate-pulse">
              {seconds}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes warning-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.02);
            opacity: 1;
          }
        }

        .animate-warning-pulse {
          animation: warning-pulse 1s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default React.memo(SessionManager);