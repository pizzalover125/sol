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
    .returns<EventWithHost[]>()
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

  const host = event.profiles

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
              href="#"
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
