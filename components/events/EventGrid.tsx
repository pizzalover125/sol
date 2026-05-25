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
