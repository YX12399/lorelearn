'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Episode, Scene, InteractiveMoment } from '@/types';
import { ZONE_COLORS } from '@/lib/emotions';

interface EpisodePlayerProps {
  episode: Episode;
  onComplete?: () => void;
}

function InteractiveMomentModal({
  moment,
  onClose,
}: {
  moment: InteractiveMoment;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleAnswer = (option: string) => {
    setSelected(option);
    setAnswered(true);
    setTimeout(() => onClose(), 2000);
  };

  if (moment.type === 'pause_and_breathe') {
    return (
      <div className="fixed inset-0 bg-blue-900 bg-opacity-80 flex items-center justify-center z-50 p-8">
        <div className="bg-white rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl">
          <div className="text-6xl mb-4">🌬️</div>
          <h2 className="text-2xl font-bold text-blue-700 mb-4">Let&apos;s Take a Breath</h2>
          <p className="text-lg text-gray-600 mb-8">{moment.prompt}</p>
          <button
            onClick={onClose}
            className="px-8 py-4 bg-blue-500 text-white text-lg font-bold rounded-2xl hover:bg-blue-600 transition-colors"
          >
            I&apos;m ready! ✨
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-purple-900 bg-opacity-80 flex items-center justify-center z-50 p-8">
      <div className="bg-white rounded-3xl p-10 max-w-lg w-full shadow-2xl">
        <h2 className="text-xl font-bold text-purple-700 mb-6 text-center">{moment.prompt}</h2>
        {moment.options && (
          <div className="space-y-3 mb-6">
            {moment.options.map(option => {
              const isCorrect = option === moment.correctAnswer;
              const isSelected = selected === option;
              let btnClass = 'w-full py-4 px-6 rounded-2xl text-left text-base font-semibold transition-all ';
              if (answered) {
                if (isCorrect) btnClass += 'bg-green-100 border-2 border-green-500 text-green-800';
                else if (isSelected) btnClass += 'bg-red-100 border-2 border-red-400 text-red-800';
                else btnClass += 'bg-gray-100 text-gray-400 border-2 border-transparent';
              } else {
                btnClass += 'bg-purple-50 border-2 border-purple-200 text-purple-800 hover:border-purple-500 hover:bg-purple-100';
              }
              return (
                <button
                  key={option}
                  className={btnClass}
                  onClick={() => !answered && handleAnswer(option)}
                  disabled={answered}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}
        {answered && (
          <div className="text-center py-4">
            <p className="text-xl font-bold text-green-600">{moment.encouragement}</p>
          </div>
        )}
        {!answered && moment.type !== 'question' && (
          <button
            onClick={onClose}
            className="w-full py-4 px-6 bg-purple-500 text-white text-lg font-bold rounded-2xl hover:bg-purple-600 transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

function SceneDisplay({ scene, isActive }: { scene: Scene; isActive: boolean }) {
  const zoneColors = ZONE_COLORS[scene.emotionBeat.zone];

  return (
    <div className={`transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}>
      {/* Scene Image/Video */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl overflow-hidden mb-4">
        {scene.generatedVideo?.url ? (
          <video
            src={scene.generatedVideo.url}
            autoPlay
            loop
            muted
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
            <div className="text-5xl mb-4">✨</div>
            <p className="text-gray-500 text-sm italic">{scene.visualPrompt.substring(0, 120)}...</p>
          </div>
        )}

        {/* Emotion Zone Badge */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border ${zoneColors.bg} ${zoneColors.text} ${zoneColors.border}`}>
          {zoneColors.label}
        </div>
      </div>

      {/* Narration Subtitles */}
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

      {/* Teaching Moment */}
      {scene.emotionBeat.teachingMoment && (
        <div className={`rounded-xl px-5 py-3 border ${zoneColors.bg} ${zoneColors.border}`}>
          <p className={`text-sm font-semibold ${zoneColors.text}`}>
            💡 {scene.emotionBeat.teachingMoment}
          </p>
        </div>
      )}
    </div>
  );
}

export default function EpisodePlayer({ episode, onComplete }: EpisodePlayerProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showInteractive, setShowInteractive] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentScene = episode.scenes[currentSceneIndex];
  const totalScenes = episode.scenes.length;

  const goToNextScene = useCallback(() => {
    if (currentSceneIndex < totalScenes - 1) {
      setCurrentSceneIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      onComplete?.();
    }
  }, [currentSceneIndex, totalScenes, onComplete]);

  const goToPrevScene = useCallback(() => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
    }
  }, [currentSceneIndex]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying) return;
    if (!currentScene) return;

    // Check for interactive moment
    if (currentScene.interactiveMoment) {
      const pauseDelay = (currentScene.duration * 1000) / 2;
      const pauseTimer = setTimeout(() => setShowInteractive(true), pauseDelay);
      return () => clearTimeout(pauseTimer);
    }

    timerRef.current = setTimeout(() => {
      goToNextScene();
    }, currentScene.duration * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentSceneIndex, isPlaying, currentScene, goToNextScene]);

  // Play audio narration
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
  }, [currentSceneIndex]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      }
      if (e.code === 'ArrowRight') goToNextScene();
      if (e.code === 'ArrowLeft') goToPrevScene();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goToNextScene, goToPrevScene]);

  // Pause/resume audio
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying]);

  if (!currentScene) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-700">{episode.title}</h1>
          <p className="text-sm text-gray-500">{episode.learningObjective}</p>
        </div>
        <div className="text-sm font-medium text-gray-500">
          Scene {currentSceneIndex + 1} of {totalScenes}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 py-3 bg-white">
        {episode.scenes.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSceneIndex(i)}
            className={`w-3 h-3 rounded-full transition-all ${
              i === currentSceneIndex
                ? 'bg-blue-500 scale-125'
                : i < currentSceneIndex
                ? 'bg-blue-300'
                : 'bg-gray-200'
            }`}
            aria-label={`Go to scene ${i + 1}`}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 relative">
        <div className="relative">
          {episode.scenes.map((scene, i) => (
            <div key={scene.id} className={i === currentSceneIndex ? 'relative' : 'absolute inset-0 pointer-events-none'}>
              <SceneDisplay scene={scene} isActive={i === currentSceneIndex} />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {/* Previous */}
          <button
            onClick={goToPrevScene}
            disabled={currentSceneIndex === 0}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
            aria-label="Previous scene"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="p-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-md"
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

          {/* Next */}
          <button
            onClick={goToNextScene}
            disabled={currentSceneIndex === totalScenes - 1}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
            aria-label="Next scene"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Scene Title */}
          <div className="flex-1 text-center">
            <p className="font-semibold text-gray-700">{currentScene.title}</p>
            <p className="text-xs text-gray-400">Press Space to pause</p>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072" />
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="w-24 accent-blue-500"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>

      {/* Interactive Moment Modal */}
      {showInteractive && currentScene.interactiveMoment && (
        <InteractiveMomentModal
          moment={currentScene.interactiveMoment}
          onClose={() => {
            setShowInteractive(false);
            goToNextScene();
          }}
        />
      )}
    </div>
  );
}
