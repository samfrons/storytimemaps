'use client';

import { useEffect, useState } from 'react';

export const useMobileOptimizations = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'fast' | 'unknown'>('unknown');

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    // Detect low-end device based on hardware
    const checkDeviceCapability = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memory = (navigator as any).deviceMemory;
      const cores = navigator.hardwareConcurrency;
      
      // Consider device low-end if < 4GB RAM or < 4 cores
      const lowEnd = (memory && memory < 4) || (cores && cores < 4);
      setIsLowEndDevice(lowEnd);
    };

    // Check for reduced motion preference
    const checkReducedMotion = () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    };

    // Check connection speed
    const checkConnection = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const connection = (navigator as any).connection || 
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (navigator as any).mozConnection || 
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (navigator as any).webkitConnection;
      
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          setConnectionSpeed('slow');
        } else if (effectiveType === '4g') {
          setConnectionSpeed('fast');
        } else {
          setConnectionSpeed('unknown');
        }
        
        // Listen for connection changes
        connection.addEventListener('change', checkConnection);
      }
    };

    checkMobile();
    checkDeviceCapability();
    checkReducedMotion();
    checkConnection();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Get optimized settings based on device capabilities
  const getOptimizedSettings = () => {
    if (isLowEndDevice || connectionSpeed === 'slow') {
      return {
        maxMarkers: 50,        // Fewer markers on low-end devices
        clusterRadius: 80,     // More aggressive clustering
        animationDuration: 0,  // No animations
        imageQuality: 60,      // Lower image quality
        enableTransitions: false,
        preloadData: false,
        mapStyle: 'basic'      // Simpler map style
      };
    }
    
    if (isMobile) {
      return {
        maxMarkers: 100,       // Moderate marker count
        clusterRadius: 60,     // Standard clustering
        animationDuration: reducedMotion ? 0 : 300,
        imageQuality: 75,
        enableTransitions: !reducedMotion,
        preloadData: connectionSpeed === 'fast',
        mapStyle: 'standard'
      };
    }
    
    // Desktop defaults
    return {
      maxMarkers: 200,
      clusterRadius: 40,
      animationDuration: reducedMotion ? 0 : 500,
      imageQuality: 85,
      enableTransitions: !reducedMotion,
      preloadData: true,
      mapStyle: 'detailed'
    };
  };

  return {
    isMobile,
    isLowEndDevice,
    reducedMotion,
    connectionSpeed,
    settings: getOptimizedSettings()
  };
};