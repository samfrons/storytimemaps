'use client';

import Homepage from '../components/Homepage';
import { TranslationProvider } from '../../i18n/TranslationContext';

export default function HomepageRoute() {
  // For client-side component, we'll fetch the data differently
  // or pass it through props from a server component
  return (
    <TranslationProvider>
      <Homepage businessData={[]} storyMapData={[]} />
    </TranslationProvider>
  );
}