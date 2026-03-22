import Link from 'next/link';
import { getChildren } from '@/lib/supabase/db/children';

export default async function ChildrenPage() {
  let children: Awaited<ReturnType<typeof getChildren>> = [];
  let dbError = false;

  try {
    children = await getChildren();
  } catch {
    dbError = true;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Children</h1>
          <p className="text-gray-500 mt-1">Manage your child profiles.</p>
        </div>
        <Link
          href="/create"
          className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          + Add Child
        </Link>
      </div>

      {dbError && (
        <div className="mb-6 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
          Could not load profiles — check your Supabase configuration.
        </div>
      )}

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="text-6xl mb-4">👧</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No child profiles yet</h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create a child profile to start generating personalized episodes.
          </p>
          <Link
            href="/create"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create First Profile ✨
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/dashboard/children/${child.id}`}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
                  {child.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{child.name}</h3>
                  <p className="text-gray-500 text-sm">Age {child.age} · {child.learningLevel}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium">Topic:</span> {child.learningTopic}
              </p>
              {child.interests.specialInterests.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {child.interests.specialInterests.slice(0, 3).map((interest) => (
                    <span key={interest} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {children.length > 0 && (
        <div className="mt-6 bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-1">Profile tip</h3>
          <p className="text-blue-700 text-sm">
            Keep interests and sensory preferences updated as your child grows — it makes each new episode more personalized.
          </p>
        </div>
      )}
    </div>
  );
}
