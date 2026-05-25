'use client'

import { useState, useTransition } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { createClient } from '@/lib/supabase/client'
import { createEvent, updateEvent } from '@/lib/actions/events'
import type { Event } from '@/types/database'

interface EventFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<Event>
  slug?: string
}

export function EventForm({ mode, initialData, slug }: EventFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [locationName, setLocationName] = useState(initialData?.location_name ?? '')
  const [locationAddress, setLocationAddress] = useState(initialData?.location_address ?? '')
  const [startsAt, setStartsAt] = useState(
    initialData?.starts_at
      ? new Date(initialData.starts_at).toISOString().slice(0, 16)
      : ''
  )
  const [endsAt, setEndsAt] = useState(
    initialData?.ends_at
      ? new Date(initialData.ends_at).toISOString().slice(0, 16)
      : ''
  )
  const [capacity, setCapacity] = useState(initialData?.capacity?.toString() ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialData?.cover_image_url ?? ''
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialData?.description ?? '',
    editorProps: {
      attributes: {
        class:
          'min-h-[120px] text-[#d1d5db] text-sm focus:outline-none prose prose-invert max-w-none',
      },
    },
  })

  async function handleImageUpload(file: File) {
    setUploading(true)
    const supabase = createClient()
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`
    const { data, error: uploadError } = await supabase.storage
      .from('event-covers')
      .upload(fileName, file, { upsert: true })
    setUploading(false)

    if (uploadError || !data) {
      setError('Image upload failed. You can paste a URL instead.')
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('event-covers').getPublicUrl(data.path)
    setCoverImageUrl(publicUrl)
  }

  function handleSubmit(formData: FormData) {
    const description = editor?.getHTML() ?? ''
    formData.set('description', description)
    formData.set('cover_image_url', coverImageUrl)

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createEvent(formData)
          : await updateEvent(slug!, formData)
      if (result?.error) setError(result.error)
    })
  }

  const previewDate = startsAt
    ? new Date(startsAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Date TBD'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
      {/* Form */}
      <form action={handleSubmit} className="space-y-5">
        {/* Cover image */}
        <div>
          <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
            Cover Image
          </label>
          {coverImageUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageUrl}
                alt="Cover"
                className="w-full h-36 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setCoverImageUrl('')}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-[#2d2d2d] rounded-lg h-28 flex flex-col items-center justify-center cursor-pointer hover:border-[#6366f1] transition-colors bg-[#111]">
              <span className="text-[#6b7280] text-sm">
                {uploading ? 'Uploading...' : 'Click to upload cover image'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                }}
              />
            </label>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
            Event Title *
          </label>
          <input
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. AI Founders Mixer"
            className="w-full bg-[#111] border border-[#2d2d2d] text-white text-sm px-4 py-2.5 rounded-lg placeholder:text-[#4b5563] focus:outline-none focus:border-[#6366f1]"
          />
        </div>

        {/* Start / End */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
              Start *
            </label>
            <input
              name="starts_at"
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full bg-[#111] border border-[#2d2d2d] text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#6366f1]"
            />
          </div>
          <div>
            <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
              End
            </label>
            <input
              name="ends_at"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full bg-[#111] border border-[#2d2d2d] text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#6366f1]"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
            Venue Name
          </label>
          <input
            name="location_name"
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder='e.g. The Factory or "Online"'
            className="w-full bg-[#111] border border-[#2d2d2d] text-white text-sm px-4 py-2.5 rounded-lg placeholder:text-[#4b5563] focus:outline-none focus:border-[#6366f1] mb-2"
          />
          <input
            name="location_address"
            type="text"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            placeholder="Full address (for map embed)"
            className="w-full bg-[#111] border border-[#2d2d2d] text-white text-sm px-4 py-2.5 rounded-lg placeholder:text-[#4b5563] focus:outline-none focus:border-[#6366f1]"
          />
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
            Capacity (leave blank for unlimited)
          </label>
          <input
            name="capacity"
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Unlimited"
            className="w-full bg-[#111] border border-[#2d2d2d] text-white text-sm px-4 py-2.5 rounded-lg placeholder:text-[#4b5563] focus:outline-none focus:border-[#6366f1]"
          />
        </div>

        {/* Description (Tiptap) */}
        <div>
          <label className="block text-[#9ca3af] text-xs font-semibold uppercase tracking-wide mb-2">
            Description
          </label>
          <div className="bg-[#111] border border-[#2d2d2d] rounded-lg px-4 py-3 focus-within:border-[#6366f1] transition-colors">
            <EditorContent editor={editor} />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isPending || uploading}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending
            ? 'Saving...'
            : mode === 'create'
            ? 'Save as Draft'
            : 'Save Changes'}
        </button>
      </form>

      {/* Live preview */}
      <div>
        <p className="text-[#6b7280] text-xs font-semibold uppercase tracking-wide mb-3">
          Live Preview
        </p>
        <div className="bg-[#111] border border-[#2d2d2d] rounded-xl overflow-hidden sticky top-20">
          <div className="h-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
            {coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="p-4">
            <p className="text-white font-bold text-sm mb-2">
              {title || 'Event Title'}
            </p>
            <p className="text-[#9ca3af] text-xs mb-1">{previewDate}</p>
            <p className="text-[#9ca3af] text-xs mb-3">
              {locationName || 'Location TBD'}
            </p>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center py-2 rounded-lg text-xs font-semibold">
              Register — Free
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
