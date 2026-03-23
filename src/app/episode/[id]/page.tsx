'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Episode } from '@/types';

export default function EpisodeViewerPage({ params }: { params: { id: string } }) {
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchEpisode = async () => {
      try {
        const response = await fetch('/api/episodes/' + params.id);
        if (!response.ok) {
          throw new Error('Episode not found');
        }
        const data = await response.json();
        setEpisode(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load episode');
        console.error('Error loading episode:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisode();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading episode...</p>
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">Oops!</h1>
          <p className="text-purple-300 mb-6">{error || 'Episode not found'}</p>
          <Link href="/" className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            Back Home
          </Link>
        </div>
      </div>
    );
  }

  const scene = episode.scenes[currentScene];
  if (!scene) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <p className="text-white">No scenes available</p>
      </div>
    );
  }

  const handleVideoEnded = () => {
    if (currentScene < episode.scenes.length - 1) {
      setCurrentScene(currentScene + 1);
      setIsPlaying(false);
    }
  };

  const playScene = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseScene = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const goToScene = (idx: number) => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setCurrentScene(idx);
    setIsPlaying(false);
  };

  const getSceneButtonClass = (i: number) => {
    if (i === currentScene) return 'w-8 bg-purple-400';
    if (i < currentScene) return 'w-4 bg-green-500';
    return 'w-4 bg-white/20';
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 relative flex items-center justify-center">
        {scene.generatedVideo?.url ? (
          <>
            <video
              ref={videoRef}
              key={scene.generatedVideo.url}
              src={scene.generatedVideo.url}
              className="max-w-full max-h-[70vh] rounded-lg"
              onEnded={handleVideoEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              playsInline
            />
            {!isPlaying && (
              <button
                onClick={playScene}
                className="absolute inset-0 flex items-center justify-center bg-black/40"
              >
                <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}
            {isPlaying && (
              <button
                onClick={pauseScene}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center hover:bg-black/70 transition-all"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-96 bg-gray-900 rounded-lg">
            <p className="text-white">Video not available</p>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/70 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
            <p className="text-white text-sm leading-relaxed">{scene.narration}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-t from-black to-transparent p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">{episode.title}</h2>
            <span className="text-purple-400 text-sm">Scene {currentScene + 1} of {episode.scenes.length}</span>
          </div>

          <div className="flex gap-2 justify-center mb-6">
            {episode.scenes.map((_, i) => (
              <button
                key={i}
                onClick={() => goToScene(i)}
                className={'h-1.5 rounded-full transition-all ' + getSceneButtonClass(i)}
              />
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              href="/"
              className="px-6 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 text-sm transition-colors"
            >
              Create New Story
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
