'use client';

import { useState, useCallback } from 'react';
import { ChildProfile, Episode } from '@/types';

type StoryStage = 'idle' | 'generating' | 'success' | 'error';

interface UseStoryGenerationReturn {
  stage: StoryStage;
  episode: Episode | null;
  error: string | null;
  generate: (profile: ChildProfile) => Promise<Episode | null>;
  reset: () => void;
}

export function useStoryGeneration(): UseStoryGenerationReturn {
  const [stage, setStage] = useState<StoryStage>('idle');
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (profile: ChildProfile): Promise<Episode | null> => {
    setStage('generating');
    setError(null);
    setEpisode(null);

    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Story generation failed (${response.status})`);
      }

      const data = await response.json();
      const generated: Episode = data.episode;
      setEpisode(generated);
      setStage('success');

      // Persist to sessionStorage so the viewer page can load it
      try {
        sessionStorage.setItem(`episode_${generated.id}`, JSON.stringify(generated));
      } catch {
        // quota exceeded — ignore
      }

      return generated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setStage('error');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStage('idle');
    setEpisode(null);
    setError(null);
  }, []);

  return { stage, episode, error, generate, reset };
}
