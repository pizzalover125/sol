<script>
  import { enhance } from '$app/forms'
  import Avatar from '$lib/Avatar.svelte'

  let { data, form } = $props()

  let ticketInput = $state('')

  function attendeeName(a) {
    const fn = a.profile?.first_name ?? a.first_name ?? ''
    const ln = a.profile?.last_name ?? a.last_name ?? ''
    const name = `${fn} ${ln}`.trim()
    return name || a.email || 'Unknown'
  }

  function attendeeEmail(a) {
    return a.email || a.profile?.email || ''
  }
</script>

<svelte:head>
  <title>Check-in · {data.event.name}</title>
</svelte:head>

<div class="page">
  <nav class="nav">
    <a class="logo" href="/">●</a>
    <span class="nav-title">Check-in · {data.event.name}</span>
    <a class="back-link" href="/{data.event.slug}">Event Page</a>
  </nav>

  <main class="container">
    {#if data.checkedIn && data.checkInError !== 'already_checked_in'}
      <div class="success-banner">✓ Checked in successfully!</div>
    {/if}
    {#if data.checkInError}
      <div class="error-banner">
        {#if data.checkInError === 'already_checked_in'}
          This attendee was already checked in
        {:else}
          {data.checkInError}
        {/if}
      </div>
    {/if}

    {#if form?.error}
      <div class="error-banner">{form.error}</div>
    {/if}
    {#if form?.success}
      <div class="success-banner">✓ Checked in successfully!</div>
    {/if}

    <div class="scan-section">
      <h2>Scan Ticket</h2>
      <p class="hint">Enter the ticket code from the QR code.</p>
      <form method="POST" action="?/check_in" use:enhance>
        <div class="input-row">
          <input
            type="text"
            name="ticket_id"
            placeholder="Paste ticket code here\u2026"
            bind:value={ticketInput}
            autocomplete="off"
            spellcheck="false"
          />
          <button class="primary" type="submit" disabled={!ticketInput.trim()}>
            Check In
          </button>
        </div>
      </form>
    </div>

    <div class="attendees-section">
      <h2>Attendees ({data.attendees.length})</h2>
      {#if data.attendees.length === 0}
        <p class="empty">No registrations yet.</p>
      {:else}
        <div class="list">
          {#each data.attendees as a (a.id)}
            <div class="attendee-row {a.checked_in ? 'checked-in' : ''}">
              <Avatar
                firstName={a.profile?.first_name ?? a.first_name ?? ''}
                lastName={a.profile?.last_name ?? a.last_name ?? ''}
                url={a.profile?.avatar_url}
                size={32}
              />
              <div class="att-info">
                <span class="att-name">{attendeeName(a)}</span>
                {#if attendeeEmail(a)}
                  <span class="att-email">{attendeeEmail(a)}</span>
                {/if}
              </div>
              {#if a.checked_in}
                <span class="check-in-badge">Checked in</span>
              {:else}
                <form method="POST" action="?/check_in" use:enhance>
                  <input type="hidden" name="ticket_id" value={a.id} />
                  <button class="checkin-btn" type="submit">Check In</button>
                </form>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    background: #0a0a0b;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  }
  .page {
    min-height: 100vh;
  }
  .nav {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 640px;
    margin: 0 auto;
    padding: 18px 24px;
  }
  .logo {
    color: #fff;
    font-size: 18px;
    text-decoration: none;
  }
  .nav-title {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255,255,255,0.6);
    flex: 1;
  }
  .back-link {
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    text-decoration: none;
    padding: 6px 12px;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    transition: color 0.15s, border-color 0.15s;
  }
  .back-link:hover {
    color: #fff;
    border-color: rgba(255,255,255,0.3);
  }
  .container {
    max-width: 640px;
    margin: 0 auto;
    padding: 24px 24px 80px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 8px;
  }
  .hint {
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    margin: 0 0 12px;
  }
  .input-row {
    display: flex;
    gap: 8px;
  }
  .input-row input {
    flex: 1;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 9px;
    padding: 10px 12px;
    font-size: 14px;
    color: #fff;
    font-family: monospace;
  }
  .input-row input:focus {
    outline: none;
    border-color: #f5542d;
  }
  .primary {
    background: #f5542d;
    color: #fff;
    border: none;
    border-radius: 9px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .primary:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .success-banner {
    background: rgba(126, 232, 168, 0.12);
    border: 1px solid rgba(126, 232, 168, 0.4);
    color: #7ee8a8;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
  }
  .error-banner {
    background: rgba(245, 84, 45, 0.12);
    border: 1px solid rgba(245, 84, 45, 0.4);
    color: #ffb3a0;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
  }
  .scan-section {
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.02);
    border-radius: 12px;
    padding: 20px;
  }
  .attendees-section {
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.02);
    border-radius: 12px;
    padding: 20px;
  }
  .empty {
    font-size: 13px;
    color: rgba(255,255,255,0.4);
    font-style: italic;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .attendee-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(255,255,255,0.03);
    transition: background 0.15s;
  }
  .attendee-row.checked-in {
    background: rgba(126, 232, 168, 0.06);
  }
  .att-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .att-name {
    font-size: 14px;
    font-weight: 500;
    color: #fff;
  }
  .att-email {
    font-size: 12px;
    color: rgba(255,255,255,0.5);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .check-in-badge {
    font-size: 12px;
    font-weight: 600;
    color: #7ee8a8;
    white-space: nowrap;
  }
  .checkin-btn {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.8);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    padding: 6px 13px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;
  }
  .checkin-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
</style>

