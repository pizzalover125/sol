# Database & Auth Reference

Documentation for the events app's Supabase backend (Postgres + Supabase Auth) used by the SvelteKit frontend.

## Overview

| Layer            | Technology                                                     |
| ---------------- | -------------------------------------------------------------- |
| Database         | Supabase Postgres                                              |
| Auth             | Supabase Auth (email/password)                                 |
| Security         | Row Level Security (RLS)                                       |
| Client (browser) | `@supabase/ssr` → `createBrowserClient`                        |
| Client (server)  | `@supabase/ssr` → `createServerClient` (cookie-based sessions) |

---

## Auth System

Authentication uses **Supabase Auth** with the **email + password** provider.

### Configuration (Supabase Dashboard)

- **Authentication → Providers → Email**: enabled.
- **Authentication → Settings → "Enable email confirmations"**: turned **off** for local development, so new sign-ups are usable immediately without a confirmation email. Re-enable this before going to production.

### How sessions work

1. `hooks.server.js` runs on every request and attaches a server Supabase client plus a `getSession()` helper to `event.locals`.
2. The server client reads/writes the session via cookies (`getAll` / `setAll`).
3. `+layout.server.js` exposes the session to every page through `data.session`.
4. Protected routes (e.g. the dashboard `+page.server.js`) call `locals.getSession()` and redirect to `/login` when there is no session.

### Auth actions (client-side, `$lib/supabase`)

| Action   | Call                                                    |
| -------- | ------------------------------------------------------- |
| Sign up  | `supabase.auth.signUp({ email, password })`             |
| Sign in  | `supabase.auth.signInWithPassword({ email, password })` |
| Sign out | `supabase.auth.signOut()`                               |

The built-in `auth.users` table is managed by Supabase. Application tables reference it via `auth.users(id)`.

---

## Database Schema

### Table: `events`

Stores all event records. Each event belongs to one authenticated user.

| Column            | Type          | Constraints / Default                                | Notes                                                   |
| ----------------- | ------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| `id`              | `uuid`        | PK, `default gen_random_uuid()`                      | Internal identifier                                     |
| `user_id`         | `uuid`        | FK → `auth.users(id)`, `on delete cascade`, not null | Owner of the event                                      |
| `name`            | `text`        | not null                                             | Event title                                             |
| `description`     | `text`        | nullable                                             | Long-form details                                       |
| `location`        | `text`        | nullable                                             | Address or "Online"                                     |
| `start_time`      | `timestamptz` | not null                                             | Event start (UTC)                                       |
| `end_time`        | `timestamptz` | not null                                             | Event end (UTC); app validates it is after `start_time` |
| `max_attendees`   | `integer`     | nullable                                             | `null` = unlimited                                      |
| `is_public`       | `boolean`     | `default true`                                       | Controls public visibility via slug                     |
| `cover_image_url` | `text`        | nullable                                             | Optional banner image URL                               |
| `slug`            | `text`        | unique, not null, `default ''`                       | Public URL identifier (e.g. `/aij378kq`)                |
| `created_at`      | `timestamptz` | `default now()`                                      | Row creation time                                       |

### Indexes

- Primary key on `id`.
- Unique constraint on `slug`.
- `events_slug_idx` on `slug` for fast public-page lookups.

### Relationships

- `events.user_id` → `auth.users.id`. Deleting a user cascades and removes their events.

---

## Row Level Security (RLS)

RLS is **enabled** on `events`. Two policies apply:

| Policy                                 | Command  | Rule                   | Purpose                                                      |
| -------------------------------------- | -------- | ---------------------- | ------------------------------------------------------------ |
| `Users own their events`               | `ALL`    | `auth.uid() = user_id` | Owners can select/insert/update/delete only their own rows   |
| `Public events are viewable by anyone` | `SELECT` | `is_public = true`     | Anyone (including anonymous visitors) can read public events |

Effect: the dashboard only ever returns the signed-in user's events, while the public `/[slug]` page can read an event when `is_public = true` — even without a session. Private events return a 403 in the app layer.

---

## SQL Setup Scripts

### 1. Create table + owner policy

```sql
create table events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  location text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  max_attendees integer,
  is_public boolean default true,
  cover_image_url text,
  created_at timestamptz default now()
);

alter table events enable row level security;

create policy "Users own their events" on events
  for all using (auth.uid() = user_id);
```

### 2. Add slug support + public read policy

```sql
alter table events add column slug text unique not null default '';

create index events_slug_idx on events(slug);

create policy "Public events are viewable by anyone" on events
  for select using (is_public = true);
```

---

## Slug Generation

Slugs are generated **application-side** (`$lib/slug.js`) as an 8-character lowercase alphanumeric string. On create, the server tries up to 5 times, checking for an existing row with the same slug before inserting, to avoid collisions (the unique constraint is the final safeguard). Slugs are permanent and do not change when an event is edited.

---

## Common Queries (via Supabase client)

```js
// Dashboard: current user's events (RLS restricts to owner)
supabase.from('events').select('*').order('start_time', { ascending: true })

// Public page: look up a single event by slug
supabase.from('events').select('*').eq('slug', slug).maybeSingle()

// Create
supabase.from('events').insert({ /* fields */, user_id: session.user.id, slug })

// Update
supabase.from('events').update({ /* fields */ }).eq('id', id)

// Delete
supabase.from('events').delete().eq('id', id)
```

> Note: `user_id` is only set explicitly on insert. The owner RLS policy enforces that it must match `auth.uid()`.

---

## Environment Variables

Defined in `.env` (prefixed `PUBLIC_` so SvelteKit exposes them to the browser client):

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Only the **anon key** is used. RLS — not key secrecy — is what protects the data, so the anon key is safe to ship to the browser.

---
