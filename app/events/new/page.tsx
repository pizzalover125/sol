import { EventForm } from '@/components/events/EventForm'

export default function NewEventPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-white font-bold text-2xl mb-8">Create Event</h1>
      <EventForm mode="create" />
    </main>
  )
}
