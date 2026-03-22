import Link from 'next/link';
import { getEpisodes } from '@/lib/supabase/db/episodes';
import type { ZoneOfRegulation } from '@/types';

const ZONE_STYLES: Record<ZoneOfRegulation, { badge: string; dot: string }> = {
  green: { badge: 'bg-green-100 text-green-700', dot: 'bg-green-400' },
  yellow: { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  blue: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  red: { badge: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
};

export default async function EpisodesPage() {
  let episodes: Awaited<ReturnType<typeof getEpisodes>> = [];
  let dbError = false;

  try {
    episodes = await getEpisodes();
  } catch {
    dbError = true;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Episode Library</h1>
          <p className="text-gray-500 mt-1">All generated episodes across all children.</p>
        </div>
        <Link
          href="/create"
          className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          + New Episode
        </Link>
      </div>

      {dbError && (
        <div className="mb-6 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
          Could not load episodes — check your Supabase configuration.
        </div>
      )}

      {episodes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your episode library is empty</h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Episodes you generate will appear here. Each one is unique to your child.
          </p>
          <Link
            href="/create"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Generate First Episode ✨
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {episodes.map((episode) => {
            const firstZone = episode.scenes[0]?.emotionBeat.zone ?? 'green';
            const zoneStyle = ZONE_STYLES[firstZone];
            const statusDone = episode.status === 'complete';

            return (
              <div
                key={episode.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-lg leading-snug pr-3">
                    {episode.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${zoneStyle.badge}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${zoneStyle.dot} mr-1 align-middle`} />
                    {firstZone} zone
                  </span>
                </div>

                <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                  {episode.learningObjective}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span>{episode.childProfile.name} · Age {episode.childProfile.age}</span>
                  <span>{episode.scenes.length} scenes</span>
                </div>

                <div className="flex gap-2">
                  {statusDone ? (
                    <Link
                      href={`/viewer/${episode.id}`}
                      className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl text-center hover:bg-blue-700 transition-colors"
                    >
                      Watch ▶
                    </Link>
                  ) : (
                    <span className="flex-1 py-2.5 bg-gray-100 text-gray-500 text-sm font-medium rounded-xl text-center">
                      {episode.status.replace(/_/g, ' ')}…
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
