import { useEffect, useState } from 'react';

/**
 * Hook to check if component is mounted on the client.
 * Useful for preventing hydration mismatches with theme-dependent UI.
 * @returns {boolean} Whether the component is mounted
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}