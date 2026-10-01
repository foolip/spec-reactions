<script>
  import './app.css';
  import {onMount} from 'svelte';
  import {flip} from 'svelte/animate';
  import issues from '../issues.json';
  import {parseIssueURL} from './issue-url.js';

  // Injected at build time by vite.config.js.
  const updated = __UPDATED__;

  const rows = issues.map((issue) => {
    const {repo, name} = parseIssueURL(issue.url);
    return {...issue, repo, name, text: `${issue.title} ${name}`.toLowerCase()};
  });

  const maxTotal = Math.max(1, ...rows.map((row) => row.total_count));
  const maxRecent = Math.max(1, ...rows.map((row) => row.recent_count));

  // [repo, issue count] pairs, most issues first.
  const repos = Object.entries(Object.groupBy(rows.filter((row) => row.repo), (row) => row.repo))
      .map(([repo, list]) => [repo, list.length])
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  // Show only the repos with the most issues until expanded.
  const TOP_REPOS = 12;

  const columns = [
    {key: 'total', field: 'total_count', label: 'Total', title: 'Total number of reactions', max: maxTotal},
    {key: 'recent', field: 'recent_count', label: 'Recent', title: 'Reactions in past 90 days', max: maxRecent},
  ];

  // The controls only work with JS, so keep them disabled until hydrated.
  let hydrated = $state(false);
  // No animation for the initial state from the URL, or for reduced motion.
  let flipDuration = $state(0);

  let showAllRepos = $state(false);
  let query = $state('');
  let repo = $state('');
  let sort = $state('total');
  let order = $state('desc');

  const visible = $derived.by(() => {
    const terms = query.toLowerCase().split(/\s+/).filter((s) => s);
    const field = columns.find((c) => c.key === sort).field;
    const sign = order === 'asc' ? 1 : -1;
    return rows
        .filter((row) => !repo || row.repo === repo)
        .filter((row) => terms.every((t) => row.text.includes(t)))
        .sort((a, b) => sign * (a[field] - b[field]) || b.total_count - a.total_count);
  });

  const filtered = $derived(query !== '' || repo !== '');

  // Always include the selected repo, even if it's not in the top.
  const shownRepos = $derived(showAllRepos ? repos :
      repos.filter(([name], i) => i < TOP_REPOS || name === repo));

  onMount(() => {
    const params = new URLSearchParams(location.search);
    query = params.get('q') ?? '';
    if (repos.some(([name]) => name === params.get('repo'))) {
      repo = params.get('repo');
    }
    if (columns.some((c) => c.key === params.get('sort'))) {
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

  function sortBy(key) {
    if (sort === key) {
      order = order === 'asc' ? 'desc' : 'asc';
    } else {
      sort = key;
      order = 'desc';
    }
  }

  function ariaSort(key) {
    if (sort !== key) {
      return 'none';
    }
    return order === 'asc' ? 'ascending' : 'descending';
  }

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
  <div class="repos" role="group" aria-label="Filter by repository">
    {#each shownRepos as [name, count] (name)}
      <button
        class="chip"
        aria-pressed={repo === name}
        disabled={!hydrated}
        onclick={() => (repo = repo === name ? '' : name)}>{name} <span class="chip-count">{count}</span></button>
    {/each}
    {#if repos.length > TOP_REPOS}
      <button class="chip more" disabled={!hydrated} onclick={() => (showAllRepos = !showAllRepos)}>
        {showAllRepos ? 'Fewer' : `+${repos.length - TOP_REPOS} more`}
      </button>
    {/if}
  </div>
  <p class="status" aria-live="polite">
    {#if filtered}
      {visible.length} of {rows.length} issues
      <button class="clear" onclick={clearFilters}>Clear filters</button>
    {:else}
      {rows.length} issues
    {/if}
  </p>
  <table>
    <thead>
      <tr>
        {#each columns as column (column.key)}
          <th class="count" title={column.title} aria-sort={ariaSort(column.key)}>
            <button
              class={sort === column.key ? order : ''}
              disabled={!hydrated}
              onclick={() => sortBy(column.key)}>{column.label}</button>
          </th>
        {/each}
        <th>
          <input
            type="search"
            placeholder="Filter issues by typing here"
            aria-label="Filter issues"
            disabled={!hydrated}
            bind:value={query}>
        </th>
      </tr>
    </thead>
    <tbody>
      {#each visible as issue (issue.url)}
        <tr animate:flip={{duration: flipDuration}}>
          {#each columns as column (column.key)}
            <td class="count" style:--pct="{(issue[column.field] / column.max) * 100}%">{issue[column.field]}</td>
          {/each}
          <td class="title"><a href={issue.url}>{issue.title}</a> <span class="name">({issue.name})</span></td>
        </tr>
      {:else}
        <tr>
          <td class="empty" colspan="3">No issues match.</td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>
<footer>
  Last updated {updated}
</footer>
