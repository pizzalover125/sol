<script>
  import { FIELD_TYPES, fieldMeta, blankQuestion } from '$lib/formFields'

  let { initial = [], name = 'registration_questions' } = $props()

  let questions = $state(
    (Array.isArray(initial) ? initial : []).map((q) => ({
      options: [],
      help: '',
      ...q,
    }))
  )

  let adding = $state(false)

  const serialized = $derived(JSON.stringify(questions))

  function addQuestion(type) {
    questions.push(blankQuestion(type))
    adding = false
  }
  function removeQuestion(i) {
    questions.splice(i, 1)
  }
  function move(i, dir) {
    const j = i + dir
    if (j < 0 || j >= questions.length) return
    ;[questions[i], questions[j]] = [questions[j], questions[i]]
  }
  function changeType(q, type) {
    q.type = type
    const meta = fieldMeta(type)
    if (meta.choice && (!q.options || q.options.length === 0)) {
      q.options = ['Option 1', 'Option 2']
    }
  }
  function addOption(q) {
    ;(q.options ??= []).push(`Option ${q.options.length + 1}`)
  }
  function removeOption(q, idx) {
    q.options.splice(idx, 1)
  }
</script>

<input type="hidden" {name} value={serialized} />

<div class="fb">
  <div class="fb-head">
    <span class="fb-title">Registration Form</span>
    <span class="fb-sub">Custom questions registrants answer when they RSVP</span>
  </div>

  {#each questions as q, i (q.id)}
    {@const meta = fieldMeta(q.type)}
    <div class="q-card">
      <div class="q-grip">
        <button type="button" class="q-icon" title="Move up" onclick={() => move(i, -1)} disabled={i === 0}>↑</button>
        <button type="button" class="q-icon" title="Move down" onclick={() => move(i, 1)} disabled={i === questions.length - 1}>↓</button>
      </div>

      <div class="q-body">
        <div class="q-row">
          <input
            class="q-label"
            placeholder="Question label"
            bind:value={q.label}
          />
          <select class="q-type" value={q.type} onchange={(e) => changeType(q, e.currentTarget.value)}>
            {#each FIELD_TYPES as t}
              <option value={t.value}>{t.label}</option>
            {/each}
          </select>
        </div>

        <input class="q-help" placeholder="Help text (optional)" bind:value={q.help} />

        {#if meta.choice}
          <div class="q-options">
            {#each q.options ?? [] as _, oi}
              <div class="opt-row">
                <span class="opt-bullet">{meta.multi ? '☐' : '○'}</span>
                <input class="opt-input" bind:value={q.options[oi]} placeholder={`Option ${oi + 1}`} />
                <button type="button" class="opt-del" title="Remove option" onclick={() => removeOption(q, oi)} disabled={q.options.length <= 1}>×</button>
              </div>
            {/each}
            <button type="button" class="opt-add" onclick={() => addOption(q)}>+ Add option</button>
          </div>
        {/if}

        <div class="q-foot">
          <label class="q-required">
            <input type="checkbox" bind:checked={q.required} />
            Required
          </label>
          <button type="button" class="q-remove" onclick={() => removeQuestion(i)}>Delete</button>
        </div>
      </div>
    </div>
  {/each}

  {#if adding}
    <div class="type-picker">
      {#each FIELD_TYPES as t}
        <button type="button" class="type-opt" onclick={() => addQuestion(t.value)}>
          <span class="type-icon">{t.icon}</span>
          {t.label}
        </button>
      {/each}
      <button type="button" class="type-cancel" onclick={() => (adding = false)}>Cancel</button>
    </div>
  {:else}
    <button type="button" class="fb-add" onclick={() => (adding = true)}>+ Add question</button>
  {/if}
</div>

<style>
  .fb {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 1px dashed var(--border);
    border-radius: 12px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.015);
  }
  .fb-head {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .fb-title {
    font-size: 14px;
    font-weight: 600;
  }
  .fb-sub {
    font-size: 12px;
    color: var(--text-muted);
  }

  .q-card {
    display: flex;
    gap: 10px;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.02);
  }
  .q-grip {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .q-icon {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-soft);
    color: var(--text-muted);
    border-radius: 6px;
    width: 24px;
    height: 22px;
    font-size: 12px;
    cursor: pointer;
    line-height: 1;
  }
  .q-icon:hover:not(:disabled) {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
  .q-icon:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .q-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .q-row {
    display: flex;
    gap: 8px;
  }
  .q-label {
    flex: 1;
    min-width: 0;
  }
  .q-type {
    flex-shrink: 0;
    width: 150px;
  }
  .fb input:not([type='checkbox']),
  .fb select {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 10px;
    color: #fff;
    font-size: 13px;
    font-family: inherit;
  }
  .fb input:focus,
  .fb select:focus {
    outline: none;
    border-color: var(--accent);
  }
  .fb select {
    cursor: pointer;
  }

  .q-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-left: 4px;
  }
  .opt-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .opt-bullet {
    color: var(--text-muted);
    font-size: 13px;
    width: 14px;
    text-align: center;
  }
  .opt-input {
    flex: 1;
    min-width: 0;
  }
  .opt-del {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 18px;
    cursor: pointer;
    line-height: 1;
    padding: 0 4px;
  }
  .opt-del:hover:not(:disabled) {
    color: #ff8b6f;
  }
  .opt-del:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .opt-add {
    align-self: flex-start;
    background: none;
    border: none;
    color: var(--accent);
    font-size: 12px;
    cursor: pointer;
    padding: 2px 0;
  }
  .opt-add:hover {
    text-decoration: underline;
  }

  .q-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2px;
  }
  .q-required {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-dim);
    cursor: pointer;
  }
  .q-required input {
    width: 15px;
    height: 15px;
    accent-color: var(--accent);
  }
  .q-remove {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
  }
  .q-remove:hover {
    color: #ff8b6f;
  }

  .fb-add {
    align-self: flex-start;
    background: rgba(245, 84, 45, 0.1);
    border: 1px solid rgba(245, 84, 45, 0.25);
    color: var(--accent);
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .fb-add:hover {
    background: rgba(245, 84, 45, 0.16);
  }

  .type-picker {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.02);
  }
  .type-opt {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-soft);
    color: var(--text-dim);
    border-radius: 8px;
    padding: 9px 11px;
    font-size: 13px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
  }
  .type-opt:hover {
    border-color: var(--accent);
    color: #fff;
  }
  .type-icon {
    width: 18px;
    text-align: center;
    color: var(--accent);
  }
  .type-cancel {
    grid-column: 1 / -1;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
    padding: 4px;
  }
  .type-cancel:hover {
    color: #fff;
  }
</style>

