import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function NavBar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="bg-[#0f0f0f] border-b border-[#1a1a1a] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="font-extrabold text-lg text-white tracking-tight">
        sol
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link
              href="/events/new"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              + Create Event
            </Link>
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold"
              title="Dashboard"
            >
              {user.email?.charAt(0).toUpperCase() ?? 'U'}
            </Link>
          </>
        ) : (
          <Link
            href="/auth/signin"
            className="text-[#9ca3af] text-sm hover:text-white transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
