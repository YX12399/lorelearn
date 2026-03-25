'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Episode } from '../../../types';

export default function EpisodePage() {
  const params = useParams();
  const episodeId = params.id as string;
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load episode from Blob
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/episodes/${episodeId}`);
        if (!res.ok) throw new Error('Episode not found');
        const data = await res.json();
        setEpisode(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [episodeId]);

  // Initialize audio
  useEffect(() => {
    if (!episode) return;

    const elements: (HTMLAudioElement | null)[] = [];
    episode.scenes.forEach((s, i) => {
      if (s.audioUrl) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        audio.src = s.audioUrl;
        elements[i] = audio;
      } else {
        elements[i] = null;
      }
    });
    audioRefs.current = elements;

    return () => {
      elements.forEach(a => { if (a) { a.pause(); a.removeAttribute('src'); a.load(); } });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [episode]);

  const playCurrentAudio = useCallback(() => {
    audioRefs.current.forEach(a => { if (a) { a.pause(); a.currentTime = 0; } });
    const audio = audioRefs.current[currentScene];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(err => console.warn('[Audio] Play failed:', err));
    }
  }, [currentScene]);

  useEffect(() => {
    if (!isPlaying || !episode) return;

    playCurrentAudio();
    const duration = (episode.scenes[currentScene]?.duration || 8) * 1000;
    timerRef.current = setTimeout(() => {
      if (currentScene < episode.scenes.length - 1) {
        setCurrentScene(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, duration);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentScene, playCurrentAudio, episode]);

  const goToScene = (index: number) => {
    audioRefs.current.forEach(a => { if (a) { a.pause(); a.currentTime = 0; } });
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentScene(index);
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRefs.current.forEach(a => { if (a) a.pause(); });
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-pulse text-xl" style={{ color: 'var(--text-muted)' }}>Loading episode...</div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-4xl">&#x1F614;</div>
        <p style={{ color: 'var(--error)' }}>{error || 'Episode not found'}</p>
        <Link href="/create" className="px-4 py-2 rounded-xl text-sm" style={{ background: 'var(--accent)', color: '#fff' }}>
          Create a new episode
        </Link>
      </div>
    );
  }

  const scene = episode.scenes[currentScene];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="text-lg font-bold">{episode.title}</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Scene {currentScene + 1} of {episode.scenes.length}: {scene.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/history" className="px-3 py-1.5 rounded-lg text-sm" style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)' }}>
            History
          </Link>
          <Link href="/create" className="px-3 py-1.5 rounded-lg text-sm" style={{ background: 'var(--accent)', color: '#fff' }}>
            New Topic
          </Link>
        </div>
      </div>

      {/* Scene */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        <div className="w-full max-w-3xl">
          <div
            className="relative rounded-2xl overflow-hidden slide-enter"
            style={{ aspectRatio: '16/9', background: 'var(--surface)' }}
            key={currentScene}
          >
            {scene.videoUrl ? (
              <video src={scene.videoUrl} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
            ) : scene.imageUrl ? (
              <img src={scene.imageUrl} alt={scene.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No image</div>
            )}
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
              <p className="text-white text-sm font-medium">{scene.title}</p>
            </div>
          </div>

          <div className="mt-3 px-2">
            <p className="text-base leading-relaxed">{scene.narration}</p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => goToScene(Math.max(0, currentScene - 1))}
              disabled={currentScene === 0}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: 'var(--surface)', opacity: currentScene === 0 ? 0.5 : 1 }}
            >
              &#9664; Prev
            </button>
            <button onClick={togglePlay} className="px-6 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>
              {isPlaying ? '&#9646;&#9646; Pause' : '&#9654; Play'}
            </button>
            <button
              onClick={() => goToScene(Math.min(episode.scenes.length - 1, currentScene + 1))}
              disabled={currentScene === episode.scenes.length - 1}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: 'var(--surface)', opacity: currentScene === episode.scenes.length - 1 ? 0.5 : 1 }}
            >
              Next &#9654;
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-3">
            {episode.scenes.map((_, i) => (
              <button
                key={i}
                onClick={() => goToScene(i)}
                className="w-3 h-3 rounded-full transition-all"
                style={{
                  background: i === currentScene ? 'var(--accent)' : 'var(--surface-hover)',
                  transform: i === currentScene ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
