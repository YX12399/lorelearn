'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { EpisodeHistoryItem } from '../../types';

export default function HistoryPage() {
  const [episodes, setEpisodes] = useState<EpisodeHistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lorelearn_history');
      if (raw) {
        setEpisodes(JSON.parse(raw));
      }
    } catch (err) {
      console.warn('[History] Failed to load:', err);
    }
    setLoaded(true);
  }, []);

  const deleteEpisode = (id: string) => {
    const updated = episodes.filter(e => e.id !== id);
    setEpisodes(updated);
    localStorage.setItem('lorelearn_history', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--accent-glow)' }}>
              Your Episodes
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {episodes.length} episode{episodes.length !== 1 ? 's' : ''} created
            </p>
          </div>
          <Link
            href="/create"
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            + New Episode
          </Link>
        </div>

        {/* Episode List */}
        {!loaded ? (
          <div className="text-center py-20 loading-pulse" style={{ color: 'var(--text-muted)' }}>
            Loading...
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">&#x1F4DA;</div>
            <p style={{ color: 'var(--text-muted)' }}>No episodes yet. Create your first one!</p>
            <Link
              href="/create"
              className="inline-block mt-4 px-6 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {episodes.map(ep => (
              <div
                key={ep.id}
                className="flex items-center gap-4 rounded-xl p-3 transition-all hover:scale-[1.01]"
                style={{ background: 'var(--surface)' }}
              >
                {/* Thumbnail */}
                <div
                  className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ background: 'var(--surface-hover)' }}
                >
                  {ep.thumbnailUrl ? (
                    <img
                      src={ep.thumbnailUrl}
                      alt={ep.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">&#x1F3AC;</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/episode/${ep.id}`} className="block">
                    <h3 className="font-medium text-sm truncate">{ep.title}</h3>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {ep.topic}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(ep.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    href={`/episode/${ep.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    Watch
                  </Link>
                  <button
                    onClick={() => deleteEpisode(ep.id)}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: 'var(--surface-hover)', color: 'var(--error)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
