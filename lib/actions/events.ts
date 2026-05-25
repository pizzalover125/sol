'use server'

import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils/slug'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const title = formData.get('title') as string
  if (!title?.trim()) return { error: 'Title is required' }

  const slug = generateSlug(title)

  const { data, error } = await supabase
    .from('events')
    .insert({
      slug,
      host_id: user.id,
      title: title.trim(),
      description: (formData.get('description') as string) || null,
      cover_image_url: (formData.get('cover_image_url') as string) || null,
      location_name: (formData.get('location_name') as string) || null,
      location_address: (formData.get('location_address') as string) || null,
      starts_at: formData.get('starts_at') as string,
      ends_at: (formData.get('ends_at') as string) || null,
      capacity: formData.get('capacity')
        ? Number(formData.get('capacity'))
        : null,
      status: 'draft',
    } as any)
    .select('slug')
    .single()
    .returns<{ slug: string }>()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  redirect(`/events/${(data as any)?.slug}/manage`)
}

export async function updateEvent(slug: string, formData: FormData) {
  const supabase = await createClient() as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const title = formData.get('title') as string
  if (!title?.trim()) return { error: 'Title is required' }

  const { error } = await supabase
    .from('events')
    .update({
      title: title.trim(),
      description: (formData.get('description') as string) || null,
      cover_image_url: (formData.get('cover_image_url') as string) || null,
      location_name: (formData.get('location_name') as string) || null,
      location_address: (formData.get('location_address') as string) || null,
      starts_at: formData.get('starts_at') as string,
      ends_at: (formData.get('ends_at') as string) || null,
      capacity: formData.get('capacity')
        ? Number(formData.get('capacity'))
        : null,
    })
    .eq('slug', slug)
    .eq('host_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/events/${slug}`)
  revalidatePath('/dashboard')
  redirect(`/events/${slug}/manage`)
}

export async function publishEvent(slug: string) {
  const supabase = await createClient() as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { error } = await supabase
    .from('events')
    .update({ status: 'published' })
    .eq('slug', slug)
    .eq('host_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/events/${slug}`)
  revalidatePath('/dashboard')
}

export async function cancelEvent(slug: string) {
  const supabase = await createClient() as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { error } = await supabase
    .from('events')
    .update({ status: 'cancelled' })
    .eq('slug', slug)
    .eq('host_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/events/${slug}`)
  revalidatePath('/dashboard')
  redirect('/dashboard')
}
