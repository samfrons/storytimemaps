'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to default theme (moody)
    router.replace('/moody');
  }, [router]);

  return (
    <div className="w-full h-screen bg-[#4a4a57] flex items-center justify-center">
      <div className="text-[#97d8c0] font-mono">Loading...</div>
    </div>
  );
}