<svelte:head>
  <title>sol</title>
</svelte:head>

<slot />

<style>
  :global(:root) {
    --bg: #000000;
    --accent: #ffffff;
    --accent-hover: #f4f4f5;
    --card: rgba(255, 255, 255, 0.03);
    --card-strong: rgba(255, 255, 255, 0.06);
    --border: rgba(255, 255, 255, 0.1);
    --border-soft: rgba(255, 255, 255, 0.05);
    --text: #ffffff;
    --text-dim: #a1a1aa;
    --text-muted: #71717a;
    --font: 'Kumbh Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  :global(*) {
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :global(body) {
    margin: 0;
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    overflow-x: hidden;
  }

  :global(body::before) {
    content: '';
    position: fixed;
    top: -10%;
    left: 50%;
    transform: translateX(-50%);
    width: 100vw;
    height: 60vh;
    background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
    pointer-events: none;
    z-index: -1;
  }
</style>
