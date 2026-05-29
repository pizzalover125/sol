trallelo tralalal
<script>
  import { supabase } from '$lib/supabase'
  import { goto } from '$app/navigation'

  let mode = $state('signin') 
  let email = $state('')
  let password = $state('')
  let firstName = $state('')
  let lastName = $state('')
  let avatarUrl = $state('')
  let error = $state('')
  let loading = $state(false)

  async function signIn() {
    loading = true
    const { error: e } = await supabase.auth.signInWithPassword({ email, password })
    if (e) { error = e.message; loading = false }
    else goto('/')
  }

  async function signUp() {
    if (!firstName.trim() || !lastName.trim()) {
      error = 'First and last name are required.'
      return
    }
    loading = true
    const { error: e } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          avatar_url: avatarUrl.trim()
        }
      }
    })
    if (e) { error = e.message; loading = false }
    else goto('/')
  }

  function submit() {
    error = ''
    mode === 'signin' ? signIn() : signUp()
  }

  function toggleMode() {
    error = ''
    mode = mode === 'signin' ? 'signup' : 'signin'
  }
</script>

<div class="auth-page">
  <div class="auth-card">
    <div class="logo">●</div>
    <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
    <p class="sub">
      {mode === 'signin'
        ? 'Sign in to manage your events.'
        : 'Tell us a little about yourself to get started.'}
    </p>

    {#if error}<div class="error">{error}</div>{/if}

    {#if mode === 'signup'}
      <div class="row">
        <input type="text" bind:value={firstName} placeholder="First name" />
        <input type="text" bind:value={lastName} placeholder="Last name" />
      </div>
    {/if}

    <input type="email" bind:value={email} placeholder="Email" />
    <input type="password" bind:value={password} placeholder="Password" />

    {#if mode === 'signup'}
      <input type="url" bind:value={avatarUrl} placeholder="Profile picture URL (optional)" />
      <p class="hint">Leave blank and we'll generate an avatar from your initials.</p>
    {/if}

    <button class="primary" onclick={submit} disabled={loading}>
      {loading ? 'Loading…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
    </button>

    <button class="text-btn" onclick={toggleMode}>
      {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
      <span>{mode === 'signin' ? 'Sign Up' : 'Sign In'}</span>
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
    font-size: 22px;
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
  .row {
    display: flex;
    gap: 10px;
  }
  .row input {
    flex: 1;
    min-width: 0;
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
  .hint {
    font-size: 12px;
    color: var(--text-muted);
    margin: -6px 0 0;
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

