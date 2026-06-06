<script>
  function reveal(node) {
    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('in')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(node)
    return { destroy: () => io.disconnect() }
  }

  const features = [
    {
      title: 'Beautiful event pages',
      body: 'Add a cover image, a Markdown description, time and location. Every event gets a clean, shareable link.'
    },
    {
      title: 'Registration that just works',
      body: 'Open or close RSVPs whenever you like, cap attendance, and let guests register without an account.'
    },
    {
      title: 'Ask your own questions',
      body: 'Build a custom registration form for each event. Short text, choices, checkboxes, whatever you need.'
    },
    {
      title: 'Invite-only & calendars',
      body: 'Share a private join code, export your attendee list to CSV, and let people add the event to any calendar.'
    }
  ]
</script>

<div class="lp">
  <nav class="nav">
    <a class="brand" href="/">
      <span class="brand-mark" aria-hidden="true">●</span>
      <span class="brand-word">sol</span>
    </a>
    <div class="nav-actions">
      <a class="link-quiet" href="/login">Sign in</a>
      <a class="btn btn-primary" href="/login">Get started</a>
    </div>
  </nav>

  <header class="hero">
    <span class="eyebrow"><span class="dot" aria-hidden="true">●</span> A home for your events</span>
    <h1 class="title">Delightful events<br />start here.</h1>
    <p class="lede">
      Set up an event page, open registration and welcome your guests.
      Host a memorable event today — no fuss, all delight.
    </p>
    <div class="cta">
      <a class="btn btn-primary big" href="/login">Create an event</a>
      <a class="btn btn-ghost big" href="/login">Sign in</a>
    </div>
  </header>

  <section class="preview" use:reveal aria-hidden="true">
    <div class="event-card">
      <div class="cover"></div>
      <div class="card-body">
        <span class="bar bar-title"></span>
        <div class="meta">
          <span class="bar bar-sm"></span>
          <span class="bar bar-sm"></span>
        </div>
        <div class="card-foot">
          <span class="mock-btn">Register</span>
          <span class="bar bar-xs"></span>
        </div>
      </div>
    </div>
  </section>

  <section class="features" use:reveal>
    <h2 class="sec-title">Everything you need to gather people.</h2>
    <div class="grid">
      {#each features as f, i}
        <article class="feature" style="--i:{i}">
          <h3>{f.title}</h3>
          <p>{f.body}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="final" use:reveal>
    <h2>Host a memorable event today.</h2>
    <p>It only takes a minute to get started.</p>
    <a class="btn btn-primary big" href="/login">Create your first event</a>
  </section>

  <footer class="foot">
    <a class="brand" href="/">
      <span class="brand-mark" aria-hidden="true">●</span>
      <span class="brand-word">sol</span>
    </a>
    <a class="link-quiet" href="/login">Sign in</a>
  </footer>
</div>

<style>
  .lp {
    color: var(--text);
    font-family: var(--font);
    letter-spacing: -0.01em;
  }
  .lp a { color: inherit; text-decoration: none; }

  .nav {
    max-width: 1080px;
    margin: 0 auto;
    padding: 22px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 9px;
  }
  .brand-mark {
    color: var(--accent);
    font-size: 16px;
    line-height: 1;
  }
  .brand-word {
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.03em;
  }
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .link-quiet {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-muted);
    transition: color 0.15s;
  }
  .link-quiet:hover { color: var(--text); }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 9px;
    padding: 9px 16px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .btn.big { padding: 12px 22px; font-size: 15px; }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: var(--accent-hover); }
  .btn-ghost {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-dim);
    border-color: var(--border-soft);
  }
  .btn-ghost:hover { background: rgba(255, 255, 255, 0.1); color: var(--text); }

  .hero {
    max-width: 760px;
    margin: 0 auto;
    padding: 72px 24px 0;
    text-align: center;
  }
  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border: 1px solid var(--border-soft);
    border-radius: 999px;
    background: var(--card);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
  }
  .eyebrow .dot { color: var(--accent); font-size: 9px; }
  .title {
    margin: 24px 0 0;
    font-size: clamp(2.4rem, 7vw, 3.6rem);
    line-height: 1.04;
    font-weight: 700;
    letter-spacing: -0.035em;
  }
  .lede {
    max-width: 500px;
    margin: 20px auto 0;
    font-size: clamp(1rem, 2vw, 1.15rem);
    line-height: 1.55;
    color: var(--text-muted);
  }
  .cta {
    margin-top: 30px;
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .preview {
    max-width: 1080px;
    margin: 64px auto 0;
    padding: 0 24px;
    display: flex;
    justify-content: center;
  }
  .event-card {
    width: min(420px, 100%);
    border: 1px solid var(--border);
    border-radius: 16px;
    background: var(--card-strong);
    overflow: hidden;
  }
  .cover {
    height: 168px;
    background:
      radial-gradient(120% 140% at 15% 10%, rgba(245, 84, 45, 0.55), transparent 55%),
      radial-gradient(120% 140% at 90% 90%, rgba(245, 84, 45, 0.22), transparent 55%),
      #141416;
  }
  .card-body { padding: 20px; }
  .bar {
    display: block;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.09);
  }
  .bar-title { height: 16px; width: 70%; }
  .meta {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .bar-sm { height: 10px; width: 55%; }
  .meta .bar-sm:last-child { width: 40%; }
  .card-foot {
    margin-top: 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }
  .mock-btn {
    padding: 9px 18px;
    border-radius: 9px;
    background: var(--accent);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
  }
  .bar-xs { height: 10px; width: 84px; }

  .features {
    max-width: 1080px;
    margin: 120px auto 0;
    padding: 0 24px;
  }
  .sec-title {
    margin: 0;
    text-align: center;
    font-size: clamp(1.6rem, 4vw, 2.2rem);
    font-weight: 700;
    letter-spacing: -0.03em;
  }
  .grid {
    margin-top: 44px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  .feature {
    padding: 24px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--card);
    transition: border-color 0.15s, background 0.15s;
  }
  .feature:hover {
    border-color: rgba(255, 255, 255, 0.18);
    background: var(--card-strong);
  }
  .feature h3 {
    margin: 0 0 8px;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .feature p {
    margin: 0;
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-muted);
  }

  .final {
    max-width: 760px;
    margin: 120px auto 0;
    padding: 0 24px;
    text-align: center;
  }
  .final h2 {
    margin: 0;
    font-size: clamp(1.9rem, 5vw, 2.8rem);
    font-weight: 700;
    letter-spacing: -0.035em;
  }
  .final p {
    margin: 16px auto 28px;
    font-size: 16px;
    color: var(--text-muted);
  }

  .foot {
    max-width: 1080px;
    margin: 110px auto 0;
    padding: 28px 24px 48px;
    border-top: 1px solid var(--border-soft);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .hero .eyebrow,
  .hero .title,
  .hero .lede,
  .hero .cta {
    animation: rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
  }
  .hero .title { animation-delay: 0.06s; }
  .hero .lede { animation-delay: 0.12s; }
  .hero .cta { animation-delay: 0.18s; }
  @keyframes rise { from { opacity: 0; transform: translateY(16px); } }

  .preview,
  .features,
  .final {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s cubic-bezier(0.2, 0.7, 0.2, 1), transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .preview:global(.in),
  .features:global(.in),
  .final:global(.in) {
    opacity: 1;
    transform: none;
  }
  .features .feature {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.5s ease, transform 0.5s ease;
    transition-delay: calc(var(--i) * 70ms);
  }
  .features:global(.in) .feature { opacity: 1; transform: none; }

  @media (prefers-reduced-motion: reduce) {
    .lp :global(*) { animation: none !important; transition: none !important; }
    .preview, .features, .final, .feature { opacity: 1 !important; transform: none !important; }
  }

  @media (max-width: 560px) {
    .grid { grid-template-columns: 1fr; }
    .hero { padding-top: 52px; }
  }
</style>