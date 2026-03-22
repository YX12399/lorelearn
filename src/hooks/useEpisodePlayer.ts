'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Episode, Scene } from '@/types';

type PlayerState = 'idle' | 'playing' | 'paused' | 'interactive' | 'complete';

interface UseEpisodePlayerReturn {
  state: PlayerState;
  currentScene: Scene | undefined;
  currentIndex: number;
  totalScenes: number;
  volume: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  goNext: () => void;
  goPrev: () => void;
  goToScene: (index: number) => void;
  setVolume: (v: number) => void;
  triggerInteractive: () => void;
  dismissInteractive: () => void;
  reset: () => void;
}

export function useEpisodePlayer(episode: Episode | null): UseEpisodePlayerReturn {
  const [state, setState] = useState<PlayerState>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentScene = episode?.scenes[currentIndex];
  const totalScenes = episode?.scenes.length ?? 0;
  const isPlaying = state === 'playing';

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    setState('playing');
    audioRef.current?.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    setState('paused');
    audioRef.current?.pause();
    clearTimer();
  }, [clearTimer]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const goNext = useCallback(() => {
    if (!episode) return;
    clearTimer();
    if (currentIndex < episode.scenes.length - 1) {
      setCurrentIndex((i) => i + 1);
      setState('playing');
    } else {
      setState('complete');
    }
  }, [episode, currentIndex, clearTimer]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      clearTimer();
      setCurrentIndex((i) => i - 1);
      setState('playing');
    }
  }, [currentIndex, clearTimer]);

  const goToScene = useCallback(
    (index: number) => {
      if (!episode || index < 0 || index >= episode.scenes.length) return;
      clearTimer();
      setCurrentIndex(index);
      setState('playing');
    },
    [episode, clearTimer]
  );

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const triggerInteractive = useCallback(() => {
    setState('interactive');
    audioRef.current?.pause();
    clearTimer();
  }, [clearTimer]);

  const dismissInteractive = useCallback(() => {
    setState('playing');
    audioRef.current?.play().catch(() => {});
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setCurrentIndex(0);
    setState('idle');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, [clearTimer]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying || !currentScene) return;
    clearTimer();

    const hasInteractive = !!currentScene.interactiveMoment;
    const fullDuration = currentScene.duration * 1000;

    if (hasInteractive) {
      timerRef.current = setTimeout(triggerInteractive, fullDuration / 2);
    } else {
      timerRef.current = setTimeout(goNext, fullDuration);
    }

    return clearTimer;
  }, [isPlaying, currentIndex, currentScene, goNext, triggerInteractive, clearTimer]);

  // Load audio on scene change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audioUrl = currentScene?.generatedAudio?.url;
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.volume = volume;
    audioRef.current = audio;

    if (isPlaying) audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!episode) return;

    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.code === 'ArrowRight') goNext();
      if (e.code === 'ArrowLeft') goPrev();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [episode, toggle, goNext, goPrev]);

  return {
    state,
    currentScene,
    currentIndex,
    totalScenes,
    volume,
    isPlaying,
    play,
    pause,
    toggle,
    goNext,
    goPrev,
    goToScene,
    setVolume,
    triggerInteractive,
    dismissInteractive,
    reset,
  };
}
