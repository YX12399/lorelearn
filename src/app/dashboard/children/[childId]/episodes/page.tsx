import Link from 'next/link';

interface PageProps {
  params: Promise<{ childId: string }>;
}

export default async function ChildEpisodesPage({ params }: PageProps) {
  const { childId } = await params;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/children" className="text-blue-600 hover:text-blue-800">
          ← Children
        </Link>
        <span className="text-gray-300">/</span>
        <Link href={`/dashboard/children/${childId}`} className="text-blue-600 hover:text-blue-800">
          Profile
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium">Episodes</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Episodes</h1>
        <Link
          href="/create"
          className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          + New Episode
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
        <div className="text-5xl mb-4">🎬</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No episodes yet</h2>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          Generate the first personalized episode for this child.
        </p>
        <Link
          href="/create"
          className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Create Episode ✨
        </Link>
      </div>
    </div>
  );
}
