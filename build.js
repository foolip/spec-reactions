import fs from 'node:fs/promises';
import specs from 'browser-specs' assert { type: "json" };
import {Octokit} from '@octokit/rest';
import {throttling} from '@octokit/plugin-throttling';

// Minimum number of reactions to consider.
const MIN_REACTION_COUNT = 10;

// What to consider a recent reaction.
const RECENT_REACTION_DAYS = 90;

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
      onRateLimit: (retryAfter, options, octokit, retryCount) => {
        octokit.log.warn(`Rate limit hit for request ${options.method} ${options.url}`);

        if (retryCount < 3) {
          octokit.log.info(`Retrying after ${retryAfter} seconds`);
          return true;
        }
      },
      onSecondaryRateLimit: (retryAfter, options, octokit) => {
        octokit.log.warn(`Secondary rate limit hit for request ${options.method} ${options.url}`);
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
      }
    }
  }

  // Write JSON output.
  const json = JSON.stringify(issues, null, '  ') + '\n';
  await fs.writeFile('issues.json', json);
}

await main();
