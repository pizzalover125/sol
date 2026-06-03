<script>
  import { fieldMeta } from '$lib/formFields'

  let {questions = []} = $props()
</script> 
{#each questions as q (q.id)}
  {@const meta = fieldMeta(q.type)}
  <div class="rf-field">
    {#if !meta.bool}
      <label class="rf-label" for={`q_${q.id}`}>
        {q.label}{#if q.required}<span class="rf-req">*</span>{/if}
      </label>
    {/if}
    {#if q.help && !meta.bool}<div class="rf-help">{q.help}</div>{/if}

    {#if q.type === 'textarea'}
      <textarea id={`q_${q.id}`} name={`q_${q.id}`} required={q.required}></textarea>
    {:else if q.type === 'select'}
      <select id={`q_${q.id}`} name={`q_${q.id}`} required={q.required}>
        <option value="" disabled selected>Select…</option>
        {#each q.options ?? [] as opt}
          <option value={opt}>{opt}</option>
        {/each}
      </select>
    {:else if q.type === 'radio'}
      <div class="rf-choices">
        {#each q.options ?? [] as opt, oi}
          <label class="rf-choice">
            <input type="radio" name={`q_${q.id}`} value={opt} required={q.required && oi === 0} />
            <span>{opt}</span>
          </label>
        {/each}
      </div>
    {:else if q.type === 'checkboxes'}
      <div class="rf-choices">
        {#each q.options ?? [] as opt}
          <label class="rf-choice">
            <input type="checkbox" name={`q_${q.id}`} value={opt} />
            <span>{opt}</span>
          </label>
        {/each}
      </div>
    {:else if q.type === 'checkbox'}
      <label class="rf-choice rf-single">
        <input type="checkbox" name={`q_${q.id}`} value="yes" required={q.required} />
        <span>{q.label}{#if q.required}<span class="rf-req">*</span>{/if}</span>
      </label>
      {#if q.help}<div class="rf-help">{q.help}</div>{/if}
    {:else}
      <input
        id={`q_${q.id}`}
        name={`q_${q.id}`}
        type={meta.value === 'email' ? 'email' : meta.value === 'phone' ? 'tel' : meta.value === 'number' ? 'number' : meta.value === 'date' ? 'date' : 'text'}
        required={q.required}
      />
    {/if}
  </div>
{/each}

<style>
  .rf-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .rf-label {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
  }
  .rf-req {
    color: #f5542d;
    margin-left: 2px;
  }
  .rf-help {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.45);
  }
  .rf-field :global(input),
  .rf-field :global(select),
  .rf-field :global(textarea) {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 9px 11px;
    font-size: 14px;
    color: #fff;
    font-family: inherit;
  }
  .rf-field :global(textarea) {
    min-height: 72px;
    resize: vertical;
  }
  .rf-field :global(input:focus),
  .rf-field :global(select:focus),
  .rf-field :global(textarea:focus) {
    outline: none;
    border-color: #f5542d;
  }
  .rf-field :global(input::placeholder) {
    color: rgba(255, 255, 255, 0.35);
  }
  .rf-choices {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 2px 0;
  }
  .rf-choice {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
  }
  .rf-choice :global(input) {
    width: 16px;
    height: 16px;
    padding: 0;
    accent-color: #f5542d;
    flex-shrink: 0;
  }
  .rf-single {
    align-items: flex-start;
  }
</style>