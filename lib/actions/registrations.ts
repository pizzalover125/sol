'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function registerForEvent(
  eventId: string,
  eventSlug: string
): Promise<{ error?: string } | undefined> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/signin?redirect=/events/${eventSlug}`)

  // Check capacity
  const { data: event } = await supabase
    .from('events')
    .select('capacity')
    .eq('id', eventId)
    .single()

  if (event?.capacity !== null && event?.capacity !== undefined) {
    const { count } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'confirmed')

    if (count !== null && count >= event.capacity) {
      return { error: 'This event is full.' }
    }
  }

  const { error } = await supabase.from('registrations').insert({
    event_id: eventId,
    user_id: user.id,
    status: 'confirmed',
  })

  if (error) {
    if (error.code === '23505') return { error: 'You are already registered.' }
    return { error: error.message }
  }

  revalidatePath(`/events/${eventSlug}`)
}

export async function cancelRegistration(
  eventId: string,
  eventSlug: string
): Promise<{ error?: string } | undefined> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { error } = await supabase
    .from('registrations')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/events/${eventSlug}`)
}
