'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProfileForm from '@/components/ProfileForm';
import EpisodePlayer from '@/components/EpisodePlayer';
import { ChildProfile, Episode } from '@/types';

const LOADING_MESSAGES = [
  'Crafting your personalized story...',
  'Weaving in your favorite things...',
  'Building a world just for you...',
  'Adding magical learning moments...',
  'Almost ready for your adventure!',
];

function LoadingSpinner({ name }: { name: string }) {
  const [messageIndex, setMessageIndex] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-3xl p-12 max-w-md w-full shadow-xl text-center">
        <div className="mb-8">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping" />
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">✨</span>
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-blue-700 mb-3">
          Creating {name}&apos;s Adventure!
        </h2>
        <p className="text-gray-500 text-lg transition-all duration-500">
          {LOADING_MESSAGES[messageIndex]}
        </p>
      </div>
    </div>
  );
}

function EpisodePlan({
  episode,
  onGenerateEpisode,
  isGenerating,
}: {
  episode: Episode;
  onGenerateEpisode: () => void;
  isGenerating: boolean;
}) {
  const childName = episode.childProfile.name;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🌟</div>
            <h1 className="text-3xl font-bold text-green-700 mb-2">{episode.title}</h1>
            <p className="text-gray-500 text-lg">{episode.learningObjective}</p>
          </div>

          <div className="space-y-4 mb-8">
            {episode.scenes.map((scene, index) => (
              <div
                key={scene.id}
                className="flex gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-800 mb-1">{scene.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{scene.narration}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        scene.emotionBeat.zone === 'green'
                          ? 'bg-green-100 text-green-700'
                          : scene.emotionBeat.zone === 'yellow'
                          ? 'bg-yellow-100 text-yellow-700'
                          : scene.emotionBeat.zone === 'blue'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {scene.emotionBeat.primaryEmotion}
                    </span>
                    {scene.interactiveMoment && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                        Interactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm mb-6">
            This story is uniquely crafted for {childName} and incorporates their favorite interests.
          </p>

          <button
            onClick={onGenerateEpisode}
            disabled={isGenerating}
            className="w-full py-5 px-8 bg-gradient-to-r from-green-500 to-blue-600 text-white text-xl font-bold rounded-2xl shadow-lg hover:from-green-600 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Episode...
              </span>
            ) : (
              `Watch ${childName}'s Episode! 🎬`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  const [stage, setStage] = useState<
    'form' | 'loading_story' | 'episode_plan' | 'generating_episode' | 'playing'
  >('form');
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProfileSubmit = async (profile: ChildProfile) => {
    setStage('loading_story');
    setError(null);

    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate story');
      }

      const data = await response.json();
      setEpisode(data.episode);
      setStage('episode_plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStage('form');
    }
  };

  const handleGenerateEpisode = async () => {
    if (!episode) return;
    setStage('playing');
  };

  if (stage === 'loading_story') {
    return <LoadingSpinner name={episode?.childProfile.name ?? 'your child'} />;
  }

  if ((stage === 'episode_plan' || stage === 'generating_episode') && episode) {
    return (
      <EpisodePlan
        episode={episode}
        onGenerateEpisode={handleGenerateEpisode}
        isGenerating={stage === 'generating_episode'}
      />
    );
  }

  if (stage === 'playing' && episode) {
    return (
      <EpisodePlayer
        episode={episode}
        onComplete={() => setStage('episode_plan')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Back nav */}
      <div className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
      </div>

      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-300 text-red-700 px-6 py-3 rounded-xl shadow-lg z-50 max-w-sm">
          <p className="font-semibold">Oops!</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <ProfileForm onSubmit={handleProfileSubmit} isLoading={false} />
    </div>
  );
}
