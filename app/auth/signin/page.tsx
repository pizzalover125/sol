import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignInButtons } from '@/components/auth/SignInButtons'
import { safeRedirect } from '@/lib/utils/safe-redirect'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>
}) {
  const { redirect: redirectTo, error } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect(safeRedirect(redirectTo))

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-[#111] border border-[#2d2d2d] rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-white font-bold text-xl mb-2 text-center">Sign in to Sol</h1>
        <p className="text-[#6b7280] text-sm text-center mb-6">
          Create and manage events
        </p>
        {error && (
          <p className="text-red-400 text-sm text-center mb-4">
            Authentication failed. Please try again.
          </p>
        )}
        <SignInButtons redirectTo={redirectTo} />
      </div>
    </main>
  )
}
