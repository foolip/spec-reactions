// Turn https://github.com/owner/repo/issues/123 into owner/repo#123.
export function pretty(url) {
  if (!url.startsWith('https://github.com/')) {
    return url;
  }
  const parts = url.substring(19).split('/');
  if (parts.length !== 4) {
    return url;
  }
  return `${parts[0]}/${parts[1]}#${parts[3]}`;
}
