<script>
  let { data } = $props()

  const { event } = data

  function formatEventDate(start, end) {
    const s = new Date(start)
    const e = new Date(end)
    const date = s.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    const startTime = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const endTime = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return `${date} · ${startTime} – ${endTime}`
  }
</script>

<main>
  {#if event.cover_image_url}
    <img src={event.cover_image_url} alt={event.name} />
  {/if}

  <h1>{event.name}</h1>
  <p>📅 {formatEventDate(event.start_time, event.end_time)}</p>
  {#if event.location}<p>📍 {event.location}</p>{/if}
  {#if event.max_attendees}<p>👥 {event.max_attendees} spots</p>{/if}
  {#if event.description}<p>{event.description}</p>{/if}
</main>