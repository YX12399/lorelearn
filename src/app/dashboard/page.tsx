import Link from 'next/link';

const QUICK_LINKS = [
  {
    href: '/dashboard/children',
    icon: '👧',
    label: 'Manage Children',
    description: 'Add and edit child profiles',
    color: 'bg-purple-50 border-purple-100 hover:border-purple-300',
    iconBg: 'bg-purple-100',
  },
  {
    href: '/dashboard/episodes/create',
    icon: '🎬',
    label: 'Create Episode',
    description: 'Generate a new personalized episode',
    color: 'bg-blue-50 border-blue-100 hover:border-blue-300',
    iconBg: 'bg-blue-100',
  },
  {
    href: '/dashboard/episodes',
    icon: '📚',
    label: 'Episode Library',
    description: 'Browse all generated episodes',
    color: 'bg-green-50 border-green-100 hover:border-green-300',
    iconBg: 'bg-green-100',
  },
  {
    href: '/dashboard/analytics',
    icon: '📊',
    label: 'Analytics',
    description: 'Track emotional learning progress',
    color: 'bg-yellow-50 border-yellow-100 hover:border-yellow-300',
    iconBg: 'bg-yellow-100',
  },
];

const ZONE_TIPS = [
  { zone: 'Blue Zone', color: 'bg-blue-300', tip: 'Low energy? Try a calm, slow-paced episode with soothing narration.' },
  { zone: 'Green Zone', color: 'bg-green-400', tip: "Ready to learn! Great time for a new topic or a challenging interactive episode." },
  { zone: 'Yellow Zone', color: 'bg-yellow-400', tip: 'Feeling big feelings? A breathing exercise episode can help regulate.' },
  { zone: 'Red Zone', color: 'bg-red-400', tip: 'Overwhelmed? Take a break — try a short calming story first.' },
];

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back! 👋</h1>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your LoreLearn dashboard.</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`p-6 rounded-2xl border-2 transition-all ${link.color}`}
          >
            <div className={`w-12 h-12 ${link.iconBg} rounded-xl flex items-center justify-center text-2xl mb-3`}>
              {link.icon}
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">{link.label}</h3>
            <p className="text-gray-500 text-sm">{link.description}</p>
          </Link>
        ))}
      </div>

      {/* Zone tips */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 text-xl mb-1">Zone of Regulation Guide</h2>
        <p className="text-gray-500 text-sm mb-5">
          Choose the right episode based on how your child is feeling right now.
        </p>
        <div className="space-y-3">
          {ZONE_TIPS.map((tip) => (
            <div key={tip.zone} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
              <div className={`w-5 h-5 ${tip.color} rounded-full flex-shrink-0 mt-0.5`} />
              <div>
                <p className="font-semibold text-gray-800 text-sm">{tip.zone}</p>
                <p className="text-gray-500 text-sm">{tip.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Ready for a new adventure?</h2>
        <p className="text-blue-100 mb-5">Create a fully personalized episode in minutes.</p>
        <Link
          href="/create"
          className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors"
        >
          Create New Episode ✨
        </Link>
      </div>
    </div>
  );
}
