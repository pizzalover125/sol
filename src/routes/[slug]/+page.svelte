<script> 
  import { marked } from 'marked'
  import { enhance } from '$app/forms'
  import Avatar from '$lib/Avatar.svelte'
  import RegistrationFields from '$lib/RegistrationFields.svelte'
  import AddToCalendar from '$lib/AddToCalendar.svelte'

  let { data, form } = $props()
  // svelte-ignore state_referenced_locally
  const { event } = data
  let viewer = $derived(data.viewer)
  const questions = event.registration_questions ?? []
  let attendeeCount = $derived(data.attendeeCount)
  let isRegistered = $derived(data.isRegistered)
  let guestRegistered = $derived(data.guestRegistered)
  let isSignedIn = $derived(data.isSignedIn)
  let isHost = $derived(data.isHost)
  let requiresCode = $derived(data.requiresCode)
  let isFull = $derived(
    event.max_attendees != null && attendeeCount >= event.max_attendees
  )

  const start = new Date(event.start_time)
  const end = new Date(event.end_time)

  const monthShort = start.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = start.getDate()
  const fullDate = start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const timeRange =
    start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) +
    ' – ' +
    end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const locParts = (event.location ?? '').split(',')
  const locName = locParts[0]?.trim() ?? ''
  const locSub = locParts.slice(1).join(',').trim()

  const isOnline = (event.location ?? '').trim().toLowerCase() === 'online'

  const mapSrc = event.location && !isOnline
    ? `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`
    : ''

  const descriptionHtml = event.description
    ? marked(event.description, { breaks: true })
    : ''
</script>

<svelte:head>
  <title>{event.name} · Events</title>
</svelte:head>

<div class="page" style="--page-bg: {event.background_color || '#0a0a0b'}; --page-text: {event.text_color || '#ffffff'}; --page-accent: {event.accent_color || '#f5542d'}">
  <nav class="nav">
    <a class="logo" href="/">●</a>
    <div class="nav-right">
      {#if viewer}
        <a class="user-chip" href="/">
          <Avatar firstName={viewer.first_name} lastName={viewer.last_name} url={viewer.avatar_url} size={28} />
          <span class="user-name">{viewer.first_name} {viewer.last_name}</span>
        </a>
      {:else}
        <a href="/login" class="signin">Sign In</a>
      {/if}
    </div>
  </nav>

  <main class="container">
    <div class="layout">
      <aside class="sidebar">
        <div class="cover">
          {#if event.cover_image_url}
            <img src={event.cover_image_url} alt={event.name} />
          {:else}
            <div class="cover-fallback">{event.name[0]}</div>
          {/if}
        </div>
         
        {#if event.profile}
          <div class="host-card">
            <div class="host-label">Presented by</div>
            <div class="host-row">
              {#if event.profile.avatar_url}
                <img class="host-avatar" style="object-fit: cover;" src={event.profile.avatar_url} alt="Host Avatar" />
              {:else}
                <div class="host-avatar">
                  {((event.profile.first_name?.[0] ?? '') + (event.profile.last_name?.[0] ?? '')).toUpperCase()}
                </div>
              {/if}
              <span class="host-name">
                {event.profile.first_name ?? 'Unknown'} {event.profile.last_name ?? ''}
              </span>
            </div>
          </div>
        {/if}
      </aside>

      <section class="content">
        <h1 class="title">{event.name}</h1>

        <div class="rsvp-card">
          <div class="rsvp-head">
            <span class="rsvp-label">Registration</span>
            <span class="rsvp-count">
              {attendeeCount}
              {#if event.max_attendees}/ {event.max_attendees}{/if}
              going
            </span>
          </div>

          {#if form?.error}
            <div class="rsvp-error">{form.error}</div>
          {/if}

          {#if isHost}
            <div class="rsvp-hint">You're the host of this event.</div>
            <AddToCalendar {event} variant="solid" />
          {:else if !event.registration_open}
            <div class="rsvp-hint closed">Registration is closed.</div>
          {:else if isRegistered || guestRegistered}
            <div class="rsvp-going">✓ You're going</div>
            <AddToCalendar {event} variant="solid" />
            {#if isRegistered}
              <form method="POST" action="?/unregister" use:enhance>
                <button class="rsvp-btn ghost" type="submit">Cancel RSVP</button>
              </form>
            {/if}
          {:else if isFull}
            <div class="rsvp-hint closed">Event is full.</div>
          {:else if isSignedIn}
            <form class="guest-form" method="POST" action="?/register" use:enhance>
              {#if requiresCode}
                <input name="join_code" placeholder="Join code" required />
              {/if}
              {#if questions.length}
                <RegistrationFields {questions} />
              {/if}
              <button class="rsvp-btn" type="submit">Register</button>
            </form>
          {:else}
            <form class="guest-form" method="POST" action="?/register" use:enhance>
              {#if requiresCode}
                <input name="join_code" placeholder="Join code" required />
              {/if}
              <div class="guest-row">
                <input name="first_name" placeholder="First name" required />
                <input name="last_name" placeholder="Last name" required />
              </div>
              <input name="email" type="email" placeholder="you@example.com" required />
              {#if questions.length}
                <RegistrationFields {questions} />
              {/if}
              <button class="rsvp-btn" type="submit">Register</button>
              <div class="guest-hint">
                Have an account? <a href="/login">Sign in</a>
              </div>
            </form>
          {/if}
        </div>

        <div class="meta">
          <div class="meta-row">
            <div class="date-tile">
              <div class="date-tile-top">{monthShort}</div>
              <div class="date-tile-day">{day}</div>
            </div>
            <div class="meta-text">
              <div class="meta-primary">{fullDate}</div>
              <div class="meta-secondary">{timeRange}</div>
            </div>
          </div>

          {#if event.location}
            <div class="meta-row">
              <div class="icon-tile">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div class="meta-text">
                <div class="meta-primary">{locName}</div>
                {#if locSub}<div class="meta-secondary">{locSub}</div>{/if}
              </div>
            </div>
          {/if}
        </div>

        <div class="section">
          <div class="section-head">
            <span>About Event</span>
            <div class="rule"></div>
          </div>
          {#if descriptionHtml}
            <div class="about">{@html descriptionHtml}</div>
          {/if}
        </div>

        {#if event.location && !isOnline}
          <div class="section">
            <div class="section-head">
              <span>Location</span>
              <div class="rule"></div>
            </div>
            <div class="location-name">{locName}</div>
            {#if locSub}<div class="location-sub">{locSub}</div>{/if}
            <div class="map">
              <iframe
                title="Event location"
                src={mapSrc}
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        {/if}
      </section>
    </div>
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
  }

  .page {
    min-height: 100vh;
    background:
      radial-gradient(1200px 600px at 50% -10%, color-mix(in srgb, var(--page-accent) 13%, transparent), transparent 60%),
      var(--page-bg, #0a0a0b);
    color: var(--page-text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 960px;
    margin: 0 auto;
    padding: 18px 24px;
  }
  .logo {
    color: var(--page-text);
    font-size: 18px;
    text-decoration: none;
  }
  .nav-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .nav-right a {
    color: color-mix(in srgb, var(--page-text) 70%, transparent);
    text-decoration: none;
    font-size: 14px;
  }
  .nav-right a:hover {
    color: var(--page-text);
  }
  .signin {
    background: color-mix(in srgb, var(--page-text) 8%, transparent);
    padding: 7px 14px;
    border-radius: 8px;
  }
  .user-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px 4px 4px;
    border: 1px solid color-mix(in srgb, var(--page-text) 8%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--page-text) 4%, transparent);
  }
  .user-name {
    font-size: 13px;
    font-weight: 500;
    color: color-mix(in srgb, var(--page-text) 82%, transparent) !important;
    white-space: nowrap;
  }

  .container {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px 24px 80px;
  }
  .layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 40px;
    align-items: start;
  }

  .sidebar {
    position: sticky;
    top: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .cover {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 16px;
    overflow: hidden;
    background: color-mix(in srgb, var(--page-bg) 70%, #000);
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.45);
  }
  .cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .cover-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 72px;
    font-weight: 700;
    color: color-mix(in srgb, var(--page-text) 25%, transparent);
  }

  .host-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 4px;
    border-top: 1px solid color-mix(in srgb, var(--page-text) 8%, transparent);
  }
  .host-label {
    font-size: 12px;
    color: color-mix(in srgb, var(--page-text) 45%, transparent);
    margin-top: 12px;
  }
  .host-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .host-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--page-accent);
    color: var(--page-text);
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .host-name {
    font-size: 14px;
    font-weight: 500;
  }

  .content {
    min-width: 0;
  }
  .title {
    font-size: 34px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin: 0 0 24px;
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 28px;
  }
  .meta-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .date-tile {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--page-text) 12%, transparent);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    background: color-mix(in srgb, var(--page-text) 3%, transparent);
  }
  .date-tile-top {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--page-accent);
    text-align: center;
    padding-top: 4px;
  }
  .date-tile-day {
    font-size: 17px;
    font-weight: 600;
    text-align: center;
    line-height: 1;
    margin-top: 1px;
  }
  .icon-tile {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--page-text) 12%, transparent);
    background: color-mix(in srgb, var(--page-text) 3%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: color-mix(in srgb, var(--page-text) 70%, transparent);
  }
  .meta-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .meta-primary {
    font-size: 15px;
    font-weight: 500;
  }
  .meta-secondary {
    font-size: 13px;
    color: color-mix(in srgb, var(--page-text) 50%, transparent);
  }

  .section {
    margin-bottom: 32px;
  }
  .section-head {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }
  .section-head span {
    font-size: 14px;
    font-weight: 500;
    color: color-mix(in srgb, var(--page-text) 50%, transparent);
    white-space: nowrap;
  }
  .rule {
    flex: 1;
    height: 1px;
    background: color-mix(in srgb, var(--page-text) 10%, transparent);
  }

  .about {
    font-size: 15px;
    line-height: 1.65;
    color: color-mix(in srgb, var(--page-text) 82%, transparent);
  }
  .about :global(p) {
    margin: 0 0 12px;
  }
  .about :global(p:last-child) {
    margin-bottom: 0;
  }
  .about :global(h1),
  .about :global(h2),
  .about :global(h3),
  .about :global(h4) {
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 20px 0 8px;
    color: var(--page-text);
  }
  .about :global(h1) { font-size: 20px; }
  .about :global(h2) { font-size: 17px; }
  .about :global(h3) { font-size: 15px; }
  .about :global(ul),
  .about :global(ol) {
    margin: 8px 0 12px;
    padding-left: 20px;
  }
  .about :global(li) {
    margin-bottom: 4px;
  }
  .about :global(a) {
    color: var(--page-accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .about :global(a:hover) {
    color: color-mix(in srgb, var(--page-accent) 70%, white);
  }
  .about :global(strong) {
    font-weight: 600;
    color: var(--page-text);
  }
  .about :global(em) {
    font-style: italic;
    color: color-mix(in srgb, var(--page-text) 70%, transparent);
  }
  .about :global(code) {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 13px;
    background: color-mix(in srgb, var(--page-text) 8%, transparent);
    padding: 2px 6px;
    border-radius: 5px;
    color: color-mix(in srgb, var(--page-text) 90%, transparent);
  }
  .about :global(pre) {
    background: color-mix(in srgb, var(--page-text) 5%, transparent);
    border: 1px solid color-mix(in srgb, var(--page-text) 8%, transparent);
    border-radius: 10px;
    padding: 14px 16px;
    overflow-x: auto;
    margin: 12px 0;
  }
  .about :global(pre code) {
    background: none;
    padding: 0;
    font-size: 13px;
  }
  .about :global(blockquote) {
    border-left: 3px solid var(--page-accent);
    margin: 12px 0;
    padding: 6px 0 6px 14px;
    color: color-mix(in srgb, var(--page-text) 60%, transparent);
    font-style: italic;
  }
  .about :global(hr) {
    border: none;
    border-top: 1px solid color-mix(in srgb, var(--page-text) 10%, transparent);
    margin: 20px 0;
  }

  .location-name {
    font-size: 15px;
    font-weight: 500;
  }
  .location-sub {
    font-size: 14px;
    color: color-mix(in srgb, var(--page-text) 50%, transparent);
    margin-top: 2px;
  }
  .map {
    margin-top: 14px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--page-text) 10%, transparent);
  }
  .map iframe {
    width: 100%;
    height: 280px;
    border: 0;
    display: block;
  }

  .rsvp-card {
    border: 1px solid color-mix(in srgb, var(--page-text) 10%, transparent);
    background: color-mix(in srgb, var(--page-text) 3%, transparent);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 28px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .rsvp-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .rsvp-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--page-text) 50%, transparent);
  }
  .rsvp-count {
    font-size: 13px;
    color: color-mix(in srgb, var(--page-text) 75%, transparent);
  }
  .rsvp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--page-accent);
    color: var(--page-text);
    border: none;
    border-radius: 9px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s;
  }
  .rsvp-btn:hover {
    background: color-mix(in srgb, var(--page-accent) 80%, white);
  }
  .rsvp-btn.ghost {
    background: color-mix(in srgb, var(--page-text) 8%, transparent);
    color: color-mix(in srgb, var(--page-text) 85%, transparent);
  }
  .rsvp-btn.ghost:hover {
    background: color-mix(in srgb, var(--page-text) 14%, transparent);
  }
  .rsvp-going {
    color: #7ee8a8e3;
    font-weight: 600;
    font-size: 14px;
  }
  .rsvp-hint {
    font-size: 13px;
    color: color-mix(in srgb, var(--page-text) 55%, transparent);
  }
  .rsvp-hint.closed {
    color: #ffb3a0;
  }
  .rsvp-error {
    background: color-mix(in srgb, var(--page-accent) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--page-accent) 40%, transparent);
    color: #ffb3a0;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
  }
  .guest-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .guest-row {
    display: flex;
    gap: 8px;
  }
  .guest-row input {
    flex: 1;
    min-width: 0;
  }
  .guest-form input {
    background: color-mix(in srgb, var(--page-text) 4%, transparent);
    border: 1px solid color-mix(in srgb, var(--page-text) 12%, transparent);
    border-radius: 8px;
    padding: 9px 11px;
    font-size: 14px;
    color: var(--page-text);
    font-family: inherit;
  }
  .guest-form input:focus {
    outline: none;
    border-color: var(--page-accent);
  }
  .guest-form input::placeholder {
    color: color-mix(in srgb, var(--page-text) 35%, transparent);
  }
  .guest-hint {
    font-size: 12px;
    color: color-mix(in srgb, var(--page-text) 50%, transparent);
    text-align: center;
  }
  .guest-hint a {
    color: var(--page-accent);
    text-decoration: none;
  }
  .guest-hint a:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .layout {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    .sidebar {
      position: static;
    }
    .cover {
      max-width: 320px;
    }
    .title {
      font-size: 28px;
    }
  }
</style>
