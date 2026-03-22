import Link from 'next/link';

// In a real app this would load from a database/localStorage.
// For now, it's a static shell demonstrating the UI.
export default function ChildrenPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
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

      {/* Empty state */}
      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
        <div className="text-6xl mb-4">👧</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No child profiles yet</h2>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          Create a child profile to start generating personalized episodes. Each profile remembers
          their interests, sensory needs, and emotional goals.
        </p>
        <Link
          href="/create"
          className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Create First Profile ✨
        </Link>
      </div>

      {/* How profiles work */}
      <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="font-bold text-blue-900 mb-2">What goes in a profile?</h3>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>• Name, age, and avatar description</li>
          <li>• Favorite animals, foods, TV shows, games, and colors</li>
          <li>• Sensory preferences (visual sensitivity, audio, pacing)</li>
          <li>• Emotional learning goals (e.g., self-regulation, coping strategies)</li>
          <li>• Current learning topic and level</li>
        </ul>
      </div>
    </div>
  );
}
