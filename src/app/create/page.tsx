'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChildProfile, Episode } from '@/types';
import { buildSceneImagePrompt, buildSceneVideoPrompt, deriveSceneSeed } from '@/lib/cohesion';
import { PROFILE_PRESETS, type ProfilePreset } from '@/lib/presets';

const CUSTOM_PRESETS_KEY = 'lorelearn_custom_presets';
function getCustomPresets(): Record<string, ProfilePreset> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
import { Provider, PROVIDER_LABELS } from '@/lib/providers';
import { saveEpisodeToHistory, type SavedEpisode } from '@/lib/episode-storage';

// Upload asset to Blob
async function uploadAsset(url: string, type: 'image' | 'video' | 'audio', episodeId: string, sceneIndex: number): Promise<string> {
  try {
    const resp = await fetch('/api/assets/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, type, episodeId, sceneIndex }),
    });
    if (resp.ok) {
      const { permanentUrl } = await resp.json();
      if (permanentUrl) return permanentUrl;
    }
  } catch {}
  return url;
}

// ─── Topic Input ────────────────────────────────────────────────────────────
function TopicInput({
  profile, onSubmit, isLoading, provider, onProviderChange, onPresetSelect,
}: {
  profile: Omit<ChildProfile, 'learningTopic'>;
  onSubmit: (topic: string) => void;
  isLoading: boolean;
  provider: Provider;
  onProviderChange: (p: Provider) => void;
  onPresetSelect: (key: string) => void;
}) {
  const [topic, setTopic] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) onSubmit(topic.trim());
  };

  const suggestions = [
    'How volcanoes erupt',
    'Why the sky is blue',
    'How plants grow from seeds',
    'What makes rainbows appear',
    'How the human heart works',
    'Why dinosaurs went extinct',
  ];

  const { name, age, avatar } = profile;
  const summary = `Age ${age} · ${avatar.hairColor} ${avatar.hairStyle} hair · ${avatar.skinTone} skin · ${avatar.favoriteOutfit}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            LoreLearn
          </h1>
          <p className="text-purple-300 text-lg">Hey {name}! What do you want to learn about today?</p>
          <div className="mt-3 inline-block bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            <p className="text-white/50 text-xs">{summary}</p>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Learner</label>
            <select value="" onChange={(e) => { if (e.target.value) onPresetSelect(e.target.value); }}
              className="w-full py-2.5 px-4 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none cursor-pointer">
              <option value="" disabled className="bg-gray-900">{name} (active)</option>
              {Object.entries({ ...PROFILE_PRESETS, ...getCustomPresets() }).map(([key, preset]) => (
                <option key={key} value={key} className="bg-gray-900">{preset.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Video AI</label>
            <select value={provider} onChange={(e) => onProviderChange(e.target.value as Provider)}
              className="w-full py-2.5 px-4 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none cursor-pointer">
              {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="bg-gray-900">{label}</option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <input ref={inputRef} type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="Type any topic... like 'how black holes work'" disabled={isLoading}
              className="w-full py-5 px-6 pr-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white text-lg placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all disabled:opacity-50" />
            <button type="submit" disabled={!topic.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              )}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {suggestions.map((s) => (
            <button key={s} onClick={() => { setTopic(s); if (!isLoading) onSubmit(s); }} disabled={isLoading}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-purple-300 hover:bg-white/10 hover:border-purple-400/50 transition-all disabled:opacity-30">
              {s}
            </button>
          ))}
        </div>

        <div className="text-center flex gap-4 justify-center">
          <Link href="/profile" className="text-sm text-white/30 hover:text-white/60 transition-colors">Edit profiles</Link>
          <Link href="/history" className="text-sm text-white/30 hover:text-white/60 transition-colors">Episode history</Link>
        </div>
      </div>
    </div>
  );
}

// ─── Generation Progress ────────────────────────────────────────────────────
type GenerationStage = 'story' | 'images' | 'voices' | 'videos' | 'done';

interface SceneStatus {
  imageStatus: 'pending' | 'generating' | 'complete' | 'error';
  voiceStatus: 'pending' | 'generating' | 'complete' | 'error';
  videoStatus: 'pending' | 'generating' | 'complete' | 'error';
}

function StatusDot({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-white/20', generating: 'bg-yellow-400 animate-pulse',
    complete: 'bg-green-400', error: 'bg-red-400',
  };
  return (
    <div className="flex flex-col items-center gap-0.5" title={`${label}: ${status}`}>
      <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-white/20'}`} />
      <span className="text-[9px] text-white/30">{label}</span>
    </div>
  );
}

function GenerationProgress({ stage, topic, sceneStatuses, provider, sceneTitles, sceneThumbnails }: {
  stage: GenerationStage; topic: string; sceneStatuses: SceneStatus[]; provider: Provider;
  sceneTitles?: string[]; sceneThumbnails?: (string | undefined)[];
}) {
  const stages: { key: GenerationStage; label: string; icon: string }[] = [
    { key: 'story', label: 'Planning learning journey', icon: '🎬' },
    { key: 'images', label: 'Creating scene illustrations', icon: '🎨' },
    { key: 'voices', label: 'Recording narration', icon: '🎙️' },
    { key: 'videos', label: `Animating scenes (${provider === 'google' ? 'Veo 3' : 'Kling 3.0'})`, icon: '✨' },
  ];
  const stageIndex = stages.findIndex((s) => s.key === stage);
  const totalSteps = sceneStatuses.length * 3;
  const completedSteps = sceneStatuses.reduce((sum, s) =>
    sum + (s.imageStatus === 'complete' ? 1 : 0) + (s.voiceStatus === 'complete' ? 1 : 0) + (s.videoStatus === 'complete' ? 1 : 0), 0);
  const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : (stage === 'story' ? 5 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{stages[Math.min(stageIndex, stages.length - 1)]?.icon ?? '✨'}</div>
          <h2 className="text-2xl font-bold text-white mb-2">Creating your video</h2>
          <p className="text-purple-300 text-sm">&ldquo;{topic}&rdquo;</p>
        </div>
        <div className="mb-8">
          <div className="flex justify-between text-xs text-white/50 mb-2"><span>Progress</span><span>{pct}%</span></div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="space-y-3 mb-8">
          {stages.map((s, i) => {
            const isActive = i === stageIndex;
            const isDone = i < stageIndex || stage === 'done';
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-purple-500 text-white animate-pulse' : 'bg-white/10 text-white/30'}`}>
                  {isDone ? '✓' : i + 1}
                </div>
                <p className={`text-sm font-medium ${isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-white/30'}`}>{s.label}</p>
                {isActive && <svg className="animate-spin h-4 w-4 text-purple-400 ml-auto shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              </div>
            );
          })}
        </div>
        {sceneStatuses.length > 0 && stage !== 'story' && (
          <div className="border-t border-white/10 pt-6">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Scenes</p>
            <div className="space-y-2">
              {sceneStatuses.map((ss, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                  {sceneThumbnails?.[i] ? (
                    <img src={sceneThumbnails[i]} alt="" className="w-10 h-7 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-7 rounded bg-white/10 shrink-0 flex items-center justify-center text-xs text-white/30">{i + 1}</div>
                  )}
                  <p className="flex-1 text-xs text-white/70 truncate">{sceneTitles?.[i] || `Scene ${i + 1}`}</p>
                  <div className="flex gap-1.5 shrink-0">
                    <StatusDot status={ss.imageStatus} label="img" />
                    <StatusDot status={ss.voiceStatus} label="voice" />
                    <StatusDot status={ss.videoStatus} label="video" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Episode Player (video + slideshow modes) ───────────────────────────────
function EpisodePlayer({ episode, onBack }: { episode: Episode; onBack: () => void }) {
  const [currentScene, setCurrentScene] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState<boolean[]>([]);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const autoAdvanceRef = useRef(true);

  // Determine playable scenes — prefer video, fall back to images
  const scenesWithVideo = episode.scenes.filter((s) => s.generatedVideo?.url);
  const scenesWithMedia = episode.scenes.filter((s) => s.generatedVideo?.url || s.generatedImage?.url);
  const isSlideshow = scenesWithVideo.length === 0;
  const displayScenes = isSlideshow ? scenesWithMedia : scenesWithVideo;
  const scene = displayScenes[currentScene];

  // Create and track audio elements for ALL displayable scenes
  useEffect(() => {
    const loaded = new Array(displayScenes.length).fill(false);
    audioRefs.current = displayScenes.map((s, idx) => {
      if (!s.generatedAudio?.url) return null;
      const audio = new Audio();
      audio.preload = 'auto';
      audio.addEventListener('canplaythrough', () => {
        loaded[idx] = true;
        setAudioLoaded([...loaded]);
      });
      audio.addEventListener('error', () => {
        console.warn(`[Audio] Failed to load audio for scene ${idx}`);
      });
      audio.src = s.generatedAudio.url;
      return audio;
    });
    setAudioLoaded([...loaded]);
    return () => {
      audioRefs.current.forEach((a) => { if (a) { a.pause(); a.removeAttribute('src'); a.load(); } });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode.id, displayScenes.length]);

  // When scene changes while playing, sync audio
  useEffect(() => {
    audioRefs.current.forEach((a, i) => {
      if (a && i !== currentScene) { a.pause(); a.currentTime = 0; }
    });
    if (isPlaying) {
      const audio = audioRefs.current[currentScene];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch((err) => console.warn('[Audio] Play failed:', err));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene]);

  const advanceToNextScene = useCallback(() => {
    if (!autoAdvanceRef.current) return;
    if (currentScene < displayScenes.length - 1) {
      const next = currentScene + 1;
      setCurrentScene(next);
      setTimeout(() => {
        if (!isSlideshow && videoRef.current) videoRef.current.play().catch(() => {});
        const nextAudio = audioRefs.current[next];
        if (nextAudio) { nextAudio.currentTime = 0; nextAudio.play().catch(() => {}); }
      }, 300);
    } else {
      setIsPlaying(false);
    }
  }, [currentScene, displayScenes.length, isSlideshow]);

  // Slideshow mode: advance when narration ends
  useEffect(() => {
    if (!isSlideshow || !isPlaying) return;
    const audio = audioRefs.current[currentScene];
    if (!audio) {
      // No audio for this scene — auto-advance after 5 seconds
      const timer = setTimeout(advanceToNextScene, 5000);
      return () => clearTimeout(timer);
    }
    const onEnd = () => advanceToNextScene();
    audio.addEventListener('ended', onEnd);
    return () => audio.removeEventListener('ended', onEnd);
  }, [isSlideshow, isPlaying, currentScene, advanceToNextScene]);

  if (!scene) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center text-white gap-6 p-6">
        <div className="text-5xl">😔</div>
        <p className="text-xl font-semibold">No media was generated</p>
        <p className="text-white/50 text-sm text-center max-w-md">Check that your API keys are properly configured in Vercel.</p>
        <button onClick={onBack} className="px-6 py-3 bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors">Try another topic</button>
      </div>
    );
  }

  const playScene = () => {
    setIsPlaying(true);
    autoAdvanceRef.current = true;
    if (!isSlideshow && videoRef.current) videoRef.current.play().catch(() => {});
    const audio = audioRefs.current[currentScene];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch((err) => console.warn('[Audio] Play error:', err));
    }
  };

  const pauseScene = () => {
    setIsPlaying(false);
    if (videoRef.current) videoRef.current.pause();
    const audio = audioRefs.current[currentScene];
    if (audio) audio.pause();
  };

  const handleVideoEnded = () => {
    const audio = audioRefs.current[currentScene];
    if (audio && !audio.paused && !audio.ended) {
      // Loop video until narration finishes
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, (videoRef.current.duration || 5) - 2);
        videoRef.current.play().catch(() => {});
      }
      const onEnd = () => { audio.removeEventListener('ended', onEnd); advanceToNextScene(); };
      audio.addEventListener('ended', onEnd);
    } else {
      advanceToNextScene();
    }
  };

  const goToScene = (idx: number) => {
    autoAdvanceRef.current = true;
    audioRefs.current.forEach((a) => { if (a) { a.pause(); a.currentTime = 0; } });
    setCurrentScene(idx);
    setIsPlaying(false);
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = blobUrl; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) { console.error('Download failed:', err); }
  };

  const safeTitle = episode.title.replace(/[^a-zA-Z0-9]/g, '_');
  const hasVideo = !!scene.generatedVideo?.url;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 relative flex items-center justify-center">
        {hasVideo ? (
          <video ref={videoRef} key={scene.generatedVideo?.url} src={scene.generatedVideo?.url}
            className="max-w-full max-h-[70vh] rounded-lg" onEnded={handleVideoEnded}
            onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} playsInline />
        ) : scene.generatedImage?.url ? (
          <img src={scene.generatedImage.url} alt={scene.title} className="max-w-full max-h-[70vh] rounded-lg object-contain" />
        ) : null}

        {!isPlaying && (
          <button onClick={playScene} className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
              <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </button>
        )}
        {isPlaying && (
          <button onClick={pauseScene} className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center hover:bg-black/70">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
          </button>
        )}

        {/* Slideshow arrows */}
        {isSlideshow && displayScenes.length > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-4 pointer-events-none">
            {currentScene > 0 ? (
              <button onClick={() => goToScene(currentScene - 1)} className="pointer-events-auto w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center hover:bg-black/70">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
            ) : <div />}
            {currentScene < displayScenes.length - 1 ? (
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
            <span className="text-purple-400 text-sm">{isSlideshow && '📸 '} Scene {currentScene + 1}/{displayScenes.length}</span>
          </div>
          <div className="flex gap-2 justify-center mb-4">
            {displayScenes.map((_, i) => (
              <button key={i} onClick={() => goToScene(i)}
                className={`h-1.5 rounded-full transition-all ${i === currentScene ? 'w-8 bg-purple-400' : i < currentScene ? 'w-4 bg-green-500' : 'w-4 bg-white/20'}`} />
            ))}
          </div>
          <div className="flex gap-2 justify-center mb-4 flex-wrap">
            {scene.generatedVideo?.url && (
              <button onClick={() => downloadFile(scene.generatedVideo!.url, `${safeTitle}_scene_${currentScene + 1}.mp4`)}
                className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 text-sm transition-colors">Video</button>
            )}
            {scene.generatedAudio?.url && (
              <button onClick={() => downloadFile(scene.generatedAudio!.url, `${safeTitle}_narration_${currentScene + 1}.mp3`)}
                className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 text-sm transition-colors">Audio</button>
            )}
            {scene.generatedImage?.url && (
              <button onClick={() => downloadFile(scene.generatedImage!.url, `${safeTitle}_scene_${currentScene + 1}.png`)}
                className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 text-sm transition-colors">Image</button>
            )}
          </div>
          <div className="flex justify-between items-center">
            <button onClick={onBack} className="px-6 py-2 text-white/50 hover:text-white text-sm">New topic</button>
            <div className="flex gap-2">
              {episode.id && (
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/episode/${episode.id}`); }}
                  className="px-4 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 text-sm">Share Link</button>
              )}
              <Link href="/history" className="px-4 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 text-sm">History</Link>
              <button onClick={() => goToScene(0)} className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 text-sm">Replay</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function CreatePage() {
  const [profile, setProfile] = useState<Omit<ChildProfile, 'learningTopic'> | null>(null);
  const [stage, setStage] = useState<'topic' | 'generating' | 'playing'>('topic');
  const [genStage, setGenStage] = useState<GenerationStage>('story');
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sceneStatuses, setSceneStatuses] = useState<SceneStatus[]>([]);
  const [provider, setProvider] = useState<Provider>('google');

  // Load profile on mount — go straight to topic input, no setup page
  useEffect(() => {
    const customs = getCustomPresets();
    const preset = customs['sania'] || PROFILE_PRESETS.sania;
    if (preset) {
      setProfile({ ...preset.profile, id: 'preset-sania' } as Omit<ChildProfile, 'learningTopic'> & { id: string });
    }
  }, []);

  const handlePresetSelect = (key: string) => {
    const allPresets = { ...PROFILE_PRESETS, ...getCustomPresets() };
    const preset = allPresets[key];
    if (!preset) return;
    setProfile({ ...preset.profile, id: `preset-${key}` } as Omit<ChildProfile, 'learningTopic'> & { id: string });
  };

  // ─── Generation Pipeline ──────────────────────────────
  const handleTopicSubmit = async (selectedTopic: string) => {
    if (!profile) return;
    setTopic(selectedTopic);
    setStage('generating');
    setGenStage('story');
    setError(null);

    const fullProfile: ChildProfile = { ...profile, learningTopic: selectedTopic } as ChildProfile;

    try {
      // 1. Story — Claude plans the learning journey
      const storyResp = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: fullProfile }),
      });
      if (!storyResp.ok) {
        const err = await storyResp.json().catch(() => ({}));
        throw new Error(err.error || 'Story generation failed');
      }
      const { episode: ep } = await storyResp.json();
      setEpisode(ep);
      setSceneStatuses(ep.scenes.map(() => ({ imageStatus: 'pending' as const, voiceStatus: 'pending' as const, videoStatus: 'pending' as const })));

      // 2. Images (sequential for character consistency)
      setGenStage('images');
      let characterRefUrl: string | undefined;
      const sceneImageUrls = new Map<number, string>();

      for (let i = 0; i < ep.scenes.length; i++) {
        const scene = ep.scenes[i];
        const isFirst = i === 0;
        const prompt = buildSceneImagePrompt(scene, fullProfile, i, ep.scenes.length, isFirst);
        const seed = deriveSceneSeed(ep.id, i);
        setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], imageStatus: 'generating' }; return n; });
        try {
          const resp = await fetch('/api/images', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, characterReferenceUrl: isFirst ? undefined : characterRefUrl, seed, isFirstScene: isFirst, provider: 'fal' }),
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error);
          sceneImageUrls.set(i, data.imageUrl);
          if (isFirst) characterRefUrl = data.imageUrl;
          const permUrl = await uploadAsset(data.imageUrl, 'image', ep.id, i);
          setEpisode((prev) => {
            if (!prev) return null;
            const scenes = [...prev.scenes];
            scenes[i] = { ...scenes[i], generatedImage: { url: permUrl, prompt, seed: data.seed, isCharacterReference: isFirst, frameIndex: i } };
            if (isFirst) return { ...prev, scenes, continuityBible: { ...prev.continuityBible, characterReferenceImageUrl: data.imageUrl } };
            return { ...prev, scenes };
          });
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], imageStatus: 'complete' }; return n; });
        } catch (err) {
          console.error(`Image error scene ${i}:`, err);
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], imageStatus: 'error' }; return n; });
        }
      }

      // 3. Voices (parallel — before videos for duration sync)
      setGenStage('voices');
      const voiceTone = fullProfile.sensoryPreferences.preferredVoiceTone;
      const sceneAudioDurations = new Map<number, number>();

      await Promise.all(ep.scenes.map(async (scene: typeof ep.scenes[0], i: number) => {
        setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], voiceStatus: 'generating' }; return n; });
        try {
          const resp = await fetch('/api/voice', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: scene.narration, voiceTone }),
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error);
          sceneAudioDurations.set(i, data.duration);
          setEpisode((prev) => {
            if (!prev) return null;
            const scenes = [...prev.scenes];
            scenes[i] = { ...scenes[i], generatedAudio: { url: data.audioUrl, text: scene.narration, voiceId: voiceTone, duration: data.duration } };
            return { ...prev, scenes };
          });
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], voiceStatus: 'complete' }; return n; });
        } catch (err) {
          console.error(`Voice error scene ${i}:`, err);
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], voiceStatus: 'error' }; return n; });
        }
      }));

      // 4. Videos — blocking calls, parallel across scenes
      setGenStage('videos');

      if (provider === 'google') {
        // Veo 3: blocking calls — each one returns the final video URL
        await Promise.all(ep.scenes.map(async (scene: typeof ep.scenes[0], i: number) => {
          const imageUrl = sceneImageUrls.get(i);
          if (!imageUrl) return;
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], videoStatus: 'generating' }; return n; });
          const videoPrompt = buildSceneVideoPrompt(scene, fullProfile, undefined, characterRefUrl);
          const audioDur = sceneAudioDurations.get(i) || 5;
          try {
            const resp = await fetch('/api/video', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageUrl, prompt: videoPrompt, duration: audioDur > 7 ? 10 : 5, provider: 'google' }),
            });
            const data = await resp.json();
            if (data.status === 'FAILED') throw new Error(data.error || 'Video failed');
            if (!resp.ok) throw new Error(data.error || 'Video failed');
            const videoUrl = data.videoUrl || (data.requestId?.startsWith('COMPLETED:') ? data.requestId.replace('COMPLETED:', '') : null);
            if (videoUrl) {
              const permUrl = await uploadAsset(videoUrl, 'video', ep.id, i);
              setEpisode((prev) => {
                if (!prev) return null;
                const scenes = [...prev.scenes];
                scenes[i] = { ...scenes[i], generatedVideo: { url: permUrl, duration: 5, prompt: 'veo3' } };
                return { ...prev, scenes };
              });
              setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], videoStatus: 'complete' }; return n; });
            } else {
              throw new Error('No video URL returned');
            }
          } catch (err) {
            console.error(`Video error scene ${i}:`, err);
            setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], videoStatus: 'error' }; return n; });
          }
        }));
      } else {
        // fal.ai Kling 3.0: submit/poll pattern
        const videoJobs: Array<{ sceneIndex: number; requestId: string }> = [];
        await Promise.all(ep.scenes.map(async (scene: typeof ep.scenes[0], i: number) => {
          const imageUrl = sceneImageUrls.get(i);
          if (!imageUrl) return;
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], videoStatus: 'generating' }; return n; });
          const videoPrompt = buildSceneVideoPrompt(scene, fullProfile, undefined, characterRefUrl);
          const audioDur = sceneAudioDurations.get(i) || 5;
          try {
            const resp = await fetch('/api/video', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode: 'submit', imageUrl, prompt: videoPrompt, duration: audioDur > 7 ? 10 : 5, provider: 'fal' }),
            });
            const data = await resp.json();
            if (data.status === 'FAILED') throw new Error(data.error);
            if (!resp.ok) throw new Error(data.error);
            videoJobs.push({ sceneIndex: i, requestId: data.requestId });
          } catch (err) {
            console.error(`Video submit error scene ${i}:`, err);
            setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], videoStatus: 'error' }; return n; });
          }
        }));

        // Poll fal.ai jobs
        const pending = new Set(videoJobs.map((j) => j.sceneIndex));
        let attempts = 0;
        while (pending.size > 0 && attempts < 120) {
          await new Promise((r) => setTimeout(r, 5000));
          attempts++;
          for (const job of videoJobs) {
            if (!pending.has(job.sceneIndex)) continue;
            try {
              const resp = await fetch(`/api/video?requestId=${job.requestId}&provider=fal`);
              const data = await resp.json();
              if (data.status === 'COMPLETED' && data.videoUrl) {
                pending.delete(job.sceneIndex);
                const permUrl = await uploadAsset(data.videoUrl, 'video', ep.id, job.sceneIndex);
                setEpisode((prev) => {
                  if (!prev) return null;
                  const scenes = [...prev.scenes];
                  scenes[job.sceneIndex] = { ...scenes[job.sceneIndex], generatedVideo: { url: permUrl, duration: 5, prompt: 'kling' } };
                  return { ...prev, scenes };
                });
                setSceneStatuses((prev) => { const n = [...prev]; n[job.sceneIndex] = { ...n[job.sceneIndex], videoStatus: 'complete' }; return n; });
              } else if (data.status === 'FAILED') {
                pending.delete(job.sceneIndex);
                setSceneStatuses((prev) => { const n = [...prev]; n[job.sceneIndex] = { ...n[job.sceneIndex], videoStatus: 'error' }; return n; });
              }
            } catch {}
          }
        }
        for (const idx of pending) {
          setSceneStatuses((prev) => { const n = [...prev]; n[idx] = { ...n[idx], videoStatus: 'error' }; return n; });
        }
      }

      // 5. Auto-save to localStorage + Blob
      let latestEpisode: Episode | null = null;
      setEpisode((prev) => { latestEpisode = prev; return prev; });
      if (latestEpisode) {
        const le = latestEpisode as Episode;
        const saved: SavedEpisode = {
          id: le.id, title: le.title, topic: selectedTopic,
          childName: le.childProfile?.name || profile.name,
          provider, createdAt: new Date().toISOString(),
          thumbnail: le.scenes[0]?.generatedImage?.url,
          scenes: le.scenes.map((s, i) => ({
            index: i, narration: s.narration,
            videoUrl: s.generatedVideo?.url, audioUrl: s.generatedAudio?.url, imageUrl: s.generatedImage?.url,
          })),
        };
        saveEpisodeToHistory(saved);
        try { await fetch('/api/episodes/' + le.id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(le) }); } catch {}
      }

      setGenStage('done');
      setStage('playing');
    } catch (err) {
      console.error('Pipeline error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStage('topic');
    }
  };

  // ─── Render ──────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
          <p className="text-red-400 font-bold text-lg mb-2">Something went wrong</p>
          <p className="text-red-300 text-sm mb-6">{error}</p>
          <button onClick={() => { setError(null); setStage('topic'); }} className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20">Try again</button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (stage === 'topic') {
    return <TopicInput profile={profile} onSubmit={handleTopicSubmit} isLoading={false} provider={provider} onProviderChange={setProvider} onPresetSelect={handlePresetSelect} />;
  }

  if (stage === 'generating') {
    return <GenerationProgress stage={genStage} topic={topic} sceneStatuses={sceneStatuses} provider={provider} sceneTitles={episode?.scenes.map((s) => s.title)} sceneThumbnails={episode?.scenes.map((s) => s.generatedImage?.url)} />;
  }

  if (stage === 'playing' && episode) {
    return <EpisodePlayer episode={episode} onBack={() => { setStage('topic'); setEpisode(null); setGenStage('story'); }} />;
  }

  return null;
}
