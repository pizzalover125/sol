<script>
  import { googleCalendarUrl } from '$lib/calendar'

  let { event, label = 'Add to Calendar', variant = 'ghost' } = $props()

  let open = $state(false)

  // svelte-ignore state_referenced_locally
  const icsHref = `/${event.slug}/event.ics`

  function eventUrl() {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/${event.slug}`
  }

  function close() {
    open = false
  }
</script>

<svelte:window onclick={close} />

<div class="atc">
  <button
    class="atc-btn {variant}"
    type="button"
    aria-haspopup="menu"
    aria-expanded={open}
    onclick={(e) => {
      e.stopPropagation()
      open = !open
    }}
  >
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
    {label}
  </button>

  {#if open}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="atc-menu" role="menu" onclick={(e) => e.stopPropagation()}>
      <a class="atc-item" role="menuitem" href={googleCalendarUrl(event, eventUrl())} target="_blank" rel="noopener" onclick={close}>
        Google Calendar
      </a>
      <a class="atc-item" role="menuitem" href={icsHref} download onclick={close}>
        Apple Calendar
      </a>
      <a class="atc-item" role="menuitem" href={icsHref} download onclick={close}>
        Download .ics
      </a>
    </div>
  {/if}
</div>

<style>
  .atc {
    position: relative;
    display: inline-flex;
  }
  .atc-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .atc-btn.ghost {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .atc-btn.ghost:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }
  .atc-btn.solid {
    background: #f5542d;
    color: #fff;
    border: 1px solid transparent;
  }
  .atc-btn.solid:hover {
    background: #ff6a44;
  }

  .atc-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 30;
    min-width: 180px;
    display: flex;
    flex-direction: column;
    padding: 6px;
    border-radius: 10px;
    background: #18181b;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }
  .atc-item {
    padding: 8px 10px;
    border-radius: 7px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.82);
    text-decoration: none;
    white-space: nowrap;
    transition: background 0.12s, color 0.12s;
  }
  .atc-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
</style>

