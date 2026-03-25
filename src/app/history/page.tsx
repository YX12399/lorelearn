'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getSavedEpisodes, deleteEpisodeFromHistory, type SavedEpisode } from '@/lib/episode-storage';

function EpisodeCard({ episode, onDelete, onSelect }: {
  episode: SavedEpisode; onDelete: (id: string) => void; onSelect: (ep: SavedEpisode) => void;
}) {
  const date = new Date(episode.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const videoCount = episode.scenes.filter((s) => s.videoUrl).length;
  const imageCount = episode.scenes.filter((s) => s.imageUrl).length;
  const mediaLabel = videoCount > 0 ? `${videoCount} video${videoCount !== 1 ? 's' : ''}` : `${imageCount} image${imageCount !== 1 ? 's' : ''}`;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-400/30 transition-all group">
      <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-indigo-900/50 relative overflow-hidden">
        {episode.thumbnail ? (
          <img src={episode.thumbnail} alt={episode.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><span className="text-4xl">🎬</span></div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
          <button onClick={() => onSelect(episode)}
            className="opacity-0 group-hover:opacity-100 transition-all w-14 h-14 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/30">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </button>
        </div>
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded-lg text-xs text-white/70">{mediaLabel}</div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm mb-1 truncate">{episode.title}</h3>
        <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
          <span>{episode.childName}</span><span>·</span><span>{formattedDate}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSelect(episode)} className="flex-1 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 text-xs font-medium transition-colors">
            Watch
          </button>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/episode/${episode.id}`); }}
            className="px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 text-xs transition-colors" title="Copy share link">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          </button>
          <button onClick={() => onDelete(episode.id)}
            className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-xs transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function EpisodeViewer({ episode, onBack }: { episode: SavedEpisode; onBack: () => void }) {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  // Scenes with any playable media
  const playableScenes = episode.scenes.filter((s) => s.videoUrl || s.imageUrl);
  const hasVideos = playableScenes.some((s) => s.videoUrl);
  const scene = playableScenes[currentScene];

  // Init audio refs
  useEffect(() => {
    audioRefs.current = playableScenes.map((s) => {
      if (!s.audioUrl) return null;
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = s.audioUrl;
      return audio;
    });
    return () => { audioRefs.current.forEach((a) => { if (a) { a.pause(); a.removeAttribute('src'); a.load(); } }); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode.id]);

  // Sync audio on scene change
  useEffect(() => {
    audioRefs.current.forEach((a, i) => { if (a && i !== currentScene) { a.pause(); a.currentTime = 0; } });
    if (isPlaying) {
      const audio = audioRefs.current[currentScene];
      if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene]);

  // Slideshow auto-advance
  useEffect(() => {
    if (hasVideos || !isPlaying) return;
    const audio = audioRefs.current[currentScene];
    if (!audio) {
      const t = setTimeout(() => advanceScene(), 5000);
      return () => clearTimeout(t);
    }
    const onEnd = () => advanceScene();
    audio.addEventListener('ended', onEnd);
    return () => audio.removeEventListener('ended', onEnd);
  });

  const advanceScene = () => {
    if (currentScene < playableScenes.length - 1) {
      const next = currentScene + 1;
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

  if (!scene) {
    return (
      <div className="text-center py-20">
        <p className="text-white/50">No playable scenes.</p>
        <button onClick={onBack} className="mt-4 px-6 py-2 bg-purple-500/20 text-purple-300 rounded-lg">Back</button>
      </div>
    );
  }

  const playScene = () => {
    setIsPlaying(true);
    if (scene.videoUrl && videoRef.current) videoRef.current.play().catch(() => {});
    const audio = audioRefs.current[currentScene];
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
  };

  const handleVideoEnded = () => {
    const audio = audioRefs.current[currentScene];
    if (audio && !audio.paused && !audio.ended) {
      if (videoRef.current) { videoRef.current.currentTime = Math.max(0, (videoRef.current.duration || 5) - 2); videoRef.current.play().catch(() => {}); }
      const onEnd = () => { audio.removeEventListener('ended', onEnd); advanceScene(); };
      audio.addEventListener('ended', onEnd);
    } else {
      advanceScene();
    }
  };

  const goToScene = (i: number) => {
    audioRefs.current.forEach((a) => { if (a) { a.pause(); a.currentTime = 0; } });
    setCurrentScene(i);
    setIsPlaying(false);
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const resp = await fetch(url); const blob = await resp.blob();
      const u = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = u; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u);
    } catch {}
  };
  const safeTitle = episode.title.replace(/[^a-zA-Z0-9]/g, '_');

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-4 text-sm text-white/40 hover:text-white/70 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to history
      </button>
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {scene.videoUrl ? (
            <video ref={videoRef} key={scene.videoUrl} src={scene.videoUrl} className="max-w-full max-h-full"
              onEnded={handleVideoEnded} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} playsInline />
          ) : scene.imageUrl ? (
            <img src={scene.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
          ) : null}
          {!isPlaying && (
            <button onClick={playScene} className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/30">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </button>
          )}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
              <p className="text-white text-sm">{scene.narration}</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold">{episode.title}</h2>
            <span className="text-purple-400 text-sm">Scene {currentScene + 1}/{playableScenes.length}</span>
          </div>
          <div className="flex gap-2 justify-center mb-3">
            {playableScenes.map((_, i) => (
              <button key={i} onClick={() => goToScene(i)}
                className={`h-1.5 rounded-full transition-all ${i === currentScene ? 'w-8 bg-purple-400' : 'w-4 bg-white/20'}`} />
            ))}
          </div>
          <div className="flex gap-2 justify-center flex-wrap">
            {scene.videoUrl && <button onClick={() => downloadFile(scene.videoUrl!, `${safeTitle}_scene_${currentScene + 1}.mp4`)}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm">Video</button>}
            {scene.audioUrl && <button onClick={() => downloadFile(scene.audioUrl!, `${safeTitle}_narration_${currentScene + 1}.mp3`)}
              className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm">Audio</button>}
            {scene.imageUrl && <button onClick={() => downloadFile(scene.imageUrl!, `${safeTitle}_scene_${currentScene + 1}.png`)}
              className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg text-sm">Image</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [episodes, setEpisodes] = useState<SavedEpisode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<SavedEpisode | null>(null);

  useEffect(() => { setEpisodes(getSavedEpisodes()); }, []);

  const handleDelete = (id: string) => {
    deleteEpisodeFromHistory(id);
    setEpisodes(getSavedEpisodes());
    if (selectedEpisode?.id === id) setSelectedEpisode(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/create" className="text-sm text-white/40 hover:text-white/70 flex items-center gap-1 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Create
            </Link>
            <h1 className="text-3xl font-bold text-white">Episode History</h1>
            <p className="text-purple-300 text-sm mt-1">{episodes.length} saved episode{episodes.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/create" className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 text-sm">
            Create New
          </Link>
        </div>
        {selectedEpisode ? (
          <EpisodeViewer episode={selectedEpisode} onBack={() => setSelectedEpisode(null)} />
        ) : episodes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📺</div>
            <h2 className="text-xl font-bold text-white mb-2">No episodes yet</h2>
            <p className="text-white/50 mb-6">Episodes auto-save here after generation.</p>
            <Link href="/create" className="px-6 py-3 bg-purple-500/20 text-purple-300 rounded-xl hover:bg-purple-500/30">Create your first episode</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {episodes.map((ep) => <EpisodeCard key={ep.id} episode={ep} onDelete={handleDelete} onSelect={setSelectedEpisode} />)}
          </div>
        )}
      </div>
    </div>
  );
}
