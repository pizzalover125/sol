<script>
  let { firstName = '', lastName = '', url = '', size = 32 } = $props()

  const palette = [
    '#f5542d', '#e0481f', '#d98324', '#2d9d78', '#2d7df5',
    '#7c5cf5', '#c13fa8', '#3fa8c1', '#5c8a2d', '#c1453f'
  ]

  const initials = ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase()

  function colorFor(seed) {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }
    return palette[Math.abs(hash) % palette.length]
  }

  const bg = colorFor(firstName + lastName)
</script>

{#if url}
  <img class="avatar" src={url} alt={initials} style="width:{size}px;height:{size}px;" />
{:else}
  <div
    class="avatar fallback"
    style="width:{size}px;height:{size}px;background:{bg};font-size:{size * 0.42}px;"
  >
    {initials}
  </div>
{/if}

<style>
  .avatar {
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    object-fit: cover;
  }
  .fallback {
    color: #fff;
    font-weight: 600;
    font-family: inherit;
  }
</style>
