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
    .returns<EventWithHost[]>()

  const eventList = events ?? []
  const eventIds = eventList.map((e) => e.id)

  const countMap: Record<string, number> = {}
  if (eventIds.length > 0) {
    const { data: regRows } = await supabase
      .from('registrations')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'confirmed')
      .returns<Array<{ event_id: string }>>()

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
        <EventGrid events={eventList} countMap={countMap} />
      </section>
    </main>
  )
}
