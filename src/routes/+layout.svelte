<slot />

<style>
  :global(:root) {
    --bg: #0a0a0b;
    --accent: #f5542d;
    --accent-hover: #e0481f;
    --card: rgba(255, 255, 255, 0.02);
    --card-strong: rgba(255, 255, 255, 0.04);
    --border: rgba(255, 255, 255, 0.1);
    --border-soft: rgba(255, 255, 255, 0.08);
    --text: #fff;
    --text-dim: rgba(255, 255, 255, 0.82);
    --text-muted: rgba(255, 255, 255, 0.5);
    --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  }

  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    min-height: 100vh;
    background:
      radial-gradient(1200px 600px at 50% -10%, rgba(245, 84, 45, 0.13), transparent 60%),
      var(--bg);
    color: var(--text);
    font-family: var(--font);
    -webkit-font-smoothing: antialiased;
  }
</style>