import specs from 'browser-specs' assert { type: "json" };
import {Octokit} from '@octokit/rest';
import {throttling} from '@octokit/plugin-throttling';

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

async function main() {
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

  console.log('reactions,issue');

  for (const repo of Array.from(repos).sort()) {
    const url = new URL(repo);
    if (url.hostname !== 'github.com') {
      continue;
    }
    const parts = url.pathname.split('/').filter((s) => s);
    if (parts.length !== 2) {
      continue;
    }

    for await (const issue of iterateIssues(octokit, parts[0], parts[1])) {
      const count = issue.reactions.total_count;
      if (count) {
        console.log(`${count},${issue.html_url}`);
      }
    }
  }
}

await main();
