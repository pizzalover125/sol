import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl font-extrabold text-[#1f1f1f] mb-4">404</div>
      <h1 className="text-white font-bold text-xl mb-2">Page not found</h1>
      <p className="text-[#6b7280] text-sm mb-6">
        This event or page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2 rounded-lg text-sm font-semibold"
      >
        Back to home
      </Link>
    </main>
  )
}
