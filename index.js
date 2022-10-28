import fs from 'node:fs/promises';
import specs from 'browser-specs' assert { type: "json" };
import Handlebars from 'handlebars';
import {Octokit} from '@octokit/rest';
import {throttling} from '@octokit/plugin-throttling';

// Minimum number of reactions to consider.
const MIN_REACTION_COUNT = 10;

// What to consider a recent reaction.
const RECENT_REACTION_DAYS = 90;

Handlebars.registerHelper('pretty', (url) => {
  if (!url.startsWith('https://github.com/')) {
    return url;
  }
  const parts = url.substring(19).split('/');
  if (parts.length !== 4) {
    return url;
  }
  return `${parts[0]}/${parts[1]}#${parts[3]}`;
});

const template = Handlebars.compile(`<!DOCTYPE html>
<meta charset="utf-8">
<title>🚀 spec reactions</title>
<style>
  @import "https://unpkg.com/open-props";
  @import "https://unpkg.com/open-props/normalize.min.css";
    
  td.total, td.recent {
    text-align: right;
  }
</style>
<script src="list.min.js" defer></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
  const list = new List('reactions', {
    valueNames: [ 'total', 'recent', 'title' ]
  });
  list.sort('total', { order: 'desc' });
});
</script>
<div id="reactions">
  <input class="search" placeholder="Filter">
  <button class="sort" data-sort="total">Sort by total</button>
  <button class="sort" data-sort="recent">Sort by recent</button>
  <table>
    <thead>
      <tr>
        <th title="Total number of reactions">Total</th>
        <th title="Reactions in past 90 days">Recent</th>
        <th>Issue</th>
      </tr>
    </thead>
    <tbody class="list">
    {{#each issues}}
      <tr>
        <td class="total">{{total_count}}</td>
        <td class="recent">{{recent_count}}</td>
        <td class="title"><a href="{{url}}">{{title}}</a> <span>({{pretty url}})</span></td>
      </tr>
    {{/each}}
    </tbody>
  </table>
</div>
`);

async function* iterateIssues(octokit, owner, repo) {
  for await (const response of octokit.paginate.iterator(
      octokit.rest.issues.listForRepo,
      {
        owner,
        repo,
        per_page: 100,
      },
  )) {
    for (const issue of response.data) {
      yield issue;
    }
  }
}

async function* iterateReactions(octokit, owner, repo, issue_number) {
  for await (const response of octokit.paginate.iterator(
    octokit.rest.reactions.listForIssue,
      {
        owner,
        repo,
        issue_number,
        per_page: 100,
      },
  )) {
    for (const reaction of response.data) {
      yield reaction;
    }
  }
}

async function main() {
  const recentSince = Date.now() - (RECENT_REACTION_DAYS * 24 * 3600 * 1000);

  const ThrottlingOctokit = Octokit.plugin(throttling);

  const octokit = new ThrottlingOctokit({
    auth: process.env.GITHUB_TOKEN,
    throttle: {
      onRateLimit: (retryAfter, options) => {
        console.log('');
        if (options.request.retryCount <= 2) {
          console.warn(`Rate limiting triggered, retrying after ${retryAfter} seconds!`);
          return true;
        } else {
          console.error(`Rate limiting triggered, not retrying again!`);
        }
      },
      onAbuseLimit: () => {
        console.error('Abuse limit triggered, not retrying!');
      },
    },
  });

  const repos = new Set();
  for (const spec of specs) {
    const repo = spec.nightly.repository;
    if (repo) {
      repos.add(repo);
    }
  }

  // Collect all issues into an array. This will be used to generate HTML/JSON.
  const issues = [];

  for (const repoURL of Array.from(repos).sort()) {
    const url = new URL(repoURL);
    if (url.hostname !== 'github.com') {
      continue;
    }
    const parts = url.pathname.split('/').filter((s) => s);
    if (parts.length !== 2) {
      continue;
    }

    const [owner, repo] = parts;
    for await (const issue of iterateIssues(octokit, owner, repo)) {
      const totalCount = issue.reactions.total_count;
      if (totalCount >= MIN_REACTION_COUNT) {
        let recentCount = 0;
        for await (const reaction of iterateReactions(octokit, owner, repo, issue.number)) {
          const createdAt = Date.parse(reaction.created_at);
          if (createdAt > recentSince) {
            recentCount++;
          }
        }
        const info = {
          total_count: totalCount,
          recent_count: recentCount,
          url: issue.html_url,
          title: issue.title,
        };
        // Log the issue URL to make it easier to see if the script is stuck.
        console.log(info.url);
        issues.push(info);
        if (issues.length == 10)break;
      }
    }
  }

  // Write HTML output.
  const html = template({issues});
  await fs.mkdir('dist', {recursive: true});
  await fs.writeFile('dist/index.html', html);
  await fs.copyFile('node_modules/list.js/dist/list.min.js', 'dist/list.min.js');
  await fs.copyFile('node_modules/list.js/dist/list.min.js.map', 'dist/list.min.js.map');

  // Write JSON output.
  const json = JSON.stringify(issues, null, '  ') + '\n';
  await fs.writeFile('dist/issues.json', json);
}

await main();
