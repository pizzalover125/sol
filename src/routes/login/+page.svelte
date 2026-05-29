<script>
  import { supabase } from '$lib/supabase'
  import { goto } from '$app/navigation'

  let email = $state('')
  let password = $state('')
  let error = $state('')
  let loading = $state(false)

  async function signIn() {
    loading = true
    const { error: e } = await supabase.auth.signInWithPassword({ email, password })
    if (e) { error = e.message; loading = false }
    else goto('/')
  }

  async function signUp() {
    loading = true
    const { error: e } = await supabase.auth.signUp({ email, password })
    if (e) { error = e.message; loading = false }
    else goto('/')
  }
</script>

<div class="auth-page">
  <div class="auth-card">
    <div class="logo">●</div>
    <h1>Welcome</h1>
    <p class="sub">Sign in or create an account to manage your events.</p>

    {#if error}<div class="error">{error}</div>{/if}

    <input type="email" bind:value={email} placeholder="Email" />
    <input type="password" bind:value={password} placeholder="Password" />

    <button class="primary" onclick={signIn} disabled={loading}>
      {loading ? 'Loading…' : 'Sign In'}
    </button>
    <button class="text-btn" onclick={signUp} disabled={loading}>
      Don't have an account? <span>Sign Up</span>
    </button>
  </div>
</div>

<style>
  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .auth-card {
    width: 100%;
    max-width: 380px;
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 32px;
    background: var(--card);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .logo {
    font-size: 22px;
    color: var(--accent);
    text-align: center;
  }
  h1 {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.02em;
    text-align: center;
    margin: 0;
  }
  .sub {
    font-size: 14px;
    color: var(--text-muted);
    text-align: center;
    margin: 0 0 8px;
  }
  input {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 11px 13px;
    color: #fff;
    font-size: 14px;
    font-family: inherit;
  }
  input:focus {
    outline: none;
    border-color: var(--accent);
  }
  input::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }
  .primary {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 9px;
    padding: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .primary:hover:not(:disabled) {
    background: var(--accent-hover);
  }
  .primary:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .text-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 14px;
    cursor: pointer;
    margin-top: 2px;
  }
  .text-btn span {
    color: var(--accent);
    font-weight: 600;
  }
  .error {
    background: rgba(245, 84, 45, 0.12);
    border: 1px solid rgba(245, 84, 45, 0.4);
    color: #ffb3a0;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 14px;
  }
</style>