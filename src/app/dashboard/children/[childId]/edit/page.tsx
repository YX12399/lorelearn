import Link from 'next/link';

interface PageProps {
  params: Promise<{ childId: string }>;
}

export default async function EditChildPage({ params }: PageProps) {
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
        <span className="text-gray-700 font-medium">Edit</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
        <p className="text-gray-500 mb-8">Update the child&apos;s interests, preferences, and learning goals.</p>

        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <div className="text-4xl mb-3">🔧</div>
          <p className="text-gray-500 mb-4">
            The edit form loads the child&apos;s existing profile from storage.
          </p>
          <Link
            href="/create"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create a New Profile Instead
          </Link>
        </div>
      </div>
    </div>
  );
}
