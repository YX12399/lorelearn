'use client';

import { useState, useCallback } from 'react';
import { Episode, Scene, PipelineState } from '@/types';

type VideoStage = 'idle' | 'generating_images' | 'generating_video' | 'generating_voice' | 'complete' | 'error';

interface UseVideoGenerationReturn {
  stage: VideoStage;
  pipeline: PipelineState | null;
  enrichedEpisode: Episode | null;
  error: string | null;
  generate: (episode: Episode) => Promise<Episode | null>;
  reset: () => void;
}

async function generateSceneImage(
  scene: Scene,
  characterReferenceUrl?: string
): Promise<string | null> {
  const response = await fetch('/api/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sceneId: scene.id,
      prompt: scene.visualPrompt,
      characterReferenceUrl,
    }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.imageUrl ?? null;
}

async function generateSceneVideo(
  scene: Scene,
  imageUrl: string
): Promise<string | null> {
  const response = await fetch('/api/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sceneId: scene.id,
      imageUrl,
      prompt: scene.visualPrompt,
      duration: scene.duration,
    }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.videoUrl ?? null;
}

async function generateSceneVoice(
  scene: Scene,
  voiceTone: 'calm' | 'warm' | 'energetic'
): Promise<{ audioUrl: string; duration: number } | null> {
  const text = [
    scene.narration,
    ...scene.dialogue.map((d) => `${d.speaker}: ${d.text}`),
  ].join(' ');

  const response = await fetch('/api/voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sceneId: scene.id, text, voiceTone }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return { audioUrl: data.audioUrl, duration: data.duration };
}

export function useVideoGeneration(): UseVideoGenerationReturn {
  const [stage, setStage] = useState<VideoStage>('idle');
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [enrichedEpisode, setEnrichedEpisode] = useState<Episode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (episode: Episode): Promise<Episode | null> => {
    setStage('generating_images');
    setError(null);

    const sceneProgress = episode.scenes.map((s) => ({
      sceneId: s.id,
      imageStatus: 'pending' as const,
      videoStatus: 'pending' as const,
      voiceStatus: 'pending' as const,
    }));

    const initialPipeline: PipelineState = {
      episodeId: episode.id,
      currentStage: 'images',
      progress: 0,
      sceneProgress,
    };
    setPipeline(initialPipeline);

    const voiceTone = episode.childProfile.sensoryPreferences.preferredVoiceTone;
    const characterRefUrl = episode.continuityBible.characterReferenceImageUrl;

    let workingEpisode = { ...episode, scenes: [...episode.scenes] };

    try {
      // Stage 1: Generate images for all scenes in parallel
      const imageResults = await Promise.allSettled(
        workingEpisode.scenes.map((scene) => generateSceneImage(scene, characterRefUrl))
      );

      workingEpisode = {
        ...workingEpisode,
        scenes: workingEpisode.scenes.map((scene, i) => {
          const result = imageResults[i];
          if (result.status === 'fulfilled' && result.value) {
            return {
              ...scene,
              generatedImage: {
                url: result.value,
                prompt: scene.visualPrompt,
                isCharacterReference: false,
                frameIndex: i,
              },
            };
          }
          return scene;
        }),
      };

      setPipeline((p) =>
        p ? { ...p, currentStage: 'video', progress: 33 } : p
      );
      setStage('generating_video');

      // Stage 2: Generate video for each scene sequentially (to avoid API rate limits)
      for (let i = 0; i < workingEpisode.scenes.length; i++) {
        const scene = workingEpisode.scenes[i];
        const imageUrl = scene.generatedImage?.url;
        if (!imageUrl) continue;

        const videoUrl = await generateSceneVideo(scene, imageUrl);
        if (videoUrl) {
          workingEpisode = {
            ...workingEpisode,
            scenes: workingEpisode.scenes.map((s, idx) =>
              idx === i
                ? {
                    ...s,
                    generatedVideo: {
                      url: videoUrl,
                      duration: scene.duration,
                      prompt: scene.visualPrompt,
                    },
                  }
                : s
            ),
          };
        }

        setPipeline((p) =>
          p
            ? {
                ...p,
                progress: 33 + Math.round((i / workingEpisode.scenes.length) * 33),
              }
            : p
        );
      }

      setPipeline((p) =>
        p ? { ...p, currentStage: 'voice', progress: 66 } : p
      );
      setStage('generating_voice');

      // Stage 3: Generate voice narration for all scenes
      const voiceResults = await Promise.allSettled(
        workingEpisode.scenes.map((scene) => generateSceneVoice(scene, voiceTone))
      );

      workingEpisode = {
        ...workingEpisode,
        scenes: workingEpisode.scenes.map((scene, i) => {
          const result = voiceResults[i];
          if (result.status === 'fulfilled' && result.value) {
            return {
              ...scene,
              generatedAudio: {
                url: result.value.audioUrl,
                text: scene.narration,
                voiceId: voiceTone,
                duration: result.value.duration,
              },
            };
          }
          return scene;
        }),
        status: 'complete' as const,
      };

      setPipeline((p) => p ? { ...p, currentStage: 'complete', progress: 100 } : p);
      setStage('complete');
      setEnrichedEpisode(workingEpisode);

      // Update sessionStorage with enriched episode
      try {
        sessionStorage.setItem(`episode_${workingEpisode.id}`, JSON.stringify(workingEpisode));
      } catch {
        // quota exceeded — ignore
      }

      return workingEpisode;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Video generation failed';
      setError(message);
      setStage('error');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStage('idle');
    setPipeline(null);
    setEnrichedEpisode(null);
    setError(null);
  }, []);

  return { stage, pipeline, enrichedEpisode, error, generate, reset };
}
