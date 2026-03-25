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
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/episodes/' + params.id);
        if (!resp.ok) throw new Error('Episode not found');
        setEpisode(await resp.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  // Init audio when episode loads
  useEffect(() => {
    if (!episode) return;
    const scenes = episode.scenes.filter((s) => s.generatedVideo?.url || s.generatedImage?.url);
    audioRefs.current = scenes.map((s) => {
      if (!s.generatedAudio?.url) return null;
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = s.generatedAudio.url;
      return audio;
    });
    return () => { audioRefs.current.forEach((a) => { if (a) { a.pause(); a.removeAttribute('src'); a.load(); } }); };
  }, [episode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading episode...</p>
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">Episode not found</h1>
          <p className="text-purple-300 mb-6">{error || 'This episode may have been deleted.'}</p>
          <Link href="/create" className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600">Create New</Link>
        </div>
      </div>
    );
  }

  const playableScenes = episode.scenes.filter((s) => s.generatedVideo?.url || s.generatedImage?.url);
  const scene = playableScenes[currentScene];
  const hasVideo = !!scene?.generatedVideo?.url;
  const isSlideshow = !playableScenes.some((s) => s.generatedVideo?.url);

  if (!scene) return null;

  const playScene = () => {
    setIsPlaying(true);
    if (hasVideo && videoRef.current) videoRef.current.play().catch(() => {});
    const audio = audioRefs.current[currentScene];
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
  };

  const pauseScene = () => {
    setIsPlaying(false);
    if (videoRef.current) videoRef.current.pause();
    audioRefs.current[currentScene]?.pause();
  };

  const advanceScene = () => {
    if (currentScene < playableScenes.length - 1) {
      const next = currentScene + 1;
      audioRefs.current.forEach((a) => { if (a) { a.pause(); a.currentTime = 0; } });
      setCurrentScene(next);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.play().catch(() => {});
        const a = audioRefs.current[next];
        if (a) { a.currentTime = 0; a.play().catch(() => {}); }
      }, 300);
    } else {
      setIsPlaying(false);
    }
  };

  const goToScene = (i: number) => {
    audioRefs.current.forEach((a) => { if (a) { a.pause(); a.currentTime = 0; } });
    setCurrentScene(i);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 relative flex items-center justify-center">
        {hasVideo ? (
          <video ref={videoRef} key={scene.generatedVideo?.url} src={scene.generatedVideo?.url}
            className="max-w-full max-h-[70vh] rounded-lg"
            onEnded={advanceScene} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} playsInline />
        ) : scene.generatedImage?.url ? (
          <img src={scene.generatedImage.url} alt={scene.title} className="max-w-full max-h-[70vh] rounded-lg object-contain" />
        ) : null}

        {!isPlaying && (
          <button onClick={playScene} className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/30">
              <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </button>
        )}
        {isPlaying && (
          <button onClick={pauseScene} className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center hover:bg-black/70">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
          </button>
        )}

        {isSlideshow && playableScenes.length > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-4 pointer-events-none">
            {currentScene > 0 ? (
              <button onClick={() => goToScene(currentScene - 1)} className="pointer-events-auto w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center hover:bg-black/70">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
            ) : <div />}
            {currentScene < playableScenes.length - 1 ? (
              <button onClick={() => goToScene(currentScene + 1)} className="pointer-events-auto w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center hover:bg-black/70">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            ) : <div />}
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
            <span className="text-purple-400 text-sm">{isSlideshow && '📸 '}Scene {currentScene + 1}/{playableScenes.length}</span>
          </div>
          <div className="flex gap-2 justify-center mb-4">
            {playableScenes.map((_, i) => (
              <button key={i} onClick={() => goToScene(i)}
                className={`h-1.5 rounded-full transition-all ${i === currentScene ? 'w-8 bg-purple-400' : i < currentScene ? 'w-4 bg-green-500' : 'w-4 bg-white/20'}`} />
            ))}
          </div>
          <div className="flex justify-center">
            <Link href="/create" className="px-6 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 text-sm">
              Create Your Own
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
