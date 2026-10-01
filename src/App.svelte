<script>
  import './app.css';
  import {onMount} from 'svelte';
  import issues from '../issues.json';
  import {pretty} from './pretty.js';

  // Injected at build time by vite.config.js.
  const updated = __UPDATED__;

  const rows = issues.map((issue) => ({
    ...issue,
    pretty: pretty(issue.url),
    text: `${issue.title} ${pretty(issue.url)}`.toLowerCase(),
  }));

  // The controls only work with JS, so keep them disabled until hydrated.
  let hydrated = $state(false);
  onMount(() => {
    hydrated = true;
  });

  let query = $state('');
  let sortKey = $state('total_count');
  let sortOrder = $state('desc');

  const visible = $derived.by(() => {
    const terms = query.toLowerCase().split(/\s+/).filter((s) => s);
    const filtered = rows.filter((row) => terms.every((t) => row.text.includes(t)));
    const sign = sortOrder === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => sign * (a[sortKey] - b[sortKey]));
  });

  function sortBy(key) {
    if (sortKey === key) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortOrder = 'desc';
    }
  }

  function ariaSort(key) {
    if (sortKey !== key) {
      return 'none';
    }
    return sortOrder === 'asc' ? 'ascending' : 'descending';
  }
</script>

<header>
  <h1>SPEC REACTIONS</h1>
  <p>This is a list of spec issues with 10+ reactions in repositories from <a href="https://github.com/w3c/web-specs">web-specs</a>. Recent means reactions in the past 90 days. Feedback welcome on <a href="https://github.com/foolip/spec-reactions">GitHub</a>!</p>
</header>
<main>
  <table>
    <thead>
      <tr>
        {#each [['total_count', 'Total', 'Total number of reactions'], ['recent_count', 'Recent', 'Reactions in past 90 days']] as [key, label, title] (key)}
          <th class="count" {title} aria-sort={ariaSort(key)}>
            <button
              class={sortKey === key ? sortOrder : ''}
              disabled={!hydrated}
              onclick={() => sortBy(key)}>{label}</button>
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
        <tr>
          <td class="count">{issue.total_count}</td>
          <td class="count">{issue.recent_count}</td>
          <td class="title"><a href={issue.url}>{issue.title}</a> <span>({issue.pretty})</span></td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>
<footer>
  Last updated {updated}
</footer>
