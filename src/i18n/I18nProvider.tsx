'use client';

import React, { ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next from './client';

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Check if i18next is already initialized
      if (i18next.isInitialized) {
        setIsReady(true);
      } else {
        // Wait for initialization
        const checkReady = () => {
          if (i18next.isInitialized) {
            setIsReady(true);
          } else {
            setTimeout(checkReady, 10);
          }
        };
        checkReady();
      }
    } else {
      // On server side, mark as ready immediately
      setIsReady(true);
    }
  }, []);

  // On server side or before ready, just render children without i18next context
  if (typeof window === 'undefined' || !isReady) {
    return <>{children}</>;
  }

  return (
    <I18nextProvider i18n={i18next}>
      {children}
    </I18nextProvider>
  );
};