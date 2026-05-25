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
