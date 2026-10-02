<!--
  A table whose rows can be sorted by clicking SortableColumn headers.

  <SortableTable rows={items} key={(item) => item.id} bind:sort bind:order>
    {#snippet head()}
      <SortableColumn key="size" value={(item) => item.size}>Size</SortableColumn>
      <th>Name</th>
    {/snippet}
    {#snippet row(item)}
      <td>{item.size}</td>
      <td>{item.name}</td>
    {/snippet}
  </SortableTable>

  Rows that compare equal keep their order from `rows`.
-->
<script>
  import {flip} from 'svelte/animate';
  import {setSortContext} from './sort-context.js';

  let {
    rows,
    key,
    sort = $bindable(),
    order = $bindable('desc'),
    disabled = false,
    flipDuration = 0,
    head,
    row,
    empty,
  } = $props();

  // Filled in by each SortableColumn as the header renders, which happens
  // before the body, both on the server and when hydrating.
  const accessors = new Map();

  setSortContext({
    get sort() {
      return sort;
    },
    get order() {
      return order;
    },
    get disabled() {
      return disabled;
    },
    register(key, accessor) {
      accessors.set(key, accessor);
    },
    sortBy(key) {
      if (sort === key) {
        order = order === 'asc' ? 'desc' : 'asc';
      } else {
        sort = key;
        order = 'desc';
      }
    },
  });

  function compare(a, b) {
    return (a > b) - (a < b);
  }

  const sorted = $derived.by(() => {
    const accessor = accessors.get(sort);
    if (!accessor) {
      return rows;
    }
    const sign = order === 'asc' ? 1 : -1;
    return rows.toSorted((a, b) => sign * compare(accessor(a), accessor(b)));
  });
</script>

<table>
  <thead>
    <tr>{@render head()}</tr>
  </thead>
  <tbody>
    {#each sorted as item (key(item))}
      <tr animate:flip={{duration: flipDuration}}>{@render row(item)}</tr>
    {:else}
      {#if empty}
        <tr>{@render empty()}</tr>
      {/if}
    {/each}
  </tbody>
</table>

<style>
  table {
    width: 100%;
    /* Column widths come from the header, so long cells wrap instead of
       making the table wider than the screen. */
    table-layout: fixed;
  }

  thead :global(th) {
    text-align: left;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tbody :global(td) {
    padding-left: var(--size-fluid-1);
  }
</style>
