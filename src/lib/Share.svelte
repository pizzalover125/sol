<script>
  let { event, label = 'Share', variant = 'ghost', size = 'md' } = $props()

  let open = $state(false)
  let copied = $state(false)

  // Construct event URL from slug to ensure it works on both event page and home page
  function getUrl() {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    return `${origin}/${event.slug}`
  }

  function getText() {
    return `Check out ${event.name} on sol!`
  }

  const shareLinks = $derived.by(() => {
    const url = getUrl()
    const text = getText()
    return [
      {
        name: 'X (Twitter)',
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        icon: 'twitter'
      },
      {
        name: 'Facebook',
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        icon: 'facebook'
      },
      {
        name: 'LinkedIn',
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        icon: 'linkedin'
      },
      {
        name: 'WhatsApp',
        url: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`,
        icon: 'whatsapp'
      }
    ]
  })

  async function handleShare(e) {
    const url = getUrl()
    const text = getText()
    
    const shareData = {
      title: event.name,
      text: text,
      url: url
    }

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err)
      }
    }

    // Fallback: Open menu
    e.stopPropagation()
    open = !open
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getUrl())
      copied = true
      setTimeout(() => {
        copied = false
        open = false
      }, 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  function close() {
    open = false
  }
</script>

<svelte:window onclick={close} />

<div class="share">
  <button
    class="share-btn {variant} {size}"
    type="button"
    aria-haspopup="menu"
    aria-expanded={open}
    onclick={handleShare}
  >
    {#if copied}
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {label ? 'Copied!' : ''}
    {:else}
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      {label}
    {/if}
  </button>

  {#if open}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="share-menu" role="menu" onclick={(e) => e.stopPropagation()}>
      {#each shareLinks as link}
        <a class="share-item" role="menuitem" href={link.url} target="_blank" rel="noopener" onclick={close}>
          {link.name}
        </a>
      {/each}
      <div class="share-divider"></div>
      <button class="share-item" role="menuitem" onclick={copyLink}>
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  {/if}
</div>

<style>
  .share {
    position: relative;
    display: inline-flex;
  }
  .share-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    border: none;
    white-space: nowrap;
  }

  /* Variants */
  .share-btn.ghost {
    background: color-mix(in srgb, var(--page-text, #fff) 8%, transparent);
    color: color-mix(in srgb, var(--page-text, #fff) 85%, transparent);
  }
  .share-btn.ghost:hover {
    background: color-mix(in srgb, var(--page-text, #fff) 14%, transparent);
  }
  .share-btn.solid {
    background: var(--page-accent);
    color: var(--page-text);
  }
  .share-btn.solid:hover {
    background: color-mix(in srgb, var(--page-accent) 80%, white);
  }

  /* Sizes & Overrides */
  .share-btn.md {
    padding: 10px 16px;
    font-size: 14px;
    border-radius: 9px;
  }
  .share-btn.sm {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-dim, rgba(255, 255, 255, 0.7));
    border: 1px solid var(--border-soft, rgba(255, 255, 255, 0.12));
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 13px;
    gap: 6px;
  }
  .share-btn.sm:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .share-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 30;
    min-width: 160px;
    display: flex;
    flex-direction: column;
    padding: 6px;
    border-radius: 10px;
    background: #18181b;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }
  .share-item {
    display: flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 7px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.82);
    text-decoration: none;
    white-space: nowrap;
    transition: background 0.12s, color 0.12s;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    width: 100%;
    text-align: left;
  }
  .share-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .share-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    margin: 4px 6px;
  }
</style>
