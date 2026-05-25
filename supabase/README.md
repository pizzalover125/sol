# Database Setup

This directory contains SQL migrations for the Sol event management app. These files are applied manually in the Supabase dashboard.

## Applying Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** → **New query**
3. Copy the content of each migration file and run them **in order**:
   - `migrations/001_create_profiles.sql` — Creates profiles table with auth trigger
   - `migrations/002_create_events.sql` — Creates events table with status enum
   - `migrations/003_create_registrations.sql` — Creates registrations table

Each migration includes Row-Level Security (RLS) policies to ensure:
- Profiles are publicly readable, users can update their own
- Published public events are visible to anyone; hosts can see/edit their own events
- Registrations are only visible to the user and event host

## Storage Bucket Setup

After running migrations, create a Storage bucket for event cover images:

1. Go to **Storage** → **New bucket**
2. Name: `event-covers`
3. Public: **true** (so cover images are accessible to anyone)
4. Click **Create bucket**

## Schema Overview

- **profiles** — User profile data, linked to Supabase auth.users
- **events** — Event records hosted by a profile user
- **registrations** — Join table linking users to events they've registered for

All tables have Row-Level Security enabled to restrict access based on user authentication and ownership.
