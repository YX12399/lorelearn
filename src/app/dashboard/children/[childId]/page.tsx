import Link from 'next/link';

interface PageProps {
  params: Promise<{ childId: string }>;
}

export default async function ChildProfilePage({ params }: PageProps) {
  const { childId } = await params;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/children" className="text-blue-600 hover:text-blue-800">
          ← Children
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium">Profile</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Child Profile</h1>
            <p className="text-gray-500 text-sm mt-1">ID: {childId}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/children/${childId}/edit`}
              className="px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-xl hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              Edit Profile
            </Link>
            <Link
              href={`/dashboard/children/${childId}/episodes`}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              View Episodes
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-5 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-700 mb-3">Basic Info</h3>
            <p className="text-gray-400 text-sm italic">Profile data will appear here once loaded from storage.</p>
          </div>
          <div className="p-5 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-700 mb-3">Interests</h3>
            <p className="text-gray-400 text-sm italic">Interests will appear here once loaded from storage.</p>
          </div>
          <div className="p-5 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-700 mb-3">Sensory Preferences</h3>
            <p className="text-gray-400 text-sm italic">Preferences will appear here once loaded from storage.</p>
          </div>
          <div className="p-5 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-700 mb-3">Emotional Goals</h3>
            <p className="text-gray-400 text-sm italic">Goals will appear here once loaded from storage.</p>
          </div>
        </div>

        <div className="mt-6 p-5 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-semibold text-blue-800 mb-2">Recent Episodes</h3>
          <p className="text-blue-600 text-sm">
            <Link href={`/dashboard/children/${childId}/episodes`} className="underline hover:no-underline">
              View all episodes for this child →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
