import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: '🏠' },
  { href: '/dashboard/children', label: 'Children', icon: '👧' },
  { href: '/dashboard/episodes', label: 'Episodes', icon: '🎬' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col min-h-screen">
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="text-lg font-bold text-blue-700">LoreLearn</span>
          </Link>
          <p className="text-xs text-gray-400 mt-1">Parent Dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <Link
            href="/create"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <span>+</span> New Episode
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
