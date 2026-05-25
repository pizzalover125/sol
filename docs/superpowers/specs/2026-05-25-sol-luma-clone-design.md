# Sol — Luma Clone Design Spec

**Date:** 2026-05-25  
**Project:** Sol — open source Luma alternative  
**Deploy target:** Vercel (free tier)

---

## Overview

Sol is an open-source event management web app — a Luma clone. Hosts create and publish event pages; attendees discover events and RSVP. MVP covers event creation, public event pages, and registration. Paid ticketing and email notifications are out of scope for v1.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Best Vercel DX; server components + server actions = no separate API |
| Database | Supabase (Postgres) | Free tier, typed client, RLS, Storage for images |
| Auth | Supabase Auth | Built-in Google + GitHub OAuth; no extra auth library needed |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Deploy | Vercel | Free tier, zero config with Next.js |

No Prisma, no tRPC, no NextAuth — Supabase-native stack throughout.

---

## Routes

### Public (no auth)
| Route | Page | Description |
|---|---|---|
| `/` | Homepage | Hero CTA + browseable public event grid with search |
| `/events/[slug]` | Event Page | Cover image, details, host, RSVP card — shareable URL |

### Auth
| Route | Page | Description |
|---|---|---|
| `/auth/signin` | Sign In | Google + GitHub OAuth buttons |
| `/auth/callback` | OAuth Callback | Supabase token exchange, redirects to `/dashboard` |

### Authenticated (host)
| Route | Page | Description |
|---|---|---|
| `/dashboard` | Dashboard | List of my events, RSVP counts, create button |
| `/events/new` | Create Event | Form + live preview card; Save Draft / Publish |
| `/events/[slug]/manage` | Manage Event | Edit details, view attendee list, cancel event |

---

## Data Model

### `auth.users` (Supabase managed)
- `id` uuid PK
- `email`
- `raw_user_meta_data` — name, avatar_url from OAuth provider
- `created_at`

### `public.profiles`
- `id` uuid PK → `auth.users.id`
- `username` unique, url-friendly
- `display_name`
- `avatar_url`
- `created_at`

Auto-created via Postgres trigger on `auth.users` insert.

### `public.events`
- `id` uuid PK
- `slug` unique, url-friendly (auto-generated from title + short id)
- `host_id` → `profiles.id`
- `title` text
- `description` text
- `cover_image_url` text (Supabase Storage)
- `location_name` text
- `location_address` text
- `starts_at` timestamptz
- `ends_at` timestamptz nullable
- `capacity` int nullable (null = unlimited)
- `is_public` bool default true
- `status` enum: `draft | published | cancelled`
- `created_at` timestamptz

### `public.registrations`
- `id` uuid PK
- `event_id` → `events.id`
- `user_id` → `profiles.id`
- `status` enum: `confirmed | cancelled`
- `created_at` timestamptz
- UNIQUE(`event_id`, `user_id`) — one registration per user per event

---

## Row Level Security (RLS)

| Table | SELECT | INSERT | UPDATE / DELETE |
|---|---|---|---|
| `profiles` | Public | Auth only (trigger) | Own row only |
| `events` | Public where `status = published` | Auth only | Host only (`host_id = auth.uid()`) |
| `registrations` | Own rows + host of event | Auth only | Own row only (to cancel) |

---

## Architecture

**Data fetching:** Server components fetch directly from Supabase using the server-side client. No client-side fetching for initial loads.

**Mutations:** Server actions handle all writes — create event, update event, register, cancel registration. No REST API layer.

**Auth flow:** Supabase Auth handles the OAuth redirect cycle. Middleware (`middleware.ts`) protects `/dashboard`, `/events/new`, and `/events/[slug]/manage` — redirects unauthenticated users to `/auth/signin` with `?redirect` param.

**Images:** Cover images upload to Supabase Storage bucket `event-covers`. Public read, auth-only write. URL stored in `events.cover_image_url`.

**Slug generation:** On event create, slug = `kebab-case(title) + '-' + nanoid(6)`. Unique constraint enforced at DB level.

---

## UI Design

**Theme:** Dark/vibrant — `#0a0a0a` background, `#111` card surfaces, indigo/violet gradient accents (`#6366f1` → `#8b5cf6`), colorful gradient cover image placeholders.

### Homepage (`/`)
- Nav: logo left, Discover link, "+ Create Event" CTA, Sign In right
- Hero: centered headline with gradient text, two CTAs (Create / Browse)
- Events grid: 3-column card grid, each card shows cover gradient, date, title, host avatar+name, RSVP count
- Search bar above grid

### Event Page (`/events/[slug]`)
Matches Luma's two-column layout:
- **Left column (wider):** cover image (full width of column, rounded), host avatar + "Presented by" + host name + Contact Host button, category tag, event title, date/time row, location row, About Event section, Location section with map embed
- **Right column (sticky):** countdown, RSVP card with register button + attendee avatars + count + spots remaining, registration form (name + email pre-filled from profile) when user clicks Register

### Create Event (`/events/new`)
- **Left:** form fields — cover image upload, title, start/end datetime pickers, location, capacity, description (rich text via Tiptap)
- **Right:** live preview card that updates as user types
- Nav: Save Draft + Publish buttons

### Dashboard (`/dashboard`)
- List of events as cards: title, date, status badge (draft/published/cancelled), RSVP count
- "+ New Event" button
- Click event → `/events/[slug]/manage`

---

## Key Components

| Component | Location | Purpose |
|---|---|---|
| `EventCard` | `components/events/EventCard.tsx` | Reusable card for homepage grid + dashboard |
| `RSVPCard` | `components/events/RSVPCard.tsx` | Sticky registration card on event page |
| `EventForm` | `components/events/EventForm.tsx` | Create/edit form with live preview |
| `AttendeeList` | `components/events/AttendeeList.tsx` | Attendee table for manage page |
| `NavBar` | `components/layout/NavBar.tsx` | Top nav, auth-aware |
| `AuthProvider` | `components/auth/AuthProvider.tsx` | Supabase session context |

---

## Error Handling

- **Registration on full event:** server action checks `count(registrations) < capacity` before insert; returns user-facing error if full
- **Duplicate registration:** DB unique constraint catches it; server action returns "already registered" message
- **Unauthenticated RSVP:** clicking Register on event page redirects to `/auth/signin?redirect=/events/[slug]`
- **Image upload failure:** show inline error, event can still be saved without cover
- **Not found:** `notFound()` in Next.js for missing slugs → 404 page

---

## Out of Scope (v1)

- Paid ticketing / Stripe
- Email notifications / reminders
- Waitlist
- Event calendar view
- Social sharing meta tags (nice-to-have v2)
- Mobile app
