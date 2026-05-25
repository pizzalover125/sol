-- Migration: Create registrations table with RLS
-- Apply in Supabase Dashboard → SQL Editor

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

create policy "Users can read own registrations"
  on public.registrations for select
  using (auth.uid() = user_id);

create policy "Hosts can read registrations for their events"
  on public.registrations for select
  using (
    exists (
      select 1 from public.events
      where events.id = registrations.event_id
        and events.host_id = auth.uid()
    )
  );

create policy "Authenticated users can register"
  on public.registrations for insert
  with check (auth.uid() = user_id);

create policy "Users can cancel own registrations"
  on public.registrations for update
  using (auth.uid() = user_id);
