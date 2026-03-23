import Link from 'next/link';

const FEATURES = [
  {
    icon: '🌟',
    title: 'Personalized Stories',
    description:
      'Every episode stars your child as the hero, woven with their favorite characters, colors, and interests.',
  },
  {
    icon: '🧠',
    title: 'Emotional Learning',
    description:
      'Built on the Zones of Regulation framework to help children identify and manage their emotions.',
  },
  {
    icon: '🎨',
    title: 'Sensory-Safe Design',
    description:
      'Calming colors, predictable pacing, no flashing — designed for sensory comfort.',
  },
  {
    icon: '🎬',
    title: 'AI-Generated Animation',
    description:
      'Each episode is uniquely created with AI images, video, and narration — no two episodes are alike.',
  },
  {
    icon: '🤝',
    title: 'Interactive Moments',
    description:
      'Pause-and-breathe breaks, emotion check-ins, and choice points keep children engaged and learning.',
  },
  {
    icon: '📊',
    title: 'Parent Dashboard',
    description:
      'Track emotional progress, create multiple profiles, and build a personalized episode library.',
  },
];

const ZONES = [
  { color: 'bg-blue-300', label: 'Blue Zone', description: 'Calm, rested, bored' },
  { color: 'bg-green-400', label: 'Green Zone', description: 'Happy, focused, ready to learn' },
  { color: 'bg-yellow-400', label: 'Yellow Zone', description: 'Excited, frustrated, worried' },
  { color: 'bg-red-400', label: 'Red Zone', description: 'Overwhelmed, very upset, angry' },
];

const HOW_STEPS = [
  {
    step: '1',
    title: 'Create a Profile',
    description:
      "Tell us your child's name, interests, sensory preferences, and what emotional skills they're working on.",
  },
  {
    step: '2',
    title: 'Generate an Episode',
    description:
      'Our AI crafts a personalized story, then generates images, animation, and narration just for them.',
  },
  {
    step: '3',
    title: 'Watch and Learn',
    description:
      'Enjoy the episode together with interactive moments, breathing breaks, and emotion check-ins built in.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-xl font-bold text-blue-700">LoreLearn</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/history" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">
              History
            </Link>
            <Link href="/profile" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">
              Profiles
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">
              Dashboard
            </Link>
            <Link
              href="/create"
              className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Create Episode
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 via-purple-50 to-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-8">
            <span>🌈</span>
            <span>Personalized Learning for Every Child</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Where every child is the{' '}
            <span className="text-blue-600">hero</span> of their own{' '}
            <span className="text-purple-600">learning adventure</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            LoreLearn creates personalized animated episodes for autistic children — starring them,
            featuring their interests, and teaching emotional regulation in a safe, sensory-friendly way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:bg-blue-700 transition-all hover:scale-105 shadow-lg"
            >
              Create Your Child&apos;s First Episode ✨
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-white text-blue-600 text-lg font-bold rounded-2xl border-2 border-blue-200 hover:border-blue-400 transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Zones of Regulation */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Built on Zones of Regulation</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Every episode is crafted around a proven emotional learning framework that helps children
              understand and manage how their bodies and minds feel.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ZONES.map((zone) => (
              <div key={zone.label} className="text-center p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className={`w-12 h-12 ${zone.color} rounded-full mx-auto mb-3`} />
                <p className="font-bold text-gray-800 text-sm mb-1">{zone.label}</p>
                <p className="text-gray-500 text-xs">{zone.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything designed with care</h2>
            <p className="text-gray-600">
              Every detail of LoreLearn was built with autistic children and their families in mind.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-600">Three simple steps to a fully personalized learning episode.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-blue-600 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-blue-50 to-purple-50">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to create your child&apos;s adventure?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            It only takes a few minutes to set up a profile and generate your first personalized episode.
          </p>
          <Link
            href="/create"
            className="inline-block px-10 py-5 bg-blue-600 text-white text-xl font-bold rounded-2xl hover:bg-blue-700 transition-all hover:scale-105 shadow-xl"
          >
            Get Started — It&apos;s Free ✨
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="font-bold text-blue-700">LoreLearn</span>
          </div>
          <p className="text-gray-500 text-sm">
            Built with love for every child&apos;s unique learning journey.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/history" className="hover:text-blue-600 transition-colors">
              History
            </Link>
            <Link href="/profile" className="hover:text-blue-600 transition-colors">
              Profiles
            </Link>
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/create" className="hover:text-blue-600 transition-colors">
              Create Episode
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
