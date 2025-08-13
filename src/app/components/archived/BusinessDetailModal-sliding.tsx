/**
 * ARCHIVED VERSION - Sliding Modal Implementation
 * This version implements a sliding transition where:
 * - When clicking Next: Current modal slides out to the left, new modal slides in from the right
 * - When clicking Previous: Current modal slides out to the right, new modal slides in from the left
 * - Both modals are visible during the transition
 * 
 * Note: This implementation had some issues with modals jumping/flickering during transitions
 * but the core concept is preserved here for future reference.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StoryMap } from '../../../types';
import StoryDetail from '../StoryDetail';

interface BusinessDetailModalProps {
  story: StoryMap;
  isOpen: boolean;
  onClose: () => void;
  originRect: DOMRect | null;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  isAnimatingOut?: boolean;
  animationDirection?: 'left' | 'right' | null;
  startPosition?: 'left' | 'right' | 'center';
}

const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({ 
  story, 
  isOpen, 
  onClose, 
  originRect,
  onNavigate,
  hasPrevious = false,
  hasNext = false,
  isAnimatingOut = false,
  animationDirection = null,
  startPosition = 'center'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && originRect) {
      setIsVisible(true);
      
      if (startPosition !== 'center') {
        // For sliding transitions, start expanded
        setIsExpanded(true);
        setShowContent(true);
      } else {
        // Normal expansion from card
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsExpanded(true);
            setTimeout(() => setShowContent(true), 300);
          });
        });
      }
    } else if (!isOpen) {
      setShowContent(false);
      setIsExpanded(false);
      setTimeout(() => setIsVisible(false), 500);
    }
  }, [isOpen, originRect, startPosition]);

  if (!isVisible || !originRect) return null;

  // Calculate dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const modalWidth = Math.min(800, viewportWidth * 0.9);
  const modalHeight = viewportHeight * 0.95;
  
  const initialScaleX = originRect.width / modalWidth;
  const initialScaleY = originRect.height / modalHeight;

  // Determine transform based on state
  let transform = '';
  
  if (!isExpanded && startPosition === 'center') {
    // Initial state: scaled down at card position
    const offsetX = (originRect.left + originRect.width/2 - viewportWidth/2);
    const offsetY = (originRect.top + originRect.height/2 - viewportHeight/2);
    transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${initialScaleX}, ${initialScaleY})`;
  } else if (isAnimatingOut) {
    // Animating out
    const slideX = animationDirection === 'left' ? -viewportWidth : viewportWidth;
    transform = `translate(-50%, -50%) translateX(${slideX}px)`;
  } else if (startPosition === 'left') {
    // Starting from left, slide to center
    transform = `translate(-50%, -50%) translateX(${isExpanded ? 0 : -viewportWidth}px)`;
  } else if (startPosition === 'right') {
    // Starting from right, slide to center
    transform = `translate(-50%, -50%) translateX(${isExpanded ? 0 : viewportWidth}px)`;
  } else {
    // Centered and expanded
    transform = 'translate(-50%, -50%)';
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      {!isAnimatingOut && startPosition === 'center' && (
        <div 
          className={`absolute inset-0 bg-black backdrop-blur-md transition-all duration-500 ease-out ${
            isExpanded ? 'bg-opacity-70' : 'bg-opacity-0'
          }`}
          onClick={onClose}
        />
      )}
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="fixed bg-[#4a4a57] border border-[#6b6275] shadow-2xl transition-transform duration-500 ease-out overflow-hidden"
        style={{
          width: `${modalWidth}px`,
          height: `${modalHeight}px`,
          left: '50%',
          top: '50%',
          transform,
          transformOrigin: 'center',
        }}
      >
        {/* Modal content here - same as current implementation */}
      </div>
    </div>
  );
};

export default BusinessDetailModal;

/**
 * USAGE IN STORYLIST:
 * 
 * The StoryList component would manage two modal instances:
 * 
 * const [selectedStory, setSelectedStory] = useState<StoryMap | null>(null);
 * const [nextStory, setNextStory] = useState<StoryMap | null>(null);
 * const [isAnimatingOut, setIsAnimatingOut] = useState(false);
 * const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
 * 
 * const handleModalNavigation = (direction: 'prev' | 'next') => {
 *   if (!selectedStory || isAnimatingOut) return;
 *   
 *   const currentIndex = filteredStories.findIndex(s => s.id === selectedStory.id);
 *   const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
 *   
 *   if (targetIndex >= 0 && targetIndex < filteredStories.length) {
 *     const targetStory = filteredStories[targetIndex];
 *     
 *     // Set up the animation
 *     setNextStory(targetStory);
 *     setIsAnimatingOut(true);
 *     setAnimationDirection(direction === 'next' ? 'left' : 'right');
 *     
 *     // After slide animation completes, swap stories
 *     setTimeout(() => {
 *       setSelectedStory(targetStory);
 *       setNextStory(null);
 *       setIsAnimatingOut(false);
 *       setAnimationDirection(null);
 *     }, 500);
 *   }
 * };
 * 
 * Then render both modals:
 * 
 * {selectedStory && (
 *   <BusinessDetailModal
 *     story={selectedStory}
 *     isOpen={modalOpen}
 *     onClose={closeModal}
 *     originRect={originRect}
 *     onNavigate={handleModalNavigation}
 *     hasPrevious={...}
 *     hasNext={...}
 *     isAnimatingOut={isAnimatingOut}
 *     animationDirection={animationDirection}
 *     startPosition="center"
 *   />
 * )}
 * 
 * {nextStory && isAnimatingOut && (
 *   <BusinessDetailModal
 *     story={nextStory}
 *     isOpen={true}
 *     onClose={closeModal}
 *     originRect={originRect}
 *     onNavigate={handleModalNavigation}
 *     hasPrevious={...}
 *     hasNext={...}
 *     startPosition={animationDirection === 'left' ? 'right' : 'left'}
 *   />
 * )}
 */