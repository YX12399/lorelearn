'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import type { Episode, Scene, EpisodeHistoryItem } from '../../types';

// ── Helpers ──────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function saveToLocalHistory(episode: Episode) {
  try {
    const key = 'lorelearn_history';
    const raw = localStorage.getItem(key);
    const list: EpisodeHistoryItem[] = raw ? JSON.parse(raw) : [];
    // Remove existing entry with same id
    const filtered = list.filter(e => e.id !== episode.id);
    filtered.unshift({
      id: episode.id,
      title: episode.title,
      topic: episode.topic,
      thumbnailUrl: episode.scenes[0]?.imageUrl,
      createdAt: episode.createdAt,
    });
    // Keep last 50
    localStorage.setItem(key, JSON.stringify(filtered.slice(0, 50)));
    console.log('[History] Saved to localStorage:', episode.id);
  } catch (err) {
    console.warn('[History] localStorage save failed:', err);
  }
}

async function saveToBlob(episode: Episode) {
  try {
    const res = await fetch(`/api/episodes/${episode.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(episode),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log('[Blob] Saved episode:', episode.id);
    return true;
  } catch (err) {
    console.warn('[Blob] Save failed:', err);
    return false;
  }
}

// ── Types for pipeline state ─────────────────────────────────────

type Stage = 'input' | 'generating' | 'playing';

interface PipelineProgress {
  phase: string;
  detail: string;
  percent: number;
}

// ── Topic Suggestions ────────────────────────────────────────────

const TOPIC_SUGGESTIONS = [
  'Why is the sky blue?',
  'How do volcanoes work?',
  'Why do we dream?',
  'How do airplanes fly?',
  'What makes rainbows appear?',
  'How does the internet work?',
  'Why do leaves change color?',
  'How do magnets work?',
  'What are black holes?',
  'How do our eyes see color?',
  'Why does the moon change shape?',
  'How do plants eat sunlight?',
];

// ── Main Page Component ──────────────────────────────────────────

export default function CreatePage() {
  const [stage, setStage] = useState<Stage>('input');
  const [topic, setTopic] = useState('');
  const [age, setAge] = useState(7);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [progress, setProgress] = useState<PipelineProgress>({ phase: '', detail: '', percent: 0 });
  const [error, setError] = useState<string | null>(null);

  // ── Generation Pipeline ──────────────────────────────────────

  const runPipeline = useCallback(async () => {
    const episodeId = generateId();
    setStage('generating');
    setError(null);

    try {
      // ── Phase 1: Story Generation ──
      setProgress({ phase: 'Writing your story', detail: 'Planning the learning journey...', percent: 5 });

      const storyRes = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, age }),
      });

      if (!storyRes.ok) {
        const err = await storyRes.json();
        throw new Error(err.error || 'Story generation failed');
      }

      const story = await storyRes.json();
      const scenes: Scene[] = story.scenes.map((s: Scene) => ({
        title: s.title,
        narration: s.narration,
        visualPrompt: s.visualPrompt,
        duration: s.duration || 8,
      }));

      setProgress({ phase: 'Story ready!', detail: `"${story.title}" — ${scenes.length} scenes`, percent: 15 });

      // ── Phase 2: Image Generation (parallel) ──
      setProgress({ phase: 'Creating illustrations', detail: 'Generating scene images...', percent: 20 });

      const imagePromises = scenes.map((scene, i) =>
        fetch('/api/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: scene.visualPrompt, episodeId, sceneIndex: i }),
        })
          .then(r => r.json())
          .then(data => {
            scenes[i].imageUrl = data.imageUrl || undefined;
            setProgress({
              phase: 'Creating illustrations',
              detail: `Image ${i + 1} of ${scenes.length} done`,
              percent: 20 + ((i + 1) / scenes.length) * 25,
            });
          })
          .catch(err => {
            console.error(`[Image ${i}] Failed:`, err);
          })
      );

      await Promise.all(imagePromises);

      // ── Phase 3: Voice Generation (parallel) ──
      setProgress({ phase: 'Recording narration', detail: 'Generating voices...', percent: 50 });

      const voicePromises = scenes.map((scene, i) =>
        fetch('/api/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: scene.narration, episodeId, sceneIndex: i }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.audioUrl) {
              scenes[i].audioUrl = data.audioUrl;
              scenes[i].duration = Math.max(scenes[i].duration, Math.ceil(data.duration || 5));
            }
            setProgress({
              phase: 'Recording narration',
              detail: `Voice ${i + 1} of ${scenes.length} done`,
              percent: 50 + ((i + 1) / scenes.length) * 20,
            });
          })
          .catch(err => {
            console.error(`[Voice ${i}] Failed:`, err);
          })
      );

      await Promise.all(voicePromises);

      // ── Phase 4: SAVE EPISODE (before video) ──
      setProgress({ phase: 'Saving your episode', detail: 'Storing to cloud...', percent: 75 });

      const now = new Date().toISOString();
      const ep: Episode = {
        id: episodeId,
        topic,
        age,
        title: story.title,
        scenes,
        createdAt: now,
        thumbnailUrl: scenes[0]?.imageUrl,
      };

      // Save to both localStorage and Blob
      saveToLocalHistory(ep);
      await saveToBlob(ep);

      // Set episode and switch to player
      setEpisode(ep);
      setStage('playing');
      setProgress({ phase: 'Ready!', detail: 'Your episode is ready to play', percent: 80 });

      // ── Phase 5: Video Generation (background, sequential) ──
      // This happens AFTER the episode is playable as a slideshow
      let anyVideoGenerated = false;
      for (let i = 0; i < scenes.length; i++) {
        try {
          const videoRes = await fetch('/api/video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: scenes[i].visualPrompt,
              episodeId,
              sceneIndex: i,
              imageUrl: scenes[i].imageUrl,
            }),
          });
          const videoData = await videoRes.json();
          if (videoData.videoUrl) {
            scenes[i].videoUrl = videoData.videoUrl;
            anyVideoGenerated = true;
            // Update episode in state
            setEpisode(prev => prev ? { ...prev, scenes: [...scenes] } : null);
          }
        } catch (err) {
          console.warn(`[Video ${i}] Generation failed, slideshow fallback:`, err);
        }
      }

      // Re-save with video URLs if any were generated
      if (anyVideoGenerated) {
        const updatedEp = { ...ep, scenes };
        saveToLocalHistory(updatedEp);
        await saveToBlob(updatedEp);
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      setStage('input');
    }
  }, [topic, age]);

  // ── Render ─────────────────────────────────────────────────────

  if (stage === 'input') {
    return <TopicInputView
      topic={topic}
      setTopic={setTopic}
      age={age}
      setAge={setAge}
      onGenerate={runPipeline}
      error={error}
    />;
  }

  if (stage === 'generating' && !episode) {
    return <GeneratingView progress={progress} />;
  }

  if (episode) {
    return <PlayerView episode={episode} onNewEpisode={() => { setStage('input'); setEpisode(null); }} />;
  }

  return null;
}

// ── Topic Input View ─────────────────────────────────────────────

function TopicInputView({
  topic, setTopic, age, setAge, onGenerate, error,
}: {
  topic: string;
  setTopic: (t: string) => void;
  age: number;
  setAge: (a: number) => void;
  onGenerate: () => void;
  error: string | null;
}) {
  const [suggestions] = useState(() => {
    const shuffled = [...TOPIC_SUGGESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--accent-glow)' }}>
            LoreLearn
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Turn any question into an animated learning adventure
          </p>
        </div>

        {/* Topic Input */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--surface)' }}>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            What do you want to learn about?
          </label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && topic.trim() && onGenerate()}
            placeholder="e.g. Why is the sky blue?"
            className="w-full px-4 py-3 rounded-xl text-lg outline-none"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--surface-hover)',
              color: 'var(--text)',
            }}
            autoFocus
          />

          {/* Age Selector */}
          <div className="mt-4 flex items-center gap-4">
            <label className="text-sm" style={{ color: 'var(--text-muted)' }}>Age:</label>
            <div className="flex gap-2">
              {[4, 5, 6, 7, 8, 9, 10, 11, 12].map(a => (
                <button
                  key={a}
                  onClick={() => setAge(a)}
                  className="w-9 h-9 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: age === a ? 'var(--accent)' : 'var(--bg)',
                    color: age === a ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${age === a ? 'var(--accent)' : 'var(--surface-hover)'}`,
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={onGenerate}
            disabled={!topic.trim()}
            className="w-full mt-5 py-3 rounded-xl text-lg font-semibold transition-all"
            style={{
              background: topic.trim() ? 'var(--accent)' : 'var(--surface-hover)',
              color: topic.trim() ? '#fff' : 'var(--text-muted)',
              cursor: topic.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Create Episode
          </button>

          {error && (
            <p className="mt-3 text-sm text-center" style={{ color: 'var(--error)' }}>{error}</p>
          )}
        </div>

        {/* Suggestions */}
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Try a question:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => setTopic(s)}
                className="px-3 py-1.5 rounded-lg text-sm transition-all hover:scale-[1.02]"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--surface-hover)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* History Link */}
        <div className="text-center mt-8">
          <Link
            href="/history"
            className="text-sm underline"
            style={{ color: 'var(--text-muted)' }}
          >
            View past episodes
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Generating View ──────────────────────────────────────────────

function GeneratingView({ progress }: { progress: PipelineProgress }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="loading-pulse text-5xl mb-6">&#x2728;</div>
        <h2 className="text-2xl font-bold mb-2">{progress.phase}</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{progress.detail}</p>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress.percent}%`,
              background: `linear-gradient(90deg, var(--accent), var(--accent-glow))`,
            }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          {Math.round(progress.percent)}% — this usually takes 30-60 seconds
        </p>
      </div>
    </div>
  );
}

// ── Player View ──────────────────────────────────────────────────

function PlayerView({ episode, onNewEpisode }: { episode: Episode; onNewEpisode: () => void }) {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState<boolean[]>([]);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scene = episode.scenes[currentScene];
  const totalScenes = episode.scenes.length;

  // Initialize audio elements
  useEffect(() => {
    // Create audio elements for all scenes
    const elements: (HTMLAudioElement | null)[] = [];
    const ready: boolean[] = [];

    episode.scenes.forEach((s, i) => {
      if (s.audioUrl) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';

        audio.addEventListener('canplaythrough', () => {
          ready[i] = true;
          setAudioReady([...ready]);
        });

        audio.addEventListener('error', (e) => {
          console.error(`[Audio ${i}] Load error:`, e);
          ready[i] = false;
          setAudioReady([...ready]);
        });

        audio.src = s.audioUrl;
        elements[i] = audio;
      } else {
        elements[i] = null;
        ready[i] = false;
      }
    });

    audioRefs.current = elements;
    setAudioReady([...ready]);

    return () => {
      // Cleanup
      elements.forEach(a => {
        if (a) {
          a.pause();
          a.removeAttribute('src');
          a.load();
        }
      });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [episode.scenes]);

  // Play audio for current scene
  const playCurrentAudio = useCallback(() => {
    // Pause all audio first
    audioRefs.current.forEach(a => {
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
    });

    const audio = audioRefs.current[currentScene];
    if (audio && audio.readyState >= 3) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(err => console.warn('[Audio] Play failed:', err));
      }
    }
  }, [currentScene]);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying) return;

    playCurrentAudio();

    const duration = (scene.duration || 8) * 1000;
    timerRef.current = setTimeout(() => {
      if (currentScene < totalScenes - 1) {
        setCurrentScene(prev => prev + 1);
      } else {
        setIsPlaying(false); // End of episode
      }
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentScene, playCurrentAudio, scene.duration, totalScenes]);

  const goToScene = (index: number) => {
    // Stop all audio
    audioRefs.current.forEach(a => { if (a) { a.pause(); a.currentTime = 0; } });
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentScene(index);
    if (isPlaying) {
      // Will trigger the useEffect above to play new scene
    }
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--surface)' }}>
        <div>
          <h1 className="text-lg font-bold">{episode.title}</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Scene {currentScene + 1} of {totalScenes}: {scene.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/history"
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)' }}
          >
            History
          </Link>
          <button
            onClick={onNewEpisode}
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            New Topic
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        {/* Scene display */}
        <div className="w-full max-w-3xl">
          <div
            className="relative rounded-2xl overflow-hidden slide-enter"
            style={{ aspectRatio: '16/9', background: 'var(--surface)' }}
            key={currentScene}
          >
            {scene.videoUrl ? (
              <video
                src={scene.videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : scene.imageUrl ? (
              <img
                src={scene.imageUrl}
                alt={scene.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center loading-pulse">
                <span style={{ color: 'var(--text-muted)' }}>No image available</span>
              </div>
            )}

            {/* Scene title overlay */}
            <div
              className="absolute bottom-0 left-0 right-0 px-4 py-3"
              style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
            >
              <p className="text-white text-sm font-medium">{scene.title}</p>
            </div>
          </div>

          {/* Narration text */}
          <div className="mt-3 px-2">
            <p className="text-base leading-relaxed" style={{ color: 'var(--text)' }}>
              {scene.narration}
            </p>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => goToScene(Math.max(0, currentScene - 1))}
              disabled={currentScene === 0}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--surface)',
                color: currentScene === 0 ? 'var(--text-muted)' : 'var(--text)',
                opacity: currentScene === 0 ? 0.5 : 1,
              }}
            >
              &#9664; Prev
            </button>

            <button
              onClick={togglePlay}
              className="px-6 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {isPlaying ? '&#9646;&#9646; Pause' : '&#9654; Play'}
            </button>

            <button
              onClick={() => goToScene(Math.min(totalScenes - 1, currentScene + 1))}
              disabled={currentScene === totalScenes - 1}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--surface)',
                color: currentScene === totalScenes - 1 ? 'var(--text-muted)' : 'var(--text)',
                opacity: currentScene === totalScenes - 1 ? 0.5 : 1,
              }}
            >
              Next &#9654;
            </button>
          </div>

          {/* Scene dots */}
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
