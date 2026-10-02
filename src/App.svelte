<script>
  import './app.css';
  import {onMount} from 'svelte';
  import issues from '../issues.json';
  import BarCell from './lib/BarCell.svelte';
  import RepoFilter from './lib/RepoFilter.svelte';
  import SortableColumn from './lib/SortableColumn.svelte';
  import SortableTable from './lib/SortableTable.svelte';
  import {parseIssueURL} from './lib/issue-url.js';

  // Injected at build time by vite.config.js.
  const updated = __UPDATED__;

  // Sorted by total so that ties in other columns are broken by total.
  const rows = issues
      .map((issue) => {
        const {repo, name} = parseIssueURL(issue.url);
        return {...issue, repo, name, text: `${issue.title} ${name}`.toLowerCase()};
      })
      .sort((a, b) => b.total_count - a.total_count);

  const maxTotal = Math.max(1, ...rows.map((row) => row.total_count));
  const maxRecent = Math.max(1, ...rows.map((row) => row.recent_count));

  // [repo, issue count] pairs, most issues first.
  const repos = Object.entries(Object.groupBy(rows.filter((row) => row.repo), (row) => row.repo))
      .map(([repo, list]) => [repo, list.length])
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const sortKeys = ['total', 'recent'];

  // The controls only work with JS, so keep them disabled until hydrated.
  let hydrated = $state(false);
  // No animation for the initial state from the URL, or for reduced motion.
  let flipDuration = $state(0);

  let query = $state('');
  let repo = $state('');
  let sort = $state('total');
  let order = $state('desc');

  const visible = $derived.by(() => {
    const terms = query.toLowerCase().split(/\s+/).filter((s) => s);
    return rows.filter((row) =>
      (!repo || row.repo === repo) && terms.every((t) => row.text.includes(t)));
  });

  const filtered = $derived(query !== '' || repo !== '');

  onMount(() => {
    const params = new URLSearchParams(location.search);
    query = params.get('q') ?? '';
    if (repos.some(([name]) => name === params.get('repo'))) {
      repo = params.get('repo');
    }
    if (sortKeys.includes(params.get('sort'))) {
      sort = params.get('sort');
    }
    if (params.get('order') === 'asc') {
      order = 'asc';
    }
    hydrated = true;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      flipDuration = 250;
    }
  });

  // Keep the URL in sync so that filtered views can be shared.
  $effect(() => {
    if (!hydrated) {
      return;
    }
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (repo) params.set('repo', repo);
    if (sort !== 'total') params.set('sort', sort);
    if (order !== 'desc') params.set('order', order);
    const search = params.size ? `?${params}`.replaceAll('%2F', '/') : '';
    history.replaceState(null, '', location.pathname + search);
  });

  function clearFilters() {
    query = '';
    repo = '';
  }
</script>

<header>
  <h1>SPEC REACTIONS</h1>
  <p>This is a list of spec issues with 10+ reactions in repositories from <a href="https://github.com/w3c/web-specs">web-specs</a>. Recent means reactions in the past 90 days. Feedback welcome on <a href="https://github.com/foolip/spec-reactions">GitHub</a>!</p>
</header>
<main>
  <RepoFilter {repos} bind:selected={repo} disabled={!hydrated} />
  <p class="status" aria-live="polite">
    {#if filtered}
      {visible.length} of {rows.length} issues
      <button onclick={clearFilters}>Clear filters</button>
    {:else}
      {rows.length} issues
    {/if}
  </p>
  <SortableTable
    rows={visible}
    key={(issue) => issue.url}
    bind:sort
    bind:order
    disabled={!hydrated}
    {flipDuration}>
    {#snippet head()}
      <SortableColumn key="total" value={(issue) => issue.total_count} title="Total number of reactions" width="9ch">Total</SortableColumn>
      <SortableColumn key="recent" value={(issue) => issue.recent_count} title="Reactions in past 90 days" width="9ch">Recent</SortableColumn>
      <th>
        <input
          type="search"
          placeholder="Filter issues by typing here"
          aria-label="Filter issues"
          disabled={!hydrated}
          bind:value={query}>
      </th>
    {/snippet}
    {#snippet row(issue)}
      <BarCell value={issue.total_count} max={maxTotal} />
      <BarCell value={issue.recent_count} max={maxRecent} />
      <td class="title"><a href={issue.url}>{issue.title}</a> <span>({issue.name})</span></td>
    {/snippet}
    {#snippet empty()}
      <td class="empty" colspan="3">No issues match.</td>
    {/snippet}
  </SortableTable>
</main>
<footer>
  Last updated {updated}
</footer>

<style>
  .status {
    display: flex;
    align-items: center;
    gap: var(--size-3);
    margin-block: var(--size-3);
    color: var(--text-2);
  }

  .status button {
    padding: var(--size-1) var(--size-3);
    border: var(--border-size-1) solid var(--surface-4);
    border-radius: var(--radius-round);
    background: var(--surface-1);
    color: var(--text-1);
    font-size: var(--font-size-0);
  }

  .status button:hover {
    background: var(--surface-3);
  }

  input {
    width: 100%;
    height: 2em;
    font-weight: normal;
  }

  .title {
    text-align: left;
    max-inline-size: none;
    overflow-wrap: anywhere;
  }

  .title span {
    color: var(--text-2);
  }

  .empty {
    text-align: center;
    padding: var(--size-5);
    color: var(--text-2);
  }
</style>
