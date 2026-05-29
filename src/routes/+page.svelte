<script>
  import { enhance } from '$app/forms'
  import { supabase } from '$lib/supabase'
  import { goto } from '$app/navigation'
  import Avatar from '$lib/Avatar.svelte'
  import { marked } from 'marked'

  let { data, form } = $props()

  let profile = $derived(data.profile)
  let editing = $state(null)
  let showCreateForm = $state(false)

  // Per-event live description state for the edit form
  let editDescriptions = $state({})

  function getEditDescription(event) {
    return editDescriptions[event.id] ?? event.description ?? ''
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

  function formatEventDate(start, end) {
    const s = new Date(start)
    const e = new Date(end)
    const date = s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    const startTime = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const endTime = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return `${date} · ${startTime} – ${endTime}`
  }
</script>

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
                editing = null
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
            <label class="checkbox">
              <input name="is_public" type="checkbox" checked={event.is_public} /> Public event
            </label>
            <div class="event-actions">
              <button class="primary" type="submit">Save</button>
              <button class="ghost" type="button" onclick={() => editing = null}>Cancel</button>
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
              <!-- description intentionally hidden in card view -->
              <div class="event-actions">
                <button class="sm" onclick={() => startEditing(event)}>Edit</button>
                <form method="POST" action="?/delete" use:enhance>
                  <input type="hidden" name="id" value={event.id} />
                  <button class="sm del" type="submit">Delete</button>
                </form>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

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

  @media (max-width: 560px) {
    .row {
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
