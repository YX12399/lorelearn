'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EpisodePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl p-12 max-w-md w-full shadow-xl text-center">
        <div className="text-5xl mb-4">🎬</div>
        <h1 className="text-2xl font-bold text-blue-700 mb-3">Episode {id}</h1>
        <p className="text-gray-500 mb-8">
          Episodes are generated fresh each time. Return to the home page to create a new adventure!
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-8 py-4 bg-blue-500 text-white text-lg font-bold rounded-2xl hover:bg-blue-600 transition-colors"
        >
          Create New Adventure
        </button>
      </div>
    </div>
  );
}
