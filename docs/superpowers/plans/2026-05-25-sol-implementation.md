# Sol — Luma Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Sol, an open-source Luma-clone event management web app with event creation, public event pages, and RSVP registration.

**Architecture:** Next.js 15 App Router with server components for data fetching and server actions for mutations. Supabase handles Postgres, Auth (Google/GitHub OAuth), and Storage (cover images). No separate API layer — everything flows through server components and server actions.

**Tech Stack:** Next.js 15, Supabase (`@supabase/ssr`), Tailwind CSS, Tiptap (rich text), nanoid (slug generation), Vitest + React Testing Library

---

## File Map

```
sol/
├── app/
│   ├── layout.tsx                        # Root layout — NavBar + dark bg
│   ├── globals.css                       # Tailwind directives + base styles
│   ├── page.tsx                          # Homepage: hero + event grid
│   ├── not-found.tsx                     # Global 404
│   ├── auth/
│   │   ├── signin/page.tsx               # Sign in page (server) + SignInButtons
│   │   └── callback/route.ts             # Supabase OAuth exchange
│   ├── dashboard/page.tsx                # My events list (auth required)
│   └── events/
│       ├── new/page.tsx                  # Create event (wraps EventForm)
│       └── [slug]/
│           ├── page.tsx                  # Public event page
│           └── manage/page.tsx           # Edit + attendee list (host only)
├── components/
│   ├── layout/NavBar.tsx                 # Server component, auth-aware
│   ├── auth/SignInButtons.tsx            # Client component, OAuth buttons
│   └── events/
│       ├── EventCard.tsx                 # Reusable event card (server)
│       ├── EventGrid.tsx                 # Client component, search filter
│       ├── RSVPCard.tsx                  # Client component, register/cancel
│       ├── EventForm.tsx                 # Client component, Tiptap + live preview
│       └── AttendeeList.tsx             # Server component, attendee table
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Browser Supabase client
│   │   └── server.ts                     # Server Supabase client (async)
│   ├── actions/
│   │   ├── events.ts                     # createEvent, updateEvent, publishEvent
│   │   └── registrations.ts             # registerForEvent, cancelRegistration
│   └── utils/
│       ├── slug.ts                       # generateSlug(title) → string
│       └── slug.test.ts                  # Vitest unit tests
├── types/database.ts                     # TypeScript interfaces for DB tables
├── middleware.ts                         # Protect /dashboard, /events/new, /events/*/manage
├── supabase/migrations/
│   ├── 001_create_profiles.sql
│   ├── 002_create_events.sql
│   └── 003_create_registrations.sql
├── vitest.config.ts
├── vitest.setup.ts
└── .env.local.example
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `.env.local.example`
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Modify: `next.config.ts`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /Users/adi/0projects/luma
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```

Expected: Next.js 15 project created with App Router, TypeScript, Tailwind.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr nanoid @tiptap/react @tiptap/pm @tiptap/starter-kit
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 5: Create vitest.setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 7: Update tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
```

- [ ] **Step 8: Replace app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

html {
  background: #0a0a0a;
  color: #f9fafb;
}
```

- [ ] **Step 9: Create .env.local.example**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 project with Supabase, Tiptap, Vitest"
```

---

## Task 2: Database Migrations

**Files:**
- Create: `supabase/migrations/001_create_profiles.sql`
- Create: `supabase/migrations/002_create_events.sql`
- Create: `supabase/migrations/003_create_registrations.sql`

- [ ] **Step 1: Create migrations directory**

```bash
mkdir -p supabase/migrations
```

- [ ] **Step 2: Create 001_create_profiles.sql**

```sql
-- supabase/migrations/001_create_profiles.sql

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile when a user signs up via OAuth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'user_name',
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 6)
    ),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 3: Create 002_create_events.sql**

```sql
-- supabase/migrations/002_create_events.sql

create type event_status as enum ('draft', 'published', 'cancelled');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  cover_image_url text,
  location_name text,
  location_address text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  is_public boolean default true not null,
  status event_status default 'draft' not null,
  created_at timestamptz default now() not null
);

alter table public.events enable row level security;

-- Anyone can read published public events
create policy "Published public events are readable"
  on public.events for select
  using (status = 'published' and is_public = true);

-- Hosts can read all their own events (including drafts)
create policy "Hosts can read their own events"
  on public.events for select
  using (auth.uid() = host_id);

-- Authenticated users can create events
create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.uid() = host_id);

-- Hosts can update their own events
create policy "Hosts can update their own events"
  on public.events for update
  using (auth.uid() = host_id);
```

- [ ] **Step 4: Create 003_create_registrations.sql**

```sql
-- supabase/migrations/003_create_registrations.sql

create type registration_status as enum ('confirmed', 'cancelled');

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status registration_status default 'confirmed' not null,
  created_at timestamptz default now() not null,
  unique(event_id, user_id)
);

alter table public.registrations enable row level security;

-- Users see their own registrations
create policy "Users can read own registrations"
  on public.registrations for select
  using (auth.uid() = user_id);

-- Hosts see registrations for their events
create policy "Hosts can read registrations for their events"
  on public.registrations for select
  using (
    exists (
      select 1 from public.events
      where events.id = registrations.event_id
        and events.host_id = auth.uid()
    )
  );

-- Authenticated users can register
create policy "Authenticated users can register"
  on public.registrations for insert
  with check (auth.uid() = user_id);

-- Users can cancel their own registrations
create policy "Users can cancel own registrations"
  on public.registrations for update
  using (auth.uid() = user_id);
```

- [ ] **Step 5: Apply migrations**

In Supabase dashboard → SQL Editor, run each migration file in order (001, 002, 003).

Also create Storage bucket: Dashboard → Storage → New bucket → name: `event-covers` → Public: true.

- [ ] **Step 6: Commit**

```bash
git add supabase/
git commit -m "feat: add database migrations for profiles, events, registrations"
```

---

## Task 3: Types + Supabase Clients

**Files:**
- Create: `types/database.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Create types/database.ts**

```typescript
export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

export interface Event {
  id: string
  slug: string
  host_id: string
  title: string
  description: string | null
  cover_image_url: string | null
  location_name: string | null
  location_address: string | null
  starts_at: string
  ends_at: string | null
  capacity: number | null
  is_public: boolean
  status: 'draft' | 'published' | 'cancelled'
  created_at: string
}

export interface Registration {
  id: string
  event_id: string
  user_id: string
  status: 'confirmed' | 'cancelled'
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
      }
      registrations: {
        Row: Registration
        Insert: Omit<Registration, 'id' | 'created_at'>
        Update: Partial<Omit<Registration, 'id' | 'created_at'>>
      }
    }
  }
}
```

- [ ] **Step 2: Create lib/supabase/client.ts**

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create lib/supabase/server.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — cookies are read-only, safe to ignore
          }
        },
      },
    }
  )
}
```

- [ ] **Step 4: Copy .env.local.example to .env.local and fill in values**

Get `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase dashboard → Project Settings → API.

- [ ] **Step 5: Commit**

```bash
git add types/ lib/
git commit -m "feat: add database types and Supabase client helpers"
```

---

## Task 4: Middleware + Auth Routes

**Files:**
- Create: `middleware.ts`
- Create: `app/auth/signin/page.tsx`
- Create: `components/auth/SignInButtons.tsx`
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Create middleware.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/events/new') ||
    /^\/events\/[^/]+\/manage/.test(pathname)

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Create components/auth/SignInButtons.tsx**

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

export function SignInButtons({ redirectTo }: { redirectTo?: string }) {
  const supabase = createClient()

  async function signIn(provider: 'google' | 'github') {
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    if (redirectTo) callbackUrl.searchParams.set('next', redirectTo)

    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl.toString() },
    })
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => signIn('google')}
        className="w-full bg-white text-gray-900 font-semibold text-sm py-3 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
      <button
        onClick={() => signIn('github')}
        className="w-full bg-[#1a1a1a] border border-[#2d2d2d] text-white font-semibold text-sm py-3 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-[#222] transition-colors"
      >
        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
        Continue with GitHub
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create app/auth/signin/page.tsx**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignInButtons } from '@/components/auth/SignInButtons'

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

  if (user) redirect(redirectTo ?? '/dashboard')

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
```

- [ ] **Step 4: Create app/auth/callback/route.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/signin?error=oauth`)
}
```

- [ ] **Step 5: Enable Google + GitHub OAuth in Supabase**

In Supabase dashboard → Authentication → Providers:
- Enable Google: add Client ID + Secret from Google Cloud Console. Callback URL: `https://<project>.supabase.co/auth/v1/callback`
- Enable GitHub: add Client ID + Secret from GitHub OAuth App. Callback URL same as above.

- [ ] **Step 6: Commit**

```bash
git add middleware.ts app/auth/ components/auth/
git commit -m "feat: add route protection middleware and OAuth sign-in flow"
```

---

## Task 5: Layout + NavBar

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/layout/NavBar.tsx`
- Create: `app/not-found.tsx`

- [ ] **Step 1: Create components/layout/NavBar.tsx**

```typescript
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
```

- [ ] **Step 2: Replace app/layout.tsx**

```typescript
import type { Metadata } from 'next'
import { NavBar } from '@/components/layout/NavBar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sol',
  description: 'Open source event management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white min-h-screen antialiased">
        <NavBar />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Create app/not-found.tsx**

```typescript
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
```

- [ ] **Step 4: Run the dev server and verify the NavBar renders**

```bash
npm run dev
```

Open http://localhost:3000. Expected: dark page with "sol" in top-left nav, "Sign in" link on right.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/not-found.tsx components/layout/
git commit -m "feat: add root layout, NavBar, and 404 page"
```

---

## Task 6: Slug Utility + Tests

**Files:**
- Create: `lib/utils/slug.ts`
- Create: `lib/utils/slug.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `lib/utils/slug.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateSlug } from './slug'

describe('generateSlug', () => {
  it('lowercases and kebab-cases the title', () => {
    const slug = generateSlug('Hello World Event')
    expect(slug).toMatch(/^hello-world-event-[a-z0-9]{6}$/)
  })

  it('strips special characters', () => {
    const slug = generateSlug('Event! @#$% Name')
    expect(slug).toMatch(/^event-name-[a-z0-9]{6}$/)
  })

  it('collapses multiple spaces and hyphens', () => {
    const slug = generateSlug('Event   ---   Name')
    expect(slug).toMatch(/^event-name-[a-z0-9]{6}$/)
  })

  it('trims leading and trailing hyphens', () => {
    const slug = generateSlug('  Event Name  ')
    expect(slug).toMatch(/^event-name-[a-z0-9]{6}$/)
  })

  it('truncates very long titles to 50 chars before suffix', () => {
    const longTitle = 'a'.repeat(100)
    const slug = generateSlug(longTitle)
    const base = slug.replace(/-[a-z0-9]{6}$/, '')
    expect(base.length).toBeLessThanOrEqual(50)
  })

  it('appends a unique 6-char suffix', () => {
    const slug1 = generateSlug('Same Title')
    const slug2 = generateSlug('Same Title')
    expect(slug1).not.toBe(slug2)
  })

  it('returns a non-empty string for empty input', () => {
    const slug = generateSlug('')
    expect(slug).toMatch(/^[a-z0-9]{6}$/)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test:run lib/utils/slug.test.ts
```

Expected: `FAIL — cannot find module './slug'`

- [ ] **Step 3: Create lib/utils/slug.ts**

```typescript
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

  if (!base) return nanoid()
  return `${base}-${nanoid()}`
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test:run lib/utils/slug.test.ts
```

Expected: `PASS — 7 tests passed`

- [ ] **Step 5: Commit**

```bash
git add lib/utils/
git commit -m "feat: add generateSlug utility with tests"
```

---

## Task 7: EventCard + EventGrid + Homepage

**Files:**
- Create: `components/events/EventCard.tsx`
- Create: `components/events/EventGrid.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create components/events/EventCard.tsx**

```typescript
import Link from 'next/link'
import type { Event, Profile } from '@/types/database'

export type EventWithHost = Event & {
  profiles: Pick<Profile, 'display_name' | 'avatar_url'>
}

interface EventCardProps {
  event: EventWithHost
  registrationCount: number
}

export function EventCard({ event, registrationCount }: EventCardProps) {
  const startDate = new Date(event.starts_at)
  const formattedDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link href={`/events/${event.slug}`} className="block group">
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden hover:border-[#3d3d3d] transition-colors cursor-pointer">
        <div className="h-32 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
          {event.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="p-4">
          <div className="text-[#6b7280] text-xs uppercase tracking-wide mb-1">
            {formattedDate} · {event.location_name ?? 'Online'}
          </div>
          <div className="text-white font-bold text-sm mb-3 line-clamp-2">
            {event.title}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0 overflow-hidden">
              {event.profiles.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <span className="text-[#9ca3af] text-xs truncate">
              {event.profiles.display_name}
            </span>
            <span className="ml-auto text-[#6366f1] text-xs font-semibold flex-shrink-0">
              {registrationCount} going
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create components/events/EventGrid.tsx**

```typescript
'use client'

import { useState } from 'react'
import { EventCard, type EventWithHost } from './EventCard'

interface EventGridProps {
  events: EventWithHost[]
  countMap: Record<string, number>
}

export function EventGrid({ events, countMap }: EventGridProps) {
  const [search, setSearch] = useState('')

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-bold text-lg">Upcoming Events</h2>
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#1a1a1a] border border-[#2d2d2d] text-[#9ca3af] text-sm px-4 py-2 rounded-lg placeholder:text-[#4b5563] focus:outline-none focus:border-[#6366f1] w-56"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#4b5563]">
          {search ? 'No events match your search.' : 'No upcoming events yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              registrationCount={countMap[event.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Replace app/page.tsx**

```typescript
import { createClient } from '@/lib/supabase/server'
import { EventGrid } from '@/components/events/EventGrid'
import type { EventWithHost } from '@/components/events/EventCard'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*, profiles:host_id (display_name, avatar_url)')
    .eq('status', 'published')
    .eq('is_public', true)
    .order('starts_at', { ascending: true })

  const eventIds = (events ?? []).map((e) => e.id)

  const countMap: Record<string, number> = {}
  if (eventIds.length > 0) {
    const { data: regRows } = await supabase
      .from('registrations')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'confirmed')

    for (const row of regRows ?? []) {
      countMap[row.event_id] = (countMap[row.event_id] ?? 0) + 1
    }
  }

  return (
    <main>
      {/* Hero */}
      <section className="py-20 px-6 text-center border-b border-[#141414]">
        <div className="inline-block bg-[#1a1a2e] border border-[#312e81] text-[#a5b4fc] text-xs px-3 py-1 rounded-full mb-6">
          Open source · Free to use
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          Host events.
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Build community.
          </span>
        </h1>
        <p className="text-[#6b7280] text-base mb-8 max-w-md mx-auto">
          Create beautiful event pages, collect RSVPs, and manage attendees.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/events/new"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Create your first event →
          </Link>
          <a
            href="#events"
            className="bg-[#1a1a1a] border border-[#2d2d2d] text-[#9ca3af] px-5 py-3 rounded-lg text-sm hover:bg-[#222] transition-colors"
          >
            Browse events
          </a>
        </div>
      </section>

      {/* Event grid */}
      <section id="events" className="px-6 py-8 max-w-6xl mx-auto">
        <EventGrid events={(events ?? []) as EventWithHost[]} countMap={countMap} />
      </section>
    </main>
  )
}
```

- [ ] **Step 4: Verify homepage renders**

```bash
npm run dev
```

Open http://localhost:3000. Expected: hero section with gradient headline, empty events grid (no events yet).

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/events/EventCard.tsx components/events/EventGrid.tsx
git commit -m "feat: add homepage with hero, EventCard, and EventGrid with search"
```

---

## Task 8: Event Server Actions

**Files:**
- Create: `lib/actions/events.ts`

- [ ] **Step 1: Create lib/actions/events.ts**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils/slug'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const title = formData.get('title') as string
  if (!title?.trim()) return { error: 'Title is required' }

  const slug = generateSlug(title)

  const { data, error } = await supabase
    .from('events')
    .insert({
      slug,
      host_id: user.id,
      title: title.trim(),
      description: (formData.get('description') as string) || null,
      cover_image_url: (formData.get('cover_image_url') as string) || null,
      location_name: (formData.get('location_name') as string) || null,
      location_address: (formData.get('location_address') as string) || null,
      starts_at: formData.get('starts_at') as string,
      ends_at: (formData.get('ends_at') as string) || null,
      capacity: formData.get('capacity')
        ? Number(formData.get('capacity'))
        : null,
      status: 'draft',
    })
    .select('slug')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  redirect(`/events/${data.slug}/manage`)
}

export async function updateEvent(slug: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const title = formData.get('title') as string
  if (!title?.trim()) return { error: 'Title is required' }

  const { error } = await supabase
    .from('events')
    .update({
      title: title.trim(),
      description: (formData.get('description') as string) || null,
      cover_image_url: (formData.get('cover_image_url') as string) || null,
      location_name: (formData.get('location_name') as string) || null,
      location_address: (formData.get('location_address') as string) || null,
      starts_at: formData.get('starts_at') as string,
      ends_at: (formData.get('ends_at') as string) || null,
      capacity: formData.get('capacity')
        ? Number(formData.get('capacity'))
        : null,
    })
    .eq('slug', slug)
    .eq('host_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/events/${slug}`)
  revalidatePath('/dashboard')
  redirect(`/events/${slug}/manage`)
}

export async function publishEvent(slug: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { error } = await supabase
    .from('events')
    .update({ status: 'published' })
    .eq('slug', slug)
    .eq('host_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/events/${slug}`)
  revalidatePath('/dashboard')
}

export async function cancelEvent(slug: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { error } = await supabase
    .from('events')
    .update({ status: 'cancelled' })
    .eq('slug', slug)
    .eq('host_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/events/${slug}`)
  revalidatePath('/dashboard')
  redirect('/dashboard')
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/events.ts
git commit -m "feat: add event server actions (create, update, publish, cancel)"
```

---

## Task 9: Create Event Page + EventForm

**Files:**
- Create: `components/events/EventForm.tsx`
- Create: `app/events/new/page.tsx`

- [ ] **Step 1: Create components/events/EventForm.tsx**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { createClient } from '@/lib/supabase/client'
import { createEvent, updateEvent } from '@/lib/actions/events'
import type { Event } from '@/types/database'

interface EventFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<Event>
  slug?: string
}

export function EventForm({ mode, initialData, slug }: EventFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [locationName, setLocationName] = useState(initialData?.location_name ?? '')
  const [startsAt, setStartsAt] = useState(
    initialData?.starts_at
      ? new Date(initialData.starts_at).toISOString().slice(0, 16)
      : ''
  )
  const [endsAt, setEndsAt] = useState(
    initialData?.ends_at
      ? new Date(initialData.ends_at).toISOString().slice(0, 16)
      : ''
  )
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialData?.cover_image_url ?? ''
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialData?.description ?? '',
    editorProps: {
      attributes: {
        class:
          'min-h-[120px] text-[#d1d5db] text-sm focus:outline-none prose prose-invert max-w-none',
      },
    },
  })

  async function handleImageUpload(file: File) {
    setUploading(true)
    const supabase = createClient()
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`
    const { data, error: uploadError } = await supabase.storage
      .from('event-covers')
      .upload(fileName, file, { upsert: true })
    setUploading(false)

    if (uploadError || !data) {
      setError('Image upload failed. You can paste a URL instead.')
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('event-covers').getPublicUrl(data.path)
    setCoverImageUrl(publicUrl)
  }

  function handleSubmit(formData: FormData) {
    const description = editor?.getHTML() ?? ''
    formData.set('description', description)
    formData.set('cover_image_url', coverImageUrl)

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createEvent(formData)
          : await updateEvent(slug!, formData)
      if (result?.error) setError(result.error)
    })
  }

  const previewDate = startsAt
    ? new Date(startsAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Date TBD'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
      {/* Form */}
      <form action={handleSubmit} className="space-y-5">
        {/* Cover image */}
        <div>
          <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
            Cover Image
          </label>
          {coverImageUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageUrl}
                alt="Cover"
                className="w-full h-36 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setCoverImageUrl('')}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-[#2d2d2d] rounded-lg h-28 flex flex-col items-center justify-center cursor-pointer hover:border-[#6366f1] transition-colors bg-[#111]">
              <span className="text-[#6b7280] text-sm">
                {uploading ? 'Uploading...' : 'Click to upload cover image'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                }}
              />
            </label>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
            Event Title *
          </label>
          <input
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. AI Founders Mixer"
            className="w-full bg-[#111] border border-[#2d2d2d] text-white text-sm px-4 py-2.5 rounded-lg placeholder:text-[#4b5563] focus:outline-none focus:border-[#6366f1]"
          />
        </div>

        {/* Start / End */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
              Start *
            </label>
            <input
              name="starts_at"
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full bg-[#111] border border-[#2d2d2d] text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#6366f1]"
            />
          </div>
          <div>
            <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
              End
            </label>
            <input
              name="ends_at"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full bg-[#111] border border-[#2d2d2d] text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#6366f1]"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
            Venue Name
          </label>
          <input
            name="location_name"
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder='e.g. The Factory or "Online"'
            className="w-full bg-[#111] border border-[#2d2d2d] text-white text-sm px-4 py-2.5 rounded-lg placeholder:text-[#4b5563] focus:outline-none focus:border-[#6366f1] mb-2"
          />
          <input
            name="location_address"
            type="text"
            placeholder="Full address (for map embed)"
            className="w-full bg-[#111] border border-[#2d2d2d] text-white text-sm px-4 py-2.5 rounded-lg placeholder:text-[#4b5563] focus:outline-none focus:border-[#6366f1]"
          />
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
            Capacity (leave blank for unlimited)
          </label>
          <input
            name="capacity"
            type="number"
            min="1"
            defaultValue={initialData?.capacity ?? ''}
            placeholder="Unlimited"
            className="w-full bg-[#111] border border-[#2d2d2d] text-white text-sm px-4 py-2.5 rounded-lg placeholder:text-[#4b5563] focus:outline-none focus:border-[#6366f1]"
          />
        </div>

        {/* Description (Tiptap) */}
        <div>
          <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
            Description
          </label>
          <div className="bg-[#111] border border-[#2d2d2d] rounded-lg px-4 py-3 focus-within:border-[#6366f1] transition-colors">
            <EditorContent editor={editor} />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isPending || uploading}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending
            ? 'Saving...'
            : mode === 'create'
            ? 'Save as Draft'
            : 'Save Changes'}
        </button>
      </form>

      {/* Live preview */}
      <div>
        <p className="text-[#6b7280] text-xs font-semibold uppercase tracking-wide mb-3">
          Live Preview
        </p>
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl overflow-hidden sticky top-20">
          <div className="h-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
            {coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="p-4">
            <p className="text-white font-bold text-sm mb-2">
              {title || 'Event Title'}
            </p>
            <p className="text-[#9ca3af] text-xs mb-1">{previewDate}</p>
            <p className="text-[#9ca3af] text-xs mb-3">
              {locationName || 'Location TBD'}
            </p>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center py-2 rounded-lg text-xs font-semibold">
              Register — Free
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create app/events/new/page.tsx**

```typescript
import { EventForm } from '@/components/events/EventForm'

export default function NewEventPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-white font-bold text-2xl mb-8">Create Event</h1>
      <EventForm mode="create" />
    </main>
  )
}
```

- [ ] **Step 3: Verify create event page renders**

Navigate to http://localhost:3000/events/new (must be signed in — it redirects to `/auth/signin` if not). Expected: form with live preview on right.

- [ ] **Step 4: Commit**

```bash
git add components/events/EventForm.tsx app/events/new/
git commit -m "feat: add create event page with EventForm and live preview"
```

---

## Task 10: Registration Actions + RSVPCard + Event Page

**Files:**
- Create: `lib/actions/registrations.ts`
- Create: `components/events/RSVPCard.tsx`
- Create: `app/events/[slug]/page.tsx`

- [ ] **Step 1: Create lib/actions/registrations.ts**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function registerForEvent(
  eventId: string,
  eventSlug: string
): Promise<{ error?: string } | undefined> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/signin?redirect=/events/${eventSlug}`)

  // Check capacity
  const { data: event } = await supabase
    .from('events')
    .select('capacity')
    .eq('id', eventId)
    .single()

  if (event?.capacity !== null && event?.capacity !== undefined) {
    const { count } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'confirmed')

    if (count !== null && count >= event.capacity) {
      return { error: 'This event is full.' }
    }
  }

  const { error } = await supabase.from('registrations').insert({
    event_id: eventId,
    user_id: user.id,
    status: 'confirmed',
  })

  if (error) {
    if (error.code === '23505') return { error: 'You are already registered.' }
    return { error: error.message }
  }

  revalidatePath(`/events/${eventSlug}`)
}

export async function cancelRegistration(
  eventId: string,
  eventSlug: string
): Promise<{ error?: string } | undefined> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { error } = await supabase
    .from('registrations')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventSlug}`)
}
```

- [ ] **Step 2: Create components/events/RSVPCard.tsx**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { registerForEvent, cancelRegistration } from '@/lib/actions/registrations'
import Link from 'next/link'

interface RSVPCardProps {
  eventId: string
  eventSlug: string
  capacity: number | null
  registrationCount: number
  isRegistered: boolean
  isAuthenticated: boolean
  startsAt: string
}

export function RSVPCard({
  eventId,
  eventSlug,
  capacity,
  registrationCount,
  isRegistered,
  isAuthenticated,
  startsAt,
}: RSVPCardProps) {
  const [registered, setRegistered] = useState(isRegistered)
  const [count, setCount] = useState(registrationCount)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const spotsLeft = capacity !== null ? capacity - count : null
  const isFull = spotsLeft !== null && spotsLeft <= 0

  const startDate = new Date(startsAt)
  const now = new Date()
  const isPast = startDate < now
  const diff = startDate.getTime() - now.getTime()
  const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  function handleRegister() {
    setError(null)
    startTransition(async () => {
      const result = await registerForEvent(eventId, eventSlug)
      if (result?.error) {
        setError(result.error)
      } else {
        setRegistered(true)
        setCount((c) => c + 1)
      }
    })
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelRegistration(eventId, eventSlug)
      if (!result?.error) {
        setRegistered(false)
        setCount((c) => c - 1)
      }
    })
  }

  return (
    <div className="bg-[#111] border border-[#2d2d2d] rounded-xl overflow-hidden">
      {/* Countdown */}
      {!isPast && (
        <div className="bg-[#0f0f0f] px-4 py-3 border-b border-[#1f1f1f] text-center">
          <p className="text-[#6b7280] text-xs mb-1">Starting in</p>
          <p className="text-[#a5b4fc] text-sm font-bold">
            {daysLeft > 0 ? `${daysLeft}d ` : ''}{hoursLeft}h
          </p>
        </div>
      )}

      <div className="p-4">
        {/* Attendee avatars */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex">
            {[...Array(Math.min(count, 4))].map((_, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-[#111]"
                style={{ marginLeft: i === 0 ? 0 : -8 }}
              />
            ))}
          </div>
          <p className="text-[#9ca3af] text-xs">
            <strong className="text-white">{count}</strong>{' '}
            {count === 1 ? 'person' : 'people'} going
            {spotsLeft !== null && !isFull && (
              <span className="text-[#6b7280]"> · {spotsLeft} spots left</span>
            )}
            {isFull && <span className="text-red-400"> · Full</span>}
          </p>
        </div>

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        {isPast ? (
          <p className="text-[#6b7280] text-sm text-center py-2">
            This event has ended.
          </p>
        ) : !isAuthenticated ? (
          <Link
            href={`/auth/signin?redirect=/events/${eventSlug}`}
            className="block w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Sign in to Register
          </Link>
        ) : registered ? (
          <div>
            <div className="bg-[#1a2e1a] border border-[#2d4a2d] text-green-400 text-center py-3 rounded-lg text-sm font-semibold mb-3">
              ✓ You&apos;re registered
            </div>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="w-full text-[#6b7280] text-xs hover:text-red-400 transition-colors py-1 disabled:opacity-50"
            >
              Cancel registration
            </button>
          </div>
        ) : isFull ? (
          <div className="bg-[#1a1a1a] text-[#6b7280] text-center py-3 rounded-lg text-sm">
            Event is full
          </div>
        ) : (
          <button
            onClick={handleRegister}
            disabled={isPending}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? 'Registering...' : 'Register — Free'}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create app/events/[slug]/page.tsx**

```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RSVPCard } from '@/components/events/RSVPCard'
import type { EventWithHost } from '@/components/events/EventCard'

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*, profiles:host_id (id, display_name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!event) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { count: registrationCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .eq('status', 'confirmed')

  let isRegistered = false
  if (user) {
    const { data: reg } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .maybeSingle()
    isRegistered = !!reg
  }

  const startDate = new Date(event.starts_at)
  const endDate = event.ends_at ? new Date(event.ends_at) : null
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const timeStr = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const endTimeStr = endDate
    ? ` – ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    : ''

  const host = (event as EventWithHost).profiles

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
        {/* Left column */}
        <div>
          {/* Cover image */}
          <div className="h-64 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-xl mb-6 overflow-hidden">
            {event.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.cover_image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Host row */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 overflow-hidden flex-shrink-0">
              {host.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={host.avatar_url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <p className="text-[#6b7280] text-xs">Presented by</p>
              <p className="text-[#a5b4fc] text-sm font-semibold">
                {host.display_name}
              </p>
            </div>
            <a
              href={`mailto:${user?.email ?? ''}`}
              className="ml-auto bg-[#1a1a1a] border border-[#2d2d2d] text-[#9ca3af] text-xs px-3 py-1.5 rounded-lg hover:bg-[#222] transition-colors"
            >
              Contact Host
            </a>
          </div>

          {/* Title */}
          <h1 className="text-white font-extrabold text-3xl tracking-tight mb-4">
            {event.title}
          </h1>

          {/* Date + Location */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-lg">📅</span>
              <span className="text-[#9ca3af]">
                {dateStr} · {timeStr}{endTimeStr}
              </span>
            </div>
            {event.location_name && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-lg">📍</span>
                {event.location_address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#a5b4fc] hover:underline"
                  >
                    {event.location_name}
                  </a>
                ) : (
                  <span className="text-[#9ca3af]">{event.location_name}</span>
                )}
              </div>
            )}
          </div>

          {/* About */}
          {event.description && (
            <div className="border-t border-[#1f1f1f] pt-6 mb-6">
              <h2 className="text-[#6b7280] text-xs font-semibold uppercase tracking-wide mb-3">
                About Event
              </h2>
              <div
                className="text-[#d1d5db] text-sm leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>
          )}

          {/* Location map */}
          {event.location_address && (
            <div className="border-t border-[#1f1f1f] pt-6">
              <h2 className="text-[#6b7280] text-xs font-semibold uppercase tracking-wide mb-3">
                Location
              </h2>
              <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
                <iframe
                  title="Event location"
                  width="100%"
                  height="200"
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location_address)}&output=embed`}
                  className="block"
                />
                <div className="px-4 py-3">
                  <p className="text-[#e5e7eb] text-sm font-semibold">
                    {event.location_name}
                  </p>
                  <p className="text-[#6b7280] text-xs">{event.location_address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#a5b4fc] text-xs hover:underline mt-1 inline-block"
                  >
                    View on Google Maps ↗
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column — sticky RSVP card */}
        <div className="lg:sticky lg:top-20">
          <RSVPCard
            eventId={event.id}
            eventSlug={event.slug}
            capacity={event.capacity}
            registrationCount={registrationCount ?? 0}
            isRegistered={isRegistered}
            isAuthenticated={!!user}
            startsAt={event.starts_at}
          />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/actions/registrations.ts components/events/RSVPCard.tsx app/events/
git commit -m "feat: add event page with two-column layout and RSVP registration"
```

---

## Task 11: Dashboard

**Files:**
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Create app/dashboard/page.tsx**

```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { publishEvent } from '@/lib/actions/events'
import type { Event } from '@/types/database'

function StatusBadge({ status }: { status: Event['status'] }) {
  const styles = {
    draft: 'bg-[#1a1a1a] text-[#9ca3af] border border-[#2d2d2d]',
    published: 'bg-[#1a2e1a] text-green-400 border border-[#2d4a2d]',
    cancelled: 'bg-[#2a1a1a] text-red-400 border border-[#4a2d2d]',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status}
    </span>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', user!.id)
    .order('created_at', { ascending: false })

  const eventIds = (events ?? []).map((e) => e.id)
  const countMap: Record<string, number> = {}

  if (eventIds.length > 0) {
    const { data: regRows } = await supabase
      .from('registrations')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'confirmed')
    for (const row of regRows ?? []) {
      countMap[row.event_id] = (countMap[row.event_id] ?? 0) + 1
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-white font-bold text-2xl">My Events</h1>
        <Link
          href="/events/new"
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          + New Event
        </Link>
      </div>

      {events?.length === 0 ? (
        <div className="text-center py-20 text-[#4b5563]">
          <p className="mb-4 text-lg">No events yet.</p>
          <Link
            href="/events/new"
            className="text-[#6366f1] hover:text-indigo-400 transition-colors"
          >
            Create your first event →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events?.map((event) => (
            <div
              key={event.id}
              className="bg-[#111] border border-[#1f1f1f] rounded-xl px-5 py-4 flex items-center gap-4 hover:border-[#2d2d2d] transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-900 to-purple-900 flex-shrink-0 overflow-hidden">
                {event.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.cover_image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white font-semibold text-sm truncate">
                    {event.title}
                  </p>
                  <StatusBadge status={event.status} />
                </div>
                <p className="text-[#6b7280] text-xs">
                  {new Date(event.starts_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {' · '}
                  <span className="text-[#6366f1]">
                    {countMap[event.id] ?? 0} RSVPs
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {event.status === 'draft' && (
                  <form
                    action={publishEvent.bind(null, event.slug)}
                  >
                    <button
                      type="submit"
                      className="text-xs bg-[#1a2e1a] border border-[#2d4a2d] text-green-400 px-3 py-1.5 rounded-lg hover:bg-[#1e361e] transition-colors"
                    >
                      Publish
                    </button>
                  </form>
                )}
                <Link
                  href={`/events/${event.slug}/manage`}
                  className="text-xs bg-[#1a1a1a] border border-[#2d2d2d] text-[#9ca3af] px-3 py-1.5 rounded-lg hover:bg-[#222] transition-colors"
                >
                  Manage
                </Link>
                {event.status === 'published' && (
                  <Link
                    href={`/events/${event.slug}`}
                    target="_blank"
                    className="text-xs text-[#6b7280] hover:text-[#a5b4fc] transition-colors"
                  >
                    View ↗
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Verify dashboard**

Sign in, create a draft event via `/events/new`, check dashboard shows it with "Publish" button and RSVP count of 0.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/
git commit -m "feat: add host dashboard with event list, status badges, and publish action"
```

---

## Task 12: Manage Event Page + AttendeeList

**Files:**
- Create: `components/events/AttendeeList.tsx`
- Create: `app/events/[slug]/manage/page.tsx`

- [ ] **Step 1: Create components/events/AttendeeList.tsx**

```typescript
import type { Registration, Profile } from '@/types/database'

type RegistrationWithProfile = Registration & {
  profiles: Pick<Profile, 'display_name' | 'avatar_url'>
}

interface AttendeeListProps {
  registrations: RegistrationWithProfile[]
}

export function AttendeeList({ registrations }: AttendeeListProps) {
  const confirmed = registrations.filter((r) => r.status === 'confirmed')

  if (confirmed.length === 0) {
    return (
      <p className="text-[#4b5563] text-sm py-4">No attendees yet.</p>
    )
  }

  return (
    <div className="space-y-2">
      {confirmed.map((reg) => (
        <div
          key={reg.id}
          className="flex items-center gap-3 bg-[#111] border border-[#1f1f1f] rounded-lg px-4 py-3"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0 overflow-hidden">
            {reg.profiles.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={reg.profiles.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              {reg.profiles.display_name}
            </p>
            <p className="text-[#6b7280] text-xs">
              Registered{' '}
              {new Date(reg.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create app/events/[slug]/manage/page.tsx**

```typescript
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventForm } from '@/components/events/EventForm'
import { AttendeeList } from '@/components/events/AttendeeList'
import { cancelEvent, publishEvent } from '@/lib/actions/events'
import Link from 'next/link'

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('host_id', user.id)
    .single()

  if (!event) notFound()

  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, profiles:user_id (display_name, avatar_url)')
    .eq('event_id', event.id)
    .order('created_at', { ascending: true })

  const confirmedCount =
    registrations?.filter((r) => r.status === 'confirmed').length ?? 0

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard" className="text-[#6b7280] text-sm hover:text-white transition-colors">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-white font-bold text-2xl">{event.title}</h1>
          <p className="text-[#6b7280] text-sm mt-1">
            {confirmedCount} attendee{confirmedCount !== 1 ? 's' : ''}
            {event.capacity ? ` / ${event.capacity} capacity` : ''}
          </p>
        </div>
        <div className="flex gap-3">
          {event.status === 'published' && (
            <Link
              href={`/events/${slug}`}
              target="_blank"
              className="bg-[#1a1a1a] border border-[#2d2d2d] text-[#9ca3af] text-sm px-4 py-2 rounded-lg hover:bg-[#222] transition-colors"
            >
              View live ↗
            </Link>
          )}
          {event.status === 'draft' && (
            <form action={publishEvent.bind(null, slug)}>
              <button
                type="submit"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Publish Event
              </button>
            </form>
          )}
          {event.status !== 'cancelled' && (
            <form action={cancelEvent.bind(null, slug)}>
              <button
                type="submit"
                className="bg-[#2a1a1a] border border-[#4a2d2d] text-red-400 text-sm px-4 py-2 rounded-lg hover:bg-[#311a1a] transition-colors"
                onClick={(e) => {
                  if (!confirm('Cancel this event? Attendees will not be notified automatically.')) {
                    e.preventDefault()
                  }
                }}
              >
                Cancel Event
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
        {/* Edit form */}
        <div>
          <h2 className="text-white font-bold text-lg mb-5">Edit Event</h2>
          <EventForm mode="edit" initialData={event} slug={slug} />
        </div>

        {/* Attendees */}
        <div>
          <h2 className="text-white font-bold text-lg mb-5">
            Attendees ({confirmedCount})
          </h2>
          <AttendeeList registrations={registrations ?? []} />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify full flow end-to-end**

1. Sign in at http://localhost:3000/auth/signin
2. Create event at `/events/new` — confirm redirect to manage page
3. Publish event from manage page — confirm status changes to "published"
4. Visit the public event page `/events/[slug]` — confirm RSVP card shows
5. Register — confirm "You're registered" state
6. Return to manage page — confirm attendee appears in list
7. Cancel registration from event page — confirm count decrements
8. Cancel event from manage page — confirm redirect to dashboard

- [ ] **Step 4: Run all tests**

```bash
npm run test:run
```

Expected: slug utility tests pass (7/7).

- [ ] **Step 5: Final commit**

```bash
git add app/events/ components/events/AttendeeList.tsx
git commit -m "feat: add manage event page with edit form, attendee list, publish/cancel actions"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Routes: `/`, `/events/[slug]`, `/auth/signin`, `/auth/callback`, `/dashboard`, `/events/new`, `/events/[slug]/manage`
- ✅ Data model: profiles, events, registrations with RLS
- ✅ Auth: Google + GitHub OAuth via Supabase
- ✅ Event creation with cover image upload, Tiptap description, live preview
- ✅ Public event page matching Luma two-column layout
- ✅ RSVP: register, cancel, capacity check, duplicate guard
- ✅ Dashboard: event list, status badges, publish action, RSVP counts
- ✅ Manage: edit event, attendee list, publish, cancel
- ✅ Dark/vibrant theme (indigo/violet gradients, `#0a0a0a` background)
- ✅ Error handling: full event, duplicate registration, 404, unauthenticated RSVP
- ✅ Slug utility with unit tests

**Out of scope confirmed not implemented:** Stripe, email notifications, waitlist, calendar view.
