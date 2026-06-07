<script>
  import { enhance } from '$app/forms'
  import { supabase } from '$lib/supabase'
  import { goto } from '$app/navigation'
  import Avatar from '$lib/Avatar.svelte'
  import FormBuilder from '$lib/FormBuilder.svelte'
  import AddToCalendar from '$lib/AddToCalendar.svelte'
  import Landing from '$lib/Landing.svelte'
  import { formatAnswer } from '$lib/formFields'
  import { marked } from 'marked'

  let { data, form } = $props()

  let profile = $derived(data.profile)
  let editing = $state(null)
  let showCreateForm = $state(false)
  let expandedAttendees = $state({})
  let editDescriptions = $state({})

  function toggleAttendees(id) {
    expandedAttendees[id] = !expandedAttendees[id]
  }

  function attendeeName(a) {
    const fn = a.profile?.first_name ?? a.first_name ?? ''
    const ln = a.profile?.last_name ?? a.last_name ?? ''
    const name = `${fn} ${ln}`.trim()
    return name || a.email || 'Anonymous'
  }

  function attendeeFirst(a) {
    return a.profile?.first_name ?? a.first_name ?? ''
  }

  function attendeeLast(a) {
    return a.profile?.last_name ?? a.last_name ?? ''
  }

  function attendeeIsGuest(a) {
    return !a.user_id
  }

  function answerList(event, a) {
    const qs = event.registration_questions ?? []
    const ans = a.answers ?? {}
    return qs
      .filter((q) => {
        const v = ans[q.id]
        return v != null && v !== '' && v !== false && !(Array.isArray(v) && v.length === 0)
      })
      .map((q) => ({ label: q.label, value: formatAnswer(ans[q.id]) }))
  }

  function getEditDescription(event) {
    return editDescriptions[event.id] ?? event.description ?? ''
  }

  function stopEditing(id) {
    editing = null
    delete editThemes[id]
    delete editColors[id]
  }

  function startEditing(event) {
    editDescriptions[event.id] = event.description ?? ''
    editing = event.id
  }

  async function signOut() {
    await supabase.auth.signOut()
    goto('/login')
  }

  function toInputValue(ts) {
    return new Date(ts).toISOString().slice(0, 16)
  }

  const themes = [
    { name: 'Dark', bg: '#0a0a0b', text: '#ffffff', accent: '#f5542d' },
    { name: 'Midnight', bg: '#0f0f1a', text: '#e8e8f0', accent: '#7c5cfc' },
    { name: 'Forest', bg: '#0a120a', text: '#d4edda', accent: '#4ade80' },
    { name: 'Ocean', bg: '#0a0f1a', text: '#dbeafe', accent: '#60a5fa' },
    { name: 'Sunset', bg: '#1a0f0a', text: '#fed7aa', accent: '#fb923c' },
    { name: 'Rose', bg: '#1a0a0f', text: '#fce7f3', accent: '#f472b6' },
    { name: 'Light', bg: '#f5f5f0', text: '#1a1a1a', accent: '#d43d1a' },
    { name: 'Slate', bg: '#0f1117', text: '#e2e8f0', accent: '#94a3b8' },
  ]

  let createTheme = $state('Dark')
  let createBg = $state('#0a0a0b')
  let createText = $state('#ffffff')
  let createAccent = $state('#f5542d')

  function applyCreateTheme(t) {
    createTheme = t.name
    createBg = t.bg
    createText = t.text
    createAccent = t.accent
  }

  let editThemes = $state({})
  let editColors = $state({})

  function applyEditTheme(t, eventId) {
    editThemes[eventId] = t.name
    editColors[eventId] = { bg: t.bg, text: t.text, accent: t.accent }
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

{#if data.landing}
  <Landing />
{:else}
<div class="wrap">
  <header class="bar">
    <h1>My Events</h1>
    <div class="bar-actions">
      {#if profile}
        <div class="user-chip">
          <Avatar firstName={profile.first_name} lastName={profile.last_name} url={profile.avatar_url} size={32} />
          <span class="user-name">{profile.first_name} {profile.last_name}</span>
        </div>
      {/if}
      <button class="primary" onclick={() => showCreateForm = !showCreateForm}>
        {showCreateForm ? 'Cancel' : '+ New Event'}
      </button>
      <button class="ghost" onclick={signOut}>Sign Out</button>
    </div>
  </header>

  {#if form?.error}
    <div class="error">{form.error}</div>
  {/if}

  {#if showCreateForm}
    <form
      class="panel form-grid"
      method="POST"
      action="?/create"
      use:enhance={() => {
        return async ({ update }) => {
          await update()
          showCreateForm = false
        }
      }}
    >
      <h2>New Event</h2>
      <label>Event Name <input name="name" required /></label>
      <label>Description
        <textarea name="description" placeholder="Supports **Markdown**"></textarea>
      </label>
      <label>Location <input name="location" placeholder="Address or 'Online'" /></label>
      <div class="row">
        <label>Start <input name="start_time" type="datetime-local" required /></label>
        <label>End <input name="end_time" type="datetime-local" required /></label>
      </div>
      <div class="row">
        <label>Max Attendees <input name="max_attendees" type="number" min="1" placeholder="Unlimited" /></label>
        <label>Cover Image URL <input name="cover_image_url" type="url" placeholder="https://..." /></label>
      </div>
      <div class="theme-section">
        <label>Theme</label>
        <div class="theme-grid">
          {#each themes as t}
            <button type="button" class="theme-swatch {createTheme === t.name ? 'active' : ''}"
              style="background: {t.bg};" onclick={() => applyCreateTheme(t)}>
              <span style="color: {t.text};">{t.name[0]}</span>
            </button>
          {/each}
        </div>
      </div>
      <div class="row row-3">
        <label>Background <input name="background_color" type="color" value={createBg} /></label>
        <label>Text <input name="text_color" type="color" value={createText} /></label>
        <label>Accent <input name="accent_color" type="color" value={createAccent} /></label>
      </div>
      <label>Join Code <input name="join_code" placeholder="Leave blank for open registration" /></label>
      <FormBuilder />
      <label class="checkbox">
        <input name="is_public" type="checkbox" checked /> Public event
      </label>
      <button class="primary submit" type="submit">Create Event</button>
    </form>
  {/if}

  {#if data.events.length === 0}
    <p class="empty">No events yet. Create your first one!</p>
  {/if}

  <div class="list">
    {#each data.events as event (event.id)}
      <div class="panel">
        {#if editing === event.id}
          <form
            class="form-grid"
            method="POST"
            action="?/update"
            use:enhance={() => {
              return async ({ update }) => {
                await update()
                stopEditing(event.id)
              }
            }}
          >
            <input type="hidden" name="id" value={event.id} />
            <label>Event Name <input name="name" value={event.name} required /></label>
            
            <div class="md-label-row">
              <span class="field-label">Description</span>
              <span class="md-badge">Markdown</span>
            </div>
            <div class="md-editor">
              <div class="md-pane">
                <div class="md-pane-label">Edit</div>
                <textarea
                  name="description"
                  class="md-textarea"
                  value={getEditDescription(event)}
                  oninput={(e) => { editDescriptions[event.id] = e.target.value }}
                  placeholder="Supports **bold**, _italic_, ## headings, - lists…"
                ></textarea>
              </div>
              <div class="md-divider"></div>
              <div class="md-pane">
                <div class="md-pane-label">Preview</div>
                <div class="md-preview">
                  {#if getEditDescription(event).trim()}
                    {@html marked(getEditDescription(event), { breaks: true })}
                  {:else}
                    <span class="md-empty">Nothing to preview yet…</span>
                  {/if}
                </div>
              </div>
            </div>

            <label>Location <input name="location" value={event.location ?? ''} /></label>
            <div class="row">
              <label>Start <input name="start_time" type="datetime-local" value={toInputValue(event.start_time)} required /></label>
              <label>End <input name="end_time" type="datetime-local" value={toInputValue(event.end_time)} required /></label>
            </div>
            <div class="row">
              <label>Max Attendees <input name="max_attendees" type="number" min="1" value={event.max_attendees ?? ''} /></label>
              <label>Cover Image URL <input name="cover_image_url" type="url" value={event.cover_image_url ?? ''} /></label>
            </div>
            <div class="theme-section">
              <label>Theme</label>
              <div class="theme-grid">
                {#each themes as t}
                  <button type="button" class="theme-swatch {editThemes[event.id] === t.name ? 'active' : ''}"
                    style="background: {t.bg};" onclick={() => applyEditTheme(t, event.id)}>
                    <span style="color: {t.text};">{t.name[0]}</span>
                  </button>
                {/each}
              </div>
            </div>
            <div class="row row-3">
              <label>Background <input name="background_color" type="color" value={editColors[event.id]?.bg ?? event.background_color ?? '#0a0a0b'} /></label>
              <label>Text <input name="text_color" type="color" value={editColors[event.id]?.text ?? event.text_color ?? '#ffffff'} /></label>
              <label>Accent <input name="accent_color" type="color" value={editColors[event.id]?.accent ?? event.accent_color ?? '#f5542d'} /></label>
            </div>
            <label>Join Code <input name="join_code" value={event.join_code ?? ''} placeholder="Leave blank for open registration" /></label>
            <FormBuilder initial={event.registration_questions ?? []} />
            <label class="checkbox">
              <input name="is_public" type="checkbox" checked={event.is_public} /> Public event
            </label>
            <div class="event-actions">
              <button class="primary" type="submit">Save</button>
              <button class="ghost" type="button" onclick={() => stopEditing(event.id)}>Cancel</button>
            </div>
          </form>
        {:else}
          <div class="event-display">
            <div class="thumb">
              {#if event.cover_image_url}
                <img src={event.cover_image_url} alt={event.name} />
              {:else}
                <div class="thumb-fallback">{event.name[0]}</div>
              {/if}
            </div>
            <div class="event-body">
              <div class="event-top">
                <h2 class="event-name">{event.name}</h2>
                <div class="badges">
                  <span class="badge {event.is_public ? 'public' : 'private'}">
                    {event.is_public ? 'Public' : 'Private'}
                  </span>
                  {#if event.is_public}
                    <a class="slug" href="/{event.slug}" target="_blank">/{event.slug}</a>
                  {/if}
                </div>
              </div>
              <div class="meta-line">📅 {formatEventDate(event.start_time, event.end_time)}</div>
              {#if event.location}<div class="meta-line">📍 {event.location}</div>{/if}
              {#if event.max_attendees}<div class="meta-line">👥 Max {event.max_attendees} attendees</div>{/if}

              <div class="event-actions">
                <button class="sm" onclick={() => startEditing(event)}>Edit</button>
                <AddToCalendar {event} />
                <button class="sm" onclick={() => toggleAttendees(event.id)}>
                  {expandedAttendees[event.id] ? 'Hide' : 'Attendees'}
                  ({(data.attendeesByEvent[event.id] ?? []).length})
                </button>
                <form method="POST" action="?/toggle_registration" use:enhance>
                  <input type="hidden" name="id" value={event.id} />
                  <button class="sm" type="submit">
                    {event.registration_open ? 'Close RSVPs' : 'Open RSVPs'}
                  </button>
                </form>
                <form method="POST" action="?/delete" use:enhance>
                  <input type="hidden" name="id" value={event.id} />
                  <button class="sm del" type="submit">Delete</button>
                </form>
              </div>

              {#if expandedAttendees[event.id]}
                <div class="attendees">
                  <div class="attendees-head">
                    Attendees ({(data.attendeesByEvent[event.id] ?? []).length}{event.max_attendees ? ` / ${event.max_attendees}` : ''})
                    <span class="attendees-head-right">
                      {#if (data.attendeesByEvent[event.id] ?? []).length}
                        <a class="csv-link" href="/{event.slug}/attendees.csv" download>↓ CSV</a>
                      {/if}
                      <span class={event.registration_open ? 'reg-on' : 'reg-off'}>
                        {event.registration_open ? '● Open' : '○ Closed'}
                      </span>
                    </span>
                  </div>
                  {#if (data.attendeesByEvent[event.id] ?? []).length === 0}
                    <div class="attendees-empty">No registrations yet.</div>
                  {:else}
                    <ul class="attendees-list">
                      {#each data.attendeesByEvent[event.id] as a (a.id)}
                        <li>
                          <div class="att-main">
                            <Avatar
                              firstName={attendeeFirst(a)}
                              lastName={attendeeLast(a)}
                              url={a.profile?.avatar_url}
                              size={28}
                            />
                            <span class="att-name">
                              {attendeeName(a)}
                              {#if attendeeIsGuest(a)}
                                <span class="att-tag">guest</span>
                              {/if}
                            </span>
                            {#if a.email}
                              <a class="att-email" href="mailto:{a.email}">{a.email}</a>
                            {/if}
                            <span class="att-date">
                              {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          {#if answerList(event, a).length}
                            <div class="att-answers">
                              {#each answerList(event, a) as ans}
                                <div class="att-answer">
                                  <span class="att-q">{ans.label}</span>
                                  <span class="att-a">{ans.value}</span>
                                </div>
                              {/each}
                            </div>
                          {/if}
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  {#if data.registeredEvents.length > 0}
    <header class="bar" style="margin-top: 48px;">
      <h1>Registered Events</h1>
    </header>
    <div class="list">
      {#each data.registeredEvents as event (event.id)}
        <div class="panel">
          <div class="event-display">
            <div class="thumb">
              {#if event.cover_image_url}
                <img src={event.cover_image_url} alt={event.name} />
              {:else}
                <div class="thumb-fallback">{event.name[0]}</div>
              {/if}
            </div>
            <div class="event-body">
              <div class="event-top">
                <h2 class="event-name">{event.name}</h2>
                <div class="badges">
                  <span class="badge public">Registered</span>
                  <a class="slug" href="/{event.slug}" target="_blank">/{event.slug}</a>
                </div>
              </div>
              <div class="meta-line">📅 {formatEventDate(event.start_time, event.end_time)}</div>
              {#if event.location}<div class="meta-line">📍 {event.location}</div>{/if}
              <div class="event-actions">
                <a class="sm" href="/{event.slug}">View</a>
                <AddToCalendar {event} />
                <form method="POST" action="?/cancel_registration" use:enhance>
                  <input type="hidden" name="event_id" value={event.id} />
                  <button class="sm del" type="submit">Cancel RSVP</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
{/if}
<style>
  .wrap {
    max-width: 760px;
    margin: 0 auto;
    padding: 28px 24px 80px;
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }
  .bar h1 {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0;
  }
  .bar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .user-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px 4px 4px;
    border: 1px solid var(--border-soft);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.04);
  }
  .user-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-dim);
    white-space: nowrap;
  }

  .primary {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 9px;
    padding: 9px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .primary:hover {
    background: var(--accent-hover);
  }
  .submit {
    align-self: flex-start;
  }
  .ghost {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-dim);
    border: 1px solid var(--border-soft);
    border-radius: 9px;
    padding: 9px 16px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .ghost:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .sm {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-dim);
    border: 1px solid var(--border-soft);
    border-radius: 8px;
    padding: 6px 13px;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    font-family: inherit;
  }
  .sm:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .del:hover {
    background: rgba(245, 84, 45, 0.15);
    border-color: rgba(245, 84, 45, 0.4);
    color: #ff8b6f;
  }

  .panel {
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 20px;
    background: var(--card);
    margin-bottom: 28px;
  }
  .list .panel {
    margin-bottom: 0;
    transition: border-color 0.15s, background 0.15s;
  }
  .list .panel:hover {
    border-color: rgba(255, 255, 255, 0.18);
    background: var(--card-strong);
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .form-grid {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .form-grid h2 {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 600;
  }
  .row {
    display: flex;
    gap: 14px;
  }
  .row label {
    flex: 1;
  }
  .form-grid label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: var(--text-muted);
  }
  .form-grid input:not([type='checkbox']),
  .form-grid textarea {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 10px 12px;
    color: #fff;
    font-size: 14px;
    font-family: inherit;
  }
  .form-grid input:focus,
  .form-grid textarea:focus {
    outline: none;
    border-color: var(--accent);
  }
  .form-grid textarea {
    min-height: 70px;
    resize: vertical;
  }
  .checkbox {
    flex-direction: row !important;
    align-items: center;
    gap: 8px;
    color: var(--text-dim) !important;
    font-size: 14px !important;
  }
  .checkbox input {
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
  }

  .md-label-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .field-label {
    font-size: 13px;
    color: var(--text-muted);
  }
  .md-badge {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent);
    background: rgba(245, 84, 45, 0.12);
    border: 1px solid rgba(245, 84, 45, 0.25);
    padding: 2px 7px;
    border-radius: 999px;
  }
  .md-editor {
    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.02);
    min-height: 180px;
  }
  .md-editor:focus-within {
    border-color: var(--accent);
  }
  .md-pane {
    display: flex;
    flex-direction: column;
    min-height: 180px;
  }
  .md-pane-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.25);
    padding: 8px 12px 6px;
    border-bottom: 1px solid var(--border);
  }
  .md-divider {
    background: var(--border);
  }
  .md-textarea {
    flex: 1;
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 12px !important;
    color: #fff;
    font-size: 13px !important;
    font-family: ui-monospace, 'SF Mono', Menlo, monospace !important;
    resize: none !important;
    line-height: 1.6;
    min-height: 140px;
  }
  .md-textarea:focus {
    outline: none !important;
    border-color: transparent !important;
  }
  .md-preview {
    flex: 1;
    padding: 12px;
    font-size: 13px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.8);
    overflow-y: auto;
  }
  .md-preview :global(p) { margin: 0 0 8px; }
  .md-preview :global(p:last-child) { margin-bottom: 0; }
  .md-preview :global(h1),
  .md-preview :global(h2),
  .md-preview :global(h3) {
    font-weight: 600;
    color: #fff;
    margin: 12px 0 4px;
  }
  .md-preview :global(h1) { font-size: 16px; }
  .md-preview :global(h2) { font-size: 14px; }
  .md-preview :global(h3) { font-size: 13px; }
  .md-preview :global(ul),
  .md-preview :global(ol) {
    margin: 4px 0 8px;
    padding-left: 18px;
  }
  .md-preview :global(li) { margin-bottom: 2px; }
  .md-preview :global(strong) { font-weight: 600; color: #fff; }
  .md-preview :global(em) { font-style: italic; color: rgba(255,255,255,0.65); }
  .md-preview :global(a) { color: #f5542d; text-decoration: underline; }
  .md-preview :global(code) {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 12px;
    background: rgba(255,255,255,0.08);
    padding: 1px 5px;
    border-radius: 4px;
  }
  .md-preview :global(blockquote) {
    border-left: 2px solid #f5542d;
    margin: 8px 0;
    padding: 4px 0 4px 10px;
    color: rgba(255,255,255,0.55);
    font-style: italic;
  }
  .md-preview :global(hr) {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.1);
    margin: 10px 0;
  }
  .md-empty {
    color: rgba(255, 255, 255, 0.2);
    font-style: italic;
    font-size: 13px;
  }

  .event-display {
    display: flex;
    gap: 16px;
  }
  .thumb {
    width: 84px;
    height: 84px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    background: #18181b;
  }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .thumb-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.25);
  }
  .event-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .event-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .event-name {
    font-size: 17px;
    font-weight: 600;
    margin: 0;
  }
  .badges {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .badge {
    font-size: 11px;
    padding: 3px 9px;
    border-radius: 999px;
  }
  .badge.public {
    background: rgba(245, 84, 45, 0.15);
    color: #ff8b6f;
  }
  .badge.private {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-muted);
  }
  .slug {
    font-size: 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: var(--text-muted);
    text-decoration: none;
    background: rgba(255, 255, 255, 0.05);
    padding: 3px 8px;
    border-radius: 6px;
    transition: color 0.15s;
  }
  .slug:hover {
    color: #fff;
  }
  .meta-line {
    font-size: 13px;
    color: var(--text-muted);
  }
  .event-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .event-actions form {
    display: inline-flex;
  }

  .attendees {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--border-soft);
  }
  .attendees-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  .attendees-head-right {
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }
  .csv-link {
    color: var(--text-muted);
    text-decoration: none;
    letter-spacing: 0;
    text-transform: none;
    font-weight: 600;
    transition: color 0.15s;
  }
  .csv-link:hover {
    color: #fff;
  }
  .reg-on { color: #7ee8a8; }
  .reg-off { color: #ffb3a0; }
  .attendees-empty {
    font-size: 13px;
    color: var(--text-muted);
    font-style: italic;
  }
  .attendees-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .attendees-list li {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
  }
  .att-main {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .att-answers {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-left: 38px;
    padding: 6px 10px;
    border-left: 2px solid var(--border);
    background: rgba(255, 255, 255, 0.02);
    border-radius: 0 6px 6px 0;
  }
  .att-answer {
    display: flex;
    gap: 8px;
    font-size: 12px;
  }
  .att-q {
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .att-q::after {
    content: ':';
  }
  .att-a {
    color: var(--text-dim);
    word-break: break-word;
  }
  .att-name {
    flex: 1;
    color: #fff;
  }
  .att-date {
    color: var(--text-muted);
    font-size: 12px;
  }
  .att-email {
    color: var(--text-muted);
    font-size: 12px;
    text-decoration: none;
  }
  .att-email:hover {
    color: #fff;
    text-decoration: underline;
  }
  .att-tag {
    margin-left: 6px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.06);
    padding: 1px 6px;
    border-radius: 999px;
  }

  .error {
    background: rgba(245, 84, 45, 0.12);
    border: 1px solid rgba(245, 84, 45, 0.4);
    color: #ffb3a0;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 14px;
    margin-bottom: 20px;
  }
  .empty {
    text-align: center;
    color: var(--text-muted);
    padding: 56px 0;
  }

  .theme-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .theme-section label {
    font-size: 13px;
    color: var(--text-muted);
  }
  .theme-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .theme-swatch {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 2px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    padding: 0;
    transition: border-color 0.15s;
  }
  .theme-swatch:hover {
    border-color: var(--accent);
  }
  .theme-swatch.active {
    border-color: #fff;
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .row-3 {
    display: flex;
    gap: 10px;
  }
  .row-3 label {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .row-3 input[type="color"] {
    width: 100%;
    height: 40px;
    padding: 2px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
  }

  @media (max-width: 560px) {
    .row {
      flex-direction: column;
    }
    .row-3 {
      flex-direction: column;
    }
    .event-display {
      flex-direction: column;
    }
    .thumb {
      width: 100%;
      height: 160px;
    }
    .md-editor {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1px auto;
    }
    .md-divider {
      height: 1px;
      width: 100%;
    }
  }
</style>
