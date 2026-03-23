'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProfileForm from '@/components/ProfileForm';
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

// Helper function to upload assets to permanent storage
async function uploadAssetToStorage(
  url: string,
  type: 'image' | 'video' | 'audio',
  episodeId: string,
  sceneIndex: number
): Promise<string> {
  try {
    const response = await fetch('/api/assets/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, type, episodeId, sceneIndex }),
    });
    if (response.ok) {
      const { permanentUrl } = await response.json();
      if (permanentUrl) {
        console.log('[Asset Storage] Uploaded', type, 'for scene', sceneIndex);
        return permanentUrl;
      }
    }
  } catch (err) {
    console.error('[Asset Storage] Upload failed:', err);
  }
  return url; // Return original URL as fallback
}

// ─── Topic Input with Profile Selector & Provider Picker ────────────────────
function TopicInput({
  profileName,
  onSubmit,
  onChangeProfile,
  isLoading,
  provider,
  onProviderChange,
  onPresetSelect,
}: {
  profileName: string;
  onSubmit: (topic: string) => void;
  onChangeProfile: () => void;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            LoreLearn
          </h1>
          <p className="text-purple-300 text-lg">
            Hey {profileName}! What do you want to learn about today?
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Learner</label>
            <select
              value=""
              onChange={(e) => { if (e.target.value) onPresetSelect(e.target.value); }}
              className="w-full py-2.5 px-4 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none cursor-pointer"
            >
              <option value="" disabled className="bg-gray-900">{profileName} (active)</option>
              {Object.entries({ ...PROFILE_PRESETS, ...getCustomPresets() }).map(([key, preset]) => (
                <option key={key} value={key} className="bg-gray-900">{preset.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">AI Provider</label>
            <select
              value={provider}
              onChange={(e) => onProviderChange(e.target.value as Provider)}
              className="w-full py-2.5 px-4 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none cursor-pointer"
            >
              {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="bg-gray-900">{label}</option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Type any topic... like 'how black holes work'"
              disabled={isLoading}
              className="w-full py-5 px-6 pr-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white text-lg placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!topic.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => { setTopic(s); if (!isLoading) onSubmit(s); }}
              disabled={isLoading}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-purple-300 hover:bg-white/10 hover:border-purple-400/50 transition-all disabled:opacity-30"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="text-center flex gap-4 justify-center">
          <a href="/profile" className="text-sm text-white/30 hover:text-white/60 transition-colors">
            Edit profiles
          </a>
          <a href="/history" className="text-sm text-white/30 hover:text-white/60 transition-colors">
            Episode history
          </a>
          <button onClick={onChangeProfile} className="text-sm text-white/30 hover:text-white/60 transition-colors">
            Full profile form
          </button>
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
  videoRequestId?: string;
}

function GenerationProgress({
  stage, topic, sceneCount, sceneStatuses, provider, sceneTitles, sceneThumbnails,
}: {
  stage: GenerationStage; topic: string; sceneCount: number; sceneStatuses: SceneStatus[]; provider: Provider; sceneTitles?: string[]; sceneThumbnails?: (string | undefined)[];
}) {
  const stages: { key: GenerationStage; label: string; icon: string }[] = [
    { key: 'story', label: 'Planning scenes (Claude)', icon: '🎬' },
    { key: 'images', label: `Creating visuals (${provider === 'google' ? 'Gemini' : 'Nano Banana Pro'})`, icon: '🎨' },
    { key: 'voices', label: 'Recording narration (ElevenLabs)', icon: '🎙️' },
    { key: 'videos', label: `Animating scenes (${provider === 'google' ? 'Veo 3' : 'Kling 3.0'})`, icon: '✨' },
  ];

  const stageIndex = stages.findIndex((s) => s.key === stage);

  // Calculate overall progress
  const totalSteps = sceneStatuses.length * 3; // image + voice + video per scene
  const completedSteps = sceneStatuses.reduce((sum, s) => {
    return sum + (s.imageStatus === 'complete' ? 1 : 0) + (s.voiceStatus === 'complete' ? 1 : 0) + (s.videoStatus === 'complete' ? 1 : 0);
  }, 0);
  const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : (stage === 'story' ? 5 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{stages[Math.min(stageIndex, stages.length - 1)]?.icon ?? '✨'}</div>
          <h2 className="text-2xl font-bold text-white mb-2">Creating your video</h2>
          <p className="text-purple-300 text-sm">&ldquo;{topic}&rdquo;</p>
        </div>

        {/* Overall progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-white/50 mb-2">
            <span>Overall progress</span>
            <span>{overallProgress}%</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-all duration-700 ease-out" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>

        {/* Stage indicators */}
        <div className="space-y-3 mb-8">
          {stages.map((s, i) => {
            const isActive = i === stageIndex;
            const isDone = i < stageIndex || stage === 'done';
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-purple-500 text-white animate-pulse' : 'bg-white/10 text-white/30'}`}>
                  {isDone ? '✓' : i + 1}
                </div>
                <p className={`text-sm font-medium transition-all ${isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-white/30'}`}>
                  {s.label}
                </p>
                {isActive && (
                  <svg className="animate-spin h-4 w-4 text-purple-400 ml-auto shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        {/* Per-scene progress (visible once we have scene data) */}
        {sceneStatuses.length > 0 && stage !== 'story' && (
          <div className="border-t border-white/10 pt-6">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Scene Progress</p>
            <div className="space-y-2">
              {sceneStatuses.map((ss, i) => {
                const thumb = sceneThumbnails?.[i];
                const title = sceneTitles?.[i] || `Scene ${i + 1}`;
                return (
                  <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                    {thumb ? (
                      <img src={thumb} alt="" className="w-10 h-7 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-7 rounded bg-white/10 shrink-0 flex items-center justify-center text-xs text-white/30">{i + 1}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 truncate">{title}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <StatusDot status={ss.imageStatus} label="img" />
                      <StatusDot status={ss.voiceStatus} label="voice" />
                      <StatusDot status={ss.videoStatus} label="video" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-white/20',
    generating: 'bg-yellow-400 animate-pulse',
    complete: 'bg-green-400',
    error: 'bg-red-400',
  };
  return (
    <div className="flex flex-col items-center gap-0.5" title={`${label}: ${status}`}>
      <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-white/20'}`} />
      <span className="text-[9px] text-white/30">{label}</span>
    </div>
  );
}

// ─── Video Player ───────────────────────────────────────────────────────────
function VideoPlayer({ episode, onBack }: { episode: Episode; onBack: () => void }) {
  const [currentScene, setCurrentScene] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [stitching, setStitching] = useState(false);
  const [stitchedUrl, setStitchedUrl] = useState<string | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const autoAdvanceRef = useRef(true);

  const scenesWithVideo = episode.scenes.filter((s) => s.generatedVideo?.url);
  const scene = scenesWithVideo[currentScene];

  // Pre-load all audio elements
  useEffect(() => {
    audioRefs.current = scenesWithVideo.map((s) => {
      if (!s.generatedAudio?.url) return null;
      const audio = new Audio(s.generatedAudio.url);
      audio.preload = 'auto';
      return audio;
    });
    return () => {
      audioRefs.current.forEach((a) => { if (a) { a.pause(); a.src = ''; } });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode.id]);

  // When scene changes, sync audio
  useEffect(() => {
    // Pause all other audio
    audioRefs.current.forEach((a, i) => {
      if (a && i !== currentScene) { a.pause(); a.currentTime = 0; }
    });
    // If we're playing, start the new scene's audio
    if (isPlaying) {
      const audio = audioRefs.current[currentScene];
      if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene]);

  const saveToHistory = () => {
    const saved: SavedEpisode = {
      id: episode.id,
      title: episode.title,
      topic: episode.childProfile?.learningTopic || '',
      childName: episode.childProfile?.name || 'Unknown',
      provider: 'fal',
      createdAt: new Date().toISOString(),
      thumbnail: episode.scenes[0]?.generatedImage?.url,
      scenes: episode.scenes.map((s, i) => ({
        index: i,
        narration: s.narration,
        videoUrl: s.generatedVideo?.url,
        audioUrl: s.generatedAudio?.url,
        imageUrl: s.generatedImage?.url,
      })),
    };
    saveEpisodeToHistory(saved);
    setSavedToHistory(true);
  };

  if (!scene) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <p className="text-lg">No video scenes were generated.</p>
        <p className="text-sm text-white/50">Check that your API keys are set in Vercel environment variables.</p>
        <button onClick={onBack} className="mt-4 px-6 py-3 bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors">Try another topic</button>
      </div>
    );
  }

  const playScene = () => {
    setIsPlaying(true);
    if (videoRef.current) videoRef.current.play().catch(() => {});
    const audio = audioRefs.current[currentScene];
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
  };

  const pauseScene = () => {
    setIsPlaying(false);
    if (videoRef.current) videoRef.current.pause();
    const audio = audioRefs.current[currentScene];
    if (audio) audio.pause();
  };

  const handleVideoEnded = () => {
    // Check if narration for this scene is still playing
    const audio = audioRefs.current[currentScene];
    const narrationStillPlaying = audio && !audio.paused && !audio.ended;

    if (narrationStillPlaying) {
      // Loop the video until narration finishes
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, (videoRef.current.duration || 5) - 2);
        videoRef.current.play().catch(() => {});
      }
      // Set up a listener for when narration ends to auto-advance
      const onNarrationEnd = () => {
        audio.removeEventListener('ended', onNarrationEnd);
        advanceToNextScene();
      };
      audio.addEventListener('ended', onNarrationEnd);
    } else {
      // Narration done or no narration — advance immediately
      advanceToNextScene();
    }
  };

  const advanceToNextScene = () => {
    if (!autoAdvanceRef.current) return;
    if (currentScene < scenesWithVideo.length - 1) {
      const nextIdx = currentScene + 1;
      setCurrentScene(nextIdx);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.play().catch(() => {});
        const nextAudio = audioRefs.current[nextIdx];
        if (nextAudio) { nextAudio.currentTime = 0; nextAudio.play().catch(() => {}); }
      }, 200);
    } else {
      setIsPlaying(false);
    }
  };

  const goToScene = (idx: number) => {
    autoAdvanceRef.current = true;
    // Stop current audio
    const curAudio = audioRefs.current[currentScene];
    if (curAudio) { curAudio.pause(); curAudio.currentTime = 0; }
    setCurrentScene(idx);
    setIsPlaying(false);
  };

  const downloadScene = async (sceneIdx: number) => {
    const s = scenesWithVideo[sceneIdx];
    if (!s?.generatedVideo?.url) return;
    try {
      const resp = await fetch(s.generatedVideo.url);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${episode.title.replace(/[^a-zA-Z0-9]/g, '_')}_scene_${sceneIdx + 1}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const stitchFullEpisode = async () => {
    setStitching(true);
    try {
      const scenes = scenesWithVideo.map((s) => ({
        videoUrl: s.generatedVideo!.url,
        audioUrl: s.generatedAudio?.url,
        duration: s.generatedAudio?.duration || s.generatedVideo!.duration || 5,
      }));
      const resp = await fetch('/api/stitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: episode.id, title: episode.title, scenes }),
      });
      const data = await resp.json();
      if (resp.ok && data.videoUrl) {
        setStitchedUrl(data.videoUrl);
      } else {
        console.error('[Stitch] Failed:', data.error);
        alert(data.error || 'Video stitching failed. FFmpeg may not be available on this server.');
      }
    } catch (err) {
      console.error('[Stitch] Error:', err);
      alert('Video stitching failed — check console for details.');
    }
    setStitching(false);
  };

  const downloadAll = async () => {
    setDownloading(true);
    for (let i = 0; i < scenesWithVideo.length; i++) {
      await downloadScene(i);
      await new Promise((r) => setTimeout(r, 500));
    }
    setDownloading(false);
  };

  const downloadNarration = async (sceneIdx: number) => {
    const s = scenesWithVideo[sceneIdx];
    if (!s?.generatedAudio?.url) return;
    try {
      const resp = await fetch(s.generatedAudio.url);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${episode.title.replace(/[^a-zA-Z0-9]/g, '_')}_narration_${sceneIdx + 1}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download narration failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 relative flex items-center justify-center">
        <video ref={videoRef} key={scene.generatedVideo?.url} src={scene.generatedVideo?.url} className="max-w-full max-h-[70vh] rounded-lg" onEnded={handleVideoEnded} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} playsInline />
        {!isPlaying && (
          <button onClick={playScene} className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
              <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </button>
        )}
        {isPlaying && (
          <button onClick={pauseScene} className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center hover:bg-black/70 transition-all">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
          </button>
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
            <span className="text-purple-400 text-sm">Scene {currentScene + 1} of {scenesWithVideo.length}</span>
          </div>
          <div className="flex gap-2 justify-center mb-4">
            {scenesWithVideo.map((_, i) => (
              <button key={i} onClick={() => goToScene(i)}
                className={`h-1.5 rounded-full transition-all ${i === currentScene ? 'w-8 bg-purple-400' : i < currentScene ? 'w-4 bg-green-500' : 'w-4 bg-white/20'}`} />
            ))}
          </div>

          {/* Download controls */}
          <div className="flex gap-2 justify-center mb-4 flex-wrap">
            <button
              onClick={() => downloadScene(currentScene)}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 text-sm transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Scene {currentScene + 1} Video
            </button>
            {scene.generatedAudio?.url && (
              <button
                onClick={() => downloadNarration(currentScene)}
                className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Narration
              </button>
            )}
            <button
              onClick={downloadAll}
              disabled={downloading}
              className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              {downloading ? 'Downloading...' : 'All Scenes'}
            </button>
          </div>

          {/* Full Episode Stitch */}
          <div className="flex gap-2 justify-center mb-4">
            {stitchedUrl ? (
              <a
                href={stitchedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 rounded-lg hover:from-green-500/40 hover:to-emerald-500/40 text-sm transition-colors flex items-center gap-2 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Watch Full Episode
              </a>
            ) : (
              <button
                onClick={stitchFullEpisode}
                disabled={stitching}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 rounded-lg hover:from-amber-500/30 hover:to-orange-500/30 text-sm transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
              >
                {stitching ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Stitching full episode...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V20M17 4V20M3 8H7M17 8H21M3 12H21M3 16H7M17 16H21M4 20H20C20.5523 20 21 19.5523 21 19V5C21 4.44772 20.5523 4 20 4H4C3.44772 4 3 4.44772 3 5V19C3 19.5523 3.44772 20 4 20Z" /></svg>
                    Stitch Full Episode
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex justify-between items-center">
            <button onClick={onBack} className="px-6 py-2 text-white/50 hover:text-white text-sm transition-colors">New topic</button>
            <div className="flex gap-2">
              <button
                onClick={saveToHistory}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${savedToHistory ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'}`}
              >
                {savedToHistory ? 'Saved!' : 'Save to History'}
              </button>
              <a href="/history" className="px-5 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 text-sm transition-colors">History</a>
              <button onClick={() => { goToScene(0); }} className="px-5 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 text-sm transition-colors">Replay</button>
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
  const [stage, setStage] = useState<'setup' | 'topic' | 'generating' | 'playing'>('setup');
  const [genStage, setGenStage] = useState<GenerationStage>('story');
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sceneStatuses, setSceneStatuses] = useState<SceneStatus[]>([]);
  const [provider, setProvider] = useState<Provider>('fal');

  useEffect(() => {
    // Prefer custom profile from localStorage (edited via Profile Editor) over hardcoded preset
    const customPresets = getCustomPresets();
    const sania = customPresets['sania'] || PROFILE_PRESETS.sania;
    if (sania) {
      setProfile({ ...sania.profile, id: 'preset-sania' } as Omit<ChildProfile, 'learningTopic'> & { id: string });
      setStage('topic');
    }
  }, []);

  const handlePresetSelect = (key: string) => {
    const allPresets = { ...PROFILE_PRESETS, ...getCustomPresets() };
    const preset = allPresets[key];
    if (!preset) return;
    if (key === 'custom') { setProfile(null); setStage('setup'); }
    else {
      setProfile({ ...preset.profile, id: `preset-${key}` } as Omit<ChildProfile, 'learningTopic'> & { id: string });
      setStage('topic');
    }
  };

  const handleProfileSave = (fullProfile: ChildProfile) => {
    const { learningTopic: _, ...base } = fullProfile;
    setProfile(base);
    setStage('topic');
  };

  // ─── Full Generation Pipeline ──────────────────────────
  const handleTopicSubmit = async (selectedTopic: string) => {
    if (!profile) return;
    setTopic(selectedTopic);
    setStage('generating');
    setGenStage('story');
    setError(null);

    const fullProfile: ChildProfile = { ...profile, learningTopic: selectedTopic } as ChildProfile;

    try {
      // 1. Story
      const storyResp = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: fullProfile }),
      });
      if (!storyResp.ok) throw new Error('Story generation failed');
      const { episode: ep } = await storyResp.json();
      setEpisode(ep);

      const totalScenes = ep.scenes.length;
      setSceneStatuses(ep.scenes.map(() => ({
        imageStatus: 'pending' as const, voiceStatus: 'pending' as const, videoStatus: 'pending' as const,
      })));

      // 2. Images (sequential for cohesion)
      // *** LOCAL tracking — never rely on React state for pipeline data ***
      setGenStage('images');
      let characterRefUrl: string | undefined;
      const sceneImageUrls: Map<number, string> = new Map();

      for (let i = 0; i < ep.scenes.length; i++) {
        const scene = ep.scenes[i];
        const isFirst = i === 0;
        const cohesivePrompt = buildSceneImagePrompt(scene, fullProfile, i, totalScenes, isFirst);
        const seed = deriveSceneSeed(ep.id, i);

        setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], imageStatus: 'generating' }; return n; });

        try {
          const resp = await fetch('/api/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: cohesivePrompt, characterReferenceUrl: isFirst ? undefined : characterRefUrl, seed, isFirstScene: isFirst, provider }),
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error);

          // Track locally — this is the source of truth for the video step
          sceneImageUrls.set(i, data.imageUrl);
          if (isFirst) characterRefUrl = data.imageUrl;

          // Upload image to permanent storage
          const permanentImageUrl = await uploadAssetToStorage(data.imageUrl, 'image', ep.id, i);

          setEpisode((prev) => {
            if (!prev) return null;
            const scenes = [...prev.scenes];
            scenes[i] = { ...scenes[i], generatedImage: { url: permanentImageUrl, prompt: cohesivePrompt, seed: data.seed, isCharacterReference: isFirst, frameIndex: i } };
            if (isFirst) return { ...prev, scenes, continuityBible: { ...prev.continuityBible, characterReferenceImageUrl: data.imageUrl } };
            return { ...prev, scenes };
          });
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], imageStatus: 'complete' }; return n; });
        } catch (err) {
          console.error(`Image error scene ${i}:`, err);
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], imageStatus: 'error' }; return n; });
        }
      }

      // 3. Voices (parallel) — generate BEFORE videos so we know narration duration
      setGenStage('voices');
      const voiceTone = fullProfile.sensoryPreferences.preferredVoiceTone;
      const sceneAudioDurations: Map<number, number> = new Map();

      await Promise.all(ep.scenes.map(async (scene: typeof ep.scenes[0], i: number) => {
        setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], voiceStatus: 'generating' }; return n; });
        try {
          const resp = await fetch('/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: scene.narration, voiceTone }),
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error);

          // Track audio duration locally for video sync
          sceneAudioDurations.set(i, data.duration);
          console.log(`[Pipeline] Voice scene ${i}: ${data.duration}s`);

          const permanentAudioUrl = await uploadAssetToStorage(data.audioUrl, 'audio', ep.id, i);

          setEpisode((prev) => {
            if (!prev) return null;
            const scenes = [...prev.scenes];
            scenes[i] = { ...scenes[i], generatedAudio: { url: permanentAudioUrl, text: scene.narration, voiceId: voiceTone, duration: data.duration } };
            return { ...prev, scenes };
          });
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], voiceStatus: 'complete' }; return n; });
        } catch (err) {
          console.error(`Voice error scene ${i}:`, err);
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], voiceStatus: 'error' }; return n; });
        }
      }));

      // 4. Videos (parallel submit — duration synced to narration length)
      setGenStage('videos');
      const videoJobs: Array<{ sceneIndex: number; requestId: string }> = [];

      console.log(`[Pipeline] Submitting ${sceneImageUrls.size} video jobs from ${ep.scenes.length} scenes`);

      await Promise.all(ep.scenes.map(async (scene: typeof ep.scenes[0], i: number) => {
        const imageUrl = sceneImageUrls.get(i);
        if (!imageUrl) {
          console.warn(`[Pipeline] No image for scene ${i}, skipping video`);
          return;
        }

        setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], videoStatus: 'generating' }; return n; });

        const videoPrompt = buildSceneVideoPrompt(scene, fullProfile, undefined, characterRefUrl);

        // Choose video duration based on narration length
        // Kling supports 5s or 10s — pick 10s if narration > 7 seconds
        const audioDuration = sceneAudioDurations.get(i) || 5;
        const videoDuration = audioDuration > 7 ? 10 : 5;
        console.log(`[Pipeline] Scene ${i}: audio ${audioDuration}s → video ${videoDuration}s`);

        try {
          const resp = await fetch('/api/video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'submit', imageUrl, prompt: videoPrompt, duration: videoDuration, provider }),
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error);

          console.log(`[Pipeline] Video job submitted for scene ${i}: ${data.requestId}`);
          videoJobs.push({ sceneIndex: i, requestId: data.requestId });
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], videoRequestId: data.requestId }; return n; });
        } catch (err) {
          console.error(`Video submit error scene ${i}:`, err);
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], videoStatus: 'error' }; return n; });
        }
      }));

      // 5. Poll all video jobs until complete
      const pending = new Set(videoJobs.map((j) => j.sceneIndex));
      let attempts = 0;
      const maxAttempts = 150; // ~12.5 min

      console.log(`[Pipeline] Polling ${pending.size} video jobs...`);

      while (pending.size > 0 && attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 5000));
        attempts++;

        for (const job of videoJobs) {
          if (!pending.has(job.sceneIndex)) continue;
          try {
            const resp = await fetch(`/api/video?requestId=${job.requestId}&provider=${provider}`);
            const data = await resp.json();

            if (data.status === 'COMPLETED' && data.videoUrl) {
              pending.delete(job.sceneIndex);
              console.log(`[Pipeline] Video complete for scene ${job.sceneIndex}`);
              // Upload video to permanent storage
              const permanentVideoUrl = await uploadAssetToStorage(data.videoUrl, 'video', ep.id, job.sceneIndex);

              setEpisode((prev) => {
                if (!prev) return null;
                const scenes = [...prev.scenes];
                scenes[job.sceneIndex] = { ...scenes[job.sceneIndex], generatedVideo: { url: permanentVideoUrl, duration: 5, prompt: 'generated' } };
                return { ...prev, scenes };
              });
              setSceneStatuses((prev) => { const n = [...prev]; n[job.sceneIndex] = { ...n[job.sceneIndex], videoStatus: 'complete' }; return n; });
            } else if (data.status === 'FAILED') {
              pending.delete(job.sceneIndex);
              console.error(`[Pipeline] Video FAILED for scene ${job.sceneIndex}`);
              setSceneStatuses((prev) => { const n = [...prev]; n[job.sceneIndex] = { ...n[job.sceneIndex], videoStatus: 'error' }; return n; });
            }
          } catch (err) {
            console.error(`Video poll error:`, err);
          }
        }
      }

      for (const idx of pending) {
        setSceneStatuses((prev) => { const n = [...prev]; n[idx] = { ...n[idx], videoStatus: 'error' }; return n; });
      }

      // Save episode with permanent asset URLs (use ep.id since React state may be stale)
      try {
        // Get the latest episode state by reading from the setter
        let latestEpisode: Episode | null = null;
        setEpisode((prev) => { latestEpisode = prev; return prev; });
        if (latestEpisode) {
          await fetch('/api/episodes/' + ep.id, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(latestEpisode),
          });
          console.log('[API] Episode saved with permanent asset URLs');
        }
      } catch (err) {
        console.error('[API] Failed to save episode:', err);
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
          <button onClick={() => { setError(null); setStage('topic'); }} className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">Try again</button>
        </div>
      </div>
    );
  }

  if (stage === 'setup' || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
        <div className="p-4">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </Link>
        </div>
        <ProfileForm onSubmit={handleProfileSave} isLoading={false} />
      </div>
    );
  }

  if (stage === 'topic') {
    return (
      <TopicInput profileName={profile.name} onSubmit={handleTopicSubmit} onChangeProfile={() => { setProfile(null); setStage('setup'); }} isLoading={false} provider={provider} onProviderChange={setProvider} onPresetSelect={handlePresetSelect} />
    );
  }

  if (stage === 'generating') {
    return <GenerationProgress stage={genStage} topic={topic} sceneCount={5} sceneStatuses={sceneStatuses} provider={provider} sceneTitles={episode?.scenes.map(s => s.title)} sceneThumbnails={episode?.scenes.map(s => s.generatedImage?.url)} />;
  }

  if (stage === 'playing' && episode) {
    return <VideoPlayer episode={episode} onBack={() => { setStage('topic'); setEpisode(null); setGenStage('story'); }} />;
  }

  return null;
}
