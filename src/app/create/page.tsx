'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProfileForm from '@/components/ProfileForm';
import { ChildProfile, Episode } from '@/types';
import { buildSceneImagePrompt, buildSceneVideoPrompt, deriveSceneSeed } from '@/lib/cohesion';
import { PROFILE_PRESETS } from '@/lib/presets';
import { Provider, PROVIDER_LABELS } from '@/lib/providers';
import { saveEpisodeToHistory, type SavedEpisode } from '@/lib/episode-storage';

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
              {Object.entries(PROFILE_PRESETS).map(([key, preset]) => (
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
  stage, topic, sceneCount, sceneStatuses, provider,
}: {
  stage: GenerationStage; topic: string; sceneCount: number; sceneStatuses: SceneStatus[]; provider: Provider;
}) {
  const stages: { key: GenerationStage; label: string; icon: string }[] = [
    { key: 'story', label: 'Planning scenes (Claude)', icon: '🎬' },
    { key: 'images', label: `Creating visuals (${provider === 'google' ? 'Gemini' : 'Nano Banana Pro'})`, icon: '🎨' },
    { key: 'voices', label: 'Recording narration (ElevenLabs)', icon: '🎙️' },
    { key: 'videos', label: `Animating scenes (${provider === 'google' ? 'Veo 3' : 'Kling 3.0'})`, icon: '✨' },
  ];

  const stageIndex = stages.findIndex((s) => s.key === stage);
  const videosComplete = sceneStatuses.filter((s) => s.videoStatus === 'complete').length;
  const videosTotal = sceneStatuses.length || sceneCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{stages[Math.min(stageIndex, stages.length - 1)]?.icon ?? '✨'}</div>
          <h2 className="text-2xl font-bold text-white mb-2">Creating your video</h2>
          <p className="text-purple-300 text-sm">&ldquo;{topic}&rdquo;</p>
        </div>
        <div className="space-y-4">
          {stages.map((s, i) => {
            const isActive = i === stageIndex;
            const isDone = i < stageIndex || stage === 'done';
            return (
              <div key={s.key} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-purple-500 text-white animate-pulse' : 'bg-white/10 text-white/30'}`}>
                  {isDone ? '✓' : i + 1}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium transition-all ${isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-white/30'}`}>
                    {s.label}
                    {isActive && s.key === 'videos' && videosTotal > 0 && (
                      <span className="ml-2 text-purple-400">({videosComplete}/{videosTotal})</span>
                    )}
                  </p>
                </div>
                {isActive && (
                  <svg className="animate-spin h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
        {stage === 'videos' && videosTotal > 0 && (
          <div className="mt-6">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" style={{ width: `${(videosComplete / videosTotal) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Video Player ───────────────────────────────────────────────────────────
function VideoPlayer({ episode, onBack }: { episode: Episode; onBack: () => void }) {
  const [currentScene, setCurrentScene] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);

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

  const scenesWithVideo = episode.scenes.filter((s) => s.generatedVideo?.url);
  const scene = scenesWithVideo[currentScene];

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
    if (videoRef.current) { videoRef.current.play(); setIsPlaying(true); }
    if (audioRef.current && scene.generatedAudio?.url) { audioRef.current.currentTime = 0; audioRef.current.play(); }
  };

  const handleVideoEnded = () => {
    if (currentScene < scenesWithVideo.length - 1) {
      setCurrentScene((prev) => prev + 1);
      setIsPlaying(false);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.play(); setIsPlaying(true); }
        if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); }
      }, 300);
    } else {
      setIsPlaying(false);
    }
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
        {scene.generatedAudio?.url && <audio ref={audioRef} key={scene.generatedAudio?.url} src={scene.generatedAudio.url} />}
        {!isPlaying && (
          <button onClick={playScene} className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
              <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
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
              <button key={i} onClick={() => { setCurrentScene(i); setIsPlaying(false); }}
                className={`h-1.5 rounded-full transition-all ${i === currentScene ? 'w-8 bg-purple-400' : i < currentScene ? 'w-4 bg-green-500' : 'w-4 bg-white/20'}`} />
            ))}
          </div>

          {/* Download controls */}
          <div className="flex gap-2 justify-center mb-4">
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
              <button onClick={() => { setCurrentScene(0); setIsPlaying(false); }} className="px-5 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 text-sm transition-colors">Replay</button>
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
    const sania = PROFILE_PRESETS.sania;
    if (sania) {
      setProfile({ ...sania.profile, id: 'preset-sania' } as Omit<ChildProfile, 'learningTopic'> & { id: string });
      setStage('topic');
    }
  }, []);

  const handlePresetSelect = (key: string) => {
    const preset = PROFILE_PRESETS[key];
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

          setEpisode((prev) => {
            if (!prev) return null;
            const scenes = [...prev.scenes];
            scenes[i] = { ...scenes[i], generatedImage: { url: data.imageUrl, prompt: cohesivePrompt, seed: data.seed, isCharacterReference: isFirst, frameIndex: i } };
            if (isFirst) return { ...prev, scenes, continuityBible: { ...prev.continuityBible, characterReferenceImageUrl: data.imageUrl } };
            return { ...prev, scenes };
          });
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], imageStatus: 'complete' }; return n; });
        } catch (err) {
          console.error(`Image error scene ${i}:`, err);
          setSceneStatuses((prev) => { const n = [...prev]; n[i] = { ...n[i], imageStatus: 'error' }; return n; });
        }
      }

      // 3. Voices (parallel)
      setGenStage('voices');
      const voiceTone = fullProfile.sensoryPreferences.preferredVoiceTone;

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

      // 4. Videos (parallel submit using LOCAL image URLs — no React state dependency)
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

        try {
          const resp = await fetch('/api/video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'submit', imageUrl, prompt: videoPrompt, duration: 5, provider }),
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
              setEpisode((prev) => {
                if (!prev) return null;
                const scenes = [...prev.scenes];
                scenes[job.sceneIndex] = { ...scenes[job.sceneIndex], generatedVideo: { url: data.videoUrl, duration: 5, prompt: 'generated' } };
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
    return <GenerationProgress stage={genStage} topic={topic} sceneCount={5} sceneStatuses={sceneStatuses} provider={provider} />;
  }

  if (stage === 'playing' && episode) {
    return <VideoPlayer episode={episode} onBack={() => { setStage('topic'); setEpisode(null); setGenStage('story'); }} />;
  }

  return null;
}
