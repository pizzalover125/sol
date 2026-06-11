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
        emailRedirectTo: window.location.origin,
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

<svelte:head>
  <title>{mode === 'signin' ? 'Sign In' : 'Sign Up'} · sol</title>
</svelte:head>

<div class="auth-page">
  <div class="auth-card">
    <div class="logo-wrap">
      <img src="https://cdn.hackclub.com/019eb281-d75b-7e9b-9fef-14a777c3b4b8/sol.svg" alt="sol" class="logo" />
    </div>
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
    border: 1px solid var(--border-soft);
    border-radius: 4px;
    padding: 40px 32px;
    background: rgba(255, 255, 255, 0.02);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .logo-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 8px;
  }
  .logo {
    width: 32px;
    height: 32px;
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
  }
  h1 {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.04em;
    text-align: center;
    margin: 0;
    color: #fff;
  }
  .sub {
    font-size: 14px;
    color: var(--text-dim);
    text-align: center;
    margin: 0 0 12px;
    line-height: 1.5;
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
    border: 1px solid var(--border-soft);
    border-radius: 4px;
    padding: 12px 14px;
    color: #fff;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s;
  }
  input:focus {
    outline: none;
    border-color: var(--border);
    background: rgba(255, 255, 255, 0.05);
  }
  input::placeholder {
    color: var(--text-muted);
  }
  .hint {
    font-size: 12px;
    color: var(--text-muted);
    margin: -6px 0 0;
  }
  .primary {
    background: #fff;
    color: #000;
    border: none;
    border-radius: 4px;
    padding: 13px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s;
    margin-top: 8px;
  }
  .primary:hover:not(:disabled) {
    transform: scale(1.02);
  }
  .primary:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .text-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 14px;
    cursor: pointer;
    margin-top: 4px;
    transition: color 0.15s;
  }
  .text-btn:hover {
    color: var(--text-dim);
  }
  .text-btn span {
    color: #fff;
    font-weight: 600;
  }
  .error {
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.2);
    color: #ff4444;
    padding: 12px 14px;
    border-radius: 4px;
    font-size: 13px;
    text-align: center;
  }
</style>

