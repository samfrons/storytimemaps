'use client';

import Homepage from '../components/Homepage';
// TranslationProvider now in root layout

export default function HomepageRoute() {
  // For client-side component, we'll fetch the data differently
  // or pass it through props from a server component
  return <Homepage businessData={[]} storyMapData={[]} />;
}