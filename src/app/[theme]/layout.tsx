import React from 'react';

// Generate static params for all valid themes (required for static export)
export async function generateStaticParams() {
  const validThemes = ['moody', 'cool', 'warm', 'hot', 'cold', 'bauhaus', 'art-nouveau', 'archival'];
  return validThemes.map((theme) => ({ theme }));
}

export default function ThemeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
