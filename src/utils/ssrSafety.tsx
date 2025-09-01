/**
 * SSR Safety Utilities
 * Prevents hydration mismatches by ensuring consistent server/client rendering
 */

import { useEffect, useState } from 'react';

/**
 * Hook to safely determine if we're on the client side
 * Returns false on server, true on client after hydration
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook for safely accessing browser-only APIs
 * Returns null on server, actual value on client
 */
export function useBrowserOnly<T>(getValue: () => T): T | null {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    setValue(getValue());
  }, [getValue]);

  return value;
}

/**
 * Safe localStorage hook that prevents hydration mismatches
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setStoredValue = (newValue: T) => {
    setValue(newValue);
    if (isClient) {
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`Error writing localStorage key "${key}":`, error);
      }
    }
  };

  return [value, setStoredValue];
}

/**
 * Safe date hook that prevents hydration mismatches from Date.now()
 */
export function useCurrentTime(): Date | null {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return currentTime;
}

/**
 * Safe random values that don't cause hydration mismatches
 */
export function useRandomValue(): number | null {
  const [randomValue, setRandomValue] = useState<number | null>(null);

  useEffect(() => {
    setRandomValue(Math.random());
  }, []);

  return randomValue;
}

/**
 * Higher-order component that only renders children on the client
 * Useful for components that use browser-only APIs
 */
export function ClientOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isClient = useIsClient();
  
  if (!isClient) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Safe className builder that prevents hydration mismatches
 * Use this when className depends on client-side state
 */
export function useSafeClassName(
  baseClassName: string,
  conditionalClassNames: Record<string, boolean>,
  fallbackClassName?: string
): string {
  const [safeClassName, setSafeClassName] = useState(
    fallbackClassName || baseClassName
  );

  useEffect(() => {
    const activeClasses = Object.entries(conditionalClassNames)
      .filter(([, condition]) => condition)
      .map(([className]) => className);
    
    setSafeClassName([baseClassName, ...activeClasses].join(' '));
  }, [baseClassName, conditionalClassNames]);

  return safeClassName;
}

/**
 * Safe theme detector that prevents hydration mismatches
 */
export function useSystemTheme(): 'light' | 'dark' | null {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return theme;
}

/**
 * Type guard for checking if code is running on client
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safe URL parameter reader that prevents hydration mismatches
 */
export function useSafeSearchParams(): URLSearchParams | null {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);

  return searchParams;
}

/**
 * Validation function to check for potential hydration issues
 */
export function validateSSRSafety(componentName: string, props: any): void {
  if (process.env.NODE_ENV === 'development') {
    // Check for common hydration pitfalls
    const warnings: string[] = [];

    // Check for Date.now() usage
    const propsString = JSON.stringify(props);
    if (propsString.includes('Date.now()')) {
      warnings.push('Props contain Date.now() which may cause hydration mismatches');
    }

    // Check for Math.random() usage
    if (propsString.includes('Math.random()')) {
      warnings.push('Props contain Math.random() which may cause hydration mismatches');
    }

    // Check for typeof window checks
    if (propsString.includes('typeof window')) {
      warnings.push('Props contain typeof window checks which may cause hydration mismatches');
    }

    if (warnings.length > 0) {
      console.warn(`[SSR Safety] Component "${componentName}" has potential hydration issues:`, warnings);
    }
  }
}