<!--
  Toggle chips for picking one repo. Only the `top` repos are shown until
  expanded, plus the selected one if it isn't among them.
-->
<script>
  let {repos, selected = $bindable(''), disabled = false, top = 12} = $props();

  let expanded = $state(false);

  const shown = $derived(expanded ? repos :
      repos.filter(([name], i) => i < top || name === selected));
</script>

<div role="group" aria-label="Filter by repository">
  {#each shown as [name, count] (name)}
    <button
      aria-pressed={selected === name}
      {disabled}
      onclick={() => (selected = selected === name ? '' : name)}>{name} <span>{count}</span></button>
  {/each}
  {#if repos.length > top}
    <button class="more" {disabled} onclick={() => (expanded = !expanded)}>
      {expanded ? 'Fewer' : `+${repos.length - top} more`}
    </button>
  {/if}
</div>

<style>
  div {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-2);
  }

  button {
    padding: var(--size-1) var(--size-3);
    border: var(--border-size-1) solid var(--surface-4);
    border-radius: var(--radius-round);
    background: var(--surface-1);
    color: var(--text-1);
    font-size: var(--font-size-0);
  }

  button:enabled:hover {
    background: var(--surface-3);
  }

  button:disabled {
    cursor: default;
  }

  [aria-pressed="true"] {
    border-color: var(--yellow-6);
    background: var(--yellow-5);
    color: var(--gray-9);
  }

  .more {
    border-style: dashed;
  }

  span {
    color: var(--text-2);
    font-variant-numeric: tabular-nums;
  }

  [aria-pressed="true"] span {
    color: inherit;
  }
</style>
