<script>
  import { marked } from 'marked'

  let { data } = $props()
  const { event } = data

  const hostName = 'The Code Hatch'

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

  const mapSrc = event.location
    ? `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`
    : ''

  const descriptionHtml = event.description
    ? marked(event.description, { breaks: true })
    : ''
</script>

<svelte:head>
  <title>{event.name} · Events</title>
</svelte:head>

<div class="page">
  <nav class="nav">
    <a class="logo" href="/">●</a>
    <div class="nav-right">
      <a href="/login" class="signin">Sign In</a>
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

        {#if event.location}
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
      radial-gradient(1200px 600px at 50% -10%, rgba(245, 84, 45, 0.13), transparent 60%),
      #0a0a0b;
    color: #fff;
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
    color: #fff;
    font-size: 18px;
    text-decoration: none;
  }
  .nav-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .nav-right a {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    font-size: 14px;
  }
  .nav-right a:hover {
    color: #fff;
  }
  .signin {
    background: rgba(255, 255, 255, 0.08);
    padding: 7px 14px;
    border-radius: 8px;
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
    background: #18181b;
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
    color: rgba(255, 255, 255, 0.25);
  }

  .host-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .host-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.45);
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
    background: #f5542d;
    color: #fff;
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
    border: 1px solid rgba(255, 255, 255, 0.12);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.03);
  }
  .date-tile-top {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #f5542d;
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
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.03);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.7);
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
    color: rgba(255, 255, 255, 0.5);
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
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
  }
  .rule {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }

  /* Markdown-rendered description */
  .about {
    font-size: 15px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.82);
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
    color: #fff;
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
    color: #f5542d;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .about :global(a:hover) {
    color: #ff7a5c;
  }
  .about :global(strong) {
    font-weight: 600;
    color: #fff;
  }
  .about :global(em) {
    font-style: italic;
    color: rgba(255, 255, 255, 0.7);
  }
  .about :global(code) {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 13px;
    background: rgba(255, 255, 255, 0.08);
    padding: 2px 6px;
    border-radius: 5px;
    color: rgba(255, 255, 255, 0.9);
  }
  .about :global(pre) {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
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
    border-left: 3px solid #f5542d;
    margin: 12px 0;
    padding: 6px 0 6px 14px;
    color: rgba(255, 255, 255, 0.6);
    font-style: italic;
  }
  .about :global(hr) {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 20px 0;
  }

  .location-name {
    font-size: 15px;
    font-weight: 500;
  }
  .location-sub {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 2px;
  }
  .map {
    margin-top: 14px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .map iframe {
    width: 100%;
    height: 280px;
    border: 0;
    display: block;
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