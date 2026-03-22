'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { Episode, Scene, ZoneOfRegulation } from '@/types';
import EmotionCheckIn from '@/components/viewer/EmotionCheckIn';
import BreathingExercise from '@/components/viewer/BreathingExercise';
import ChoicePoint from '@/components/viewer/ChoicePoint';

interface PageProps {
  params: Promise<{ episodeId: string }>;
}

const ZONE_STYLES: Record<ZoneOfRegulation, { badge: string; label: string }> = {
  green: { badge: 'bg-green-100 text-green-700 border-green-300', label: 'Green Zone' },
  yellow: { badge: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Yellow Zone' },
  blue: { badge: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Blue Zone' },
  red: { badge: 'bg-red-100 text-red-700 border-red-300', label: 'Red Zone' },
};

type OverlayType = 'emotion_check' | 'breathing' | 'choice' | null;

function SceneView({ scene, isActive }: { scene: Scene; isActive: boolean }) {
  const zoneStyle = ZONE_STYLES[scene.emotionBeat.zone];

  return (
    <div
      className={`transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
    >
      {/* Media */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl overflow-hidden mb-4 shadow-lg">
        {scene.generatedVideo?.url ? (
          <video
            src={scene.generatedVideo.url}
            autoPlay
            loop
            muted={false}
            playsInline
            className="w-full h-full object-cover"
          />
        ) : scene.generatedImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={scene.generatedImage.url}
            alt={scene.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-gray-400 text-sm italic">{scene.visualPrompt.substring(0, 100)}…</p>
          </div>
        )}

        {/* Zone badge */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border ${zoneStyle.badge}`}>
          {zoneStyle.label}
        </div>
      </div>

      {/* Narration */}
      <div className="bg-gray-900 bg-opacity-90 rounded-xl px-6 py-4 mb-3">
        <p className="text-white text-lg font-medium leading-relaxed text-center">{scene.narration}</p>
      </div>

      {/* Dialogue */}
      {scene.dialogue.length > 0 && (
        <div className="space-y-2 mb-3">
          {scene.dialogue.map((line, i) => (
            <div key={i} className="bg-blue-50 rounded-xl px-5 py-3 border border-blue-100">
              <span className="font-bold text-blue-700 text-sm">{line.speaker}: </span>
              <span className="text-gray-800">{line.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Teaching moment */}
      {scene.emotionBeat.teachingMoment && (
        <div className="bg-purple-50 rounded-xl px-5 py-3 border border-purple-100">
          <p className="text-sm font-semibold text-purple-700">💡 {scene.emotionBeat.teachingMoment}</p>
        </div>
      )}
    </div>
  );
}

function CompletedScreen({ episode, onRestart }: { episode: Episode; onRestart: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl p-12 max-w-md w-full shadow-xl text-center">
        <div className="text-6xl mb-4">🌟</div>
        <h1 className="text-3xl font-bold text-green-700 mb-2">Amazing job!</h1>
        <p className="text-gray-600 mb-2">You finished:</p>
        <p className="text-xl font-bold text-gray-900 mb-6">{episode.title}</p>
        <div className="bg-green-50 rounded-2xl p-4 mb-6 border border-green-100">
          <p className="text-green-700 font-medium text-sm">{episode.learningObjective}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onRestart}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors"
          >
            Watch Again 🔄
          </button>
          <Link
            href="/dashboard"
            className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors block"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ViewerPage({ params }: PageProps) {
  const { episodeId } = use(params);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [overlay, setOverlay] = useState<OverlayType>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load episode from sessionStorage (set by the create flow) or URL
  useEffect(() => {
    const stored = sessionStorage.getItem(`episode_${episodeId}`);
    if (stored) {
      try {
        setEpisode(JSON.parse(stored));
      } catch {
        // ignore parse errors
      }
    }
    setLoading(false);
  }, [episodeId]);

  const currentScene: Scene | undefined = episode?.scenes[currentIndex];
  const totalScenes = episode?.scenes.length ?? 0;

  const goNext = useCallback(() => {
    if (!episode) return;
    if (currentIndex < episode.scenes.length - 1) {
      setCurrentIndex((i) => i + 1);
      setOverlay(null);
    } else {
      setIsComplete(true);
      setIsPlaying(false);
    }
  }, [currentIndex, episode]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setOverlay(null);
    }
  }, [currentIndex]);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying || !currentScene || overlay) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    // Trigger interactive moment at mid-scene
    if (currentScene.interactiveMoment) {
      const half = (currentScene.duration * 1000) / 2;
      timerRef.current = setTimeout(() => {
        const type = currentScene.interactiveMoment!.type;
        if (type === 'emotion_check') setOverlay('emotion_check');
        else if (type === 'pause_and_breathe') setOverlay('breathing');
        else if (type === 'choice') setOverlay('choice');
      }, half);
    } else {
      timerRef.current = setTimeout(goNext, currentScene.duration * 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPlaying, overlay, currentScene, goNext]);

  // Audio narration
  useEffect(() => {
    if (!currentScene?.generatedAudio?.url) return;
    const audio = new Audio(currentScene.generatedAudio.url);
    audio.volume = volume;
    audioRef.current = audio;
    if (isPlaying) audio.play().catch(() => {});
    return () => {
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying && !overlay) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying, overlay]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setIsPlaying((p) => !p); }
      if (e.code === 'ArrowRight') goNext();
      if (e.code === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-3">✨</div>
          <p className="text-gray-500">Loading episode...</p>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 p-8">
        <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-lg">
          <div className="text-4xl mb-3">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Episode not found</h2>
          <p className="text-gray-500 mb-5 text-sm">
            This episode may have expired or the link is invalid. Try generating a new one.
          </p>
          <Link
            href="/create"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create New Episode
          </Link>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <CompletedScreen
        episode={episode}
        onRestart={() => {
          setCurrentIndex(0);
          setIsComplete(false);
          setIsPlaying(true);
        }}
      />
    );
  }

  if (!currentScene) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-700 truncate max-w-xs">{episode.title}</h1>
          <p className="text-xs text-gray-400 truncate max-w-xs">{episode.learningObjective}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {currentIndex + 1} / {totalScenes}
          </span>
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 text-sm">
            ✕
          </Link>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 py-3 bg-white border-b border-gray-50">
        {episode.scenes.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrentIndex(i); setOverlay(null); }}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === currentIndex ? 'bg-blue-500 scale-125' : i < currentIndex ? 'bg-blue-300' : 'bg-gray-200'
            }`}
            aria-label={`Scene ${i + 1}`}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 relative">
        <div className="relative">
          {episode.scenes.map((scene, i) => (
            <div key={scene.id} className={i === currentIndex ? 'relative' : 'absolute inset-0'}>
              <SceneView scene={scene} isActive={i === currentIndex} />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
            aria-label="Previous scene"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="p-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white shadow-md transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={goNext}
            disabled={currentIndex === totalScenes - 1}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
            aria-label="Next scene"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex-1 text-center hidden sm:block">
            <p className="font-semibold text-gray-700 text-sm">{currentScene.title}</p>
            <p className="text-xs text-gray-400">Space to pause · ← → to navigate</p>
          </div>

          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072" />
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-blue-500"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>

      {/* Overlay: Emotion Check-In */}
      {overlay === 'emotion_check' && currentScene.interactiveMoment && (
        <div className="fixed inset-0 bg-purple-900 bg-opacity-70 flex items-center justify-center z-50 p-6">
          <EmotionCheckIn
            characterName={episode.childProfile.name}
            prompt={currentScene.interactiveMoment.prompt}
            onAnswer={() => {}}
            onContinue={() => { setOverlay(null); goNext(); }}
          />
        </div>
      )}

      {/* Overlay: Breathing Exercise */}
      {overlay === 'breathing' && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-80 flex items-center justify-center z-50 p-6">
          <div className="w-full max-w-md">
            <BreathingExercise
              totalRounds={3}
              onComplete={() => { setOverlay(null); goNext(); }}
              onSkip={() => { setOverlay(null); goNext(); }}
            />
          </div>
        </div>
      )}

      {/* Overlay: Choice Point */}
      {overlay === 'choice' && currentScene.interactiveMoment && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-70 flex items-center justify-center z-50 p-6">
          <ChoicePoint
            characterName={episode.childProfile.name}
            prompt={currentScene.interactiveMoment.prompt}
            choices={(currentScene.interactiveMoment.options ?? []).map((opt, i) => ({
              id: String(i),
              text: opt,
              isCorrect: opt === currentScene.interactiveMoment!.correctAnswer,
              feedback:
                opt === currentScene.interactiveMoment!.correctAnswer
                  ? currentScene.interactiveMoment!.encouragement
                  : 'Good try! Every answer helps us learn.',
            }))}
            encouragement={currentScene.interactiveMoment.encouragement}
            onChoose={() => {}}
            onContinue={() => { setOverlay(null); goNext(); }}
          />
        </div>
      )}
    </div>
  );
}
