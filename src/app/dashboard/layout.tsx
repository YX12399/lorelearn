import Link from 'next/link';
import { signOut } from '@/lib/supabase/auth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: '🏠' },
  { href: '/dashboard/children', label: 'Children', icon: '👧' },
  { href: '/dashboard/episodes', label: 'Episodes', icon: '🎬' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
];

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let email = '';
  if (supabaseConfigured) {
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      email = user?.email ?? '';
    } catch {
      // Supabase unavailable — continue without user info
    }
  }
  const initials = email ? email[0].toUpperCase() : '?';

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

        <div className="p-4 space-y-3 border-t border-gray-100">
          <Link
            href="/create"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <span>+</span> New Episode
          </Link>

          {/* User info + sign out */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <p className="text-xs text-gray-500 truncate flex-1">{email || 'Not signed in'}</p>
            {supabaseConfigured && (
              <form action={signOut}>
                <button
                  type="submit"
                  title="Sign out"
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {!supabaseConfigured && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 text-sm text-yellow-800">
            Supabase not configured yet — dashboard is in preview mode. Auth and data features are disabled.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
