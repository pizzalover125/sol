import Link from 'next/link'
import type { Event, Profile } from '@/types/database'

export type EventWithHost = Event & {
  profiles: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>
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
