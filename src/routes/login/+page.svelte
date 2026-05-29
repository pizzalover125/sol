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

<div>
  <h1>Welcome</h1>
  {#if error}<p>{error}</p>{/if}
  <input type="email" bind:value={email} placeholder="Email" />
  <input type="password" bind:value={password} placeholder="Password" />
  <button onclick={signIn} disabled={loading}>Sign In</button>
  <button onclick={signUp} disabled={loading}>Sign Up</button>
</div>