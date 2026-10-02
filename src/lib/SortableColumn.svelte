<!--
  A sortable column header for use in SortableTable's `head` snippet.
  `value` maps a row to the value to sort by.
-->
<script>
  import {getSortContext} from './sort-context.js';

  let {key, value, title, width, children} = $props();

  const table = getSortContext();
  // A column's key is fixed, while `value` is looked up on each sort.
  // svelte-ignore state_referenced_locally
  table.register(key, (row) => value(row));

  const direction = $derived(table.sort === key ? table.order : null);
</script>

<th
  {title}
  style:width
  aria-sort={direction ? `${direction}ending` : 'none'}>
  <button
    class={direction}
    disabled={table.disabled}
    onclick={() => table.sortBy(key)}>{@render children()}</button>
</th>

<style>
  button {
    width: 100%;
    height: 2em;
    white-space: nowrap;
  }

  button:disabled {
    cursor: default;
  }

  .asc::after {
    content: ' ▲';
  }

  .desc::after {
    content: ' ▼';
  }
</style>
