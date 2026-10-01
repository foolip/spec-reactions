# spec-reactions

Script to count the number of reactions to issues in spec repos.

`build.js` fetches issues from GitHub into `issues.json` (needs `GITHUB_TOKEN`),
and a small SvelteKit app prerenders it to static HTML in `dist/`. The page is
fully readable without JS; filtering and sorting are enabled once it hydrates.

```sh
npm run fetch    # write issues.json
npm run dev      # local dev server
npm run build    # fetch + build dist/
```
