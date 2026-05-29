<script>
  import { enhance } from '$app/forms'
  import { supabase } from '$lib/supabase'
  import { goto } from '$app/navigation'

  let { data, form } = $props()

  let editing = $state(null)
  let showCreateForm = $state(false)

  async function signOut() {
    await supabase.auth.signOut()
    goto('/login')
  }

  function toInputValue(ts) {
    return new Date(ts).toISOString().slice(0, 16)
  }

  function formatEventDate(start, end) {
    const s = new Date(start)
    const e = new Date(end)
    const date = s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    const startTime = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const endTime = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return `${date} · ${startTime} – ${endTime}`
  }
</script>

<header>
  <h1>My Events</h1>
  <div>
    <button onclick={() => showCreateForm = !showCreateForm}>
      {showCreateForm ? 'Cancel' : '+ New Event'}
    </button>
    <button onclick={signOut}>Sign Out</button>
  </div>
</header>

{#if form?.error}
  <p>{form.error}</p>
{/if}

{#if showCreateForm}
  <form method="POST" action="?/create" use:enhance={() => {
    return async ({ update }) => {
      await update()
      showCreateForm = false
    }
  }}>
    <h2>New Event</h2>
    <label>Event Name <input name="name" required /></label>
    <label>Description <textarea name="description"></textarea></label>
    <label>Location <input name="location" placeholder="Address or 'Online'" /></label>
    <label>Start <input name="start_time" type="datetime-local" required /></label>
    <label>End <input name="end_time" type="datetime-local" required /></label>
    <label>Max Attendees <input name="max_attendees" type="number" min="1" placeholder="Unlimited" /></label>
    <label>Cover Image URL <input name="cover_image_url" type="url" placeholder="https://..." /></label>
    <label>
      <input name="is_public" type="checkbox" checked /> Public event
    </label>
    <button type="submit">Create Event</button>
  </form>
{/if}

{#if data.events.length === 0}
  <p>No events yet. Create your first one!</p>
{/if}

{#each data.events as event (event.id)}
  <div>
    {#if editing === event.id}
      <form method="POST" action="?/update" use:enhance={() => {
        return async ({ update }) => {
          await update()
          editing = null
        }
      }}>
        <input type="hidden" name="id" value={event.id} />
        <label>Event Name <input name="name" value={event.name} required /></label>
        <label>Description <textarea name="description">{event.description}</textarea></label>
        <label>Location <input name="location" value={event.location ?? ''} /></label>
        <label>Start <input name="start_time" type="datetime-local" value={toInputValue(event.start_time)} required /></label>
        <label>End <input name="end_time" type="datetime-local" value={toInputValue(event.end_time)} required /></label>
        <label>Max Attendees <input name="max_attendees" type="number" min="1" value={event.max_attendees ?? ''} /></label>
        <label>Cover Image URL <input name="cover_image_url" type="url" value={event.cover_image_url ?? ''} /></label>
        <label>
          <input name="is_public" type="checkbox" checked={event.is_public} /> Public event
        </label>
        <button type="submit">Save</button>
        <button type="button" onclick={() => editing = null}>Cancel</button>
      </form>
    {:else}
      {#if event.cover_image_url}
        <img src={event.cover_image_url} alt={event.name} />
      {/if}
      <div>
        <h2>{event.name}</h2>
        <span>{event.is_public ? 'Public' : 'Private'}</span>
        {#if event.is_public}
            <a href="/{event.slug}" target="_blank">/{event.slug}</a>
        {/if}
        <p>📅 {formatEventDate(event.start_time, event.end_time)}</p>
        {#if event.location}<p>📍 {event.location}</p>{/if}
        {#if event.max_attendees}<p>👥 Max {event.max_attendees} attendees</p>{/if}
        {#if event.description}<p>{event.description}</p>{/if}
        <button onclick={() => editing = event.id}>Edit</button>
        <form method="POST" action="?/delete" use:enhance style="display:inline">
          <input type="hidden" name="id" value={event.id} />
          <button type="submit">Delete</button>
        </form>
      </div>
    {/if}
  </div>
{/each}
