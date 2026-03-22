'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Redirect to the /create page which has the full episode wizard
export default function DashboardCreateEpisode() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/create');
  }, [router]);

  return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-bounce">✨</div>
        <p className="text-gray-500">Loading episode creator...</p>
      </div>
    </div>
  );
}
