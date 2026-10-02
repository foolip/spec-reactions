// Turn https://github.com/owner/repo/issues/123 into owner/repo#123, and
// also return the owner/repo part on its own.
export function parseIssueURL(url) {
  const match = url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/[^/]+\/([^/]+)$/);
  if (!match) {
    return {repo: '', name: url};
  }
  return {repo: match[1], name: `${match[1]}#${match[2]}`};
}
