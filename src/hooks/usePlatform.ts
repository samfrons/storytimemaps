/**
 * React hook for platform detection and native features
 */

'use client';

import { useState, useEffect } from 'react';
import { getPlatform, type PlatformInfo } from '@/utils/platform';

export const usePlatform = (): PlatformInfo => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    isNative: false,
    isIOS: false,
    isAndroid: false,
    isWeb: true,
    platform: 'web',
  });

  useEffect(() => {
    // Update platform info on mount
    setPlatformInfo(getPlatform());
  }, []);

  return platformInfo;
};

/**
 * Hook for safe area insets (iOS notch support)
 */
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);

      setSafeArea({
        top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
        bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
        right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
      });
    };

    updateSafeArea();

    // Update on orientation change
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
};
