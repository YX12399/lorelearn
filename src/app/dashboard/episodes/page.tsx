import Link from 'next/link';

export default function EpisodesPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Episode Library</h1>
          <p className="text-gray-500 mt-1">All generated episodes across all children.</p>
        </div>
        <Link
          href="/dashboard/episodes/create"
          className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          + New Episode
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
        {['All', 'Blue Zone', 'Green Zone', 'Yellow Zone', 'Red Zone'].map((filter) => (
          <button
            key={filter}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:border-blue-300 hover:text-blue-700 whitespace-nowrap transition-colors"
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Empty state */}
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
    </div>
  );
}
