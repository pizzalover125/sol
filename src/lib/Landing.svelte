<script>
  // No complex logic needed for the ultra-minimal version
</script>

<div class="lp">
  <div class="center">
    <div class="logo-glow"></div>
    <h1 class="brand">sol</h1>
    <p class="description">A home for your events.</p>
    <div class="actions">
      <a href="/login" class="enter">Enter</a>
    </div>
  </div>
</div>

<style>
  .lp {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    overflow: hidden;
    position: relative;
  }

  .center {
    position: relative;
    text-align: center;
    z-index: 1;
  }

  .logo-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    pointer-events: none;
    z-index: -1;
  }

  .brand {
    font-size: clamp(4rem, 15vw, 8rem);
    font-weight: 700;
    letter-spacing: -0.06em;
    margin: 0;
    color: #fff;
    animation: rise 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .description {
    font-size: 16px;
    color: var(--text-dim);
    margin: 12px 0 0;
    font-weight: 400;
    letter-spacing: -0.01em;
    opacity: 0;
    animation: fadeIn 1s ease forwards;
    animation-delay: 0.3s;
  }

  .actions {
    margin-top: 24px;
    opacity: 0;
    animation: fadeIn 0.8s ease forwards;
    animation-delay: 0.5s;
  }

  .enter {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    transition: color 0.3s;
  }

  .enter:hover {
    color: #fff;
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
</style>
