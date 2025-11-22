/**
 * Platform detection utilities for mobile native apps
 * Detects iOS, Android, and web environments
 */

import { Capacitor } from '@capacitor/core';

export interface PlatformInfo {
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  platform: 'ios' | 'android' | 'web';
}

/**
 * Get current platform information
 */
export const getPlatform = (): PlatformInfo => {
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();

  return {
    isNative,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web',
    platform: platform as 'ios' | 'android' | 'web',
  };
};

/**
 * Check if running on native mobile platform
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if running on web
 */
export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Get platform-specific CSS class
 */
export const getPlatformClass = (): string => {
  const { platform } = getPlatform();
  return `platform-${platform}`;
};

/**
 * Check if device has notch/safe area
 * (mainly for iOS devices with notches)
 */
export const hasNotch = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check for safe area insets
  const safeAreaTop = getComputedStyle(document.documentElement)
    .getPropertyValue('--sat');

  return safeAreaTop !== '0px' && safeAreaTop !== '';
};
