'use client';

import React from 'react';
import { Episode } from '@/types';
import { ZONE_COLORS } from '@/lib/emotions';

export type AssetStatus = 'pending' | 'generating' | 'complete' | 'error';

export interface SceneGenerationStatus {
  imageStatus: AssetStatus;
  voiceStatus: AssetStatus;
  videoStatus: AssetStatus;
}

interface StoryboardProps {
  episode: Episode;
  sceneStatuses: SceneGenerationStatus[];
  mode: 'generating' | 'review' | 'generating_video';
  onQuickPreview: () => void;
  onGenerateVideo: () => void;
}

function StatusPill({ label, status }: { label: string; status: AssetStatus }) {
  const classes: Record<AssetStatus, string> = {
    pending: 'bg-gray-100 text-gray-500',
    generating: 'bg-yellow-100 text-yellow-700 animate-pulse',
    complete: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-600',
  };
  const icons: Record<AssetStatus, string> = {
    pending: '○',
    generating: '↻',
    complete: '✓',
    error: '✕',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${classes[status]}`}>
      <span>{icons[status]}</span>
      {label}
    </span>
  );
}

export default function Storyboard({
  episode,
  sceneStatuses,
  mode,
  onQuickPreview,
  onGenerateVideo,
}: StoryboardProps) {
  const totalScenes = episode.scenes.length;
  const imagesComplete = sceneStatuses.filter(s => s.imageStatus === 'complete').length;
  const voiceComplete = sceneStatuses.filter(s => s.voiceStatus === 'complete').length;
  const videosComplete = sceneStatuses.filter(s => s.videoStatus === 'complete').length;

  const overallProgress =
    mode === 'generating_video'
      ? Math.round((videosComplete / totalScenes) * 100)
      : Math.round(((imagesComplete + voiceComplete) / (totalScenes * 2)) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">
              {mode === 'generating' ? '🎨' : mode === 'generating_video' ? '🎬' : '✨'}
            </div>
            <h1 className="text-2xl font-bold text-blue-700 mb-1">
              {mode === 'generating'
                ? 'Building Your Storyboard…'
                : mode === 'generating_video'
                ? 'Animating Your Episode…'
                : 'Storyboard Ready!'}
            </h1>
            <p className="text-gray-500 text-sm">
              {mode === 'generating'
                ? `Generating images and narration for ${episode.title}`
                : mode === 'generating_video'
                ? 'Creating animated videos for each scene'
                : 'Review your scenes before watching'}
            </p>
          </div>

          {/* Progress bar */}
          {(mode === 'generating' || mode === 'generating_video') && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>
                  {mode === 'generating'
                    ? `Images: ${imagesComplete}/${totalScenes} · Narration: ${voiceComplete}/${totalScenes}`
                    : `Videos: ${videosComplete}/${totalScenes}`}
                </span>
                <span>{overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons (review mode only) */}
          {mode === 'review' && (
            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              <button
                onClick={onQuickPreview}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
              >
                ▶ Quick Preview (Slideshow)
              </button>
              <button
                onClick={onGenerateVideo}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
              >
                🎬 Generate Full Video
              </button>
            </div>
          )}
        </div>

        {/* Scene cards */}
        <div className="space-y-4">
          {episode.scenes.map((scene, i) => {
            const status = sceneStatuses[i] ?? {
              imageStatus: 'pending' as AssetStatus,
              voiceStatus: 'pending' as AssetStatus,
              videoStatus: 'pending' as AssetStatus,
            };
            const zoneColors = ZONE_COLORS[scene.emotionBeat.zone];

            return (
              <div key={scene.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Image / video area */}
                  <div className="sm:w-60 sm:flex-shrink-0">
                    <div className="relative w-full aspect-video sm:aspect-square bg-gradient-to-br from-blue-50 to-purple-50">
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
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                          {status.imageStatus === 'generating' ? (
                            <>
                              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                              <span className="text-xs text-gray-400 text-center">Generating image…</span>
                            </>
                          ) : (
                            <>
                              <span className="text-2xl">🖼️</span>
                              <span className="text-xs text-gray-400 text-center leading-tight">
                                {scene.visualPrompt.substring(0, 60)}…
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Scene number badge */}
                      <div className="absolute top-2 left-2 w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow">
                        {i + 1}
                      </div>

                      {/* Video generating overlay */}
                      {status.videoStatus === 'generating' && (
                        <div className="absolute inset-0 bg-purple-900 bg-opacity-50 flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-4 border-purple-200 border-t-white rounded-full animate-spin" />
                          <span className="text-xs text-white font-medium">Animating…</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Text content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-800 text-base leading-tight">{scene.title}</h3>
                      <span
                        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium border ${zoneColors.bg} ${zoneColors.text} ${zoneColors.border}`}
                      >
                        {zoneColors.label}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{scene.narration}</p>

                    {/* Status pills */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <StatusPill label="Image" status={status.imageStatus} />
                      <StatusPill label="Voice" status={status.voiceStatus} />
                      {(mode === 'generating_video' || status.videoStatus !== 'pending') && (
                        <StatusPill label="Video" status={status.videoStatus} />
                      )}
                    </div>

                    {/* Audio player */}
                    {scene.generatedAudio?.url && (
                      <audio
                        controls
                        src={scene.generatedAudio.url}
                        className="w-full"
                        style={{ height: '32px' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
