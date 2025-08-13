'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { StoryMap } from '../../types';
import StoryDetail from './StoryDetail';

interface BusinessDetailModalProps {
  story: StoryMap;
  isOpen: boolean;
  onClose: () => void;
  originRect: DOMRect | null;
}

const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({ 
  story, 
  isOpen, 
  onClose, 
  originRect 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && originRect) {
      setIsVisible(true);
      // Start expansion after a frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsExpanded(true);
          // Show content after expansion starts
          setTimeout(() => setShowContent(true), 300);
        });
      });
    } else if (!isOpen) {
      setShowContent(false);
      setIsExpanded(false);
      setTimeout(() => setIsVisible(false), 500);
    }
  }, [isOpen, originRect]);

  if (!isVisible || !originRect) return null;

  // Calculate the transform origin and initial position
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const modalWidth = Math.min(672, viewportWidth - 32); // max-w-2xl with padding
  const modalHeight = Math.min(viewportHeight * 0.9, 700);
  
  const finalX = (viewportWidth - modalWidth) / 2;
  const finalY = (viewportHeight - modalHeight) / 2;
  
  const initialScaleX = originRect.width / modalWidth;
  const initialScaleY = originRect.height / modalHeight;
  const initialX = originRect.left - finalX;
  const initialY = originRect.top - finalY;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black backdrop-blur-md transition-all duration-500 ease-out ${
          isExpanded ? 'bg-opacity-70' : 'bg-opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Expanding Modal */}
      <div 
        ref={modalRef}
        className={`absolute bg-[#4a4a57] border border-[#6b6275] shadow-2xl transition-all duration-700 ease-out overflow-hidden`}
        style={{
          width: `${modalWidth}px`,
          height: `${modalHeight}px`,
          left: `${finalX}px`,
          top: `${finalY}px`,
          transform: isExpanded 
            ? 'translate(0, 0) scale(1)' 
            : `translate(${initialX}px, ${initialY}px) scale(${initialScaleX}, ${initialScaleY})`,
          transformOrigin: 'top left',
          transitionTimingFunction: isExpanded 
            ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' 
            : 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-[#6b6275] bg-[#4a4a57] transition-opacity duration-300 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex-1">
            <h2 className="text-xl font-mono font-bold text-[#97d8c0] mb-1">{story.title}</h2>
            <div className="flex items-center gap-4 text-xs font-mono text-[#8b7d8e]">
              <span className="text-[#eca27d]">
                {story.startDate ? new Date(story.startDate).getFullYear() : 'Unknown'} - {story.endDate ? new Date(story.endDate).getFullYear() : 'Present'}
              </span>
              {story.category && (
                <span className="px-2 py-1 bg-[#6b6275]/50 text-[#eca27d] uppercase tracking-wide">
                  {story.category}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#6b6275]/50 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <svg className="w-5 h-5 text-[#8b7d8e] hover:text-[#f5cdb4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className={`p-6 overflow-y-auto h-[calc(100%-88px)] transition-opacity duration-500 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}>
          <StoryDetail story={story} />
          
          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-[#6b6275]">
            <button className="flex-1 font-mono text-xs font-semibold py-3 px-4 bg-[#4a4a57] border border-[#6b6275] text-[#f5cdb4] hover:bg-[#6b6275]/30 transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wide">
              View on Map
            </button>
            <button className="flex-1 font-mono text-xs font-semibold py-3 px-4 bg-[#97d8c0] text-[#4a4a57] border border-[#97d8c0] hover:bg-[#a9e2d0] transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wide">
              Share Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetailModal;