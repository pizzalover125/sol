-- Migration: Create events table with status enum and RLS
-- Apply in Supabase Dashboard → SQL Editor

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

create policy "Published public events are readable"
  on public.events for select
  using (status = 'published' and is_public = true);

create policy "Hosts can read their own events"
  on public.events for select
  using (auth.uid() = host_id);

create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.uid() = host_id);

create policy "Hosts can update their own events"
  on public.events for update
  using (auth.uid() = host_id);
